import { createContext, useContext, useState, ReactNode } from "react";

import {
  ActorRole,
  FundBatch,
  FundDistribution,
  FundIssuance,
  FundOrder,
  FundRedemptionConfig,
  initialDistributions,
  initialFundBatches,
  initialFundOrders,
  initialFunds,
  initialRedemptions,
} from "../data/fundDemoData";

export type UserRole = ActorRole;

type PermissionAction =
  | "create"
  | "manage"
  | "submit"
  | "approve"
  | "list"
  | "open"
  | "pause"
  | "put_on_chain"
  | "subscribe"
  | "redeem"
  | "review"
  | "update";

type PermissionResource = "issuance" | "redemption" | "distribution" | "marketplace" | "order";

interface InvestorProfile {
  id: string;
  name: string;
  wallet: string;
  investorType: string;
  jurisdiction: string;
}

interface PermissionResult {
  allowed: boolean;
  reason?: string;
}

export interface AuthSession {
  walletAddress: string;
  signedAt: string;
  role: UserRole | null;
  isSimulated: boolean;
}

interface AppContextType {
  fundIssuances: FundIssuance[];
  addFundIssuance: (fund: FundIssuance, action?: PermissionAction) => boolean;
  updateFundStatus: (id: string, status: string, action?: PermissionAction | string) => boolean;
  fundRedemptions: FundRedemptionConfig[];
  addFundRedemption: (redemption: FundRedemptionConfig, action?: PermissionAction) => boolean;
  updateRedemptionStatus: (
    id: string,
    status: FundRedemptionConfig["status"],
    action?: PermissionAction | string,
  ) => boolean;
  fundOrders: FundOrder[];
  addFundOrder: (order: FundOrder, action?: PermissionAction | string) => boolean;
  updateFundOrderStatus: (id: string, status: FundOrder["status"], action?: PermissionAction | string) => boolean;
  fundBatches: FundBatch[];
  addFundBatch: (batch: FundBatch) => boolean;
  fundDistributions: FundDistribution[];
  addFundDistribution: (distribution: FundDistribution, action?: PermissionAction) => boolean;
  updateDistributionStatus: (id: string, status: string, action?: PermissionAction | string) => boolean;
  userRole: UserRole;
  authSession: AuthSession | null;
  createAuthSession: (role: UserRole, walletAddress: string, isSimulated?: boolean) => void;
  clearAuthSession: () => void;
  isAuthSessionExpired: (session?: AuthSession | null) => boolean;
  currentInvestor: InvestorProfile;
  can: (role: UserRole, action: PermissionAction | string, resource: PermissionResource) => boolean;
  getPermissionResult: (
    action: PermissionAction | string,
    resource: PermissionResource,
    role?: UserRole,
  ) => PermissionResult;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultInvestor: InvestorProfile = {
  id: "inv-001",
  name: "John Doe",
  wallet: "0xa7E4F2c8b9D1e3A5C7F6B2d8E9A1c3F5b7D9e2A4",
  investorType: "Institutional",
  jurisdiction: "Hong Kong SAR",
};

const permissionMatrix: Record<UserRole, Record<string, PermissionResource[]>> = {
  issuer: {
    create: ["issuance", "redemption", "distribution"],
    manage: ["issuance", "redemption", "distribution", "order"],
    submit: ["issuance", "redemption", "distribution"],
    approve: ["issuance", "redemption", "distribution", "order"],
    list: ["issuance", "distribution"],
    open: ["issuance", "redemption", "distribution"],
    pause: ["issuance", "redemption"],
    put_on_chain: ["issuance", "distribution"],
    review: ["order"],
    update: ["issuance", "redemption", "distribution", "order"],
  },
  investor: {
    subscribe: ["marketplace", "order"],
    redeem: ["marketplace", "order"],
    open: ["marketplace"],
    list: ["marketplace"],
  },
};

function toActionLabel(action: string) {
  return action
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function normalizeAction(action: string): string {
  const normalized = action.trim().toLowerCase().replace(/\s+/g, "_");
  if (normalized.includes("submit")) return "submit";
  if (normalized.includes("approve")) return "approve";
  if (normalized.includes("list")) return "list";
  if (normalized.includes("open")) return "open";
  if (normalized.includes("pause")) return "pause";
  if (normalized.includes("put_on_chain")) return "put_on_chain";
  if (normalized.includes("on_chain")) return "put_on_chain";
  if (normalized.includes("redeem")) return "redeem";
  if (normalized.includes("subscrib")) return "subscribe";
  if (normalized.includes("review")) return "review";
  if (normalized.includes("manage")) return "manage";
  if (normalized.includes("create")) return "create";
  if (normalized.includes("update")) return "update";
  return normalized;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [authSession, setAuthSession] = useState<AuthSession>({
    walletAddress: defaultInvestor.wallet,
    signedAt: new Date().toISOString(),
    role: "issuer",
    isSimulated: true,
  });
  const [fundIssuances, setFundIssuances] = useState<FundIssuance[]>(initialFunds);
  const [fundRedemptions, setFundRedemptions] = useState<FundRedemptionConfig[]>(initialRedemptions);
  const [fundOrders, setFundOrders] = useState<FundOrder[]>(initialFundOrders);
  const [fundBatches, setFundBatches] = useState<FundBatch[]>(initialFundBatches);
  const [fundDistributions, setFundDistributions] = useState<FundDistribution[]>(initialDistributions);

  const isAuthSessionExpired = (session: AuthSession | null = authSession) => {
    if (!session?.signedAt) return true;
    const signedAtMs = new Date(session.signedAt).getTime();
    if (Number.isNaN(signedAtMs)) return true;
    const SESSION_TTL_MS = 30 * 60 * 1000;
    return Date.now() - signedAtMs > SESSION_TTL_MS;
  };

  const createAuthSession = (role: UserRole, walletAddress: string, isSimulated = false) => {
    setAuthSession({
      walletAddress,
      signedAt: new Date().toISOString(),
      role,
      isSimulated,
    });
  };

  const clearAuthSession = () => {
    setAuthSession(null);
  };

  const userRole = authSession?.role ?? "investor";

  const can = (role: UserRole, action: PermissionAction | string, resource: PermissionResource) => {
    const actionResources = permissionMatrix[role][normalizeAction(action)] || [];
    return actionResources.includes(resource);
  };

  const getPermissionResult = (
    action: PermissionAction | string,
    resource: PermissionResource,
    role = userRole,
  ): PermissionResult => {
    const allowed = can(role, action, resource);
    if (allowed) return { allowed: true };
    return {
      allowed: false,
      reason: `Role \"${role}\" has no permission to ${toActionLabel(action).toLowerCase()} on ${resource}.`,
    };
  };

  const ensurePermission = (action: PermissionAction | string, resource: PermissionResource) => {
    if (!authSession?.role || isAuthSessionExpired()) {
      console.warn("Write denied: missing or expired auth session role.");
      return false;
    }
    const result = getPermissionResult(action, resource);
    if (!result.allowed) {
      console.warn(result.reason);
      return false;
    }
    return true;
  };

  const ensureIdentitySource = (identitySource?: string) => {
    if (!authSession?.role || isAuthSessionExpired()) {
      console.warn("Write denied: missing or expired auth session role.");
      return false;
    }
    if (identitySource !== "authSession") {
      console.warn("Write denied: identity source must be authSession.");
      return false;
    }
    return true;
  };

  const addFundIssuance = (fund: FundIssuance, action: PermissionAction = "create") => {
    if (!ensureIdentitySource(fund.identitySource)) return false;
    if (!ensurePermission(action, "issuance")) return false;
    setFundIssuances((prev) => [
      {
        ...fund,
        lastAction: action,
        lastActorRole: authSession.role!,
        lastActionAt: new Date().toISOString(),
        identitySource: "authSession",
      },
      ...prev,
    ]);
    return true;
  };

  const updateFundStatus = (id: string, status: string, action: PermissionAction | string = "update") => {
    if (!ensureIdentitySource("authSession")) return false;
    if (!ensurePermission(action, "issuance")) return false;
    setFundIssuances((prev) =>
      prev.map((fund) =>
        fund.id === id
          ? {
              ...fund,
              status,
              lastAction: action,
              lastActorRole: authSession.role!,
              lastActionAt: new Date().toISOString(),
              identitySource: "authSession",
            }
          : fund,
      ),
    );
    return true;
  };

  const addFundRedemption = (redemption: FundRedemptionConfig, action: PermissionAction = "create") => {
    if (!ensureIdentitySource(redemption.identitySource)) return false;
    if (!ensurePermission(action, "redemption")) return false;
    setFundRedemptions((prev) => [
      {
        ...redemption,
        lastAction: action,
        lastActorRole: authSession.role!,
        lastActionAt: new Date().toISOString(),
        identitySource: "authSession",
      },
      ...prev,
    ]);
    return true;
  };

  const updateRedemptionStatus = (
    id: string,
    status: FundRedemptionConfig["status"],
    action: PermissionAction | string = "update",
  ) => {
    if (!ensureIdentitySource("authSession")) return false;
    if (!ensurePermission(action, "redemption")) return false;
    setFundRedemptions((prev) =>
      prev.map((redemption) =>
        redemption.id === id
          ? {
              ...redemption,
              status,
              lastAction: action,
              lastActorRole: authSession.role!,
              lastActionAt: new Date().toISOString(),
              identitySource: "authSession",
            }
          : redemption,
      ),
    );
    return true;
  };

  const addFundOrder = (order: FundOrder, action: PermissionAction | string = order.type === "subscription" ? "subscribe" : "redeem") => {
    if (!ensureIdentitySource(order.identitySource)) return false;
    if (!ensurePermission(action, "order")) return false;
    setFundOrders((prev) => [
      {
        ...order,
        lastAction: action,
        lastActorRole: authSession.role!,
        lastActionAt: new Date().toISOString(),
        identitySource: "authSession",
      },
      ...prev,
    ]);
    return true;
  };

  const updateFundOrderStatus = (id: string, status: FundOrder["status"], action: PermissionAction | string = "update") => {
    if (!ensureIdentitySource("authSession")) return false;
    if (!ensurePermission(action, "order")) return false;
    setFundOrders((prev) =>
      prev.map((order) =>
        order.id === id
          ? {
              ...order,
              status,
              lastAction: action,
              lastActorRole: authSession.role!,
              lastActionAt: new Date().toISOString(),
              identitySource: "authSession",
            }
          : order,
      ),
    );
    return true;
  };

  const addFundBatch = (batch: FundBatch) => {
    if (!ensureIdentitySource("authSession")) return false;
    if (!ensurePermission("manage", "order")) return false;
    setFundBatches((prev) => [batch, ...prev]);
    return true;
  };

  const addFundDistribution = (distribution: FundDistribution, action: PermissionAction = "create") => {
    if (!ensureIdentitySource(distribution.identitySource)) return false;
    if (!ensurePermission(action, "distribution")) return false;
    setFundDistributions((prev) => [
      {
        ...distribution,
        lastAction: action,
        lastActorRole: authSession.role!,
        lastActionAt: new Date().toISOString(),
        identitySource: "authSession",
      },
      ...prev,
    ]);
    return true;
  };

  const updateDistributionStatus = (id: string, status: string, action: PermissionAction | string = "update") => {
    if (!ensureIdentitySource("authSession")) return false;
    if (!ensurePermission(action, "distribution")) return false;
    setFundDistributions((prev) =>
      prev.map((distribution) =>
        distribution.id === id
          ? {
              ...distribution,
              status,
              lastAction: action,
              lastActorRole: authSession.role!,
              lastActionAt: new Date().toISOString(),
              identitySource: "authSession",
            }
          : distribution,
      ),
    );
    return true;
  };

  return (
    <AppContext.Provider
      value={{
        fundIssuances,
        addFundIssuance,
        updateFundStatus,
        fundRedemptions,
        addFundRedemption,
        updateRedemptionStatus,
        fundOrders,
        addFundOrder,
        updateFundOrderStatus,
        fundBatches,
        addFundBatch,
        fundDistributions,
        addFundDistribution,
        updateDistributionStatus,
        userRole,
        authSession,
        createAuthSession,
        clearAuthSession,
        isAuthSessionExpired,
        currentInvestor: defaultInvestor,
        can,
        getPermissionResult,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
