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
export type ActorRole = "issuer" | "investor";

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
  status: "Draft" | "Pending Approval" | "Active" | "Paused" | "Announced" | "Window Open" | "Window Closed";
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
  status: string;
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
  lastAction?: string;
  lastActorRole?: ActorRole;
  lastActionAt?: string;
  identitySource?: "authSession";
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
    status: "Window Closed",
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
    name: "2026 Interim Dividend",
    description: "Closed-end fund dividend event for holders on the record date.",
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
