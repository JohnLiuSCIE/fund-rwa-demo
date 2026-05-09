export type FundLifecycleStatus =
  | "Draft"
  | "Pending Approval"
  | "Pending Listing"
  | "Upcoming"
  | "Upcoming Launch"
  | "Initial Subscription"
  | "Open For Subscription"
  | "Allocation Period"
  | "Calculated"
  | "Allocate On Chain"
  | "Allocation Completed"
  | "Issuance Completed"
  | "Issuance Active"
  | "Active Dealing"
  | "Paused";

export type RedemptionLifecycleStatus =
  | "Draft"
  | "Pending Approval"
  | "Active"
  | "Paused"
  | "Announced"
  | "Window Open"
  | "Snapshot Locked"
  | "Payment List Ready"
  | "Burn On Chain"
  | "Window Closed";

export type DistributionLifecycleStatus =
  | "Draft"
  | "Pending Approval"
  | "Pending Listing"
  | "Upcoming"
  | "Snapshot Locked"
  | "Pending Allocation"
  | "Put On Chain"
  | "Open For Distribution"
  | "Reconciled"
  | "Done";

export type DistributionElection = "Distribution Reinvestment" | "Cash Distribution";

export type OrderType = "subscription" | "redemption";

export type OrderStatus =
  | "Submitted"
  | "Pending Review"
  | "Pending NAV"
  | "Pending Confirmation"
  | "Pending Cash Settlement"
  | "Confirmed"
  | "Completed"
  | "Rejected";

export type BatchStatus = "Scheduled" | "Processing" | "Confirmed" | "Settled";
export type ActorRole = "issuer" | "investor" | "transferAgent";
export type NavUpdateMode = "Manual" | "Oracle Feed";

export interface NavRecord {
  id: string;
  navDate: string;
  navValue: number;
  currency: string;
  updatedAt: string;
  note?: string;
}

export interface FundReference {
  type: "file" | "link";
  value: string;
}

export interface InvestorRule {
  ruleType: string;
  condition: string;
  value: string;
}

export interface TransferAgentOperations {
  transferAgentName?: string;
  transferAgentStatus?: string;
  holderRegisterDate?: string;
  holderSnapshotId?: string;
  holderSnapshotLockedAt?: string;
  recipientListStatus?: string;
  recipientListGeneratedAt?: string;
  paymentListStatus?: string;
  paymentListGeneratedAt?: string;
  fundingCheckStatus?: string;
  fundingConfirmedAt?: string;
  reconciliationStatus?: string;
  reconciledAt?: string;
  lastTransferAgentAction?: string;
}

export interface FundIssuanceTransferAgentOps extends TransferAgentOperations {
  investorOnboardingStatus?: string;
  orderBookStatus?: string;
  allocationBookStatus?: string;
  registerVersion?: string;
  ledgerApprovalStatus?: string;
  ledgerApprovedAt?: string;
  mintInstructionStatus?: string;
}

export interface FundIssuance {
  id: string;
  name: string;
  status: FundLifecycleStatus | string;
  description: string;
  assetType: string;
  offeringType?: string;
  legalStructure?: string;
  fundDistributionChannel?: string;
  listedFundSubtype?: string;
  assetStrategyCategory?: string;
  allocationStatus?: string;
  createdTime?: string;
  issuerEntity?: string;
  fundJurisdiction?: string;
  shareClass?: string;
  tokenName: string;
  tokenSymbol?: string;
  tokenAddress: string;
  tokenStandard?: string;
  tokenDecimals?: number;
  isinCode?: string;
  unitPerToken?: string;
  whitelistRequired?: string;
  mintingRule?: string;
  assetCurrency: string;
  minSubscriptionAmount: string;
  maxSubscriptionAmount: string;
  minSubscriptionAmountValue: number;
  maxSubscriptionAmountValue: number;
  initialNav: string;
  initialNavValue: number;
  currentNav: string;
  currentNavValue: number;
  navCurrency: string;
  fundType: "Open-end" | "Closed-end";
  managementFee: string;
  performanceFee: string;
  redemptionFrequency: string;
  lockupPeriod: string;
  lockupPeriodDays: number;
  tradable: string;
  fundManager: string;
  targetFundSize: string;
  targetFundSizeValue: number;
  investmentStrategy: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  issueDate: string;
  maturityDate: string | null;
  subscriptionLotSize: number;
  subscriptionMinQuantity: number;
  subscriptionMaxQuantity: number;
  dealingFrequency?: string;
  dealingCutoffTime?: string;
  navValuationTime?: string;
  settlementCycle?: string;
  subscriptionPaymentMethod?: "Fiat" | "Stablecoin" | "Tokenized Deposit";
  subscriptionPaymentRail?: "Off-chain Bank Transfer" | "On-chain Wallet Transfer";
  subscriptionCashCurrency?: string;
  subscriptionSettlementAccountType?: "Bank Account" | "Wallet";
  receivingBankName?: string;
  receivingBankAccountName?: string;
  receivingBankAccountNumberMasked?: string;
  receivingBankSwiftCode?: string;
  subscriptionCollectionWallet?: string;
  paymentReferenceRule?: string;
  paymentProofRequired?: boolean;
  cashConfirmationOwner?: "Issuer" | "Transfer Agent" | "Operations";
  subscriptionStatus?: "Open" | "Paused";
  redemptionStatus?: "Open" | "Paused";
  redemptionMode?: "Daily dealing" | "Window-based";
  noticePeriodDays?: number;
  maxRedemptionPerInvestor?: string;
  fundLevelRedemptionGate?: string;
  navUpdateMode?: NavUpdateMode;
  oracleProvider?: string;
  oracleFeedId?: string;
  oracleUpdateFrequency?: string;
  oracleFallbackRule?: string;
  oracleLastSyncedAt?: string;
  lastNavUpdateTime?: string;
  nextCutoffTime?: string;
  nextConfirmationDate?: string;
  nextSettlementTime?: string;
  orderConfirmationMethod?: string;
  availableHoldingUnits?: number;
  availableHoldingLabel?: string;
  pendingSubscriptionOrders?: number;
  pendingRedemptionOrders?: number;
  totalSubscribedAmount?: string;
  totalRedeemedAmount?: string;
  allocationRule?: string;
  references?: FundReference[];
  investorRules?: InvestorRule[];
  transferAgentOps?: FundIssuanceTransferAgentOps;
  navHistory: NavRecord[];
  lastAction?: string;
  lastActorRole?: ActorRole;
  lastActionAt?: string;
  identitySource?: "authSession";
}

export interface FundOrder {
  id: string;
  fundId: string;
  investorId: string;
  investorName: string;
  investorWallet: string;
  type: OrderType;
  requestAmount: string;
  requestQuantity: string;
  estimatedNav: string;
  confirmedNav?: string;
  estimatedSharesOrCash: string;
  confirmedSharesOrCash?: string;
  submitTime: string;
  confirmTime?: string;
  settlementTime?: string;
  status: OrderStatus;
  distributionElection?: DistributionElection;
  paymentMethod?: "Fiat" | "Stablecoin" | "Tokenized Deposit";
  paymentStatus?:
    | "Pending Instruction"
    | "Awaiting Payment"
    | "Payment Proof Uploaded"
    | "Funds Received"
    | "Funds Cleared"
    | "Failed"
    | "Not Applicable";
  paymentReference?: string;
  payerAccountName?: string;
  payerBankAccountMasked?: string;
  paymentProofName?: string;
  cashReceivedAt?: string;
  cashConfirmedBy?: string;
  cashConfirmedAt?: string;
  unitBookingStatus?: "Pending" | "Ready To Book" | "Booked" | "Settled";
  batchId?: string;
  note?: string;
  lastAction?: string;
  lastActorRole?: ActorRole;
  lastActionAt?: string;
  identitySource?: "authSession";
}

export interface FundBatch {
  id: string;
  fundId: string;
  type: OrderType;
  cutoffTime: string;
  nav: string;
  orderCount: number;
  totalAmount: string;
  totalQuantity: string;
  settlementDate: string;
  status: BatchStatus;
}

export interface FundRedemptionConfig {
  id: string;
  fundId: string;
  name: string;
  description: string;
  status: RedemptionLifecycleStatus;
  assetType: string;
  fundName: string;
  fundToken: string;
  tokenAddress: string;
  redemptionMode: "Daily dealing" | "Window-based";
  effectiveDate: string;
  windowStart?: string;
  windowEnd?: string;
  announcementDate?: string;
  latestNav: string;
  settlementCycle: string;
  noticePeriodDays: number;
  maxRedemptionQuantityPerInvestor: string;
  manualApprovalRequired: boolean;
  pauseRedemptionAfterListing: boolean;
  cutOffTime: string;
  createdTime: string;
  transferAgentOps?: TransferAgentOperations;
  manualExcludedRequestIds?: string[];
  lastAction?: string;
  lastActorRole?: ActorRole;
  lastActionAt?: string;
  identitySource?: "authSession";
}

export interface FundDistribution {
  id: string;
  fundId?: string;
  fundName?: string;
  fundToken?: string;
  name: string;
  description: string;
  status: DistributionLifecycleStatus | string;
  assetType: string;
  tokenAddress?: string;
  initialNav?: string;
  distributionRateType?: string;
  distributionRate?: string;
  distributionUnit?: string;
  payoutMode?: "Direct Transfer" | "Claim";
  payoutToken?: string;
  payoutAccount?: string;
  actualDaysInPeriod?: string;
  actualDaysInYear?: string;
  recordDate?: string;
  paymentDate?: string;
  createdTime?: string;
  transferAgentOps?: TransferAgentOperations;
  manualExcludedInvestorIds?: string[];
  lastAction?: string;
  lastActorRole?: ActorRole;
  lastActionAt?: string;
  identitySource?: "authSession";
}

export type InstructionType =
  | "Subscription"
  | "Redemption"
  | "Transfer"
  | "WalletChange"
  | "DistributionEvent"
  | "RecordDate"
  | "RegisterCorrection"
  | "TokenRecovery";

export type InstructionStatus =
  | "Received"
  | "PendingEvidence"
  | "PendingApproval"
  | "ReadyForRegisterReview"
  | "SnapshotLocked"
  | "ListGenerated"
  | "SubmittedToIssuer"
  | "IssuerAcknowledged"
  | "RegisterDeltaPrepared"
  | "RegisterPosted"
  | "Rejected"
  | "Cancelled"
  | "Reconciled";

export interface TransferAgencyInstruction {
  instructionId: string;
  instructionType: InstructionType;
  fundId: string;
  classId: string;
  sourceActorType: "Investor" | "Issuer" | "Distributor" | "TransferAgent" | "Custodian" | "VATP" | "System";
  sourceActorId: string;
  sourceChannel: "IssuerPortal" | "InvestorPortal" | "TAConsole" | "DistributorAPI" | "VATPAPI" | "BatchUpload" | "System";
  sourceReference?: string;
  idempotencyKey: string;
  status: InstructionStatus;
  evidenceRefIds: string[];
  createdAt: string;
  updatedAt: string;
  version: number;
  lastAction?: string;
  lastActorRole?: ActorRole;
  lastActionAt?: string;
}

