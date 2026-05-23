import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  color?: "indigo" | "emerald" | "amber" | "rose" | "blue";
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  color = "indigo",
}: StatCardProps) {
  const colorMap = {
    indigo: "bg-[#1a3c2a]/10 text-[#1a3c2a]",
    emerald: "bg-[#2d5a3f]/10 text-[#2d5a3f]",
    amber: "bg-[#c9a84c]/15 text-[#a0842e]",
    rose: "bg-[#8b7355]/10 text-[#5c4a35]",
    blue: "bg-[#c4b9a8]/30 text-[#9c8f7a]",
  };

  const isFlat = trend?.value === 0;
  const TrendIcon = isFlat ? Minus : trend?.isPositive ? TrendingUp : TrendingDown;

  return (
    <div className="group relative bg-white rounded-2xl md:rounded-xl border border-[#e8e2d6] shadow-[0_1px_2px_rgba(15,31,23,0.04)] hover:shadow-[0_4px_16px_-4px_rgba(15,31,23,0.08)] hover:border-[#c9a84c]/30 transition-all duration-200 overflow-hidden">
      {/* Subtle gradient corner accent */}
      <div className="pointer-events-none absolute -top-12 -right-12 w-28 h-28 rounded-full bg-gradient-to-br from-[#c9a84c]/0 via-[#c9a84c]/0 to-[#c9a84c]/[0.06] group-hover:to-[#c9a84c]/[0.12] transition-colors duration-300" />

      <div className="relative p-4 md:p-5 flex flex-col h-full">
        {/* Header: icon + trend */}
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div className={`p-2 md:p-2.5 rounded-lg md:rounded-xl ${colorMap[color]}`}>
            <Icon className="w-4 h-4 md:w-5 md:h-5" />
          </div>

          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 text-[10px] md:text-xs font-semibold px-2 py-0.5 md:py-1 rounded-full whitespace-nowrap tabular-nums ${
                isFlat
                  ? "bg-stone-100 text-stone-600"
                  : trend.isPositive
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-600"
              }`}
            >
              <TrendIcon className="w-3 h-3 md:w-3.5 md:h-3.5" strokeWidth={2.5} />
              {Math.abs(trend.value)}%
            </span>
          )}
        </div>

        {/* Eyebrow label */}
        <h3 className="text-[10px] md:text-[11px] uppercase tracking-[0.12em] text-[#8b7355] font-semibold leading-tight line-clamp-1">
          {title}
        </h3>

        {/* Value */}
        <div className="mt-1.5 md:mt-2 flex items-baseline gap-2">
          <span className="text-2xl md:text-[28px] font-serif text-[#1a3c2a] leading-none tabular-nums truncate">
            {value}
          </span>
        </div>

        {/* Description: hidden on mobile to keep cards compact */}
        {description && (
          <p className="hidden md:block text-[11px] text-[#a89279] mt-2 leading-relaxed line-clamp-2">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
