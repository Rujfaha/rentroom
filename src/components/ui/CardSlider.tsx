"use client";

import { useMemo, useState, type ReactNode } from "react";
import { getLoopedIndex, getSliderVisibleItems, type SliderVisibleItem } from "@/components/ui/card-slider";

type SliderPosition = "previous" | "current" | "next";

interface RenderItemContext {
  index: number;
  isActive: boolean;
  position: SliderPosition;
}

interface CardSliderProps<T> {
  items: T[];
  renderItem: (item: T, context: RenderItemContext) => ReactNode;
  getItemKey: (item: T) => string;
  getItemLabel: (item: T) => string;
  className?: string;
  ariaLabel?: string;
}

function ArrowIcon({ direction }: { direction: "previous" | "next" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      {direction === "previous" ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
    </svg>
  );
}

function SliderSlot<T>({
  visibleItem,
  position,
  renderItem,
  onSelect,
}: {
  visibleItem: SliderVisibleItem<T> | null;
  position: SliderPosition;
  renderItem: (item: T, context: RenderItemContext) => ReactNode;
  onSelect: (index: number) => void;
}) {
  if (!visibleItem) {
    return <div className="hidden md:block md:basis-[22%]" aria-hidden="true" />;
  }

  const isActive = position === "current";
  const sizingClass = isActive
    ? "basis-full md:basis-[52%] z-20"
    : "hidden md:block md:basis-[22%] z-10";
  const visualClass = isActive
    ? "scale-100 opacity-100"
    : "scale-[0.86] opacity-60 hover:opacity-80";

  return (
    <div className={sizingClass}>
      <div
        onClick={function () {
          if (!isActive) onSelect(visibleItem.index);
        }}
        className={"w-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform " + visualClass + (isActive ? "" : " cursor-pointer")}
      >
        {renderItem(visibleItem.item, {
          index: visibleItem.index,
          isActive,
          position,
        })}
      </div>
    </div>
  );
}

export default function CardSlider<T>({
  items,
  renderItem,
  getItemKey,
  getItemLabel,
  className = "",
  ariaLabel = "Card slider",
}: CardSliderProps<T>) {
  const [activeIndex, setActiveIndex] = useState(0);
  const visibleItems = useMemo(() => getSliderVisibleItems(items, activeIndex), [activeIndex, items]);

  if (items.length === 0 || !visibleItems.current) return null;

  function moveBy(step: number) {
    setActiveIndex((current) => getLoopedIndex(current + step, items.length));
  }

  function selectIndex(index: number) {
    setActiveIndex(getLoopedIndex(index, items.length));
  }

  return (
    <div className={"relative " + className} aria-label={ariaLabel}>
      <div className="relative mx-auto flex min-h-[31rem] max-w-6xl items-center justify-center gap-3 overflow-hidden md:gap-4 lg:gap-6">
        <SliderSlot visibleItem={visibleItems.previous} position="previous" renderItem={renderItem} onSelect={selectIndex} />
        <SliderSlot visibleItem={visibleItems.current} position="current" renderItem={renderItem} onSelect={selectIndex} />
        <SliderSlot visibleItem={visibleItems.next} position="next" renderItem={renderItem} onSelect={selectIndex} />
      </div>

      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={function () { moveBy(-1); }}
            className="absolute left-0 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/12 text-white shadow-lg backdrop-blur-md transition-colors duration-300 hover:bg-white hover:text-forest-dark focus:outline-none focus:ring-2 focus:ring-gold md:-left-2 lg:left-4 cursor-pointer"
            aria-label="Previous card"
          >
            <ArrowIcon direction="previous" />
          </button>
          <button
            type="button"
            onClick={function () { moveBy(1); }}
            className="absolute right-0 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/12 text-white shadow-lg backdrop-blur-md transition-colors duration-300 hover:bg-white hover:text-forest-dark focus:outline-none focus:ring-2 focus:ring-gold md:-right-2 lg:right-4 cursor-pointer"
            aria-label="Next card"
          >
            <ArrowIcon direction="next" />
          </button>

          <div className="mt-7 flex items-center justify-center gap-2">
            {items.map(function (item, index) {
              const selected = index === visibleItems.current?.index;
              return (
                <button
                  key={getItemKey(item)}
                  type="button"
                  onClick={function () { selectIndex(index); }}
                  className={"h-2.5 rounded-full transition-all duration-300 cursor-pointer " + (selected ? "w-8 bg-gold" : "w-2.5 bg-white/28 hover:bg-white/55")}
                  aria-label={"Show " + getItemLabel(item)}
                  aria-current={selected ? "true" : undefined}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
