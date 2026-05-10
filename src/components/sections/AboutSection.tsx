"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import SectionTitle from "@/components/ui/SectionTitle";
import type { LocalAttraction } from "@/types/landing.types";

interface AboutSectionProps {
  hotelName: string;
  description: string;
  attractions: LocalAttraction[];
}

function AttractionCard({ attraction }: { attraction: LocalAttraction }) {
  const cardClasses = "group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col";
  const content = (
    <>
      <div className="relative h-48 overflow-hidden shrink-0">
        <Image
          src={attraction.imageUrl}
          alt={attraction.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <h4 className="font-semibold text-forest-dark text-lg flex items-center gap-2">
          {attraction.name}
          {attraction.mapUrl && (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          )}
        </h4>
        <p className="mt-1 text-sm text-earth leading-relaxed">
          {attraction.description}
        </p>
        <div className="mt-auto pt-4 flex items-center gap-1.5 text-xs text-gold font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>{String(attraction.distanceKm) + " km from resort"}</span>
        </div>
      </div>
    </>
  );

  if (attraction.mapUrl) {
    return (
      <a
        href={attraction.mapUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${cardClasses} block cursor-pointer`}
      >
        {content}
      </a>
    );
  }

  return (
    <div className={cardClasses}>
      {content}
    </div>
  );
}

export default function AboutSection({ hotelName, description, attractions }: AboutSectionProps) {
  const [showModal, setShowModal] = useState(false);

  useEffect(function () {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return function () {
      document.body.style.overflow = "";
    };
  }, [showModal]);

  const displayed = attractions.slice(0, 3);
  const remaining = attractions.slice(3);

  return (
    <section id="about" className="py-20 md:py-28 bg-cream px-4">
      <div className="max-w-7xl mx-auto">
        <SectionTitle
          title={"About " + hotelName}
          subtitle="A sanctuary nestled in the heart of the mountains"
        />

        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-earth leading-relaxed text-base md:text-lg">
            {description}
          </p>
        </div>

        {attractions.length > 0 && (
          <div>
            <h3 className="font-[family-name:var(--font-serif)] text-2xl md:text-3xl font-semibold text-forest-dark text-center mb-10">
              Nearby Attractions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {displayed.map(function (attraction) {
                return <AttractionCard key={attraction.id} attraction={attraction} />;
              })}
            </div>

            {remaining.length > 0 && (
              <div className="mt-10 text-center">
                <button
                  onClick={function () { setShowModal(true); }}
                  className="inline-flex items-center gap-2 px-6 py-3 border-2 border-forest-dark text-forest-dark font-medium rounded-full hover:bg-forest-dark hover:text-white transition-colors duration-300 cursor-pointer"
                >
                  <span>เพิ่มเติม</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="attractions-modal-title"
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto"
          onClick={function () { setShowModal(false); }}
        >
          <div
            className="relative w-full max-w-6xl mx-4 my-10"
            onClick={function (e) { e.stopPropagation(); }}
          >
            <button
              onClick={function () { setShowModal(false); }}
              className="absolute -top-4 -right-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-forest-dark hover:bg-forest-dark hover:text-white transition-colors cursor-pointer"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            <div className="bg-cream rounded-2xl p-6 md:p-10 shadow-2xl">
              <h2 id="attractions-modal-title" className="font-[family-name:var(--font-serif)] text-3xl md:text-4xl font-semibold text-forest-dark text-center mb-8">
                All Nearby Attractions
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {remaining.map(function (attraction) {
                  return <AttractionCard key={attraction.id} attraction={attraction} />;
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
