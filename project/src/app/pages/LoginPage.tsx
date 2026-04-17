import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { useApp } from "../context/AppContext";

export function LoginPage() {
  const navigate = useNavigate();
  const { authSession, createAuthSession, currentInvestor } = useApp();

  const loginAs = (role: "issuer" | "investor") => {
    createAuthSession(role, authSession?.walletAddress || currentInvestor.wallet, true);
    navigate("/", { replace: true });
  };

  return (
    <div className="container mx-auto px-6 py-16 max-w-2xl">
      <h1 style={{ fontFamily: "var(--font-heading)" }}>Login</h1>
      <p className="text-muted-foreground mt-2 mb-8">
        Select a role to create a signed session for demo operations.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => loginAs("issuer")}>Login as Issuer</Button>
        <Button variant="outline" onClick={() => loginAs("investor")}>Login as Investor</Button>
      </div>
    </div>
  );
}
