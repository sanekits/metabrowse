/** Keyboard shortcuts. Must be re-initialized after each page render. */

let cleanup: (() => void) | null = null;

function isInputFocused(): boolean {
  const tag = document.activeElement?.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

/** Initialize keyboard shortcuts. Call after each render. */
export function initKeyboard(container: HTMLElement): void {
  // Clean up previous listeners
  if (cleanup) cleanup();

  const sections = container.querySelectorAll<HTMLDetailsElement>('.section');
  let savedStates: boolean[] = [];
  let allCollapsed = false;

  function handler(e: KeyboardEvent): void {
    // "/" — local search, focus input
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (isInputFocused()) return;
      e.preventDefault();
      const checkbox = document.getElementById('global-mode-checkbox') as HTMLInputElement | null;
      const input = document.getElementById('unified-search') as HTMLInputElement | null;
      if (checkbox) checkbox.checked = false;
      if (checkbox) checkbox.dispatchEvent(new Event('change'));
      if (input) { input.focus(); input.select(); }
    }

    // Ctrl+K / Cmd+K — toggle global mode
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const checkbox = document.getElementById('global-mode-checkbox') as HTMLInputElement | null;
      const input = document.getElementById('unified-search') as HTMLInputElement | null;
      if (checkbox) { checkbox.checked = !checkbox.checked; checkbox.dispatchEvent(new Event('change')); }
      if (input) { input.focus(); input.select(); }
    }

    // "e" — open edit link
    if (e.key === 'e' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (isInputFocused()) return;
      const editLink = container.querySelector<HTMLAnchorElement>('.edit-link');
      if (editLink) { e.preventDefault(); editLink.click(); }
    }

    // "r" — reload current page
    if (e.key === 'r' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (isInputFocused()) return;
      e.preventDefault();
      location.reload();
    }

    // "c" — collapse/restore all sections
    if (e.key === 'c' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (isInputFocused()) return;
      if (sections.length === 0) return;
      e.preventDefault();
      if (!allCollapsed) {
        savedStates = Array.from(sections, s => s.open);
        sections.forEach(s => { s.open = false; });
        allCollapsed = true;
      } else {
        sections.forEach((s, i) => { s.open = i < savedStates.length ? savedStates[i] : true; });
        allCollapsed = false;
      }
    }
  }

  document.addEventListener('keydown', handler);
  cleanup = () => { document.removeEventListener('keydown', handler); };
}