export interface RegisterAccount {
  registerAccountId: string;
  fundId: string;
  classId: string;
  holderId: string;
  holderName: string;
  registeredAddress: string;
  holderType: "Direct" | "Nominee" | "DistributorOmnibus" | "VATPOmnibus";
  units: string;
  accountStatus: "Pending" | "Active" | "Restricted" | "Suspended" | "Closed";
  openedAt?: string;
  ceasedAt?: string;
  source: "Direct" | "Distributor" | "HKEXIFP" | "VATP" | "Migration";
  lastDeltaId?: string;
  lastReconciledAt?: string;
  version: number;
}

export interface WalletLink {
  walletLinkId: string;
  registerAccountId: string;
  walletAddress: string;
  chainId: string;
  proofStatus: "Missing" | "Submitted" | "Verified" | "Rejected" | "Expired";
  whitelistStatus: "NotRequired" | "Pending" | "Whitelisted" | "Removed" | "Suspended";
  proofRefId?: string;
  verifiedAt?: string;
  version: number;
}

export interface RegisterDelta {
  deltaId: string;
  instructionId: string;
  fundId: string;
  classId: string;
  registerAccountId: string;
  deltaType: "Issue" | "Redeem" | "TransferIn" | "TransferOut" | "WalletChange" | "Restriction" | "Correction";
  units: string;
  navRefId?: string;
  cashRefId?: string;
  tokenEventRefId?: string;
  reasonCode: string;
  makerId?: string;
  checkerId?: string;
  makerStatus: "Draft" | "Submitted";
  checkerStatus: "NotRequired" | "Pending" | "Approved" | "Rejected";
  postingStatus: "NotPosted" | "Posting" | "Posted" | "Reversed" | "Failed";
  effectiveAt?: string;
  postedAt?: string;
  previousRegisterVersionId?: string;
  newRegisterVersionId?: string;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  lastAction?: string;
  lastActorRole?: ActorRole;
  lastActionAt?: string;
}

export interface RegisterVersion {
  registerVersionId: string;
  fundId: string;
  classId: string;
  status: "Draft" | "PendingChecker" | "Released" | "Superseded" | "Voided";
  effectiveAt: string;
  releasedAt?: string;
  previousRegisterVersionId?: string;
  totalHolders: number;
  totalUnits: string;
  registerHash: string;
  deltaIds: string[];
  releasedBy?: string;
  createdAt: string;
  version: number;
}

export interface CashMovement {
  cashMovementId: string;
  instructionId: string;
  fundId: string;
  classId: string;
  direction: "In" | "Out";
  amount: string;
  currency: string;
  status: "Expected" | "ProofUploaded" | "Matched" | "Confirmed" | "Failed" | "Reversed";
  owner: "IssuerOps" | "Custodian" | "Bank" | "StablecoinCustodian" | "TransferAgent";
  reference?: string;
  confirmedAt?: string;
  version: number;
}

export interface TransferAgencyNavRecord {
  navRefId: string;
  fundId: string;
  classId: string;
  navDate: string;
  navValue: string;
  currency: string;
  status: "Draft" | "Official" | "Corrected" | "Voided";
  publishedAt?: string;
  version: number;
}

export interface TokenEvent {
  tokenEventRefId: string;
  fundId: string;
  classId: string;
  eventType: "Mint" | "Burn" | "Transfer" | "Whitelist" | "Recover" | "Pause" | "Unpause";
  chainId: string;
  txHash?: string;
  blockNumber?: number;
  fromAddress?: string;
  toAddress?: string;
  amount?: string;
  status: "Observed" | "Confirmed" | "Finalized" | "Rejected" | "Reorged";
  linkedDeltaId?: string;
  createdAt: string;
  version: number;
}

export type OnChainEventType =
  | "FundUnitMint"
  | "FundUnitBurn"
  | "DistributionPayout"
  | "DistributionClaimOpen"
  | "DistributionTransferBatch"
  | "WhitelistUpdate"
  | "TransferRestriction";

export interface OnChainEvent {
  onChainEventId: string;
  sourceType: "Issuance" | "Distribution" | "Redemption" | "Register" | "Wallet";
  sourceReference: string;
  eventType: OnChainEventType;
  fundId: string;
  classId?: string;
  chainId: string;
  contractAddress?: string;
  method?: string;
  txHash?: string;
  blockNumber?: number;
  status: "Prepared" | "Submitted" | "Confirmed" | "Finalized" | "Failed";
  payloadHash?: string;
  merkleRoot?: string;
  amount?: string;
  currency?: string;
  actorRole?: ActorRole;
  idempotencyKey: string;
  createdAt: string;
  confirmedAt?: string;
  version: number;
}

export type AnchoringEventType =
  | "RegisterVersion"
  | "HolderSnapshot"
  | "SettlementList"
  | "EvidencePack"
  | "ApprovalAttestation";

export interface AnchoringEvent {
  anchoringEventId: string;
  anchorType: AnchoringEventType;
  sourceType: "Distribution" | "Redemption" | "Issuance" | "Register" | "Workflow";
  sourceReference: string;
  targetId: string;
  fundId?: string;
  classId?: string;
  chainId: string;
  contentHash: string;
  merkleRoot?: string;
  txHash?: string;
  blockNumber?: number;
  status: "Prepared" | "Submitted" | "Confirmed" | "Failed";
  actorRole?: ActorRole;
  idempotencyKey: string;
  createdAt: string;
  anchoredAt?: string;
  version: number;
}

export interface ReconciliationBreak {
  breakId: string;
  fundId: string;
  classId: string;
  instructionId?: string;
  registerDeltaId?: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  breakType:
    | "RegisterVsToken"
    | "RegisterVsCash"
    | "OrderVsRegister"
    | "WalletNotMapped"
    | "RestrictedTransfer"
    | "NAVMismatch"
    | "DuplicateInstruction"
    | "ApprovalMissing";
  description: string;
  status: "Open" | "Assigned" | "UnderReview" | "Resolved" | "Waived";
  ownerRole: "Issuer" | "TransferAgent" | "Distributor" | "Custodian" | "VATP" | "System";
  resolutionRefId?: string;
  detectedAt: string;
  resolvedAt?: string;
  version: number;
  lastAction?: string;
  lastActorRole?: ActorRole;
  lastActionAt?: string;
}

export interface EvidenceRecord {
  evidenceRefId: string;
  fundId?: string;
  classId?: string;
  instructionId?: string;
  registerDeltaId?: string;
  evidenceType:
    | "OfferingDocument"
    | "ProductProviderApproval"
    | "KYCReference"
    | "SuitabilityReference"
    | "CashConfirmation"
    | "NAVPublication"
    | "TokenEvent"
    | "RegisterVersion"
    | "ReconciliationReport"
    | "Waiver"
    | "CorrectionMemo";
  label: string;
  storageUri?: string;
  contentHash?: string;
  sourceActorType: TransferAgencyInstruction["sourceActorType"];
  sourceActorId: string;
  createdAt: string;
  retentionClass: "Operational" | "Audit" | "Regulatory";
  version: number;
}

export type HolderSnapshotSourceType = "Distribution" | "Redemption";

export interface HolderSnapshot {
  snapshotId: string;
  sourceType: HolderSnapshotSourceType;
  sourceReference: string;
  instructionId: string;
  fundId: string;
  classId: string;
  registerVersionId: string;
  recordDate: string;
  status: "Requested" | "Locked" | "SubmittedToIssuer" | "IssuerAcknowledged" | "Reconciled";
  lockedAt?: string;
  submittedToIssuerAt?: string;
  issuerAcknowledgedAt?: string;
  reconciledAt?: string;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  lastAction?: string;
  lastActorRole?: ActorRole;
  lastActionAt?: string;
}

export interface HolderSnapshotPosition {
  positionId: string;
  snapshotId: string;
  registerAccountId: string;
  holderName: string;
  holderId: string;
  units: string;
  walletAddress: string;
  restrictionStatus: RegisterAccount["accountStatus"];
  included: boolean;
  exclusionReason?: string;
  entitlementAmount?: string;
  cashAmount?: string;
  version: number;
}

export interface SettlementList {
  listId: string;
  listType: "RecipientList" | "PaymentList";
  snapshotId: string;
  sourceType: HolderSnapshotSourceType;
  sourceReference: string;
  status: "Draft" | "Generated" | "SubmittedToIssuer" | "Acknowledged" | "Reconciled";
  generatedAt?: string;
  submittedToIssuerAt?: string;
  acknowledgedAt?: string;
  reconciledAt?: string;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  lastAction?: string;
  lastActorRole?: ActorRole;
  lastActionAt?: string;
}

export interface SettlementListLine {
  lineId: string;
  listId: string;
  snapshotId: string;
  holderSnapshotPositionId: string;
  registerAccountId: string;
  holderName: string;
  amount: string;
  currency: string;
  destination: string;
  status: "Ready" | "Submitted" | "Paid" | "Reconciled" | "Held";
  evidenceRefIds: string[];
  version: number;
}

