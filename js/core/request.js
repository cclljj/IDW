export async function fetchJsonWithFallback(urls, options = {}) {
  const warn = options.warn || (() => {});
  const candidates = Array.isArray(urls) ? urls : [urls];
  let lastError = null;

  for (const url of candidates) {
    try {
      const response = await fetch(url, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return {
        url,
        data,
        lastModified: response.headers.get("Last-Modified")
      };
    } catch (error) {
      lastError = error;
      warn(`[fetch] ${url} failed: ${error.message}`);
    }
  }

  throw lastError || new Error("No available source");
}
