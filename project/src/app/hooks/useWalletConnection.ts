import { useState } from "react";
import { toast } from "sonner";

import { useApp } from "../context/AppContext";

type EthereumRequest = {
  method: string;
  params?: unknown[] | Record<string, unknown>;
};

type EthereumProvider = {
  isMetaMask?: boolean;
  request: <T = unknown>(request: EthereumRequest) => Promise<T>;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export type WalletConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "missing"
  | "rejected"
  | "error"
  | "fallback";

type WalletConnectionResult =
  | { ok: true; account: string }
  | { ok: false; reason: Exclude<WalletConnectionStatus, "idle" | "connecting" | "connected"> };

export function shortWalletAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getWalletErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return "Wallet connection failed.";
}

function isUserRejected(error: unknown) {
  if (typeof error !== "object" || !error) return false;
  const code = (error as { code?: unknown }).code;
  return code === 4001 || code === "4001";
}

export function useWalletConnection() {
  const { authSession, createAuthSession, currentInvestor, userRole } = useApp();
  const [status, setStatus] = useState<WalletConnectionStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const currentRole = authSession?.role || userRole || "investor";
  const connectedAddress = authSession && !authSession.isSimulated ? authSession.walletAddress : null;

  const connectMetaMask = async (): Promise<WalletConnectionResult> => {
    const provider = typeof window !== "undefined" ? window.ethereum : undefined;

    if (!provider?.request) {
      setStatus("missing");
      setMessage("MetaMask is not available in this browser.");
      toast.error("MetaMask is not available in this browser.");
      return { ok: false, reason: "missing" };
    }

    setStatus("connecting");
    setMessage("Confirm the account connection in MetaMask.");

    try {
      const accounts = await provider.request<string[]>({ method: "eth_requestAccounts" });
      const account = accounts?.[0];

      if (!account) {
        throw new Error("MetaMask returned no account.");
      }

      createAuthSession(currentRole, account, false);
      setStatus("connected");
      setMessage(`Connected ${shortWalletAddress(account)}.`);
      toast.success(`Connected ${shortWalletAddress(account)}.`);
      return { ok: true, account };
    } catch (error) {
      if (isUserRejected(error)) {
        setStatus("rejected");
        setMessage("The connection request was cancelled.");
        toast.error("Wallet connection cancelled.");
        return { ok: false, reason: "rejected" };
      }

      const errorMessage = getWalletErrorMessage(error);
      setStatus("error");
      setMessage(errorMessage);
      toast.error(errorMessage);
      return { ok: false, reason: "error" };
    }
  };

  const useFallbackSession = () => {
    createAuthSession(currentRole, currentInvestor.wallet, true);
    setStatus("fallback");
    setMessage("Sample account enabled for the current role.");
    toast.success("Sample account enabled for the current role.");
  };

  return {
    connectedAddress,
    connectMetaMask,
    currentRole,
    message,
    status,
    useFallbackSession,
  };
}