export const initialFunds: FundIssuance[] = [
  {
    id: "fund-open-001",
    name: "Daily Liquidity Fund",
    status: "Active Dealing",
    description: "Open-end money market style fund with daily subscription and redemption processing.",
    assetType: "Fund",
    offeringType: "Publicly Offered Fund",
    legalStructure: "OFC",
    fundDistributionChannel: "Unlisted fund",
    assetStrategyCategory: "Money Market Fund",
    allocationStatus: "N/A",
    createdTime: "2026-04-10 09:30:00",
    tokenName: "DLF-2026",
    tokenAddress: "0x3E6C8F12a4B7d9e0F3a1C6D5E8b9F2A7c4D8e1B2",
    assetCurrency: "HKD",
    minSubscriptionAmount: "10,000 HKD",
    maxSubscriptionAmount: "5,000,000 HKD",
    minSubscriptionAmountValue: 10000,
    maxSubscriptionAmountValue: 5000000,
    initialNav: "1.0000 HKD",
    initialNavValue: 1,
    currentNav: "1.0246 HKD",
    currentNavValue: 1.0246,
    navCurrency: "HKD",
    fundType: "Open-end",
    managementFee: "0.8% p.a.",
    performanceFee: "N/A",
    redemptionFrequency: "Daily",
    lockupPeriod: "7 Days",
    lockupPeriodDays: 7,
    tradable: "No",
    fundManager: "WeBank Asset Management",
    targetFundSize: "25,000,000 HKD",
    targetFundSizeValue: 25000000,
    investmentStrategy: "Short-duration treasury and investment-grade cash equivalent assets with daily liquidity management.",
    subscriptionStartDate: "2026-04-01 09:00:00",
    subscriptionEndDate: "2026-04-15 16:00:00",
    issueDate: "2026-04-16 09:00:00",
    maturityDate: null,
    subscriptionLotSize: 1,
    subscriptionMinQuantity: 1,
    subscriptionMaxQuantity: 5000000,
    dealingFrequency: "Daily",
    dealingCutoffTime: "16:00 HKT",
    navValuationTime: "18:00 HKT",
    settlementCycle: "T+1",
    subscriptionPaymentMethod: "Tokenized Deposit",
    subscriptionPaymentRail: "On-chain Wallet Transfer",
    subscriptionCashCurrency: "HKD",
    subscriptionSettlementAccountType: "Wallet",
    subscriptionCollectionWallet: "0xCOLLECT-HKD-001",
    paymentReferenceRule: "Include dealing batch date in transfer note",
    paymentProofRequired: false,
    cashConfirmationOwner: "Operations",
    subscriptionStatus: "Open",
    redemptionStatus: "Open",
    redemptionMode: "Daily dealing",
    noticePeriodDays: 0,
    maxRedemptionPerInvestor: "500,000 units / dealing day",
    fundLevelRedemptionGate: "10% of fund NAV / day",
    navUpdateMode: "Oracle Feed",
    oracleProvider: "Chainlink NAV Adapter",
    oracleFeedId: "HKD-DLF-NAV-001",
    oracleUpdateFrequency: "Every dealing day at 18:05 HKT",
    oracleFallbackRule: "Fallback to manual override after 30 minutes without a fresh oracle tick",
    oracleLastSyncedAt: "2026-04-16 18:05:00",
    lastNavUpdateTime: "2026-04-16 18:05:00",
    nextCutoffTime: "2026-04-17 16:00:00",
    nextConfirmationDate: "2026-04-17 18:00:00",
    nextSettlementTime: "2026-04-18 10:00:00",
    orderConfirmationMethod: "Auto at cut-off",
    availableHoldingUnits: 324500,
    availableHoldingLabel: "324,500 units",
    pendingSubscriptionOrders: 6,
    pendingRedemptionOrders: 3,
    totalSubscribedAmount: "8,460,000 HKD",
    totalRedeemedAmount: "1,240,000 HKD",
    transferAgentOps: {
      transferAgentName: "WeBank Transfer Agent Desk",
      transferAgentStatus: "Daily Register Maintenance",
      holderRegisterDate: "2026-04-16 18:20:00",
      registerVersion: "REG-DLF-20260416-018",
      investorOnboardingStatus: "Confirmed",
      orderBookStatus: "Daily batch locked",
      ledgerApprovalStatus: "Posted after NAV confirmation",
      ledgerApprovedAt: "2026-04-16 18:22:00",
      mintInstructionStatus: "Not applicable for daily dealing",
      lastTransferAgentAction:
        "Booked confirmed subscriptions and earmarked redemption units after the cut-off batch.",
    },
    navHistory: [
      {
        id: "nav-dlf-1",
        navDate: "2026-04-16",
        navValue: 1.0246,
        currency: "HKD",
        updatedAt: "2026-04-16 18:05:00",
        note: "Daily close NAV",
      },
      {
        id: "nav-dlf-2",
        navDate: "2026-04-15",
        navValue: 1.0239,
        currency: "HKD",
        updatedAt: "2026-04-15 18:04:00",
      },
      {
        id: "nav-dlf-3",
        navDate: "2026-04-14",
        navValue: 1.0228,
        currency: "HKD",
        updatedAt: "2026-04-14 18:03:00",
      },
    ],
  },
  {
    id: "fund-open-002",
    name: "Institutional Treasury Plus",
    status: "Paused",
    description: "Open-end treasury management fund temporarily paused for new subscriptions while redemption remains open.",
    assetType: "Fund",
    offeringType: "Publicly Offered Fund",
    legalStructure: "OFC",
    fundDistributionChannel: "Unlisted fund",
    assetStrategyCategory: "Bond Fund",
    allocationStatus: "N/A",
    createdTime: "2026-03-28 11:10:00",
    tokenName: "ITP-2026",
    tokenAddress: "0x1A9f8c7B6d5E4F3a2B1c9D8e7F6a5B4C3d2E1f0A",
    assetCurrency: "USDC",
    minSubscriptionAmount: "25,000 USDC",
    maxSubscriptionAmount: "3,500,000 USDC",
    minSubscriptionAmountValue: 25000,
    maxSubscriptionAmountValue: 3500000,
    initialNav: "1.0000 USDC",
    initialNavValue: 1,
    currentNav: "1.0182 USDC",
    currentNavValue: 1.0182,
    navCurrency: "USDC",
    fundType: "Open-end",
    managementFee: "0.65% p.a.",
    performanceFee: "N/A",
    redemptionFrequency: "Daily",
    lockupPeriod: "None",
    lockupPeriodDays: 0,
    tradable: "No",
    fundManager: "WeBank Treasury Strategies",
    targetFundSize: "15,000,000 USDC",
    targetFundSizeValue: 15000000,
    investmentStrategy: "Institutional treasury ladder with tokenized short-term fixed income instruments.",
    subscriptionStartDate: "2026-03-10 09:00:00",
    subscriptionEndDate: "2026-03-20 16:00:00",
    issueDate: "2026-03-21 09:00:00",
    maturityDate: null,
    subscriptionLotSize: 1,
    subscriptionMinQuantity: 1,
    subscriptionMaxQuantity: 3500000,
    dealingFrequency: "Daily",
    dealingCutoffTime: "15:00 UTC",
    navValuationTime: "17:30 UTC",
    settlementCycle: "T+1",
    subscriptionPaymentMethod: "Stablecoin",
    subscriptionPaymentRail: "On-chain Wallet Transfer",
    subscriptionCashCurrency: "USDC",
    subscriptionSettlementAccountType: "Wallet",
    subscriptionCollectionWallet: "0xCOLLECT-USDC-002",
    paymentReferenceRule: "Use wallet transfer hash as payment reference",
    paymentProofRequired: false,
    cashConfirmationOwner: "Operations",
    subscriptionStatus: "Paused",
    redemptionStatus: "Open",
    redemptionMode: "Daily dealing",
    noticePeriodDays: 0,
    maxRedemptionPerInvestor: "250,000 units / dealing day",
    fundLevelRedemptionGate: "8% of fund NAV / day",
    navUpdateMode: "Manual",
    oracleFallbackRule: "Manual NAV committee approval remains primary while subscriptions are paused",
    lastNavUpdateTime: "2026-04-16 17:35:00",
    nextCutoffTime: "2026-04-17 15:00:00",
    nextConfirmationDate: "2026-04-17 17:30:00",
    nextSettlementTime: "2026-04-18 11:00:00",
    orderConfirmationMethod: "Issuer review then confirm",
    availableHoldingUnits: 810000,
    availableHoldingLabel: "810,000 units",
    pendingSubscriptionOrders: 0,
    pendingRedemptionOrders: 2,
    totalSubscribedAmount: "5,200,000 USDC",
    totalRedeemedAmount: "980,000 USDC",
    transferAgentOps: {
      transferAgentName: "WeBank Transfer Agent Desk",
      transferAgentStatus: "Paused With Register Servicing",
      holderRegisterDate: "2026-04-16 17:40:00",
      registerVersion: "REG-ITP-20260416-011",
      investorOnboardingStatus: "Issuer review required",
      orderBookStatus: "Redemption-only servicing",
      ledgerApprovalStatus: "Posted after manual confirmation",
      ledgerApprovedAt: "2026-04-16 17:45:00",
      mintInstructionStatus: "Subscription minting paused",
      lastTransferAgentAction:
        "Continued redemption servicing while keeping the subscription register closed for new units.",
    },
    navHistory: [
      {
        id: "nav-itp-1",
        navDate: "2026-04-16",
        navValue: 1.0182,
        currency: "USDC",
        updatedAt: "2026-04-16 17:35:00",
      },
      {
        id: "nav-itp-2",
        navDate: "2026-04-15",
        navValue: 1.0178,
        currency: "USDC",
        updatedAt: "2026-04-15 17:34:00",
      },
    ],
  },
  {
    id: "fund-open-003",
    name: "Asia Income Access Fund",
    status: "Initial Subscription",
    description: "Open-end income fund still in its initial launch subscription window before daily dealing starts.",
    assetType: "Fund",
    offeringType: "Publicly Offered Fund",
    legalStructure: "Unit Trust",
    fundDistributionChannel: "Unlisted fund",
    assetStrategyCategory: "Mixed Asset Fund",
    allocationStatus: "Upcoming",
    createdTime: "2026-04-12 14:20:00",
    tokenName: "AIAF-2026",
    tokenAddress: "–",
    assetCurrency: "HKD",
    minSubscriptionAmount: "5,000 HKD",
    maxSubscriptionAmount: "1,000,000 HKD",
    minSubscriptionAmountValue: 5000,
    maxSubscriptionAmountValue: 1000000,
    initialNav: "10.0000 HKD",
    initialNavValue: 10,
    currentNav: "10.0000 HKD",
    currentNavValue: 10,
    navCurrency: "HKD",
    fundType: "Open-end",
    managementFee: "1.2% p.a.",
    performanceFee: "8%",
    redemptionFrequency: "Daily",
    lockupPeriod: "30 Days",
    lockupPeriodDays: 30,
    tradable: "No",
    fundManager: "APAC Opportunities Manager",
    targetFundSize: "12,000,000 HKD",
    targetFundSizeValue: 12000000,
    investmentStrategy: "Multi-asset APAC income strategy with tokenized bond and money market allocation.",
    subscriptionStartDate: "2026-04-15 09:00:00",
    subscriptionEndDate: "2026-04-25 16:00:00",
    issueDate: "2026-04-28 09:00:00",
    maturityDate: null,
    subscriptionLotSize: 1,
    subscriptionMinQuantity: 1,
    subscriptionMaxQuantity: 1000000,
    dealingFrequency: "Daily",
    dealingCutoffTime: "16:00 HKT",
    navValuationTime: "18:30 HKT",
    settlementCycle: "T+1",
    subscriptionStatus: "Open",
    redemptionStatus: "Paused",
    redemptionMode: "Daily dealing",
    noticePeriodDays: 1,
    maxRedemptionPerInvestor: "150,000 units / dealing day",
    fundLevelRedemptionGate: "5% of fund NAV / day",
    navUpdateMode: "Oracle Feed",
    oracleProvider: "Internal Demo Oracle",
    oracleFeedId: "AIAF-NAV-LAUNCH",
    oracleUpdateFrequency: "Every launch day close",
    oracleFallbackRule: "Issuer can manually seed the launch NAV before the first oracle publish",
    oracleLastSyncedAt: "2026-04-16 18:30:00",
    lastNavUpdateTime: "2026-04-16 18:30:00",
    nextCutoffTime: "2026-04-17 16:00:00",
    nextConfirmationDate: "2026-04-17 18:30:00",
    nextSettlementTime: "2026-04-18 10:30:00",
    orderConfirmationMethod: "Auto at cut-off",
    availableHoldingUnits: 0,
    availableHoldingLabel: "0 units",
    pendingSubscriptionOrders: 4,
    pendingRedemptionOrders: 0,
    totalSubscribedAmount: "2,800,000 HKD",
    totalRedeemedAmount: "0 HKD",
    navHistory: [
      {
        id: "nav-aiaf-1",
        navDate: "2026-04-16",
        navValue: 10,
        currency: "HKD",
        updatedAt: "2026-04-16 18:30:00",
        note: "Launch reference NAV",
      },
    ],
  },
  {
    id: "fund-closed-001",
    name: "Real Estate Fund A",
    status: "Open For Subscription",
    description: "Closed-end commercial real estate investment opportunity retained for legacy demo coverage.",
    assetType: "Fund",
    offeringType: "Private Fund",
    legalStructure: "LPF",
    fundDistributionChannel: "Unlisted fund",
    assetStrategyCategory: "Real Estate Fund / REIT",
    allocationStatus: "Ongoing",
    createdTime: "2026-04-01 11:22:45",
    tokenName: "RE-FUND-A-2024",
    tokenAddress: "0xa7E4F2c8b9D1e3A5C7F6B2d8E9A1c3F5b7D9e2A4",
    assetCurrency: "HKD",
    minSubscriptionAmount: "10 HKD",
    maxSubscriptionAmount: "10,000 HKD",
    minSubscriptionAmountValue: 10,
    maxSubscriptionAmountValue: 10000,
    initialNav: "95 HKD",
    initialNavValue: 95,
    currentNav: "95 HKD",
    currentNavValue: 95,
    navCurrency: "HKD",
    fundType: "Closed-end",
    managementFee: "1.25% p.a.",
    performanceFee: "12%",
    redemptionFrequency: "None",
    lockupPeriod: "365 Days",
    lockupPeriodDays: 365,
    tradable: "No",
    fundManager: "Premium Real Estate Capital",
    targetFundSize: "10,000,000 HKD",
    targetFundSizeValue: 10000000,
    investmentStrategy: "Closed-end commercial real estate investment opportunities.",
    subscriptionStartDate: "2026-04-01 09:00:00",
    subscriptionEndDate: "2026-04-30 17:00:00",
    issueDate: "2026-05-05 10:00:00",
    maturityDate: "2029-05-05 10:00:00",
    subscriptionLotSize: 100,
    subscriptionMinQuantity: 1,
    subscriptionMaxQuantity: 100,
    subscriptionPaymentMethod: "Fiat",
    subscriptionPaymentRail: "Off-chain Bank Transfer",
    subscriptionCashCurrency: "HKD",
    subscriptionSettlementAccountType: "Bank Account",
    receivingBankName: "Bank of China (Hong Kong)",
    receivingBankAccountName: "Premium Real Estate Capital Client Monies",
    receivingBankAccountNumberMasked: "012-888-456789-001",
    receivingBankSwiftCode: "BKCHHKHHXXX",
    paymentReferenceRule: "Use investor name plus subscription order ID in bank remittance note",
    paymentProofRequired: true,
    cashConfirmationOwner: "Issuer",
    allocationRule: "Pro-rata",
    transferAgentOps: {
      transferAgentName: "Harbor Registry Services",
      transferAgentStatus: "Subscription Book Monitoring",
      holderRegisterDate: "2026-04-18 16:30:00",
      registerVersion: "PRE-ISS-REA-001",
      investorOnboardingStatus: "KYC / eligibility reviewed",
      orderBookStatus: "Live subscription book",
      allocationBookStatus: "Pending close and calculation",
      ledgerApprovalStatus: "Pre-issuance register draft prepared",
      mintInstructionStatus: "Pending final allocation",
      lastTransferAgentAction:
        "Validated investor eligibility and prepared the pre-allocation holder register draft.",
    },
    investorRules: [
      {
        ruleType: "investor-type",
        condition: "Must be",
        value: "Professional investor",
      },
      {
        ruleType: "risk-test-level",
        condition: "Must be at least",
        value: "4",
      },
    ],
    navHistory: [],
  },
];

