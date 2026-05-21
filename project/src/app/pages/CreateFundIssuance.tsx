import { useState, type ReactNode } from "react";
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

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-secondary/20 p-4 space-y-5 sm:p-5">
      <div>
        <h2 className="font-medium" style={{ fontFamily: "var(--font-heading)" }}>
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
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
  const issuanceFlowSteps = openEndMode
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
      ];

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
    <div className="container mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-8">
        <h1 style={{ fontFamily: "var(--font-heading)" }}>Create Fund Issuance</h1>
        <p className="text-muted-foreground mt-2">
          Configure a fund draft and define the rules that will govern launch, dealing, and settlement.
        </p>
      </div>

      <div className="mb-8">
        <div className="hidden sm:block">
          <ProcessFlowCard title="Primary Issuance Flow" steps={issuanceFlowSteps} />
        </div>
        <div className="rounded-lg border border-[var(--navy-200)] bg-gradient-to-br from-[var(--navy-50)] to-white p-4 sm:hidden">
          <h3 className="mb-4" style={{ fontFamily: "var(--font-heading)" }}>
            Primary Issuance Flow
          </h3>
          <div className="space-y-3">
            {issuanceFlowSteps.map((step, index) => (
              <div key={step.label} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                    {index + 1}
                  </div>
                  {index < issuanceFlowSteps.length - 1 ? <div className="mt-2 h-8 w-px bg-border" /> : null}
                </div>
                <div className="min-w-0 pb-1">
                  <div className="text-sm font-medium">{step.label}</div>
                  <div className="text-xs text-muted-foreground">{step.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 rounded-lg border bg-secondary/20 p-4">
          <div className="text-sm font-medium">
            {openEndMode ? "Open-end operating mode" : "Closed-end operating mode"}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {openEndMode
              ? "Open-end setup keeps daily dealing, NAV timing, settlement cycle, and redemption controls visible in Subscription & Rules."
              : "Closed-end setup replaces ongoing dealing controls with a subscription period and allocation rule for the launch book."}
          </p>
        </div>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-8">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-secondary p-1 md:grid-cols-4">
          <TabsTrigger value="about-deal" className="min-h-10 whitespace-normal px-2 py-2 text-xs sm:text-sm">
            About Deal
          </TabsTrigger>
          <TabsTrigger value="about-token" className="min-h-10 whitespace-normal px-2 py-2 text-xs sm:text-sm">
            About Token
          </TabsTrigger>
          <TabsTrigger value="subscription-rules" className="min-h-10 whitespace-normal px-2 py-2 text-xs sm:text-sm">
            Subscription & Rules
          </TabsTrigger>
          <TabsTrigger value="fund-documents" className="min-h-10 whitespace-normal px-2 py-2 text-xs sm:text-sm">
            Fund Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="about-deal" className="space-y-6">
          <div className="space-y-5">
            <FormSection
              title="Fund Identity / Launch Essentials"
              description="Name the fund and set the dates needed to create the launch draft."
            >
            <div className="space-y-2">
              <Label htmlFor="fund-name">Fund name</Label>
              <Input
                id="fund-name"
                value={fundName}
                onChange={(event) => setFundName(event.target.value)}
                placeholder="Daily Liquidity Fund"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="issue-date">Issue date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button id="issue-date" variant="outline" className="w-full justify-start text-left font-normal">
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
                  <Label htmlFor="maturity-date">Maturity date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button id="maturity-date" variant="outline" className="w-full justify-start text-left font-normal">
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
            </FormSection>

            <FormSection
              title="Hong Kong Fund Classification"
              description="Capture the fund across Hong Kong offering, legal, operating, channel, and strategy axes."
            >
              <div className="grid md:grid-cols-2 gap-6 xl:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="offering-type">Offering type</Label>
                  <Select
                    value={offeringType}
                    onValueChange={(value) => setOfferingType(value as (typeof OFFERING_TYPE_OPTIONS)[number])}
                  >
                    <SelectTrigger id="offering-type">
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
                  <Label htmlFor="legal-structure">Legal structure</Label>
                  <Select value={legalStructure} onValueChange={(value) => setLegalStructure(value as (typeof LEGAL_STRUCTURE_OPTIONS)[number])}>
                    <SelectTrigger id="legal-structure">
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
                  <Label htmlFor="operating-mechanism">Operating mechanism</Label>
                  <Select value={fundType} onValueChange={(value) => setFundType(value as "open-end" | "closed-end")}>
                    <SelectTrigger id="operating-mechanism">
                      <SelectValue placeholder="Select fund type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open-end">Open-ended</SelectItem>
                      <SelectItem value="closed-end">Closed-ended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="distribution-channel">Distribution channel</Label>
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
                    <SelectTrigger id="distribution-channel">
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
                  <Label htmlFor="asset-strategy-category">Asset / strategy category</Label>
                  <Select
                    value={assetStrategyCategory}
                    onValueChange={(value) => setAssetStrategyCategory(value as (typeof ASSET_STRATEGY_OPTIONS)[number])}
                  >
                    <SelectTrigger id="asset-strategy-category">
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
	                    <Label htmlFor="listed-fund-subtype">Listed fund subtype</Label>
	                    <Select
	                      value={listedFundSubtype}
	                      onValueChange={(value) => setListedFundSubtype(value as (typeof LISTED_FUND_SUBTYPE_OPTIONS)[number])}
	                    >
	                      <SelectTrigger id="listed-fund-subtype">
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
            </FormSection>

            <FormSection
              title="Strategy Narrative"
              description="Describe the investor proposition and investment approach shown in the fund profile."
            >
            <div className="space-y-2">
              <Label htmlFor="fund-description">Fund description</Label>
              <Textarea
                id="fund-description"
                value={fundDescription}
                onChange={(event) => setFundDescription(event.target.value)}
                rows={4}
                placeholder="Describe the fund proposition, liquidity promise, and investor promise."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="investment-strategy">Investment strategy</Label>
              <Textarea
                id="investment-strategy"
                value={investmentStrategy}
                onChange={(event) => setInvestmentStrategy(event.target.value)}
                rows={4}
                placeholder="Describe asset strategy, dealing frequency, and investor liquidity promise."
              />
            </div>
            </FormSection>

            <FormSection
              title="Fund Economics"
              description="Set currency, target size, subscription amount limits, launch NAV, and fee terms."
            >
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="deal-size-unit">Deal size unit</Label>
                <Select value={dealSizeUnit} onValueChange={setDealSizeUnit}>
                  <SelectTrigger id="deal-size-unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HKD">HKD</SelectItem>
                    <SelectItem value="USDC">USDC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target-fund-size">Target fund size</Label>
                <div className="flex gap-2">
                  <Input id="target-fund-size" value={targetFundSize} onChange={(event) => setTargetFundSize(event.target.value)} type="number" />
                  <div className="px-3 py-2 bg-secondary rounded-md text-sm flex items-center">
                    {dealSizeUnit}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="minimum-subscription-amount">Minimum subscription amount</Label>
                <div className="flex gap-2">
                  <Input id="minimum-subscription-amount" value={minSubscriptionAmount} onChange={(event) => setMinSubscriptionAmount(event.target.value)} type="number" />
                  <div className="px-3 py-2 bg-secondary rounded-md text-sm flex items-center">
                    {dealSizeUnit}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maximum-subscription-amount">Maximum subscription amount per investor</Label>
                <div className="flex gap-2">
                  <Input id="maximum-subscription-amount" value={maxSubscriptionAmount} onChange={(event) => setMaxSubscriptionAmount(event.target.value)} type="number" />
                  <div className="px-3 py-2 bg-secondary rounded-md text-sm flex items-center">
                    {dealSizeUnit}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="initial-subscription-nav">Initial subscription price / NAV</Label>
                <div className="flex gap-2">
                  <Input id="initial-subscription-nav" value={initialNav} onChange={(event) => setInitialNav(event.target.value)} type="number" step="0.0001" />
                  <div className="px-3 py-2 bg-secondary rounded-md text-sm flex items-center">
                    {dealSizeUnit}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="management-fee">Management fee (% p.a.)</Label>
                <div className="flex gap-2">
                  <Input id="management-fee" value={managementFee} onChange={(event) => setManagementFee(event.target.value)} type="number" step="0.01" />
                  <div className="px-3 py-2 bg-secondary rounded-md text-sm flex items-center">%</div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="performance-fee">Performance fee (%)</Label>
                <div className="flex gap-2">
                  <Input id="performance-fee" value={performanceFee} onChange={(event) => setPerformanceFee(event.target.value)} type="number" step="0.01" />
                  <div className="px-3 py-2 bg-secondary rounded-md text-sm flex items-center">%</div>
                </div>
              </div>
            </div>
            </FormSection>

            <FormSection
              title="Parties & Share Class"
              description="Record the operational parties and class-level identity used across workflow screens."
            >
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fund-manager">Fund manager</Label>
                <Input id="fund-manager" value={fundManager} onChange={(event) => setFundManager(event.target.value)} placeholder="WeBank Asset Management" />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="issuer-entity">Issuer entity</Label>
                <Input
                  id="issuer-entity"
                  value={issuerEntity}
                  onChange={(event) => setIssuerEntity(event.target.value)}
                  placeholder="WeBank Asset Management Limited"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fund-jurisdiction">Fund jurisdiction</Label>
                <Input
                  id="fund-jurisdiction"
                  value={fundJurisdiction}
                  onChange={(event) => setFundJurisdiction(event.target.value)}
                  placeholder="Hong Kong SAR"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="share-class">Share class</Label>
                <Input
                  id="share-class"
                  value={shareClass}
                  onChange={(event) => setShareClass(event.target.value)}
                  placeholder="Class A"
                />
              </div>
            </div>
            </FormSection>

            <details className="rounded-lg border bg-secondary/20 p-4 sm:p-5">
              <summary className="cursor-pointer select-none font-medium" style={{ fontFamily: "var(--font-heading)" }}>
                References
              </summary>
              <div className="mt-5 space-y-3">
            <div className="space-y-3">
              <div className="text-sm font-medium">References</div>
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
	                    <SelectTrigger aria-label={`Reference ${index + 1} type`} className="w-32">
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
                        aria-label={`Reference ${index + 1} URL`}
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
	                  <Button
                      aria-label={`Remove reference ${index + 1}`}
                      variant="outline"
                      size="icon"
                      onClick={() => removeReference(index)}
                    >
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
            </details>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleNext}>Next</Button>
          </div>
        </TabsContent>

        <TabsContent value="about-token" className="space-y-6">
          <div className="space-y-5">
            <FormSection
              title="Token Identity"
              description="Define the investor-facing token name, ticker, and contract standard."
            >
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="token-name">Name of fund token</Label>
                <Input id="token-name" value={tokenName} onChange={(event) => setTokenName(event.target.value)} placeholder="DLF-2026 Token" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="token-symbol">Token symbol</Label>
                <Input id="token-symbol" value={tokenSymbol} onChange={(event) => setTokenSymbol(event.target.value)} placeholder="DLF-2026" maxLength={15} />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="token-standard">Token standard</Label>
                <Select value={tokenStandard} onValueChange={setTokenStandard}>
                  <SelectTrigger id="token-standard">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ERC-20">ERC-20</SelectItem>
                    <SelectItem value="ERC-3643">ERC-3643</SelectItem>
                    <SelectItem value="ERC-1400">ERC-1400</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            </FormSection>

            <FormSection
              title="Unit Mapping"
              description="Map token quantity to fund units and define how supply changes during dealing."
            >
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="unit-per-token">1 token represents</Label>
                <Input
                  id="unit-per-token"
                  value={unitPerToken}
                  onChange={(event) => setUnitPerToken(event.target.value)}
                  placeholder="1 fund unit"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minting-rule">Minting rule</Label>
                <Select value={mintingRule} onValueChange={setMintingRule}>
                  <SelectTrigger id="minting-rule">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mint-burn">Mint / burn on dealing</SelectItem>
                    <SelectItem value="pre-minted">Pre-minted inventory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            </FormSection>

            <FormSection
              title="Transfer Controls"
              description="Set wallet eligibility and whether secondary-market transfer is allowed."
            >
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-4 rounded-lg border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
	                <div>
	                  <div id="whitelist-required-label" className="font-medium">Whitelist required</div>
	                  <div className="text-sm text-muted-foreground mt-1">
	                    Investor wallets must pass eligibility checks before holding or receiving tokens.
	                  </div>
	                </div>
	                <div className="flex items-center gap-3">
	                  <span className="text-sm text-muted-foreground">No</span>
	                  <Switch
                      id="whitelist-required"
                      aria-labelledby="whitelist-required-label"
                      checked={whitelistRequired}
                      onCheckedChange={setWhitelistRequired}
                    />
	                  <span className="text-sm text-muted-foreground">Yes</span>
	                </div>
	              </div>

            <div className="flex flex-col gap-4 rounded-lg border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div id="token-tradable-label" className="font-medium">Is token tradable on secondary market</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Toggle whether this fund token is allowed to circulate in a secondary trading venue.
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">No</span>
                <Switch
                  id="token-tradable"
                  aria-labelledby="token-tradable-label"
                  checked={isTokenTradable}
                  onCheckedChange={setIsTokenTradable}
                />
                <span className="text-sm text-muted-foreground">Yes</span>
              </div>
            </div>
            </div>
            </FormSection>

            <details className="rounded-lg border bg-secondary/20 p-4 sm:p-5">
              <summary className="cursor-pointer select-none font-medium" style={{ fontFamily: "var(--font-heading)" }}>
                Advanced Token IDs
              </summary>
              <div className="mt-5 grid gap-6 md:grid-cols-2">
	                <div className="space-y-2">
	                  <Label htmlFor="token-decimals">Token decimals</Label>
	                  <Input
	                    id="token-decimals"
	                    value={tokenDecimals}
	                    onChange={(event) => setTokenDecimals(event.target.value)}
                    type="number"
                    min="0"
                    max="18"
                  />
	                </div>
	                <div className="space-y-2">
	                  <Label htmlFor="isin-code">ISIN / security code</Label>
	                  <Input
	                    id="isin-code"
	                    value={isinCode}
	                    onChange={(event) => setIsinCode(event.target.value)}
                    placeholder="HK0000DLF2026"
                  />
                </div>
              </div>
            </details>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentTab("about-deal")}>
              Previous
            </Button>
            <Button onClick={handleNext}>Next</Button>
          </div>
        </TabsContent>

        <TabsContent value="subscription-rules" className="space-y-6">
          <div className="space-y-5">
            <FormSection
              title="Order Entry Limits"
              description="Define the minimum increment and quantity bounds for subscription orders."
            >
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="subscription-lot-size">Subscription lot size</Label>
                <Input id="subscription-lot-size" value={subscriptionLotSize} onChange={(event) => setSubscriptionLotSize(event.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subscription-minimum-quantity">Subscription minimum quantity</Label>
                <Input id="subscription-minimum-quantity" value={subscriptionMinQuantity} onChange={(event) => setSubscriptionMinQuantity(event.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subscription-maximum-quantity">Subscription maximum quantity</Label>
                <Input id="subscription-maximum-quantity" value={subscriptionMaxQuantity} onChange={(event) => setSubscriptionMaxQuantity(event.target.value)} type="number" />
              </div>
            </div>
            </FormSection>

            <FormSection
              title="Launch Window"
              description={openEndMode ? "Set the initial launch window before ongoing dealing opens." : "Set the fixed subscription period for the closed-end book."}
            >
            <div className="space-y-2">
              <Label htmlFor="subscription-start-date">{openEndMode ? "Initial subscription window" : "Subscription period"}</Label>
              <div className="grid md:grid-cols-2 gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button id="subscription-start-date" variant="outline" className="w-full justify-start text-left font-normal">
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
                    <Button id="subscription-end-date" aria-label="Subscription end date" variant="outline" className="w-full justify-start text-left font-normal">
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
            </FormSection>

            <FormSection
              title="Subscription Funding"
              description="Configure how investors fund subscriptions before units are booked into the holder register."
            >
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="subscription-payment-method">Subscription payment method</Label>
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
                  <SelectTrigger id="subscription-payment-method">
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
                <Label htmlFor="subscription-payment-rail">Payment rail</Label>
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
                  <SelectTrigger id="subscription-payment-rail">
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

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="subscription-cash-currency">Subscription cash currency</Label>
                <Select value={subscriptionCashCurrency} onValueChange={setSubscriptionCashCurrency}>
                  <SelectTrigger id="subscription-cash-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HKD">HKD</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="USDC">USDC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            </FormSection>

            <FormSection
              title="Settlement Destination"
              description="Capture the receiving account or wallet used for subscription cash collection."
            >
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="settlement-account-type">Settlement account type</Label>
                <Select
                  value={subscriptionSettlementAccountType}
                  onValueChange={(value) =>
                    setSubscriptionSettlementAccountType(
                      value as (typeof SUBSCRIPTION_SETTLEMENT_ACCOUNT_TYPES)[number],
                    )
                  }
                >
                  <SelectTrigger id="settlement-account-type">
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
                <Label htmlFor="cash-confirmation-owner">Cash confirmation owner</Label>
                <Select
                  value={cashConfirmationOwner}
                  onValueChange={(value) =>
                    setCashConfirmationOwner(
                      value as (typeof CASH_CONFIRMATION_OWNER_OPTIONS)[number],
                    )
                  }
                >
                  <SelectTrigger id="cash-confirmation-owner">
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
                  <Label htmlFor="receiving-bank-name">Receiving bank name</Label>
                  <Input
                    id="receiving-bank-name"
                    value={receivingBankName}
                    onChange={(event) => setReceivingBankName(event.target.value)}
                    placeholder="Bank of China (Hong Kong)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receiving-account-name">Receiving account name</Label>
                  <Input
                    id="receiving-account-name"
                    value={receivingBankAccountName}
                    onChange={(event) => setReceivingBankAccountName(event.target.value)}
                    placeholder="Issuer client monies account"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receiving-account-number">Receiving account number / masked</Label>
                  <Input
                    id="receiving-account-number"
                    value={receivingBankAccountNumberMasked}
                    onChange={(event) => setReceivingBankAccountNumberMasked(event.target.value)}
                    placeholder="012-888-456789-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receiving-bank-swift">SWIFT / bank code</Label>
                  <Input
                    id="receiving-bank-swift"
                    value={receivingBankSwiftCode}
                    onChange={(event) => setReceivingBankSwiftCode(event.target.value)}
                    placeholder="BKCHHKHHXXX"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="subscription-collection-wallet">Subscription collection wallet</Label>
                <Input
                  id="subscription-collection-wallet"
                  value={subscriptionCollectionWallet}
                  onChange={(event) => setSubscriptionCollectionWallet(event.target.value)}
                  placeholder="0xCOLLECT-ADDRESS"
                />
              </div>
            )}
            </FormSection>

            <FormSection
              title="Payment Evidence"
              description="Set remittance reference guidance and whether investors must upload proof."
            >
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="payment-reference-rule">Payment reference rule</Label>
                <Textarea
                  id="payment-reference-rule"
                  value={paymentReferenceRule}
                  onChange={(event) => setPaymentReferenceRule(event.target.value)}
                  rows={3}
                  placeholder="e.g. Use investor name plus order ID in remittance note"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <div id="payment-proof-required-label" className="font-medium">Payment proof required</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Require investors to upload a remittance slip or proof before cash confirmation.
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">No</span>
                  <Switch
                    id="payment-proof-required"
                    aria-labelledby="payment-proof-required-label"
                    checked={paymentProofRequired}
                    onCheckedChange={setPaymentProofRequired}
                  />
                  <span className="text-sm text-muted-foreground">Yes</span>
                </div>
              </div>
            </div>
            </FormSection>

            <FormSection
              title="NAV Source"
              description="Control how the fund's NAV history is presented in the product view."
            >
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nav-update-mode">NAV update mode</Label>
                <Select
                  value={navUpdateMode}
                  onValueChange={(value) => setNavUpdateMode(value as NavUpdateMode)}
                >
                  <SelectTrigger id="nav-update-mode">
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
                  <Label htmlFor="oracle-provider">Oracle provider</Label>
                  <Input
                    id="oracle-provider"
                    value={oracleProvider}
                    onChange={(event) => setOracleProvider(event.target.value)}
                    placeholder="Chainlink NAV Adapter"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="oracle-feed-id">Feed ID / contract reference</Label>
                  <Input
                    id="oracle-feed-id"
                    value={oracleFeedId}
                    onChange={(event) => setOracleFeedId(event.target.value)}
                    placeholder="HKD-FUND-NAV-DEMO"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="oracle-update-frequency">Oracle update frequency</Label>
                  <Input
                    id="oracle-update-frequency"
                    value={oracleUpdateFrequency}
                    onChange={(event) => setOracleUpdateFrequency(event.target.value)}
                    placeholder="Every dealing day close"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="oracle-fallback-rule">Fallback rule</Label>
                  <Textarea
                    id="oracle-fallback-rule"
                    value={oracleFallbackRule}
                    onChange={(event) => setOracleFallbackRule(event.target.value)}
                    rows={3}
                    placeholder="Fallback to issuer manual confirmation after 30 minutes without a fresh oracle tick"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="manual-nav-governance-note">Manual NAV governance note</Label>
                <Textarea
                  id="manual-nav-governance-note"
                  value={oracleFallbackRule}
                  onChange={(event) => setOracleFallbackRule(event.target.value)}
                  rows={3}
                  placeholder="Describe who confirms and publishes NAV in this demo"
                />
              </div>
            )}
            </FormSection>

            {openEndMode ? (
              <>
              <FormSection
                title="Open-end Dealing Rules"
                description="These settings determine daily dealing, NAV valuation, and settlement behavior once the fund is active."
              >
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="dealing-frequency">Dealing frequency</Label>
                    <Select value={dealingFrequency} onValueChange={setDealingFrequency}>
                      <SelectTrigger id="dealing-frequency">
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
                    <Label htmlFor="settlement-cycle">Settlement cycle</Label>
                    <Select value={settlementCycle} onValueChange={setSettlementCycle}>
                      <SelectTrigger id="settlement-cycle">
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
                    <Label htmlFor="dealing-cutoff-time">Dealing cut-off time</Label>
                    <Input id="dealing-cutoff-time" type="time" value={dealingCutoffTime} onChange={(event) => setDealingCutoffTime(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nav-valuation-time">NAV valuation time</Label>
                    <Input id="nav-valuation-time" type="time" value={navValuationTime} onChange={(event) => setNavValuationTime(event.target.value)} />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="order-confirmation-method">Order confirmation method</Label>
                    <Select value={orderConfirmationMethod} onValueChange={setOrderConfirmationMethod}>
                      <SelectTrigger id="order-confirmation-method">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto at cut-off</SelectItem>
                        <SelectItem value="manual">Issuer review then confirm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </FormSection>

              <FormSection
                title="Redemption Controls"
                description="Set lock-up, notice period, redemption gates, and launch status for open-end cash-out requests."
              >
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="notice-period-days">Notice period for redemption (days)</Label>
                    <Input id="notice-period-days" type="number" value={noticePeriodDays} onChange={(event) => setNoticePeriodDays(event.target.value)} />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="lockup-value">Lock-up period</Label>
                    <div className="flex gap-2">
                      <Input id="lockup-value" type="number" value={lockupValue} onChange={(event) => setLockupValue(event.target.value)} />
                      <Select value={lockupUnit} onValueChange={setLockupUnit}>
                        <SelectTrigger aria-label="Lock-up unit" className="w-32">
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
                    <Label htmlFor="redemption-gate-per-investor">Redemption gate per investor</Label>
                    <Input id="redemption-gate-per-investor" type="number" value={redemptionGatePerInvestor} onChange={(event) => setRedemptionGatePerInvestor(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fund-level-redemption-gate">Fund-level redemption gate (%)</Label>
                    <Input id="fund-level-redemption-gate" type="number" value={fundLevelRedemptionGate} onChange={(event) => setFundLevelRedemptionGate(event.target.value)} />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <div id="subscription-status-after-launch-label" className="font-medium">Subscription status after launch</div>
                      <div className="text-sm text-muted-foreground">Open automatically when the fund enters active dealing.</div>
                    </div>
                    <Switch
                      id="subscription-status-after-launch"
                      aria-labelledby="subscription-status-after-launch-label"
                      checked={subscriptionStatusAfterLaunch}
                      onCheckedChange={setSubscriptionStatusAfterLaunch}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <div id="redemption-status-after-launch-label" className="font-medium">Redemption status after launch</div>
                      <div className="text-sm text-muted-foreground">Allow daily redemption requests once the fund goes live.</div>
                    </div>
                    <Switch
                      id="redemption-status-after-launch"
                      aria-labelledby="redemption-status-after-launch-label"
                      checked={redemptionStatusAfterLaunch}
                      onCheckedChange={setRedemptionStatusAfterLaunch}
                    />
                  </div>
                </div>
              </FormSection>
              </>
            ) : (
              <FormSection
                title="Closed-end Allocation"
                description="Set how accepted subscriptions are allocated once the book closes."
	              >
	              <div className="space-y-2">
	                <Label htmlFor="allocation-rule">Allocation rule</Label>
	                <Select value={allocationRule} onValueChange={setAllocationRule}>
	                  <SelectTrigger id="allocation-rule">
	                    <SelectValue />
	                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pro-rata">Pro-rata</SelectItem>
                    <SelectItem value="first-come-first-served">First-come-first-served</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              </FormSection>
            )}

            <FormSection
              title="Investor Eligibility"
              description="Add optional rules that will be saved with the fund draft and shown in eligibility review."
            >
            <div className="space-y-3">
              <div className="text-sm font-medium">Investor rules</div>
              {investorRules.map((rule, index) => (
                <div key={index} className="flex flex-col gap-3 rounded-lg border bg-background p-4 sm:flex-row sm:items-start">
                  <div className="grid flex-1 gap-3 md:grid-cols-3">
                    <Select
                      value={rule.ruleType}
                      onValueChange={(value) => {
                        const next = [...investorRules];
                        next[index].ruleType = value;
                        next[index].condition = getInvestorRuleCondition(value);
                        setInvestorRules(next);
	                      }}
	                    >
	                      <SelectTrigger aria-label={`Investor rule ${index + 1} type`}>
	                        <SelectValue placeholder="Rule type" />
	                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="investor-type">Investor type</SelectItem>
                        <SelectItem value="investor-jurisdiction">Investor jurisdiction</SelectItem>
                        <SelectItem value="risk-test-level">Risk test level</SelectItem>
                      </SelectContent>
	                    </Select>
	                    <Select value={rule.condition} disabled>
	                      <SelectTrigger aria-label={`Investor rule ${index + 1} condition`}>
	                        <SelectValue placeholder="Condition" />
	                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Must be">Must be</SelectItem>
                        <SelectItem value="Must be at least">Must be at least</SelectItem>
                      </SelectContent>
	                    </Select>
	                    <Input
	                      aria-label={`Investor rule ${index + 1} value`}
	                      value={rule.value}
	                      onChange={(event) => {
                        const next = [...investorRules];
                        next[index].value = event.target.value;
                        setInvestorRules(next);
                      }}
                      placeholder={getInvestorRulePlaceholder(rule.ruleType)}
	                    />
	                  </div>
	                  <Button
	                    aria-label={`Remove investor rule ${index + 1}`}
	                    variant="outline"
	                    size="icon"
	                    onClick={() => removeInvestorRule(index)}
	                  >
	                    <X className="w-4 h-4" />
	                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addInvestorRule} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Rule
              </Button>
            </div>
            </FormSection>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentTab("about-token")}>
              Previous
            </Button>
            <Button onClick={handleNext}>Next</Button>
          </div>
        </TabsContent>

        <TabsContent value="fund-documents" className="space-y-6">
          <div className="space-y-5">
            <FormSection
              title="Service Providers"
              description="Record providers supporting administration and asset custody."
            >
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fund-administrator">Fund administrator</Label>
                <Input id="fund-administrator" placeholder="Enter fund administrator name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fund-custodian">Custodian of fund assets</Label>
                <Input id="fund-custodian" placeholder="Enter custodian name" />
              </div>
            </div>
            </FormSection>

            <FormSection
              title="Uploads"
              description="Attach offering documents and supporting evidence for the fund file."
            >
            <div className="space-y-2">
              <Label id="offering-document-upload-label">Upload: Fund offering document / Prospectus</Label>
              <div
                aria-labelledby="offering-document-upload-label"
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                role="button"
                tabIndex={0}
              >
                <FileText className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground">PDF (max. 500MB)</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label id="supporting-documents-upload-label">Upload: Other supporting documents</Label>
              <div
                aria-labelledby="supporting-documents-upload-label"
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                role="button"
                tabIndex={0}
              >
                <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground">JPG, PNG, GIF, PDF (max. 500MB per file)</p>
              </div>
            </div>
            </FormSection>
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
