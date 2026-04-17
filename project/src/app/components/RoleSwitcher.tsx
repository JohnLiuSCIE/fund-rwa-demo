import { useApp } from "../context/AppContext";
import { User, Building2 } from "lucide-react";

export function RoleSwitcher() {
  const { userRole, authSession } = useApp();

  const Icon = userRole === "issuer" ? Building2 : User;
  const roleLabel = userRole === "issuer" ? "Issuer" : "Investor";

  return (
    <div className="inline-flex items-center gap-2 border rounded-lg px-3 py-2 bg-secondary/50 text-sm">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span className="font-medium">Current Role: {roleLabel}</span>
      {authSession?.isSimulated && (
        <span className="rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
          Simulation Mode
        </span>
      )}
    </div>
  );
}