export const initialFundOrders: FundOrder[] = [
  {
    id: "sub-001",
    fundId: "fund-open-001",
    investorId: "inv-001",
    investorName: "John Doe",
    investorWallet: "0xa7E4F2c8b9D1e3A5C7F6B2d8E9A1c3F5b7D9e2A4",
    type: "subscription",
    requestAmount: "250,000 HKD",
    requestQuantity: "243,997.66 units",
    estimatedNav: "1.0246 HKD",
    estimatedSharesOrCash: "243,997.66 units",
    submitTime: "2026-04-16 11:18:00",
    status: "Pending NAV",
    distributionElection: "Distribution Reinvestment",
    paymentMethod: "Tokenized Deposit",
    paymentStatus: "Funds Cleared",
    paymentReference: "TX-OPEN-HKD-001",
    unitBookingStatus: "Ready To Book",
    batchId: "batch-sub-001",
    note: "Will be processed at next daily cut-off",
  },
  {
    id: "sub-002",
    fundId: "fund-open-001",
    investorId: "inv-001",
    investorName: "John Doe",
    investorWallet: "0xa7E4F2c8b9D1e3A5C7F6B2d8E9A1c3F5b7D9e2A4",
    type: "subscription",
    requestAmount: "500,000 HKD",
    requestQuantity: "488,281.25 units",
    estimatedNav: "1.0240 HKD",
    confirmedNav: "1.0240 HKD",
    estimatedSharesOrCash: "488,281.25 units",
    confirmedSharesOrCash: "488,281.25 units",
    submitTime: "2026-04-15 13:26:00",
    confirmTime: "2026-04-15 18:10:00",
    settlementTime: "2026-04-16 10:05:00",
    status: "Confirmed",
    distributionElection: "Distribution Reinvestment",
    paymentMethod: "Tokenized Deposit",
    paymentStatus: "Funds Cleared",
    paymentReference: "TX-OPEN-HKD-002",
    cashReceivedAt: "2026-04-15 13:27:00",
    cashConfirmedBy: "Operations",
    cashConfirmedAt: "2026-04-15 13:30:00",
    unitBookingStatus: "Booked",
    batchId: "batch-sub-000",
  },
  {
    id: "sub-003",
    fundId: "fund-open-001",
    investorId: "inv-002",
    investorName: "Acme Treasury",
    investorWallet: "0x9c3A1E5d8F4B2c6D7e9A4f2C5b8D3e6A1f4B7c9E",
    type: "subscription",
    requestAmount: "1,200,000 HKD",
    requestQuantity: "1,171,189.54 units",
    estimatedNav: "1.0246 HKD",
    estimatedSharesOrCash: "1,171,189.54 units",
    submitTime: "2026-04-16 14:05:00",
    status: "Submitted",
    distributionElection: "Cash Distribution",
    paymentMethod: "Tokenized Deposit",
    paymentStatus: "Funds Cleared",
    paymentReference: "TX-OPEN-HKD-003",
    unitBookingStatus: "Pending",
    batchId: "batch-sub-001",
  },
  {
    id: "red-001",
    fundId: "fund-open-001",
    investorId: "inv-001",
    investorName: "John Doe",
    investorWallet: "0xa7E4F2c8b9D1e3A5C7F6B2d8E9A1c3F5b7D9e2A4",
    type: "redemption",
    requestAmount: "150,000 units",
    requestQuantity: "150,000 units",
    estimatedNav: "1.0246 HKD",
    estimatedSharesOrCash: "153,690.00 HKD",
    submitTime: "2026-04-16 09:42:00",
    status: "Pending Cash Settlement",
    batchId: "batch-red-001",
    settlementTime: "2026-04-17 10:00:00",
    note: "Cash payment scheduled on T+1",
  },
  {
    id: "red-002",
    fundId: "fund-open-001",
    investorId: "inv-001",
    investorName: "John Doe",
    investorWallet: "0xa7E4F2c8b9D1e3A5C7F6B2d8E9A1c3F5b7D9e2A4",
    type: "redemption",
    requestAmount: "100,000 units",
    requestQuantity: "100,000 units",
    estimatedNav: "1.0239 HKD",
    confirmedNav: "1.0239 HKD",
    estimatedSharesOrCash: "102,390.00 HKD",
    confirmedSharesOrCash: "102,390.00 HKD",
    submitTime: "2026-04-15 10:15:00",
    confirmTime: "2026-04-15 18:12:00",
    settlementTime: "2026-04-16 10:02:00",
    status: "Completed",
    batchId: "batch-red-000",
  },
  {
    id: "red-003",
    fundId: "fund-open-001",
    investorId: "inv-003",
    investorName: "Blue Harbor Capital",
    investorWallet: "0x6F4B2c6D7e9A4f2C5b8D3e6A1f4B7c9E0a1C2D3E",
    type: "redemption",
    requestAmount: "75,000 units",
    requestQuantity: "75,000 units",
    estimatedNav: "1.0246 HKD",
    estimatedSharesOrCash: "76,845.00 HKD",
    submitTime: "2026-04-16 15:12:00",
    status: "Pending Review",
    batchId: "batch-red-001",
  },
  {
    id: "sub-ce-001",
    fundId: "fund-closed-001",
    investorId: "inv-101",
    investorName: "Harbor Family Office",
    investorWallet: "0x1a2B3c4D5e6F708192A3b4C5d6E7f8091A2b3C4d",
    type: "subscription",
    requestAmount: "4,000,000 HKD",
    requestQuantity: "42,105.26 units",
    estimatedNav: "95 HKD",
    estimatedSharesOrCash: "42,105.26 units",
    submitTime: "2026-04-18 10:15:00",
    status: "Pending Review",
    distributionElection: "Distribution Reinvestment",
    paymentMethod: "Fiat",
    paymentStatus: "Payment Proof Uploaded",
    paymentReference: "REA-FO-20260418-001",
    payerAccountName: "Harbor Family Office",
    payerBankAccountMasked: "012-221-****889",
    paymentProofName: "harbor-family-office-slip.pdf",
    unitBookingStatus: "Pending",
    note: "Professional investor onboarding complete, pending issuer review.",
  },
  {
    id: "sub-ce-002",
    fundId: "fund-closed-001",
    investorId: "inv-102",
    investorName: "Granite Institutional Fund",
    investorWallet: "0x2b3C4d5E6f708192A3b4C5d6E7f8091A2b3C4d5E",
    type: "subscription",
    requestAmount: "5,000,000 HKD",
    requestQuantity: "52,631.58 units",
    estimatedNav: "95 HKD",
    estimatedSharesOrCash: "52,631.58 units",
    submitTime: "2026-04-18 11:40:00",
    status: "Submitted",
    distributionElection: "Cash Distribution",
    paymentMethod: "Fiat",
    paymentStatus: "Awaiting Payment",
    paymentReference: "REA-IF-20260418-002",
    payerAccountName: "Granite Institutional Fund",
    unitBookingStatus: "Pending",
    note: "Waiting for subscription review before allocation book closes.",
  },
  {
    id: "sub-ce-003",
    fundId: "fund-closed-001",
    investorId: "inv-103",
    investorName: "Summit Qualified Investors SPC",
    investorWallet: "0x3c4D5e6F708192A3b4C5d6E7f8091A2b3C4d5E6f",
    type: "subscription",
    requestAmount: "4,500,000 HKD",
    requestQuantity: "47,368.42 units",
    estimatedNav: "95 HKD",
    estimatedSharesOrCash: "47,368.42 units",
    submitTime: "2026-04-18 14:05:00",
    status: "Pending Review",
    distributionElection: "Cash Distribution",
    paymentMethod: "Fiat",
    paymentStatus: "Funds Cleared",
    paymentReference: "REA-SPC-20260418-003",
    payerAccountName: "Summit Qualified Investors SPC",
    payerBankAccountMasked: "388-110-****552",
    cashReceivedAt: "2026-04-18 16:42:00",
    cashConfirmedBy: "Issuer Treasury Ops",
    cashConfirmedAt: "2026-04-18 17:05:00",
    unitBookingStatus: "Ready To Book",
    note: "Oversubscription expected if accepted in full.",
  },
  {
    id: "red-ce-001",
    fundId: "fund-closed-001",
    investorId: "inv-101",
    investorName: "Harbor Family Office",
    investorWallet: "HK-SETTLE-FO-001",
    type: "redemption",
    requestAmount: "20,000 units",
    requestQuantity: "20,000 units",
    estimatedNav: "100 HKD",
    confirmedNav: "100 HKD",
    estimatedSharesOrCash: "2,000,000 HKD",
    confirmedSharesOrCash: "2,000,000 HKD",
    submitTime: "2026-05-10 10:30:00",
    confirmTime: "2026-05-12 16:20:00",
    settlementTime: "2026-05-15 11:00:00",
    status: "Pending Cash Settlement",
    note: "Accepted into the issuer-led repurchase event and queued for cash payment.",
  },
  {
    id: "red-ce-002",
    fundId: "fund-closed-001",
    investorId: "inv-102",
    investorName: "Granite Institutional Fund",
    investorWallet: "HK-SETTLE-IF-002",
    type: "redemption",
    requestAmount: "15,000 units",
    requestQuantity: "15,000 units",
    estimatedNav: "100 HKD",
    confirmedNav: "100 HKD",
    estimatedSharesOrCash: "1,500,000 HKD",
    confirmedSharesOrCash: "1,500,000 HKD",
    submitTime: "2026-05-10 13:15:00",
    confirmTime: "2026-05-12 16:22:00",
    settlementTime: "2026-05-14 15:35:00",
    status: "Completed",
    note: "Cash payment completed against the approved repurchase event.",
  },
];

