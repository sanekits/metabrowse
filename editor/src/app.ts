import { validateToken, getFileContent, updateFileContent, DEFAULT_HOST } from './github';

const LS_TOKEN = 'notehub:token';
const LS_HOST = 'notehub:host';

// veditor base URL — override via VITE_VEDITOR_BASE for GHES or local dev.
const VEDITOR_BASE = import.meta.env.VITE_VEDITOR_BASE || 'https://stabledog.github.io/veditor.web';

// veditor API — populated by init() before use.
let veditor: typeof import('./veditor');

interface EditorParams {
  host: string;
  owner: string;
  repo: string;
  path: string;
}

let token = '';
let params: EditorParams | null = null;
let originalContent = '';
let fileSha = '';

const app = document.getElementById('app')!;

export async function init(): Promise<void> {
  // Load veditor CSS + JS from Pages CDN
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `${VEDITOR_BASE}/veditor.css`;
  document.head.appendChild(link);

  try {
    veditor = await import(/* @vite-ignore */ `${VEDITOR_BASE}/veditor.js`);
  } catch (err) {
    showError('Failed to load editor', `Could not load veditor from ${VEDITOR_BASE}/veditor.js: ${err instanceof Error ? err.message : err}`);
    return;
  }

  // Parse URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const host = urlParams.get('host') || localStorage.getItem(LS_HOST) || DEFAULT_HOST;
  const owner = urlParams.get('owner');
  const repo = urlParams.get('repo');
  const path = urlParams.get('path');

  if (!owner || !repo || !path) {
    showError('Missing URL parameters', 'The editor requires owner, repo, and path query parameters.');
    return;
  }

  params = { host, owner, repo, path };

  const savedToken = localStorage.getItem(LS_TOKEN);
  if (savedToken) {
    validateToken(host, savedToken)
      .then(() => {
        token = savedToken;
        loadAndEdit();
      })
      .catch(() => showAuth());
  } else {
    showAuth();
  }
}

function showAuth(error?: string): void {
  veditor.destroyEditor();
  const savedHost = params?.host || localStorage.getItem(LS_HOST) || DEFAULT_HOST;

  app.innerHTML = `
    <div class="auth-screen">
      <h1>metabrowse editor</h1>
      <p>Authenticate to edit content files.</p>
      ${error ? `<div class="error">${escapeHtml(error)}</div>` : ''}
      <form id="auth-form">
        <label>GitHub Host
          <input type="text" id="host" value="${escapeAttr(savedHost)}" required />
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
    const host = (document.getElementById('host') as HTMLInputElement).value.trim();
    const pat = (document.getElementById('pat') as HTMLInputElement).value.trim();

    try {
      await validateToken(host, pat);
      localStorage.setItem(LS_HOST, host);
      localStorage.setItem(LS_TOKEN, pat);
      token = pat;
      if (params) params.host = host;
      loadAndEdit();
    } catch (err) {
      showAuth(`Authentication failed: ${err instanceof Error ? err.message : err}`);
    }
  });
}

async function loadAndEdit(): Promise<void> {
  if (!params) return;

  app.innerHTML = `<div class="loading">Loading ${escapeHtml(params.path)}...</div>`;

  try {
    const file = await getFileContent(params.host, token, params.owner, params.repo, params.path);
    originalContent = file.content;
    fileSha = file.sha;
    renderEditor();
  } catch (err) {
    showError('Failed to load file', `${err instanceof Error ? err.message : err}`);
  }
}

function renderEditor(): void {
  if (!params) return;

  const filename = params.path;

  app.innerHTML = `
    <div class="editor-screen">
      <header>
        <span class="filename">${escapeHtml(filename)}</span>
        <span id="status-msg"></span>
      </header>
      <div id="editor-container"></div>
    </div>
  `;

  veditor.createEditor(document.getElementById('editor-container')!, originalContent, {
    onSave: handleSave,
    onQuit: handleQuit,
  }, {
    storagePrefix: 'metabrowse',
  });
}

async function handleSave(): Promise<void> {
  if (!params) return;

  const content = veditor.getEditorContent();

  if (content === originalContent) {
    showStatus('No changes');
    return;
  }

  const filename = params.path.split('/').pop() || params.path;
  const message = `Update ${filename} via metabrowse editor`;

  try {
    showStatus('Saving...');
    const newSha = await updateFileContent(
      params.host, token,
      params.owner, params.repo, params.path,
      content, fileSha, message,
    );
    originalContent = content;
    fileSha = newSha;
    showStatus('Saved');

    // Refresh the opener page to pick up changes
    try {
      window.opener?.location.reload();
    } catch {
      // Cross-origin or no opener — ignore
    }
  } catch (err) {
    showStatus(`Save failed: ${err instanceof Error ? err.message : err}`, true);
  }
}

function handleQuit(force: boolean): void {
  if (!force && veditor.isEditorDirty(originalContent)) {
    showConfirmBar('Unsaved changes. Close anyway?', () => closeTab());
    return;
  }
  closeTab();
}

function closeTab(): void {
  window.close();
  // If window.close() is blocked (tab not opened by script), show message
  setTimeout(() => {
    showStatus('You can close this tab.');
  }, 100);
}

function showConfirmBar(message: string, onConfirm: () => void): void {
  document.getElementById('confirm-bar')?.remove();

  const bar = document.createElement('div');
  bar.id = 'confirm-bar';
  bar.innerHTML = `
    <span>${escapeHtml(message)}</span>
    <span class="confirm-hint">[y]es / [n]o</span>
  `;

  const header = document.querySelector('.editor-screen header');
  if (!header) return;
  header.after(bar);

  const dismiss = () => { bar.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'y' || e.key === 'Enter') { dismiss(); onConfirm(); }
    else if (e.key === 'n' || e.key === 'Escape') { dismiss(); }
  };
  document.addEventListener('keydown', onKey);
}

function showStatus(msg: string, isError = false): void {
  const el = document.getElementById('status-msg');
  if (!el) return;
  el.textContent = msg;
  el.className = isError ? 'error' : 'success';
  if (!isError) {
    setTimeout(() => { if (el.textContent === msg) el.textContent = ''; }, 2000);
  }
}

function showError(title: string, detail: string): void {
  app.innerHTML = `
    <div class="error-screen">
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(detail)}</p>
    </div>
  `;
}

function escapeHtml(s: string): string {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
