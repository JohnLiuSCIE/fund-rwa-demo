import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  CalendarIcon,
  FileText,
  Plus,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { Calendar } from "../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { ProcessFlowCard } from "../components/ProcessFlowCard";
import { InfoAlert } from "../components/InfoAlert";
import { useApp } from "../context/AppContext";
import { FundIssuance, NavUpdateMode } from "../data/fundDemoData";

function formatDate(date?: Date) {
  return date ? format(date, "yyyy-MM-dd HH:mm:ss") : "";
}

function formatAmount(value: number, currency: string) {
  return `${new Intl.NumberFormat("en-US").format(value)} ${currency}`;
}

function formatNav(value: number, currency: string) {
  return `${value.toFixed(4)} ${currency}`;
}

function deriveTokenSymbol(value: string) {
  const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return normalized.slice(0, 15) || "NEWTOKEN";
}

function buildSeedNavHistory(
  fundId: string,
  navValue: number,
  currency: string,
  createdAt: Date,
  mode: NavUpdateMode,
) {
  const pointCount = mode === "Oracle Feed" ? 10 : 6;
  const volatility = mode === "Oracle Feed" ? 0.0036 : 0.0016;

  return Array.from({ length: pointCount }, (_, index) => {
    const reverseOffset = pointCount - index - 1;
    const pointDate = new Date(createdAt);
    pointDate.setDate(createdAt.getDate() - reverseOffset);

    const drift = (index - (pointCount - 1) / 2) * volatility * 0.22;
    const wave = Math.sin(index * 1.35) * volatility;
    const seededNav = Math.max(navValue * (1 + drift + wave), 0.0001);
    const isLastPoint = index === pointCount - 1;

    return {
      id: `nav-${fundId}-${index + 1}`,
      navDate: format(pointDate, "yyyy-MM-dd"),
      navValue: isLastPoint ? navValue : Number(seededNav.toFixed(4)),
      currency,
      updatedAt: format(pointDate, "yyyy-MM-dd HH:mm:ss"),
      note:
        mode === "Oracle Feed"
          ? isLastPoint
            ? "Latest oracle-synced NAV"
            : "Oracle-synced demo NAV"
          : isLastPoint
            ? "Latest manually confirmed NAV"
            : "Manual NAV committee reference",
    };
  });
}

function getInvestorRuleCondition(ruleType: string) {
  return ruleType === "risk-test-level" ? "Must be at least" : "Must be";
}

function getInvestorRulePlaceholder(ruleType: string) {
  switch (ruleType) {
    case "investor-type":
      return "Institutional / Qualified investor";
    case "investor-jurisdiction":
      return "Hong Kong SAR / Singapore";
    case "risk-test-level":
      return "4";
    default:
      return "Enter rule value";
  }
}

const LEGAL_STRUCTURE_OPTIONS = [
  "Unit Trust",
  "Mutual Fund",
  "OFC",
  "LPF",
] as const;

const OFFERING_TYPE_OPTIONS = [
  "Publicly Offered Fund",
  "Private Fund",
] as const;

const DISTRIBUTION_CHANNEL_OPTIONS = [
  "Unlisted fund",
  "Listed fund",
  "MPF fund",
] as const;

const LISTED_FUND_SUBTYPE_OPTIONS = [
  "ETF",
  "Listed closed-ended fund",
  "REIT",
] as const;

const ASSET_STRATEGY_OPTIONS = [
  "Equity Fund",
  "Bond Fund",
  "Mixed Asset Fund",
  "Money Market Fund",
  "Index Fund / ETF",
  "Alternative Asset Fund",
  "Real Estate Fund / REIT",
  "Private Equity / VC / Private Credit",
] as const;

const SUBSCRIPTION_PAYMENT_METHOD_OPTIONS = [
  "Fiat",
  "Stablecoin",
  "Tokenized Deposit",
] as const;

const SUBSCRIPTION_PAYMENT_RAIL_OPTIONS = [
  "Off-chain Bank Transfer",
  "On-chain Wallet Transfer",
] as const;

const SUBSCRIPTION_SETTLEMENT_ACCOUNT_TYPES = [
  "Bank Account",
  "Wallet",
] as const;

const CASH_CONFIRMATION_OWNER_OPTIONS = [
  "Issuer",
  "Transfer Agent",
  "Operations",
] as const;

