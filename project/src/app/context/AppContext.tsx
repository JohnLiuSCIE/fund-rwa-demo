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
  updateFundIssuance: (
    id: string,
    updates: Partial<FundIssuance>,
    action?: PermissionAction | string,
  ) => boolean;
  fundRedemptions: FundRedemptionConfig[];
  addFundRedemption: (redemption: FundRedemptionConfig, action?: PermissionAction) => boolean;
  updateFundRedemption: (
    id: string,
    updates: Partial<FundRedemptionConfig>,
    action?: PermissionAction | string,
  ) => boolean;
  updateRedemptionStatus: (
    id: string,
    status: FundRedemptionConfig["status"],
    action?: PermissionAction | string,
  ) => boolean;
  fundOrders: FundOrder[];
  addFundOrder: (order: FundOrder, action?: PermissionAction | string) => boolean;
  updateFundOrder: (
    id: string,
    updates: Partial<FundOrder>,
    action?: PermissionAction | string,
  ) => boolean;
  updateFundOrderStatus: (id: string, status: FundOrder["status"], action?: PermissionAction | string) => boolean;
  fundBatches: FundBatch[];
  addFundBatch: (batch: FundBatch) => boolean;
  fundDistributions: FundDistribution[];
  addFundDistribution: (distribution: FundDistribution, action?: PermissionAction) => boolean;
  updateFundDistribution: (
    id: string,
    updates: Partial<FundDistribution>,
    action?: PermissionAction | string,
  ) => boolean;
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

function formatDemoNumber(value: number, digits = 2) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value);
}

