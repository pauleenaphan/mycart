export function getHostname(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export function getStoreRootUrl(officialWebsite: string): string | null {
  try {
    const url = new URL(officialWebsite);
    return url.origin;
  } catch {
    return null;
  }
}

export function getOfficialCatalogSearchUrls(
  officialWebsite: string,
  productName: string,
): string[] {
  const query = productName.trim();
  if (!query) return [];

  const encoded = encodeURIComponent(query);
  const root = getStoreRootUrl(officialWebsite);
  if (!root) return [];

  const host = getHostname(officialWebsite) ?? "";

  const urls = new Set<string>();

  if (host.includes("costco.com")) {
    urls.add(
      `https://www.costco.com/CatalogSearch?dept=All&keyword=${encoded}`,
    );
  }

  if (host.includes("hmart.com")) {
    urls.add(`https://www.hmart.com/search?query=${encoded}`);
  }

  if (host.includes("centralmarket.com")) {
    urls.add(`https://www.centralmarket.com/search?q=${encoded}`);
  }

  if (host.includes("traderjoes.com")) {
    urls.add(`https://www.traderjoes.com/home/search?q=${encoded}`);
  }

  if (host.includes("wholefoodsmarket.com")) {
    urls.add(`https://www.wholefoodsmarket.com/search?text=${encoded}`);
  }

  urls.add(`${root}/search?q=${encoded}`);

  return [...urls];
}

export function getSuggestedSearchQueries(
  storeName: string,
  officialWebsite: string,
  productName: string,
): string[] {
  const domain = getHostname(officialWebsite);
  if (!domain) return [];

  const product = productName.trim();
  const queries = [
    `site:${domain} ${product}`,
    `site:${domain} ${product} price`,
    `site:${domain} "${product}"`,
    `${product} ${storeName} site:${domain}`,
  ];

  if (domain.includes("costco.com")) {
    queries.unshift(`site:costco.com ${product} gallon`);
    queries.unshift(`site:costco.com CatalogSearch ${product}`);
  }

  if (domain.includes("hmart.com")) {
    queries.unshift(`site:hmart.com ${product}`);
  }

  if (domain.includes("centralmarket.com")) {
    queries.unshift(`site:centralmarket.com ${product}`);
  }

  return [...new Set(queries)];
}
