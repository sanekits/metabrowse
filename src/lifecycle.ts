/** Navigation lifecycle: one AbortSignal per navigation cycle. */

let navAbort: AbortController | null = null;

/** Start a new navigation cycle; aborts the previous one's handlers. */
export function startNavigation(): AbortSignal {
  navAbort?.abort();
  navAbort = new AbortController();
  return navAbort.signal;
}

/** True when the focused element accepts text input (inputs, textareas, contentEditable). */
export function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}
