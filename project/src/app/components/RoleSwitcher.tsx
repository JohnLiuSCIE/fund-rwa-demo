import { useApp } from "../context/AppContext";
import { Button } from "./ui/button";
import { User, Building2 } from "lucide-react";

export function RoleSwitcher() {
  const { userRole, setUserRole } = useApp();

  return (
    <div className="inline-flex items-center gap-2 border rounded-lg p-1 bg-secondary/50">
      <Button
        variant={userRole === "issuer" ? "default" : "ghost"}
        size="sm"
        onClick={() => setUserRole("issuer")}
        className="gap-2"
      >
        <Building2 className="w-4 h-4" />
        Issuer
      </Button>
      <Button
        variant={userRole === "investor" ? "default" : "ghost"}
        size="sm"
        onClick={() => setUserRole("investor")}
        className="gap-2"
      >
        <User className="w-4 h-4" />
        Investor
      </Button>
    </div>
  );
}
