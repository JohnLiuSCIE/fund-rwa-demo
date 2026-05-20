import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
    const walletAddress = authSession?.walletAddress || currentInvestor.wallet;
    const isSimulated = authSession?.walletAddress ? authSession.isSimulated : true;

    flushSync(() => {
      createAuthSession(role, walletAddress, isSimulated);
    });
    navigate(redirectPath, { replace: true });
  };

  useEffect(() => {
    const requestedRole = searchParams.get("role");
    if (!isLoginRole(requestedRole)) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      loginAs(requestedRole, searchParams.get("redirect") || (requestedRole === "transferAgent" ? "/ta" : "/"));
    });
    return () => {
      cancelled = true;
    };
    // This effect intentionally runs once for role bootstrap deep links.
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
    </div>
  );
}
