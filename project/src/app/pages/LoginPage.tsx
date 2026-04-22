import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { useApp } from "../context/AppContext";

export function LoginPage() {
  const navigate = useNavigate();
  const { authSession, createAuthSession, currentInvestor } = useApp();

  const loginAs = (
    role: "issuer" | "investor",
    rbacRole:
      | "platform_super_admin"
      | "tenant_admin"
      | "tenant_maker"
      | "tenant_checker"
      | "tenant_viewer",
  ) => {
    createAuthSession(role, authSession?.walletAddress || currentInvestor.wallet, true, authSession?.tenantId, rbacRole);
    navigate("/", { replace: true });
  };

  return (
    <div className="container mx-auto px-6 py-16 max-w-2xl">
      <h1 style={{ fontFamily: "var(--font-heading)" }}>Login</h1>
      <p className="text-muted-foreground mt-2 mb-8">
        Select an RBAC role to create a signed session for demo operations.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Button onClick={() => loginAs("issuer", "tenant_maker")}>Tenant Maker</Button>
        <Button variant="outline" onClick={() => loginAs("issuer", "tenant_checker")}>Tenant Checker</Button>
        <Button variant="outline" onClick={() => loginAs("issuer", "tenant_admin")}>Tenant Admin</Button>
        <Button variant="outline" onClick={() => loginAs("issuer", "platform_super_admin")}>Platform Super Admin</Button>
        <Button variant="outline" onClick={() => loginAs("investor", "tenant_viewer")}>Tenant Viewer</Button>
      </div>
    </div>
  );
}
