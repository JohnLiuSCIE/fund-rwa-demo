import type {
  CashMovement,
  EvidenceRecord,
  FundDistribution,
  FundIssuance,
  FundOrder,
  FundRedemptionConfig,
  RegisterAccount,
  RegisterVersion,
  WalletLink,
} from "../data/fundDemoData";

export interface DemoScenarioPatch {
  fundOrders: FundOrder[];
  registerAccounts: RegisterAccount[];
  walletLinks: WalletLink[];
  cashMovements: CashMovement[];
  evidenceRecords: EvidenceRecord[];
}

interface ScenarioBaseInput {
  existingCashMovements: CashMovement[];
  existingEvidenceRecords: EvidenceRecord[];
}

interface IssuanceScenarioInput extends ScenarioBaseInput {
  fund: FundIssuance;
  orders: FundOrder[];
  existingRegisterAccounts: RegisterAccount[];
  existingWalletLinks: WalletLink[];
}

interface RedemptionScenarioInput extends ScenarioBaseInput {
  redemption: FundRedemptionConfig;
  fund: FundIssuance;
  registerAccounts: RegisterAccount[];
  walletLinks: WalletLink[];
  existingOrders: FundOrder[];
}

interface DistributionScenarioInput extends ScenarioBaseInput {
  distribution: FundDistribution;
  fund?: FundIssuance;
  registerAccounts: RegisterAccount[];
  walletLinks: WalletLink[];
  registerVersions: RegisterVersion[];
}

const DEMO_INVESTOR_PROFILES = [
  {
    investorId: "demo-redemption-harbor",
    name: "Harbor Family Office",
    wallet: "0x1a2B3c4D5e6F708192A3b4C5d6E7f8091A2b3C4d",
    address: "Admiralty, Hong Kong SAR",
  },
  {
    investorId: "demo-redemption-granite",
    name: "Granite Institutional Fund",
    wallet: "0x2b3C4d5E6f708192A3b4C5d6E7f8091A2b3C4d5E",
    address: "Tsim Sha Tsui, Hong Kong SAR",
  },
  {
    investorId: "demo-redemption-summit",
    name: "Summit Qualified Investors SPC",
    wallet: "0x3c4D5e6F708192A3b4C5d6E7f8091A2b3C4d5E6f",
    address: "Central, Hong Kong SAR",
  },
];

function emptyPatch(): DemoScenarioPatch {
  return {
    fundOrders: [],
    registerAccounts: [],
    walletLinks: [],
    cashMovements: [],
    evidenceRecords: [],
  };
}

function sanitizeId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "demo";
}

