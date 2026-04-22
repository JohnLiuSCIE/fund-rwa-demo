import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { useApp } from "../context/AppContext";

export function ConnectWalletPage() {
  const navigate = useNavigate();
  const { currentInvestor, authSession, createAuthSession } = useApp();

  const connectWallet = () => {
    createAuthSession(
      authSession?.role || "investor",
      currentInvestor.wallet,
      true,
      authSession?.tenantId,
      authSession?.rbacRole || "tenant_viewer",
    );
    navigate("/login", { replace: true });
  };

  return (
    <div className="container mx-auto px-6 py-16 max-w-2xl">
      <h1 style={{ fontFamily: "var(--font-heading)" }}>Connect Wallet</h1>
      <p className="text-muted-foreground mt-2 mb-2">
        A wallet connection is required before creating a signed auth session.
      </p>
      <p className="font-mono text-sm bg-secondary rounded p-3 mb-8">{currentInvestor.wallet}</p>
      <Button onClick={connectWallet}>Connect Demo Wallet</Button>
    </div>
  );
}
