import { useState, type ComponentProps } from "react";
import { Loader2, WalletCards } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { useWalletConnection, shortWalletAddress } from "../hooks/useWalletConnection";

type WalletConnectButtonProps = {
  className?: string;
  size?: ComponentProps<typeof Button>["size"];
  variant?: ComponentProps<typeof Button>["variant"];
};

function roleLabel(role: string) {
  if (role === "issuer") return "Issuer";
  if (role === "transferAgent") return "Transfer Agent";
  return "Investor";
}

export function WalletConnectButton({ className, size = "default", variant = "default" }: WalletConnectButtonProps) {
  const [open, setOpen] = useState(false);
  const {
    connectedAddress,
    connectMetaMask,
    currentRole,
    message,
    status,
    useFallbackSession,
  } = useWalletConnection();

  const isConnecting = status === "connecting";
  const buttonLabel = connectedAddress ? shortWalletAddress(connectedAddress) : "Connect MetaMask";
  const dialogTitle =
    status === "missing"
      ? "MetaMask Not Found"
      : status === "rejected"
        ? "Connection Cancelled"
        : status === "error"
          ? "Connection Failed"
          : status === "connected"
            ? "Wallet Connected"
            : "Connect MetaMask";
  const dialogDescription =
    status === "missing"
      ? "Install MetaMask or continue with a sample account for this role."
      : status === "rejected"
        ? "MetaMask did not grant account access."
        : status === "error"
          ? "MetaMask could not complete the connection."
          : status === "connected"
            ? "Your browser wallet is now linked to this role."
            : "Confirm the account request in MetaMask.";

  const handleConnect = async () => {
    setOpen(true);
    await connectMetaMask();
  };

  const handleFallback = () => {
    useFallbackSession();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        aria-label={connectedAddress ? `Connected wallet ${connectedAddress}` : "Connect MetaMask wallet"}
        className={className}
        disabled={isConnecting}
        onClick={handleConnect}
        size={size}
        title={connectedAddress ? `Connected wallet ${connectedAddress}` : "Connect MetaMask"}
        type="button"
        variant={variant}
      >
        {isConnecting ? <Loader2 className="size-4 animate-spin" /> : <WalletCards className="size-4" />}
        <span className="min-w-0 truncate">{buttonLabel}</span>
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <div className="rounded-md border bg-secondary/60 p-4 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Role</span>
            <span className="font-medium">{roleLabel(currentRole)}</span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Status</span>
            <span className="font-medium">{connectedAddress ? "Connected" : "Not connected"}</span>
          </div>
          {connectedAddress ? (
            <div className="mt-3 break-all rounded bg-background px-3 py-2 font-mono text-xs">
              {connectedAddress}
            </div>
          ) : null}
          {message ? <p className="mt-3 text-muted-foreground">{message}</p> : null}
        </div>

        <DialogFooter>
          {status === "missing" ? (
            <>
              <Button onClick={() => setOpen(false)} type="button" variant="outline">
                Close
              </Button>
              <Button onClick={handleFallback} type="button">
                Use Sample Account
              </Button>
            </>
          ) : status === "rejected" || status === "error" ? (
            <>
              <Button onClick={() => setOpen(false)} type="button" variant="outline">
                Close
              </Button>
              <Button onClick={handleConnect} type="button">
                Try Again
              </Button>
            </>
          ) : status === "connected" ? (
            <Button onClick={() => setOpen(false)} type="button">Done</Button>
          ) : (
            <Button disabled={isConnecting} onClick={handleConnect} type="button">
              {isConnecting ? "Waiting for MetaMask" : "Connect MetaMask"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
