import { LucideIcon } from "lucide-react";

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
  color = "indigo" 
}: StatCardProps) {
  
  const colorMap = {
    indigo: "bg-[#1a3c2a]/10 text-[#1a3c2a]",
    emerald: "bg-[#2d5a3f]/10 text-[#2d5a3f]",
    amber: "bg-[#c9a84c]/20 text-[#a0842e]",
    rose: "bg-[#8b7355]/10 text-[#5c4a35]",
    blue: "bg-[#c4b9a8]/30 text-[#9c8f7a]",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#e8e2d6] p-6 flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorMap[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        
        {trend && (
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            trend.isPositive ? 'bg-[#2d5a3f]/10 text-[#2d5a3f]' : 'bg-rose-50 text-rose-600'
          }`}>
            {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
          </span>
        )}
      </div>
      
      <h3 className="text-[#8b7355] font-medium text-sm">{title}</h3>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-serif text-[#1a3c2a]">{value}</span>
      </div>
      
      {description && (
        <p className="text-xs text-[#a89279] mt-2">{description}</p>
      )}
    </div>
  );
}
