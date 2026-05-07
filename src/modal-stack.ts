/** Central modal stack — single source of truth for whether any modal overlay is open. */

const stack: HTMLElement[] = [];

export function pushModal(overlay: HTMLElement): void {
  stack.push(overlay);
}

export function popModal(overlay: HTMLElement): void {
  const idx = stack.lastIndexOf(overlay);
  if (idx !== -1) stack.splice(idx, 1);
}

export function isModalOpen(): boolean {
  return stack.length > 0;
}
