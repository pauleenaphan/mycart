import { isOfficialStoreUrl } from "~/server/gemini/official-website";
import { getOfficialCatalogSearchUrls } from "~/server/gemini/store-search";

const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

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
    normalizedUrl.includes("/catalog")
  ) {
    score += 4;
  }

  if (normalizedUrl.includes("/search") || normalizedUrl.includes("keyword=")) {
    score += 2;
  }

  try {
    const parsed = new URL(url);
    const searchText = parsed.search.toLowerCase();
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
    return response.url;
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
      finalUrl: response.url,
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
    candidateUrls.add(options.modelUrl);
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
    candidateUrls.add(catalogUrl);
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
    const verified = await verifyUrlExists(candidate);
    const isOfficial = isOfficialStoreUrl(
      verified.finalUrl,
      options.officialWebsite,
    );
    const relevant = isRelevantProductPage(
      verified.ok ? verified.finalUrl : candidate,
      options.productName,
      options.officialWebsite,
    );

    if (verified.ok && isOfficial) {
      const isProductPage =
        isRelevantProductPage(
          verified.finalUrl,
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
        const isCatalogSearch =
          verified.finalUrl.toLowerCase().includes("catalogsearch") ||
          verified.finalUrl.toLowerCase().includes("/search") ||
          verified.finalUrl.toLowerCase().includes("keyword=");

        return {
          sourceUrl: verified.finalUrl,
          sourceTitle:
            options.modelTitle ??
            matchedGrounding?.title ??
            (isCatalogSearch
              ? "Official catalog search"
              : "Official product page"),
          notesAppend: null,
          verifiedProductPage: !isCatalogSearch,
        };
      }

      if (candidate === options.officialWebsite) {
        return {
          sourceUrl: verified.finalUrl,
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
      isOfficialStoreUrl(candidate, options.officialWebsite) &&
      relevant
    ) {
      const isCatalogSearch =
        candidate.toLowerCase().includes("catalogsearch") ||
        candidate.toLowerCase().includes("/search") ||
        candidate.toLowerCase().includes("keyword=");

      return {
        sourceUrl: candidate,
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
