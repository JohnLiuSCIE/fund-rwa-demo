import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  icon?: LucideIcon;
  label: string;
  value: string | number;
  suffix?: string;
  trend?: {
    value: string;
    positive?: boolean;
  };
  variant?: "default" | "primary" | "success" | "warning";
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  suffix,
  trend,
  variant = "default",
}: MetricCardProps) {
  const variantStyles = {
    default: "bg-white border-border",
    primary: "bg-gradient-to-br from-[var(--navy-50)] to-white border-[var(--navy-200)]",
    success: "bg-gradient-to-br from-green-50 to-white border-green-200",
    warning: "bg-gradient-to-br from-yellow-50 to-white border-yellow-200",
  };

  return (
    <div className={`border rounded-lg p-4 ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="text-sm text-muted-foreground">{label}</div>
        {Icon && (
          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
          {value}
        </div>
        {suffix && <div className="text-sm text-muted-foreground">{suffix}</div>}
      </div>
      {trend && (
        <div
          className={`text-xs mt-1 ${
            trend.positive ? "text-green-600" : "text-red-600"
          }`}
        >
          {trend.value}
        </div>
      )}
    </div>
  );
}