export function CreateFundIssuance() {
  const navigate = useNavigate();
  const { addFundIssuance } = useApp();

  const [currentTab, setCurrentTab] = useState("about-deal");

  const [fundName, setFundName] = useState("");
  const [fundDescription, setFundDescription] = useState("");
  const [fundType, setFundType] = useState<"open-end" | "closed-end">("open-end");
  const [offeringType, setOfferingType] =
    useState<(typeof OFFERING_TYPE_OPTIONS)[number]>("Publicly Offered Fund");
  const [legalStructure, setLegalStructure] = useState<(typeof LEGAL_STRUCTURE_OPTIONS)[number]>("OFC");
  const [distributionChannel, setDistributionChannel] =
    useState<(typeof DISTRIBUTION_CHANNEL_OPTIONS)[number]>("Unlisted fund");
  const [listedFundSubtype, setListedFundSubtype] =
    useState<(typeof LISTED_FUND_SUBTYPE_OPTIONS)[number]>("ETF");
  const [assetStrategyCategory, setAssetStrategyCategory] =
    useState<(typeof ASSET_STRATEGY_OPTIONS)[number]>("Bond Fund");
  const [dealSizeUnit, setDealSizeUnit] = useState("HKD");
  const [targetFundSize, setTargetFundSize] = useState("10000000");
  const [minSubscriptionAmount, setMinSubscriptionAmount] = useState("10000");
  const [maxSubscriptionAmount, setMaxSubscriptionAmount] = useState("5000000");
  const [initialNav, setInitialNav] = useState("1");
  const [managementFee, setManagementFee] = useState("0.8");
  const [performanceFee, setPerformanceFee] = useState("");
  const [investmentStrategy, setInvestmentStrategy] = useState("");
  const [fundManager, setFundManager] = useState("");
  const [issuerEntity, setIssuerEntity] = useState("");
  const [fundJurisdiction, setFundJurisdiction] = useState("Hong Kong SAR");
  const [shareClass, setShareClass] = useState("Class A");
  const [issueDate, setIssueDate] = useState<Date>();
  const [maturityDate, setMaturityDate] = useState<Date>();

  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenStandard, setTokenStandard] = useState("ERC-3643");
  const [tokenDecimals, setTokenDecimals] = useState("18");
  const [isinCode, setIsinCode] = useState("");
  const [unitPerToken, setUnitPerToken] = useState("1 fund unit");
  const [whitelistRequired, setWhitelistRequired] = useState(true);
  const [mintingRule, setMintingRule] = useState("mint-burn");
  const [isTokenTradable, setIsTokenTradable] = useState(false);

  const [subscriptionLotSize, setSubscriptionLotSize] = useState("1");
  const [subscriptionMinQuantity, setSubscriptionMinQuantity] = useState("1");
  const [subscriptionMaxQuantity, setSubscriptionMaxQuantity] = useState("5000000");
  const [subscriptionStartDate, setSubscriptionStartDate] = useState<Date>();
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<Date>();
  const [allocationRule, setAllocationRule] = useState("pro-rata");

  const [dealingFrequency, setDealingFrequency] = useState("daily");
  const [dealingCutoffTime, setDealingCutoffTime] = useState("16:00");
  const [navValuationTime, setNavValuationTime] = useState("18:00");
  const [settlementCycle, setSettlementCycle] = useState("T+1");
  const [navUpdateMode, setNavUpdateMode] = useState<NavUpdateMode>("Oracle Feed");
  const [oracleProvider, setOracleProvider] = useState("Chainlink NAV Adapter");
  const [oracleFeedId, setOracleFeedId] = useState("HKD-FUND-NAV-DEMO");
  const [oracleUpdateFrequency, setOracleUpdateFrequency] = useState("Every dealing day close");
  const [oracleFallbackRule, setOracleFallbackRule] = useState(
    "Fallback to issuer manual confirmation after 30 minutes without a fresh oracle tick",
  );
  const [subscriptionPaymentMethod, setSubscriptionPaymentMethod] =
    useState<(typeof SUBSCRIPTION_PAYMENT_METHOD_OPTIONS)[number]>("Fiat");
  const [subscriptionPaymentRail, setSubscriptionPaymentRail] =
    useState<(typeof SUBSCRIPTION_PAYMENT_RAIL_OPTIONS)[number]>("Off-chain Bank Transfer");
  const [subscriptionSettlementAccountType, setSubscriptionSettlementAccountType] =
    useState<(typeof SUBSCRIPTION_SETTLEMENT_ACCOUNT_TYPES)[number]>("Bank Account");
  const [subscriptionCashCurrency, setSubscriptionCashCurrency] = useState("HKD");
  const [receivingBankName, setReceivingBankName] = useState("");
  const [receivingBankAccountName, setReceivingBankAccountName] = useState("");
  const [receivingBankAccountNumberMasked, setReceivingBankAccountNumberMasked] = useState("");
  const [receivingBankSwiftCode, setReceivingBankSwiftCode] = useState("");
  const [subscriptionCollectionWallet, setSubscriptionCollectionWallet] = useState("");
  const [paymentReferenceRule, setPaymentReferenceRule] = useState("");
  const [paymentProofRequired, setPaymentProofRequired] = useState(true);
  const [cashConfirmationOwner, setCashConfirmationOwner] =
    useState<(typeof CASH_CONFIRMATION_OWNER_OPTIONS)[number]>("Issuer");
  const [subscriptionStatusAfterLaunch, setSubscriptionStatusAfterLaunch] =
    useState(true);
  const [redemptionStatusAfterLaunch, setRedemptionStatusAfterLaunch] =
    useState(true);
  const [noticePeriodDays, setNoticePeriodDays] = useState("0");
  const [lockupValue, setLockupValue] = useState("7");
  const [lockupUnit, setLockupUnit] = useState("days");
  const [redemptionGatePerInvestor, setRedemptionGatePerInvestor] = useState("500000");
  const [fundLevelRedemptionGate, setFundLevelRedemptionGate] = useState("10");
  const [orderConfirmationMethod, setOrderConfirmationMethod] = useState("auto");

  const [references, setReferences] = useState<Array<{ type: string; value: string }>>([]);
  const [investorRules, setInvestorRules] = useState<
    Array<{ ruleType: string; condition: string; value: string }>
  >([]);

  const openEndMode = fundType === "open-end";
  const listedChannelSelected = distributionChannel === "Listed fund";
  const bankTransferFunding = subscriptionPaymentRail === "Off-chain Bank Transfer";

  const addReference = () => {
    setReferences((prev) => [...prev, { type: "file", value: "" }]);
  };

  const removeReference = (index: number) => {
    setReferences((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const addInvestorRule = () => {
    setInvestorRules((prev) => [
      ...prev,
      { ruleType: "", condition: "Must be", value: "" },
    ]);
  };

  const removeInvestorRule = (index: number) => {
    setInvestorRules((prev) =>
      prev.filter((_, currentIndex) => currentIndex !== index),
    );
  };

  const handleNext = () => {
    const tabs = [
      "about-deal",
      "about-token",
      "subscription-rules",
      "fund-documents",
    ];
    const currentIndex = tabs.indexOf(currentTab);
    if (currentIndex < tabs.length - 1) {
      setCurrentTab(tabs[currentIndex + 1]);
    }
  };

  const handleCreate = () => {
    const now = new Date();
    const newFundId = `fund-${Date.now()}`;
    const createdTime = format(now, "yyyy-MM-dd HH:mm:ss");
    const defaultFundName = openEndMode ? "New Open-end Fund" : "New Closed-end Fund";
    const effectiveFundName = fundName.trim() || defaultFundName;
    const defaultDescription = openEndMode
      ? "Open-end fund draft with dealing and settlement rules pending activation."
      : "Closed-end fund issuance draft pending subscription, allocation, and activation setup.";

    const targetValue = Number(targetFundSize) || 0;
    const minSubValue = Number(minSubscriptionAmount) || 0;
    const maxSubValue = Number(maxSubscriptionAmount) || 0;
    const navValue = Number(initialNav) || 1;
    const tokenSymbolValue = tokenSymbol.trim()
      ? tokenSymbol.trim().toUpperCase()
      : deriveTokenSymbol(tokenName || effectiveFundName || "NEWFUND");
    const tokenDecimalsValue = Math.max(Number(tokenDecimals) || 0, 0);
    const normalizedReferences = references
      .filter((reference) => reference.value.trim())
      .map((reference) => ({
        type: reference.type as "file" | "link",
        value: reference.value.trim(),
      }));
    const normalizedInvestorRules = investorRules
      .filter((rule) => rule.ruleType && rule.value.trim())
      .map((rule) => ({
        ruleType: rule.ruleType,
        condition: rule.condition,
        value: rule.value.trim(),
      }));
    const lockupDays =
      lockupUnit === "years"
        ? (Number(lockupValue) || 0) * 365
        : lockupUnit === "months"
          ? (Number(lockupValue) || 0) * 30
          : Number(lockupValue) || 0;

    const nextCutoffTime = issueDate
      ? `${format(issueDate, "yyyy-MM-dd")} ${dealingCutoffTime}:00`
      : `${format(now, "yyyy-MM-dd")} ${dealingCutoffTime}:00`;
    const nextConfirmationDate = issueDate
      ? `${format(issueDate, "yyyy-MM-dd")} ${navValuationTime}:00`
      : `${format(now, "yyyy-MM-dd")} ${navValuationTime}:00`;

    const newFund: FundIssuance = {
      id: newFundId,
      name: effectiveFundName,
      status: "Draft",
      description: fundDescription || defaultDescription,
      assetType: "Fund",
      offeringType,
      legalStructure,
      fundDistributionChannel: distributionChannel,
      listedFundSubtype: listedChannelSelected ? listedFundSubtype : undefined,
      assetStrategyCategory,
      allocationStatus: openEndMode ? "N/A" : "Upcoming",
      createdTime,
      issuerEntity: issuerEntity || fundManager || "To be assigned",
      fundJurisdiction: fundJurisdiction || "Hong Kong SAR",
      shareClass: shareClass || "Class A",
      tokenName: tokenName || `${effectiveFundName} TOKEN`,
      tokenSymbol: tokenSymbolValue,
      tokenAddress: "–",
      tokenStandard,
      tokenDecimals: tokenDecimalsValue,
      isinCode: isinCode || undefined,
      unitPerToken: unitPerToken || "1 fund unit",
      whitelistRequired: whitelistRequired ? "Yes" : "No",
      mintingRule:
        mintingRule === "mint-burn"
          ? "Mint and burn on subscription / redemption"
          : "Pre-minted treasury inventory",
      assetCurrency: dealSizeUnit,
      minSubscriptionAmount: formatAmount(minSubValue, dealSizeUnit),
      maxSubscriptionAmount: formatAmount(maxSubValue, dealSizeUnit),
      minSubscriptionAmountValue: minSubValue,
      maxSubscriptionAmountValue: maxSubValue,
      initialNav: formatNav(navValue, dealSizeUnit),
      initialNavValue: navValue,
      currentNav: formatNav(navValue, dealSizeUnit),
      currentNavValue: navValue,
      navCurrency: dealSizeUnit,
      fundType: openEndMode ? "Open-end" : "Closed-end",
      managementFee: `${managementFee || "0"}% p.a.`,
      performanceFee: performanceFee ? `${performanceFee}%` : "N/A",
      redemptionFrequency: openEndMode
        ? dealingFrequency.charAt(0).toUpperCase() + dealingFrequency.slice(1)
        : "None",
      lockupPeriod: lockupValue ? `${lockupValue} ${lockupUnit}` : "None",
      lockupPeriodDays: lockupDays,
      tradable: isTokenTradable ? "Yes" : "No",
      fundManager: fundManager || "To be assigned",
      targetFundSize: formatAmount(targetValue, dealSizeUnit),
      targetFundSizeValue: targetValue,
      investmentStrategy:
        investmentStrategy ||
        "Open-end fund strategy pending completion by issuer during draft stage.",
      subscriptionStartDate: formatDate(subscriptionStartDate),
      subscriptionEndDate: formatDate(subscriptionEndDate),
      issueDate: formatDate(issueDate),
      maturityDate: openEndMode ? null : formatDate(maturityDate) || null,
      subscriptionLotSize: Number(subscriptionLotSize) || 1,
      subscriptionMinQuantity: Number(subscriptionMinQuantity) || 1,
      subscriptionMaxQuantity: Number(subscriptionMaxQuantity) || 1000,
      subscriptionPaymentMethod,
      subscriptionPaymentRail,
      subscriptionCashCurrency,
      subscriptionSettlementAccountType,
      receivingBankName: bankTransferFunding ? receivingBankName || undefined : undefined,
      receivingBankAccountName: bankTransferFunding
        ? receivingBankAccountName || undefined
        : undefined,
      receivingBankAccountNumberMasked: bankTransferFunding
        ? receivingBankAccountNumberMasked || undefined
        : undefined,
      receivingBankSwiftCode: bankTransferFunding ? receivingBankSwiftCode || undefined : undefined,
      subscriptionCollectionWallet: !bankTransferFunding
        ? subscriptionCollectionWallet || undefined
        : undefined,
      paymentReferenceRule: paymentReferenceRule || undefined,
      paymentProofRequired,
      cashConfirmationOwner,
      dealingFrequency: openEndMode
        ? dealingFrequency.charAt(0).toUpperCase() + dealingFrequency.slice(1)
        : undefined,
      dealingCutoffTime: openEndMode ? `${dealingCutoffTime} HKT` : undefined,
      navValuationTime: openEndMode ? `${navValuationTime} HKT` : undefined,
      settlementCycle: openEndMode ? settlementCycle : undefined,
      subscriptionStatus: openEndMode
        ? subscriptionStatusAfterLaunch
          ? "Open"
          : "Paused"
        : undefined,
      redemptionStatus: openEndMode
        ? redemptionStatusAfterLaunch
          ? "Open"
          : "Paused"
        : undefined,
      redemptionMode: openEndMode ? "Daily dealing" : undefined,
      noticePeriodDays: openEndMode ? Number(noticePeriodDays) || 0 : undefined,
      maxRedemptionPerInvestor: openEndMode
        ? `${redemptionGatePerInvestor || "0"} units / dealing cycle`
        : undefined,
      fundLevelRedemptionGate: openEndMode
        ? `${fundLevelRedemptionGate || "0"}% of fund NAV`
        : undefined,
      navUpdateMode,
      oracleProvider: navUpdateMode === "Oracle Feed" ? oracleProvider.trim() || undefined : undefined,
      oracleFeedId: navUpdateMode === "Oracle Feed" ? oracleFeedId.trim() || undefined : undefined,
      oracleUpdateFrequency:
        navUpdateMode === "Oracle Feed" ? oracleUpdateFrequency.trim() || undefined : undefined,
      oracleFallbackRule: oracleFallbackRule.trim() || undefined,
      oracleLastSyncedAt: navUpdateMode === "Oracle Feed" ? createdTime : undefined,
      lastNavUpdateTime: openEndMode ? createdTime : undefined,
      nextCutoffTime: openEndMode ? nextCutoffTime : undefined,
      nextConfirmationDate: openEndMode ? nextConfirmationDate : undefined,
      nextSettlementTime: openEndMode
        ? issueDate
          ? `${format(issueDate, "yyyy-MM-dd")} 10:00:00`
          : createdTime
        : undefined,
      orderConfirmationMethod: openEndMode
        ? orderConfirmationMethod === "auto"
          ? "Auto at cut-off"
          : "Issuer review then confirm"
        : undefined,
      availableHoldingUnits: 0,
      availableHoldingLabel: "0 units",
      pendingSubscriptionOrders: 0,
      pendingRedemptionOrders: 0,
      totalSubscribedAmount: `0 ${dealSizeUnit}`,
      totalRedeemedAmount: `0 ${dealSizeUnit}`,
      allocationRule: openEndMode
        ? "Not applicable for ongoing dealing"
        : allocationRule === "first-come-first-served"
          ? "First-come-first-served"
          : "Pro-rata",
      references: normalizedReferences,
      investorRules: normalizedInvestorRules,
      navHistory: buildSeedNavHistory(newFundId, navValue, dealSizeUnit, now, navUpdateMode),
      identitySource: "authSession",
    };

    addFundIssuance(newFund);

    toast.success(
      openEndMode
        ? "Create open-end fund successfully"
        : "Create fund issuance successfully",
      {
        description: openEndMode
          ? "You can now configure daily dealing rules and manage ongoing subscriptions and redemptions."
          : "Your new fund issuance draft has been created.",
        action: {
          label: "View Detail",
          onClick: () => navigate(`/fund-issuance/${newFundId}`),
        },
      },
    );

    navigate(`/fund-issuance/${newFundId}`);
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 style={{ fontFamily: "var(--font-heading)" }}>Create Fund Issuance</h1>
        <p className="text-muted-foreground mt-2">
          Configure a fund draft and define the rules that will govern launch, dealing, and settlement.
        </p>
      </div>

      <div className="mb-8">
        <ProcessFlowCard
          title="Primary Issuance Flow"
          steps={
            openEndMode
              ? [
                  { label: "Draft", description: "Create configuration" },
                  { label: "Initial Launch", description: "Open launch window" },
                  { label: "Active Dealing", description: "Daily subscription" },
                  { label: "NAV Confirm", description: "Process batches" },
                  { label: "T+1 Settle", description: "Cash and shares book" },
                ]
              : [
                  { label: "Listing Fund", description: "Create & submit" },
                  { label: "Subscription", description: "Investor deposits" },
                  { label: "Allocation", description: "Distribute shares" },
                  { label: "Issuance", description: "Accept funds" },
                  { label: "Active", description: "Fund operating" },
                ]
          }
        />
        {openEndMode && (
          <p className="text-sm text-muted-foreground mt-3">
            Open-end note: after launch the fund moves into ongoing subscription, redemption, and daily valuation operations. Configure the key parameters in "Subscription & Rules".
          </p>
        )}
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-8">
        <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-secondary">
          <TabsTrigger value="about-deal" className="text-sm py-3">
            About Deal
          </TabsTrigger>
          <TabsTrigger value="about-token" className="text-sm py-3">
            About Token
          </TabsTrigger>
          <TabsTrigger value="subscription-rules" className="text-sm py-3">
            Subscription & Rules
          </TabsTrigger>
          <TabsTrigger value="fund-documents" className="text-sm py-3">
            Fund Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="about-deal" className="space-y-6">
          <InfoAlert variant="info" title="Fund Details">
            When the fund type is set to <strong>Open-end</strong>, this form switches to an operating model focused on ongoing dealing, daily NAV processing, and T+1 settlement.
          </InfoAlert>

          <div className="bg-white border rounded-lg p-6 space-y-6">
            <div className="space-y-2">
              <Label>Fund name</Label>
              <Input value={fundName} onChange={(event) => setFundName(event.target.value)} placeholder="Daily Liquidity Fund" />
            </div>

            <div className="rounded-lg border bg-secondary/20 p-5 space-y-5">
              <div>
                <div className="font-medium">Hong Kong Fund Classification</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Capture the fund on the key Hong Kong market axes so the draft reflects offering type,
                  legal structure, operating mechanism, channel, and strategy instead of only showing
                  open-end or closed-end.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 xl:grid-cols-3">
                <div className="space-y-2">
                  <Label>Offering type</Label>
                  <Select
                    value={offeringType}
                    onValueChange={(value) => setOfferingType(value as (typeof OFFERING_TYPE_OPTIONS)[number])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select offering type" />
                    </SelectTrigger>
                    <SelectContent>
                      {OFFERING_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Legal structure</Label>
                  <Select value={legalStructure} onValueChange={(value) => setLegalStructure(value as (typeof LEGAL_STRUCTURE_OPTIONS)[number])}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select legal structure" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEGAL_STRUCTURE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Operating mechanism</Label>
                  <Select value={fundType} onValueChange={(value) => setFundType(value as "open-end" | "closed-end")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select fund type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open-end">Open-ended</SelectItem>
                      <SelectItem value="closed-end">Closed-ended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Distribution channel</Label>
                  <Select
                    value={distributionChannel}
                    onValueChange={(value) => {
                      const nextValue = value as (typeof DISTRIBUTION_CHANNEL_OPTIONS)[number];
                      setDistributionChannel(nextValue);
                      if (nextValue !== "Listed fund") {
                        setListedFundSubtype("ETF");
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select channel" />
                    </SelectTrigger>
                    <SelectContent>
                      {DISTRIBUTION_CHANNEL_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Asset / strategy category</Label>
                  <Select
                    value={assetStrategyCategory}
                    onValueChange={(value) => setAssetStrategyCategory(value as (typeof ASSET_STRATEGY_OPTIONS)[number])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select strategy category" />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSET_STRATEGY_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {listedChannelSelected && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Listed fund subtype</Label>
                    <Select
                      value={listedFundSubtype}
                      onValueChange={(value) => setListedFundSubtype(value as (typeof LISTED_FUND_SUBTYPE_OPTIONS)[number])}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select listed subtype" />
                      </SelectTrigger>
                      <SelectContent>
                        {LISTED_FUND_SUBTYPE_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Fund description</Label>
              <Textarea
                value={fundDescription}
                onChange={(event) => setFundDescription(event.target.value)}
                rows={4}
                placeholder="Describe the fund proposition, liquidity promise, and investor promise."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Deal size unit</Label>
                <Select value={dealSizeUnit} onValueChange={setDealSizeUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HKD">HKD</SelectItem>
                    <SelectItem value="USDC">USDC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target fund size</Label>
                <div className="flex gap-2">
                  <Input value={targetFundSize} onChange={(event) => setTargetFundSize(event.target.value)} type="number" />
                  <div className="px-3 py-2 bg-secondary rounded-md text-sm flex items-center">
                    {dealSizeUnit}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Minimum subscription amount</Label>
                <div className="flex gap-2">
                  <Input value={minSubscriptionAmount} onChange={(event) => setMinSubscriptionAmount(event.target.value)} type="number" />
                  <div className="px-3 py-2 bg-secondary rounded-md text-sm flex items-center">
                    {dealSizeUnit}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Maximum subscription amount per investor</Label>
                <div className="flex gap-2">
                  <Input value={maxSubscriptionAmount} onChange={(event) => setMaxSubscriptionAmount(event.target.value)} type="number" />
                  <div className="px-3 py-2 bg-secondary rounded-md text-sm flex items-center">
                    {dealSizeUnit}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Initial subscription price / NAV</Label>
                <div className="flex gap-2">
                  <Input value={initialNav} onChange={(event) => setInitialNav(event.target.value)} type="number" step="0.0001" />
                  <div className="px-3 py-2 bg-secondary rounded-md text-sm flex items-center">
                    {dealSizeUnit}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Management fee (% p.a.)</Label>
                <div className="flex gap-2">
                  <Input value={managementFee} onChange={(event) => setManagementFee(event.target.value)} type="number" step="0.01" />
                  <div className="px-3 py-2 bg-secondary rounded-md text-sm flex items-center">%</div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Performance fee (%)</Label>
                <div className="flex gap-2">
                  <Input value={performanceFee} onChange={(event) => setPerformanceFee(event.target.value)} type="number" step="0.01" />
                  <div className="px-3 py-2 bg-secondary rounded-md text-sm flex items-center">%</div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Fund manager</Label>
                <Input value={fundManager} onChange={(event) => setFundManager(event.target.value)} placeholder="WeBank Asset Management" />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Issuer entity</Label>
                <Input
                  value={issuerEntity}
                  onChange={(event) => setIssuerEntity(event.target.value)}
                  placeholder="WeBank Asset Management Limited"
                />
              </div>
              <div className="space-y-2">
                <Label>Fund jurisdiction</Label>
                <Input
                  value={fundJurisdiction}
                  onChange={(event) => setFundJurisdiction(event.target.value)}
                  placeholder="Hong Kong SAR"
                />
              </div>
              <div className="space-y-2">
                <Label>Share class</Label>
                <Input
                  value={shareClass}
                  onChange={(event) => setShareClass(event.target.value)}
                  placeholder="Class A"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Investment strategy</Label>
              <Textarea
                value={investmentStrategy}
                onChange={(event) => setInvestmentStrategy(event.target.value)}
                rows={4}
                placeholder="Describe asset strategy, dealing frequency, and investor liquidity promise."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Issue date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {issueDate ? format(issueDate, "PPP HH:mm") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={issueDate} onSelect={setIssueDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              {!openEndMode && (
                <div className="space-y-2">
                  <Label>Maturity date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {maturityDate ? format(maturityDate, "PPP HH:mm") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={maturityDate} onSelect={setMaturityDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label>References</Label>
              {references.map((reference, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <Select
                    value={reference.type}
                    onValueChange={(value) => {
                      const next = [...references];
                      next[index].type = value;
                      setReferences(next);
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="file">File</SelectItem>
                      <SelectItem value="link">Link</SelectItem>
                    </SelectContent>
                  </Select>
                  {reference.type === "file" ? (
                    <div className="flex-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors">
                      <Upload className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                    </div>
                  ) : (
                    <Input
                      value={reference.value}
                      onChange={(event) => {
                        const next = [...references];
                        next[index].value = event.target.value;
                        setReferences(next);
                      }}
                      placeholder="Enter URL"
                      className="flex-1"
                    />
                  )}
                  <Button variant="outline" size="icon" onClick={() => removeReference(index)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addReference} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Reference
              </Button>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleNext}>Next</Button>
          </div>
        </TabsContent>

        <TabsContent value="about-token" className="space-y-6">
          <div className="bg-white border rounded-lg p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Name of fund token</Label>
                <Input value={tokenName} onChange={(event) => setTokenName(event.target.value)} placeholder="DLF-2026 Token" />
              </div>
              <div className="space-y-2">
                <Label>Token symbol</Label>
                <Input value={tokenSymbol} onChange={(event) => setTokenSymbol(event.target.value)} placeholder="DLF-2026" maxLength={15} />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Token standard</Label>
                <Select value={tokenStandard} onValueChange={setTokenStandard}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ERC-20">ERC-20</SelectItem>
                    <SelectItem value="ERC-3643">ERC-3643</SelectItem>
                    <SelectItem value="ERC-1400">ERC-1400</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Token decimals</Label>
                <Input
                  value={tokenDecimals}
                  onChange={(event) => setTokenDecimals(event.target.value)}
                  type="number"
                  min="0"
                  max="18"
                />
              </div>
              <div className="space-y-2">
                <Label>ISIN / security code</Label>
                <Input
                  value={isinCode}
                  onChange={(event) => setIsinCode(event.target.value)}
                  placeholder="HK0000DLF2026"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>1 token represents</Label>
                <Input
                  value={unitPerToken}
                  onChange={(event) => setUnitPerToken(event.target.value)}
                  placeholder="1 fund unit"
                />
              </div>
              <div className="space-y-2">
                <Label>Minting rule</Label>
                <Select value={mintingRule} onValueChange={setMintingRule}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mint-burn">Mint / burn on dealing</SelectItem>
                    <SelectItem value="pre-minted">Pre-minted inventory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <div className="font-medium">Whitelist required</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Investor wallets must pass eligibility checks before holding or receiving tokens.
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">No</span>
                  <Switch checked={whitelistRequired} onCheckedChange={setWhitelistRequired} />
                  <span className="text-sm text-muted-foreground">Yes</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <div className="font-medium">Is token tradable on secondary market</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Toggle whether this fund token is allowed to circulate in a secondary trading venue.
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">No</span>
                <Switch checked={isTokenTradable} onCheckedChange={setIsTokenTradable} />
                <span className="text-sm text-muted-foreground">Yes</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentTab("about-deal")}>
              Previous
            </Button>
            <Button onClick={handleNext}>Next</Button>
          </div>
        </TabsContent>

        <TabsContent value="subscription-rules" className="space-y-6">
          <div className="bg-white border rounded-lg p-6 space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Subscription lot size</Label>
                <Input value={subscriptionLotSize} onChange={(event) => setSubscriptionLotSize(event.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Subscription minimum quantity</Label>
                <Input value={subscriptionMinQuantity} onChange={(event) => setSubscriptionMinQuantity(event.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Subscription maximum quantity</Label>
                <Input value={subscriptionMaxQuantity} onChange={(event) => setSubscriptionMaxQuantity(event.target.value)} type="number" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{openEndMode ? "Initial subscription window" : "Subscription period"}</Label>
              <div className="grid md:grid-cols-2 gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {subscriptionStartDate ? format(subscriptionStartDate, "PPP HH:mm") : "Start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={subscriptionStartDate} onSelect={setSubscriptionStartDate} initialFocus />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {subscriptionEndDate ? format(subscriptionEndDate, "PPP HH:mm") : "End date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={subscriptionEndDate} onSelect={setSubscriptionEndDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="rounded-lg border border-[var(--navy-100)] bg-[var(--navy-50)] p-4">
              <h3 className="font-medium" style={{ fontFamily: "var(--font-heading)" }}>
                Subscription Funding
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Configure how investors fund subscriptions before units are booked into the holder register.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Subscription payment method</Label>
                <Select
                  value={subscriptionPaymentMethod}
                  onValueChange={(value) => {
                    const nextValue =
                      value as (typeof SUBSCRIPTION_PAYMENT_METHOD_OPTIONS)[number];
                    setSubscriptionPaymentMethod(nextValue);
                    if (nextValue === "Fiat") {
                      setSubscriptionPaymentRail("Off-chain Bank Transfer");
                      setSubscriptionSettlementAccountType("Bank Account");
                    } else {
                      setSubscriptionPaymentRail("On-chain Wallet Transfer");
                      setSubscriptionSettlementAccountType("Wallet");
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBSCRIPTION_PAYMENT_METHOD_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Payment rail</Label>
                <Select
                  value={subscriptionPaymentRail}
                  onValueChange={(value) => {
                    const nextValue = value as (typeof SUBSCRIPTION_PAYMENT_RAIL_OPTIONS)[number];
                    setSubscriptionPaymentRail(nextValue);
                    setSubscriptionSettlementAccountType(
                      nextValue === "Off-chain Bank Transfer" ? "Bank Account" : "Wallet",
                    );
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBSCRIPTION_PAYMENT_RAIL_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Subscription cash currency</Label>
                <Select value={subscriptionCashCurrency} onValueChange={setSubscriptionCashCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HKD">HKD</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="USDC">USDC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Settlement account type</Label>
                <Select
                  value={subscriptionSettlementAccountType}
                  onValueChange={(value) =>
                    setSubscriptionSettlementAccountType(
                      value as (typeof SUBSCRIPTION_SETTLEMENT_ACCOUNT_TYPES)[number],
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBSCRIPTION_SETTLEMENT_ACCOUNT_TYPES.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Cash confirmation owner</Label>
                <Select
                  value={cashConfirmationOwner}
                  onValueChange={(value) =>
                    setCashConfirmationOwner(
                      value as (typeof CASH_CONFIRMATION_OWNER_OPTIONS)[number],
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CASH_CONFIRMATION_OWNER_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {bankTransferFunding ? (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Receiving bank name</Label>
                  <Input
                    value={receivingBankName}
                    onChange={(event) => setReceivingBankName(event.target.value)}
                    placeholder="Bank of China (Hong Kong)"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Receiving account name</Label>
                  <Input
                    value={receivingBankAccountName}
                    onChange={(event) => setReceivingBankAccountName(event.target.value)}
                    placeholder="Issuer client monies account"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Receiving account number / masked</Label>
                  <Input
                    value={receivingBankAccountNumberMasked}
                    onChange={(event) => setReceivingBankAccountNumberMasked(event.target.value)}
                    placeholder="012-888-456789-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>SWIFT / bank code</Label>
                  <Input
                    value={receivingBankSwiftCode}
                    onChange={(event) => setReceivingBankSwiftCode(event.target.value)}
                    placeholder="BKCHHKHHXXX"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Subscription collection wallet</Label>
                <Input
                  value={subscriptionCollectionWallet}
                  onChange={(event) => setSubscriptionCollectionWallet(event.target.value)}
                  placeholder="0xCOLLECT-ADDRESS"
                />
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Payment reference rule</Label>
                <Textarea
                  value={paymentReferenceRule}
                  onChange={(event) => setPaymentReferenceRule(event.target.value)}
                  rows={3}
                  placeholder="e.g. Use investor name plus order ID in remittance note"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <div className="font-medium">Payment proof required</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Require investors to upload a remittance slip or proof before cash confirmation.
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">No</span>
                  <Switch checked={paymentProofRequired} onCheckedChange={setPaymentProofRequired} />
                  <span className="text-sm text-muted-foreground">Yes</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[var(--navy-100)] bg-[var(--navy-50)] p-4">
              <h3 className="font-medium" style={{ fontFamily: "var(--font-heading)" }}>
                NAV Data Source
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                This is a fund-level attribute for the demo. It controls how the fund's NAV history is
                presented in the product view, independently from the issuer's operating workflows.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>NAV update mode</Label>
                <Select
                  value={navUpdateMode}
                  onValueChange={(value) => setNavUpdateMode(value as NavUpdateMode)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Oracle Feed">Oracle Feed</SelectItem>
                    <SelectItem value="Manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-lg border p-4 text-sm">
                <div className="font-medium">
                  {navUpdateMode === "Oracle Feed" ? "Oracle-driven demo" : "Manual NAV committee demo"}
                </div>
                <div className="mt-1 text-muted-foreground">
                  {navUpdateMode === "Oracle Feed"
                    ? "The detail page will show the fund as receiving periodic oracle NAV updates and will label the latest synced timestamp."
                    : "The detail page will show the NAV as manually maintained, with event history still layered on top of the graph."}
                </div>
              </div>
            </div>

            {navUpdateMode === "Oracle Feed" ? (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Oracle provider</Label>
                  <Input
                    value={oracleProvider}
                    onChange={(event) => setOracleProvider(event.target.value)}
                    placeholder="Chainlink NAV Adapter"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Feed ID / contract reference</Label>
                  <Input
                    value={oracleFeedId}
                    onChange={(event) => setOracleFeedId(event.target.value)}
                    placeholder="HKD-FUND-NAV-DEMO"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Oracle update frequency</Label>
                  <Input
                    value={oracleUpdateFrequency}
                    onChange={(event) => setOracleUpdateFrequency(event.target.value)}
                    placeholder="Every dealing day close"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fallback rule</Label>
                  <Textarea
                    value={oracleFallbackRule}
                    onChange={(event) => setOracleFallbackRule(event.target.value)}
                    rows={3}
                    placeholder="Fallback to issuer manual confirmation after 30 minutes without a fresh oracle tick"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Manual NAV governance note</Label>
                <Textarea
                  value={oracleFallbackRule}
                  onChange={(event) => setOracleFallbackRule(event.target.value)}
                  rows={3}
                  placeholder="Describe who confirms and publishes NAV in this demo"
                />
              </div>
            )}

            {openEndMode ? (
              <>
                <div className="rounded-lg border border-[var(--navy-100)] bg-[var(--navy-50)] p-4">
                  <h3 className="font-medium" style={{ fontFamily: "var(--font-heading)" }}>
                    Open-end Rules
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    These settings determine how daily dealing, NAV valuation, and T+1 settlement will behave once the fund becomes active.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Dealing frequency</Label>
                    <Select value={dealingFrequency} onValueChange={setDealingFrequency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Settlement cycle</Label>
                    <Select value={settlementCycle} onValueChange={setSettlementCycle}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="T+0">T+0</SelectItem>
                        <SelectItem value="T+1">T+1</SelectItem>
                        <SelectItem value="T+2">T+2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Dealing cut-off time</Label>
                    <Input type="time" value={dealingCutoffTime} onChange={(event) => setDealingCutoffTime(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>NAV valuation time</Label>
                    <Input type="time" value={navValuationTime} onChange={(event) => setNavValuationTime(event.target.value)} />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Notice period for redemption (days)</Label>
                    <Input type="number" value={noticePeriodDays} onChange={(event) => setNoticePeriodDays(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Order confirmation method</Label>
                    <Select value={orderConfirmationMethod} onValueChange={setOrderConfirmationMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto at cut-off</SelectItem>
                        <SelectItem value="manual">Issuer review then confirm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Lock-up period</Label>
                    <div className="flex gap-2">
                      <Input type="number" value={lockupValue} onChange={(event) => setLockupValue(event.target.value)} />
                      <Select value={lockupUnit} onValueChange={setLockupUnit}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="days">Days</SelectItem>
                          <SelectItem value="months">Months</SelectItem>
                          <SelectItem value="years">Years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Redemption gate per investor</Label>
                    <Input type="number" value={redemptionGatePerInvestor} onChange={(event) => setRedemptionGatePerInvestor(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Fund-level redemption gate (%)</Label>
                    <Input type="number" value={fundLevelRedemptionGate} onChange={(event) => setFundLevelRedemptionGate(event.target.value)} />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <div className="font-medium">Subscription status after launch</div>
                      <div className="text-sm text-muted-foreground">Open automatically when the fund enters active dealing.</div>
                    </div>
                    <Switch checked={subscriptionStatusAfterLaunch} onCheckedChange={setSubscriptionStatusAfterLaunch} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <div className="font-medium">Redemption status after launch</div>
                      <div className="text-sm text-muted-foreground">Allow daily redemption requests once the fund goes live.</div>
                    </div>
                    <Switch checked={redemptionStatusAfterLaunch} onCheckedChange={setRedemptionStatusAfterLaunch} />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label>Allocation rule</Label>
                <Select value={allocationRule} onValueChange={setAllocationRule}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pro-rata">Pro-rata</SelectItem>
                    <SelectItem value="first-come-first-served">First-come-first-served</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-3">
              <Label>Investor rules</Label>
              {investorRules.map((rule, index) => (
                <div key={index} className="flex gap-2 items-start p-4 border rounded-lg">
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <Select
                      value={rule.ruleType}
                      onValueChange={(value) => {
                        const next = [...investorRules];
                        next[index].ruleType = value;
                        next[index].condition = getInvestorRuleCondition(value);
                        setInvestorRules(next);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Rule type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="investor-type">Investor type</SelectItem>
                        <SelectItem value="investor-jurisdiction">Investor jurisdiction</SelectItem>
                        <SelectItem value="risk-test-level">Risk test level</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={rule.condition} disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="Condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Must be">Must be</SelectItem>
                        <SelectItem value="Must be at least">Must be at least</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={rule.value}
                      onChange={(event) => {
                        const next = [...investorRules];
                        next[index].value = event.target.value;
                        setInvestorRules(next);
                      }}
                      placeholder={getInvestorRulePlaceholder(rule.ruleType)}
                    />
                  </div>
                  <Button variant="outline" size="icon" onClick={() => removeInvestorRule(index)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addInvestorRule} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Rule
              </Button>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentTab("about-token")}>
              Previous
            </Button>
            <Button onClick={handleNext}>Next</Button>
          </div>
        </TabsContent>

        <TabsContent value="fund-documents" className="space-y-6">
          <div className="bg-white border rounded-lg p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Fund administrator</Label>
                <Input placeholder="Enter fund administrator name" />
              </div>
              <div className="space-y-2">
                <Label>Custodian of fund assets</Label>
                <Input placeholder="Enter custodian name" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Upload: Fund offering document / Prospectus</Label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors">
                <FileText className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground">PDF (max. 500MB)</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Upload: Other supporting documents</Label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors">
                <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground">JPG, PNG, GIF, PDF (max. 500MB per file)</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentTab("subscription-rules")}>
              Previous
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
