/** App shell: auth, data fetching, routing. */

import { validateToken, getTree, getRawContent, extractContentPaths, DEFAULT_HOST } from './github.ts';
import type { TreeEntry } from './github.ts';
import { getCachedTree, setCachedTree, getCachedContent, setCachedContent } from './cache.ts';
import { startRouter } from './router.ts';
import type { Route } from './router.ts';
import { parseContent } from './parser.ts';
import { transform } from './transformer.ts';
import { renderPage } from './renderer.ts';
import { loadFavicons } from './favicon.ts';
import { initSearch, buildEntry } from './search.ts';
import type { SearchEntry } from './search.ts';
import { initKeyboard } from './keyboard.ts';
import { showEditor } from './editor.ts';

const LS_TOKEN = 'notehub:token';
const LS_HOST = 'notehub:host';
const LS_OWNER = 'metabrowse:owner';
const LS_REPO = 'metabrowse:repo';

const app = document.getElementById('app')!;

let token = '';
let host = DEFAULT_HOST;
let owner = '';
let repo = '';
let tree: TreeEntry[] = [];
let contentPaths: string[] = [];
let searchIndex: SearchEntry[] = [];

export async function init(): Promise<void> {
  host = localStorage.getItem(LS_HOST) || DEFAULT_HOST;
  owner = localStorage.getItem(LS_OWNER) || '';
  repo = localStorage.getItem(LS_REPO) || '';

  const savedToken = localStorage.getItem(LS_TOKEN);
  if (savedToken && owner && repo) {
    try {
      await validateToken(host, savedToken);
      token = savedToken;
      await loadApp();
    } catch {
      showAuth();
    }
  } else {
    showAuth();
  }
}

function showAuth(error?: string): void {
  const savedHost = localStorage.getItem(LS_HOST) || DEFAULT_HOST;
  const savedOwner = localStorage.getItem(LS_OWNER) || '';
  const savedRepo = localStorage.getItem(LS_REPO) || '';

  app.innerHTML = `
    <div class="auth-screen">
      <h1>metabrowse</h1>
      <p>Authenticate to access your links.</p>
      ${error ? `<div class="error">${escapeHtml(error)}</div>` : ''}
      <form id="auth-form">
        <label>GitHub Host
          <input type="text" id="host" value="${escapeAttr(savedHost)}" required />
        </label>
        <label>Content Owner
          <input type="text" id="owner" value="${escapeAttr(savedOwner)}" placeholder="org-or-user" required />
        </label>
        <label>Content Repo
          <input type="text" id="repo" value="${escapeAttr(savedRepo)}" placeholder="bb-metabrowse-links" required />
        </label>
        <label>Personal Access Token
          <input type="password" id="pat" placeholder="ghp_..." required />
        </label>
        <button type="submit">Connect</button>
      </form>
    </div>
  `;

  document.getElementById('auth-form')!.addEventListener('submit', async (e) => {
    e.preventDefault();
    const hostInput = (document.getElementById('host') as HTMLInputElement).value.trim();
    const ownerInput = (document.getElementById('owner') as HTMLInputElement).value.trim();
    const repoInput = (document.getElementById('repo') as HTMLInputElement).value.trim();
    const pat = (document.getElementById('pat') as HTMLInputElement).value.trim();

    try {
      await validateToken(hostInput, pat);
      localStorage.setItem(LS_HOST, hostInput);
      localStorage.setItem(LS_OWNER, ownerInput);
      localStorage.setItem(LS_REPO, repoInput);
      localStorage.setItem(LS_TOKEN, pat);
      token = pat;
      host = hostInput;
      owner = ownerInput;
      repo = repoInput;
      await loadApp();
    } catch (err) {
      showAuth(`Authentication failed: ${err instanceof Error ? err.message : err}`);
    }
  });
}

async function loadApp(): Promise<void> {
  app.innerHTML = '<div class="loading">Loading...</div>';

  console.log(`[metabrowse] Config: host=${host} owner=${owner} repo=${repo}`);

  // Fetch tree (use cache as fallback)
  try {
    const entries = await getTree(host, token, owner, repo);
    tree = entries;
    setCachedTree(entries);
  } catch (err) {
    const cached = getCachedTree();
    if (cached) {
      tree = cached;
      console.warn('Using cached tree:', err);
    } else {
      app.innerHTML = `<div class="error">Failed to load content tree: ${escapeHtml(String(err))}</div>`;
      return;
    }
  }

  contentPaths = extractContentPaths(tree);
  console.log(`[metabrowse] Loaded tree: ${contentPaths.length} content pages`);

  // Start routing — fires immediately for current hash
  startRouter(handleRoute);

  // Build search index in background (fetch all pages)
  buildSearchIndex();
}

async function buildSearchIndex(): Promise<void> {
  console.log(`[metabrowse] Building search index for ${contentPaths.length} pages...`);
  const entries: SearchEntry[] = [];

  // Fetch all pages in parallel
  const results = await Promise.allSettled(
    contentPaths.map(async (dirPath) => {
      const contentPath = dirPath ? `text/${dirPath}/README.md` : 'text/README.md';
      let content = getCachedContent(contentPath);
      if (!content) {
        content = await getRawContent(host, token, owner, repo, contentPath);
        setCachedContent(contentPath, content);
      }
      return { dirPath, content };
    })
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      entries.push(buildEntry(result.value.dirPath, result.value.content, contentPaths));
    }
  }

  searchIndex = entries;
  console.log(`[metabrowse] Search index built: ${entries.length} pages indexed`);
}

async function handleRoute(route: Route): Promise<void> {
  if (route.kind === 'edit') {
    await showEditor(app, host, token, owner, repo, route.dirPath);
    return;
  }

  // Check if the path exists in the tree
  if (route.dirPath && !contentPaths.includes(route.dirPath)) {
    app.innerHTML = `<div class="error">Page not found: ${escapeHtml(route.dirPath)}</div>`;
    return;
  }

  // Show cached content immediately if available
  const cached = getCachedContent(route.contentPath);
  if (cached) {
    doRender(route, cached);
  } else {
    app.innerHTML = `<div class="loading">Loading ${escapeHtml(route.dirPath || 'home')}...</div>`;
  }

  // Fetch fresh content
  try {
    const content = await getRawContent(host, token, owner, repo, route.contentPath);
    setCachedContent(route.contentPath, content);
    if (content !== cached) {
      doRender(route, content);
    }
  } catch (err) {
    if (!cached) {
      app.innerHTML = `<div class="error">Failed to load: ${escapeHtml(String(err))}</div>`;
    } else {
      console.warn('Failed to refresh, using cache:', err);
    }
  }
}

function doRender(route: Route, content: string): void {
  const parsed = parseContent(content);
  const title = route.dirPath
    ? route.dirPath.split('/').pop()!.replace(/[-_]/g, ' ')
    : 'Home';
  const doc = transform(parsed, title);

  renderPage(app, doc, route, {
    contentPaths,
    owner,
    repo,
    host,
  });

  // Post-render setup
  loadFavicons(app);
  initSearch(app, () => searchIndex);
  initKeyboard(app);
}

function escapeHtml(s: string): string {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
