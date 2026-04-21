import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  ArrowRightLeft,
  ChevronRight,
  Clock3,
  Copy,
  LineChart,
  PauseCircle,
  PlayCircle,
  RefreshCcw,
  Send,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { InfoAlert } from "../components/InfoAlert";
import { MetricCard } from "../components/MetricCard";
import { StatusBadge } from "../components/StatusBadge";
import { FundIssuanceWorkflow } from "../components/FundIssuanceWorkflow";
import { RedeemModal, SubscribeModal } from "../components/modals/InvestorModals";
import { OperationActionModal } from "../components/modals/OperationActionModal";
import { useApp } from "../context/AppContext";
import { FundIssuance, FundOrder } from "../data/fundDemoData";

function formatNumber(value: number, digits = 2) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value);
}

function nowString() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

type EditableSection = "deal" | "token" | "operations";

interface FundEditFormState {
  name: string;
  description: string;
  fundManager: string;
  issuerEntity: string;
  fundJurisdiction: string;
  shareClass: string;
  assetCurrency: string;
  targetFundSizeValue: string;
  minSubscriptionAmountValue: string;
  maxSubscriptionAmountValue: string;
  initialNavValue: string;
  managementFee: string;
  performanceFee: string;
  investmentStrategy: string;
  issueDate: string;
  maturityDate: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  allocationRule: string;
  tokenName: string;
  tokenSymbol: string;
  tokenStandard: string;
  tokenDecimals: string;
  isinCode: string;
  unitPerToken: string;
  whitelistRequired: boolean;
  mintingRule: string;
  tradable: boolean;
  dealingFrequency: string;
  dealingCutoffTime: string;
  navValuationTime: string;
  settlementCycle: string;
  subscriptionStatus: "Open" | "Paused";
  redemptionStatus: "Open" | "Paused";
  noticePeriodDays: string;
  maxRedemptionPerInvestor: string;
  fundLevelRedemptionGate: string;
  orderConfirmationMethod: string;
}

function formatAmount(value: number, currency: string) {
  return `${new Intl.NumberFormat("en-US").format(value)} ${currency}`;
}

function formatNav(value: number, currency: string) {
  return `${value.toFixed(4)} ${currency}`;
}

function parsePercentage(value: string) {
  return value.replace("% p.a.", "").replace("%", "").replace("N/A", "").trim();
}

function parseNumericPrefix(value?: string) {
  const match = value?.match(/[\d.]+/);
  return match?.[0] ?? "";
}

function toDateTimeLocal(value?: string | null) {
  return value ? value.slice(0, 16).replace(" ", "T") : "";
}

function fromDateTimeLocal(value: string) {
  return value ? `${value.replace("T", " ")}:00` : "";
}

function parseBooleanLabel(value?: string) {
  return value === "Yes";
}

function extractTimeValue(value?: string) {
  return value?.slice(0, 5) || "";
}

function parseMintingRule(value?: string) {
  return value === "Pre-minted treasury inventory" ? "pre-minted" : "mint-burn";
}

function parseOrderConfirmationMethod(value?: string) {
  return value === "Issuer review then confirm" ? "manual" : "auto";
}

function buildFundEditFormState(fund: FundIssuance): FundEditFormState {
  return {
    name: fund.name,
    description: fund.description,
    fundManager: fund.fundManager,
    issuerEntity: fund.issuerEntity || "",
    fundJurisdiction: fund.fundJurisdiction || "",
    shareClass: fund.shareClass || "",
    assetCurrency: fund.assetCurrency,
    targetFundSizeValue: String(fund.targetFundSizeValue || 0),
    minSubscriptionAmountValue: String(fund.minSubscriptionAmountValue || 0),
    maxSubscriptionAmountValue: String(fund.maxSubscriptionAmountValue || 0),
    initialNavValue: String(fund.initialNavValue || 0),
    managementFee: parsePercentage(fund.managementFee),
    performanceFee: parsePercentage(fund.performanceFee),
    investmentStrategy: fund.investmentStrategy,
    issueDate: toDateTimeLocal(fund.issueDate),
    maturityDate: toDateTimeLocal(fund.maturityDate),
    subscriptionStartDate: toDateTimeLocal(fund.subscriptionStartDate),
    subscriptionEndDate: toDateTimeLocal(fund.subscriptionEndDate),
    allocationRule:
      fund.allocationRule === "First-come-first-served"
        ? "first-come-first-served"
        : "pro-rata",
    tokenName: fund.tokenName,
    tokenSymbol: fund.tokenSymbol || "",
    tokenStandard: fund.tokenStandard || "ERC-3643",
    tokenDecimals: String(fund.tokenDecimals ?? 18),
    isinCode: fund.isinCode || "",
    unitPerToken: fund.unitPerToken || "1 fund unit",
    whitelistRequired: parseBooleanLabel(fund.whitelistRequired),
    mintingRule: parseMintingRule(fund.mintingRule),
    tradable: parseBooleanLabel(fund.tradable),
    dealingFrequency: (fund.dealingFrequency || "Daily").toLowerCase(),
    dealingCutoffTime: extractTimeValue(fund.dealingCutoffTime),
    navValuationTime: extractTimeValue(fund.navValuationTime),
    settlementCycle: fund.settlementCycle || "T+1",
    subscriptionStatus: fund.subscriptionStatus || "Open",
    redemptionStatus: fund.redemptionStatus || "Open",
    noticePeriodDays: String(fund.noticePeriodDays ?? 0),
    maxRedemptionPerInvestor: parseNumericPrefix(fund.maxRedemptionPerInvestor),
    fundLevelRedemptionGate: parseNumericPrefix(fund.fundLevelRedemptionGate),
    orderConfirmationMethod: parseOrderConfirmationMethod(fund.orderConfirmationMethod),
  };
}

function getEditableSections(fund: FundIssuance): EditableSection[] {
  if (fund.fundType === "Open-end") {
    if (["Draft", "Pending Approval", "Pending Listing", "Upcoming Launch"].includes(fund.status)) {
      return ["deal", "token", "operations"];
    }
    if (["Initial Subscription", "Active Dealing", "Paused"].includes(fund.status)) {
      return ["operations"];
    }
    return [];
  }

  if (["Draft", "Pending Approval", "Pending Listing", "Upcoming"].includes(fund.status)) {
    return ["deal", "token", "operations"];
  }
  if (fund.status === "Open For Subscription") {
    return ["operations"];
  }
  return [];
}

function getEditingPolicyMessage(fund: FundIssuance) {
  const editableSections = getEditableSections(fund);
  if (editableSections.length === 0) {
    return fund.fundType === "Open-end"
      ? "This stage is locked. Once the fund is beyond launch operations, fund setup fields become read-only."
      : "This stage is locked. Once allocation begins, issuance setup fields become read-only.";
  }

  if (editableSections.length === 3) {
    return "Current stage allows full setup edits across deal terms, token setup, and operating rules.";
  }

  return fund.fundType === "Open-end"
    ? "Current stage only allows operating-rule updates. Deal terms and token setup are locked."
    : "Current stage only allows issuance-rule updates. Core deal terms and token setup are locked.";
}

function getIssuerPermissionAction(label: string) {
  const normalized = label.trim().toLowerCase();
  if (normalized.includes("submit")) return "submit";
  if (normalized.includes("approve")) return "approve";
  if (normalized.includes("list")) return "list";
  if (normalized.includes("open")) return "open";
  if (normalized.includes("resume")) return "open";
  if (normalized.includes("pause")) return "pause";
  if (normalized.includes("allocate on chain")) return "put_on_chain";
  return "manage";
}

function formatRuleType(ruleType: string) {
  switch (ruleType) {
    case "investor-type":
      return "Investor type";
    case "investor-jurisdiction":
      return "Investor jurisdiction";
    case "risk-test-level":
      return "Risk test level";
    default:
      return ruleType || "Rule";
  }
}

function parseLeadingNumber(value: string) {
  const normalized = value.replace(/,/g, "");
  const match = normalized.match(/[\d.]+/);
  return match ? Number(match[0]) : 0;
}

function getInvestorCategory(order: FundOrder) {
  if (order.investorName.toLowerCase().includes("family office")) return "Family Office";
  if (order.investorName.toLowerCase().includes("institutional")) return "Institutional";
  if (order.investorName.toLowerCase().includes("qualified")) return "Qualified Investor";
  if (order.investorName.toLowerCase().includes("treasury")) return "Treasury";
  return "Professional Investor";
}

function buildBuyerSummary(orders: FundOrder[]) {
  const buyers = new Map<
    string,
    {
      investorId: string;
      investorName: string;
      investorWallet: string;
      category: string;
      orderCount: number;
      totalRequestedAmount: number;
      totalRequestedUnits: number;
      latestStatus: string;
    }
  >();

  orders.forEach((order) => {
    const existing = buyers.get(order.investorId) || {
      investorId: order.investorId,
      investorName: order.investorName,
      investorWallet: order.investorWallet,
      category: getInvestorCategory(order),
      orderCount: 0,
      totalRequestedAmount: 0,
      totalRequestedUnits: 0,
      latestStatus: order.status,
    };

    existing.orderCount += 1;
    existing.totalRequestedAmount += parseLeadingNumber(order.requestAmount);
    existing.totalRequestedUnits += parseLeadingNumber(order.requestQuantity);
    existing.latestStatus = order.status;
    buyers.set(order.investorId, existing);
  });

  return Array.from(buyers.values());
}

