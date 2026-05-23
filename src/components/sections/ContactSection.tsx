import SectionTitle from "@/components/ui/SectionTitle";
import type { ContactInfo } from "@/types/landing.types";

interface ContactSectionProps {
  contacts: ContactInfo[];
  address: string;
  mapUrl?: string;
}

function getContactHref(contact: ContactInfo): string {
  switch (contact.type) {
    case "phone":
      return "tel:" + contact.value.replace(/\s/g, "");
    case "email":
      return "mailto:" + contact.value;
    case "line":
      return contact.value.startsWith("http") ? contact.value : "https://line.me/ti/p/" + contact.value;
    case "facebook":
    case "instagram":
    case "website":
      return contact.value.startsWith("http") ? contact.value : "https://" + contact.value;
    default:
      return contact.value.startsWith("http") ? contact.value : "#";
  }
}

function ContactIcon({ type }: { type: ContactInfo["type"] }) {
  const icons: Record<string, React.ReactNode> = {
    phone: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
    email: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
    facebook: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
    line: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5C21 7.36 16.97 4 12 4S3 7.36 3 11.5c0 3.69 3.27 6.79 7.69 7.38.3.06.71.2.81.45.09.23.06.58.03.81l-.13.79c-.04.23-.18.9.79.49s5.22-3.08 7.12-5.27A6.6 6.6 0 0 0 21 11.5z" />
      </svg>
    ),
    instagram: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    ),
    website: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  };
  return (
    <div className="w-10 h-10 bg-cream rounded-full flex items-center justify-center flex-shrink-0 text-gold">
      {icons[type] ?? (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
        </svg>
      )}
    </div>
  );
}

export default function ContactSection({ contacts, address, mapUrl }: ContactSectionProps) {
  return (
    <section id="contact" className="py-20 md:py-28 bg-stone-light/30 px-4">
      <div className="max-w-4xl mx-auto">
        <SectionTitle title="Contact Us" subtitle="We are here to make your stay unforgettable" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h3 className="font-[family-name:var(--font-serif)] text-2xl font-semibold text-forest-dark mb-6">
              Get in Touch
            </h3>
            <div className="space-y-4">
              {contacts.map(function (c) {
                const href = getContactHref(c);
                const isExternal = href.startsWith("http");
                return (
                  <a
                    key={c.id}
                    href={href}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                    className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm hover:shadow-md hover:border-gold/40 border border-transparent transition-all duration-200 group"
                  >
                    <ContactIcon type={c.type} />
                    <div className="min-w-0">
                      <p className="text-xs text-earth uppercase tracking-wider font-medium">{c.label}</p>
                      <p className="text-forest-dark font-medium truncate group-hover:text-gold transition-colors">{c.value}</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto flex-shrink-0 text-stone opacity-0 group-hover:opacity-100 transition-opacity">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </a>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="font-[family-name:var(--font-serif)] text-2xl font-semibold text-forest-dark mb-6">
              Location
            </h3>
            <div className="bg-white rounded-xl p-6 shadow-md">
              <p className="text-earth leading-relaxed">{address}</p>
              <div className="mt-4 w-full h-48 bg-stone-light rounded-lg overflow-hidden">
                {mapUrl ? (
                  <iframe
                    src={mapUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Google Maps"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-earth-light text-sm">Map placeholder</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
