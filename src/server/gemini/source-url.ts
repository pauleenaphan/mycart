import { isOfficialStoreUrl } from "~/server/gemini/official-website";
import {
  getOfficialCatalogSearchUrls,
  normalizeStoreSourceUrl,
} from "~/server/gemini/store-search";

const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/** fetch() drops URL hashes — restore them for client-routed store sites. */
function preserveUrlHash(originalUrl: string, resolvedUrl: string): string {
  try {
    const original = new URL(originalUrl);
    if (!original.hash) {
      return resolvedUrl;
    }

    const resolved = new URL(resolvedUrl);
    if (resolved.hash) {
      return resolvedUrl;
    }

    resolved.hash = original.hash;
    return resolved.toString();
  } catch {
    return resolvedUrl;
  }
}

function urlForRelevanceCheck(candidate: string, verifiedFinalUrl: string): string {
  if (candidate.includes("#/search")) {
    return candidate;
  }

  return verifiedFinalUrl;
}

type WebSource = {
  uri: string;
  title: string | null;
};

type GeminiCandidate = {
  groundingMetadata?: {
    groundingChunks?: Array<{
      web?: {
        uri?: string;
        title?: string;
      };
    }>;
  };
};

type GeminiResponse = {
  candidates?: GeminiCandidate[];
};

export function extractGroundingWebSources(
  response: GeminiResponse,
): WebSource[] {
  const sources: WebSource[] = [];

  for (const candidate of response.candidates ?? []) {
    for (const chunk of candidate.groundingMetadata?.groundingChunks ?? []) {
      if (chunk.web?.uri) {
        sources.push({
          uri: chunk.web.uri,
          title: chunk.web.title ?? null,
        });
      }
    }
  }

  return sources;
}

function tokenizeProductName(name: string): string[] {
  return name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);
}

function scoreProductUrl(url: string, productName: string): number {
  const normalizedUrl = url.toLowerCase();
  const tokens = tokenizeProductName(productName);
  let score = 0;

  for (const token of tokens) {
    if (normalizedUrl.includes(token)) {
      score += 2;
    }
  }

  if (
    normalizedUrl.includes("/product/") ||
    normalizedUrl.includes("catalogsearch") ||
    normalizedUrl.includes("/catalog") ||
    normalizedUrl.endsWith("/p") ||
    normalizedUrl.includes("/p?")
  ) {
    score += 4;
  }

  if (
    normalizedUrl.includes("/search") ||
    normalizedUrl.includes("keyword=") ||
    normalizedUrl.includes("#/search")
  ) {
    score += 2;
  }

  try {
    const parsed = new URL(url);
    const searchText = (parsed.search + parsed.hash).toLowerCase();
    for (const token of tokens) {
      if (searchText.includes(token)) {
        score += 4;
      }
    }
  } catch {
    // ignore invalid URLs
  }

  return score;
}

function isRelevantProductPage(
  url: string,
  productName: string,
  officialWebsite: string,
): boolean {
  if (url === officialWebsite) return false;
  return scoreProductUrl(url, productName) >= 4;
}

function isUselessRedirect(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return (
      host === "google.com" ||
      host.endsWith(".google.com") ||
      host === "vertexaisearch.cloud.google.com"
    );
  } catch {
    return true;
  }
}

export async function resolveRedirectUrl(url: string): Promise<string> {
  if (!url.startsWith("http")) {
    return url;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": BROWSER_USER_AGENT,
        Range: "bytes=0-0",
      },
    });

    clearTimeout(timeout);
    return preserveUrlHash(url, response.url);
  } catch {
    return url;
  }
}

export async function verifyUrlExists(url: string): Promise<{
  ok: boolean;
  finalUrl: string;
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": BROWSER_USER_AGENT,
        Range: "bytes=0-0",
      },
    });

    clearTimeout(timeout);

    return {
      ok: response.status >= 200 && response.status < 400,
      finalUrl: preserveUrlHash(url, response.url),
    };
  } catch {
    return { ok: false, finalUrl: url };
  }
}

