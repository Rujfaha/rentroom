import { describe, expect, it } from "vitest";
import { getLoopedIndex, getSliderVisibleItems } from "../card-slider";

describe("card slider helpers", () => {
  const items = ["first", "second", "third", "fourth"];

  it("returns previous, current, and next items around the active index", () => {
    expect(getSliderVisibleItems(items, 1)).toEqual({
      previous: { item: "first", index: 0 },
      current: { item: "second", index: 1 },
      next: { item: "third", index: 2 },
    });
  });

  it("wraps previous and next items at the edges", () => {
    expect(getSliderVisibleItems(items, 0)).toEqual({
      previous: { item: "fourth", index: 3 },
      current: { item: "first", index: 0 },
      next: { item: "second", index: 1 },
    });

    expect(getSliderVisibleItems(items, 3)).toEqual({
      previous: { item: "third", index: 2 },
      current: { item: "fourth", index: 3 },
      next: { item: "first", index: 0 },
    });
  });

  it("normalizes out-of-range indexes", () => {
    expect(getLoopedIndex(-1, items.length)).toBe(3);
    expect(getLoopedIndex(4, items.length)).toBe(0);
    expect(getLoopedIndex(6, items.length)).toBe(2);
  });

  it("does not duplicate side items when there are fewer than three items", () => {
    expect(getSliderVisibleItems(["only"], 0)).toEqual({
      previous: null,
      current: { item: "only", index: 0 },
      next: null,
    });

    expect(getSliderVisibleItems(["first", "second"], 0)).toEqual({
      previous: null,
      current: { item: "first", index: 0 },
      next: { item: "second", index: 1 },
    });
  });
});
