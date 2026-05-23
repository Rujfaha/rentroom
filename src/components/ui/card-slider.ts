export interface SliderVisibleItem<T> {
  item: T;
  index: number;
}

export interface SliderVisibleItems<T> {
  previous: SliderVisibleItem<T> | null;
  current: SliderVisibleItem<T> | null;
  next: SliderVisibleItem<T> | null;
}

export function getLoopedIndex(index: number, totalItems: number): number {
  if (totalItems <= 0) return 0;
  return ((index % totalItems) + totalItems) % totalItems;
}

export function getSliderVisibleItems<T>(items: T[], activeIndex: number): SliderVisibleItems<T> {
  if (items.length === 0) {
    return {
      previous: null,
      current: null,
      next: null,
    };
  }

  const currentIndex = getLoopedIndex(activeIndex, items.length);
  const previousIndex = items.length > 2 ? getLoopedIndex(currentIndex - 1, items.length) : -1;
  const nextIndex = items.length > 1 ? getLoopedIndex(currentIndex + 1, items.length) : -1;

  return {
    previous: previousIndex >= 0 ? { item: items[previousIndex], index: previousIndex } : null,
    current: { item: items[currentIndex], index: currentIndex },
    next: nextIndex >= 0 ? { item: items[nextIndex], index: nextIndex } : null,
  };
}
