/** Favicon loading with localStorage cache and DuckDuckGo fallback. */

const CACHE_PREFIX = 'metabrowse-fav-';
const FAIL_RETRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const PATHS_TO_TRY = ['/favicon.ico', '/favicon.png', '/favicon.svg'];

function getCachedPath(domain: string): string | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + domain);
    if (!raw) return null;
    const data = JSON.parse(raw) as { path?: string; failed?: boolean; ts: number };
    if (data.failed) {
      if (Date.now() - data.ts > FAIL_RETRY_MS) {
        localStorage.removeItem(CACHE_PREFIX + domain);
        return null;
      }
      return 'FAILED';
    }
    return data.path ?? null;
  } catch {
    return null;
  }
}

function cachePath(domain: string, path: string): void {
  try {
    localStorage.setItem(CACHE_PREFIX + domain,
      JSON.stringify({ path, ts: Date.now() }));
  } catch { /* quota exceeded — ignore */ }
}

function markFailed(domain: string): void {
  try {
    localStorage.setItem(CACHE_PREFIX + domain,
      JSON.stringify({ failed: true, ts: Date.now() }));
  } catch { /* ignore */ }
}

function tryDuckDuckGo(img: HTMLImageElement, domain: string): void {
  const ddgUrl = 'https://icons.duckduckgo.com/ip3/' + domain + '.ico';
  img.onerror = () => {
    img.style.display = 'none';
    markFailed(domain);
  };
  img.onload = () => {
    cachePath(domain, 'ddg');
  };
  img.src = ddgUrl;
}

function tryPaths(img: HTMLImageElement, origin: string, domain: string, index: number): void {
  if (index >= PATHS_TO_TRY.length) {
    tryDuckDuckGo(img, domain);
    return;
  }
  const path = PATHS_TO_TRY[index];
  img.onerror = () => {
    tryPaths(img, origin, domain, index + 1);
  };
  img.onload = () => {
    cachePath(domain, path);
  };
  img.src = origin + path;
}

/** Load favicons for all .link-favicon elements in the container. */
export function loadFavicons(container: HTMLElement): void {
  const images = container.querySelectorAll<HTMLImageElement>('.link-favicon[data-url-hash]');

  for (const img of images) {
    const linkUrl = img.getAttribute('data-link-url');
    if (!linkUrl) continue;

    let origin: string;
    let domain: string;
    try {
      const u = new URL(linkUrl);
      origin = u.origin;
      domain = u.hostname;
    } catch {
      img.style.display = 'none';
      continue;
    }

    const cached = getCachedPath(domain);
    if (cached === 'FAILED') {
      img.style.display = 'none';
      continue;
    }
    if (cached) {
      img.onerror = () => { img.style.display = 'none'; };
      img.src = (cached === 'ddg')
        ? 'https://icons.duckduckgo.com/ip3/' + domain + '.ico'
        : origin + cached;
      continue;
    }

    tryPaths(img, origin, domain, 0);
  }
}
