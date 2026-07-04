export function captureListItemTops(): Map<string, number> {
  const map = new Map<string, number>();

  for (const el of document.querySelectorAll<HTMLElement>("[data-list-item-id]")) {
    const id = el.dataset.listItemId;
    if (!id) continue;

    const list = el.closest("ul");
    if (!list) continue;

    map.set(id, el.getBoundingClientRect().top - list.getBoundingClientRect().top);
  }

  return map;
}

export function playListFlip(
  prev: Map<string, number>,
  itemIds: string[],
  skipId?: string | null,
) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  for (const id of itemIds) {
    if (id === skipId) continue;

    const el = document.querySelector<HTMLElement>(`[data-list-item-id="${id}"]`);
    if (!el) continue;

    const list = el.closest("ul");
    if (!list) continue;

    const top = el.getBoundingClientRect().top - list.getBoundingClientRect().top;
    const prevTop = prev.get(id);
    if (prevTop === undefined) continue;

    const delta = prevTop - top;
    if (Math.abs(delta) < 4) continue;

    el.getAnimations().forEach((animation) => animation.cancel());
    el.animate(
      [
        { transform: `translate3d(0, ${delta}px, 0)` },
        { transform: "translate3d(0, 0, 0)" },
      ],
      { duration: 300, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );
  }
}