export async function resolveVerifiedProductSourceUrl(options: {
  modelUrl: string | null | undefined;
  modelTitle: string | null | undefined;
  productName: string;
  officialWebsite: string;
  groundingSources: WebSource[];
}): Promise<{
  sourceUrl: string | null;
  sourceTitle: string | null;
  notesAppend: string | null;
  verifiedProductPage: boolean;
}> {
  const candidateUrls = new Set<string>();

  if (options.modelUrl) {
    candidateUrls.add(
      normalizeStoreSourceUrl(
        options.modelUrl,
        options.officialWebsite,
        options.productName,
      ) ?? options.modelUrl,
    );
  }

  const resolvedGrounding = await Promise.all(
    options.groundingSources.map(async (source) => ({
      ...source,
      resolvedUri: await resolveRedirectUrl(source.uri),
    })),
  );

  for (const source of resolvedGrounding) {
    if (!isUselessRedirect(source.resolvedUri)) {
      candidateUrls.add(source.resolvedUri);
    }
  }

  const catalogSearchUrls = getOfficialCatalogSearchUrls(
    options.officialWebsite,
    options.productName,
  );

  for (const catalogUrl of catalogSearchUrls) {
    candidateUrls.add(
      normalizeStoreSourceUrl(
        catalogUrl,
        options.officialWebsite,
        options.productName,
      ) ?? catalogUrl,
    );
  }

  candidateUrls.add(options.officialWebsite);

  const officialCandidates = [...candidateUrls]
    .filter((url) => isOfficialStoreUrl(url, options.officialWebsite))
    .sort(
      (a, b) =>
        scoreProductUrl(b, options.productName) -
        scoreProductUrl(a, options.productName),
    )
    .slice(0, 8);

  let rejectedModelUrl = false;

  for (const candidate of officialCandidates) {
    const normalizedCandidate =
      normalizeStoreSourceUrl(
        candidate,
        options.officialWebsite,
        options.productName,
      ) ?? candidate;

    const verified = await verifyUrlExists(normalizedCandidate);
    const displayUrl = preserveUrlHash(
      normalizedCandidate,
      verified.finalUrl,
    );
    const isOfficial = isOfficialStoreUrl(
      displayUrl,
      options.officialWebsite,
    );
    const relevant = isRelevantProductPage(
      urlForRelevanceCheck(normalizedCandidate, displayUrl),
      options.productName,
      options.officialWebsite,
    );

    if (verified.ok && isOfficial) {
      const isProductPage = isRelevantProductPage(
        urlForRelevanceCheck(normalizedCandidate, displayUrl),
        options.productName,
        options.officialWebsite,
      );

      if (
        options.modelUrl &&
        candidate === options.modelUrl &&
        !isProductPage
      ) {
        rejectedModelUrl = true;
        continue;
      }

      const matchedGrounding = resolvedGrounding.find(
        (source) =>
          source.resolvedUri === candidate || source.uri === candidate,
      );

      if (isProductPage) {
        const checkUrl = displayUrl.toLowerCase();
        const isCatalogSearch =
          checkUrl.includes("catalogsearch") ||
          checkUrl.includes("/search") ||
          checkUrl.includes("#/search") ||
          checkUrl.includes("keyword=");

        return {
          sourceUrl: displayUrl,
          sourceTitle:
            options.modelTitle ??
            matchedGrounding?.title ??
            (isCatalogSearch
              ? "Official catalog search"
              : "Official product page"),
          notesAppend: null,
          verifiedProductPage: true,
        };
      }

      if (normalizedCandidate === options.officialWebsite) {
        return {
          sourceUrl: displayUrl,
          sourceTitle: "Store website",
          notesAppend: rejectedModelUrl
            ? "Could not verify a direct product page link. Showing the store's official website instead."
            : "No verified product page found. Showing the store's official website instead.",
          verifiedProductPage: false,
        };
      }
    }

    if (
      !verified.ok &&
      isOfficialStoreUrl(normalizedCandidate, options.officialWebsite) &&
      relevant
    ) {
      const checkUrl = normalizedCandidate.toLowerCase();
      const isCatalogSearch =
        checkUrl.includes("catalogsearch") ||
        checkUrl.includes("/search") ||
        checkUrl.includes("#/search") ||
        checkUrl.includes("keyword=");

      return {
        sourceUrl: normalizedCandidate,
        sourceTitle: isCatalogSearch
          ? "Official catalog search"
          : "Official product page",
        notesAppend:
          "This store blocks automated page checks, but the link matches the official catalog.",
        verifiedProductPage: false,
      };
    }
  }

  const storePage = await verifyUrlExists(options.officialWebsite);
  if (
    storePage.ok &&
    isOfficialStoreUrl(storePage.finalUrl, options.officialWebsite)
  ) {
    return {
      sourceUrl: storePage.finalUrl,
      sourceTitle: "Store website",
      notesAppend: rejectedModelUrl
        ? "Could not verify a direct product page link. Showing the store's official website instead."
        : "No verified product page found. Showing the store's official website instead.",
      verifiedProductPage: false,
    };
  }

  if (options.modelUrl || rejectedModelUrl) {
    return {
      sourceUrl: null,
      sourceTitle: null,
      notesAppend:
        "The suggested product link could not be verified on the store's official website.",
      verifiedProductPage: false,
    };
  }

  return {
    sourceUrl: null,
    sourceTitle: null,
    notesAppend: null,
    verifiedProductPage: false,
  };
}
