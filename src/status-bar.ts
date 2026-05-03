import { el } from './dom.ts';
import { APP_VERSION } from './version.ts';

type StatusType = 'info' | 'error' | 'success';

let messageEl: HTMLElement | null = null;
let dismissTimer: ReturnType<typeof setTimeout> | null = null;
let veditorVersion: string | null = null;

export function createStatusBar(): HTMLElement {
  const msg = el('span', { class: 'status-message' });
  const ver = el('span', { class: 'status-version' },
    veditorVersion ? `v${APP_VERSION} · ve${veditorVersion}` : `v${APP_VERSION}`);

  messageEl = msg;

  const bar = el('footer', { class: 'status-bar' });
  bar.appendChild(msg);
  bar.appendChild(ver);
  return bar;
}

export function showStatus(message: string, type: StatusType = 'info', duration?: number): void {
  if (!messageEl) return;
  if (dismissTimer) {
    clearTimeout(dismissTimer);
    dismissTimer = null;
  }

  messageEl.textContent = message;
  messageEl.className = 'status-message';
  if (type === 'error') messageEl.classList.add('status-error');
  else if (type === 'success') messageEl.classList.add('status-success');

  const ms = duration ?? (type === 'error' ? undefined : 3000);
  if (ms != null) {
    dismissTimer = setTimeout(() => {
      if (messageEl?.textContent === message) {
        messageEl.textContent = '';
        messageEl.className = 'status-message';
      }
      dismissTimer = null;
    }, ms);
  }
}

export function clearStatus(): void {
  if (!messageEl) return;
  if (dismissTimer) {
    clearTimeout(dismissTimer);
    dismissTimer = null;
  }
  messageEl.textContent = '';
  messageEl.className = 'status-message';
}

export function setVeditorVersion(version: string): void {
  veditorVersion = version;
}
