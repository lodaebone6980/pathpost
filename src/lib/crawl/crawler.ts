const USER_AGENT = "PathPost-Bot/1.0 (Medical Blog Research; +https://pathpost.app)";
const TIMEOUT = 10000;
const MAX_REDIRECTS = 3;

export async function fetchPage(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Check redirect count via response.redirected
    if (response.redirected) {
      const finalUrl = response.url;
      const redirectCount = finalUrl !== url ? 1 : 0;
      if (redirectCount > MAX_REDIRECTS) {
        throw new Error("Too many redirects");
      }
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      throw new Error(`Unsupported content type: ${contentType}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}
