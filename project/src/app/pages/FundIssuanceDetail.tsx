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
import {
  TransferAgentChecklistCard,
  TransferAgentOperationsCard,
  WorkflowResponsibilityCard,
} from "../components/TransferAgentPanels";
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

function isFiatSubscriptionFunding(fundData: FundIssuance) {
  return (
    fundData.subscriptionPaymentMethod === "Fiat" ||
    fundData.subscriptionPaymentRail === "Off-chain Bank Transfer"
  );
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

function includesKeyword(value: string | undefined, keyword: string) {
  return value?.toLowerCase().includes(keyword.toLowerCase()) ?? false;
}

function getOrderTaCheckpoint(order: FundOrder) {
  const awaitingCashConfirmation =
    order.type === "subscription" &&
    order.paymentMethod === "Fiat" &&
    !!order.paymentStatus &&
    !["Funds Cleared", "Not Applicable"].includes(order.paymentStatus);

  if (awaitingCashConfirmation) {
    return {
      label: "Waiting for cash confirmation",
      detail:
        order.paymentStatus === "Payment Proof Uploaded"
          ? "Issuer-side remittance proof has been uploaded. Transfer Agent cannot book units until cash is confirmed."
          : "Investor order exists, but transfer-agent booking is blocked until the issuer confirms the incoming cash leg.",
      registerEffect: "No register change until funds clear",
    };
  }

  if (
    order.type === "subscription" &&
    order.paymentMethod === "Fiat" &&
    order.paymentStatus === "Funds Cleared" &&
    order.unitBookingStatus !== "Booked" &&
    order.unitBookingStatus !== "Settled"
  ) {
    return {
      label: "Cash cleared, TA booking pending",
      detail:
        "Issuer-side cash confirmation is complete. Transfer Agent is preparing the unit-booking delta for the holder register.",
      registerEffect: "Ready for booking",
    };
  }

  switch (order.status) {
    case "Submitted":
      return {
        label: "Queued for TA intake",
        detail:
          order.type === "subscription"
            ? "Transfer Agent is waiting to review the incoming subscription package."
            : "Transfer Agent is waiting to review the incoming redemption request.",
        registerEffect: "No register change yet",
      };
    case "Pending Review":
      return {
        label:
          order.type === "subscription" && order.paymentStatus === "Funds Cleared"
            ? "TA validating booking package"
            : "TA validating eligibility",
        detail:
          order.type === "subscription"
            ? order.paymentStatus === "Funds Cleared"
              ? "Transfer Agent is checking the cleared-cash package, investor eligibility, and unit-booking readiness."
              : "Transfer Agent is checking investor eligibility, wallet mapping, and onboarding evidence."
            : "Transfer Agent is checking holder balance and redemption eligibility.",
        registerEffect:
          order.type === "subscription" && order.paymentStatus === "Funds Cleared"
            ? "Cash cleared, booking package under review"
            : "Pending approval",
      };
    case "Pending NAV":
      return {
        label: "TA preparing register delta",
        detail:
          "Transfer Agent is waiting for official NAV and final booking quantities before approving the ledger delta.",
        registerEffect: "Awaiting official pricing",
      };
    case "Pending Confirmation":
      return {
        label: "TA preparing booking",
        detail: "Transfer Agent is preparing the unit booking after pricing is confirmed.",
        registerEffect: "Booking instruction pending",
      };
    case "Pending Cash Settlement":
      return {
        label: "TA booked units, cash pending",
        detail:
          "Transfer Agent has locked the unit movement and is waiting for cash settlement to complete reconciliation.",
        registerEffect:
          order.type === "subscription"
            ? "Units earmarked for booking"
            : "Units removed pending cash settlement",
      };
    case "Confirmed":
      return {
        label: "Register updated",
        detail:
          order.type === "subscription" && order.paymentMethod === "Fiat"
            ? "Transfer Agent approved the cleared-cash package, posted the holder-register update, and booked units."
            : "Transfer Agent approved the ledger delta and posted the holder-register update.",
        registerEffect:
          order.type === "subscription"
            ? "Units added to holder register"
            : "Units removed from holder register",
      };
    case "Completed":
      return {
        label: "Cash and units reconciled",
        detail:
          "Transfer Agent completed the unit and cash reconciliation and closed the operational record.",
        registerEffect:
          order.type === "subscription"
            ? "Booked and settled"
            : "Redeemed and settled",
      };
    case "Rejected":
      return {
        label: "Rejected with no ledger change",
        detail: "Transfer Agent did not approve this request, so the holder register remains unchanged.",
        registerEffect: "No register change",
      };
    default:
      return {
        label: "TA review pending",
        detail: "Transfer Agent review is still pending for this order.",
        registerEffect: "Pending",
      };
  }
}

function getIssuanceResponsibilityItems(fundData: FundIssuance) {
  if (fundData.fundType === "Open-end") {
    return [
      {
        label: "1. Prepare Launch",
        owner: "Issuer / Approver",
        description: "Approve fund terms, launch controls, and dealing policy before opening the initial window.",
      },
      {
        label: "2. Collect Initial Orders",
        owner: "Investor / Transfer Agent",
        description: "Receive initial subscriptions and validate investor onboarding before the first register booking.",
      },
      {
        label: "3. Confirm Launch Register",
        owner: "Transfer Agent",
        description: "Approve the first holder-register baseline before the fund enters daily dealing.",
      },
      {
        label: "4. Run Daily Dealing",
        owner: "Transfer Agent / System",
        description: "Process subscription and redemption batches, official NAV, and settlement instructions.",
      },
      {
        label: "5. Post Register Delta",
        owner: "Transfer Agent",
        description: "Post unit ledger changes and reconcile investor cash and fund units after each batch.",
      },
    ];
  }

  return [
    {
      label: "1. Draft And List Fund",
      owner: "Issuer / Approver",
      description: "Approve issuance terms, listing readiness, and investor rule pack before subscriptions open.",
    },
    {
      label: "2. Collect Subscriptions",
      owner: "Investor / Issuer",
      description: "Open the subscription window and collect investor orders during the offering period.",
    },
    {
      label: "3. Validate Book",
      owner: "Transfer Agent",
      description: "Review investor onboarding, freeze the subscription book, and approve the allocation workbook.",
    },
    {
      label: "4. Approve Mint File",
      owner: "Transfer Agent / System",
      description: "Approve the final holder list and push the minted allocation file into execution.",
    },
    {
      label: "5. Publish Register Baseline",
      owner: "Transfer Agent",
      description: "Confirm the initial holder register and hand the active ledger over to post-issuance operations.",
    },
  ];
}

function buildIssuanceApprovalObjects(
  fundData: FundIssuance,
  totalOrderCount: number,
  allocationPreview: ReturnType<typeof buildAllocationPreview>,
) {
  const taOps = fundData.transferAgentOps;
  const fundingRoute = `${fundData.subscriptionPaymentMethod || "Stablecoin"} via ${fundData.subscriptionPaymentRail || "On-chain Wallet Transfer"}`;

  if (fundData.fundType === "Open-end") {
    return [
      {
        label: "Investor onboarding pack",
        status: taOps?.investorOnboardingStatus || "Pending",
        detail: "Investor KYC, wallet binding, and eligibility checks for launch and recurring dealing.",
      },
      {
        label: "Subscription funding route",
        status: fundingRoute,
        detail: `${fundData.cashConfirmationOwner || "Operations"} confirms incoming cash before transfer-agent booking. ${totalOrderCount} order item(s) currently sit in the operating queue.`,
      },
      {
        label: "Daily dealing batch",
        status: taOps?.orderBookStatus || `${totalOrderCount} order(s) in the current batch`,
        detail: "Subscription and redemption requests that the transfer agent reviews before NAV confirmation.",
      },
      {
        label: "Holder register version",
        status: taOps?.registerVersion || "Pending register version",
        detail: "The current transfer-agent ledger baseline used for booking unit movements.",
      },
      {
        label: "Ledger approval",
        status: taOps?.ledgerApprovalStatus || "Pending approval",
        detail: taOps?.ledgerApprovedAt
          ? `Most recent approval posted at ${taOps.ledgerApprovedAt}.`
          : "Waiting for the next transfer-agent booking approval.",
      },
    ];
  }

  return [
    {
      label: "Investor onboarding pack",
      status: taOps?.investorOnboardingStatus || "Pending",
      detail: "Professional investor checks and wallet eligibility used before allocation.",
    },
    {
      label: "Subscription funding route",
      status: fundingRoute,
      detail: `${fundData.cashConfirmationOwner || "Issuer"} confirms subscription cash before the transfer agent freezes the issuance book.`,
    },
    {
      label: "Subscription order book",
      status: taOps?.orderBookStatus || `${totalOrderCount} subscription order(s) collected`,
      detail: "The accepted book that will be frozen before allocation starts.",
    },
    {
      label: "Allocation workbook",
      status: taOps?.allocationBookStatus || "Pending calculation",
      detail: `${formatNumber(allocationPreview.totalAllocatedAmount, 2)} ${fundData.assetCurrency} currently projected for allocation.`,
    },
    {
      label: "Mint instruction",
      status: taOps?.mintInstructionStatus || "Pending final allocation",
      detail: "The file the transfer agent approves before the on-chain issuance step runs.",
    },
    {
      label: "Initial holder register",
      status: taOps?.ledgerApprovalStatus || "Pending ledger approval",
      detail: taOps?.registerVersion
        ? `Register version ${taOps.registerVersion} will become the post-issuance ledger baseline.`
        : "The initial holder register baseline will be published after booking completes.",
    },
  ];
}

function buildIssuanceLedgerRows(
  orders: FundOrder[],
  fundData: FundIssuance,
  allocationPreview: ReturnType<typeof buildAllocationPreview>,
) {
  if (fundData.fundType === "Closed-end") {
    const allocationReady = [
      "Calculated",
      "Allocate On Chain",
      "Allocation Completed",
      "Issuance Completed",
      "Issuance Active",
    ].includes(fundData.status);

    return allocationPreview.rows.map((row) => ({
      key: row.id,
      investorName: row.investorName,
      investorWallet: row.investorWallet,
      sourceObject: allocationReady ? "Final allocation workbook" : "Subscription order book",
      units: `${formatNumber(allocationReady ? row.allocatedUnits : row.requestedUnits, 2)} units`,
      registerEffect:
        fundData.status === "Open For Subscription"
          ? "Awaiting allocation freeze"
          : fundData.status === "Allocation Period"
            ? "Book frozen for TA review"
            : fundData.status === "Calculated"
              ? "Allocation approved, booking pending"
              : fundData.status === "Allocate On Chain"
                ? "Mint instruction in progress"
                : fundData.status === "Allocation Completed"
                  ? "Waiting final ledger sign-off"
                  : "Booked in initial holder register",
      taStatus:
        fundData.status === "Open For Subscription"
          ? "Monitoring"
          : fundData.status === "Allocation Period"
            ? "Validating"
            : fundData.status === "Calculated"
              ? "Approved"
              : fundData.status === "Allocate On Chain"
                ? "Executing"
                : fundData.status === "Allocation Completed"
                  ? "Signing off"
                  : "Published",
    }));
  }

  return orders.map((order) => {
    const checkpoint = getOrderTaCheckpoint(order);
    const isFiatSubscription = order.type === "subscription" && order.paymentMethod === "Fiat";
    return {
      key: order.id,
      investorName: order.investorName,
      investorWallet: order.investorWallet,
      sourceObject:
        order.type === "subscription"
          ? isFiatSubscription && order.paymentStatus !== "Funds Cleared"
            ? "Cash receipt review"
            : "Subscription batch"
          : "Redemption batch",
      units:
        order.type === "subscription"
          ? order.confirmedSharesOrCash || order.estimatedSharesOrCash
          : order.requestQuantity,
      registerEffect: checkpoint.registerEffect,
      taStatus: checkpoint.label,
    };
  });
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

function SubscriptionFundingCard({ fundData }: { fundData: FundIssuance }) {
  const bankTransferFunding = isFiatSubscriptionFunding(fundData);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Funding</CardTitle>
        <p className="text-sm text-muted-foreground">
          Separate the incoming cash leg from the unit-booking leg so issuer cash approval and
          transfer-agent ledger approval are both visible in the demo.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <div className="text-muted-foreground">Payment method</div>
            <div className="mt-1 font-medium">
              {fundData.subscriptionPaymentMethod || "Stablecoin"}
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-muted-foreground">Payment rail</div>
            <div className="mt-1 font-medium">
              {fundData.subscriptionPaymentRail || "On-chain Wallet Transfer"}
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-muted-foreground">Cash currency</div>
            <div className="mt-1 font-medium">
              {fundData.subscriptionCashCurrency || fundData.navCurrency}
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-muted-foreground">Cash confirmation owner</div>
            <div className="mt-1 font-medium">
              {fundData.cashConfirmationOwner || "Operations"}
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-muted-foreground">Settlement account type</div>
            <div className="mt-1 font-medium">
              {fundData.subscriptionSettlementAccountType || "Wallet"}
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-muted-foreground">Payment proof rule</div>
            <div className="mt-1 font-medium">
              {fundData.paymentProofRequired ? "Required before cash sign-off" : "Optional"}
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-secondary/20 p-4">
          <div className="text-muted-foreground">
            {bankTransferFunding ? "Issuer receiving account" : "Subscription collection wallet"}
          </div>
          <div className="mt-1 font-medium">
            {bankTransferFunding
              ? [
                  fundData.receivingBankName,
                  fundData.receivingBankAccountName,
                  fundData.receivingBankAccountNumberMasked,
                ]
                  .filter(Boolean)
                  .join(" / ") || "To be provided by issuer"
              : fundData.subscriptionCollectionWallet || "To be provided by issuer"}
          </div>
          {fundData.receivingBankSwiftCode && bankTransferFunding && (
            <div className="mt-1 text-muted-foreground">SWIFT / bank code: {fundData.receivingBankSwiftCode}</div>
          )}
          {fundData.paymentReferenceRule && (
            <div className="mt-2 text-muted-foreground">
              Payment reference rule: {fundData.paymentReferenceRule}
            </div>
          )}
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

type OrderAction = {
  label: string;
  nextStatus: FundOrder["status"];
  message?: string;
  updates?: Partial<FundOrder>;
};

function getNextOrderAction(
  order: FundOrder,
  fundData: FundIssuance,
): OrderAction | null {
  const manualConfirmation = fundData.orderConfirmationMethod === "Issuer review then confirm";
  const fiatSubscription =
    order.type === "subscription" &&
    (order.paymentMethod === "Fiat" ||
      (!order.paymentMethod && isFiatSubscriptionFunding(fundData)));

  if (
    fiatSubscription &&
    order.paymentStatus &&
    ["Pending Instruction", "Awaiting Payment", "Payment Proof Uploaded", "Funds Received"].includes(
      order.paymentStatus,
    )
  ) {
    return {
      label: "Confirm Funds Received",
      nextStatus:
        fundData.fundType === "Open-end"
          ? (manualConfirmation ? "Pending Review" : "Pending NAV")
          : ("Pending Review" as const),
      message: "Incoming subscription cash confirmed",
      updates: {
        paymentStatus: "Funds Cleared" as const,
        cashReceivedAt: order.cashReceivedAt || nowString(),
        cashConfirmedAt: nowString(),
        cashConfirmedBy: `${fundData.cashConfirmationOwner || "Issuer"} Desk`,
        unitBookingStatus: "Ready To Book" as const,
      },
    };
  }

  switch (order.status) {
    case "Submitted":
      return {
        label: "Queue for NAV",
        nextStatus: "Pending NAV" as const,
        message: "Order moved into the pricing queue",
      };
    case "Pending Review":
      return {
        label:
          fiatSubscription && order.paymentStatus === "Funds Cleared"
            ? "Approve For Booking"
            : "Approve",
        nextStatus: "Pending NAV" as const,
        message: "Order approved for the next booking stage",
      };
    case "Pending NAV":
      return {
        label:
          order.type === "subscription"
            ? fiatSubscription
              ? "Approve TA Booking"
              : "Confirm shares"
            : "Move to cash settle",
        nextStatus:
          order.type === "subscription"
            ? ("Confirmed" as const)
            : ("Pending Cash Settlement" as const),
        message:
          order.type === "subscription"
            ? fiatSubscription
              ? "Transfer-agent booking approved"
              : "Subscription units confirmed"
            : "Redemption moved into cash settlement",
        updates:
          order.type === "subscription"
            ? {
                confirmedNav: order.confirmedNav || fundData.currentNav,
                confirmedSharesOrCash:
                  order.confirmedSharesOrCash || order.estimatedSharesOrCash,
                confirmTime: nowString(),
                unitBookingStatus: "Booked" as const,
              }
            : {
                confirmTime: nowString(),
              },
      };
    case "Pending Cash Settlement":
      return {
        label: "Settle cash",
        nextStatus: "Completed" as const,
        message: "Cash settlement completed",
        updates: {
          settlementTime: nowString(),
          unitBookingStatus:
            order.type === "subscription" ? ("Settled" as const) : order.unitBookingStatus,
        },
      };
    case "Pending Confirmation":
      return {
        label: "Confirm",
        nextStatus: "Confirmed" as const,
        message: "Order confirmed",
        updates: {
          confirmedNav: order.confirmedNav || fundData.currentNav,
          confirmedSharesOrCash:
            order.confirmedSharesOrCash || order.estimatedSharesOrCash,
          confirmTime: nowString(),
          unitBookingStatus:
            order.type === "subscription" ? ("Booked" as const) : order.unitBookingStatus,
        },
      };
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
  fundData: FundIssuance,
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
          <TableHead>Payment</TableHead>
          <TableHead>Confirmed</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>TA Checkpoint</TableHead>
          <TableHead>Submit Time</TableHead>
          {!isMarketplaceView && <TableHead>Action</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => {
          const nextAction = getNextOrderAction(order, fundData);
          const taCheckpoint = getOrderTaCheckpoint(order);
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
              <TableCell>
                {order.type === "subscription" ? (
                  <div className="space-y-1">
                    <StatusBadge status={order.paymentStatus || "Pending Instruction"} />
                    <div className="text-xs text-muted-foreground">
                      {order.paymentMethod ||
                        fundData.subscriptionPaymentMethod ||
                        "Subscription funding pending"}
                    </div>
                    {order.paymentReference && (
                      <div className="max-w-[220px] truncate text-xs text-muted-foreground">
                        Ref: {order.paymentReference}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <div>{order.confirmedSharesOrCash || "Pending"}</div>
                {order.unitBookingStatus && (
                  <div className="text-xs text-muted-foreground">
                    Booking: {order.unitBookingStatus}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <StatusBadge status={order.status} />
              </TableCell>
              <TableCell>
                <div className="font-medium">{taCheckpoint.label}</div>
                <div className="max-w-[220px] text-xs text-muted-foreground">
                  {taCheckpoint.registerEffect}
                </div>
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
              colSpan={isMarketplaceView ? 9 : 10}
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
    updateFundOrder,
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
  const subscriptionFundingIsFiat = isFiatSubscriptionFunding(fundData);
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
  const issuanceTaOps = fundData.transferAgentOps;
  const issuanceResponsibilityItems = getIssuanceResponsibilityItems(fundData);
  const ledgerOrders = isMarketplaceView ? visibleOrders : allFundOrders;
  const issuanceLedgerRows = buildIssuanceLedgerRows(ledgerOrders, fundData, allocationPreview);
  const issuanceApprovalObjects = buildIssuanceApprovalObjects(
    fundData,
    ledgerOrders.length,
    allocationPreview,
  );
  const issuanceTaFields = isOpenEnd
    ? [
        {
          label: "Register timestamp",
          value:
            issuanceTaOps?.holderRegisterDate ||
            fundData.lastNavUpdateTime ||
            "Waiting for transfer-agent posting",
        },
        {
          label: "Register version",
          value: issuanceTaOps?.registerVersion || "Pending register version",
        },
        {
          label: "Investor onboarding",
          value: issuanceTaOps?.investorOnboardingStatus || "Pending onboarding review",
        },
        {
          label: "Funding route",
          value:
            `${fundData.subscriptionPaymentMethod || "Stablecoin"} via ${fundData.subscriptionPaymentRail || "On-chain Wallet Transfer"}`,
        },
        {
          label: "Cash confirmation owner",
          value: fundData.cashConfirmationOwner || "Operations",
        },
        {
          label: "Order book status",
          value: issuanceTaOps?.orderBookStatus || "Waiting for dealing batch lock",
        },
        {
          label: "Ledger approval",
          value: issuanceTaOps?.ledgerApprovalStatus || "Pending booking approval",
        },
        {
          label: "Last operator action",
          value:
            issuanceTaOps?.lastTransferAgentAction ||
            "Transfer agent has not logged an issuance action yet.",
        },
      ]
    : [
        {
          label: "Register timestamp",
          value:
            issuanceTaOps?.holderRegisterDate ||
            fundData.subscriptionEndDate ||
            "Waiting for book close",
        },
        {
          label: "Register version",
          value: issuanceTaOps?.registerVersion || "Pre-issuance register pending",
        },
        {
          label: "Investor onboarding",
          value: issuanceTaOps?.investorOnboardingStatus || "Pending onboarding review",
        },
        {
          label: "Funding route",
          value:
            `${fundData.subscriptionPaymentMethod || "Fiat"} via ${fundData.subscriptionPaymentRail || "Off-chain Bank Transfer"}`,
        },
        {
          label: "Cash confirmation owner",
          value: fundData.cashConfirmationOwner || "Issuer",
        },
        {
          label: "Order book status",
          value: issuanceTaOps?.orderBookStatus || "Subscription book pending",
        },
        {
          label: "Allocation workbook",
          value: issuanceTaOps?.allocationBookStatus || "Pending allocation review",
        },
        {
          label: "Mint instruction",
          value: issuanceTaOps?.mintInstructionStatus || "Pending allocation result",
        },
        {
          label: "Ledger approval",
          value: issuanceTaOps?.ledgerApprovalStatus || "Pending register sign-off",
        },
        {
          label: "Last operator action",
          value:
            issuanceTaOps?.lastTransferAgentAction ||
            "Transfer agent has not logged an issuance action yet.",
        },
      ];
  const issuanceTaChecklistItems = isOpenEnd
    ? [
        {
          label: "Investor onboarding reviewed",
          detail: issuanceTaOps?.investorOnboardingStatus
            ? `Current status: ${issuanceTaOps.investorOnboardingStatus}.`
            : "Waiting for transfer-agent onboarding review.",
          status:
            includesKeyword(issuanceTaOps?.investorOnboardingStatus, "confirmed") ||
            includesKeyword(issuanceTaOps?.investorOnboardingStatus, "reviewed")
              ? "done"
              : issuanceTaOps?.investorOnboardingStatus
                ? "attention"
                : "pending",
        },
        {
          label: "Daily batch locked",
          detail: issuanceTaOps?.orderBookStatus
            ? issuanceTaOps.orderBookStatus
            : "Waiting for dealing batch lock.",
          status:
            includesKeyword(issuanceTaOps?.orderBookStatus, "locked") ||
            includesKeyword(issuanceTaOps?.orderBookStatus, "servicing")
              ? "done"
              : issuanceTaOps?.orderBookStatus
                ? "attention"
                : "pending",
        },
        {
          label: "Ledger approval posted",
          detail: issuanceTaOps?.ledgerApprovalStatus
            ? `${issuanceTaOps.ledgerApprovalStatus}${issuanceTaOps.ledgerApprovedAt ? ` at ${issuanceTaOps.ledgerApprovedAt}` : ""}.`
            : "Waiting for transfer-agent booking approval.",
          status:
            includesKeyword(issuanceTaOps?.ledgerApprovalStatus, "posted") ||
            includesKeyword(issuanceTaOps?.ledgerApprovalStatus, "approved")
              ? "done"
              : issuanceTaOps?.ledgerApprovalStatus
                ? "attention"
                : "pending",
        },
        {
          label: "Register delta reconciled",
          detail:
            pendingSubscriptionOrders + pendingRedemptionOrders === 0
              ? "No pending daily dealing deltas remain."
              : `${pendingSubscriptionOrders + pendingRedemptionOrders} batch item(s) still require transfer-agent reconciliation.`,
          status:
            pendingSubscriptionOrders + pendingRedemptionOrders === 0
              ? "done"
              : "attention",
        },
      ]
    : [
        {
          label: "Investor onboarding reviewed",
          detail: issuanceTaOps?.investorOnboardingStatus
            ? `Current status: ${issuanceTaOps.investorOnboardingStatus}.`
            : "Waiting for transfer-agent onboarding review.",
          status:
            includesKeyword(issuanceTaOps?.investorOnboardingStatus, "reviewed") ||
            includesKeyword(issuanceTaOps?.investorOnboardingStatus, "confirmed")
              ? "done"
              : issuanceTaOps?.investorOnboardingStatus
                ? "attention"
                : "pending",
        },
        {
          label: "Subscription book controlled",
          detail: issuanceTaOps?.orderBookStatus
            ? issuanceTaOps.orderBookStatus
            : "Waiting for the book to close before TA review.",
          status:
            includesKeyword(issuanceTaOps?.orderBookStatus, "live") ||
            includesKeyword(issuanceTaOps?.orderBookStatus, "locked")
              ? "done"
              : issuanceTaOps?.orderBookStatus
                ? "attention"
                : "pending",
        },
        {
          label: "Allocation workbook approved",
          detail: issuanceTaOps?.allocationBookStatus
            ? issuanceTaOps.allocationBookStatus
            : "Waiting for allocation calculation and TA sign-off.",
          status:
            includesKeyword(issuanceTaOps?.allocationBookStatus, "approved") ||
            includesKeyword(issuanceTaOps?.allocationBookStatus, "prepared")
              ? "done"
              : issuanceTaOps?.allocationBookStatus
                ? "attention"
                : "pending",
        },
        {
          label: "Mint instruction approved",
          detail: issuanceTaOps?.mintInstructionStatus
            ? issuanceTaOps.mintInstructionStatus
            : "Mint instruction will be approved after final allocation.",
          status:
            includesKeyword(issuanceTaOps?.mintInstructionStatus, "approved") ||
            includesKeyword(issuanceTaOps?.mintInstructionStatus, "executing") ||
            includesKeyword(issuanceTaOps?.mintInstructionStatus, "pending")
              ? issuanceTaOps?.mintInstructionStatus
                ? "attention"
                : "pending"
              : "pending",
        },
        {
          label: "Initial register baseline published",
          detail: issuanceTaOps?.ledgerApprovalStatus
            ? `${issuanceTaOps.ledgerApprovalStatus}${issuanceTaOps.ledgerApprovedAt ? ` at ${issuanceTaOps.ledgerApprovedAt}` : ""}.`
            : "Waiting for final transfer-agent register sign-off.",
          status:
            includesKeyword(issuanceTaOps?.ledgerApprovalStatus, "approved") ||
            includesKeyword(issuanceTaOps?.ledgerApprovalStatus, "published") ||
            includesKeyword(issuanceTaOps?.ledgerApprovalStatus, "prepared")
              ? issuanceTaOps?.ledgerApprovalStatus &&
                (includesKeyword(issuanceTaOps.ledgerApprovalStatus, "published") ||
                  includesKeyword(issuanceTaOps.ledgerApprovalStatus, "approved"))
                ? "done"
                : "attention"
              : "pending",
        },
      ];

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
    const nextAction = getNextOrderAction(order, fundData);
    if (!nextAction) return;
    const updated = updateFundOrder(
      order.id,
      {
        status: nextAction.nextStatus,
        ...(nextAction.updates || {}),
      },
      "update",
    );
    if (!updated) return;
    toast.success(nextAction.message || `${order.id} moved to ${nextAction.nextStatus}`);
  };

  const handleSubscribeSuccess = ({
    amount,
    estimatedUnits,
    paymentReference,
  }: {
    amount: number;
    estimatedUnits: number;
    paymentReference?: string;
  }) => {
    const fundingMethod = fundData.subscriptionPaymentMethod || "Stablecoin";
    const awaitingFiatConfirmation = subscriptionFundingIsFiat;
    const added = addFundOrder({
      id: `sub-${Date.now()}`,
      fundId: fundData.id,
      investorId: currentInvestor.id,
      investorName: currentInvestor.name,
      investorWallet: currentInvestor.wallet,
      type: "subscription",
      requestAmount: `${formatNumber(amount, 2)} ${fundData.subscriptionCashCurrency || fundData.navCurrency}`,
      requestQuantity: `${formatNumber(estimatedUnits, 4)} units`,
      estimatedNav: fundData.currentNav,
      estimatedSharesOrCash: `${formatNumber(estimatedUnits, 4)} units`,
      submitTime: nowString(),
      status: awaitingFiatConfirmation
        ? "Submitted"
        : !isOpenEnd
          ? "Pending Review"
          : fundData.orderConfirmationMethod === "Issuer review then confirm"
            ? "Pending Review"
            : "Pending NAV",
      paymentMethod: fundingMethod,
      paymentStatus: awaitingFiatConfirmation ? (
        fundData.paymentProofRequired ? "Payment Proof Uploaded" : "Awaiting Payment"
      ) : "Funds Cleared",
      paymentReference:
        awaitingFiatConfirmation
          ? paymentReference
          : paymentReference || `${(fundData.tokenSymbol || "FUND").slice(0, 6).toUpperCase()}-${Date.now().toString().slice(-8)}`,
      payerAccountName: awaitingFiatConfirmation ? currentInvestor.name : undefined,
      paymentProofName: awaitingFiatConfirmation && fundData.paymentProofRequired
        ? "Investor remittance slip"
        : undefined,
      cashReceivedAt: awaitingFiatConfirmation ? undefined : nowString(),
      cashConfirmedBy: awaitingFiatConfirmation ? undefined : `${fundData.cashConfirmationOwner || "Operations"} Desk`,
      cashConfirmedAt: awaitingFiatConfirmation ? undefined : nowString(),
      unitBookingStatus: awaitingFiatConfirmation ? "Pending" : "Ready To Book",
      note:
        awaitingFiatConfirmation
          ? `Created from marketplace ${fundData.fundType === "Open-end" ? "open-end" : "closed-end"} subscription modal. Waiting for ${fundData.cashConfirmationOwner || "issuer"} cash confirmation before TA booking.`
          : fundData.fundType === "Open-end"
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

      <div className="mb-8">
        <WorkflowResponsibilityCard
          title={isOpenEnd ? "Open-end Lifecycle Responsibility Map" : "Closed-end Lifecycle Responsibility Map"}
          description={
            isOpenEnd
              ? "The transfer agent is now explicit in launch booking, daily dealing batches, and holder-register updates."
              : "The transfer agent is now explicit in investor validation, allocation approval, mint-file sign-off, and holder-register publication."
          }
          items={issuanceResponsibilityItems}
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

          <TransferAgentOperationsCard
            description={
              isOpenEnd
                ? "This panel shows what the transfer agent controls during launch and recurring dealing: onboarding, batch approval, and holder-register posting."
                : "This panel shows what the transfer agent controls during closed-end issuance: investor onboarding, allocation approval, mint-file sign-off, and the initial holder register."
            }
            operatorName={
              issuanceTaOps?.transferAgentName ||
              (isOpenEnd ? "WeBank Transfer Agent Desk" : "Harbor Registry Services")
            }
            status={
              issuanceTaOps?.transferAgentStatus ||
              (isOpenEnd ? "Daily Register Maintenance" : "Pre-Issuance Register Review")
            }
            fields={issuanceTaFields}
          />

          <TransferAgentChecklistCard
            description="These controls make the transfer-agent approvals and ledger checkpoints explicit inside the issuance lifecycle."
            items={[...issuanceTaChecklistItems]}
          />

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
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="information">Information</TabsTrigger>
                <TabsTrigger value="dealing">Dealing</TabsTrigger>
                <TabsTrigger value="ta-ledger">TA Ledger</TabsTrigger>
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

                <SubscriptionFundingCard fundData={fundData} />
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

              <TabsContent value="ta-ledger" className="space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                  <MetricCard
                    icon={ShieldCheck}
                    label="Register Version"
                    value={issuanceTaOps?.registerVersion || "Pending"}
                    variant="primary"
                  />
                  <MetricCard
                    icon={RefreshCcw}
                    label="Ledger Rows"
                    value={issuanceLedgerRows.length}
                    variant="default"
                  />
                  <MetricCard
                    icon={ArrowRightLeft}
                    label="Pending TA Items"
                    value={pendingSubscriptionOrders + pendingRedemptionOrders}
                    variant="warning"
                  />
                  <MetricCard
                    icon={Clock3}
                    label="Last TA Posting"
                    value={issuanceTaOps?.holderRegisterDate?.split(" ")[0] || "Pending"}
                    variant="success"
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Transfer Agent Approved Data Objects</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    {issuanceApprovalObjects.map((item) => (
                      <div key={item.label} className="rounded-lg border p-4 text-sm">
                        <div className="text-muted-foreground">{item.label}</div>
                        <div className="mt-1 font-medium">{item.status}</div>
                        <div className="mt-2 text-muted-foreground">{item.detail}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Register Update Queue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Investor</TableHead>
                          <TableHead>Source Object</TableHead>
                          <TableHead>Units / Cash</TableHead>
                          <TableHead>Register Effect</TableHead>
                          <TableHead>TA Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {issuanceLedgerRows.map((row) => (
                          <TableRow key={row.key}>
                            <TableCell>
                              <div className="font-medium">{row.investorName}</div>
                              <div className="max-w-[220px] truncate text-xs text-muted-foreground">
                                {row.investorWallet}
                              </div>
                            </TableCell>
                            <TableCell>{row.sourceObject}</TableCell>
                            <TableCell>{row.units}</TableCell>
                            <TableCell>{row.registerEffect}</TableCell>
                            <TableCell>{row.taStatus}</TableCell>
                          </TableRow>
                        ))}
                        {issuanceLedgerRows.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                              No transfer-agent ledger rows are available yet.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
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
                      fundData,
                      isMarketplaceView,
                      handleOrderAdvance,
                      manageOrderPermission.allowed,
                      manageOrderPermission.reason,
                    )}
                  </TabsContent>
                  <TabsContent value="redemption">
                    {renderOrderTable(
                      redemptionOrders,
                      fundData,
                      isMarketplaceView,
                      handleOrderAdvance,
                      manageOrderPermission.allowed,
                      manageOrderPermission.reason,
                    )}
                  </TabsContent>
                  <TabsContent value="buyers">
                    {renderBuyerTable(
                      subscriptionOrders,
                      fundData.subscriptionCashCurrency || fundData.navCurrency,
                    )}
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
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="information">Information</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="ta-ledger">TA Ledger</TabsTrigger>
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
                    {subscriptionFundingIsFiat
                      ? ` The cash leg must be confirmed by ${fundData.cashConfirmationOwner || "the issuer"} before the transfer agent books any units.`
                      : ""}
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

                  <SubscriptionFundingCard fundData={fundData} />
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

              <TabsContent value="ta-ledger" className="space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                  <MetricCard
                    icon={ShieldCheck}
                    label="Register Version"
                    value={issuanceTaOps?.registerVersion || "Pending"}
                    variant="primary"
                  />
                  <MetricCard
                    icon={RefreshCcw}
                    label="Ledger Rows"
                    value={issuanceLedgerRows.length}
                    variant="default"
                  />
                  <MetricCard
                    icon={Wallet}
                    label="Projected Allocation"
                    value={formatNumber(allocationPreview.totalAllocatedAmount)}
                    suffix={fundData.assetCurrency}
                    variant="success"
                  />
                  <MetricCard
                    icon={Clock3}
                    label="Last TA Posting"
                    value={issuanceTaOps?.holderRegisterDate?.split(" ")[0] || "Pending"}
                    variant="warning"
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Transfer Agent Approved Data Objects</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    {issuanceApprovalObjects.map((item) => (
                      <div key={item.label} className="rounded-lg border p-4 text-sm">
                        <div className="text-muted-foreground">{item.label}</div>
                        <div className="mt-1 font-medium">{item.status}</div>
                        <div className="mt-2 text-muted-foreground">{item.detail}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Initial Holder Register Queue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Investor</TableHead>
                          <TableHead>Source Object</TableHead>
                          <TableHead>Units</TableHead>
                          <TableHead>Register Effect</TableHead>
                          <TableHead>TA Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {issuanceLedgerRows.map((row) => (
                          <TableRow key={row.key}>
                            <TableCell>
                              <div className="font-medium">{row.investorName}</div>
                              <div className="max-w-[220px] truncate text-xs text-muted-foreground">
                                {row.investorWallet}
                              </div>
                            </TableCell>
                            <TableCell>{row.sourceObject}</TableCell>
                            <TableCell>{row.units}</TableCell>
                            <TableCell>{row.registerEffect}</TableCell>
                            <TableCell>{row.taStatus}</TableCell>
                          </TableRow>
                        ))}
                        {issuanceLedgerRows.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                              No transfer-agent holder-register rows are available yet.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
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
                      fundData,
                      isMarketplaceView,
                      handleOrderAdvance,
                      manageOrderPermission.allowed,
                      manageOrderPermission.reason,
                    )}
                  </TabsContent>

                  <TabsContent value="buyers">
                    {renderBuyerTable(
                      subscriptionOrders,
                      fundData.subscriptionCashCurrency || fundData.navCurrency,
                    )}
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
