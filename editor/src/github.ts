export const DEFAULT_HOST = 'bbgithub.dev.bloomberg.com';

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
  const res = await fetch(`${apiBase(host)}${path}`, {
    ...init,
    headers: { ...headers(token), ...init?.headers },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export interface GitHubUser {
  login: string;
}

export function validateToken(host: string, token: string): Promise<GitHubUser> {
  return apiFetch<GitHubUser>(host, token, '/user');
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

/** Decode base64-encoded content with proper UTF-8 support. */
function decodeBase64(b64: string): string {
  const binaryStr = atob(b64.replace(/\n/g, ''));
  const bytes = Uint8Array.from(binaryStr, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Encode a string to base64 with proper UTF-8 support. */
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
