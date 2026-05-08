import { useApp } from "../context/AppContext";
import { User, Building2, ShieldCheck } from "lucide-react";

export function RoleSwitcher() {
  const { userRole, authSession } = useApp();

  const Icon = userRole === "issuer" ? Building2 : userRole === "transferAgent" ? ShieldCheck : User;
  const roleLabel = userRole === "issuer" ? "Issuer" : userRole === "transferAgent" ? "Transfer Agent" : "Investor";

  return (
    <div className="hidden items-center gap-2 rounded-lg border bg-secondary/50 px-3 py-2 text-sm sm:inline-flex">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span className="font-medium">Current Role: {roleLabel}</span>
      {authSession?.isSimulated && (
        <span className="hidden rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 lg:inline-flex">
          Simulation Mode
        </span>
      )}
    </div>
  );
}