function parseLeadingNumber(value?: string | number | null) {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const parsed = Number(String(value).replace(/,/g, "").match(/-?\d+(\.\d+)?/)?.[0] || "0");
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDemoNumber(value: number, digits = 2) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function extractCurrency(value?: string, fallback = "HKD") {
  const token = value?.trim().split(/\s+/).at(-1);
  return token && Number.isNaN(Number(token.replace(/,/g, ""))) ? token : fallback;
}

function getClassId(fund: FundIssuance, registerVersions: RegisterVersion[] = []) {
  const latest = [...registerVersions]
    .filter((version) => version.fundId === fund.id)
    .sort((left, right) => (right.releasedAt || right.effectiveAt).localeCompare(left.releasedAt || left.effectiveAt))[0];
  return latest?.classId || fund.shareClass || `${sanitizeId(fund.tokenSymbol || fund.tokenName).toUpperCase()}-CLASS`;
}

function buildCashStatus(order: FundOrder): CashMovement["status"] {
  if (order.paymentStatus === "Failed") return "Failed";
  if (order.paymentStatus === "Payment Proof Uploaded") return "ProofUploaded";
  if (order.paymentStatus === "Funds Received") return "Matched";
  if (order.paymentStatus === "Funds Cleared") return "Confirmed";
  return "Expected";
}

function buildCashOwner(order: FundOrder, fund?: FundIssuance): CashMovement["owner"] {
  if (order.paymentMethod === "Tokenized Deposit" || fund?.subscriptionPaymentMethod === "Tokenized Deposit") {
    return "StablecoinCustodian";
  }
  if (order.paymentMethod === "Stablecoin" || fund?.subscriptionPaymentMethod === "Stablecoin") {
    return "StablecoinCustodian";
  }
  if (order.type === "redemption") return "Bank";
  return fund?.cashConfirmationOwner === "Transfer Agent" ? "TransferAgent" : "IssuerOps";
}

function cashEvidenceForMovement(movement: CashMovement, order: FundOrder, existing: EvidenceRecord[]): EvidenceRecord | null {
  const evidenceRefId = `ev-${movement.cashMovementId}`;
  if (existing.some((record) => record.evidenceRefId === evidenceRefId)) return null;
  if (!["ProofUploaded", "Matched", "Confirmed"].includes(movement.status)) return null;
  return {
    evidenceRefId,
    fundId: movement.fundId,
    classId: movement.classId,
    instructionId: movement.instructionId,
    evidenceType: "CashConfirmation",
    label:
      order.type === "subscription"
        ? `${order.investorName} subscription funding evidence`
        : `${order.investorName} redemption payout evidence`,
    sourceActorType: order.type === "subscription" ? "Investor" : "Issuer",
    sourceActorId: order.investorId,
    createdAt: movement.confirmedAt || order.cashConfirmedAt || order.cashReceivedAt || order.submitTime,
    retentionClass: "Audit",
    version: 1,
  };
}

function buildOrderCashMovements(
  orders: FundOrder[],
  fund: FundIssuance,
  classId: string,
  existingCashMovements: CashMovement[],
  existingEvidenceRecords: EvidenceRecord[],
) {
  const cashMovements: CashMovement[] = [];
  const evidenceRecords: EvidenceRecord[] = [];
  const existingCashIds = new Set(existingCashMovements.map((movement) => movement.cashMovementId));
  const pendingEvidence = [...existingEvidenceRecords];

  orders.forEach((order) => {
    const cashMovementId = `cash-${order.id}`;
    if (existingCashIds.has(cashMovementId)) return;
    const currency = extractCurrency(
      order.type === "subscription" ? order.requestAmount : order.estimatedSharesOrCash,
      fund.subscriptionCashCurrency || fund.navCurrency || fund.assetCurrency,
    );
    const movement: CashMovement = {
      cashMovementId,
      instructionId: `instr-${order.id}`,
      fundId: order.fundId,
      classId,
      direction: order.type === "subscription" ? "In" : "Out",
      amount: formatDemoNumber(
        parseLeadingNumber(order.type === "subscription" ? order.requestAmount : order.estimatedSharesOrCash),
        2,
      ),
      currency,
      status: buildCashStatus(order),
      owner: buildCashOwner(order, fund),
      reference: order.paymentReference || `DEMO-${sanitizeId(order.id).toUpperCase()}`,
      confirmedAt: order.cashConfirmedAt || order.settlementTime,
      version: 1,
    };
    cashMovements.push(movement);
    const evidence = cashEvidenceForMovement(movement, order, pendingEvidence);
    if (evidence) {
      evidenceRecords.push(evidence);
      pendingEvidence.push(evidence);
    }
  });

  return { cashMovements, evidenceRecords };
}

export function buildIssuanceDemoScenario(input: IssuanceScenarioInput): DemoScenarioPatch {
  const patch = emptyPatch();
  const classId = getClassId(input.fund);
  const existingAccountIds = new Set(input.existingRegisterAccounts.map((account) => account.registerAccountId));
  const existingWalletIds = new Set(input.existingWalletLinks.map((link) => link.walletLinkId));

  input.orders.forEach((order) => {
    if (order.type !== "subscription") return;
    const accountId = `ra-${sanitizeId(order.fundId)}-${sanitizeId(order.investorId)}`;
    if (!existingAccountIds.has(accountId)) {
      patch.registerAccounts.push({
        registerAccountId: accountId,
        fundId: order.fundId,
        classId,
        holderId: `holder-${sanitizeId(order.investorId)}`,
        holderName: order.investorName,
        registeredAddress: order.payerAccountName || "Hong Kong SAR",
        holderType: "Direct",
        units: order.confirmedSharesOrCash || order.estimatedSharesOrCash.replace(/\s*units?$/i, ""),
        accountStatus: order.unitBookingStatus === "Settled" || order.status === "Confirmed" ? "Active" : "Pending",
        openedAt: order.settlementTime || order.confirmTime,
        source: "Direct",
        version: 1,
      });
    }

    const walletId = `wl-${sanitizeId(order.fundId)}-${sanitizeId(order.investorId)}`;
    if (!existingWalletIds.has(walletId)) {
      patch.walletLinks.push({
        walletLinkId: walletId,
        registerAccountId: accountId,
        walletAddress: order.investorWallet,
        chainId: "wb-hk-chain",
        proofStatus: "Submitted",
        whitelistStatus: "Pending",
        proofRefId: `ev-wallet-${sanitizeId(order.investorId)}`,
        version: 1,
      });
    }
  });

  const cash = buildOrderCashMovements(
    input.orders,
    input.fund,
    classId,
    input.existingCashMovements,
    input.existingEvidenceRecords,
  );
  patch.cashMovements.push(...cash.cashMovements);
  patch.evidenceRecords.push(...cash.evidenceRecords);
  return patch;
}

export function buildRedemptionEventDemoScenario(input: RedemptionScenarioInput): DemoScenarioPatch {
  const patch = emptyPatch();
  const classId = getClassId(input.fund);
  const existingOrderIds = new Set(input.existingOrders.map((order) => order.id));
  const activeAccounts = input.registerAccounts
    .filter(
      (account) =>
        account.fundId === input.redemption.fundId &&
        account.accountStatus === "Active" &&
        parseLeadingNumber(account.units) > 0,
    )
    .sort((left, right) => parseLeadingNumber(right.units) - parseLeadingNumber(left.units));
  const maxPerInvestor = parseLeadingNumber(input.redemption.maxRedemptionQuantityPerInvestor) || Number.POSITIVE_INFINITY;
  const nav = parseLeadingNumber(input.redemption.latestNav) || input.fund.currentNavValue || input.fund.initialNavValue || 1;
  const currency = extractCurrency(input.redemption.latestNav, input.fund.navCurrency || input.fund.assetCurrency);
  const sourceAccounts = activeAccounts.slice(0, 3);

  sourceAccounts.forEach((account, index) => {
    const unitsHeld = parseLeadingNumber(account.units);
    const ratio = [0.18, 0.12, 0.08][index] || 0.06;
    const requestedUnits = Math.max(Math.min(unitsHeld * ratio, maxPerInvestor, unitsHeld * 0.75), 0);
    if (requestedUnits <= 0) return;
    const orderId = `red-demo-${sanitizeId(input.redemption.id)}-${sanitizeId(account.holderId)}`;
    if (existingOrderIds.has(orderId)) return;
    const wallet = input.walletLinks.find((link) => link.registerAccountId === account.registerAccountId);
    const status: FundOrder["status"] = index === 0 ? "Pending Review" : "Submitted";
    patch.fundOrders.push({
      id: orderId,
      fundId: input.redemption.fundId,
      investorId: account.holderId,
      investorName: account.holderName,
      investorWallet: wallet?.walletAddress || DEMO_INVESTOR_PROFILES[index]?.wallet || "0xDEMO-REDEMPTION-WALLET",
      type: "redemption",
      requestAmount: `${formatDemoNumber(requestedUnits, 2)} units`,
      requestQuantity: `${formatDemoNumber(requestedUnits, 2)} units`,
      estimatedNav: input.redemption.latestNav,
      estimatedSharesOrCash: `${formatDemoNumber(requestedUnits * nav, 2)} ${currency}`,
      submitTime: input.redemption.windowEnd || input.redemption.effectiveDate || input.redemption.createdTime,
      status,
      paymentMethod: input.fund.subscriptionPaymentMethod || "Fiat",
      paymentStatus: "Pending Instruction",
      paymentReference: `PAY-${sanitizeId(input.redemption.id).toUpperCase()}-${index + 1}`,
      payerAccountName: account.holderName,
      payerBankAccountMasked: `388-${String(index + 11).padStart(3, "0")}-****${String(220 + index)}`,
      unitBookingStatus: "Pending",
      note: "Demo-generated investor redemption request for the current issuer event.",
      identitySource: "authSession",
    });

  });

  const cash = buildOrderCashMovements(
    patch.fundOrders,
    input.fund,
    classId,
    input.existingCashMovements,
    input.existingEvidenceRecords,
  );
  patch.cashMovements.push(...cash.cashMovements);
  patch.evidenceRecords.push(...cash.evidenceRecords);
  return patch;
}

export function buildDistributionEventDemoScenario(input: DistributionScenarioInput): DemoScenarioPatch {
  const patch = emptyPatch();
  if (!input.fund || !input.distribution.fundId) return patch;
  const classId = getClassId(input.fund, input.registerVersions);
  const existingCashIds = new Set(input.existingCashMovements.map((movement) => movement.cashMovementId));
  const rate = parseLeadingNumber(input.distribution.distributionRate);
  const nav = parseLeadingNumber(input.distribution.initialNav) || input.fund.currentNavValue || input.fund.initialNavValue || 1;
  const currency =
    input.distribution.distributionUnit || input.distribution.payoutToken || input.fund.subscriptionCashCurrency || input.fund.navCurrency;
  const eligibleAccounts = input.registerAccounts.filter(
    (account) =>
      account.fundId === input.distribution.fundId &&
      account.accountStatus === "Active" &&
      parseLeadingNumber(account.units) > 0,
  );

  eligibleAccounts.forEach((account, index) => {
    const cashMovementId = `cash-${sanitizeId(input.distribution.id)}-${sanitizeId(account.registerAccountId)}`;
    if (existingCashIds.has(cashMovementId)) return;
    const units = parseLeadingNumber(account.units);
    const payout =
      input.distribution.distributionRateType === "Fixed Rate"
        ? units * nav * (rate / 100)
        : units * rate;
    if (payout <= 0) return;
    const wallet = input.walletLinks.find((link) => link.registerAccountId === account.registerAccountId);
    patch.cashMovements.push({
      cashMovementId,
      instructionId: `instr-distribution-${sanitizeId(input.distribution.id)}-cash`,
      fundId: input.distribution.fundId!,
      classId,
      direction: "Out",
      amount: formatDemoNumber(payout, 2),
      currency,
      status: "Expected",
      owner: input.distribution.payoutMode === "Claim" ? "TransferAgent" : "Bank",
      reference:
        input.distribution.payoutMode === "Claim"
          ? wallet?.walletAddress || `CLAIM-${index + 1}`
          : `${input.distribution.id}-payout-${index + 1}`,
      version: 1,
    });
  });

  return patch;
}
