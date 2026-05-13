import Link from "next/link";
import LoadingLink from "@/components/ui/LoadingLink";
import type { NavLink, FooterConfig } from "@/types/landing.types";

interface FooterProps {
  hotelName: string;
  navLinks: NavLink[];
  config: FooterConfig;
}

export default function Footer({ hotelName, navLinks, config }: FooterProps) {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-forest-dark text-stone-light/70 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Link href="/" className="font-[family-name:var(--font-serif)] text-2xl font-bold text-white tracking-wider cursor-pointer">
              {hotelName}
            </Link>
            <p className="mt-3 text-sm leading-relaxed max-w-xs">
              {config.description}
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">{config.quickLinksTitle}</h4>
            <div className="space-y-2">
              {navLinks.map(function (link) {
                return (
                  <a key={link.href} href={link.href} className="block text-sm hover:text-gold transition-colors cursor-pointer">
                    {link.label}
                  </a>
                );
              })}
              <Link href="/check-booking" className="block text-sm hover:text-gold transition-colors cursor-pointer">Check Booking</Link>
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">{config.bookCtaTitle}</h4>
            <p className="text-sm leading-relaxed">
              {config.bookCtaText}
            </p>
            <LoadingLink href="/booking" className="inline-flex items-center justify-center gap-2 mt-4 bg-gold text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-gold-dark transition-colors cursor-pointer" loadingLabel="กำลังโหลด...">
              {config.bookCtaButton}
            </LoadingLink>
          </div>
        </div>
        <div className="mt-10 pt-8 border-t border-white/10 text-center text-xs">
          <p>{"Copyright " + String(year) + " " + config.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
