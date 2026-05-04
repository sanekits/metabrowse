/** Vim-style j/k link navigation. */

import { isInputFocused } from './lifecycle.ts';

const SELECTED_CLASS = 'link-selected';

export function initLinkNav(container: HTMLElement, signal: AbortSignal): void {
  let currentIndex = -1;

  function getVisibleLinks(): HTMLLIElement[] {
    const all = container.querySelectorAll<HTMLLIElement>(
      '.links > li, .group-links > li, .sublevel-links > li',
    );
    const visible: HTMLLIElement[] = [];
    for (const li of all) {
      if (li.style.display === 'none') continue;
      if (!li.querySelector('a')) continue;
      let hidden = false;
      let el: HTMLElement | null = li.parentElement;
      while (el && el !== container) {
        if (el.style.display === 'none') { hidden = true; break; }
        el = el.parentElement;
      }
      if (!hidden) visible.push(li);
    }
    return visible;
  }

  function clearSelection(): void {
    container.querySelector(`.${SELECTED_CLASS}`)?.classList.remove(SELECTED_CLASS);
    currentIndex = -1;
  }

  function selectLink(links: HTMLLIElement[], index: number): void {
    container.querySelector(`.${SELECTED_CLASS}`)?.classList.remove(SELECTED_CLASS);
    currentIndex = index;
    const li = links[index];
    li.classList.add(SELECTED_CLASS);
    li.scrollIntoView({ block: 'nearest' });
  }

  function handler(e: KeyboardEvent): void {
    if (isInputFocused()) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const down = e.key === 'j' || e.key === 'ArrowDown';
    const up = e.key === 'k' || e.key === 'ArrowUp';

    if (down || up) {
      e.preventDefault();
      const links = getVisibleLinks();
      if (links.length === 0) return;

      const selectedEl = container.querySelector<HTMLLIElement>(`.${SELECTED_CLASS}`);
      if (selectedEl) {
        currentIndex = links.indexOf(selectedEl);
        if (currentIndex === -1) currentIndex = 0;
      }

      if (currentIndex === -1) {
        selectLink(links, down ? 0 : links.length - 1);
      } else {
        const next = down
          ? Math.min(currentIndex + 1, links.length - 1)
          : Math.max(currentIndex - 1, 0);
        selectLink(links, next);
      }
      return;
    }

    if (e.key === 'Enter') {
      const selected = container.querySelector<HTMLLIElement>(`.${SELECTED_CLASS}`);
      if (!selected) return;
      const a = selected.querySelector<HTMLAnchorElement>('a');
      if (a) { e.preventDefault(); a.click(); }
      return;
    }

    if (e.key === 'Escape') {
      if (currentIndex !== -1) {
        e.preventDefault();
        clearSelection();
      }
    }
  }

  document.addEventListener('keydown', handler, { signal });
}