function buildAllocationPreview(
  orders: FundOrder[],
  fundData: FundIssuance,
) {
  const subscriptionOrders = orders.filter((order) => order.type === "subscription");
  const totalRequestedAmount = subscriptionOrders.reduce(
    (sum, order) => sum + parseLeadingNumber(order.requestAmount),
    0,
  );
  const targetSize = fundData.targetFundSizeValue || 0;
  const proRataRatio =
    totalRequestedAmount > 0 ? Math.min(1, targetSize / totalRequestedAmount) : 1;

  let remainingAmount = targetSize;
  const sortedOrders = [...subscriptionOrders].sort((left, right) =>
    left.submitTime.localeCompare(right.submitTime),
  );

  const rows = sortedOrders.map((order) => {
    const requestedAmount = parseLeadingNumber(order.requestAmount);
    const requestedUnits = parseLeadingNumber(order.requestQuantity);
    const allocatedAmount =
      fundData.allocationRule === "First-come-first-served"
        ? Math.max(Math.min(requestedAmount, remainingAmount), 0)
        : requestedAmount * proRataRatio;

    if (fundData.allocationRule === "First-come-first-served") {
      remainingAmount = Math.max(remainingAmount - allocatedAmount, 0);
    }

    const allocatedUnits =
      requestedAmount > 0 ? (requestedUnits * allocatedAmount) / requestedAmount : 0;

    return {
      ...order,
      buyerCategory: getInvestorCategory(order),
      requestedAmount,
      requestedUnits,
      allocatedAmount,
      allocatedUnits,
      shareClass: fundData.shareClass || "Class A",
      allocationRatio: requestedAmount > 0 ? allocatedAmount / requestedAmount : 0,
    };
  });

  const categoryBreakdown = Array.from(
    rows.reduce((map, row) => {
      const current = map.get(row.buyerCategory) || {
        category: row.buyerCategory,
        investorCount: 0,
        allocatedAmount: 0,
        allocatedUnits: 0,
      };
      current.investorCount += 1;
      current.allocatedAmount += row.allocatedAmount;
      current.allocatedUnits += row.allocatedUnits;
      map.set(row.buyerCategory, current);
      return map;
    }, new Map<string, { category: string; investorCount: number; allocatedAmount: number; allocatedUnits: number }>()),
  ).map(([, value]) => value);

  return {
    totalRequestedAmount,
    totalAllocatedAmount: rows.reduce((sum, row) => sum + row.allocatedAmount, 0),
    rows,
    categoryBreakdown,
    proRataRatio,
  };
}

