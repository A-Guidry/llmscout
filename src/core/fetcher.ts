export const DEFAULT_UA =
  "Mozilla/5.0 (compatible; LLMScout/0.1; +https://github.com/A-Guidry/llmscout) AppleWebKit/537.36";

export class FetchError extends Error {
  constructor(
    message: string,
    public readonly kind: "bad-url" | "unreachable" | "timeout" | "http-error",
    public readonly status?: number,
  ) {
    super(message);
    this.name = "FetchError";
  }
}

export interface FetchedPage {
  url: string;
  finalUrl: string;
  html: string;
  httpStatus: number;
  durationMs: number;
  bytes: number;
  redirected: boolean;
  contentType: string;
}

export function normalizeUrl(input: string): string {
  let u = input.trim();
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  try {
    return new URL(u).toString();
  } catch {
    throw new FetchError(
      `"${input}" is not a valid URL. Try e.g. https://example.com/page`,
      "bad-url",
    );
  }
}

async function fetchWithTimeout(
  url: string,
  ua: string,
  timeoutMs: number,
): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "user-agent": ua,
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
      },
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new FetchError(
        `Timed out after ${timeoutMs}ms fetching ${url}`,
        "timeout",
      );
    }
    const msg = err instanceof Error ? err.message : String(err);
    throw new FetchError(`Could not reach ${url} (${msg})`, "unreachable");
  } finally {
    clearTimeout(t);
  }
}

export async function fetchPage(
  rawUrl: string,
  ua = DEFAULT_UA,
  timeoutMs = 15000,
): Promise<FetchedPage> {
  const url = normalizeUrl(rawUrl);
  const start = Date.now();
  const res = await fetchWithTimeout(url, ua, timeoutMs);
  const html = await res.text();
  const durationMs = Date.now() - start;
  if (res.status >= 400) {
    throw new FetchError(
      `${url} responded with HTTP ${res.status}`,
      "http-error",
      res.status,
    );
  }
  return {
    url,
    finalUrl: res.url || url,
    html,
    httpStatus: res.status,
    durationMs,
    bytes: Buffer.byteLength(html, "utf8"),
    redirected: res.redirected,
    contentType: res.headers.get("content-type") ?? "",
  };
}

/** Fetch a well-known file from the site root; null when absent/unreachable. Shared per run. */
export async function fetchRootFile(
  pageUrl: string,
  filename: "robots.txt" | "llms.txt",
  ua = DEFAULT_UA,
  timeoutMs = 8000,
): Promise<string | null> {
  try {
    const origin = new URL(pageUrl).origin;
    const res = await fetchWithTimeout(`${origin}/${filename}`, ua, timeoutMs);
    if (res.status !== 200) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (ct.includes("text/html")) return null; // soft-404 pages
    return await res.text();
  } catch {
    return null;
  }
}