export const initialTransferAgencyInstructions: TransferAgencyInstruction[] = [
  {
    instructionId: "instr-sub-001",
    instructionType: "Subscription",
    fundId: "fund-open-001",
    classId: "DLF-HKD",
    sourceActorType: "Investor",
    sourceActorId: "inv-001",
    sourceChannel: "InvestorPortal",
    sourceReference: "sub-001",
    idempotencyKey: "InvestorPortal:sub-001:Subscription:20260416",
    status: "ReadyForRegisterReview",
    evidenceRefIds: ["ev-cash-sub-001", "ev-nav-dlf-20260416", "ev-kyc-john"],
    createdAt: "2026-04-16 11:18:00",
    updatedAt: "2026-04-16 18:06:00",
    version: 1,
  },
  {
    instructionId: "instr-sub-003",
    instructionType: "Subscription",
    fundId: "fund-open-001",
    classId: "DLF-HKD",
    sourceActorType: "Distributor",
    sourceActorId: "dist-apac-001",
    sourceChannel: "DistributorAPI",
    sourceReference: "sub-003",
    idempotencyKey: "DistributorAPI:sub-003:Subscription:20260416",
    status: "PendingEvidence",
    evidenceRefIds: ["ev-cash-sub-003", "ev-nav-dlf-20260416"],
    createdAt: "2026-04-16 14:05:00",
    updatedAt: "2026-04-16 18:08:00",
    version: 1,
  },
  {
    instructionId: "instr-red-ce-001",
    instructionType: "Redemption",
    fundId: "fund-closed-001",
    classId: "REA-HKD",
    sourceActorType: "Issuer",
    sourceActorId: "issuer-real-estate-a",
    sourceChannel: "IssuerPortal",
    sourceReference: "red-ce-001",
    idempotencyKey: "IssuerPortal:red-ce-001:Redemption:20260512",
    status: "RegisterDeltaPrepared",
    evidenceRefIds: ["ev-nav-rea-20260512", "ev-payment-red-ce-001", "ev-issuer-redemption-approval"],
    createdAt: "2026-05-12 16:20:00",
    updatedAt: "2026-05-13 09:18:00",
    version: 2,
  },
  {
    instructionId: "instr-dist-002",
    instructionType: "RecordDate",
    fundId: "fund-closed-001",
    classId: "REA-HKD",
    sourceActorType: "Issuer",
    sourceActorId: "issuer-real-estate-a",
    sourceChannel: "IssuerPortal",
    sourceReference: "distribution-002",
    idempotencyKey: "IssuerPortal:distribution-002:RecordDate:20260520",
    status: "ReadyForRegisterReview",
    evidenceRefIds: ["ev-issuer-dist-approval", "ev-register-rea-20260520"],
    createdAt: "2026-05-20 17:30:00",
    updatedAt: "2026-05-20 18:25:00",
    version: 3,
  },
  {
    instructionId: "instr-redemption-003-ta",
    instructionType: "Redemption",
    fundId: "fund-closed-001",
    classId: "REA-HKD",
    sourceActorType: "Issuer",
    sourceActorId: "issuer-real-estate-a",
    sourceChannel: "IssuerPortal",
    sourceReference: "redemption-003",
    idempotencyKey: "IssuerPortal:redemption-003:RedemptionHandoff:20260512",
    status: "ReadyForRegisterReview",
    evidenceRefIds: ["ev-issuer-redemption-approval"],
    createdAt: "2026-05-12 16:30:00",
    updatedAt: "2026-05-12 16:30:00",
    version: 1,
  },
  {
    instructionId: "instr-vatp-placeholder",
    instructionType: "Transfer",
    fundId: "fund-open-001",
    classId: "DLF-HKD",
    sourceActorType: "VATP",
    sourceActorId: "vatp-demo-001",
    sourceChannel: "VATPAPI",
    sourceReference: "designed-not-enabled",
    idempotencyKey: "VATPAPI:designed-not-enabled:Transfer:20260416",
    status: "PendingApproval",
    evidenceRefIds: [],
    createdAt: "2026-04-16 16:05:00",
    updatedAt: "2026-04-16 16:05:00",
    version: 1,
  },
];

export const initialRegisterAccounts: RegisterAccount[] = [
  {
    registerAccountId: "ra-dlf-john",
    fundId: "fund-open-001",
    classId: "DLF-HKD",
    holderId: "holder-john",
    holderName: "John Doe",
    registeredAddress: "Central, Hong Kong SAR",
    holderType: "Direct",
    units: "488,281.25",
    accountStatus: "Active",
    openedAt: "2026-04-15 18:20:00",
    source: "Direct",
    lastDeltaId: "delta-sub-002",
    lastReconciledAt: "2026-04-16 10:05:00",
    version: 2,
  },
  {
    registerAccountId: "ra-dlf-acme",
    fundId: "fund-open-001",
    classId: "DLF-HKD",
    holderId: "holder-acme",
    holderName: "Acme Treasury",
    registeredAddress: "Quarry Bay, Hong Kong SAR",
    holderType: "DistributorOmnibus",
    units: "0",
    accountStatus: "Pending",
    source: "Distributor",
    version: 1,
  },
  {
    registerAccountId: "ra-rea-harbor",
    fundId: "fund-closed-001",
    classId: "REA-HKD",
    holderId: "holder-harbor",
    holderName: "Harbor Family Office",
    registeredAddress: "Admiralty, Hong Kong SAR",
    holderType: "Direct",
    units: "42,105.26",
    accountStatus: "Active",
    openedAt: "2026-04-25 10:00:00",
    source: "Distributor",
    lastDeltaId: "delta-rea-issuance-harbor",
    lastReconciledAt: "2026-05-20 18:20:00",
    version: 3,
  },
  {
    registerAccountId: "ra-rea-granite",
    fundId: "fund-closed-001",
    classId: "REA-HKD",
    holderId: "holder-granite",
    holderName: "Granite Institutional Fund",
    registeredAddress: "Tsim Sha Tsui, Hong Kong SAR",
    holderType: "Direct",
    units: "52,631.58",
    accountStatus: "Restricted",
    openedAt: "2026-04-25 10:00:00",
    source: "Distributor",
    lastDeltaId: "delta-rea-issuance-granite",
    lastReconciledAt: "2026-05-14 15:35:00",
    version: 3,
  },
];

export const initialWalletLinks: WalletLink[] = [
  {
    walletLinkId: "wl-dlf-john",
    registerAccountId: "ra-dlf-john",
    walletAddress: "0xa7E4F2c8b9D1e3A5C7F6B2d8E9A1c3F5b7D9e2A4",
    chainId: "wb-hk-chain",
    proofStatus: "Verified",
    whitelistStatus: "Whitelisted",
    proofRefId: "ev-wallet-john",
    verifiedAt: "2026-04-15 10:30:00",
    version: 2,
  },
  {
    walletLinkId: "wl-dlf-acme",
    registerAccountId: "ra-dlf-acme",
    walletAddress: "0x9c3A1E5d8F4B2c6D7e9A4f2C5b8D3e6A1f4B7c9E",
    chainId: "wb-hk-chain",
    proofStatus: "Expired",
    whitelistStatus: "Pending",
    proofRefId: "ev-wallet-acme-expired",
    verifiedAt: "2026-03-01 09:00:00",
    version: 1,
  },
  {
    walletLinkId: "wl-rea-harbor",
    registerAccountId: "ra-rea-harbor",
    walletAddress: "0x1a2B3c4D5e6F708192A3b4C5d6E7f8091A2b3C4d",
    chainId: "wb-hk-chain",
    proofStatus: "Verified",
    whitelistStatus: "Whitelisted",
    proofRefId: "ev-wallet-harbor",
    verifiedAt: "2026-04-18 09:45:00",
    version: 2,
  },
  {
    walletLinkId: "wl-rea-granite",
    registerAccountId: "ra-rea-granite",
    walletAddress: "0x2b3C4d5E6f708192A3b4C5d6E7f8091A2b3C4d5E",
    chainId: "wb-hk-chain",
    proofStatus: "Expired",
    whitelistStatus: "Suspended",
    proofRefId: "ev-wallet-granite-expired",
    verifiedAt: "2026-03-15 11:10:00",
    version: 2,
  },
];

