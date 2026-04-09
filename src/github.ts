/** GitHub API client — merged from editor/src/github.ts + Trees API for SPA. */

export const DEFAULT_HOST = (import.meta.env.VITE_DEFAULT_HOST as string | undefined) ?? 'github.com';

function apiBase(host: string): string {
  if (host === 'github.com') return 'https://api.github.com';
  return `https://${host}/api/v3`;
}

function headers(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  };
}

async function apiFetch<T>(host: string, token: string, path: string, init?: RequestInit): Promise<T> {
  const url = `${apiBase(host)}${path}`;
  console.log(`[github] ${init?.method ?? 'GET'} ${url}`);
  const res = await fetch(url, {
    ...init,
    headers: { ...headers(token), ...init?.headers },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// --- Auth ---

export interface GitHubUser {
  login: string;
}

export function validateToken(host: string, token: string): Promise<GitHubUser> {
  return apiFetch<GitHubUser>(host, token, '/user');
}

// --- Trees API ---

export interface TreeEntry {
  path: string;
  type: string; // "blob" or "tree"
  sha: string;
}

interface TreeResponse {
  tree: Array<{ path: string; type: string; sha: string }>;
  truncated: boolean;
}

/** Fetch the full recursive tree for a branch. Returns all entries. */
export async function getTree(
  host: string, token: string,
  owner: string, repo: string, branch = 'main',
): Promise<TreeEntry[]> {
  const data = await apiFetch<TreeResponse>(
    host, token,
    `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
  );
  return data.tree;
}

/**
 * Extract content paths from a tree.
 * Finds all text/.../README.md paths and returns the directory paths
 * (e.g., "text/teach/CPP/README.md" → "teach/CPP").
 */
export function extractContentPaths(tree: TreeEntry[]): string[] {
  const paths: string[] = [];
  for (const entry of tree) {
    if (entry.type !== 'blob') continue;
    if (!entry.path.startsWith('text/')) continue;
    if (!entry.path.endsWith('/README.md') && entry.path !== 'text/README.md') continue;

    // "text/README.md" → "" (root)
    // "text/teach/README.md" → "teach"
    // "text/teach/CPP/README.md" → "teach/CPP"
    const dir = entry.path.slice('text/'.length).replace(/\/README\.md$/, '');
    paths.push(dir === 'README.md' ? '' : dir);
  }
  return paths;
}

// --- Contents API ---

interface ContentsResponse {
  content: string;
  sha: string;
  name: string;
  path: string;
  encoding: string;
}

interface UpdateResponse {
  content: { sha: string };
}

function decodeBase64(b64: string): string {
  const binaryStr = atob(b64.replace(/\n/g, ''));
  const bytes = Uint8Array.from(binaryStr, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binaryStr = '';
  for (const b of bytes) {
    binaryStr += String.fromCharCode(b);
  }
  return btoa(binaryStr);
}

export interface FileContent {
  content: string;
  sha: string;
}

/** Fetch a file's content and SHA (needed for editing). */
export async function getFileContent(
  host: string, token: string,
  owner: string, repo: string, path: string,
): Promise<FileContent> {
  const data = await apiFetch<ContentsResponse>(
    host, token,
    `/repos/${owner}/${repo}/contents/${path}`,
  );
  if (!data.content) {
    throw new Error('File too large for Contents API. Only files under 1MB are supported.');
  }
  return {
    content: decodeBase64(data.content),
    sha: data.sha,
  };
}

/** Fetch a file's raw content as a string (read-only, no SHA tracking). */
export async function getRawContent(
  host: string, token: string,
  owner: string, repo: string, path: string,
): Promise<string> {
  const file = await getFileContent(host, token, owner, repo, path);
  return file.content;
}

/** Update a file's content. Returns the new SHA. */
export async function updateFileContent(
  host: string, token: string,
  owner: string, repo: string, path: string,
  content: string, sha: string, message: string,
): Promise<string> {
  const res = await fetch(`${apiBase(host)}/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify({
      message,
      content: encodeBase64(content),
      sha,
    }),
  });
  if (res.status === 409) {
    throw new Error('File was modified by someone else. Reload to get the latest version.');
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${res.status}: ${text}`);
  }
  const data = await res.json() as UpdateResponse;
  return data.content.sha;
}
