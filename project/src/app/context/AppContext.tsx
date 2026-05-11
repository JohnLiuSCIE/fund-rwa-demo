import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";

import {
  ActorRole,
  AnchoringEvent,
  CashMovement,
  EvidenceRecord,
  FundBatch,
  FundDistribution,
  FundIssuance,
  FundOrder,
  FundRedemptionConfig,
  HolderSnapshot,
  HolderSnapshotPosition,
  RegisterAccount,
  RegisterDelta,
  RegisterVersion,
  ReconciliationBreak,
  SettlementList,
  SettlementListLine,
  OnChainEvent,
  TokenEvent,
  TransferAgencyInstruction,
  TransferAgencyNavRecord,
  WalletLink,
  initialAnchoringEvents,
  initialCashMovements,
  initialDistributions,
  initialEvidenceRecords,
  initialFundBatches,
  initialFundOrders,
  initialFunds,
  initialHolderSnapshotPositions,
  initialHolderSnapshots,
  initialRedemptions,
  initialReconciliationBreaks,
  initialRegisterAccounts,
  initialRegisterDeltas,
  initialRegisterVersions,
  initialSettlementListLines,
  initialSettlementLists,
  initialOnChainEvents,
  initialTokenEvents,
  initialTransferAgencyInstructions,
  initialTransferAgencyNavRecords,
  initialWalletLinks,
} from "../data/fundDemoData";
import {
  acknowledgeWorkflowTask,
  createIssuerWorkflowInstruction,
  loadWorkflowState,
  matchWorkflowTask,
  pullWorkflowTask,
  reconcileWorkflowTask,
  respondWorkflowTask,
  returnWorkflowTask,
  submitWorkflowStep,
  subscribeWorkflowState,
  updateWorkflowTaskChecklist,
  type WorkflowBackendState,
  type WorkflowCommandResult,
} from "../lib/workflowBackend";

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
  | "update"
  | "prepare"
  | "lock"
  | "generate"
  | "acknowledge"
  | "post"
  | "resolve"
  | "reconcile"
  | "export";

type PermissionResource =
  | "issuance"
  | "redemption"
  | "distribution"
  | "marketplace"
  | "order"
  | "register"
  | "reconciliation"
  | "evidence"
  | "transfer";

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

interface TransferAgencyCommandResult {
  success: boolean;
  message?: string;
  error?: "VERSION_CONFLICT" | "NOT_FOUND" | "PERMISSION_DENIED" | "OPEN_BREAK" | "INVALID_STATE";
  currentVersion?: number;
  id?: string;
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
  transferAgencyInstructions: TransferAgencyInstruction[];
  registerAccounts: RegisterAccount[];
  walletLinks: WalletLink[];
  registerDeltas: RegisterDelta[];
  registerVersions: RegisterVersion[];
  cashMovements: CashMovement[];
  transferAgencyNavRecords: TransferAgencyNavRecord[];
  tokenEvents: TokenEvent[];
  onChainEvents: OnChainEvent[];
  anchoringEvents: AnchoringEvent[];
  reconciliationBreaks: ReconciliationBreak[];
  evidenceRecords: EvidenceRecord[];
  holderSnapshots: HolderSnapshot[];
  holderSnapshotPositions: HolderSnapshotPosition[];
  settlementLists: SettlementList[];
  settlementListLines: SettlementListLine[];
  workflowState: WorkflowBackendState;
  workflowPullTask: (taskId: string) => WorkflowCommandResult;
  workflowRespondTask: (taskId: string) => WorkflowCommandResult;
  workflowUpdateChecklist: (taskId: string, checklist: Record<string, boolean>) => WorkflowCommandResult;
  workflowMatchTask: (taskId: string, matched: boolean, exception?: string) => WorkflowCommandResult;
  workflowReturnTask: (taskId: string, reason: string) => WorkflowCommandResult;
  workflowSubmitCurrentStep: (taskId: string) => WorkflowCommandResult;
  workflowAcknowledgeTask: (taskId: string) => WorkflowCommandResult;
  workflowReconcileTask: (taskId: string) => WorkflowCommandResult;
  createIssuanceWorkflowFromIssuer: (
    fundId: string,
    actionKey: string,
    expectedVersion?: number,
    idempotencyKey?: string,
  ) => TransferAgencyCommandResult;
  createTransferAgencyInstructionFromIssuer: (
    sourceType: HolderSnapshot["sourceType"],
    sourceReference: string,
    expectedVersion?: number,
    idempotencyKey?: string,
  ) => TransferAgencyCommandResult;
  lockHolderSnapshot: (
    instructionId: string,
    expectedVersion: number,
    idempotencyKey?: string,
  ) => TransferAgencyCommandResult;
  generateRecipientList: (
    snapshotId: string,
    expectedVersion: number,
    idempotencyKey?: string,
  ) => TransferAgencyCommandResult;
  generatePaymentList: (
    snapshotId: string,
    expectedVersion: number,
    idempotencyKey?: string,
  ) => TransferAgencyCommandResult;
  submitSnapshotToIssuerReview: (
    snapshotId: string,
    expectedVersion: number,
    idempotencyKey?: string,
  ) => TransferAgencyCommandResult;
  acknowledgeIssuerReview: (
    snapshotId: string,
    expectedVersion: number,
    idempotencyKey?: string,
  ) => TransferAgencyCommandResult;
  reconcileDistributionPayout: (
    sourceReference: string,
    expectedVersion: number,
    idempotencyKey?: string,
  ) => TransferAgencyCommandResult;
  reconcileRedemptionPayout: (
    sourceReference: string,
    expectedVersion: number,
    idempotencyKey?: string,
  ) => TransferAgencyCommandResult;
  prepareRegisterDelta: (deltaId: string, expectedVersion: number, idempotencyKey?: string) => TransferAgencyCommandResult;
  approveRegisterDelta: (deltaId: string, expectedVersion: number, idempotencyKey?: string) => TransferAgencyCommandResult;
  postRegisterDelta: (deltaId: string, expectedVersion: number, idempotencyKey?: string) => TransferAgencyCommandResult;
  resolveReconciliationBreak: (
    breakId: string,
    expectedVersion: number,
    idempotencyKey?: string,
  ) => TransferAgencyCommandResult;
  waiveReconciliationBreak: (
    breakId: string,
    expectedVersion: number,
    idempotencyKey?: string,
  ) => TransferAgencyCommandResult;
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
    acknowledge: ["issuance", "redemption", "distribution"],
  },
  investor: {
    subscribe: ["marketplace", "order"],
    redeem: ["marketplace", "order"],
    open: ["marketplace"],
    list: ["marketplace"],
  },
  transferAgent: {
    list: ["register", "reconciliation", "evidence", "transfer", "order"],
    review: ["register", "reconciliation", "order"],
    prepare: ["register"],
    lock: ["register"],
    generate: ["register"],
    approve: ["register", "reconciliation"],
    post: ["register"],
    resolve: ["reconciliation"],
    reconcile: ["reconciliation"],
    export: ["evidence"],
    update: ["register", "reconciliation", "evidence", "transfer"],
    manage: ["register", "reconciliation", "evidence", "transfer", "order"],
    open: ["register", "reconciliation", "evidence", "transfer"],
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
  if (normalized.includes("prepare")) return "prepare";
  if (normalized.includes("lock")) return "lock";
  if (normalized.includes("generate")) return "generate";
  if (normalized.includes("acknowledge")) return "acknowledge";
  if (normalized.includes("post")) return "post";
  if (normalized.includes("reconcile")) return "reconcile";
  if (normalized.includes("resolve") || normalized.includes("waive")) return "resolve";
  if (normalized.includes("export")) return "export";
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

function mockHex(input: string, length = 64) {
  const normalized = input.toLowerCase().replace(/[^a-z0-9]/g, "");
  const padded = `${normalized}${"0".repeat(length)}`;
  return `0x${padded.slice(0, length)}`;
}

function mockBlockNumber(input: string) {
  return 2_260_000 + Array.from(input).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 90_000;
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
      distributionElection: "Distribution Reinvestment",
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
      distributionElection: "Cash Distribution",
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
      distributionElection: "Distribution Reinvestment",
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

interface CanonicalPersistedState {
  fundIssuances: FundIssuance[];
  fundRedemptions: FundRedemptionConfig[];
  fundOrders: FundOrder[];
  fundBatches: FundBatch[];
  fundDistributions: FundDistribution[];
  transferAgencyInstructions: TransferAgencyInstruction[];
  registerAccounts: RegisterAccount[];
  registerDeltas: RegisterDelta[];
  registerVersions: RegisterVersion[];
  tokenEvents: TokenEvent[];
  onChainEvents: OnChainEvent[];
  anchoringEvents: AnchoringEvent[];
  reconciliationBreaks: ReconciliationBreak[];
  evidenceRecords: EvidenceRecord[];
  holderSnapshots: HolderSnapshot[];
  holderSnapshotPositions: HolderSnapshotPosition[];
  settlementLists: SettlementList[];
  settlementListLines: SettlementListLine[];
}

const CANONICAL_STORAGE_KEY = "fund-rwa-canonical-state-v2";
const CANONICAL_CHANNEL_NAME = "fund-rwa-canonical";
const AUTH_SESSION_STORAGE_KEY = "fund-rwa-auth-session-v1";

const initialCanonicalState: CanonicalPersistedState = {
  fundIssuances: initialFunds,
  fundRedemptions: initialRedemptions,
  fundOrders: initialFundOrders,
  fundBatches: initialFundBatches,
  fundDistributions: initialDistributions,
  transferAgencyInstructions: initialTransferAgencyInstructions,
  registerAccounts: initialRegisterAccounts,
  registerDeltas: initialRegisterDeltas,
  registerVersions: initialRegisterVersions,
  tokenEvents: initialTokenEvents,
  onChainEvents: initialOnChainEvents,
  anchoringEvents: initialAnchoringEvents,
  reconciliationBreaks: initialReconciliationBreaks,
  evidenceRecords: initialEvidenceRecords,
  holderSnapshots: initialHolderSnapshots,
  holderSnapshotPositions: initialHolderSnapshotPositions,
  settlementLists: initialSettlementLists,
  settlementListLines: initialSettlementListLines,
};

function loadCanonicalState(): CanonicalPersistedState {
  if (typeof window === "undefined") return initialCanonicalState;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CANONICAL_STORAGE_KEY) || "null") as Partial<CanonicalPersistedState> | null;
    if (!parsed) return initialCanonicalState;
    const mergeByKey = <T extends Record<string, unknown>>(seed: T[], saved: T[] | undefined, key: keyof T) => {
      const savedItems = saved || [];
      const savedKeys = new Set(savedItems.map((item) => item[key]));
      return [...savedItems, ...seed.filter((item) => !savedKeys.has(item[key]))];
    };
    return {
      ...initialCanonicalState,
      ...parsed,
      onChainEvents: mergeByKey(initialOnChainEvents, parsed.onChainEvents, "onChainEventId"),
      anchoringEvents: mergeByKey(initialAnchoringEvents, parsed.anchoringEvents, "anchoringEventId"),
    };
  } catch {
    return initialCanonicalState;
  }
}

