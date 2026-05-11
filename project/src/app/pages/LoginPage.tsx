import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { flushSync } from "react-dom";
import { Button } from "../components/ui/button";
import { UserRole, useApp } from "../context/AppContext";

const loginRoles: UserRole[] = ["issuer", "investor", "transferAgent"];

function isLoginRole(value: string | null): value is UserRole {
  return Boolean(value && loginRoles.includes(value as UserRole));
}

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { authSession, createAuthSession, currentInvestor } = useApp();

  const loginAs = (role: UserRole, redirectPath = role === "transferAgent" ? "/ta" : "/") => {
    flushSync(() => {
      createAuthSession(role, authSession?.walletAddress || currentInvestor.wallet, true);
    });
    navigate(redirectPath, { replace: true });
  };

  useEffect(() => {
    const requestedRole = searchParams.get("role");
    if (!isLoginRole(requestedRole)) return;
    loginAs(requestedRole, searchParams.get("redirect") || (requestedRole === "transferAgent" ? "/ta" : "/"));
    // This effect intentionally runs once for role bootstrap links opened in a new tab.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container mx-auto max-w-3xl px-6 py-16">
      <h1 style={{ fontFamily: "var(--font-heading)" }}>Login</h1>
      <p className="text-muted-foreground mt-2 mb-8">
        Select a role for this browser tab. Mock backend data remains shared across windows, but the signed demo role is now isolated per tab.
      </p>

      <div className="flex flex-wrap gap-4">
        <Button onClick={() => loginAs("issuer")}>Login as Issuer</Button>
        <Button variant="outline" onClick={() => loginAs("investor")}>Login as Investor</Button>
        <Button variant="outline" onClick={() => loginAs("transferAgent")}>Login as Transfer Agent</Button>
      </div>

      <div className="mt-8 rounded-lg border bg-secondary/30 p-4">
        <div className="text-sm font-medium">Two-window demo</div>
        <div className="mt-1 text-sm text-muted-foreground">
          Open one issuer tab and one transfer-agent tab to test live workflow handoff against the same mock backend state.
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild variant="outline" size="sm">
            <Link to="/login?role=issuer&redirect=/" target="_blank" rel="noreferrer">
              Open Issuer Tab
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/login?role=transferAgent&redirect=/ta/queue" target="_blank" rel="noreferrer">
              Open TA Workflow Tab
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