function parseLeadingNumber(value?: string) {
  if (!value) return 0;
  const match = value.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function formatDateTime(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  const seconds = String(value.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function formatDateTag(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function shiftDate(
  value: Date,
  { days = 0, hours = 0, minutes = 0 }: { days?: number; hours?: number; minutes?: number },
) {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  next.setHours(next.getHours() + hours);
  next.setMinutes(next.getMinutes() + minutes);
  return next;
}

function setTime(value: Date, hours: number, minutes = 0, seconds = 0) {
  const next = new Date(value);
  next.setHours(hours, minutes, seconds, 0);
  return next;
}

function parseDateTime(value?: string) {
  if (!value) return undefined;
  const normalized = value
    .replace(/\sHKT$/i, "")
    .replace(/\sUTC$/i, "")
    .replace(" ", "T");
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function clampDemoAmount(value: number, minValue: number, maxValue: number) {
  if (maxValue <= 0) return Math.max(value, minValue);
  return Math.min(Math.max(value, minValue), maxValue);
}

function buildClosedEndDemoOrders(fund: FundIssuance) {
  const currency = fund.subscriptionCashCurrency || fund.navCurrency || fund.assetCurrency;
  const navValue = fund.currentNavValue || fund.initialNavValue || 1;
  const minAmount = Math.max(fund.minSubscriptionAmountValue || 10000, 1000);
  const fallbackMax = Math.max(minAmount * 12, 50000);
  const maxAmount = Math.max(fund.maxSubscriptionAmountValue || fallbackMax, minAmount);
  const anchorDate = parseDateTime(fund.subscriptionEndDate) || new Date();
  const paymentMethod = fund.subscriptionPaymentMethod || "Fiat";
  const usesFiatFunding =
    paymentMethod === "Fiat" || fund.subscriptionPaymentRail === "Off-chain Bank Transfer";
  const symbol = (fund.tokenSymbol || fund.tokenName || "FUND").replace(/[^A-Za-z0-9]/g, "").slice(0, 8).toUpperCase() || "FUND";

  const demoProfiles = [
    {
      id: "demo-ce-001",
      name: "Harbor Family Office",
      wallet: "0x1a2B3c4D5e6F708192A3b4C5d6E7f8091A2b3C4d",
      amountRatio: 0.82,
      submitOffsetDays: -7,
      submitHour: 10,
      submitMinute: 15,
      status: "Pending Review" as const,
      paymentStatus: usesFiatFunding ? "Payment Proof Uploaded" as const : "Funds Cleared" as const,
      unitBookingStatus: usesFiatFunding ? "Pending" as const : "Ready To Book" as const,
      payerBankAccountMasked: usesFiatFunding ? "012-221-****889" : undefined,
      paymentProofName: usesFiatFunding ? "harbor-family-office-slip.pdf" : undefined,
      note: "Demo-seeded order to simulate week-long book building before allocation starts.",
    },
    {
      id: "demo-ce-002",
      name: "Granite Institutional Fund",
      wallet: "0x2b3C4d5E6f708192A3b4C5d6E7f8091A2b3C4d5E",
      amountRatio: 0.68,
      submitOffsetDays: -4,
      submitHour: 11,
      submitMinute: 40,
      status: "Submitted" as const,
      paymentStatus: usesFiatFunding ? "Awaiting Payment" as const : "Funds Cleared" as const,
      unitBookingStatus: "Pending" as const,
      payerBankAccountMasked: undefined,
      paymentProofName: undefined,
      note: "Demo-seeded institutional ticket still waiting for final issuer review.",
    },
    {
      id: "demo-ce-003",
      name: "Summit Qualified Investors SPC",
      wallet: "0x3c4D5e6F708192A3b4C5d6E7f8091A2b3C4d5E6f",
      amountRatio: 0.54,
      submitOffsetDays: -1,
      submitHour: 14,
      submitMinute: 5,
      status: "Pending Review" as const,
      paymentStatus: "Funds Cleared" as const,
      unitBookingStatus: "Ready To Book" as const,
      payerBankAccountMasked: usesFiatFunding ? "388-110-****552" : undefined,
      paymentProofName: undefined,
      note: "Demo-seeded order that has already cleared cash and is ready for allocation review.",
    },
  ];

  return demoProfiles.map((profile, index) => {
    const requestAmountValue = clampDemoAmount(
      maxAmount * profile.amountRatio,
      minAmount,
      maxAmount,
    );
    const requestedUnits = requestAmountValue / navValue;
    const submitTime = setTime(
      shiftDate(anchorDate, { days: profile.submitOffsetDays }),
      profile.submitHour,
      profile.submitMinute,
    );

    return {
      id: `sub-demo-${fund.id}-${index + 1}`,
      fundId: fund.id,
      investorId: profile.id,
      investorName: profile.name,
      investorWallet: profile.wallet,
      type: "subscription" as const,
      requestAmount: `${formatDemoNumber(requestAmountValue, 2)} ${currency}`,
      requestQuantity: `${formatDemoNumber(requestedUnits, 4)} units`,
      estimatedNav: fund.currentNav,
      estimatedSharesOrCash: `${formatDemoNumber(requestedUnits, 4)} units`,
      submitTime: formatDateTime(submitTime),
      status: profile.status,
      paymentMethod,
      paymentStatus: profile.paymentStatus,
      paymentReference: `${symbol}-DEMO-${index + 1}`,
      payerAccountName: usesFiatFunding ? profile.name : undefined,
      payerBankAccountMasked: profile.payerBankAccountMasked,
      paymentProofName: profile.paymentProofName,
      cashReceivedAt:
        profile.paymentStatus === "Funds Cleared"
          ? formatDateTime(shiftDate(submitTime, { hours: 2 }))
          : undefined,
      cashConfirmedBy:
        profile.paymentStatus === "Funds Cleared"
          ? `${fund.cashConfirmationOwner || "Issuer"} Ops`
          : undefined,
      cashConfirmedAt:
        profile.paymentStatus === "Funds Cleared"
          ? formatDateTime(shiftDate(submitTime, { hours: 4 }))
          : undefined,
      unitBookingStatus: profile.unitBookingStatus,
      note: profile.note,
      identitySource: "authSession" as const,
    };
  });
}

function buildOpenEndDemoOrders(fund: FundIssuance) {
  const baseDate = new Date();
  const currency = fund.subscriptionCashCurrency || fund.navCurrency || fund.assetCurrency;
  const navValue = fund.currentNavValue || fund.initialNavValue || 1;
  const minAmount = Math.max(fund.minSubscriptionAmountValue || 5000, 1000);
  const fallbackMax = Math.max(minAmount * 40, 100000);
  const maxAmount = Math.max(fund.maxSubscriptionAmountValue || fallbackMax, minAmount);
  const paymentMethod = fund.subscriptionPaymentMethod || "Stablecoin";
  const needsManualReview = fund.orderConfirmationMethod === "Issuer review then confirm";
  const usesFiatFunding =
    paymentMethod === "Fiat" || fund.subscriptionPaymentRail === "Off-chain Bank Transfer";
  const symbol = (fund.tokenSymbol || fund.tokenName || "FUND").replace(/[^A-Za-z0-9]/g, "").slice(0, 8).toUpperCase() || "FUND";

  const johnSubscriptionAmount = clampDemoAmount(maxAmount * 0.18, minAmount, maxAmount);
  const treasurySubscriptionAmount = clampDemoAmount(maxAmount * 0.36, minAmount, maxAmount);
  const harborSubscriptionAmount = clampDemoAmount(maxAmount * 0.24, minAmount, maxAmount);
  const johnUnits = johnSubscriptionAmount / navValue;
  const redeemedUnitsByJohn = johnUnits * 0.18;

  const subscriptionOrders: FundOrder[] = [
    {
      id: `sub-demo-${fund.id}-1`,
      fundId: fund.id,
      investorId: defaultInvestor.id,
      investorName: defaultInvestor.name,
      investorWallet: defaultInvestor.wallet,
      type: "subscription",
      requestAmount: `${formatDemoNumber(johnSubscriptionAmount, 2)} ${currency}`,
      requestQuantity: `${formatDemoNumber(johnUnits, 4)} units`,
      estimatedNav: fund.currentNav,
      confirmedNav: fund.currentNav,
      estimatedSharesOrCash: `${formatDemoNumber(johnUnits, 4)} units`,
      confirmedSharesOrCash: `${formatDemoNumber(johnUnits, 4)} units`,
      submitTime: formatDateTime(setTime(shiftDate(baseDate, { days: -6 }), 10, 20)),
      confirmTime: formatDateTime(setTime(shiftDate(baseDate, { days: -6 }), 18, 5)),
      settlementTime: formatDateTime(setTime(shiftDate(baseDate, { days: -5 }), 10, 0)),
      status: "Confirmed",
      paymentMethod,
      paymentStatus: "Funds Cleared",
      paymentReference: `${symbol}-DEMO-SUB-1`,
      cashReceivedAt: formatDateTime(setTime(shiftDate(baseDate, { days: -6 }), 10, 25)),
      cashConfirmedBy: `${fund.cashConfirmationOwner || "Operations"} Desk`,
      cashConfirmedAt: formatDateTime(setTime(shiftDate(baseDate, { days: -6 }), 10, 35)),
      unitBookingStatus: "Booked",
      note: "Demo-seeded settled subscription to establish investor holdings for open-end dealing.",
      identitySource: "authSession",
    },
    {
      id: `sub-demo-${fund.id}-2`,
      fundId: fund.id,
      investorId: "demo-oe-002",
      investorName: "Acme Treasury",
      investorWallet: "0x9c3A1E5d8F4B2c6D7e9A4f2C5b8D3e6A1f4B7c9E",
      type: "subscription",
      requestAmount: `${formatDemoNumber(treasurySubscriptionAmount, 2)} ${currency}`,
      requestQuantity: `${formatDemoNumber(treasurySubscriptionAmount / navValue, 4)} units`,
      estimatedNav: fund.currentNav,
      estimatedSharesOrCash: `${formatDemoNumber(treasurySubscriptionAmount / navValue, 4)} units`,
      submitTime: formatDateTime(setTime(shiftDate(baseDate, { days: -1 }), 14, 5)),
      status: needsManualReview ? "Pending Review" : "Pending NAV",
      paymentMethod,
      paymentStatus: usesFiatFunding ? "Funds Cleared" : "Funds Cleared",
      paymentReference: `${symbol}-DEMO-SUB-2`,
      cashReceivedAt: formatDateTime(setTime(shiftDate(baseDate, { days: -1 }), 14, 8)),
      cashConfirmedBy: `${fund.cashConfirmationOwner || "Operations"} Desk`,
      cashConfirmedAt: formatDateTime(setTime(shiftDate(baseDate, { days: -1 }), 14, 20)),
      unitBookingStatus: "Ready To Book",
      note: "Demo-seeded dealing-day subscription waiting for cut-off and NAV processing.",
      identitySource: "authSession",
    },
    {
      id: `sub-demo-${fund.id}-3`,
      fundId: fund.id,
      investorId: "demo-oe-003",
      investorName: "Blue Harbor Capital",
      investorWallet: "0x6F4B2c6D7e9A4f2C5b8D3e6A1f4B7c9E0a1C2D3E",
      type: "subscription",
      requestAmount: `${formatDemoNumber(harborSubscriptionAmount, 2)} ${currency}`,
      requestQuantity: `${formatDemoNumber(harborSubscriptionAmount / navValue, 4)} units`,
      estimatedNav: fund.currentNav,
      estimatedSharesOrCash: `${formatDemoNumber(harborSubscriptionAmount / navValue, 4)} units`,
      submitTime: formatDateTime(setTime(baseDate, 11, 32)),
      status: usesFiatFunding ? "Submitted" : needsManualReview ? "Pending Review" : "Submitted",
      paymentMethod,
      paymentStatus: usesFiatFunding
        ? fund.paymentProofRequired
          ? "Payment Proof Uploaded"
          : "Awaiting Payment"
        : "Funds Cleared",
      paymentReference: `${symbol}-DEMO-SUB-3`,
      payerAccountName: usesFiatFunding ? "Blue Harbor Capital" : undefined,
      paymentProofName:
        usesFiatFunding && fund.paymentProofRequired ? "blue-harbor-remittance.pdf" : undefined,
      unitBookingStatus: usesFiatFunding ? "Pending" : "Pending",
      note: "Demo-seeded fresh subscription still sitting in the current dealing batch.",
      identitySource: "authSession",
    },
  ];

  const redemptionOrders: FundOrder[] =
    fund.redemptionStatus === "Paused"
      ? [
          {
            id: `red-demo-${fund.id}-1`,
            fundId: fund.id,
            investorId: defaultInvestor.id,
            investorName: defaultInvestor.name,
            investorWallet: defaultInvestor.wallet,
            type: "redemption",
            requestAmount: `${formatDemoNumber(redeemedUnitsByJohn, 2)} units`,
            requestQuantity: `${formatDemoNumber(redeemedUnitsByJohn, 2)} units`,
            estimatedNav: fund.currentNav,
            confirmedNav: fund.currentNav,
            estimatedSharesOrCash: `${formatDemoNumber(redeemedUnitsByJohn * navValue, 2)} ${fund.navCurrency}`,
            confirmedSharesOrCash: `${formatDemoNumber(redeemedUnitsByJohn * navValue, 2)} ${fund.navCurrency}`,
            submitTime: formatDateTime(setTime(shiftDate(baseDate, { days: -3 }), 9, 40)),
            confirmTime: formatDateTime(setTime(shiftDate(baseDate, { days: -3 }), 18, 12)),
            settlementTime: formatDateTime(setTime(shiftDate(baseDate, { days: -2 }), 10, 0)),
            status: "Completed",
            note: "Demo-seeded completed redemption from the first daily dealing cycle.",
            identitySource: "authSession",
          },
        ]
      : [
          {
            id: `red-demo-${fund.id}-1`,
            fundId: fund.id,
            investorId: defaultInvestor.id,
            investorName: defaultInvestor.name,
            investorWallet: defaultInvestor.wallet,
            type: "redemption",
            requestAmount: `${formatDemoNumber(redeemedUnitsByJohn, 2)} units`,
            requestQuantity: `${formatDemoNumber(redeemedUnitsByJohn, 2)} units`,
            estimatedNav: fund.currentNav,
            confirmedNav: fund.currentNav,
            estimatedSharesOrCash: `${formatDemoNumber(redeemedUnitsByJohn * navValue, 2)} ${fund.navCurrency}`,
            confirmedSharesOrCash: `${formatDemoNumber(redeemedUnitsByJohn * navValue, 2)} ${fund.navCurrency}`,
            submitTime: formatDateTime(setTime(shiftDate(baseDate, { days: -3 }), 9, 40)),
            confirmTime: formatDateTime(setTime(shiftDate(baseDate, { days: -3 }), 18, 12)),
            settlementTime: formatDateTime(setTime(shiftDate(baseDate, { days: -2 }), 10, 0)),
            status: "Completed",
            note: "Demo-seeded completed redemption from the first daily dealing cycle.",
            identitySource: "authSession",
          },
          {
            id: `red-demo-${fund.id}-2`,
            fundId: fund.id,
            investorId: "demo-oe-004",
            investorName: "North Ridge Treasury",
            investorWallet: "0x4D5e6F708192A3b4C5d6E7f8091A2b3C4d5E6f70",
            type: "redemption",
            requestAmount: `${formatDemoNumber(johnUnits * 0.12, 2)} units`,
            requestQuantity: `${formatDemoNumber(johnUnits * 0.12, 2)} units`,
            estimatedNav: fund.currentNav,
            estimatedSharesOrCash: `${formatDemoNumber(johnUnits * 0.12 * navValue, 2)} ${fund.navCurrency}`,
            submitTime: formatDateTime(setTime(baseDate, 15, 10)),
            status: needsManualReview ? "Pending Review" : "Pending Cash Settlement",
            note: "Demo-seeded live redemption request waiting for the current dealing cycle to finish.",
            identitySource: "authSession",
          },
        ];

  return [...subscriptionOrders, ...redemptionOrders];
}

function buildOpenEndSummaryUpdates(fund: FundIssuance, orders: FundOrder[]) {
  const subscriptionOrders = orders.filter((order) => order.type === "subscription");
  const redemptionOrders = orders.filter((order) => order.type === "redemption");
  const pendingSubscriptionOrders = subscriptionOrders.filter((order) =>
    ["Submitted", "Pending Review", "Pending NAV", "Pending Confirmation"].includes(order.status),
  ).length;
  const pendingRedemptionOrders = redemptionOrders.filter((order) =>
    ["Submitted", "Pending Review", "Pending NAV", "Pending Cash Settlement"].includes(order.status),
  ).length;
  const totalSubscribedAmount = subscriptionOrders.reduce(
    (sum, order) => sum + parseLeadingNumber(order.requestAmount),
    0,
  );
  const totalRedeemedAmount = redemptionOrders.reduce((sum, order) => {
    const confirmedOrEstimated = order.confirmedSharesOrCash || order.estimatedSharesOrCash;
    return sum + parseLeadingNumber(confirmedOrEstimated);
  }, 0);
  const defaultInvestorOrders = orders.filter((order) => order.investorId === defaultInvestor.id);
  const bookedUnits = defaultInvestorOrders.reduce((sum, order) => {
    if (order.type !== "subscription") return sum;
    if (!["Confirmed", "Completed"].includes(order.status)) return sum;
    return sum + parseLeadingNumber(order.confirmedSharesOrCash || order.estimatedSharesOrCash);
  }, 0);
  const reducedUnits = defaultInvestorOrders.reduce((sum, order) => {
    if (order.type !== "redemption") return sum;
    if (!["Pending Cash Settlement", "Confirmed", "Completed"].includes(order.status)) return sum;
    return sum + parseLeadingNumber(order.requestQuantity);
  }, 0);
  const availableHoldingUnits = Math.max(bookedUnits - reducedUnits, 0);

  return {
    pendingSubscriptionOrders,
    pendingRedemptionOrders,
    totalSubscribedAmount: `${formatDemoNumber(totalSubscribedAmount, 2)} ${fund.subscriptionCashCurrency || fund.navCurrency}`,
    totalRedeemedAmount: `${formatDemoNumber(totalRedeemedAmount, 2)} ${fund.navCurrency}`,
    availableHoldingUnits,
    availableHoldingLabel: `${formatDemoNumber(availableHoldingUnits, 2)} units`,
  };
}

function buildLifecycleDemoSeed(fund: FundIssuance, nextStatus: string, existingOrders: FundOrder[]) {
  if (existingOrders.length > 0) return null;

  if (fund.fundType === "Closed-end" && nextStatus === "Allocation Period") {
    const orders = buildClosedEndDemoOrders(fund);
    const totalSubscribedAmount = orders.reduce(
      (sum, order) => sum + parseLeadingNumber(order.requestAmount),
      0,
    );
    const anchorDate = parseDateTime(fund.subscriptionEndDate) || new Date();
    const symbol = (fund.tokenSymbol || fund.tokenName || "FUND").replace(/[^A-Za-z0-9]/g, "").slice(0, 8).toUpperCase() || "FUND";

    return {
      orders,
      fundUpdates: {
        pendingSubscriptionOrders: orders.length,
        totalSubscribedAmount: `${formatDemoNumber(totalSubscribedAmount, 2)} ${fund.subscriptionCashCurrency || fund.navCurrency || fund.assetCurrency}`,
        allocationStatus: "Ongoing",
        transferAgentOps: {
          ...fund.transferAgentOps,
          transferAgentStatus: "Allocation Intake Ready",
          holderRegisterDate: formatDateTime(setTime(anchorDate, 17, 0)),
          registerVersion:
            fund.transferAgentOps?.registerVersion || `PRE-${symbol}-${formatDateTag(anchorDate)}`,
          investorOnboardingStatus:
            fund.transferAgentOps?.investorOnboardingStatus || "KYC / subscription eligibility reviewed",
          orderBookStatus: "Subscription book locked after seeded 7-day demo intake",
          allocationBookStatus: "Pending calculation from demo order book",
          ledgerApprovalStatus: "Pre-allocation register draft prepared",
          mintInstructionStatus: "Pending final allocation",
          lastTransferAgentAction:
            "Injected demo subscription activity to simulate a completed seven-day intake window before allocation.",
        },
      },
    };
  }

  if (fund.fundType === "Open-end" && nextStatus === "Active Dealing") {
    const orders = buildOpenEndDemoOrders(fund);
    const baseDate = new Date();
    const symbol = (fund.tokenSymbol || fund.tokenName || "FUND").replace(/[^A-Za-z0-9]/g, "").slice(0, 8).toUpperCase() || "FUND";

    return {
      orders,
      fundUpdates: {
        ...buildOpenEndSummaryUpdates(fund, orders),
        lastNavUpdateTime: formatDateTime(setTime(baseDate, 18, 5)),
        nextCutoffTime: formatDateTime(setTime(shiftDate(baseDate, { days: 1 }), 16, 0)),
        nextConfirmationDate: formatDateTime(setTime(shiftDate(baseDate, { days: 1 }), 18, 0)),
        nextSettlementTime: formatDateTime(setTime(shiftDate(baseDate, { days: 2 }), 10, 0)),
        transferAgentOps: {
          ...fund.transferAgentOps,
          transferAgentStatus: "Daily Register Maintenance",
          holderRegisterDate: formatDateTime(setTime(baseDate, 18, 20)),
          registerVersion:
            fund.transferAgentOps?.registerVersion || `REG-${symbol}-${formatDateTag(baseDate)}`,
          investorOnboardingStatus: fund.transferAgentOps?.investorOnboardingStatus || "Confirmed",
          orderBookStatus: "Daily batch servicing",
          ledgerApprovalStatus:
            fund.orderConfirmationMethod === "Issuer review then confirm"
              ? "Waiting for issuer review on the newest batch"
              : "Posted after NAV confirmation",
          ledgerApprovedAt:
            fund.orderConfirmationMethod === "Issuer review then confirm"
              ? undefined
              : formatDateTime(setTime(baseDate, 18, 22)),
          mintInstructionStatus: "Not applicable for daily dealing",
          lastTransferAgentAction:
            "Injected demo subscriptions and redemptions to simulate the first seven days of recurring dealing.",
        },
      },
    };
  }

  return null;
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
    const targetFund = fundIssuances.find((fund) => fund.id === id);
    const demoSeed = targetFund
      ? buildLifecycleDemoSeed(
          targetFund,
          status,
          fundOrders.filter((order) => order.fundId === id),
        )
      : null;

    if (demoSeed?.orders.length) {
      setFundOrders((prev) => [
        ...demoSeed.orders.map((order) => ({
          ...order,
          lastAction: "manage",
          lastActorRole: authSession.role!,
          lastActionAt: new Date().toISOString(),
          identitySource: "authSession" as const,
        })),
        ...prev,
      ]);
    }

    setFundIssuances((prev) =>
      prev.map((fund) =>
        fund.id === id
          ? {
              ...fund,
              ...(demoSeed?.fundUpdates || {}),
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

  const updateFundIssuance = (
    id: string,
    updates: Partial<FundIssuance>,
    action: PermissionAction | string = "update",
  ) => {
    if (!ensureIdentitySource("authSession")) return false;
    if (!ensurePermission(action, "issuance")) return false;
    setFundIssuances((prev) =>
      prev.map((fund) =>
        fund.id === id
          ? {
              ...fund,
              ...updates,
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

  const updateFundRedemption = (
    id: string,
    updates: Partial<FundRedemptionConfig>,
    action: PermissionAction | string = "update",
  ) => {
    if (!ensureIdentitySource("authSession")) return false;
    if (!ensurePermission(action, "redemption")) return false;
    setFundRedemptions((prev) =>
      prev.map((redemption) =>
        redemption.id === id
          ? {
              ...redemption,
              ...updates,
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

  const updateFundOrder = (
    id: string,
    updates: Partial<FundOrder>,
    action: PermissionAction | string = "update",
  ) => {
    if (!ensureIdentitySource("authSession")) return false;
    if (!ensurePermission(action, "order")) return false;
    setFundOrders((prev) =>
      prev.map((order) =>
        order.id === id
          ? {
              ...order,
              ...updates,
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

  const updateFundDistribution = (
    id: string,
    updates: Partial<FundDistribution>,
    action: PermissionAction | string = "update",
  ) => {
    if (!ensureIdentitySource("authSession")) return false;
    if (!ensurePermission(action, "distribution")) return false;
    setFundDistributions((prev) =>
      prev.map((distribution) =>
        distribution.id === id
          ? {
              ...distribution,
              ...updates,
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
        updateFundIssuance,
        fundRedemptions,
        addFundRedemption,
        updateFundRedemption,
        updateRedemptionStatus,
        fundOrders,
        addFundOrder,
        updateFundOrder,
        updateFundOrderStatus,
        fundBatches,
        addFundBatch,
        fundDistributions,
        addFundDistribution,
        updateFundDistribution,
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
