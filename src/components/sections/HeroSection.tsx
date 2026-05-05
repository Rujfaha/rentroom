"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import type { HeroSlide } from "@/types/landing.types";

interface HeroSectionProps {
  slides: HeroSlide[];
}

export default function HeroSection({ slides }: HeroSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goToSlide = useCallback(
    function (index: number) {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setCurrentSlide(index);
      setTimeout(function () {
        setIsTransitioning(false);
      }, 700);
    },
    [isTransitioning]
  );

  const nextSlide = useCallback(
    function () {
      goToSlide((currentSlide + 1) % slides.length);
    },
    [currentSlide, slides.length, goToSlide]
  );

  useEffect(
    function () {
      const timer = setInterval(nextSlide, 5000);
      return function () {
        clearInterval(timer);
      };
    },
    [nextSlide]
  );

  if (slides.length === 0) return null;

  const slide = slides[currentSlide];

  return (
    <section className="relative h-screen min-h-[600px] max-h-[900px] w-full overflow-hidden">
      {slides.map(function (s, i) {
        const opacityClass = i === currentSlide ? "opacity-100" : "opacity-0";
        return (
          <div
            key={s.id}
            className={
              "absolute inset-0 transition-opacity duration-700 ease-in-out " +
              opacityClass
            }
          >
            <Image
              src={s.imageUrl}
              alt={s.altText}
              fill
              className="object-cover"
              priority={i === 0}
              sizes="100vw"
            />
          </div>
        );
      })}

      <div className="absolute inset-0 bg-gradient-to-b from-forest-dark/60 via-forest-dark/30 to-forest-dark/70" />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center text-white">
        <div key={currentSlide} className="animate-[fadeInUp_0.8s_ease-out]">
          <h1 className="font-[family-name:var(--font-serif)] text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-wide">
            {slide.headline}
          </h1>
          <p className="mt-4 md:mt-6 text-base sm:text-lg md:text-xl lg:text-2xl font-light text-stone-light max-w-2xl mx-auto leading-relaxed">
            {slide.subheadline}
          </p>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-10">
        {slides.map(function (_, i) {
          const dotClass =
            i === currentSlide
              ? "bg-gold w-8"
              : "bg-white/50 hover:bg-white/80";
          return (
            <button
              key={i}
              onClick={function () {
                goToSlide(i);
              }}
              className={
                "w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer " +
                dotClass
              }
              aria-label={"Go to slide " + String(i + 1)}
            />
          );
        })}
      </div>
    </section>
  );
}