function renderBuyerTable(
  orders: FundOrder[],
  currency: string,
) {
  const buyers = buildBuyerSummary(orders);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Buyer</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Order Count</TableHead>
          <TableHead>Total Requested</TableHead>
          <TableHead>Requested Units</TableHead>
          <TableHead>Latest Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {buyers.map((buyer) => (
          <TableRow key={buyer.investorId}>
            <TableCell>
              <div className="font-medium">{buyer.investorName}</div>
              <div className="max-w-[220px] truncate text-xs text-muted-foreground">
                {buyer.investorWallet}
              </div>
            </TableCell>
            <TableCell>{buyer.category}</TableCell>
            <TableCell>{buyer.orderCount}</TableCell>
            <TableCell>{formatNumber(buyer.totalRequestedAmount, 2)} {currency}</TableCell>
            <TableCell>{formatNumber(buyer.totalRequestedUnits, 2)} units</TableCell>
            <TableCell>
              <StatusBadge status={buyer.latestStatus} />
            </TableCell>
          </TableRow>
        ))}
        {buyers.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
              No buyers yet.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

function OpenEndDealingCycleCard({ fundData }: { fundData: FundIssuance }) {
  const operatingState =
    fundData.status === "Paused"
      ? "Paused"
      : fundData.status === "Active Dealing"
        ? "Live"
        : fundData.status === "Initial Subscription"
          ? "Pending activation"
          : "Pre-live";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recurring Dealing Cycle</CardTitle>
        <p className="text-sm text-muted-foreground">
          Once the fund enters active dealing, subscriptions and redemptions repeat through this
          operating cycle. These checkpoints are recurring operations, not extra fund lifecycle
          steps.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Operating State</div>
            <div className="mt-1 font-medium">{operatingState}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Fund lifecycle stays at Active Dealing while cycles repeat.
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Cut-off</div>
            <div className="mt-1 font-medium">
              {fundData.nextCutoffTime || fundData.dealingCutoffTime || "Configured in dealing rules"}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Orders received before cut-off join the current batch.
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">NAV Confirmation</div>
            <div className="mt-1 font-medium">
              {fundData.nextConfirmationDate || fundData.navValuationTime || "At valuation time"}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Official pricing finalizes subscription and redemption quantities.
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Settlement</div>
            <div className="mt-1 font-medium">
              {fundData.nextSettlementTime || fundData.settlementCycle || "Per settlement cycle"}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Cash and units are booked after confirmation.
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Subscription Module</div>
            <div className="mt-1 font-medium">{fundData.subscriptionStatus || "N/A"}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Redemption Module</div>
            <div className="mt-1 font-medium">{fundData.redemptionStatus || "N/A"}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Order Confirmation</div>
            <div className="mt-1 font-medium">
              {fundData.orderConfirmationMethod || "Configured in operations"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FundSetupEditor({
  fundData,
  onSave,
  onCancel,
}: {
  fundData: FundIssuance;
  onSave: (updates: Partial<FundIssuance>) => void;
  onCancel: () => void;
}) {
  const editableSections = getEditableSections(fundData);
  const [form, setForm] = useState<FundEditFormState>(() => buildFundEditFormState(fundData));

  useEffect(() => {
    setForm(buildFundEditFormState(fundData));
  }, [fundData]);

  const canEditDeal = editableSections.includes("deal");
  const canEditToken = editableSections.includes("token");
  const canEditOperations = editableSections.includes("operations");

  const setField = <K extends keyof FundEditFormState,>(
    key: K,
    value: FundEditFormState[K],
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const handleSave = () => {
    const targetFundSizeValue = Number(form.targetFundSizeValue) || 0;
    const minSubscriptionAmountValue = Number(form.minSubscriptionAmountValue) || 0;
    const maxSubscriptionAmountValue = Number(form.maxSubscriptionAmountValue) || 0;
    const initialNavValue = Number(form.initialNavValue) || 0;
    const previousInitialNavValue = fundData.initialNavValue;
    const nextCurrentNavValue =
      fundData.currentNavValue === previousInitialNavValue ? initialNavValue : fundData.currentNavValue;
    const updates: Partial<FundIssuance> = {
      name: form.name.trim() || fundData.name,
      description: form.description.trim() || fundData.description,
      fundManager: form.fundManager.trim() || fundData.fundManager,
      issuerEntity: form.issuerEntity.trim() || undefined,
      fundJurisdiction: form.fundJurisdiction.trim() || undefined,
      shareClass: form.shareClass.trim() || undefined,
      assetCurrency: form.assetCurrency,
      targetFundSizeValue,
      targetFundSize: formatAmount(targetFundSizeValue, form.assetCurrency),
      minSubscriptionAmountValue,
      minSubscriptionAmount: formatAmount(minSubscriptionAmountValue, form.assetCurrency),
      maxSubscriptionAmountValue,
      maxSubscriptionAmount: formatAmount(maxSubscriptionAmountValue, form.assetCurrency),
      initialNavValue,
      initialNav: formatNav(initialNavValue, form.assetCurrency),
      currentNavValue: nextCurrentNavValue,
      currentNav: formatNav(nextCurrentNavValue, form.assetCurrency),
      navCurrency: form.assetCurrency,
      managementFee: `${form.managementFee || "0"}% p.a.`,
      performanceFee: form.performanceFee ? `${form.performanceFee}%` : "N/A",
      investmentStrategy: form.investmentStrategy.trim() || fundData.investmentStrategy,
      issueDate: fromDateTimeLocal(form.issueDate),
      maturityDate: fundData.fundType === "Closed-end" ? fromDateTimeLocal(form.maturityDate) || null : null,
      subscriptionStartDate: fromDateTimeLocal(form.subscriptionStartDate),
      subscriptionEndDate: fromDateTimeLocal(form.subscriptionEndDate),
      allocationRule:
        form.allocationRule === "first-come-first-served"
          ? "First-come-first-served"
          : "Pro-rata",
      tokenName: form.tokenName.trim() || fundData.tokenName,
      tokenSymbol: form.tokenSymbol.trim().toUpperCase() || undefined,
      tokenStandard: form.tokenStandard,
      tokenDecimals: Math.max(Number(form.tokenDecimals) || 0, 0),
      isinCode: form.isinCode.trim() || undefined,
      unitPerToken: form.unitPerToken.trim() || undefined,
      whitelistRequired: form.whitelistRequired ? "Yes" : "No",
      mintingRule:
        form.mintingRule === "pre-minted"
          ? "Pre-minted treasury inventory"
          : "Mint and burn on subscription / redemption",
      tradable: form.tradable ? "Yes" : "No",
      dealingFrequency: fundData.fundType === "Open-end"
        ? form.dealingFrequency.charAt(0).toUpperCase() + form.dealingFrequency.slice(1)
        : fundData.dealingFrequency,
      redemptionFrequency: fundData.fundType === "Open-end"
        ? form.dealingFrequency.charAt(0).toUpperCase() + form.dealingFrequency.slice(1)
        : fundData.redemptionFrequency,
      dealingCutoffTime: form.dealingCutoffTime ? `${form.dealingCutoffTime} HKT` : undefined,
      navValuationTime: form.navValuationTime ? `${form.navValuationTime} HKT` : undefined,
      settlementCycle: form.settlementCycle,
      subscriptionStatus: form.subscriptionStatus,
      redemptionStatus: form.redemptionStatus,
      noticePeriodDays: Number(form.noticePeriodDays) || 0,
      maxRedemptionPerInvestor: form.maxRedemptionPerInvestor
        ? `${form.maxRedemptionPerInvestor} units / dealing cycle`
        : undefined,
      fundLevelRedemptionGate: form.fundLevelRedemptionGate
        ? `${form.fundLevelRedemptionGate}% of fund NAV`
        : undefined,
      orderConfirmationMethod:
        form.orderConfirmationMethod === "manual"
          ? "Issuer review then confirm"
          : "Auto at cut-off",
    };

    onSave(updates);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Mode</CardTitle>
        <p className="text-sm text-muted-foreground">{getEditingPolicyMessage(fundData)}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-6">
          {canEditDeal && (
            <div className="space-y-4 rounded-lg border p-4">
              <div>
                <h3 className="font-medium">Deal Terms</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Core fund identity, economics, and initial issuance parameters.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Fund name</Label>
                  <Input value={form.name} onChange={(event) => setField("name", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Asset currency</Label>
                  <Select value={form.assetCurrency} onValueChange={(value) => setField("assetCurrency", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HKD">HKD</SelectItem>
                      <SelectItem value="USDC">USDC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fund description</Label>
                <Textarea value={form.description} onChange={(event) => setField("description", event.target.value)} rows={3} />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Fund manager</Label>
                  <Input value={form.fundManager} onChange={(event) => setField("fundManager", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Issuer entity</Label>
                  <Input value={form.issuerEntity} onChange={(event) => setField("issuerEntity", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Fund jurisdiction</Label>
                  <Input value={form.fundJurisdiction} onChange={(event) => setField("fundJurisdiction", event.target.value)} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Share class</Label>
                  <Input value={form.shareClass} onChange={(event) => setField("shareClass", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Target fund size</Label>
                  <Input type="number" value={form.targetFundSizeValue} onChange={(event) => setField("targetFundSizeValue", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Initial NAV</Label>
                  <Input type="number" step="0.0001" value={form.initialNavValue} onChange={(event) => setField("initialNavValue", event.target.value)} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Minimum subscription amount</Label>
                  <Input type="number" value={form.minSubscriptionAmountValue} onChange={(event) => setField("minSubscriptionAmountValue", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Maximum subscription amount</Label>
                  <Input type="number" value={form.maxSubscriptionAmountValue} onChange={(event) => setField("maxSubscriptionAmountValue", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Allocation rule</Label>
                  <Select value={form.allocationRule} onValueChange={(value) => setField("allocationRule", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pro-rata">Pro-rata</SelectItem>
                      <SelectItem value="first-come-first-served">First-come-first-served</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Management fee (%)</Label>
                  <Input type="number" step="0.01" value={form.managementFee} onChange={(event) => setField("managementFee", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Performance fee (%)</Label>
                  <Input type="number" step="0.01" value={form.performanceFee} onChange={(event) => setField("performanceFee", event.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Investment strategy</Label>
                <Textarea value={form.investmentStrategy} onChange={(event) => setField("investmentStrategy", event.target.value)} rows={4} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Issue date</Label>
                  <Input type="datetime-local" value={form.issueDate} onChange={(event) => setField("issueDate", event.target.value)} />
                </div>
                {fundData.fundType === "Closed-end" && (
                  <div className="space-y-2">
                    <Label>Maturity date</Label>
                    <Input type="datetime-local" value={form.maturityDate} onChange={(event) => setField("maturityDate", event.target.value)} />
                  </div>
                )}
              </div>
            </div>
          )}

          {canEditToken && (
            <div className="space-y-4 rounded-lg border p-4">
              <div>
                <h3 className="font-medium">Token Setup</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Token metadata and transfer-control configuration.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Token name</Label>
                  <Input value={form.tokenName} onChange={(event) => setField("tokenName", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Token symbol</Label>
                  <Input value={form.tokenSymbol} maxLength={15} onChange={(event) => setField("tokenSymbol", event.target.value)} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Token standard</Label>
                  <Select value={form.tokenStandard} onValueChange={(value) => setField("tokenStandard", value)}>
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
                  <Input type="number" min="0" max="18" value={form.tokenDecimals} onChange={(event) => setField("tokenDecimals", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>ISIN / security code</Label>
                  <Input value={form.isinCode} onChange={(event) => setField("isinCode", event.target.value)} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>1 token represents</Label>
                  <Input value={form.unitPerToken} onChange={(event) => setField("unitPerToken", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Minting rule</Label>
                  <Select value={form.mintingRule} onValueChange={(value) => setField("mintingRule", value)}>
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

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <div className="font-medium">Whitelist required</div>
                  </div>
                  <Switch checked={form.whitelistRequired} onCheckedChange={(value) => setField("whitelistRequired", value)} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <div className="font-medium">Tradable on secondary market</div>
                  </div>
                  <Switch checked={form.tradable} onCheckedChange={(value) => setField("tradable", value)} />
                </div>
              </div>
            </div>
          )}

          {canEditOperations && (
            <div className="space-y-4 rounded-lg border p-4">
              <div>
                <h3 className="font-medium">
                  {fundData.fundType === "Open-end" ? "Operating Rules" : "Issuance Rules"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {fundData.fundType === "Open-end"
                    ? "These fields remain adjustable during launch and operating stages."
                    : "These fields remain adjustable until allocation begins."}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Subscription start</Label>
                  <Input type="datetime-local" value={form.subscriptionStartDate} onChange={(event) => setField("subscriptionStartDate", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Subscription end</Label>
                  <Input type="datetime-local" value={form.subscriptionEndDate} onChange={(event) => setField("subscriptionEndDate", event.target.value)} />
                </div>
              </div>

              {fundData.fundType === "Open-end" ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Dealing frequency</Label>
                      <Select value={form.dealingFrequency} onValueChange={(value) => setField("dealingFrequency", value)}>
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
                      <Select value={form.settlementCycle} onValueChange={(value) => setField("settlementCycle", value)}>
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

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Dealing cut-off time</Label>
                      <Input type="time" value={form.dealingCutoffTime} onChange={(event) => setField("dealingCutoffTime", event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>NAV valuation time</Label>
                      <Input type="time" value={form.navValuationTime} onChange={(event) => setField("navValuationTime", event.target.value)} />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Notice period (days)</Label>
                      <Input type="number" value={form.noticePeriodDays} onChange={(event) => setField("noticePeriodDays", event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Order confirmation method</Label>
                      <Select value={form.orderConfirmationMethod} onValueChange={(value) => setField("orderConfirmationMethod", value)}>
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

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Max redemption per investor</Label>
                      <Input type="number" value={form.maxRedemptionPerInvestor} onChange={(event) => setField("maxRedemptionPerInvestor", event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Fund-level redemption gate (%)</Label>
                      <Input type="number" value={form.fundLevelRedemptionGate} onChange={(event) => setField("fundLevelRedemptionGate", event.target.value)} />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Subscription status</Label>
                      <Select value={form.subscriptionStatus} onValueChange={(value) => setField("subscriptionStatus", value as "Open" | "Paused")}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Open">Open</SelectItem>
                          <SelectItem value="Paused">Paused</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Redemption status</Label>
                      <Select value={form.redemptionStatus} onValueChange={(value) => setField("redemptionStatus", value as "Open" | "Paused")}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Open">Open</SelectItem>
                          <SelectItem value="Paused">Paused</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label>Allocation rule</Label>
                  <Select value={form.allocationRule} onValueChange={(value) => setField("allocationRule", value)}>
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
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function getNextOrderAction(order: FundOrder) {
  switch (order.status) {
    case "Submitted":
      return { label: "Queue for NAV", nextStatus: "Pending NAV" as const };
    case "Pending Review":
      return { label: "Approve", nextStatus: "Pending NAV" as const };
    case "Pending NAV":
      return {
        label:
          order.type === "subscription"
            ? "Confirm shares"
            : "Move to cash settle",
        nextStatus:
          order.type === "subscription"
            ? ("Confirmed" as const)
            : ("Pending Cash Settlement" as const),
      };
    case "Pending Cash Settlement":
      return { label: "Settle cash", nextStatus: "Completed" as const };
    case "Pending Confirmation":
      return { label: "Confirm", nextStatus: "Confirmed" as const };
    default:
      return null;
  }
}

function buildActionFlow({
  reviewTitle,
  reviewDescription,
  identityDescription,
  actionLabel,
  actionTitle,
  actionDescription,
  executionLabel,
  executionTitle,
  executionDescription,
  successTitle,
  successDescription,
}: {
  reviewTitle: string;
  reviewDescription: string;
  identityDescription: string;
  actionLabel: string;
  actionTitle: string;
  actionDescription: string;
  executionLabel?: string;
  executionTitle?: string;
  executionDescription?: string;
  successTitle: string;
  successDescription: string;
}) {
  const steps = [
    {
      label: "Review",
      title: reviewTitle,
      description: reviewDescription,
      state: "review" as const,
    },
    {
      label: "Identity",
      title: "Verify Identity",
      description: identityDescription,
      state: "loading" as const,
    },
    {
      label: actionLabel,
      title: actionTitle,
      description: actionDescription,
      state: "loading" as const,
    },
  ];

  if (executionLabel && executionTitle && executionDescription) {
    steps.push({
      label: executionLabel,
      title: executionTitle,
      description: executionDescription,
      state: "loading" as const,
    });
  }

  steps.push({
    label: "Completed",
    title: successTitle,
    description: successDescription,
    state: "success" as const,
  });

  return steps;
}

function getFundAction(fund: FundIssuance) {
  if (fund.fundType === "Open-end") {
    switch (fund.status) {
      case "Draft":
        return {
          label: "Submit for Approval",
          nextStatus: "Pending Approval",
          message: "Open-end fund draft submitted for approval",
          icon: Send,
          variant: "default" as const,
          modalTitle: "Submit Open-end Fund For Approval",
          modalDescription:
            "Review the open-end fund draft, verify issuer identity, and submit the issuance request for approval.",
          modalSteps: buildActionFlow({
            reviewTitle: "Review Draft Submission",
            reviewDescription:
              "Confirm the open-end fund draft, dealing rules, and launch configuration before submission.",
            identityDescription:
              "Issuer identity, compliance permissions, and wallet authority are being verified.",
            actionLabel: "Submit",
            actionTitle: "Submit Approval Request",
            actionDescription:
              "The approval request is being recorded in the fund issuance workflow.",
            successTitle: "Open-end fund submitted",
            successDescription:
              "The open-end fund draft is now waiting for approval review.",
          }),
        };
      case "Pending Approval":
        return {
          label: "Approve Launch",
          nextStatus: "Upcoming Launch",
          message: "Approval completed. Fund is queued for launch",
          icon: ShieldCheck,
          variant: "default" as const,
          modalTitle: "Approve Open-end Launch",
          modalDescription:
            "Verify the approver identity and release the fund into the launch preparation stage.",
          modalSteps: buildActionFlow({
            reviewTitle: "Review Approval Decision",
            reviewDescription:
              "Confirm the fund is ready to move from approval review into launch preparation.",
            identityDescription:
              "Approver identity and issuer authorization are being verified.",
            actionLabel: "Approve",
            actionTitle: "Approve Launch",
            actionDescription:
              "The approval signature is being recorded for the fund launch decision.",
            successTitle: "Launch approved",
            successDescription:
              "The fund has moved into the upcoming launch stage.",
          }),
        };
      case "Upcoming Launch":
        return {
          label: "Open Initial Subscription",
          nextStatus: "Initial Subscription",
          message: "Initial subscription window is now open",
          icon: PlayCircle,
          variant: "default" as const,
          modalTitle: "Open Initial Subscription",
          modalDescription:
            "Verify issuer identity and activate the initial subscription window for the open-end fund.",
          modalSteps: buildActionFlow({
            reviewTitle: "Review Subscription Opening",
            reviewDescription:
              "Confirm the launch window, subscription terms, and investor access before opening.",
            identityDescription:
              "Issuer identity and subscription-opening authority are being verified.",
            actionLabel: "Sign",
            actionTitle: "Sign Opening Request",
            actionDescription:
              "The initial subscription opening request is being signed and submitted.",
            successTitle: "Initial subscription opened",
            successDescription:
              "Investors can now enter the initial subscription stage.",
          }),
        };
      case "Initial Subscription":
        return {
          label: "Activate Daily Dealing",
          nextStatus: "Active Dealing",
          message: "Fund moved into active daily dealing mode",
          icon: PlayCircle,
          variant: "default" as const,
          modalTitle: "Activate Daily Dealing",
          modalDescription:
            "Verify issuer identity and activate ongoing daily dealing for the open-end fund.",
          modalSteps: buildActionFlow({
            reviewTitle: "Review Daily Dealing Activation",
            reviewDescription:
              "Check the launch readiness, NAV cycle, and settlement settings before activation.",
            identityDescription:
              "Issuer identity and dealing activation authority are being verified.",
            actionLabel: "Activate",
            actionTitle: "Activate Daily Dealing",
            actionDescription:
              "The fund is being switched into daily dealing mode.",
            successTitle: "Daily dealing activated",
            successDescription:
              "The open-end fund is now in active dealing mode.",
          }),
        };
      case "Active Dealing":
        return {
          label: "Pause Dealing",
          nextStatus: "Paused",
          message: "Daily dealing paused",
          icon: PauseCircle,
          variant: "outline" as const,
          modalTitle: "Pause Daily Dealing",
          modalDescription:
            "Verify issuer identity before pausing open-end dealing operations.",
          modalSteps: buildActionFlow({
            reviewTitle: "Review Pause Request",
            reviewDescription:
              "Confirm the dealing pause reason and operating impact before proceeding.",
            identityDescription:
              "Issuer identity and dealing control authority are being verified.",
            actionLabel: "Pause",
            actionTitle: "Pause Dealing",
            actionDescription:
              "The daily dealing pause request is being recorded.",
            successTitle: "Daily dealing paused",
            successDescription:
              "The open-end fund has been paused successfully.",
          }),
        };
      case "Paused":
        return {
          label: "Resume Dealing",
          nextStatus: "Active Dealing",
          message: "Daily dealing resumed",
          icon: PlayCircle,
          variant: "default" as const,
          modalTitle: "Resume Daily Dealing",
          modalDescription:
            "Verify issuer identity before resuming open-end dealing operations.",
          modalSteps: buildActionFlow({
            reviewTitle: "Review Resume Request",
            reviewDescription:
              "Confirm the fund is ready to resume daily dealing for investors.",
            identityDescription:
              "Issuer identity and dealing restart authority are being verified.",
            actionLabel: "Resume",
            actionTitle: "Resume Dealing",
            actionDescription:
              "The daily dealing restart request is being processed.",
            successTitle: "Daily dealing resumed",
            successDescription:
              "The open-end fund has resumed daily dealing.",
          }),
        };
      default:
        return null;
    }
  }

  switch (fund.status) {
    case "Draft":
      return {
        label: "Submit for Approval",
        nextStatus: "Pending Approval",
        message: "Closed-end fund draft submitted for approval",
        icon: Send,
        variant: "default" as const,
        modalTitle: "Submit Closed-end Fund For Approval",
        modalDescription:
          "Review the closed-end issuance draft, verify issuer identity, and submit it for approval.",
        modalSteps: buildActionFlow({
          reviewTitle: "Review Draft Submission",
          reviewDescription:
            "Check the issuance terms, subscription window, and supporting setup before submission.",
          identityDescription:
            "Issuer identity, compliance permissions, and wallet authority are being verified.",
          actionLabel: "Submit",
          actionTitle: "Submit Approval Request",
          actionDescription:
            "The closed-end fund approval request is being submitted.",
          successTitle: "Closed-end fund submitted",
          successDescription:
            "The fund draft is now waiting for approval review.",
        }),
      };
    case "Pending Approval":
      return {
        label: "Approve Listing",
        nextStatus: "Pending Listing",
        message: "Approval completed. Ready for listing",
        icon: ShieldCheck,
        variant: "default" as const,
        modalTitle: "Approve Closed-end Listing",
        modalDescription:
          "Verify approver identity and move the closed-end fund into listing preparation.",
        modalSteps: buildActionFlow({
          reviewTitle: "Review Listing Approval",
          reviewDescription:
            "Confirm the closed-end fund is ready to proceed to listing.",
          identityDescription:
            "Approver identity and listing authority are being verified.",
          actionLabel: "Approve",
          actionTitle: "Approve Listing",
          actionDescription:
            "The approval signature for listing is being recorded.",
          successTitle: "Listing approved",
          successDescription:
            "The fund is now ready for listing actions.",
        }),
      };
    case "Pending Listing":
      return {
        label: "List Fund",
        nextStatus: "Upcoming",
        message: "Fund listing has been prepared",
        icon: PlayCircle,
        variant: "default" as const,
        modalTitle: "List Closed-end Fund",
        modalDescription:
          "Verify issuer identity and complete the listing actions for the closed-end fund.",
        modalSteps: buildActionFlow({
          reviewTitle: "Review Listing Request",
          reviewDescription:
            "Confirm the fund should move from pending listing into the upcoming subscription stage.",
          identityDescription:
            "Issuer identity and listing authority are being verified.",
          actionLabel: "Sign",
          actionTitle: "Sign Listing Request",
          actionDescription:
            "The wallet signature for fund listing is being recorded.",
          executionLabel: "List",
          executionTitle: "Execute Listing",
          executionDescription:
            "The listing request is being posted to the issuance workflow.",
          successTitle: "Fund listed",
          successDescription:
            "The closed-end fund is now in the upcoming stage.",
        }),
      };
    case "Upcoming":
      return {
        label: "Open Subscription",
        nextStatus: "Open For Subscription",
        message: "Closed-end subscription window is now open",
        icon: PlayCircle,
        variant: "default" as const,
        modalTitle: "Open Closed-end Subscription",
        modalDescription:
          "Verify issuer identity and open the subscription window for investors.",
        modalSteps: buildActionFlow({
          reviewTitle: "Review Subscription Opening",
          reviewDescription:
            "Confirm the subscription window and issuance terms before opening investor access.",
          identityDescription:
            "Issuer identity and subscription authority are being verified.",
          actionLabel: "Sign",
          actionTitle: "Sign Opening Request",
          actionDescription:
            "The subscription opening request is being signed.",
          successTitle: "Subscription opened",
          successDescription:
            "The closed-end fund is now open for subscription.",
        }),
      };
    case "Open For Subscription":
      return {
        label: "Close and Start Allocation",
        nextStatus: "Allocation Period",
        message: "Subscription closed. Allocation period started",
        icon: PauseCircle,
        variant: "outline" as const,
        modalTitle: "Close Subscription And Start Allocation",
        modalDescription:
          "Verify issuer identity and close subscriptions before starting allocation.",
        modalSteps: buildActionFlow({
          reviewTitle: "Review Allocation Start",
          reviewDescription:
            "Confirm subscriptions should be closed and allocation processing should begin.",
          identityDescription:
            "Issuer identity and allocation-start authority are being verified.",
          actionLabel: "Close",
          actionTitle: "Close Subscription Window",
          actionDescription:
            "The subscription close instruction is being processed.",
          successTitle: "Allocation started",
          successDescription:
            "The fund is now in the allocation period.",
        }),
      };
    case "Allocation Period":
      return {
        label: "Calculate Allocation",
        nextStatus: "Calculated",
        message: "Allocation calculation completed",
        icon: ShieldCheck,
        variant: "default" as const,
        modalTitle: "Calculate Allocation",
        modalDescription:
          "Verify issuer identity before running the allocation calculation step.",
        modalSteps: buildActionFlow({
          reviewTitle: "Review Allocation Calculation",
          reviewDescription:
            "Confirm the subscription book is ready for allocation calculation.",
          identityDescription:
            "Issuer identity and allocation-calculation authority are being verified.",
          actionLabel: "Calculate",
          actionTitle: "Calculate Allocation",
          actionDescription:
            "The allocation result is being calculated for the closed-end fund.",
          successTitle: "Allocation calculated",
          successDescription:
            "The allocation result is ready for the next on-chain step.",
        }),
      };
    case "Calculated":
      return {
        label: "Allocate On Chain",
        nextStatus: "Allocate On Chain",
        message: "Allocation moved to on-chain execution",
        icon: PlayCircle,
        variant: "default" as const,
        modalTitle: "Allocate On Chain",
        modalDescription:
          "Verify issuer identity and execute the on-chain allocation step.",
        modalSteps: buildActionFlow({
          reviewTitle: "Review On-chain Allocation",
          reviewDescription:
            "Confirm the calculated allocation result before pushing it on chain.",
          identityDescription:
            "Issuer identity and on-chain allocation authority are being verified.",
          actionLabel: "Approve",
          actionTitle: "Approve Allocation",
          actionDescription:
            "The on-chain allocation approval is being signed.",
          executionLabel: "Execute",
          executionTitle: "Execute Allocation",
          executionDescription:
            "The calculated allocation is being sent to the on-chain step.",
          successTitle: "Allocation moved on chain",
          successDescription:
            "The allocation is now in the on-chain execution stage.",
        }),
      };
    case "Allocate On Chain":
      return {
        label: "Mark Allocation Completed",
        nextStatus: "Allocation Completed",
        message: "On-chain allocation completed",
        icon: ShieldCheck,
        variant: "default" as const,
        modalTitle: "Mark Allocation Completed",
        modalDescription:
          "Verify issuer identity before confirming the on-chain allocation is complete.",
        modalSteps: buildActionFlow({
          reviewTitle: "Review Allocation Completion",
          reviewDescription:
            "Confirm the on-chain allocation step completed successfully.",
          identityDescription:
            "Issuer identity and completion authority are being verified.",
          actionLabel: "Confirm",
          actionTitle: "Confirm Completion",
          actionDescription:
            "The allocation completion confirmation is being recorded.",
          successTitle: "Allocation completed",
          successDescription:
            "The fund has completed the allocation step.",
        }),
      };
    case "Allocation Completed":
      return {
        label: "Complete Issuance",
        nextStatus: "Issuance Completed",
        message: "Issuance process completed",
        icon: ShieldCheck,
        variant: "default" as const,
        modalTitle: "Complete Issuance",
        modalDescription:
          "Verify issuer identity and complete the closed-end issuance process.",
        modalSteps: buildActionFlow({
          reviewTitle: "Review Issuance Completion",
          reviewDescription:
            "Confirm the issuance can move from allocation completion to final completion.",
          identityDescription:
            "Issuer identity and issuance-completion authority are being verified.",
          actionLabel: "Complete",
          actionTitle: "Complete Issuance",
          actionDescription:
            "The issuance completion request is being processed.",
          successTitle: "Issuance completed",
          successDescription:
            "The closed-end issuance process has been completed.",
        }),
      };
    case "Issuance Completed":
      return {
        label: "Activate Fund",
        nextStatus: "Issuance Active",
        message: "Closed-end fund is now active",
        icon: PlayCircle,
        variant: "default" as const,
        modalTitle: "Activate Closed-end Fund",
        modalDescription:
          "Verify issuer identity and activate the fund after issuance completion.",
        modalSteps: buildActionFlow({
          reviewTitle: "Review Fund Activation",
          reviewDescription:
            "Confirm the fund is ready to enter its active post-issuance state.",
          identityDescription:
            "Issuer identity and fund-activation authority are being verified.",
          actionLabel: "Activate",
          actionTitle: "Activate Fund",
          actionDescription:
            "The activation request is being recorded for the closed-end fund.",
          successTitle: "Fund activated",
          successDescription:
            "The closed-end fund is now active.",
        }),
      };
    default:
      return null;
  }
}

function renderOrderTable(
  orders: FundOrder[],
  isMarketplaceView: boolean,
  onAdvance: (order: FundOrder) => void,
  canAdvanceOrder: boolean,
  deniedReason?: string,
) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order ID</TableHead>
          <TableHead>Investor</TableHead>
          <TableHead>Request</TableHead>
          <TableHead>Estimated</TableHead>
          <TableHead>Confirmed</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Submit Time</TableHead>
          {!isMarketplaceView && <TableHead>Action</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => {
          const nextAction = getNextOrderAction(order);
          return (
            <TableRow key={order.id}>
              <TableCell className="font-mono text-xs">{order.id}</TableCell>
              <TableCell>
                <div className="font-medium">{order.investorName}</div>
                <div className="max-w-[200px] truncate text-xs text-muted-foreground">
                  {order.investorWallet}
                </div>
              </TableCell>
              <TableCell>
                <div>{order.requestAmount}</div>
                <div className="text-xs text-muted-foreground">{order.requestQuantity}</div>
              </TableCell>
              <TableCell>{order.estimatedSharesOrCash}</TableCell>
              <TableCell>{order.confirmedSharesOrCash || "Pending"}</TableCell>
              <TableCell>
                <StatusBadge status={order.status} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {order.submitTime}
              </TableCell>
              {!isMarketplaceView && (
                <TableCell>
                  {nextAction ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!canAdvanceOrder}
                      title={canAdvanceOrder ? undefined : deniedReason}
                      onClick={() => onAdvance(order)}
                    >
                      {nextAction.label}
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">No action</span>
                  )}
                </TableCell>
              )}
            </TableRow>
          );
        })}
        {orders.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={isMarketplaceView ? 7 : 8}
              className="py-12 text-center text-muted-foreground"
            >
              No orders yet.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

export function FundIssuanceDetail() {
  const { id } = useParams();
  const location = useLocation();
  const isMarketplaceView = location.pathname.includes("marketplace");
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [issuerActionModalOpen, setIssuerActionModalOpen] = useState(false);
  const [pendingIssuerAction, setPendingIssuerAction] = useState<
    ReturnType<typeof getFundAction> | null
  >(null);

  const {
    currentInvestor,
    fundIssuances,
    fundOrders,
    addFundOrder,
    updateFundOrderStatus,
    updateFundIssuance,
    updateFundStatus,
    getPermissionResult,
    userRole,
  } = useApp();

  const fundData = fundIssuances.find((fund) => fund.id === id);

  const allFundOrders = useMemo(
    () => fundOrders.filter((order) => order.fundId === id),
    [fundOrders, id],
  );

  const visibleOrders = useMemo(() => {
    if (!isMarketplaceView) return allFundOrders;
    return allFundOrders.filter((order) => order.investorId === currentInvestor.id);
  }, [allFundOrders, currentInvestor.id, isMarketplaceView]);

  if (!fundData) {
    return (
      <div className="container mx-auto px-6 py-20 text-center">
        <h2>Fund Not Found</h2>
        <p className="mt-2 text-muted-foreground">
          The fund you are looking for does not exist or has been removed.
        </p>
      </div>
    );
  }

  const isOpenEnd = fundData.fundType === "Open-end";
  const persistedReferences = fundData.references ?? [];
  const persistedInvestorRules = fundData.investorRules ?? [];
  const subscriptionOrders = visibleOrders.filter((order) => order.type === "subscription");
  const redemptionOrders = visibleOrders.filter((order) => order.type === "redemption");
  const allocationPreview = buildAllocationPreview(allFundOrders, fundData);
  const pendingSubscriptionOrders = allFundOrders.filter(
    (order) =>
      order.type === "subscription" &&
      ["Submitted", "Pending Review", "Pending NAV", "Pending Confirmation"].includes(
        order.status,
      ),
  ).length;
  const pendingRedemptionOrders = allFundOrders.filter(
    (order) =>
      order.type === "redemption" &&
      ["Submitted", "Pending Review", "Pending NAV", "Pending Cash Settlement"].includes(
        order.status,
      ),
  ).length;

  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value);
    toast.success("Copied to clipboard");
  };

  const transitionFundStatus = (nextStatus: string, description: string) => {
    if (!pendingIssuerAction) return;
    const updated = updateFundStatus(
      fundData.id,
      nextStatus,
      getIssuerPermissionAction(pendingIssuerAction.label),
    );
    if (!updated) return;
    toast.success(description);
  };

  const handleOrderAdvance = (order: FundOrder) => {
    const nextAction = getNextOrderAction(order);
    if (!nextAction) return;
    const updated = updateFundOrderStatus(
      order.id,
      nextAction.nextStatus,
      nextAction.label.toLowerCase(),
    );
    if (!updated) return;
    toast.success(`${order.id} moved to ${nextAction.nextStatus}`);
  };

  const handleSubscribeSuccess = ({
    amount,
    estimatedUnits,
  }: {
    amount: number;
    estimatedUnits: number;
  }) => {
    const added = addFundOrder({
      id: `sub-${Date.now()}`,
      fundId: fundData.id,
      investorId: currentInvestor.id,
      investorName: currentInvestor.name,
      investorWallet: currentInvestor.wallet,
      type: "subscription",
      requestAmount: `${formatNumber(amount, 2)} ${fundData.navCurrency}`,
      requestQuantity: `${formatNumber(estimatedUnits, 4)} units`,
      estimatedNav: fundData.currentNav,
      estimatedSharesOrCash: `${formatNumber(estimatedUnits, 4)} units`,
      submitTime: nowString(),
      status: !isOpenEnd
        ? "Pending Review"
        : fundData.orderConfirmationMethod === "Issuer review then confirm"
          ? "Pending Review"
          : "Pending NAV",
      note:
        fundData.fundType === "Open-end"
          ? "Created from marketplace subscription modal"
          : "Created from marketplace closed-end subscription modal",
      identitySource: "authSession",
    });
    if (!added) return;
  };

  const handleRedeemSuccess = ({
    quantity,
    estimatedCash,
  }: {
    quantity: number;
    estimatedCash: number;
  }) => {
    const added = addFundOrder({
      id: `red-${Date.now()}`,
      fundId: fundData.id,
      investorId: currentInvestor.id,
      investorName: currentInvestor.name,
      investorWallet: currentInvestor.wallet,
      type: "redemption",
      requestAmount: `${formatNumber(quantity, 2)} units`,
      requestQuantity: `${formatNumber(quantity, 2)} units`,
      estimatedNav: fundData.currentNav,
      estimatedSharesOrCash: `${formatNumber(estimatedCash, 2)} ${fundData.navCurrency}`,
      submitTime: nowString(),
      status:
        fundData.orderConfirmationMethod === "Issuer review then confirm"
          ? "Pending Review"
          : "Pending Cash Settlement",
      note: "Created from marketplace redemption modal",
      identitySource: "authSession",
    });
    if (!added) return;
  };

  const issuerAction = getFundAction(fundData);
  const editableSections = getEditableSections(fundData);
  const canOpenEndSubscribe =
    isOpenEnd &&
    ["Initial Subscription", "Active Dealing"].includes(fundData.status) &&
    fundData.subscriptionStatus !== "Paused";
  const canOpenEndRedeem =
    isOpenEnd &&
    fundData.status === "Active Dealing" &&
    fundData.redemptionStatus === "Open";
  const canClosedEndSubscribe = !isOpenEnd && fundData.status === "Open For Subscription";
  const subscribePermission = getPermissionResult("subscribe", "order");
  const redeemPermission = getPermissionResult("redeem", "order");
  const updateFundPermission = getPermissionResult("update", "issuance");
  const issuerActionPermission = issuerAction
    ? getPermissionResult(getIssuerPermissionAction(issuerAction.label), "issuance")
    : { allowed: true as const };
  const manageOrderPermission = getPermissionResult("review", "order");
  const canEditSetup =
    !isMarketplaceView &&
    userRole === "issuer" &&
    updateFundPermission.allowed &&
    editableSections.length > 0;

  return (
    <div className="container mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="transition-colors hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        {isMarketplaceView ? (
          <>
            <Link
              to="/marketplace/fund-issuance"
              className="transition-colors hover:text-foreground"
            >
              Marketplace
            </Link>
            <ChevronRight className="h-4 w-4" />
          </>
        ) : (
          <>
            <Link
              to="/manage/fund-issuance"
              className="transition-colors hover:text-foreground"
            >
              Manage Fund Issuance
            </Link>
            <ChevronRight className="h-4 w-4" />
          </>
        )}
        <span className="text-foreground">{fundData.name}</span>
      </div>

      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 style={{ fontFamily: "var(--font-heading)" }}>{fundData.name}</h1>
              <StatusBadge status={fundData.status} />
              <Badge variant="outline">{fundData.fundType}</Badge>
              {fundData.dealingFrequency && (
                <Badge variant="outline">{fundData.dealingFrequency} dealing</Badge>
              )}
            </div>
            <p className="mt-2 max-w-3xl text-muted-foreground">{fundData.description}</p>
          </div>

          {isMarketplaceView && (
            <div className="flex flex-wrap gap-2">
              {canOpenEndSubscribe && (
                <Button
                  disabled={!subscribePermission.allowed}
                  title={subscribePermission.reason}
                  onClick={() => setShowSubscribeModal(true)}
                >
                  Subscribe
                </Button>
              )}
              {canOpenEndRedeem && (
                <Button
                  variant="outline"
                  disabled={!redeemPermission.allowed}
                  title={redeemPermission.reason}
                  onClick={() => setShowRedeemModal(true)}
                >
                  Redeem
                </Button>
              )}
              {canClosedEndSubscribe && (
                <Button
                  disabled={!subscribePermission.allowed}
                  title={subscribePermission.reason}
                  onClick={() => setShowSubscribeModal(true)}
                >
                  Subscribe
                </Button>
              )}
            </div>
          )}
        </div>

        {isOpenEnd ? (
          <InfoAlert variant="info" title="Open-end Operating Flow">
            For open-end funds, the main progress bar tracks only the fund lifecycle:
            launch, initial subscription, and entry into active dealing. NAV and settlement
            stay visible below as recurring operating checkpoints rather than extra fund
            lifecycle steps.
          </InfoAlert>
        ) : (
          <InfoAlert variant="info" title="Closed-end Issuance Flow">
            Closed-end issuance remains fully supported in the demo, including approval,
            listing, subscription, allocation, on-chain completion, and activation.
          </InfoAlert>
        )}
      </div>

      <div className="mb-8">
        <FundIssuanceWorkflow
          currentStatus={fundData.status}
          fundType={fundData.fundType}
          actionSlot={
            !isMarketplaceView && issuerAction ? (
              <Button
                variant={issuerAction.variant}
                disabled={!issuerActionPermission.allowed}
                title={issuerActionPermission.reason}
                onClick={() => {
                  setPendingIssuerAction(issuerAction);
                  setIssuerActionModalOpen(true);
                }}
              >
                <issuerAction.icon className="mr-2 h-4 w-4" />
                {issuerAction.label}
              </Button>
            ) : undefined
          }
        />
      </div>

      {isOpenEnd && (
        <div className="mb-8">
          <OpenEndDealingCycleCard fundData={fundData} />
        </div>
      )}

      {!isMarketplaceView && (
        <div className="mb-8 flex flex-col gap-4 rounded-lg border bg-secondary/20 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-medium">Field Editing Policy</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {getEditingPolicyMessage(fundData)}
            </div>
          </div>
          {canEditSetup && !isInlineEditing && (
            <Button variant="outline" onClick={() => setIsInlineEditing(true)}>
              Enter Edit Mode
            </Button>
          )}
        </div>
      )}

      {isInlineEditing && (
        <div className="mb-8">
          <FundSetupEditor
            fundData={fundData}
            onCancel={() => setIsInlineEditing(false)}
            onSave={(updates) => {
              const updated = updateFundIssuance(fundData.id, updates, "update");
              if (!updated) return;
              setIsInlineEditing(false);
              toast.success("Allowed fund fields updated");
            }}
          />
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Fund Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <div className="mb-1 text-muted-foreground">Fund Token</div>
                <div className="font-medium">{fundData.tokenName}</div>
              </div>
              <div>
                <div className="mb-1 text-muted-foreground">Token Symbol</div>
                <div className="font-medium">{fundData.tokenSymbol || "N/A"}</div>
              </div>
              <div>
                <div className="mb-1 text-muted-foreground">Token Standard</div>
                <div className="font-medium">{fundData.tokenStandard || "N/A"}</div>
              </div>
              <div>
                <div className="mb-1 text-muted-foreground">Token Contract Address</div>
                <div className="flex items-center gap-2">
                  <code className="break-all text-sm">{fundData.tokenAddress}</code>
                  {fundData.tokenAddress !== "–" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(fundData.tokenAddress)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <div className="mb-1 text-muted-foreground">
                  {isOpenEnd ? "Current NAV" : "Initial NAV"}
                </div>
                <div className="font-medium">
                  {isOpenEnd ? fundData.currentNav : fundData.initialNav}
                </div>
              </div>
              <div>
                <div className="mb-1 text-muted-foreground">Fund Manager</div>
                <div className="font-medium">{fundData.fundManager}</div>
              </div>
              <div>
                <div className="mb-1 text-muted-foreground">Issuer Entity</div>
                <div className="font-medium">{fundData.issuerEntity || "N/A"}</div>
              </div>
              <div>
                <div className="mb-1 text-muted-foreground">Share Class</div>
                <div className="font-medium">{fundData.shareClass || "N/A"}</div>
              </div>
              <div>
                <div className="mb-1 text-muted-foreground">Target Fund Size</div>
                <div className="font-medium">{fundData.targetFundSize}</div>
              </div>
              <div>
                <div className="mb-1 text-muted-foreground">Management Fee</div>
                <div className="font-medium">{fundData.managementFee}</div>
              </div>
              <div>
                <div className="mb-1 text-muted-foreground">Performance Fee</div>
                <div className="font-medium">{fundData.performanceFee}</div>
              </div>
              <div>
                <div className="mb-1 text-muted-foreground">Tradable</div>
                <div className="font-medium">{fundData.tradable}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Operational Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <div className="mb-1 text-muted-foreground">Subscription Window</div>
                <div className="font-medium">
                  {fundData.subscriptionStartDate || "TBD"} to{" "}
                  {fundData.subscriptionEndDate || "TBD"}
                </div>
              </div>
              <div>
                <div className="mb-1 text-muted-foreground">Issue Date</div>
                <div className="font-medium">{fundData.issueDate || "N/A"}</div>
              </div>
              {isOpenEnd ? (
                <>
                  <div>
                    <div className="mb-1 text-muted-foreground">Next Cut-off</div>
                    <div className="font-medium">{fundData.nextCutoffTime || "N/A"}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-muted-foreground">Next Confirmation</div>
                    <div className="font-medium">
                      {fundData.nextConfirmationDate || "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-muted-foreground">Next Settlement</div>
                    <div className="font-medium">{fundData.nextSettlementTime || "N/A"}</div>
                  </div>
                </>
              ) : (
                <div>
                  <div className="mb-1 text-muted-foreground">Maturity Date</div>
                  <div className="font-medium">{fundData.maturityDate || "N/A"}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {!isMarketplaceView && (
            <Card>
              <CardHeader>
                <CardTitle>Related Setup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  Redemption and distribution are follow-on operating tasks, so they live here instead of competing with the main next-step action.
                </p>
                <Button asChild className="w-full justify-start" variant="outline">
                  <Link to="/manage/fund-redemption">Redemption Setup</Link>
                </Button>
                <Button asChild className="w-full justify-start" variant="outline">
                  <Link to="/manage/fund-distribution">Distribution Setup</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          {isOpenEnd ? (
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="information">Information</TabsTrigger>
                <TabsTrigger value="dealing">Dealing</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="nav-history">NAV History</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                  <MetricCard
                    icon={LineChart}
                    label="Current NAV"
                    value={fundData.currentNavValue.toFixed(4)}
                    suffix={fundData.navCurrency}
                    variant="primary"
                  />
                  <MetricCard
                    icon={RefreshCcw}
                    label="Pending Subscription Orders"
                    value={pendingSubscriptionOrders}
                    variant="success"
                  />
                  <MetricCard
                    icon={ArrowRightLeft}
                    label="Pending Redemption Orders"
                    value={pendingRedemptionOrders}
                    variant="warning"
                  />
                  <MetricCard
                    icon={Clock3}
                    label="Next Settlement"
                    value={fundData.nextSettlementTime?.split(" ")[0] || "T+1"}
                    variant="default"
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Operational Snapshot</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 text-sm md:grid-cols-2">
                    <div className="rounded-lg border p-4">
                      <div className="text-muted-foreground">Order confirmation</div>
                      <div className="mt-1 font-medium">
                        {fundData.orderConfirmationMethod || "Auto at cut-off"}
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-muted-foreground">Available holdings</div>
                      <div className="mt-1 font-medium">
                        {fundData.availableHoldingLabel || "0 units"}
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-muted-foreground">Subscribed amount</div>
                      <div className="mt-1 font-medium">
                        {fundData.totalSubscribedAmount || "0"}
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-muted-foreground">Redeemed amount</div>
                      <div className="mt-1 font-medium">
                        {fundData.totalRedeemedAmount || "0"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="information" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Fund Strategy & Setup</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="mb-1 text-sm text-muted-foreground">
                        Investment Strategy
                      </div>
                      <p className="text-sm leading-6">{fundData.investmentStrategy}</p>
                    </div>
                    <div className="grid gap-4 text-sm md:grid-cols-2">
                      <div className="rounded-lg border p-4">
                        <div className="text-muted-foreground">Target fund size</div>
                        <div className="mt-1 font-medium">{fundData.targetFundSize}</div>
                      </div>
                      <div className="rounded-lg border p-4">
                        <div className="text-muted-foreground">Fund jurisdiction</div>
                        <div className="mt-1 font-medium">
                          {fundData.fundJurisdiction || "N/A"}
                        </div>
                      </div>
                      <div className="rounded-lg border p-4">
                        <div className="text-muted-foreground">Lock-up period</div>
                        <div className="mt-1 font-medium">{fundData.lockupPeriod}</div>
                      </div>
                      <div className="rounded-lg border p-4">
                        <div className="text-muted-foreground">Subscription amount range</div>
                        <div className="mt-1 font-medium">
                          {fundData.minSubscriptionAmount} to {fundData.maxSubscriptionAmount}
                        </div>
                      </div>
                      <div className="rounded-lg border p-4">
                        <div className="text-muted-foreground">Redemption gate</div>
                        <div className="mt-1 font-medium">
                          {fundData.maxRedemptionPerInvestor || "N/A"}
                        </div>
                      </div>
                      <div className="rounded-lg border p-4">
                        <div className="text-muted-foreground">Share class</div>
                        <div className="mt-1 font-medium">{fundData.shareClass || "N/A"}</div>
                      </div>
                      <div className="rounded-lg border p-4">
                        <div className="text-muted-foreground">Initial allocation rule</div>
                        <div className="mt-1 font-medium">
                          {fundData.allocationRule || "N/A"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Token Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-lg border p-4">
                        <div className="text-muted-foreground">Token name</div>
                        <div className="mt-1 font-medium">{fundData.tokenName}</div>
                      </div>
                      <div className="rounded-lg border p-4">
                        <div className="text-muted-foreground">Token symbol</div>
                        <div className="mt-1 font-medium">
                          {fundData.tokenSymbol || "N/A"}
                        </div>
                      </div>
                      <div className="rounded-lg border p-4">
                        <div className="text-muted-foreground">Token standard</div>
                        <div className="mt-1 font-medium">
                          {fundData.tokenStandard || "N/A"}
                        </div>
                      </div>
                      <div className="rounded-lg border p-4">
                        <div className="text-muted-foreground">Token decimals</div>
                        <div className="mt-1 font-medium">
                          {fundData.tokenDecimals ?? "N/A"}
                        </div>
                      </div>
                      <div className="rounded-lg border p-4">
                        <div className="text-muted-foreground">ISIN / security code</div>
                        <div className="mt-1 font-medium">{fundData.isinCode || "N/A"}</div>
                      </div>
                      <div className="rounded-lg border p-4">
                        <div className="text-muted-foreground">1 token represents</div>
                        <div className="mt-1 font-medium">
                          {fundData.unitPerToken || "N/A"}
                        </div>
                      </div>
                      <div className="rounded-lg border p-4">
                        <div className="text-muted-foreground">Whitelist required</div>
                        <div className="mt-1 font-medium">
                          {fundData.whitelistRequired || "N/A"}
                        </div>
                      </div>
                      <div className="rounded-lg border p-4">
                        <div className="text-muted-foreground">Tradable on secondary market</div>
                        <div className="mt-1 font-medium">{fundData.tradable}</div>
                      </div>
                      <div className="rounded-lg border p-4 md:col-span-2">
                        <div className="text-muted-foreground">Minting rule</div>
                        <div className="mt-1 font-medium">
                          {fundData.mintingRule || "N/A"}
                        </div>
                      </div>
                    </div>

                    {persistedInvestorRules.length > 0 && (
                      <div>
                        <div className="mb-2 text-sm text-muted-foreground">
                          Investor rules
                        </div>
                        <div className="space-y-2">
                          {persistedInvestorRules.map((rule, index) => (
                            <div key={`${rule.ruleType}-${index}`} className="rounded-lg border p-3">
                              <div className="font-medium">{formatRuleType(rule.ruleType)}</div>
                              <div className="mt-1 text-muted-foreground">
                                {rule.condition} {rule.value}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {persistedReferences.length > 0 && (
                      <div>
                        <div className="mb-2 text-sm text-muted-foreground">References</div>
                        <div className="space-y-2">
                          {persistedReferences.map((reference, index) => (
                            <div key={`${reference.type}-${index}`} className="rounded-lg border p-3">
                              <div className="font-medium">
                                {reference.type === "link" ? "Link" : "File"}
                              </div>
                              <div className="mt-1 break-all text-muted-foreground">
                                {reference.value}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="dealing" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Dealing & Settlement Rules</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 text-sm md:grid-cols-2">
                    <div className="rounded-lg border p-4">
                      <div className="text-muted-foreground">Dealing frequency</div>
                      <div className="mt-1 font-medium">
                        {fundData.dealingFrequency || "Daily"}
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-muted-foreground">Cut-off time</div>
                      <div className="mt-1 font-medium">
                        {fundData.dealingCutoffTime || "N/A"}
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-muted-foreground">NAV valuation time</div>
                      <div className="mt-1 font-medium">
                        {fundData.navValuationTime || "N/A"}
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-muted-foreground">Settlement cycle</div>
                      <div className="mt-1 font-medium">
                        {fundData.settlementCycle || "T+1"}
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-muted-foreground">Subscription status</div>
                      <div className="mt-1 font-medium">
                        {fundData.subscriptionStatus || "Open"}
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-muted-foreground">Redemption status</div>
                      <div className="mt-1 font-medium">
                        {fundData.redemptionStatus || "Open"}
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-muted-foreground">Notice period</div>
                      <div className="mt-1 font-medium">
                        {fundData.noticePeriodDays || 0} day(s)
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-muted-foreground">
                        Fund-level redemption gate
                      </div>
                      <div className="mt-1 font-medium">
                        {fundData.fundLevelRedemptionGate || "N/A"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="orders" className="space-y-6">
                <Tabs defaultValue="subscription" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="subscription">Subscription Orders</TabsTrigger>
                    <TabsTrigger value="redemption">Redemption Orders</TabsTrigger>
                    <TabsTrigger value="buyers">Buyers</TabsTrigger>
                  </TabsList>
                  <TabsContent value="subscription">
                    {renderOrderTable(
                      subscriptionOrders,
                      isMarketplaceView,
                      handleOrderAdvance,
                      manageOrderPermission.allowed,
                      manageOrderPermission.reason,
                    )}
                  </TabsContent>
                  <TabsContent value="redemption">
                    {renderOrderTable(
                      redemptionOrders,
                      isMarketplaceView,
                      handleOrderAdvance,
                      manageOrderPermission.allowed,
                      manageOrderPermission.reason,
                    )}
                  </TabsContent>
                  <TabsContent value="buyers">
                    {renderBuyerTable(subscriptionOrders, fundData.navCurrency)}
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="nav-history">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NAV Date</TableHead>
                      <TableHead>NAV</TableHead>
                      <TableHead>Updated At</TableHead>
                      <TableHead>Note</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fundData.navHistory.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.navDate}</TableCell>
                        <TableCell>
                          {record.navValue.toFixed(4)} {record.currency}
                        </TableCell>
                        <TableCell>{record.updatedAt}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {record.note || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          ) : (
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="information">Information</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <MetricCard
                    icon={ShieldCheck}
                    label="Initial NAV"
                    value={fundData.initialNavValue.toFixed(2)}
                    suffix={fundData.navCurrency}
                    variant="primary"
                  />
                  <MetricCard
                    icon={Wallet}
                    label="Target Size"
                    value={formatNumber(fundData.targetFundSizeValue)}
                    suffix={fundData.assetCurrency}
                    variant="default"
                  />
                  <MetricCard
                    icon={RefreshCcw}
                    label="Subscription Orders"
                    value={subscriptionOrders.length}
                    variant="success"
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Closed-end Issuance Snapshot</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 text-sm md:grid-cols-2">
                    <div className="rounded-lg border p-4">
                      <div className="text-muted-foreground">Current stage</div>
                      <div className="mt-1 font-medium">{fundData.status}</div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-muted-foreground">Allocation status</div>
                      <div className="mt-1 font-medium">
                        {fundData.allocationStatus || "N/A"}
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-muted-foreground">Subscription amount range</div>
                      <div className="mt-1 font-medium">
                        {fundData.minSubscriptionAmount} to {fundData.maxSubscriptionAmount}
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-muted-foreground">Lock-up period</div>
                      <div className="mt-1 font-medium">{fundData.lockupPeriod}</div>
                    </div>
                  </CardContent>
                </Card>

                {isMarketplaceView && canClosedEndSubscribe && (
                  <InfoAlert variant="info" title="Closed-end Subscription Window">
                    This fund is still in its closed-end subscription stage. Investors can
                    place subscription requests during the current issuance window, and the
                    issuer will continue with allocation afterward.
                  </InfoAlert>
                )}
              </TabsContent>

              <TabsContent value="information">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Fund Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                      <div>
                        <div className="mb-1 text-muted-foreground">Investment Strategy</div>
                        <p className="leading-6">{fundData.investmentStrategy}</p>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-lg border p-4">
                          <div className="text-muted-foreground">Offering type</div>
                          <div className="mt-1 font-medium">
                            {fundData.offeringType || "N/A"}
                          </div>
                        </div>
                        <div className="rounded-lg border p-4">
                          <div className="text-muted-foreground">Legal structure</div>
                          <div className="mt-1 font-medium">
                            {fundData.legalStructure || "N/A"}
                          </div>
                        </div>
                        <div className="rounded-lg border p-4">
                          <div className="text-muted-foreground">Distribution channel</div>
                          <div className="mt-1 font-medium">
                            {fundData.fundDistributionChannel || "N/A"}
                          </div>
                        </div>
                        <div className="rounded-lg border p-4">
                          <div className="text-muted-foreground">Listed fund subtype</div>
                          <div className="mt-1 font-medium">
                            {fundData.listedFundSubtype || "N/A"}
                          </div>
                        </div>
                        <div className="rounded-lg border p-4">
                          <div className="text-muted-foreground">Asset / strategy category</div>
                          <div className="mt-1 font-medium">
                            {fundData.assetStrategyCategory || "N/A"}
                          </div>
                        </div>
                        <div className="rounded-lg border p-4">
                          <div className="text-muted-foreground">Fund manager</div>
                          <div className="mt-1 font-medium">{fundData.fundManager}</div>
                        </div>
                        <div className="rounded-lg border p-4">
                          <div className="text-muted-foreground">Issuer entity</div>
                          <div className="mt-1 font-medium">
                            {fundData.issuerEntity || "N/A"}
                          </div>
                        </div>
                        <div className="rounded-lg border p-4">
                          <div className="text-muted-foreground">Fund jurisdiction</div>
                          <div className="mt-1 font-medium">
                            {fundData.fundJurisdiction || "N/A"}
                          </div>
                        </div>
                        <div className="rounded-lg border p-4">
                          <div className="text-muted-foreground">Share class</div>
                          <div className="mt-1 font-medium">
                            {fundData.shareClass || "N/A"}
                          </div>
                        </div>
                        <div className="rounded-lg border p-4">
                          <div className="text-muted-foreground">Redemption frequency</div>
                          <div className="mt-1 font-medium">
                            {fundData.redemptionFrequency}
                          </div>
                        </div>
                        <div className="rounded-lg border p-4">
                          <div className="text-muted-foreground">Allocation rule</div>
                          <div className="mt-1 font-medium">
                            {fundData.allocationRule || "N/A"}
                          </div>
                        </div>
                        <div className="rounded-lg border p-4">
                          <div className="text-muted-foreground">Management fee</div>
                          <div className="mt-1 font-medium">{fundData.managementFee}</div>
                        </div>
                        <div className="rounded-lg border p-4">
                          <div className="text-muted-foreground">Performance fee</div>
                          <div className="mt-1 font-medium">{fundData.performanceFee}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Token Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-lg border p-4">
                          <div className="text-muted-foreground">Token name</div>
                          <div className="mt-1 font-medium">{fundData.tokenName}</div>
                        </div>
                        <div className="rounded-lg border p-4">
                          <div className="text-muted-foreground">Token symbol</div>
                          <div className="mt-1 font-medium">
                            {fundData.tokenSymbol || "N/A"}
                          </div>
                        </div>
                        <div className="rounded-lg border p-4">
                          <div className="text-muted-foreground">Token standard</div>
                          <div className="mt-1 font-medium">
                            {fundData.tokenStandard || "N/A"}
                          </div>
                        </div>
                        <div className="rounded-lg border p-4">
                          <div className="text-muted-foreground">Token decimals</div>
                          <div className="mt-1 font-medium">
                            {fundData.tokenDecimals ?? "N/A"}
                          </div>
                        </div>
                        <div className="rounded-lg border p-4">
                          <div className="text-muted-foreground">ISIN / security code</div>
                          <div className="mt-1 font-medium">{fundData.isinCode || "N/A"}</div>
                        </div>
                        <div className="rounded-lg border p-4">
                          <div className="text-muted-foreground">1 token represents</div>
                          <div className="mt-1 font-medium">
                            {fundData.unitPerToken || "N/A"}
                          </div>
                        </div>
                        <div className="rounded-lg border p-4">
                          <div className="text-muted-foreground">Whitelist required</div>
                          <div className="mt-1 font-medium">
                            {fundData.whitelistRequired || "N/A"}
                          </div>
                        </div>
                        <div className="rounded-lg border p-4">
                          <div className="text-muted-foreground">Tradable on secondary market</div>
                          <div className="mt-1 font-medium">{fundData.tradable}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="timeline">
                <Card>
                  <CardHeader>
                    <CardTitle>Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Created time</span>
                      <span className="font-medium">{fundData.createdTime || "N/A"}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Subscription window</span>
                      <span className="font-medium text-right">
                        {fundData.subscriptionStartDate || "TBD"} to{" "}
                        {fundData.subscriptionEndDate || "TBD"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Issue date</span>
                      <span className="font-medium">{fundData.issueDate || "N/A"}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Maturity date</span>
                      <span className="font-medium">
                        {fundData.maturityDate || "N/A"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="orders">
                <Tabs defaultValue="orders" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="orders">Orders</TabsTrigger>
                    <TabsTrigger value="buyers">Buyers</TabsTrigger>
                    <TabsTrigger value="allocation">Allocation Preview</TabsTrigger>
                  </TabsList>

                  <TabsContent value="orders">
                    {renderOrderTable(
                      subscriptionOrders,
                      isMarketplaceView,
                      handleOrderAdvance,
                      manageOrderPermission.allowed,
                      manageOrderPermission.reason,
                    )}
                  </TabsContent>

                  <TabsContent value="buyers">
                    {renderBuyerTable(subscriptionOrders, fundData.navCurrency)}
                  </TabsContent>

                  <TabsContent value="allocation" className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-4">
                      <MetricCard
                        icon={Wallet}
                        label="Requested Book"
                        value={formatNumber(allocationPreview.totalRequestedAmount)}
                        suffix={fundData.navCurrency}
                        variant="default"
                      />
                      <MetricCard
                        icon={ShieldCheck}
                        label="Allocatable Size"
                        value={formatNumber(fundData.targetFundSizeValue)}
                        suffix={fundData.navCurrency}
                        variant="primary"
                      />
                      <MetricCard
                        icon={RefreshCcw}
                        label="Projected Allocation"
                        value={formatNumber(allocationPreview.totalAllocatedAmount)}
                        suffix={fundData.navCurrency}
                        variant="success"
                      />
                      <MetricCard
                        icon={LineChart}
                        label="Pro-rata Ratio"
                        value={(allocationPreview.proRataRatio * 100).toFixed(2)}
                        suffix="%"
                        variant="warning"
                      />
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>Allocation By Buyer</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Buyer</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Share Class</TableHead>
                              <TableHead>Requested</TableHead>
                              <TableHead>Allocated</TableHead>
                              <TableHead>Allocated Units</TableHead>
                              <TableHead>Ratio</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {allocationPreview.rows.map((row) => (
                              <TableRow key={row.id}>
                                <TableCell>
                                  <div className="font-medium">{row.investorName}</div>
                                  <div className="text-xs text-muted-foreground">{row.id}</div>
                                </TableCell>
                                <TableCell>{row.buyerCategory}</TableCell>
                                <TableCell>{row.shareClass}</TableCell>
                                <TableCell>{formatNumber(row.requestedAmount)} {fundData.navCurrency}</TableCell>
                                <TableCell>{formatNumber(row.allocatedAmount)} {fundData.navCurrency}</TableCell>
                                <TableCell>{formatNumber(row.allocatedUnits, 2)} units</TableCell>
                                <TableCell>{(row.allocationRatio * 100).toFixed(2)}%</TableCell>
                              </TableRow>
                            ))}
                            {allocationPreview.rows.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                                  No subscription orders are available for allocation preview.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Allocation By Holder Category</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Category</TableHead>
                              <TableHead>Buyer Count</TableHead>
                              <TableHead>Allocated Amount</TableHead>
                              <TableHead>Allocated Units</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {allocationPreview.categoryBreakdown.map((row) => (
                              <TableRow key={row.category}>
                                <TableCell>{row.category}</TableCell>
                                <TableCell>{row.investorCount}</TableCell>
                                <TableCell>{formatNumber(row.allocatedAmount)} {fundData.navCurrency}</TableCell>
                                <TableCell>{formatNumber(row.allocatedUnits, 2)} units</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {(canOpenEndSubscribe || canClosedEndSubscribe) && (
        <SubscribeModal
          open={showSubscribeModal}
          onOpenChange={setShowSubscribeModal}
          fundData={fundData}
          onSuccess={handleSubscribeSuccess}
        />
      )}

      {canOpenEndRedeem && (
        <RedeemModal
          open={showRedeemModal}
          onOpenChange={setShowRedeemModal}
          fundData={fundData}
          onSuccess={handleRedeemSuccess}
        />
      )}

      {pendingIssuerAction && (
        <OperationActionModal
          open={issuerActionModalOpen}
          onOpenChange={(open) => {
            setIssuerActionModalOpen(open);
            if (!open) {
              setPendingIssuerAction(null);
            }
          }}
          onSuccess={() =>
            transitionFundStatus(
              pendingIssuerAction.nextStatus,
              pendingIssuerAction.message,
            )
          }
          title={pendingIssuerAction.modalTitle}
          description={pendingIssuerAction.modalDescription}
          steps={pendingIssuerAction.modalSteps}
          startLabel="Start"
          completionLabel="Done"
          summary={[
            { label: "Fund", value: fundData.name },
            { label: "Fund Type", value: fundData.fundType },
            { label: "Current Status", value: fundData.status },
            { label: "Actor Role", value: userRole },
            {
              label: isOpenEnd ? "Current NAV" : "Issue Price",
              value: isOpenEnd ? fundData.currentNav : fundData.initialNav,
            },
          ]}
        />
      )}
    </div>
  );
}