export const initialRegisterDeltas: RegisterDelta[] = [
  {
    deltaId: "delta-sub-001",
    instructionId: "instr-sub-001",
    fundId: "fund-open-001",
    classId: "DLF-HKD",
    registerAccountId: "ra-dlf-john",
    deltaType: "Issue",
    units: "243,997.66",
    navRefId: "nav-dlf-20260416",
    cashRefId: "cash-sub-001",
    reasonCode: "PRIMARY_SUBSCRIPTION",
    makerStatus: "Draft",
    checkerStatus: "NotRequired",
    postingStatus: "NotPosted",
    effectiveAt: "2026-04-16 18:20:00",
    previousRegisterVersionId: "REG-DLF-HKD-20260415-017",
    newRegisterVersionId: "REG-DLF-HKD-20260416-018",
    idempotencyKey: "TAConsole:delta-sub-001:PrepareDelta:20260416",
    createdAt: "2026-04-16 18:06:00",
    updatedAt: "2026-04-16 18:06:00",
    version: 1,
  },
  {
    deltaId: "delta-sub-003",
    instructionId: "instr-sub-003",
    fundId: "fund-open-001",
    classId: "DLF-HKD",
    registerAccountId: "ra-dlf-acme",
    deltaType: "Issue",
    units: "1,171,189.54",
    navRefId: "nav-dlf-20260416",
    cashRefId: "cash-sub-003",
    reasonCode: "PRIMARY_SUBSCRIPTION",
    makerStatus: "Draft",
    checkerStatus: "NotRequired",
    postingStatus: "NotPosted",
    effectiveAt: "2026-04-16 18:20:00",
    previousRegisterVersionId: "REG-DLF-HKD-20260415-017",
    newRegisterVersionId: "REG-DLF-HKD-20260416-019",
    idempotencyKey: "TAConsole:delta-sub-003:PrepareDelta:20260416",
    createdAt: "2026-04-16 18:08:00",
    updatedAt: "2026-04-16 18:08:00",
    version: 1,
  },
  {
    deltaId: "delta-red-ce-001",
    instructionId: "instr-red-ce-001",
    fundId: "fund-closed-001",
    classId: "REA-HKD",
    registerAccountId: "ra-rea-harbor",
    deltaType: "Redeem",
    units: "20,000",
    navRefId: "nav-rea-20260512",
    cashRefId: "cash-red-ce-001",
    tokenEventRefId: "token-burn-red-ce-001",
    reasonCode: "REPURCHASE_EVENT",
    makerId: "ta-maker-001",
    checkerId: "ta-checker-001",
    makerStatus: "Submitted",
    checkerStatus: "Approved",
    postingStatus: "NotPosted",
    effectiveAt: "2026-05-13 09:20:00",
    previousRegisterVersionId: "REG-REA-HKD-20260512-004",
    newRegisterVersionId: "REG-REA-HKD-20260513-005",
    idempotencyKey: "TAConsole:delta-red-ce-001:PostRegister:20260513",
    createdAt: "2026-05-13 09:18:00",
    updatedAt: "2026-05-13 09:18:00",
    version: 2,
  },
  {
    deltaId: "delta-dist-002",
    instructionId: "instr-dist-002",
    fundId: "fund-closed-001",
    classId: "REA-HKD",
    registerAccountId: "ra-rea-harbor",
    deltaType: "Restriction",
    units: "0",
    reasonCode: "RECORD_DATE_SNAPSHOT",
    makerId: "ta-maker-002",
    checkerId: "ta-checker-002",
    makerStatus: "Submitted",
    checkerStatus: "Approved",
    postingStatus: "Posted",
    effectiveAt: "2026-05-20 18:00:00",
    postedAt: "2026-05-20 18:05:00",
    previousRegisterVersionId: "REG-REA-HKD-20260512-004",
    newRegisterVersionId: "REG-REA-HKD-20260520-006",
    idempotencyKey: "TAConsole:delta-dist-002:PostRegister:20260520",
    createdAt: "2026-05-20 17:55:00",
    updatedAt: "2026-05-20 18:05:00",
    version: 3,
  },
];

export const initialRegisterVersions: RegisterVersion[] = [
  {
    registerVersionId: "REG-DLF-HKD-20260415-017",
    fundId: "fund-open-001",
    classId: "DLF-HKD",
    status: "Released",
    effectiveAt: "2026-04-15 18:20:00",
    releasedAt: "2026-04-15 18:22:00",
    totalHolders: 1,
    totalUnits: "488,281.25",
    registerHash: "0xregdlf017",
    deltaIds: ["delta-sub-002"],
    releasedBy: "ta-checker-001",
    createdAt: "2026-04-15 18:20:00",
    version: 2,
  },
  {
    registerVersionId: "REG-DLF-HKD-20260416-018",
    fundId: "fund-open-001",
    classId: "DLF-HKD",
    status: "Draft",
    effectiveAt: "2026-04-16 18:20:00",
    previousRegisterVersionId: "REG-DLF-HKD-20260415-017",
    totalHolders: 1,
    totalUnits: "732,278.91",
    registerHash: "0xregdlf018draft",
    deltaIds: ["delta-sub-001"],
    createdAt: "2026-04-16 18:06:00",
    version: 1,
  },
  {
    registerVersionId: "REG-REA-HKD-20260512-004",
    fundId: "fund-closed-001",
    classId: "REA-HKD",
    status: "Released",
    effectiveAt: "2026-05-12 17:00:00",
    releasedAt: "2026-05-12 17:05:00",
    totalHolders: 2,
    totalUnits: "94,736.84",
    registerHash: "0xregrea004",
    deltaIds: ["delta-rea-issuance-harbor", "delta-rea-issuance-granite"],
    releasedBy: "ta-checker-002",
    createdAt: "2026-05-12 17:00:00",
    version: 3,
  },
  {
    registerVersionId: "REG-REA-HKD-20260520-006",
    fundId: "fund-closed-001",
    classId: "REA-HKD",
    status: "Released",
    effectiveAt: "2026-05-20 18:00:00",
    releasedAt: "2026-05-20 18:05:00",
    previousRegisterVersionId: "REG-REA-HKD-20260512-004",
    totalHolders: 2,
    totalUnits: "94,736.84",
    registerHash: "0xregrea006",
    deltaIds: ["delta-dist-002"],
    releasedBy: "ta-checker-002",
    createdAt: "2026-05-20 18:00:00",
    version: 3,
  },
];

export const initialCashMovements: CashMovement[] = [
  {
    cashMovementId: "cash-sub-001",
    instructionId: "instr-sub-001",
    fundId: "fund-open-001",
    classId: "DLF-HKD",
    direction: "In",
    amount: "250,000",
    currency: "HKD",
    status: "Confirmed",
    owner: "StablecoinCustodian",
    reference: "TX-OPEN-HKD-001",
    confirmedAt: "2026-04-16 11:19:00",
    version: 2,
  },
  {
    cashMovementId: "cash-sub-003",
    instructionId: "instr-sub-003",
    fundId: "fund-open-001",
    classId: "DLF-HKD",
    direction: "In",
    amount: "1,200,000",
    currency: "HKD",
    status: "Confirmed",
    owner: "StablecoinCustodian",
    reference: "TX-OPEN-HKD-003",
    confirmedAt: "2026-04-16 14:06:00",
    version: 2,
  },
  {
    cashMovementId: "cash-red-ce-001",
    instructionId: "instr-red-ce-001",
    fundId: "fund-closed-001",
    classId: "REA-HKD",
    direction: "Out",
    amount: "2,000,000",
    currency: "HKD",
    status: "Matched",
    owner: "Bank",
    reference: "PAY-REA-FO-20260513",
    version: 1,
  },
];

export const initialTransferAgencyNavRecords: TransferAgencyNavRecord[] = [
  {
    navRefId: "nav-dlf-20260416",
    fundId: "fund-open-001",
    classId: "DLF-HKD",
    navDate: "2026-04-16",
    navValue: "1.0246",
    currency: "HKD",
    status: "Official",
    publishedAt: "2026-04-16 18:05:00",
    version: 2,
  },
  {
    navRefId: "nav-rea-20260512",
    fundId: "fund-closed-001",
    classId: "REA-HKD",
    navDate: "2026-05-12",
    navValue: "100",
    currency: "HKD",
    status: "Official",
    publishedAt: "2026-05-12 16:00:00",
    version: 1,
  },
];

export const initialTokenEvents: TokenEvent[] = [
  {
    tokenEventRefId: "token-mint-sub-002",
    fundId: "fund-open-001",
    classId: "DLF-HKD",
    eventType: "Mint",
    chainId: "wb-hk-chain",
    txHash: "0xmintsub002",
    blockNumber: 2190041,
    toAddress: "0xa7E4F2c8b9D1e3A5C7F6B2d8E9A1c3F5b7D9e2A4",
    amount: "488,281.25",
    status: "Finalized",
    linkedDeltaId: "delta-sub-002",
    createdAt: "2026-04-15 18:23:00",
    version: 2,
  },
  {
    tokenEventRefId: "token-burn-red-ce-001",
    fundId: "fund-closed-001",
    classId: "REA-HKD",
    eventType: "Burn",
    chainId: "wb-hk-chain",
    txHash: "0xburnredce001",
    blockNumber: 2258801,
    fromAddress: "0x1a2B3c4D5e6F708192A3b4C5d6E7f8091A2b3C4d",
    amount: "20,000",
    status: "Confirmed",
    linkedDeltaId: "delta-red-ce-001",
    createdAt: "2026-05-13 09:25:00",
    version: 1,
  },
];

export const initialOnChainEvents: OnChainEvent[] = [
  {
    onChainEventId: "chain-mint-sub-002",
    sourceType: "Issuance",
    sourceReference: "order-sub-002",
    eventType: "FundUnitMint",
    fundId: "fund-open-001",
    classId: "DLF-HKD",
    chainId: "wb-hk-chain",
    contractAddress: "0x3E6C8F12a4B7d9e0F3a1C6D5E8b9F2A7c4D8e1B2",
    method: "mint",
    txHash: "0xmintsub002",
    blockNumber: 2190041,
    status: "Finalized",
    payloadHash: "0xpayloadmintsub002",
    amount: "488,281.25",
    currency: "DLF-HKD",
    actorRole: "transferAgent",
    idempotencyKey: "OnChain:order-sub-002:Mint:20260415",
    createdAt: "2026-04-15 18:23:00",
    confirmedAt: "2026-04-15 18:24:00",
    version: 1,
  },
  {
    onChainEventId: "chain-burn-red-ce-001",
    sourceType: "Redemption",
    sourceReference: "red-ce-001",
    eventType: "FundUnitBurn",
    fundId: "fund-closed-001",
    classId: "REA-HKD",
    chainId: "wb-hk-chain",
    contractAddress: "0xa7E4F2c8b9D1e3A5C7F6B2d8E9A1c3F5b7D9e2A4",
    method: "burnFrom",
    txHash: "0xburnredce001",
    blockNumber: 2258801,
    status: "Confirmed",
    payloadHash: "0xpayloadburnredce001",
    amount: "20,000",
    currency: "REA-HKD",
    actorRole: "issuer",
    idempotencyKey: "OnChain:red-ce-001:Burn:20260513",
    createdAt: "2026-05-13 09:25:00",
    confirmedAt: "2026-05-13 09:28:00",
    version: 1,
  },
  {
    onChainEventId: "chain-whitelist-rea-harbor",
    sourceType: "Wallet",
    sourceReference: "wl-rea-harbor",
    eventType: "WhitelistUpdate",
    fundId: "fund-closed-001",
    classId: "REA-HKD",
    chainId: "wb-hk-chain",
    contractAddress: "0xa7E4F2c8b9D1e3A5C7F6B2d8E9A1c3F5b7D9e2A4",
    method: "setWhitelisted",
    txHash: "0xwhitelistreaharbor",
    blockNumber: 2249102,
    status: "Confirmed",
    payloadHash: "0xpayloadwhitelistreaharbor",
    actorRole: "transferAgent",
    idempotencyKey: "OnChain:wl-rea-harbor:Whitelist:20260418",
    createdAt: "2026-04-18 09:46:00",
    confirmedAt: "2026-04-18 09:48:00",
    version: 1,
  },
];

