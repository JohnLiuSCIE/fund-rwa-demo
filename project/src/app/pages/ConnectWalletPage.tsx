import { Badge } from "../components/ui/badge";
import { WalletConnectButton } from "../components/WalletConnectButton";
import { useApp } from "../context/AppContext";
import { shortWalletAddress } from "../hooks/useWalletConnection";

function roleLabel(role: string) {
  if (role === "issuer") return "Issuer";
  if (role === "transferAgent") return "Transfer Agent";
  return "Investor";
}

export function ConnectWalletPage() {
  const { authSession, userRole } = useApp();
  const connectedAddress = authSession && !authSession.isSimulated ? authSession.walletAddress : null;
  const activeRole = authSession?.role || userRole;

  return (
    <div className="container mx-auto px-6 py-16 max-w-2xl">
      <h1 style={{ fontFamily: "var(--font-heading)" }}>Connect Wallet</h1>
      <p className="text-muted-foreground mt-2 mb-2">
        Connect MetaMask for the current role before signing wallet actions.
      </p>

      <div className="my-8 rounded-lg border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Current Role</p>
            <p className="font-medium">{roleLabel(activeRole)}</p>
          </div>
          <Badge variant={connectedAddress ? "default" : "outline"}>
            {connectedAddress ? "Connected" : "Not connected"}
          </Badge>
        </div>
        <div className="mt-4 rounded-md bg-secondary px-3 py-2 text-sm">
          {connectedAddress ? (
            <span className="break-all font-mono">{connectedAddress}</span>
          ) : (
            <span className="text-muted-foreground">
              {authSession?.isSimulated ? "Sample account active for role access." : "No browser wallet session."}
            </span>
          )}
        </div>
        {connectedAddress ? (
          <p className="mt-3 text-xs text-muted-foreground">{shortWalletAddress(connectedAddress)} will appear in the header.</p>
        ) : null}
      </div>

      <WalletConnectButton size="lg" />
    </div>
  );
}
