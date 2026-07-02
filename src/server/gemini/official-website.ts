export function getHostname(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export function isOfficialStoreUrl(
  sourceUrl: string | null | undefined,
  officialWebsite: string | null | undefined,
): boolean {
  if (!sourceUrl || !officialWebsite) return false;

  const sourceHost = getHostname(sourceUrl);
  const officialHost = getHostname(officialWebsite);

  if (!sourceHost || !officialHost) return false;

  return (
    sourceHost === officialHost || sourceHost.endsWith(`.${officialHost}`)
  );
}
