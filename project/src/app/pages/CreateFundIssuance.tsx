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
import { FundIssuance } from "../data/fundDemoData";

function formatDate(date?: Date) {
  return date ? format(date, "yyyy-MM-dd HH:mm:ss") : "";
}

function formatAmount(value: number, currency: string) {
  return `${new Intl.NumberFormat("en-US").format(value)} ${currency}`;
}

function formatNav(value: number, currency: string) {
  return `${value.toFixed(4)} ${currency}`;
}

export function CreateFundIssuance() {
  const navigate = useNavigate();
  const { addFundIssuance } = useApp();

  const [currentTab, setCurrentTab] = useState("about-deal");

  const [fundName, setFundName] = useState("");
  const [fundDescription, setFundDescription] = useState("");
  const [fundType, setFundType] = useState<"open-end" | "closed-end">("open-end");
  const [dealSizeUnit, setDealSizeUnit] = useState("HKD");
  const [targetFundSize, setTargetFundSize] = useState("10000000");
  const [minSubscriptionAmount, setMinSubscriptionAmount] = useState("10000");
  const [maxSubscriptionAmount, setMaxSubscriptionAmount] = useState("5000000");
  const [initialNav, setInitialNav] = useState("1");
  const [managementFee, setManagementFee] = useState("0.8");
  const [performanceFee, setPerformanceFee] = useState("");
  const [investmentStrategy, setInvestmentStrategy] = useState("");
  const [fundManager, setFundManager] = useState("");
  const [issueDate, setIssueDate] = useState<Date>();
  const [maturityDate, setMaturityDate] = useState<Date>();

  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
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
      "dealing-rules",
      "fund-documents",
      "fee-charge",
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

    const targetValue = Number(targetFundSize) || 0;
    const minSubValue = Number(minSubscriptionAmount) || 0;
    const maxSubValue = Number(maxSubscriptionAmount) || 0;
    const navValue = Number(initialNav) || 1;
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
      name: fundName || "New Open-end Fund",
      status: "Draft",
      description:
        fundDescription ||
        "Open-end fund draft with dealing and settlement rules pending activation.",
      assetType: "Fund",
      allocationStatus: openEndMode ? "N/A" : "Upcoming",
      createdTime,
      tokenName: tokenName || `${fundName || "NEW-FUND"} TOKEN`,
      tokenAddress: "–",
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
      navHistory: [
        {
          id: `nav-${newFundId}-1`,
          navDate: format(now, "yyyy-MM-dd"),
          navValue,
          currency: dealSizeUnit,
          updatedAt: createdTime,
          note: "Draft creation NAV reference",
        },
      ],
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
          title="发行主流程"
          steps={[
            { label: "Listing Fund", description: "Create & submit" },
            { label: "Subscription", description: "Investor deposits" },
            { label: "Allocation", description: "Distribute shares" },
            { label: "Issuance", description: "Accept funds" },
            { label: "Active", description: "Fund operating" },
          ]}
        />
        {openEndMode && (
          <p className="text-sm text-muted-foreground mt-3">
            Open-end 提示：基金上线后支持持续申赎，相关 dealing 参数请在 “Subscription & Rules” 步骤中配置。
          </p>
        )}
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-8">
        <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-secondary">
          <TabsTrigger value="about-deal" className="text-sm py-3">
            About Deal
          </TabsTrigger>
          <TabsTrigger value="about-token" className="text-sm py-3">
            About Token
          </TabsTrigger>
          <TabsTrigger value="dealing-rules" className="text-sm py-3">
            Subscription &amp; Rules
          </TabsTrigger>
          <TabsTrigger value="fund-documents" className="text-sm py-3">
            Fund Documents
          </TabsTrigger>
          <TabsTrigger value="fee-charge" className="text-sm py-3">
            Fee Charge
          </TabsTrigger>
        </TabsList>

        <TabsContent value="about-deal" className="space-y-6">
          <InfoAlert variant="info" title="Fund Details">
            When the fund type is set to <strong>Open-end</strong>, this form switches to an operating model focused on ongoing dealing, daily NAV processing, and T+1 settlement.
          </InfoAlert>

          <div className="bg-white border rounded-lg p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Fund name</Label>
                <Input value={fundName} onChange={(event) => setFundName(event.target.value)} placeholder="Daily Liquidity Fund" />
              </div>
              <div className="space-y-2">
                <Label>Fund type</Label>
                <Select value={fundType} onValueChange={(value) => setFundType(value as "open-end" | "closed-end")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fund type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open-end">Open-end</SelectItem>
                    <SelectItem value="closed-end">Closed-end</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <div className="font-medium">Is token tradable on secondary market</div>
                <div className="text-sm text-muted-foreground mt-1">
                  For the demo we keep open-end funds non-tradable by default and focus on daily dealing.
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

        <TabsContent value="dealing-rules" className="space-y-6">
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

            {openEndMode && (
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
                        setInvestorRules(next);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Rule type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="investor-type">Investor type</SelectItem>
                        <SelectItem value="investor-jurisdiction">Investor jurisdiction</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value="must-be" disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="Condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="must-be">Must be</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={rule.value}
                      onChange={(event) => {
                        const next = [...investorRules];
                        next[index].value = event.target.value;
                        setInvestorRules(next);
                      }}
                      placeholder="Institutional / HK / Qualified investor"
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
            <Button variant="outline" onClick={() => setCurrentTab("dealing-rules")}>
              Previous
            </Button>
            <Button onClick={handleNext}>Next</Button>
          </div>
        </TabsContent>

        <TabsContent value="fee-charge" className="space-y-6">
          <div className="bg-white border rounded-lg p-6 space-y-4">
            <div className="rounded-lg border border-[var(--navy-100)] bg-[var(--navy-50)] p-4">
              <h3 className="font-medium" style={{ fontFamily: "var(--font-heading)" }}>
                Fee Charge (Read-only)
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Commission follows platform onboarding terms and is charged on successful subscription settlement only.
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Commission:</span> 0.25% of settled subscription amount per order, billed monthly.
              </p>
              <p>
                <span className="font-medium">Included service:</span> Issuance workflow tooling, investor onboarding checks, and order record support.
              </p>
              <p>
                <span className="font-medium">Contact:</span> rwa-service@webank.com · +852 3158 8866
              </p>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentTab("fund-documents")}>
              Previous
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
