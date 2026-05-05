import SectionTitle from "@/components/ui/SectionTitle";
import type { ContactInfo } from "@/types/landing.types";

interface ContactSectionProps {
  contacts: ContactInfo[];
  address: string;
}

export default function ContactSection({ contacts, address }: ContactSectionProps) {
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
                return (
                  <div key={c.id} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm">
                    <div className="w-10 h-10 bg-cream rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-gold text-sm font-bold uppercase">{c.type.slice(0, 2)}</span>
                    </div>
                    <div>
                      <p className="text-xs text-earth uppercase tracking-wider font-medium">{c.label}</p>
                      <p className="text-forest-dark font-medium">{c.value}</p>
                    </div>
                  </div>
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
              <div className="mt-4 w-full h-48 bg-stone-light rounded-lg flex items-center justify-center">
                <span className="text-earth-light text-sm">Map placeholder</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
