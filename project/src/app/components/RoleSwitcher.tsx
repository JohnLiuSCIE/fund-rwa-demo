import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { User, Building2, ShieldCheck } from "lucide-react";
import { cn } from "./ui/utils";

type RoleSwitcherProps = {
  className?: string;
  iconClassName?: string;
};

export function RoleSwitcher({ className, iconClassName }: RoleSwitcherProps) {
  const { userRole } = useApp();

  const Icon = userRole === "issuer" ? Building2 : userRole === "transferAgent" ? ShieldCheck : User;
  const roleLabel = userRole === "issuer" ? "Issuer" : userRole === "transferAgent" ? "Transfer Agent" : "Investor";

  return (
    <Link
      to="/login"
      aria-label={`Current role is ${roleLabel}. Open login page to switch role.`}
      title="Switch role"
      className={cn(
        "hidden items-center gap-2 rounded-lg border bg-secondary/50 px-3 py-2 text-sm transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:inline-flex",
        className,
      )}
    >
      <Icon className={cn("w-4 h-4 text-muted-foreground", iconClassName)} />
      <span className="font-medium">{roleLabel}</span>
    </Link>
  );
}
