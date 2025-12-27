import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon: ReactNode;
  description?: string;
  className?: string;
}

export function KpiCard({ title, value, trend, icon, description, className }: KpiCardProps) {
  return (
    <div className={cn("bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow", className)}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-3xl font-display font-bold text-slate-900 mt-1">{value}</h3>
        </div>
        <div className="p-3 bg-primary/5 rounded-xl text-primary">
          {icon}
        </div>
      </div>
      
      {(trend || description) && (
        <div className="flex items-center gap-2 text-sm">
          {trend && (
            <span className={cn(
              "font-medium px-2 py-0.5 rounded-full text-xs",
              trend.isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            )}>
              {trend.value}
            </span>
          )}
          {description && <span className="text-muted-foreground">{description}</span>}
        </div>
      )}
    </div>
  );
}