export const initialAnchoringEvents: AnchoringEvent[] = [
  {
    anchoringEventId: "anchor-register-rea-20260520",
    anchorType: "RegisterVersion",
    sourceType: "Register",
    sourceReference: "REG-REA-HKD-20260520-006",
    targetId: "REG-REA-HKD-20260520-006",
    fundId: "fund-closed-001",
    classId: "REA-HKD",
    chainId: "wb-hk-chain",
    contentHash: "0xregrea006",
    txHash: "0xanchorregrea006",
    blockNumber: 2262040,
    status: "Confirmed",
    actorRole: "transferAgent",
    idempotencyKey: "Anchor:RegisterVersion:REG-REA-HKD-20260520-006",
    createdAt: "2026-05-20 18:05:00",
    anchoredAt: "2026-05-20 18:06:00",
    version: 1,
  },
  {
    anchoringEventId: "anchor-snapshot-dist-002",
    anchorType: "HolderSnapshot",
    sourceType: "Distribution",
    sourceReference: "distribution-002",
    targetId: "snap-distribution-002-requested",
    fundId: "fund-closed-001",
    classId: "REA-HKD",
    chainId: "wb-hk-chain",
    contentHash: "0xsnapdistribution002requested",
    merkleRoot: "0xrootdist002snapshot",
    txHash: "0xanchordist002snapshot",
    blockNumber: 2262051,
    status: "Confirmed",
    actorRole: "transferAgent",
    idempotencyKey: "Anchor:HolderSnapshot:snap-distribution-002-requested",
    createdAt: "2026-05-20 18:05:00",
    anchoredAt: "2026-05-20 18:07:00",
    version: 1,
  },
  {
    anchoringEventId: "anchor-list-redemption-003",
    anchorType: "SettlementList",
    sourceType: "Redemption",
    sourceReference: "redemption-003",
    targetId: "list-redemption-003-payment-draft",
    fundId: "fund-closed-001",
    classId: "REA-HKD",
    chainId: "wb-hk-chain",
    contentHash: "0xlistredemption003paymentdraft",
    merkleRoot: "0xrootredemption003payment",
    txHash: "0xanchorredemption003list",
    blockNumber: 2258900,
    status: "Confirmed",
    actorRole: "transferAgent",
    idempotencyKey: "Anchor:SettlementList:list-redemption-003-payment-draft",
    createdAt: "2026-05-13 09:15:00",
    anchoredAt: "2026-05-13 09:16:00",
    version: 1,
  },
];

export const initialReconciliationBreaks: ReconciliationBreak[] = [
  {
    breakId: "break-sub-003-wallet",
    fundId: "fund-open-001",
    classId: "DLF-HKD",
    instructionId: "instr-sub-003",
    registerDeltaId: "delta-sub-003",
    severity: "High",
    breakType: "WalletNotMapped",
    description: "Distributor order has cleared cash, but wallet proof is expired and cannot be whitelisted.",
    status: "Open",
    ownerRole: "TransferAgent",
    detectedAt: "2026-04-16 18:08:00",
    version: 1,
  },
  {
    breakId: "break-red-ce-001-cash",
    fundId: "fund-closed-001",
    classId: "REA-HKD",
    instructionId: "instr-red-ce-001",
    registerDeltaId: "delta-red-ce-001",
    severity: "Medium",
    breakType: "RegisterVsCash",
    description: "Redemption burn is confirmed, but payment is matched rather than fully confirmed.",
    status: "UnderReview",
    ownerRole: "Custodian",
    detectedAt: "2026-05-13 09:30:00",
    version: 2,
  },
];

export const initialEvidenceRecords: EvidenceRecord[] = [
  {
    evidenceRefId: "ev-cash-sub-001",
    fundId: "fund-open-001",
    classId: "DLF-HKD",
    instructionId: "instr-sub-001",
    registerDeltaId: "delta-sub-001",
    evidenceType: "CashConfirmation",
    label: "Tokenized deposit receipt TX-OPEN-HKD-001",
    contentHash: "0xevcashsub001",
    sourceActorType: "Custodian",
    sourceActorId: "stablecoin-custodian-hkd",
    createdAt: "2026-04-16 11:19:00",
    retentionClass: "Audit",
    version: 1,
  },
  {
    evidenceRefId: "ev-nav-dlf-20260416",
    fundId: "fund-open-001",
    classId: "DLF-HKD",
    instructionId: "instr-sub-001",
    registerDeltaId: "delta-sub-001",
    evidenceType: "NAVPublication",
    label: "Official NAV 1.0246 HKD",
    contentHash: "0xevnavdlf20260416",
    sourceActorType: "System",
    sourceActorId: "nav-service",
    createdAt: "2026-04-16 18:05:00",
    retentionClass: "Regulatory",
    version: 1,
  },
  {
    evidenceRefId: "ev-kyc-john",
    fundId: "fund-open-001",
    classId: "DLF-HKD",
    instructionId: "instr-sub-001",
    evidenceType: "KYCReference",
    label: "Distributor onboarding cleared for John Doe",
    contentHash: "0xevkycjohn",
    sourceActorType: "Distributor",
    sourceActorId: "dist-apac-001",
    createdAt: "2026-04-15 10:00:00",
    retentionClass: "Operational",
    version: 1,
  },
  {
    evidenceRefId: "ev-wallet-acme-expired",
    fundId: "fund-open-001",
    classId: "DLF-HKD",
    instructionId: "instr-sub-003",
    registerDeltaId: "delta-sub-003",
    evidenceType: "KYCReference",
    label: "Acme wallet proof expired before whitelist update",
    contentHash: "0xevwalletacmeexpired",
    sourceActorType: "Distributor",
    sourceActorId: "dist-apac-001",
    createdAt: "2026-04-16 18:08:00",
    retentionClass: "Audit",
    version: 1,
  },
  {
    evidenceRefId: "ev-payment-red-ce-001",
    fundId: "fund-closed-001",
    classId: "REA-HKD",
    instructionId: "instr-red-ce-001",
    registerDeltaId: "delta-red-ce-001",
    evidenceType: "CashConfirmation",
    label: "Repurchase payment file PAY-REA-FO-20260513",
    contentHash: "0xevpaymentredce001",
    sourceActorType: "Custodian",
    sourceActorId: "settlement-bank-hk",
    createdAt: "2026-05-13 09:18:00",
    retentionClass: "Audit",
    version: 1,
  },
  {
    evidenceRefId: "ev-register-rea-20260520",
    fundId: "fund-closed-001",
    classId: "REA-HKD",
    instructionId: "instr-dist-002",
    registerDeltaId: "delta-dist-002",
    evidenceType: "RegisterVersion",
    label: "Record-date register version REG-REA-HKD-20260520-006",
    contentHash: "0xregrea006",
    sourceActorType: "TransferAgent",
    sourceActorId: "ta-checker-002",
    createdAt: "2026-05-20 18:05:00",
    retentionClass: "Regulatory",
    version: 1,
  },
];

export const initialHolderSnapshots: HolderSnapshot[] = [
  {
    snapshotId: "snap-distribution-002-requested",
    sourceType: "Distribution",
    sourceReference: "distribution-002",
    instructionId: "instr-dist-002",
    fundId: "fund-closed-001",
    classId: "REA-HKD",
    registerVersionId: "REG-REA-HKD-20260520-006",
    recordDate: "2026-05-20 18:00:00",
    status: "Requested",
    idempotencyKey: "IssuerPortal:distribution-002:SnapshotRequest:20260520",
    createdAt: "2026-05-20 17:30:00",
    updatedAt: "2026-05-20 17:30:00",
    version: 1,
  },
  {
    snapshotId: "snap-redemption-003-requested",
    sourceType: "Redemption",
    sourceReference: "redemption-003",
    instructionId: "instr-redemption-003-ta",
    fundId: "fund-closed-001",
    classId: "REA-HKD",
    registerVersionId: "REG-REA-HKD-20260512-004",
    recordDate: "2026-05-12 17:00:00",
    status: "Requested",
    idempotencyKey: "IssuerPortal:redemption-003:SnapshotRequest:20260512",
    createdAt: "2026-05-12 16:30:00",
    updatedAt: "2026-05-12 16:30:00",
    version: 1,
  },
];

export const initialHolderSnapshotPositions: HolderSnapshotPosition[] = [
  {
    positionId: "pos-dist-002-harbor",
    snapshotId: "snap-distribution-002-requested",
    registerAccountId: "ra-rea-harbor",
    holderName: "Harbor Family Office",
    holderId: "holder-harbor",
    units: "42,105.26",
    walletAddress: "0x1a2B3c4D5e6F708192A3b4C5d6E7f8091A2b3C4d",
    restrictionStatus: "Active",
    included: true,
    entitlementAmount: "33,684.21 HKD",
    version: 1,
  },
  {
    positionId: "pos-dist-002-granite",
    snapshotId: "snap-distribution-002-requested",
    registerAccountId: "ra-rea-granite",
    holderName: "Granite Institutional Fund",
    holderId: "holder-granite",
    units: "52,631.58",
    walletAddress: "0x2b3C4d5E6f708192A3b4C5d6E7f8091A2b3C4d5E",
    restrictionStatus: "Restricted",
    included: false,
    exclusionReason: "Restricted holder requires issuer confirmation before payout release.",
    entitlementAmount: "42,105.26 HKD",
    version: 1,
  },
  {
    positionId: "pos-redemption-003-harbor",
    snapshotId: "snap-redemption-003-requested",
    registerAccountId: "ra-rea-harbor",
    holderName: "Harbor Family Office",
    holderId: "holder-harbor",
    units: "20,000",
    walletAddress: "HK-SETTLE-FO-001",
    restrictionStatus: "Active",
    included: true,
    cashAmount: "2,000,000 HKD",
    version: 1,
  },
  {
    positionId: "pos-redemption-003-granite",
    snapshotId: "snap-redemption-003-requested",
    registerAccountId: "ra-rea-granite",
    holderName: "Granite Institutional Fund",
    holderId: "holder-granite",
    units: "15,000",
    walletAddress: "HK-SETTLE-IF-002",
    restrictionStatus: "Restricted",
    included: true,
    cashAmount: "1,500,000 HKD",
    version: 1,
  },
];

