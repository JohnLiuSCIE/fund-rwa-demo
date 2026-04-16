import { Info, AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";

interface InfoAlertProps {
  variant?: "info" | "success" | "warning" | "error";
  title?: string;
  children: React.ReactNode;
}

export function InfoAlert({ variant = "info", title, children }: InfoAlertProps) {
  const config = {
    info: {
      bg: "bg-blue-50 border-blue-200",
      icon: Info,
      iconColor: "text-blue-600",
      titleColor: "text-blue-900",
    },
    success: {
      bg: "bg-green-50 border-green-200",
      icon: CheckCircle,
      iconColor: "text-green-600",
      titleColor: "text-green-900",
    },
    warning: {
      bg: "bg-yellow-50 border-yellow-200",
      icon: AlertTriangle,
      iconColor: "text-yellow-600",
      titleColor: "text-yellow-900",
    },
    error: {
      bg: "bg-red-50 border-red-200",
      icon: AlertCircle,
      iconColor: "text-red-600",
      titleColor: "text-red-900",
    },
  };

  const { bg, icon: Icon, iconColor, titleColor } = config[variant];

  return (
    <div className={`${bg} border rounded-lg p-4 flex gap-3`}>
      <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
      <div className="flex-1">
        {title && <div className={`font-medium mb-1 ${titleColor}`}>{title}</div>}
        <div className="text-sm text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}
