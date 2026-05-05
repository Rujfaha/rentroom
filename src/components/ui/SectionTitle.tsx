interface SectionTitleProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
  light?: boolean;
}

export default function SectionTitle({
  title,
  subtitle,
  centered = true,
  light = false,
}: SectionTitleProps) {
  return (
    <div className={`mb-12 md:mb-16 ${centered ? "text-center" : ""}`}>
      <h2
        className={`font-[family-name:var(--font-serif)] text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight ${
          light ? "text-white" : "text-forest-dark"
        }`}
      >
        {title}
      </h2>
      <div
        className={`mt-4 h-0.5 w-16 rounded-full ${
          centered ? "mx-auto" : ""
        } ${light ? "bg-gold" : "bg-gold"}`}
      />
      {subtitle && (
        <p
          className={`mt-4 max-w-2xl ${
            centered ? "mx-auto" : ""
          } text-base md:text-lg leading-relaxed ${
            light ? "text-stone-light/80" : "text-earth"
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
