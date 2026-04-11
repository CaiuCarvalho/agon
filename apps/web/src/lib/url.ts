const DEFAULT_API_BASE_URL = "https://agonimports.com";

function removeTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function normalizeApiBaseUrl(rawBaseUrl?: string) {
  const base = removeTrailingSlash(rawBaseUrl || DEFAULT_API_BASE_URL);
  return base.endsWith("/api") ? base.slice(0, -4) : base;
}

export function buildApiUrl(path: string, rawBaseUrl?: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base = normalizeApiBaseUrl(rawBaseUrl || process.env.NEXT_PUBLIC_API_URL);
  return `${base}/api${normalizedPath}`;
}

