"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

interface GalleryModalProps {
  images: { url: string; alt: string }[];
  initialIndex?: number;
  onClose: () => void;
  roomName?: string;
}

export default function GalleryModal({
  images,
  initialIndex = 0,
  onClose,
  roomName,
}: GalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(
    function () {
      document.body.style.overflow = "hidden";
      return function () {
        document.body.style.overflow = "";
      };
    },
    []
  );

  const handleNext = useCallback(function () {
    setCurrentIndex(function (prev) {
      return prev === images.length - 1 ? 0 : prev + 1;
    });
  }, [images.length]);

  const handlePrevious = useCallback(function () {
    setCurrentIndex(function (prev) {
      return prev === 0 ? images.length - 1 : prev - 1;
    });
  }, [images.length]);

  useEffect(
    function () {
      function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "Escape") onClose();
        if (e.key === "ArrowLeft") handlePrevious();
        if (e.key === "ArrowRight") handleNext();
      }
      window.addEventListener("keydown", handleKeyDown);
      return function () {
        window.removeEventListener("keydown", handleKeyDown);
      };
    },
    [handleNext, handlePrevious, onClose]
  );

  if (images.length === 0) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={roomName ? "แกลเลอรี่ " + roomName : "แกลเลอรี่"}
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full h-full flex flex-col"
        onClick={function (e) {
          e.stopPropagation();
        }}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-black/50">
          <div className="text-white min-w-0">
            {roomName && <h3 className="text-base sm:text-lg font-medium truncate">{roomName}</h3>}
            <p className="text-sm text-white/90">
              {currentIndex + 1} / {images.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors cursor-pointer flex-shrink-0"
            aria-label="Close gallery"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 relative flex items-center justify-center px-4 py-6">
          <div className="relative w-full h-full max-w-6xl max-h-[calc(100vh-230px)]">
            <Image
              src={images[currentIndex].url}
              alt={images[currentIndex].alt || `${roomName || "Room"} - Image ${currentIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all hover:scale-110 cursor-pointer"
                aria-label="Previous image"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                onClick={handleNext}
                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all hover:scale-110 cursor-pointer"
                aria-label="Next image"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </>
          )}
        </div>

        {images.length > 1 && (
          <div className="px-4 sm:px-6 py-4 bg-black/50 flex justify-center">
            <div className="flex gap-2 justify-start sm:justify-center overflow-x-auto pb-2 max-w-7xl w-full">
              {images.map(function (image, index) {
                return (
                  <button
                    key={image.url + index}
                    onClick={function () {
                      setCurrentIndex(index);
                    }}
                    aria-label={"ไปยังรูปที่ " + String(index + 1)}
                    aria-current={currentIndex === index ? "true" : undefined}
                    className={
                      "relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden transition-all cursor-pointer " +
                      (currentIndex === index ? "ring-2 ring-white scale-105" : "opacity-60 hover:opacity-100")
                    }
                  >
                    <Image
                      src={image.url}
                      alt={image.alt || `Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