export const initialSettlementLists: SettlementList[] = [
  {
    listId: "list-dist-002-recipient-draft",
    listType: "RecipientList",
    snapshotId: "snap-distribution-002-requested",
    sourceType: "Distribution",
    sourceReference: "distribution-002",
    status: "Draft",
    idempotencyKey: "TAConsole:snap-distribution-002-requested:DraftRecipientList:20260520",
    createdAt: "2026-05-20 18:10:00",
    updatedAt: "2026-05-20 18:10:00",
    version: 1,
  },
  {
    listId: "list-redemption-003-payment-draft",
    listType: "PaymentList",
    snapshotId: "snap-redemption-003-requested",
    sourceType: "Redemption",
    sourceReference: "redemption-003",
    status: "Draft",
    idempotencyKey: "TAConsole:snap-redemption-003-requested:DraftPaymentList:20260513",
    createdAt: "2026-05-13 09:12:00",
    updatedAt: "2026-05-13 09:12:00",
    version: 1,
  },
];

export const initialSettlementListLines: SettlementListLine[] = [
  {
    lineId: "line-dist-002-harbor",
    listId: "list-dist-002-recipient-draft",
    snapshotId: "snap-distribution-002-requested",
    holderSnapshotPositionId: "pos-dist-002-harbor",
    registerAccountId: "ra-rea-harbor",
    holderName: "Harbor Family Office",
    amount: "33,684.21",
    currency: "HKD",
    destination: "HK-SETTLE-FO-001",
    status: "Ready",
    evidenceRefIds: ["ev-register-rea-20260520"],
    version: 1,
  },
  {
    lineId: "line-dist-002-granite-held",
    listId: "list-dist-002-recipient-draft",
    snapshotId: "snap-distribution-002-requested",
    holderSnapshotPositionId: "pos-dist-002-granite",
    registerAccountId: "ra-rea-granite",
    holderName: "Granite Institutional Fund",
    amount: "42,105.26",
    currency: "HKD",
    destination: "HK-SETTLE-IF-002",
    status: "Held",
    evidenceRefIds: ["ev-register-rea-20260520"],
    version: 1,
  },
  {
    lineId: "line-redemption-003-harbor",
    listId: "list-redemption-003-payment-draft",
    snapshotId: "snap-redemption-003-requested",
    holderSnapshotPositionId: "pos-redemption-003-harbor",
    registerAccountId: "ra-rea-harbor",
    holderName: "Harbor Family Office",
    amount: "2,000,000",
    currency: "HKD",
    destination: "HK-SETTLE-FO-001",
    status: "Ready",
    evidenceRefIds: ["ev-issuer-redemption-approval"],
    version: 1,
  },
  {
    lineId: "line-redemption-003-granite",
    listId: "list-redemption-003-payment-draft",
    snapshotId: "snap-redemption-003-requested",
    holderSnapshotPositionId: "pos-redemption-003-granite",
    registerAccountId: "ra-rea-granite",
    holderName: "Granite Institutional Fund",
    amount: "1,500,000",
    currency: "HKD",
    destination: "HK-SETTLE-IF-002",
    status: "Ready",
    evidenceRefIds: ["ev-payment-red-ce-001"],
    version: 1,
  },
];

export const initialFundBatches: FundBatch[] = [
  {
    id: "batch-sub-001",
    fundId: "fund-open-001",
    type: "subscription",
    cutoffTime: "2026-04-16 16:00:00",
    nav: "1.0246 HKD",
    orderCount: 2,
    totalAmount: "1,450,000 HKD",
    totalQuantity: "1,415,187.20 units",
    settlementDate: "2026-04-17 10:00:00",
    status: "Processing",
  },
  {
    id: "batch-red-001",
    fundId: "fund-open-001",
    type: "redemption",
    cutoffTime: "2026-04-16 16:00:00",
    nav: "1.0246 HKD",
    orderCount: 2,
    totalAmount: "230,535.00 HKD",
    totalQuantity: "225,000 units",
    settlementDate: "2026-04-17 10:00:00",
    status: "Confirmed",
  },
];

export const initialRedemptions: FundRedemptionConfig[] = [
  {
    id: "redemption-001",
    fundId: "fund-open-001",
    name: "Daily Liquidity Fund Daily Redemption Setup",
    description: "Daily dealing configuration for regular open-end redemption processing.",
    status: "Active",
    assetType: "Fund",
    fundName: "Daily Liquidity Fund",
    fundToken: "DLF-2026",
    tokenAddress: "0x3E6C8F12a4B7d9e0F3a1C6D5E8b9F2A7c4D8e1B2",
    redemptionMode: "Daily dealing",
    effectiveDate: "2026-04-16 09:00:00",
    announcementDate: "2026-04-15 09:00:00",
    latestNav: "1.0246 HKD",
    settlementCycle: "T+1",
    noticePeriodDays: 0,
    maxRedemptionQuantityPerInvestor: "500,000 units / dealing day",
    manualApprovalRequired: false,
    pauseRedemptionAfterListing: false,
    cutOffTime: "16:00 HKT",
    createdTime: "2026-04-15 10:00:00",
  },
  {
    id: "redemption-002",
    fundId: "fund-open-002",
    name: "Institutional Treasury Plus Quarterly Window",
    description: "Window-based redemption arrangement for institutional treasury investors.",
    status: "Draft",
    assetType: "Fund",
    fundName: "Institutional Treasury Plus",
    fundToken: "ITP-2026",
    tokenAddress: "0x1A9f8c7B6d5E4F3a2B1c9D8e7F6a5B4C3d2E1f0A",
    redemptionMode: "Window-based",
    effectiveDate: "2026-06-01 09:00:00",
    windowStart: "2026-06-15 09:00:00",
    windowEnd: "2026-06-30 16:00:00",
    announcementDate: "2026-06-08 09:00:00",
    latestNav: "1.0182 USDC",
    settlementCycle: "T+1",
    noticePeriodDays: 7,
    maxRedemptionQuantityPerInvestor: "250,000 units / window",
    manualApprovalRequired: true,
    pauseRedemptionAfterListing: true,
    cutOffTime: "15:00 UTC",
    createdTime: "2026-04-16 09:45:00",
  },
  {
    id: "redemption-003",
    fundId: "fund-closed-001",
    name: "Real Estate Fund A Repurchase Event",
    description: "Issuer-led closed-end liquidity event with a cash payment list for accepted holders.",
    status: "Payment List Ready",
    assetType: "Fund",
    fundName: "Real Estate Fund A",
    fundToken: "RE-FUND-A-2024",
    tokenAddress: "0xa7E4F2c8b9D1e3A5C7F6B2d8E9A1c3F5b7D9e2A4",
    redemptionMode: "Window-based",
    effectiveDate: "2026-05-01 09:00:00",
    windowStart: "2026-05-10 09:00:00",
    windowEnd: "2026-05-12 17:00:00",
    announcementDate: "2026-04-25 09:00:00",
    latestNav: "100 HKD",
    settlementCycle: "T+2",
    noticePeriodDays: 14,
    maxRedemptionQuantityPerInvestor: "20,000 units / event",
    manualApprovalRequired: true,
    pauseRedemptionAfterListing: false,
    cutOffTime: "17:00 HKT",
    createdTime: "2026-04-22 12:30:00",
    transferAgentOps: {
      transferAgentName: "Harbor Registry Services",
      transferAgentStatus: "Payment List Ready",
      holderRegisterDate: "2026-05-12 17:00:00",
      holderSnapshotId: "SNAP-RED-20260512-001",
      holderSnapshotLockedAt: "2026-05-12 17:05:00",
      paymentListStatus: "Generated",
      paymentListGeneratedAt: "2026-05-13 09:15:00",
      fundingCheckStatus: "Confirmed",
      fundingConfirmedAt: "2026-05-13 14:30:00",
      reconciliationStatus: "In Progress",
      lastTransferAgentAction: "Settlement file released to paying agent after holder validation.",
    },
  },
];

export const initialDistributions: FundDistribution[] = [
  {
    id: "distribution-001",
    fundId: "fund-open-001",
    fundName: "Daily Liquidity Fund",
    fundToken: "DLF-2026",
    name: "Q1 2026 Distribution",
    description: "Quarterly income distribution",
    status: "Draft",
    assetType: "Fund",
    tokenAddress: "0x3E6C8F12a4B7d9e0F3a1C6D5E8b9F2A7c4D8e1B2",
    initialNav: "1.0246 HKD",
    distributionRateType: "Fixed Rate",
    distributionRate: "3.5",
    distributionUnit: "HKD",
    payoutMode: "Claim",
    payoutToken: "HKD",
    payoutAccount: "Investor self-claim wallet",
    actualDaysInPeriod: "180",
    actualDaysInYear: "360",
    recordDate: "2026-04-20 18:00:00",
    paymentDate: "2026-04-25 10:00:00",
    createdTime: "2026-04-14 09:30:00",
  },
  {
    id: "distribution-002",
    fundId: "fund-closed-001",
    fundName: "Real Estate Fund A",
    fundToken: "RE-FUND-A-2024",
    name: "2026 Interim Distribution",
    description: "Closed-end fund distribution event for holders on the record date.",
    status: "Pending Allocation",
    assetType: "Fund",
    tokenAddress: "0xa7E4F2c8b9D1e3A5C7F6B2d8E9A1c3F5b7D9e2A4",
    initialNav: "95 HKD",
    distributionRateType: "Per Unit",
    distributionRate: "0.80",
    distributionUnit: "HKD",
    payoutMode: "Direct Transfer",
    payoutToken: "HKD",
    payoutAccount: "Fund treasury settlement account",
    actualDaysInPeriod: "180",
    actualDaysInYear: "365",
    recordDate: "2026-05-20 18:00:00",
    paymentDate: "2026-05-25 10:00:00",
    createdTime: "2026-05-02 10:15:00",
    transferAgentOps: {
      transferAgentName: "Harbor Registry Services",
      transferAgentStatus: "Snapshot Locked",
      holderRegisterDate: "2026-05-20 18:00:00",
      holderSnapshotId: "SNAP-DIV-20260520-001",
      holderSnapshotLockedAt: "2026-05-20 18:05:00",
      recipientListStatus: "Generated",
      recipientListGeneratedAt: "2026-05-20 18:20:00",
      fundingCheckStatus: "Pending Treasury Funding",
      reconciliationStatus: "Pending",
      lastTransferAgentAction: "Recipient list generated from the record-date holder snapshot.",
    },
  },
];

export function findFundById(funds: FundIssuance[], id: string) {
  return funds.find((fund) => fund.id === id) || null;
}

export function formatNavLabel(value: number, currency: string) {
  return `${value.toFixed(4)} ${currency}`;
}
