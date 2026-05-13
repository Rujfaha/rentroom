"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import type { NavLink } from "@/types/landing.types";

interface NavbarProps {
  hotelName: string;
  navLinks: NavLink[];
}

export default function Navbar({ hotelName, navLinks }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(function () {
    function handleScroll() {
      setIsScrolled(window.scrollY > 50);
    }
    window.addEventListener("scroll", handleScroll);
    return function () {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const navBg = isScrolled
    ? "bg-white/95 backdrop-blur-md shadow-lg"
    : "bg-transparent";

  const textColor = isScrolled ? "text-forest-dark" : "text-white";

  return (
    <nav className={"fixed top-0 left-0 right-0 z-50 transition-all duration-300 " + navBg}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className={"font-[family-name:var(--font-serif)] text-2xl font-bold tracking-wider cursor-pointer " + textColor}>
            {hotelName}
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(function (link) {
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={"text-sm font-medium tracking-wide hover:text-gold transition-colors cursor-pointer " + textColor}
                >
                  {link.label}
                </a>
              );
            })}
            <Link href="/check-booking" className={"text-sm font-medium tracking-wide hover:text-gold transition-colors cursor-pointer " + textColor}>
              Check Booking
            </Link>
            <Button href="/booking" size="sm" loadingLabel="กำลังโหลด...">
              Book Now
            </Button>
          </div>

          <button
            onClick={function () { setIsMobileOpen(!isMobileOpen); }}
            className={"md:hidden cursor-pointer " + textColor}
            aria-label="Toggle menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isMobileOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M3 12h18M3 6h18M3 18h18" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {isMobileOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-stone-light">
          <div className="px-4 py-6 space-y-4">
            {navLinks.map(function (link) {
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={function () { setIsMobileOpen(false); }}
                  className="block text-forest-dark text-base font-medium hover:text-gold transition-colors cursor-pointer"
                >
                  {link.label}
                </a>
              );
            })}
            <Link href="/check-booking" onClick={function () { setIsMobileOpen(false); }} className="block text-forest-dark text-base font-medium hover:text-gold transition-colors cursor-pointer">
              Check Booking
            </Link>
            <Button href="/booking" size="sm" className="w-full" loadingLabel="กำลังโหลด...">
              Book Now
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