function broadcastCanonicalState() {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
  const channel = new BroadcastChannel(CANONICAL_CHANNEL_NAME);
  channel.postMessage({ type: "canonical-state-updated", at: new Date().toISOString() });
  channel.close();
}

function defaultAuthSession(): AuthSession {
  return {
    walletAddress: defaultInvestor.wallet,
    signedAt: new Date().toISOString(),
    role: "issuer",
    isSimulated: true,
  };
}

function loadAuthSession(): AuthSession {
  if (typeof window === "undefined") return defaultAuthSession();
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY) || "null") as AuthSession | null;
    if (!parsed?.role || !parsed.walletAddress || !parsed.signedAt) return defaultAuthSession();
    return parsed;
  } catch {
    return defaultAuthSession();
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const persistedCanonical = loadCanonicalState();
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => loadAuthSession());
  const [fundIssuances, setFundIssuances] = useState<FundIssuance[]>(persistedCanonical.fundIssuances);
  const [fundRedemptions, setFundRedemptions] = useState<FundRedemptionConfig[]>(persistedCanonical.fundRedemptions);
  const [fundOrders, setFundOrders] = useState<FundOrder[]>(persistedCanonical.fundOrders);
  const [fundBatches, setFundBatches] = useState<FundBatch[]>(persistedCanonical.fundBatches);
  const [fundDistributions, setFundDistributions] = useState<FundDistribution[]>(persistedCanonical.fundDistributions);
  const [transferAgencyInstructions, setTransferAgencyInstructions] =
    useState<TransferAgencyInstruction[]>(persistedCanonical.transferAgencyInstructions);
  const [registerAccounts, setRegisterAccounts] = useState<RegisterAccount[]>(persistedCanonical.registerAccounts);
  const [walletLinks] = useState<WalletLink[]>(initialWalletLinks);
  const [registerDeltas, setRegisterDeltas] = useState<RegisterDelta[]>(persistedCanonical.registerDeltas);
  const [registerVersions, setRegisterVersions] = useState<RegisterVersion[]>(persistedCanonical.registerVersions);
  const [cashMovements] = useState<CashMovement[]>(initialCashMovements);
  const [transferAgencyNavRecords] = useState<TransferAgencyNavRecord[]>(initialTransferAgencyNavRecords);
  const [tokenEvents, setTokenEvents] = useState<TokenEvent[]>(persistedCanonical.tokenEvents);
  const [onChainEvents, setOnChainEvents] = useState<OnChainEvent[]>(persistedCanonical.onChainEvents);
  const [anchoringEvents, setAnchoringEvents] = useState<AnchoringEvent[]>(persistedCanonical.anchoringEvents);
  const [reconciliationBreaks, setReconciliationBreaks] =
    useState<ReconciliationBreak[]>(persistedCanonical.reconciliationBreaks);
  const [evidenceRecords, setEvidenceRecords] = useState<EvidenceRecord[]>(persistedCanonical.evidenceRecords);
  const [holderSnapshots, setHolderSnapshots] = useState<HolderSnapshot[]>(persistedCanonical.holderSnapshots);
  const [holderSnapshotPositions, setHolderSnapshotPositions] =
    useState<HolderSnapshotPosition[]>(persistedCanonical.holderSnapshotPositions);
  const [settlementLists, setSettlementLists] = useState<SettlementList[]>(persistedCanonical.settlementLists);
  const [settlementListLines, setSettlementListLines] = useState<SettlementListLine[]>(persistedCanonical.settlementListLines);
  const [workflowState, setWorkflowState] = useState<WorkflowBackendState>(() => loadWorkflowState());
  const canonicalSyncRef = useRef<string>("");
  const workflowSyncRef = useRef<string>(JSON.stringify(workflowState));

  const applyCanonicalState = (next: CanonicalPersistedState) => {
    setFundIssuances(next.fundIssuances);
    setFundRedemptions(next.fundRedemptions);
    setFundOrders(next.fundOrders);
    setFundBatches(next.fundBatches);
    setFundDistributions(next.fundDistributions);
    setTransferAgencyInstructions(next.transferAgencyInstructions);
    setRegisterAccounts(next.registerAccounts);
    setRegisterDeltas(next.registerDeltas);
    setRegisterVersions(next.registerVersions);
    setTokenEvents(next.tokenEvents);
    setOnChainEvents(next.onChainEvents);
    setAnchoringEvents(next.anchoringEvents);
    setReconciliationBreaks(next.reconciliationBreaks);
    setEvidenceRecords(next.evidenceRecords);
    setHolderSnapshots(next.holderSnapshots);
    setHolderSnapshotPositions(next.holderSnapshotPositions);
    setSettlementLists(next.settlementLists);
    setSettlementListLines(next.settlementListLines);
  };

  const refreshCanonicalStateFromStorage = () => {
    const next = loadCanonicalState();
    const serialized = JSON.stringify(next);
    if (serialized === canonicalSyncRef.current) return;
    canonicalSyncRef.current = serialized;
    applyCanonicalState(next);
  };

  const applyWorkflowState = (next: WorkflowBackendState) => {
    const serialized = JSON.stringify(next);
    if (serialized === workflowSyncRef.current) return;
    workflowSyncRef.current = serialized;
    setWorkflowState(next);
  };

  const refreshWorkflowStateFromStorage = () => {
    applyWorkflowState(loadWorkflowState());
  };

  const refreshMockBackendStateFromStorage = () => {
    refreshCanonicalStateFromStorage();
    refreshWorkflowStateFromStorage();
  };

  useEffect(() => subscribeWorkflowState(applyWorkflowState), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (event: StorageEvent) => {
      if (event.key === CANONICAL_STORAGE_KEY) refreshCanonicalStateFromStorage();
    };
    window.addEventListener("storage", onStorage);
    let channel: BroadcastChannel | null = null;
    if ("BroadcastChannel" in window) {
      channel = new BroadcastChannel(CANONICAL_CHANNEL_NAME);
      channel.onmessage = refreshCanonicalStateFromStorage;
    }
    return () => {
      window.removeEventListener("storage", onStorage);
      channel?.close();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    if (authSession) {
      window.sessionStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(authSession));
    } else {
      window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    }
  }, [authSession]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onVisibleOrFocused = () => refreshMockBackendStateFromStorage();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshMockBackendStateFromStorage();
    };
    window.addEventListener("focus", onVisibleOrFocused);
    window.addEventListener("pageshow", onVisibleOrFocused);
    document.addEventListener("visibilitychange", onVisibilityChange);
    const intervalId = window.setInterval(refreshMockBackendStateFromStorage, 1500);
    return () => {
      window.removeEventListener("focus", onVisibleOrFocused);
      window.removeEventListener("pageshow", onVisibleOrFocused);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const next: CanonicalPersistedState = {
      fundIssuances,
      fundRedemptions,
      fundOrders,
      fundBatches,
      fundDistributions,
      transferAgencyInstructions,
      registerAccounts,
      registerDeltas,
      registerVersions,
      tokenEvents,
      onChainEvents,
      anchoringEvents,
      reconciliationBreaks,
      evidenceRecords,
      holderSnapshots,
      holderSnapshotPositions,
      settlementLists,
      settlementListLines,
    };
    const serialized = JSON.stringify(next);
    if (serialized === canonicalSyncRef.current) return;
    canonicalSyncRef.current = serialized;
    window.localStorage.setItem(CANONICAL_STORAGE_KEY, serialized);
    broadcastCanonicalState();
  }, [
    evidenceRecords,
    fundBatches,
    fundDistributions,
    fundIssuances,
    fundOrders,
    fundRedemptions,
    holderSnapshotPositions,
    holderSnapshots,
    onChainEvents,
    anchoringEvents,
    reconciliationBreaks,
    registerAccounts,
    registerDeltas,
    registerVersions,
    settlementListLines,
    settlementLists,
    tokenEvents,
    transferAgencyInstructions,
  ]);

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

  const transferAgencyAuditFields = (action: string, actorRole: ActorRole = authSession?.role || "issuer") => ({
    lastAction: action,
    lastActorRole: actorRole,
    lastActionAt: new Date().toISOString(),
  });

  const recordAnchoringEvent = (event: Omit<AnchoringEvent, "createdAt" | "version" | "actorRole">) => {
    setAnchoringEvents((prev) => {
      const existing = prev.find(
        (item) =>
          item.anchorType === event.anchorType &&
          item.targetId === event.targetId &&
          item.sourceReference === event.sourceReference,
      );
      if (existing) return prev;
      const now = new Date().toISOString();
      return [
        {
          ...event,
          actorRole: authSession?.role || undefined,
          createdAt: now,
          version: 1,
        },
        ...prev,
      ];
    });
  };

  const recordOnChainEvent = (event: Omit<OnChainEvent, "createdAt" | "version" | "actorRole">) => {
    setOnChainEvents((prev) => {
      const existing = prev.find(
        (item) =>
          item.eventType === event.eventType &&
          item.sourceReference === event.sourceReference &&
          item.idempotencyKey === event.idempotencyKey,
      );
      if (existing) return prev;
      return [
        {
          ...event,
          actorRole: authSession?.role || undefined,
          createdAt: new Date().toISOString(),
          version: 1,
        },
        ...prev,
      ];
    });
  };

  const anchorRegisterVersion = (registerVersionId: string, delta: RegisterDelta) => {
    recordAnchoringEvent({
      anchoringEventId: `anchor-register-${registerVersionId}`.replace(/[^a-zA-Z0-9-]/g, "-"),
      anchorType: "RegisterVersion",
      sourceType: "Register",
      sourceReference: registerVersionId,
      targetId: registerVersionId,
      fundId: delta.fundId,
      classId: delta.classId,
      chainId: "wb-hk-chain",
      contentHash: mockHex(`register-version:${registerVersionId}:${delta.deltaId}`),
      txHash: mockHex(`tx:anchor:register:${registerVersionId}`),
      blockNumber: mockBlockNumber(registerVersionId),
      status: "Confirmed",
      idempotencyKey: `Anchor:RegisterVersion:${registerVersionId}`,
      anchoredAt: new Date().toISOString(),
    });
  };

  const anchorSnapshotArtifact = (snapshot: HolderSnapshot, anchorType: AnchoringEvent["anchorType"], targetId: string) => {
    recordAnchoringEvent({
      anchoringEventId: `anchor-${anchorType.toLowerCase()}-${targetId}`.replace(/[^a-zA-Z0-9-]/g, "-"),
      anchorType,
      sourceType: snapshot.sourceType,
      sourceReference: snapshot.sourceReference,
      targetId,
      fundId: snapshot.fundId,
      classId: snapshot.classId,
      chainId: "wb-hk-chain",
      contentHash: mockHex(`${anchorType}:${snapshot.snapshotId}:${targetId}:${snapshot.registerVersionId}`),
      merkleRoot: ["HolderSnapshot", "SettlementList", "EvidencePack"].includes(anchorType)
        ? mockHex(`root:${anchorType}:${snapshot.snapshotId}:${targetId}`)
        : undefined,
      txHash: mockHex(`tx:anchor:${anchorType}:${targetId}`),
      blockNumber: mockBlockNumber(`${anchorType}:${targetId}`),
      status: "Confirmed",
      idempotencyKey: `Anchor:${anchorType}:${targetId}`,
      anchoredAt: new Date().toISOString(),
    });
  };

  const recordDistributionOnChain = (distribution: FundDistribution, eventType: OnChainEvent["eventType"]) => {
    const sourceReference = distribution.id;
    const fundId = distribution.fundId || "fund-pending";
    const latestRegister = distribution.fundId ? getLatestRegisterVersionForFund(distribution.fundId) : undefined;
    const snapshot = holderSnapshots.find((item) => item.sourceType === "Distribution" && item.sourceReference === sourceReference);
    const list = snapshot ? settlementLists.find((item) => item.snapshotId === snapshot.snapshotId) : undefined;
    recordOnChainEvent({
      onChainEventId: `chain-${eventType.toLowerCase()}-${sourceReference}`.replace(/[^a-zA-Z0-9-]/g, "-"),
      sourceType: "Distribution",
      sourceReference,
      eventType,
      fundId,
      classId: latestRegister?.classId,
      chainId: "wb-hk-chain",
      contractAddress: distribution.tokenAddress,
      method:
        eventType === "DistributionClaimOpen"
          ? "openClaim"
          : eventType === "DistributionTransferBatch"
            ? "batchTransfer"
            : "postPayoutInstruction",
      txHash: mockHex(`tx:${eventType}:${sourceReference}`),
      blockNumber: mockBlockNumber(`${eventType}:${sourceReference}`),
      status: "Confirmed",
      payloadHash: mockHex(`payload:${eventType}:${sourceReference}:${list?.listId || "no-list"}`),
      merkleRoot: list ? mockHex(`root:settlement-list:${list.listId}`) : undefined,
      amount: distribution.distributionRate,
      currency: distribution.payoutToken || distribution.distributionUnit || "HKD",
      idempotencyKey: `OnChain:${sourceReference}:${eventType}`,
      confirmedAt: new Date().toISOString(),
    });
  };

  const recordRedemptionBurnOnChain = (redemption: FundRedemptionConfig) => {
    const snapshot = holderSnapshots.find((item) => item.sourceType === "Redemption" && item.sourceReference === redemption.id);
    const list = snapshot ? settlementLists.find((item) => item.snapshotId === snapshot.snapshotId) : undefined;
    const burnedUnits = snapshot
      ? holderSnapshotPositions
          .filter((position) => position.snapshotId === snapshot.snapshotId && position.included)
          .reduce((sum, position) => sum + parseLeadingNumber(position.units), 0)
      : 0;
    recordOnChainEvent({
      onChainEventId: `chain-burn-${redemption.id}`.replace(/[^a-zA-Z0-9-]/g, "-"),
      sourceType: "Redemption",
      sourceReference: redemption.id,
      eventType: "FundUnitBurn",
      fundId: redemption.fundId,
      classId: snapshot?.classId,
      chainId: "wb-hk-chain",
      contractAddress: redemption.tokenAddress,
      method: "burnFrom",
      txHash: mockHex(`tx:burn:${redemption.id}`),
      blockNumber: mockBlockNumber(`burn:${redemption.id}`),
      status: "Confirmed",
      payloadHash: mockHex(`payload:burn:${redemption.id}:${list?.listId || "no-list"}`),
      merkleRoot: list ? mockHex(`root:payment-list:${list.listId}`) : undefined,
      amount: burnedUnits ? `${formatDemoNumber(burnedUnits, 2)} units` : undefined,
      currency: redemption.fundToken,
      idempotencyKey: `OnChain:${redemption.id}:FundUnitBurn`,
      confirmedAt: new Date().toISOString(),
    });
  };

  const recordIssuanceMintOnChain = (fund: FundIssuance) => {
    recordOnChainEvent({
      onChainEventId: `chain-mint-${fund.id}`.replace(/[^a-zA-Z0-9-]/g, "-"),
      sourceType: "Issuance",
      sourceReference: fund.id,
      eventType: "FundUnitMint",
      fundId: fund.id,
      classId: fund.shareClass,
      chainId: "wb-hk-chain",
      contractAddress: fund.tokenAddress,
      method: "mintBatch",
      txHash: mockHex(`tx:mint:${fund.id}`),
      blockNumber: mockBlockNumber(`mint:${fund.id}`),
      status: "Confirmed",
      payloadHash: mockHex(`payload:mint:${fund.id}:${fund.allocationStatus || "allocation"}`),
      amount: fund.totalSubscribedAmount,
      currency: fund.tokenSymbol || fund.tokenName,
      idempotencyKey: `OnChain:${fund.id}:FundUnitMint`,
      confirmedAt: new Date().toISOString(),
    });
  };

  const buildCommandDeniedResult = (): TransferAgencyCommandResult => ({
    success: false,
    error: "PERMISSION_DENIED",
    message: "The current role cannot perform this transfer-agency action.",
  });

  const assertExpectedVersion = (
    currentVersion: number,
    expectedVersion: number,
  ): TransferAgencyCommandResult | null => {
    if (currentVersion === expectedVersion) return null;
    return {
      success: false,
      error: "VERSION_CONFLICT",
      currentVersion,
      message: "This record changed after it was opened. Refresh the task before continuing.",
    };
  };

  const updateInstructionStatus = (
    instructionId: string,
    status: TransferAgencyInstruction["status"],
    action: string,
  ) => {
    setTransferAgencyInstructions((prev) =>
      prev.map((instruction) =>
        instruction.instructionId === instructionId
          ? {
              ...instruction,
              status,
              updatedAt: new Date().toISOString(),
              version: instruction.version + 1,
              ...transferAgencyAuditFields(action),
            }
          : instruction,
      ),
    );
  };

  const getLatestRegisterVersionForFund = (fundId: string) =>
    [...registerVersions]
      .filter((version) => version.fundId === fundId)
      .sort((left, right) => (right.releasedAt || right.effectiveAt).localeCompare(left.releasedAt || left.effectiveAt))[0];

  const getSnapshotSourceConfig = (sourceType: HolderSnapshot["sourceType"], sourceReference: string) => {
    if (sourceType === "Distribution") {
      const distribution = fundDistributions.find((item) => item.id === sourceReference);
      const fundId = distribution?.fundId;
      const latestRegister = fundId ? getLatestRegisterVersionForFund(fundId) : undefined;
      return distribution && fundId
        ? {
            source: distribution,
            fundId,
            classId: latestRegister?.classId || "REA-HKD",
            recordDate: distribution.recordDate || distribution.createdTime || new Date().toISOString(),
            registerVersionId: latestRegister?.registerVersionId || `REG-${fundId}-PENDING`,
            resource: "distribution" as const,
          }
        : null;
    }

    const redemption = fundRedemptions.find((item) => item.id === sourceReference);
    const fundId = redemption?.fundId;
    const latestRegister = fundId ? getLatestRegisterVersionForFund(fundId) : undefined;
    return redemption && fundId
      ? {
          source: redemption,
          fundId,
          classId: latestRegister?.classId || "REA-HKD",
          recordDate: redemption.windowEnd || redemption.effectiveDate || new Date().toISOString(),
          registerVersionId: latestRegister?.registerVersionId || `REG-${fundId}-PENDING`,
          resource: "redemption" as const,
        }
      : null;
  };

  const getInstructionSourceType = (instruction: TransferAgencyInstruction): HolderSnapshot["sourceType"] =>
    instruction.instructionType === "Redemption" ? "Redemption" : "Distribution";

  const buildRequestedSnapshot = (
    instruction: TransferAgencyInstruction,
    idempotencyKey: string,
    actorRole: ActorRole = authSession?.role || "issuer",
  ): HolderSnapshot | null => {
    if (!instruction.sourceReference) return null;
    const sourceType = getInstructionSourceType(instruction);
    const sourceConfig = getSnapshotSourceConfig(sourceType, instruction.sourceReference);
    if (!sourceConfig) return null;
    const snapshotKey = `${sourceType.toLowerCase()}-${instruction.sourceReference}`.replace(/[^a-zA-Z0-9-]/g, "-");
    return {
      snapshotId: `snap-${snapshotKey}`,
      sourceType,
      sourceReference: instruction.sourceReference,
      instructionId: instruction.instructionId,
      fundId: sourceConfig.fundId,
      classId: sourceConfig.classId,
      registerVersionId: sourceConfig.registerVersionId,
      recordDate: sourceConfig.recordDate,
      status: "Requested",
      idempotencyKey,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      ...transferAgencyAuditFields("submit", actorRole),
    };
  };

  const ensureRequestedSnapshot = (
    instruction: TransferAgencyInstruction,
    idempotencyKey: string,
    actorRole: ActorRole = authSession?.role || "issuer",
  ): string | null => {
    const existing = holderSnapshots.find((snapshot) => snapshot.instructionId === instruction.instructionId);
    if (existing) return existing.snapshotId;
    const snapshot = buildRequestedSnapshot(instruction, idempotencyKey, actorRole);
    if (!snapshot) return null;
    setHolderSnapshots((prev) =>
      prev.some((item) => item.snapshotId === snapshot.snapshotId || item.instructionId === instruction.instructionId)
        ? prev
        : [snapshot, ...prev],
    );
    return snapshot.snapshotId;
  };

  const createIssuanceWorkflowFromIssuer = (
    fundId: string,
    actionKey: string,
    expectedVersion?: number,
    idempotencyKey = `IssuerPortal:${fundId}:${actionKey}:IssuanceHandoff:${formatDateTag(new Date())}`,
  ): TransferAgencyCommandResult => {
    const fund = fundIssuances.find((item) => item.id === fundId);
    if (!fund) return { success: false, error: "NOT_FOUND", message: "Issuance source was not found." };
    if (!ensureIdentitySource("authSession") || !ensurePermission("submit", "issuance")) {
      return buildCommandDeniedResult();
    }
    void expectedVersion;

    const sourceReference = `${fundId}--${actionKey}`.replace(/[^a-zA-Z0-9-]/g, "-");
    const instructionId = `instr-issuance-${sourceReference}-ta`.replace(/[^a-zA-Z0-9-]/g, "-");
    const latestRegister = getLatestRegisterVersionForFund(fundId);
    const result = createIssuerWorkflowInstruction({
      sourceType: "Issuance",
      sourceReference,
      instructionId,
      fundId,
      classId: latestRegister?.classId || fund.shareClass || "Issuance",
      actorRole: authSession!.role!,
      idempotencyKey,
    });
    refreshWorkflowStateFromStorage();
    return {
      success: result.success,
      id: instructionId,
      message: result.message || `Transfer-agent issuance workflow created for ${fund.name}.`,
      error: result.error,
    };
  };

  const createTransferAgencyInstructionFromIssuer = (
    sourceType: HolderSnapshot["sourceType"],
    sourceReference: string,
    expectedVersion?: number,
    idempotencyKey = `IssuerPortal:${sourceReference}:${sourceType}Handoff:${formatDateTag(new Date())}`,
  ): TransferAgencyCommandResult => {
    const sourceConfig = getSnapshotSourceConfig(sourceType, sourceReference);
    if (!sourceConfig) return { success: false, error: "NOT_FOUND", message: `${sourceType} source was not found.` };
    if (!ensureIdentitySource("authSession") || !ensurePermission("submit", sourceConfig.resource)) {
      return buildCommandDeniedResult();
    }
    void expectedVersion;

    const existing = transferAgencyInstructions.find(
      (instruction) =>
        instruction.sourceActorType === "Issuer" &&
        instruction.sourceReference === sourceReference &&
        ((sourceType === "Distribution" && instruction.instructionType === "RecordDate") ||
          (sourceType === "Redemption" && instruction.instructionType === "Redemption")),
    );
    if (existing) {
      const snapshotId = ensureRequestedSnapshot(existing, idempotencyKey);
      createIssuerWorkflowInstruction({
        sourceType,
        sourceReference,
        instructionId: existing.instructionId,
        snapshotId: snapshotId || undefined,
        fundId: sourceConfig.fundId,
        classId: sourceConfig.classId,
        actorRole: authSession!.role!,
        idempotencyKey,
      });
      refreshWorkflowStateFromStorage();
      return {
        success: true,
        id: existing.instructionId,
        message: `Transfer-agent instruction already exists${snapshotId ? ` with ${snapshotId}` : ""}.`,
      };
    }

    const instructionId = `instr-${sourceType.toLowerCase()}-${sourceReference}-ta`.replace(/[^a-zA-Z0-9-]/g, "-");
    const now = new Date().toISOString();
    const instruction: TransferAgencyInstruction = {
      instructionId,
      instructionType: sourceType === "Distribution" ? "RecordDate" : "Redemption",
      fundId: sourceConfig.fundId,
      classId: sourceConfig.classId,
      sourceActorType: "Issuer",
      sourceActorId: "issuer-demo",
      sourceChannel: "IssuerPortal",
      sourceReference,
      idempotencyKey,
      status: "ReadyForRegisterReview",
      evidenceRefIds: [],
      createdAt: now,
      updatedAt: now,
      version: 1,
      ...transferAgencyAuditFields("submit"),
    };
    setTransferAgencyInstructions((prev) => [instruction, ...prev]);
    const snapshot = buildRequestedSnapshot(instruction, idempotencyKey);
    if (snapshot) setHolderSnapshots((prev) => [snapshot, ...prev]);
    createIssuerWorkflowInstruction({
      sourceType,
      sourceReference,
      instructionId,
      snapshotId: snapshot?.snapshotId,
      fundId: sourceConfig.fundId,
      classId: sourceConfig.classId,
      actorRole: authSession!.role!,
      idempotencyKey,
    });
    refreshWorkflowStateFromStorage();
    return { success: true, id: instructionId, message: `Transfer-agent instruction created for ${sourceReference}.` };
  };

  const repairTransferAgencyWorkflow = (
    sourceType: HolderSnapshot["sourceType"],
    sourceReference: string,
    idempotencyKey = `SystemRepair:${sourceReference}:${sourceType}Workflow:${formatDateTag(new Date())}`,
  ) => {
    const sourceConfig = getSnapshotSourceConfig(sourceType, sourceReference);
    if (!sourceConfig) return false;

    const existingInstruction = transferAgencyInstructions.find(
      (instruction) =>
        instruction.sourceActorType === "Issuer" &&
        instruction.sourceReference === sourceReference &&
        ((sourceType === "Distribution" && instruction.instructionType === "RecordDate") ||
          (sourceType === "Redemption" && instruction.instructionType === "Redemption")),
    );
    const now = new Date().toISOString();
    const instruction =
      existingInstruction ||
      ({
        instructionId: `instr-${sourceType.toLowerCase()}-${sourceReference}-ta`.replace(/[^a-zA-Z0-9-]/g, "-"),
        instructionType: sourceType === "Distribution" ? "RecordDate" : "Redemption",
        fundId: sourceConfig.fundId,
        classId: sourceConfig.classId,
        sourceActorType: "Issuer",
        sourceActorId: "issuer-demo",
        sourceChannel: "IssuerPortal",
        sourceReference,
        idempotencyKey,
        status: "ReadyForRegisterReview",
        evidenceRefIds: [],
        createdAt: now,
        updatedAt: now,
        version: 1,
        ...transferAgencyAuditFields("submit", "issuer"),
      } satisfies TransferAgencyInstruction);

    if (!existingInstruction) {
      setTransferAgencyInstructions((prev) =>
        prev.some((item) => item.instructionId === instruction.instructionId) ? prev : [instruction, ...prev],
      );
    }
    const snapshotId = ensureRequestedSnapshot(instruction, idempotencyKey, "issuer");
    createIssuerWorkflowInstruction({
      sourceType,
      sourceReference,
      instructionId: instruction.instructionId,
      snapshotId: snapshotId || undefined,
      fundId: sourceConfig.fundId,
      classId: sourceConfig.classId,
      actorRole: "issuer",
      idempotencyKey,
    });
    refreshWorkflowStateFromStorage();
    return true;
  };

  useEffect(() => {
    const taOwnedDistributionStatuses = new Set(["Snapshot Locked", "Pending Allocation"]);
    fundDistributions.forEach((distribution) => {
      if (!taOwnedDistributionStatuses.has(distribution.status)) return;
      if (workflowState.instances.some((item) => item.sourceType === "Distribution" && item.sourceReference === distribution.id)) {
        return;
      }
      repairTransferAgencyWorkflow("Distribution", distribution.id);
    });
  }, [fundDistributions, workflowState.instances, transferAgencyInstructions, holderSnapshots]);

  const buildSnapshotPositions = (snapshot: HolderSnapshot): HolderSnapshotPosition[] => {
    const accounts = registerAccounts.filter((account) => account.fundId === snapshot.fundId);
    const distribution = snapshot.sourceType === "Distribution"
      ? fundDistributions.find((item) => item.id === snapshot.sourceReference)
      : undefined;
    const redemption = snapshot.sourceType === "Redemption"
      ? fundRedemptions.find((item) => item.id === snapshot.sourceReference)
      : undefined;
    const redemptionRequests = redemption
      ? fundOrders.filter((order) => order.fundId === redemption.fundId && order.type === "redemption" && order.status !== "Rejected")
      : [];
    const distributionRate = parseLeadingNumber(distribution?.distributionRate);
    const distributionCurrency = distribution?.distributionUnit || distribution?.payoutToken || "HKD";
    const navValue = parseLeadingNumber(distribution?.initialNav || redemption?.latestNav || getLatestRegisterVersionForFund(snapshot.fundId)?.totalUnits);

    return accounts.map((account) => {
      const wallet = walletLinks.find((link) => link.registerAccountId === account.registerAccountId);
      const units = parseLeadingNumber(account.units);
      const redemptionOrder = redemptionRequests.find((order) => order.investorName === account.holderName);
      const isClosedOrSuspended = ["Closed", "Suspended"].includes(account.accountStatus);
      const included = snapshot.sourceType === "Redemption" ? Boolean(redemptionOrder) && !isClosedOrSuspended : !isClosedOrSuspended;
      const entitlement =
        snapshot.sourceType === "Distribution" && included
          ? distribution?.distributionRateType === "Fixed Rate"
            ? units * navValue * (distributionRate / 100)
            : units * distributionRate
          : 0;
      return {
        positionId: `pos-${snapshot.snapshotId}-${account.registerAccountId}`,
        snapshotId: snapshot.snapshotId,
        registerAccountId: account.registerAccountId,
        holderName: account.holderName,
        holderId: account.holderId,
        units: account.units,
        walletAddress: wallet?.walletAddress || "No wallet linked",
        restrictionStatus: account.accountStatus,
        included,
        exclusionReason: included
          ? undefined
          : snapshot.sourceType === "Redemption" && !redemptionOrder
            ? "No accepted redemption request"
            : `Account ${account.accountStatus.toLowerCase()}`,
        entitlementAmount:
          snapshot.sourceType === "Distribution" && included
            ? `${formatDemoNumber(entitlement, 2)} ${distributionCurrency}`
            : undefined,
        cashAmount:
          snapshot.sourceType === "Redemption" && included
            ? redemptionOrder?.confirmedSharesOrCash || redemptionOrder?.estimatedSharesOrCash
            : undefined,
        version: 1,
      };
    });
  };

  const createSnapshotEvidence = (snapshot: HolderSnapshot, label: string) => {
    const evidenceRefId = `ev-snapshot-${snapshot.snapshotId}`;
    setEvidenceRecords((prev) => {
      if (prev.some((evidence) => evidence.evidenceRefId === evidenceRefId)) return prev;
      return [
        {
          evidenceRefId,
          fundId: snapshot.fundId,
          classId: snapshot.classId,
          instructionId: snapshot.instructionId,
          evidenceType: "RegisterVersion",
          label,
          contentHash: `0x${snapshot.snapshotId.toLowerCase().replace(/[^a-z0-9]/g, "").slice(-24)}`,
          sourceActorType: "TransferAgent",
          sourceActorId: "ta-snapshot-desk",
          createdAt: new Date().toISOString(),
          retentionClass: "Regulatory",
          version: 1,
        },
        ...prev,
      ];
    });
  };

  const lockHolderSnapshot = (
    instructionId: string,
    expectedVersion: number,
    idempotencyKey = `TAConsole:${instructionId}:LockSnapshot:${formatDateTag(new Date())}`,
  ): TransferAgencyCommandResult => {
    if (!ensureIdentitySource("authSession") || !ensurePermission("lock", "register")) {
      return buildCommandDeniedResult();
    }
    const instruction = transferAgencyInstructions.find((item) => item.instructionId === instructionId);
    if (!instruction) return { success: false, error: "NOT_FOUND", message: "Transfer-agent instruction was not found." };
    const conflict = assertExpectedVersion(instruction.version, expectedVersion);
    if (conflict) return conflict;
    const snapshotId = ensureRequestedSnapshot(instruction, idempotencyKey);
    const snapshot = holderSnapshots.find((item) => item.snapshotId === snapshotId) || buildRequestedSnapshot(instruction, idempotencyKey);
    if (!snapshot) return { success: false, error: "INVALID_STATE", message: "Snapshot source is not ready." };
    if (snapshot.status !== "Requested") {
      return { success: true, id: snapshot.snapshotId, message: "Holder snapshot is already locked or advanced." };
    }
    const now = new Date().toISOString();
    setHolderSnapshots((prev) =>
      prev.map((item) =>
        item.snapshotId === snapshot.snapshotId
          ? {
              ...item,
              status: "Locked",
              lockedAt: now,
              idempotencyKey,
              updatedAt: now,
              version: item.version + 1,
              ...transferAgencyAuditFields("lock"),
            }
          : item,
      ),
    );
    setHolderSnapshotPositions((prev) => {
      if (prev.some((position) => position.snapshotId === snapshot.snapshotId)) return prev;
      return [...buildSnapshotPositions(snapshot), ...prev];
    });
    createSnapshotEvidence(snapshot, `Locked ${snapshot.sourceType.toLowerCase()} holder snapshot ${snapshot.snapshotId}`);
    anchorSnapshotArtifact(snapshot, "HolderSnapshot", snapshot.snapshotId);
    updateInstructionStatus(instruction.instructionId, "SnapshotLocked", "lock");
    return { success: true, id: snapshot.snapshotId, message: `Holder snapshot ${snapshot.snapshotId} locked.` };
  };

  const generateSettlementList = (
    snapshotId: string,
    expectedVersion: number,
    listType: SettlementList["listType"],
    idempotencyKey: string,
  ): TransferAgencyCommandResult => {
    if (!ensureIdentitySource("authSession") || !ensurePermission("generate", "register")) {
      return buildCommandDeniedResult();
    }
    const snapshot = holderSnapshots.find((item) => item.snapshotId === snapshotId);
    if (!snapshot) return { success: false, error: "NOT_FOUND", message: "Holder snapshot was not found." };
    const conflict = assertExpectedVersion(snapshot.version, expectedVersion);
    if (conflict) return conflict;
    if (snapshot.status === "Requested") {
      return { success: false, error: "INVALID_STATE", message: "Lock the holder snapshot before generating the list." };
    }
    const existing = settlementLists.find((list) => list.snapshotId === snapshotId && list.listType === listType);
    if (existing) return { success: true, id: existing.listId, message: `${listType} is already generated.` };
    const positions = holderSnapshotPositions.filter((position) => position.snapshotId === snapshotId && position.included);
    const now = new Date().toISOString();
    const listId = `list-${listType === "RecipientList" ? "recipient" : "payment"}-${snapshotId}`;
    const list: SettlementList = {
      listId,
      listType,
      snapshotId,
      sourceType: snapshot.sourceType,
      sourceReference: snapshot.sourceReference,
      status: "Generated",
      generatedAt: now,
      idempotencyKey,
      createdAt: now,
      updatedAt: now,
      version: 1,
      ...transferAgencyAuditFields("generate"),
    };
    const lines: SettlementListLine[] = positions.map((position) => {
      const redemptionOrder = fundOrders.find(
        (order) => order.fundId === snapshot.fundId && order.type === "redemption" && order.investorName === position.holderName,
      );
      return {
        lineId: `line-${listId}-${position.registerAccountId}`,
        listId,
        snapshotId,
        holderSnapshotPositionId: position.positionId,
        registerAccountId: position.registerAccountId,
        holderName: position.holderName,
        amount: listType === "RecipientList" ? position.entitlementAmount || "0 HKD" : position.cashAmount || "0 HKD",
        currency: (listType === "RecipientList" ? position.entitlementAmount : position.cashAmount)?.split(" ").at(-1) || "HKD",
        destination: listType === "RecipientList" ? position.walletAddress : redemptionOrder?.investorWallet || position.walletAddress,
        status: "Ready",
        evidenceRefIds: [`ev-snapshot-${snapshot.snapshotId}`],
        version: 1,
      };
    });
    setSettlementLists((prev) => [list, ...prev]);
    setSettlementListLines((prev) => [...lines, ...prev]);
    anchorSnapshotArtifact(snapshot, "SettlementList", list.listId);
    updateInstructionStatus(snapshot.instructionId, "ListGenerated", "generate");
    return { success: true, id: listId, message: `${listType} generated from ${snapshot.snapshotId}.` };
  };

  const generateRecipientList = (
    snapshotId: string,
    expectedVersion: number,
    idempotencyKey = `TAConsole:${snapshotId}:GenerateRecipientList:${formatDateTag(new Date())}`,
  ) => generateSettlementList(snapshotId, expectedVersion, "RecipientList", idempotencyKey);

  const generatePaymentList = (
    snapshotId: string,
    expectedVersion: number,
    idempotencyKey = `TAConsole:${snapshotId}:GeneratePaymentList:${formatDateTag(new Date())}`,
  ) => generateSettlementList(snapshotId, expectedVersion, "PaymentList", idempotencyKey);

  const submitSnapshotToIssuerReview = (
    snapshotId: string,
    expectedVersion: number,
    idempotencyKey = `TAConsole:${snapshotId}:SubmitIssuerReview:${formatDateTag(new Date())}`,
  ): TransferAgencyCommandResult => {
    if (!ensureIdentitySource("authSession") || !ensurePermission("review", "register")) {
      return buildCommandDeniedResult();
    }
    const snapshot = holderSnapshots.find((item) => item.snapshotId === snapshotId);
    if (!snapshot) return { success: false, error: "NOT_FOUND", message: "Holder snapshot was not found." };
    const conflict = assertExpectedVersion(snapshot.version, expectedVersion);
    if (conflict) return conflict;
    const list = settlementLists.find((item) => item.snapshotId === snapshotId);
    if (!list) return { success: false, error: "INVALID_STATE", message: "Generate the settlement list first." };
    if (snapshot.status === "SubmittedToIssuer" || snapshot.status === "IssuerAcknowledged" || snapshot.status === "Reconciled") {
      return { success: true, id: snapshotId, message: "Snapshot has already been submitted to issuer review." };
    }
    const now = new Date().toISOString();
    setHolderSnapshots((prev) =>
      prev.map((item) =>
        item.snapshotId === snapshotId
          ? {
              ...item,
              status: "SubmittedToIssuer",
              submittedToIssuerAt: now,
              idempotencyKey,
              updatedAt: now,
              version: item.version + 1,
              ...transferAgencyAuditFields("review"),
            }
          : item,
      ),
    );
    setSettlementLists((prev) =>
      prev.map((item) =>
        item.snapshotId === snapshotId
          ? {
              ...item,
              status: "SubmittedToIssuer",
              submittedToIssuerAt: now,
              updatedAt: now,
              version: item.version + 1,
              ...transferAgencyAuditFields("review"),
            }
          : item,
      ),
    );
    anchorSnapshotArtifact(snapshot, "EvidencePack", `evidence-pack-${snapshotId}`);
    updateInstructionStatus(snapshot.instructionId, "SubmittedToIssuer", "review");
    return { success: true, id: snapshotId, message: "Snapshot and list submitted to issuer review." };
  };

  const acknowledgeIssuerReview = (
    snapshotId: string,
    expectedVersion: number,
    idempotencyKey = `IssuerPortal:${snapshotId}:AcknowledgeReview:${formatDateTag(new Date())}`,
  ): TransferAgencyCommandResult => {
    const snapshot = holderSnapshots.find((item) => item.snapshotId === snapshotId);
    if (!snapshot) return { success: false, error: "NOT_FOUND", message: "Holder snapshot was not found." };
    const resource = snapshot.sourceType === "Distribution" ? "distribution" : "redemption";
    if (!ensureIdentitySource("authSession") || !ensurePermission("acknowledge", resource)) {
      return buildCommandDeniedResult();
    }
    const conflict = assertExpectedVersion(snapshot.version, expectedVersion);
    if (conflict) return conflict;
    if (snapshot.status === "IssuerAcknowledged" || snapshot.status === "Reconciled") {
      return { success: true, id: snapshotId, message: "Issuer review is already acknowledged." };
    }
    if (snapshot.status !== "SubmittedToIssuer") {
      return { success: false, error: "INVALID_STATE", message: "TA must submit the snapshot to issuer review first." };
    }
    const now = new Date().toISOString();
    setHolderSnapshots((prev) =>
      prev.map((item) =>
        item.snapshotId === snapshotId
          ? {
              ...item,
              status: "IssuerAcknowledged",
              issuerAcknowledgedAt: now,
              idempotencyKey,
              updatedAt: now,
              version: item.version + 1,
              ...transferAgencyAuditFields("acknowledge"),
            }
          : item,
      ),
    );
    setSettlementLists((prev) =>
      prev.map((item) =>
        item.snapshotId === snapshotId
          ? {
              ...item,
              status: "Acknowledged",
              acknowledgedAt: now,
              updatedAt: now,
              version: item.version + 1,
              ...transferAgencyAuditFields("acknowledge"),
            }
          : item,
      ),
    );
    anchorSnapshotArtifact(snapshot, "ApprovalAttestation", `issuer-ack-${snapshotId}`);
    updateInstructionStatus(snapshot.instructionId, "IssuerAcknowledged", "acknowledge");
    return { success: true, id: snapshotId, message: "Issuer review acknowledged." };
  };

  const reconcileSnapshotSource = (
    sourceType: HolderSnapshot["sourceType"],
    sourceReference: string,
    expectedVersion: number,
    idempotencyKey: string,
  ): TransferAgencyCommandResult => {
    if (!ensureIdentitySource("authSession") || !ensurePermission("reconcile", "reconciliation")) {
      return buildCommandDeniedResult();
    }
    const snapshot = holderSnapshots.find((item) => item.sourceType === sourceType && item.sourceReference === sourceReference);
    if (!snapshot) return { success: false, error: "NOT_FOUND", message: "Holder snapshot was not found." };
    const conflict = assertExpectedVersion(snapshot.version, expectedVersion);
    if (conflict) return conflict;
    if (snapshot.status === "Reconciled") return { success: true, id: snapshot.snapshotId, message: "Snapshot is already reconciled." };
    if (snapshot.status !== "IssuerAcknowledged") {
      return { success: false, error: "INVALID_STATE", message: "Issuer must acknowledge the snapshot/list before close-out." };
    }
    const now = new Date().toISOString();
    setHolderSnapshots((prev) =>
      prev.map((item) =>
        item.snapshotId === snapshot.snapshotId
          ? {
              ...item,
              status: "Reconciled",
              reconciledAt: now,
              idempotencyKey,
              updatedAt: now,
              version: item.version + 1,
              ...transferAgencyAuditFields("reconcile"),
            }
          : item,
      ),
    );
    setSettlementLists((prev) =>
      prev.map((item) =>
        item.snapshotId === snapshot.snapshotId
          ? {
              ...item,
              status: "Reconciled",
              reconciledAt: now,
              updatedAt: now,
              version: item.version + 1,
              ...transferAgencyAuditFields("reconcile"),
            }
          : item,
      ),
    );
    setSettlementListLines((prev) =>
      prev.map((line) =>
        line.snapshotId === snapshot.snapshotId ? { ...line, status: "Reconciled", version: line.version + 1 } : line,
      ),
    );
    anchorSnapshotArtifact(snapshot, "EvidencePack", `reconciliation-${snapshot.snapshotId}`);
    updateInstructionStatus(snapshot.instructionId, "Reconciled", "reconcile");
    if (sourceType === "Distribution") {
      setFundDistributions((prev) =>
        prev.map((distribution) =>
          distribution.id === sourceReference
            ? {
                ...distribution,
                status: "Reconciled",
                transferAgentOps: {
                  ...distribution.transferAgentOps,
                  transferAgentName: distribution.transferAgentOps?.transferAgentName || "Harbor Registry Services",
                  transferAgentStatus: "Reconciled",
                  holderRegisterDate: snapshot.recordDate,
                  holderSnapshotId: snapshot.snapshotId,
                  holderSnapshotLockedAt: snapshot.lockedAt,
                  recipientListStatus: "Reconciled",
                  reconciliationStatus: "Reconciled",
                  reconciledAt: now,
                  lastTransferAgentAction: "Recipient list reconciled against the holder snapshot.",
                },
                lastAction: "reconcile",
                lastActorRole: authSession.role!,
                lastActionAt: now,
                identitySource: "authSession",
              }
            : distribution,
        ),
      );
    } else {
      setFundRedemptions((prev) =>
        prev.map((redemption) =>
          redemption.id === sourceReference
            ? {
                ...redemption,
                status: "Window Closed",
                transferAgentOps: {
                  ...redemption.transferAgentOps,
                  transferAgentName: redemption.transferAgentOps?.transferAgentName || "Harbor Registry Services",
                  transferAgentStatus: "Reconciled",
                  holderRegisterDate: snapshot.recordDate,
                  holderSnapshotId: snapshot.snapshotId,
                  holderSnapshotLockedAt: snapshot.lockedAt,
                  paymentListStatus: "Reconciled",
                  reconciliationStatus: "Reconciled",
                  reconciledAt: now,
                  lastTransferAgentAction: "Payment list reconciled against the holder snapshot.",
                },
                lastAction: "reconcile",
                lastActorRole: authSession.role!,
                lastActionAt: now,
                identitySource: "authSession",
              }
            : redemption,
        ),
      );
    }
    return { success: true, id: snapshot.snapshotId, message: `${sourceType} close-out reconciled.` };
  };

  const reconcileDistributionPayout = (
    sourceReference: string,
    expectedVersion: number,
    idempotencyKey = `TAConsole:${sourceReference}:ReconcileDistribution:${formatDateTag(new Date())}`,
  ) => reconcileSnapshotSource("Distribution", sourceReference, expectedVersion, idempotencyKey);

  const reconcileRedemptionPayout = (
    sourceReference: string,
    expectedVersion: number,
    idempotencyKey = `TAConsole:${sourceReference}:ReconcileRedemption:${formatDateTag(new Date())}`,
  ) => reconcileSnapshotSource("Redemption", sourceReference, expectedVersion, idempotencyKey);

  const finishWorkflowCommand = (result: WorkflowCommandResult) => {
    setWorkflowState(loadWorkflowState());
    return result;
  };

  const getWorkflowRuntime = (taskId: string) => {
    const task = workflowState.tasks.find((item) => item.taskId === taskId);
    const instance = task
      ? workflowState.instances.find((item) => item.workflowId === task.workflowId)
      : undefined;
    const snapshot = instance
      ? holderSnapshots.find((item) => item.snapshotId === instance.snapshotId) ||
        holderSnapshots.find(
          (item) => item.sourceType === instance.sourceType && item.sourceReference === instance.sourceReference,
        )
      : undefined;
    const instruction = instance
      ? transferAgencyInstructions.find((item) => item.instructionId === instance.instructionId)
      : undefined;
    return { task, instance, snapshot, instruction };
  };

  const workflowCommandOptions = (taskId: string, action: string) => {
    const task = workflowState.tasks.find((item) => item.taskId === taskId);
    return {
      expectedVersion: task?.version,
      idempotencyKey: `Workflow:${taskId}:${action}:${formatDateTag(new Date())}`,
    };
  };

  const workflowPullTask = (taskId: string) =>
    finishWorkflowCommand(
      pullWorkflowTask(taskId, authSession?.role || "transferAgent", workflowCommandOptions(taskId, "Pull")),
    );

  const workflowRespondTask = (taskId: string) =>
    finishWorkflowCommand(
      respondWorkflowTask(taskId, authSession?.role || "transferAgent", workflowCommandOptions(taskId, "Respond")),
    );

  const workflowUpdateChecklist = (taskId: string, checklist: Record<string, boolean>) =>
    finishWorkflowCommand(updateWorkflowTaskChecklist(taskId, checklist, workflowCommandOptions(taskId, "Checklist")));

  const workflowMatchTask = (taskId: string, matched: boolean, exception?: string) =>
    finishWorkflowCommand(
      matchWorkflowTask(
        taskId,
        authSession?.role || "transferAgent",
        matched,
        exception,
        workflowCommandOptions(taskId, matched ? "MatchPass" : "MatchException"),
      ),
    );

  const workflowReturnTask = (taskId: string, reason: string) =>
    finishWorkflowCommand(
      returnWorkflowTask(
        taskId,
        authSession?.role || "transferAgent",
        reason,
        workflowCommandOptions(taskId, "Return"),
      ),
    );

  const workflowSubmitCurrentStep = (taskId: string): WorkflowCommandResult => {
    const { instance, snapshot, instruction } = getWorkflowRuntime(taskId);
    if (!instance) return { success: false, message: "Workflow was not found.", error: "NOT_FOUND" };

    let canonicalResult: TransferAgencyCommandResult = { success: true, message: "Workflow step ready." };
    if (instance.sourceType === "Issuance") {
      canonicalResult = { success: true, message: "Issuance approval is ready for issuer review." };
    } else if (instance.status === "MatchPassed") {
      if (!instruction) return { success: false, message: "Transfer-agent instruction was not found.", error: "NOT_FOUND" };
      canonicalResult = lockHolderSnapshot(instruction.instructionId, instruction.version);
    } else if (instance.status === "SnapshotLocked") {
      if (!snapshot) return { success: false, message: "Holder snapshot was not found.", error: "NOT_FOUND" };
      canonicalResult =
        instance.sourceType === "Distribution"
          ? generateRecipientList(snapshot.snapshotId, snapshot.version)
          : generatePaymentList(snapshot.snapshotId, snapshot.version);
    } else if (instance.status === "RecipientListGenerated" || instance.status === "PaymentListGenerated") {
      if (!snapshot) return { success: false, message: "Holder snapshot was not found.", error: "NOT_FOUND" };
      canonicalResult = submitSnapshotToIssuerReview(snapshot.snapshotId, snapshot.version);
    }

    if (!canonicalResult.success) {
      return {
        success: false,
        message: canonicalResult.message || "Canonical register action failed.",
        error: canonicalResult.error === "VERSION_CONFLICT" ? "VERSION_CONFLICT" : "INVALID_STATE",
      };
    }
    return finishWorkflowCommand(
      submitWorkflowStep(taskId, authSession?.role || "transferAgent", workflowCommandOptions(taskId, "Submit")),
    );
  };

  const workflowAcknowledgeTask = (taskId: string): WorkflowCommandResult => {
    const { instance, snapshot } = getWorkflowRuntime(taskId);
    if (!instance) return { success: false, message: "Workflow was not found.", error: "NOT_FOUND" };
    if (instance.sourceType !== "Issuance") {
      if (!snapshot) return { success: false, message: "Workflow snapshot was not found.", error: "NOT_FOUND" };
      const canonicalResult = acknowledgeIssuerReview(snapshot.snapshotId, snapshot.version);
      if (!canonicalResult.success) {
        return {
          success: false,
          message: canonicalResult.message || "Issuer acknowledgement failed.",
          error: canonicalResult.error === "VERSION_CONFLICT" ? "VERSION_CONFLICT" : "INVALID_STATE",
        };
      }
    }
    return finishWorkflowCommand(
      acknowledgeWorkflowTask(taskId, authSession?.role || "issuer", workflowCommandOptions(taskId, "Acknowledge")),
    );
  };

  const workflowReconcileTask = (taskId: string): WorkflowCommandResult => {
    const { instance, snapshot } = getWorkflowRuntime(taskId);
    if (!instance || !snapshot) return { success: false, message: "Workflow snapshot was not found.", error: "NOT_FOUND" };
    const canonicalResult =
      instance.sourceType === "Distribution"
        ? reconcileDistributionPayout(instance.sourceReference, snapshot.version)
        : reconcileRedemptionPayout(instance.sourceReference, snapshot.version);
    if (!canonicalResult.success) {
      return {
        success: false,
        message: canonicalResult.message || "Workflow close-out failed.",
        error: canonicalResult.error === "VERSION_CONFLICT" ? "VERSION_CONFLICT" : "INVALID_STATE",
      };
    }
    return finishWorkflowCommand(
      reconcileWorkflowTask(taskId, authSession?.role || "transferAgent", workflowCommandOptions(taskId, "Reconcile")),
    );
  };

  const prepareRegisterDelta = (
    deltaId: string,
    expectedVersion: number,
    idempotencyKey = `TAConsole:${deltaId}:PrepareDelta:${formatDateTag(new Date())}`,
  ): TransferAgencyCommandResult => {
    if (!ensureIdentitySource("authSession") || !ensurePermission("prepare", "register")) {
      return buildCommandDeniedResult();
    }

    const current = registerDeltas.find((delta) => delta.deltaId === deltaId);
    if (!current) return { success: false, error: "NOT_FOUND", message: "Register delta was not found." };
    const conflict = assertExpectedVersion(current.version, expectedVersion);
    if (conflict) return conflict;
    if (current.makerStatus === "Submitted") {
      return { success: true, message: "Register delta is already submitted for checker review." };
    }

    setRegisterDeltas((prev) =>
      prev.map((delta) =>
        delta.deltaId === deltaId
          ? {
              ...delta,
              makerId: "ta-maker-demo",
              makerStatus: "Submitted",
              checkerStatus: "Pending",
              idempotencyKey,
              updatedAt: new Date().toISOString(),
              version: delta.version + 1,
              ...transferAgencyAuditFields("prepare"),
            }
          : delta,
      ),
    );
    updateInstructionStatus(current.instructionId, "RegisterDeltaPrepared", "prepare");
    return { success: true, message: "Register delta submitted for checker review." };
  };

  const approveRegisterDelta = (
    deltaId: string,
    expectedVersion: number,
    idempotencyKey = `TAConsole:${deltaId}:ApproveDelta:${formatDateTag(new Date())}`,
  ): TransferAgencyCommandResult => {
    if (!ensureIdentitySource("authSession") || !ensurePermission("approve", "register")) {
      return buildCommandDeniedResult();
    }

    const current = registerDeltas.find((delta) => delta.deltaId === deltaId);
    if (!current) return { success: false, error: "NOT_FOUND", message: "Register delta was not found." };
    const conflict = assertExpectedVersion(current.version, expectedVersion);
    if (conflict) return conflict;
    if (current.checkerStatus === "Approved") {
      return { success: true, message: "Register delta is already checker-approved." };
    }
    if (current.makerStatus !== "Submitted") {
      return {
        success: false,
        error: "INVALID_STATE",
        message: "Submit the register delta for checker review before approval.",
      };
    }

    setRegisterDeltas((prev) =>
      prev.map((delta) =>
        delta.deltaId === deltaId
          ? {
              ...delta,
              checkerId: "ta-checker-demo",
              checkerStatus: "Approved",
              idempotencyKey,
              updatedAt: new Date().toISOString(),
              version: delta.version + 1,
              ...transferAgencyAuditFields("approve"),
            }
          : delta,
      ),
    );
    return { success: true, message: "Register delta approved by checker." };
  };

  const updateRegisterAccountForPostedDelta = (delta: RegisterDelta) => {
    if (!["Issue", "Redeem"].includes(delta.deltaType)) return;
    setRegisterAccounts((prev) =>
      prev.map((account) => {
        if (account.registerAccountId !== delta.registerAccountId) return account;
        const currentUnits = parseLeadingNumber(account.units);
        const deltaUnits = parseLeadingNumber(delta.units);
        const nextUnits = delta.deltaType === "Issue" ? currentUnits + deltaUnits : currentUnits - deltaUnits;
        return {
          ...account,
          units: formatDemoNumber(Math.max(nextUnits, 0), 2),
          accountStatus: account.accountStatus === "Pending" ? "Active" : account.accountStatus,
          lastDeltaId: delta.deltaId,
          lastReconciledAt: new Date().toISOString(),
          version: account.version + 1,
        };
      }),
    );
  };

  const releaseRegisterVersionForDelta = (delta: RegisterDelta) => {
    const versionId =
      delta.newRegisterVersionId || `REG-${delta.classId}-${formatDateTag(new Date())}-${String(Date.now()).slice(-3)}`;
    setRegisterVersions((prev) => {
      const existing = prev.find((version) => version.registerVersionId === versionId);
      if (existing?.status === "Released") return prev;
      if (existing) {
        return prev.map((version) =>
          version.registerVersionId === versionId
            ? {
                ...version,
                status: "Released",
                releasedAt: new Date().toISOString(),
                releasedBy: "ta-checker-demo",
                version: version.version + 1,
              }
            : version,
        );
      }
      return [
        {
          registerVersionId: versionId,
          fundId: delta.fundId,
          classId: delta.classId,
          status: "Released",
          effectiveAt: delta.effectiveAt || new Date().toISOString(),
          releasedAt: new Date().toISOString(),
          previousRegisterVersionId: delta.previousRegisterVersionId,
          totalHolders: registerAccounts.filter((account) => account.fundId === delta.fundId).length,
          totalUnits: delta.units,
          registerHash: `0x${versionId.toLowerCase().replace(/[^a-z0-9]/g, "").slice(-20)}`,
          deltaIds: [delta.deltaId],
          releasedBy: "ta-checker-demo",
          createdAt: new Date().toISOString(),
          version: 1,
        },
        ...prev,
      ];
    });
    return versionId;
  };

  const createTokenEventForPostedDelta = (delta: RegisterDelta) => {
    if (delta.tokenEventRefId || !["Issue", "Redeem"].includes(delta.deltaType)) return;
    const tokenEventRefId = `token-${delta.deltaType.toLowerCase()}-${delta.deltaId}`;
    setTokenEvents((prev) => {
      if (prev.some((event) => event.tokenEventRefId === tokenEventRefId)) return prev;
      return [
        {
          tokenEventRefId,
          fundId: delta.fundId,
          classId: delta.classId,
          eventType: delta.deltaType === "Issue" ? "Mint" : "Burn",
          chainId: "wb-hk-chain",
          txHash: `0x${tokenEventRefId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 24)}`,
          amount: delta.units,
          status: "Finalized",
          linkedDeltaId: delta.deltaId,
          createdAt: new Date().toISOString(),
          version: 1,
        },
        ...prev,
      ];
    });
  };

  const createEvidenceForPostedDelta = (delta: RegisterDelta, registerVersionId: string) => {
    const evidenceRefId = `ev-register-${registerVersionId}`;
    setEvidenceRecords((prev) => {
      if (prev.some((evidence) => evidence.evidenceRefId === evidenceRefId)) return prev;
      return [
        {
          evidenceRefId,
          fundId: delta.fundId,
          classId: delta.classId,
          instructionId: delta.instructionId,
          registerDeltaId: delta.deltaId,
          evidenceType: "RegisterVersion",
          label: `Released register version ${registerVersionId}`,
          contentHash: `0x${registerVersionId.toLowerCase().replace(/[^a-z0-9]/g, "").slice(-20)}`,
          sourceActorType: "TransferAgent",
          sourceActorId: "ta-checker-demo",
          createdAt: new Date().toISOString(),
          retentionClass: "Regulatory",
          version: 1,
        },
        ...prev,
      ];
    });
  };

  const postRegisterDelta = (
    deltaId: string,
    expectedVersion: number,
    idempotencyKey = `TAConsole:${deltaId}:PostRegister:${formatDateTag(new Date())}`,
  ): TransferAgencyCommandResult => {
    if (!ensureIdentitySource("authSession") || !ensurePermission("post", "register")) {
      return buildCommandDeniedResult();
    }

    const current = registerDeltas.find((delta) => delta.deltaId === deltaId);
    if (!current) return { success: false, error: "NOT_FOUND", message: "Register delta was not found." };
    const conflict = assertExpectedVersion(current.version, expectedVersion);
    if (conflict) return conflict;
    if (current.postingStatus === "Posted") {
      return { success: true, message: "Register delta is already posted. No duplicate version was created." };
    }
    const openBreak = reconciliationBreaks.find(
      (item) => item.registerDeltaId === deltaId && !["Resolved", "Waived"].includes(item.status),
    );
    if (openBreak) {
      return {
        success: false,
        error: "OPEN_BREAK",
        message: `Resolve or waive ${openBreak.breakId} before posting this register delta.`,
      };
    }
    if (current.checkerStatus !== "Approved") {
      return {
        success: false,
        error: "INVALID_STATE",
        message: "Checker approval is required before posting the register update.",
      };
    }

    const registerVersionId = releaseRegisterVersionForDelta(current);
    updateRegisterAccountForPostedDelta(current);
    createTokenEventForPostedDelta(current);
    createEvidenceForPostedDelta(current, registerVersionId);
    const postedAt = new Date().toISOString();
    const instruction = transferAgencyInstructions.find((item) => item.instructionId === current.instructionId);
    anchorRegisterVersion(registerVersionId, current);
    if (["Issue", "Redeem"].includes(current.deltaType)) {
      const fund = fundIssuances.find((item) => item.id === current.fundId);
      recordOnChainEvent({
        onChainEventId: `chain-${current.deltaType.toLowerCase()}-${current.deltaId}`.replace(/[^a-zA-Z0-9-]/g, "-"),
        sourceType: current.deltaType === "Issue" ? "Issuance" : "Redemption",
        sourceReference: instruction?.sourceReference || current.deltaId,
        eventType: current.deltaType === "Issue" ? "FundUnitMint" : "FundUnitBurn",
        fundId: current.fundId,
        classId: current.classId,
        chainId: "wb-hk-chain",
        contractAddress: fund?.tokenAddress,
        method: current.deltaType === "Issue" ? "mint" : "burnFrom",
        txHash: mockHex(`tx:${current.deltaType}:${current.deltaId}`),
        blockNumber: mockBlockNumber(`${current.deltaType}:${current.deltaId}`),
        status: "Confirmed",
        payloadHash: mockHex(`payload:${current.deltaType}:${current.deltaId}:${registerVersionId}`),
        amount: current.units,
        currency: current.classId,
        idempotencyKey: `OnChain:${current.deltaId}:${current.deltaType}`,
        confirmedAt: postedAt,
      });
    }
    if (instruction?.sourceReference) {
      setFundOrders((prev) =>
        prev.map((order) =>
          order.id === instruction.sourceReference
            ? {
                ...order,
                confirmedNav: current.navRefId ? order.confirmedNav || order.estimatedNav : order.confirmedNav,
                confirmedSharesOrCash:
                  current.deltaType === "Issue" ? `${current.units} units` : order.confirmedSharesOrCash,
                confirmTime: order.confirmTime || postedAt,
                settlementTime: postedAt,
                status: current.deltaType === "Redeem" ? "Completed" : "Confirmed",
                paymentStatus:
                  current.deltaType === "Issue" ? order.paymentStatus || "Funds Cleared" : order.paymentStatus,
                unitBookingStatus: current.deltaType === "Issue" ? "Settled" : order.unitBookingStatus,
                note: `Booked from transfer agent register version ${registerVersionId}.`,
                lastAction: "post",
                lastActorRole: authSession.role!,
                lastActionAt: postedAt,
                identitySource: "authSession",
              }
            : order,
        ),
      );
    }
    setFundIssuances((prev) =>
      prev.map((fund) =>
        fund.id === current.fundId
          ? {
              ...fund,
              transferAgentOps: {
                ...fund.transferAgentOps,
                transferAgentName: fund.transferAgentOps?.transferAgentName || "WeBank Transfer Agent Desk",
                transferAgentStatus: "Register Posted",
                holderRegisterDate: postedAt,
                registerVersion: registerVersionId,
                ledgerApprovalStatus: "Register version released by checker",
                lastTransferAgentAction: `Posted ${current.deltaType.toLowerCase()} delta ${current.deltaId}.`,
              },
              lastAction: "post",
              lastActorRole: authSession.role!,
              lastActionAt: postedAt,
              identitySource: "authSession",
            }
          : fund,
      ),
    );
    setRegisterDeltas((prev) =>
      prev.map((delta) =>
        delta.deltaId === deltaId
          ? {
              ...delta,
              postingStatus: "Posted",
              postedAt,
              newRegisterVersionId: registerVersionId,
              idempotencyKey,
              updatedAt: postedAt,
              version: delta.version + 1,
              ...transferAgencyAuditFields("post"),
            }
          : delta,
      ),
    );
    updateInstructionStatus(current.instructionId, "RegisterPosted", "post");
    return { success: true, message: `Register update posted into ${registerVersionId}.` };
  };

  const updateBreakStatus = (
    breakId: string,
    expectedVersion: number,
    status: ReconciliationBreak["status"],
    action: "resolve" | "waive",
    idempotencyKey: string,
  ): TransferAgencyCommandResult => {
    void idempotencyKey;
    if (!ensureIdentitySource("authSession") || !ensurePermission("resolve", "reconciliation")) {
      return buildCommandDeniedResult();
    }
    const current = reconciliationBreaks.find((item) => item.breakId === breakId);
    if (!current) return { success: false, error: "NOT_FOUND", message: "Reconciliation break was not found." };
    const conflict = assertExpectedVersion(current.version, expectedVersion);
    if (conflict) return conflict;
    if (["Resolved", "Waived"].includes(current.status)) {
      return { success: true, message: "This reconciliation break is already closed." };
    }

    setReconciliationBreaks((prev) =>
      prev.map((item) =>
        item.breakId === breakId
          ? {
              ...item,
              status,
              resolutionRefId: `${action}-${breakId}`,
              resolvedAt: new Date().toISOString(),
              version: item.version + 1,
              ...transferAgencyAuditFields(action),
            }
          : item,
      ),
    );
    return {
      success: true,
      message: status === "Resolved" ? "Reconciliation break resolved." : "Reconciliation break waived with evidence.",
    };
  };

  const resolveReconciliationBreak = (
    breakId: string,
    expectedVersion: number,
    idempotencyKey = `TAConsole:${breakId}:ResolveBreak:${formatDateTag(new Date())}`,
  ) => updateBreakStatus(breakId, expectedVersion, "Resolved", "resolve", idempotencyKey);

  const waiveReconciliationBreak = (
    breakId: string,
    expectedVersion: number,
    idempotencyKey = `TAConsole:${breakId}:WaiveBreak:${formatDateTag(new Date())}`,
  ) => updateBreakStatus(breakId, expectedVersion, "Waived", "waive", idempotencyKey);

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
    if (targetFund && ["Allocate On Chain", "Allocation Completed"].includes(status)) {
      recordIssuanceMintOnChain({ ...targetFund, ...(demoSeed?.fundUpdates || {}), status });
    }
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
    const targetRedemption = fundRedemptions.find((redemption) => redemption.id === id);
    if (targetRedemption && status === "Burn On Chain") {
      recordRedemptionBurnOnChain({ ...targetRedemption, status });
    }
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
    const targetDistribution = fundDistributions.find((distribution) => distribution.id === id);
    if (targetDistribution && status === "Put On Chain") {
      recordDistributionOnChain({ ...targetDistribution, status }, "DistributionPayout");
    }
    if (targetDistribution && status === "Open For Distribution") {
      recordDistributionOnChain(
        { ...targetDistribution, status },
        targetDistribution.payoutMode === "Direct Transfer" ? "DistributionTransferBatch" : "DistributionClaimOpen",
      );
    }
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
        transferAgencyInstructions,
        registerAccounts,
        walletLinks,
        registerDeltas,
        registerVersions,
        cashMovements,
        transferAgencyNavRecords,
        tokenEvents,
        onChainEvents,
        anchoringEvents,
        reconciliationBreaks,
        evidenceRecords,
        holderSnapshots,
        holderSnapshotPositions,
        settlementLists,
        settlementListLines,
        workflowState,
        workflowPullTask,
        workflowRespondTask,
        workflowUpdateChecklist,
        workflowMatchTask,
        workflowReturnTask,
        workflowSubmitCurrentStep,
        workflowAcknowledgeTask,
        workflowReconcileTask,
        createIssuanceWorkflowFromIssuer,
        createTransferAgencyInstructionFromIssuer,
        lockHolderSnapshot,
        generateRecipientList,
        generatePaymentList,
        submitSnapshotToIssuerReview,
        acknowledgeIssuerReview,
        reconcileDistributionPayout,
        reconcileRedemptionPayout,
        prepareRegisterDelta,
        approveRegisterDelta,
        postRegisterDelta,
        resolveReconciliationBreak,
        waiveReconciliationBreak,
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
