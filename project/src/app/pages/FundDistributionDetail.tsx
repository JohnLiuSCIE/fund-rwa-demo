import { useEffect, useRef, useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { CheckCircle2, ChevronRight, CircleDashed, Copy, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";
import { FundDistributionWorkflow, type WorkflowStepTiming } from "../components/FundIssuanceWorkflow";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  TransferAgentChecklistCard,
  TransferAgentOperationsCard,
} from "../components/TransferAgentPanels";
import {
  OperationActionModal,
  type ActionModalDetailGroup,
  type ActionModalImpactBadge,
  type ActionModalStep,
  type ActionModalSummaryItem,
} from "../components/modals/OperationActionModal";
import { FundDistribution, FundOrder } from "../data/fundDemoData";
import { cn } from "../components/ui/utils";

type DistributionTab = "overview" | "recipients" | "payout" | "manual";
type DistributionActionImpactType = "internal" | "ta" | "onchain" | "hybrid";
type WorkflowActionOwner = "maker" | "checker";

interface DistributionViewLink {
  label: string;
  tab: DistributionTab;
}

interface DistributionWorkflowActionConfig {
  label: string;
  actionOwner: WorkflowActionOwner;
  nextStatus: string;
  message: string;
  variant: "default" | "outline";
  modalTitle: string;
  modalDescription: string;
  modalSteps: ActionModalStep[];
  impactType: DistributionActionImpactType;
  impactBadges: ActionModalImpactBadge[];
  nextStepHint: string;
  affectedObjects: string[];
  previewSummary: ActionModalSummaryItem[];
  previewDetails: ActionModalDetailGroup[];
  viewLinks: DistributionViewLink[];
}

type DistributionEditableSection = "details" | "payout";

interface DistributionEditState {
  name: string;
  description: string;
  distributionRateType: string;
  distributionRate: string;
  distributionUnit: string;
  payoutMode: "Direct Transfer" | "Claim";
  payoutToken: string;
  payoutAccount: string;
  recordDate: string;
  paymentDate: string;
  actualDaysInPeriod: string;
  actualDaysInYear: string;
}

function toDateTimeLocal(value?: string) {
  return value ? value.slice(0, 16).replace(" ", "T") : "";
}

function fromDateTimeLocal(value: string) {
  return value ? `${value.replace("T", " ")}:00` : undefined;
}

function formatWorkflowTiming(value?: string) {
  const match = value?.match(/\d{4}-\d{2}-\d{2}/);
  if (!match) return undefined;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${match[0]}T00:00:00`));
}

function getEditableDistributionSections(status: string): DistributionEditableSection[] {
  if (["Draft", "Pending Approval", "Pending Listing", "Upcoming"].includes(status)) {
    return ["details", "payout"];
  }
  if (["Snapshot Locked", "Pending Allocation", "Put On Chain", "Open For Distribution"].includes(status)) {
    return ["payout"];
  }
  return [];
}

function getDistributionEditingPolicyMessage(status: string) {
  const editableSections = getEditableDistributionSections(status);
  if (editableSections.length === 0) {
    return "This stage is locked. After distribution is completed, fields become read-only.";
  }
  if (editableSections.length === 2) {
    return "Current stage allows full editing of distribution details and distribution routing.";
  }
  return "Current stage only allows distribution-route updates. Core distribution details are locked.";
}

function getEditableDistributionFieldLabels(status: string) {
  const editableSections = getEditableDistributionSections(status);
  const labels: string[] = [];

  if (editableSections.includes("details")) {
    labels.push("distribution identity", "description", "record date", "payment date");
  }

  if (editableSections.includes("payout")) {
    labels.push("distribution mode", "distribution token", "distribution account", "rate mechanics", "day-count basis");
  }

  return labels;
}

function buildDistributionControlChecks(distribution: FundDistribution, linkedFundStatus?: string) {
  const paymentAfterRecord =
    !distribution.recordDate ||
    !distribution.paymentDate ||
    new Date(distribution.paymentDate).getTime() >= new Date(distribution.recordDate).getTime();

  return [
    {
      label: "Linked fund is beyond draft onboarding",
      ok: Boolean(linkedFundStatus) && !["Draft", "Pending Approval"].includes(linkedFundStatus),
      detail: linkedFundStatus || "Linked fund missing",
    },
    {
      label: "Record and payment dates are set",
      ok: Boolean(distribution.recordDate) && Boolean(distribution.paymentDate),
      detail: `${distribution.recordDate || "record date missing"} / ${distribution.paymentDate || "payment date missing"}`,
    },
    {
      label: "Payment date follows record date",
      ok: paymentAfterRecord,
      detail: paymentAfterRecord ? "Date ordering is valid" : "Payment date is earlier than record date",
    },
    {
      label: "Distribution route is defined",
      ok: Boolean(distribution.payoutToken) && Boolean(distribution.payoutAccount),
      detail: `${distribution.payoutToken || "token missing"} / ${distribution.payoutAccount || "account missing"}`,
    },
    {
      label: "Distribution economics are configured",
      ok: Boolean(distribution.distributionRate) && Boolean(distribution.distributionRateType),
      detail: distribution.distributionRate
        ? `${distribution.distributionRate} ${distribution.distributionRateType || ""}`
        : "Rate missing",
    },
    {
      label: "Day-count basis is complete",
      ok: Boolean(distribution.actualDaysInPeriod) && Boolean(distribution.actualDaysInYear),
      detail: `${distribution.actualDaysInPeriod || "period missing"} / ${distribution.actualDaysInYear || "year missing"}`,
    },
  ];
}

function parseLeadingNumber(value?: string) {
  if (!value) return 0;
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

function buildDistributionRecipients(
  distribution: FundDistribution,
  linkedFund: { shareClass?: string; currentNav?: string; initialNav?: string; assetCurrency?: string } | undefined,
  fundOrders: FundOrder[],
) {
  const orders = fundOrders.filter((order) => order.fundId === distribution.fundId);
  const holders = new Map<
    string,
    {
      investorId: string;
      investorName: string;
      investorWallet: string;
      category: string;
      shareClass: string;
      eligibleUnits: number;
      estimatedPayout: number;
    }
  >();

  orders.forEach((order) => {
    const existing = holders.get(order.investorId) || {
      investorId: order.investorId,
      investorName: order.investorName,
      investorWallet: order.investorWallet,
      category: getInvestorCategory(order),
      shareClass: linkedFund?.shareClass || "Class A",
      eligibleUnits: 0,
      estimatedPayout: 0,
    };

    const units =
      parseLeadingNumber(order.confirmedSharesOrCash) ||
      parseLeadingNumber(order.estimatedSharesOrCash) ||
      parseLeadingNumber(order.requestQuantity);

    if (order.type === "subscription" && order.status !== "Rejected") {
      existing.eligibleUnits += units;
    }

    if (order.type === "redemption" && order.status !== "Rejected") {
      existing.eligibleUnits -= parseLeadingNumber(order.requestQuantity);
    }

    holders.set(order.investorId, existing);
  });

  const baseNav =
    parseLeadingNumber(distribution.initialNav) ||
    parseLeadingNumber(linkedFund?.currentNav) ||
    parseLeadingNumber(linkedFund?.initialNav);
  const distributionRate = parseLeadingNumber(distribution.distributionRate);

  const excludedInvestorIds = new Set(distribution.manualExcludedInvestorIds || []);
  const rows = Array.from(holders.values())
    .map((holder) => {
      const eligibleUnits = Math.max(holder.eligibleUnits, 0);
      const estimatedPayout =
        distribution.distributionRateType === "Per Unit"
          ? eligibleUnits * distributionRate
          : eligibleUnits * baseNav * (distributionRate / 100);

      return {
        ...holder,
        eligibleUnits,
        estimatedPayout,
      };
    })
    .filter((holder) => holder.eligibleUnits > 0 && !excludedInvestorIds.has(holder.investorId));

  const categoryBreakdown = Array.from(
    rows.reduce((map, row) => {
      const current = map.get(row.category) || {
        category: row.category,
        holderCount: 0,
        eligibleUnits: 0,
        estimatedPayout: 0,
      };
      current.holderCount += 1;
      current.eligibleUnits += row.eligibleUnits;
      current.estimatedPayout += row.estimatedPayout;
      map.set(row.category, current);
      return map;
    }, new Map<string, { category: string; holderCount: number; eligibleUnits: number; estimatedPayout: number }>()),
  ).map(([, value]) => value);

  return {
    rows,
    categoryBreakdown,
    totalRecipients: rows.length,
    totalEligibleUnits: rows.reduce((sum, row) => sum + row.eligibleUnits, 0),
    totalEstimatedPayout: rows.reduce((sum, row) => sum + row.estimatedPayout, 0),
  };
}

function formatDistributionNumber(value: number, digits = 2) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value);
}

function buildDistributionImpactBadges({
  requiresTa,
  requiresOnChain,
}: {
  requiresTa: boolean;
  requiresOnChain: boolean;
}) {
  const badges: ActionModalImpactBadge[] = [{ label: "Identity Required", kind: "identity" }];

  if (requiresTa) {
    badges.push({ label: "Notify TA", kind: "ta" });
  }

  if (requiresOnChain) {
    badges.push({ label: "On-chain Update", kind: "onchain" });
  }

  return badges;
}

function getActionOwnerBadgeClasses(actionOwner: WorkflowActionOwner) {
  return actionOwner === "checker"
    ? "border-amber-200 bg-amber-50 text-amber-700"
    : "border-slate-200 bg-slate-50 text-slate-700";
}

function getActionButtonClasses(
  actionOwner: WorkflowActionOwner,
  variant: "default" | "outline",
) {
  if (actionOwner !== "checker") return "";
  return variant === "outline"
    ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:text-amber-900"
    : "bg-amber-500 text-white hover:bg-amber-600";
}

function buildDistributionModalFlow({
  reviewTitle,
  reviewDescription,
  identityDescription,
  workflowTitle,
  workflowDescription,
  taTitle,
  taDescription,
  onChainTitle,
  onChainDescription,
  successTitle,
  successDescription,
  requiresTa,
  requiresOnChain,
}: {
  reviewTitle: string;
  reviewDescription: string;
  identityDescription: string;
  workflowTitle: string;
  workflowDescription: string;
  taTitle?: string;
  taDescription?: string;
  onChainTitle?: string;
  onChainDescription?: string;
  successTitle: string;
  successDescription: string;
  requiresTa: boolean;
  requiresOnChain: boolean;
}) {
  const steps: ActionModalStep[] = [
    {
      label: "Review",
      title: reviewTitle,
      description: reviewDescription,
      state: "review",
      kind: "review",
    },
    {
      label: "Identity",
      title: "Verify Identity",
      description: identityDescription,
      state: "loading",
      kind: "identity",
    },
  ];

  if (requiresTa) {
    steps.push({
      label: "TA",
      title: taTitle || "Notify Transfer Agent",
      description:
        taDescription || "Transfer-agent instructions are being posted to the operating queue.",
      state: "loading",
      kind: "ta",
    });
  }

  if (requiresOnChain) {
    steps.push({
      label: "On-chain",
      title: onChainTitle || "Execute On-chain Update",
      description:
        onChainDescription || "The smart-contract update is being executed on chain.",
      state: "loading",
      kind: "onchain",
    });
  }

  if (!requiresTa && !requiresOnChain) {
    steps.push({
      label: "Workflow",
      title: workflowTitle,
      description: workflowDescription,
      state: "loading",
      kind: "identity",
    });
  }

  steps.push({
    label: "Completed",
    title: successTitle,
    description: successDescription,
    state: "success",
    kind: "success",
  });

  return steps;
}

function getDistributionActionPanelSurfaceClasses(impactType: DistributionActionImpactType) {
  switch (impactType) {
    case "ta":
      return "border-teal-200 bg-teal-50/70";
    case "onchain":
      return "border-cyan-200 bg-cyan-50/70";
    case "hybrid":
      return "border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-teal-50";
    case "internal":
    default:
      return "border-slate-200 bg-slate-50/80";
  }
}

function DistributionNextActionPanel({
  action,
  currentStatus,
  disabled,
  disabledReason,
  onOpen,
  onViewMore,
}: {
  action: DistributionWorkflowActionConfig;
  currentStatus: string;
  disabled: boolean;
  disabledReason?: string;
  onOpen: () => void;
  onViewMore: (link: DistributionViewLink) => void;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 shadow-sm",
        getDistributionActionPanelSurfaceClasses(action.impactType),
      )}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <div className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
              Next Action
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
              <span>{currentStatus}</span>
              <span className="text-slate-400">-&gt;</span>
              <span>{action.nextStatus}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {action.impactBadges.map((badge) => (
              <Badge
                key={`${badge.kind}-${badge.label}`}
                variant="outline"
                className={
                  badge.kind === "ta"
                    ? "border-teal-200 bg-teal-50 text-teal-700"
                    : badge.kind === "onchain"
                      ? "border-cyan-200 bg-cyan-50 text-cyan-700"
                      : "border-slate-200 bg-slate-50 text-slate-700"
                }
              >
                {badge.label}
              </Badge>
            ))}
            <Badge
              variant="outline"
              className={getActionOwnerBadgeClasses(action.actionOwner)}
            >
              {action.actionOwner === "checker" ? "Checker Action" : "Maker Action"}
            </Badge>
          </div>

          <div className="text-sm text-muted-foreground">{action.nextStepHint}</div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {action.previewSummary.map((item) => (
              <div key={item.label} className="rounded-lg border bg-white/90 p-3">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </div>
                <div className="mt-1 text-sm font-medium text-foreground">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Affected Objects
            </div>
            <div className="flex flex-wrap gap-2">
              {action.affectedObjects.map((item) => (
                <div
                  key={item}
                  className="rounded-full border border-white/80 bg-white/90 px-3 py-1 text-xs font-medium text-slate-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          {action.viewLinks.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                View More
              </div>
              <div className="flex flex-wrap gap-2">
                {action.viewLinks.map((link) => (
                  <Button
                    key={`${link.tab}-${link.label}`}
                    type="button"
                    size="sm"
                    variant="outline"
                    className="bg-white/90"
                    onClick={() => onViewMore(link)}
                  >
                    {link.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="xl:w-56 xl:shrink-0">
          <Button
            type="button"
            variant={action.variant}
            className={cn(
              "w-full",
              getActionButtonClasses(action.actionOwner, action.variant),
            )}
            disabled={disabled}
            title={disabled ? disabledReason : undefined}
            onClick={onOpen}
          >
            {action.label}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface DistributionActionContext {
  distribution: FundDistribution;
  linkedFund?: {
    name: string;
    status: string;
    assetCurrency?: string;
    fundType?: string;
  };
  eventLabel: string;
  eventLabelLower: string;
  isClaimMode: boolean;
  canManualOverride: boolean;
  recipientPreview: ReturnType<typeof buildDistributionRecipients>;
  allRecipients: ReturnType<typeof buildDistributionRecipients>;
  manuallyExcludedRecipients: ReturnType<typeof buildDistributionRecipients>["rows"];
  transferAgentOps?: FundDistribution["transferAgentOps"];
}

function getDistributionPermissionAction(status: string) {
  const actionByStatus: Record<string, string> = {
    Draft: "submit",
    "Pending Approval": "approve",
    "Pending Listing": "list",
    Upcoming: "open",
    "Snapshot Locked": "update",
    "Pending Allocation": "put_on_chain",
    "Put On Chain": "open",
    "Open For Distribution": "update",
    Reconciled: "update",
  };

  return actionByStatus[status] || "update";
}

function buildDistributionActionConfig({
  label,
  actionOwner,
  nextStatus,
  message,
  variant = "default",
  modalTitle,
  modalDescription,
  reviewTitle,
  reviewDescription,
  identityDescription,
  workflowTitle,
  workflowDescription,
  taTitle,
  taDescription,
  onChainTitle,
  onChainDescription,
  successTitle,
  successDescription,
  impactType,
  requiresTa,
  requiresOnChain,
  nextStepHint,
  affectedObjects,
  previewSummary,
  previewDetails = [],
  viewLinks = [],
}: {
  label: string;
  actionOwner?: WorkflowActionOwner;
  nextStatus: string;
  message: string;
  variant?: "default" | "outline";
  modalTitle: string;
  modalDescription: string;
  reviewTitle: string;
  reviewDescription: string;
  identityDescription: string;
  workflowTitle: string;
  workflowDescription: string;
  taTitle?: string;
  taDescription?: string;
  onChainTitle?: string;
  onChainDescription?: string;
  successTitle: string;
  successDescription: string;
  impactType: DistributionActionImpactType;
  requiresTa: boolean;
  requiresOnChain: boolean;
  nextStepHint: string;
  affectedObjects: string[];
  previewSummary: ActionModalSummaryItem[];
  previewDetails?: ActionModalDetailGroup[];
  viewLinks?: DistributionViewLink[];
}): DistributionWorkflowActionConfig {
  return {
    label,
    actionOwner: actionOwner || "maker",
    nextStatus,
    message,
    variant,
    modalTitle,
    modalDescription,
    modalSteps: buildDistributionModalFlow({
      reviewTitle,
      reviewDescription,
      identityDescription,
      workflowTitle,
      workflowDescription,
      taTitle,
      taDescription,
      onChainTitle,
      onChainDescription,
      successTitle,
      successDescription,
      requiresTa,
      requiresOnChain,
    }),
    impactType,
    impactBadges: buildDistributionImpactBadges({ requiresTa, requiresOnChain }),
    nextStepHint,
    affectedObjects,
    previewSummary,
    previewDetails,
    viewLinks,
  };
}

function getStructuredDistributionAction(
  distribution: FundDistribution,
  context: DistributionActionContext,
): DistributionWorkflowActionConfig | null {
  const currency =
    distribution.payoutToken ||
    distribution.distributionUnit ||
    context.linkedFund?.assetCurrency ||
    "Unit";
  const topRecipientItems =
    context.recipientPreview.rows.length > 0
      ? context.recipientPreview.rows.slice(0, 3).map(
          (recipient) =>
            `${recipient.investorName} - ${formatDistributionNumber(recipient.estimatedPayout)} ${currency}`,
        )
      : ["No active recipient rows are available yet."];
  const excludedRecipientItems =
    context.manuallyExcludedRecipients.length > 0
      ? context.manuallyExcludedRecipients.slice(0, 3).map(
          (recipient) =>
            `${recipient.investorName} - ${formatDistributionNumber(recipient.estimatedPayout)} ${currency}`,
        )
      : ["No recipient records have been manually excluded."];
  const taStatusItems = [
    `Snapshot: ${context.transferAgentOps?.holderSnapshotId || "Pending lock"}`,
    `Recipient list: ${context.transferAgentOps?.recipientListStatus || "Pending generation"}`,
    `Funding check: ${context.transferAgentOps?.fundingCheckStatus || "Pending funding confirmation"}`,
    `Reconciliation: ${context.transferAgentOps?.reconciliationStatus || "Pending"}`,
  ];

  switch (distribution.status) {
    case "Draft":
      return buildDistributionActionConfig({
        label: `Submit ${context.eventLabel} For Approval`,
        nextStatus: "Pending Approval",
        message: `${context.eventLabel} submitted for approval`,
        modalTitle: `Submit ${context.eventLabel} For Approval`,
        modalDescription:
          "Review the event timetable and payout routing before routing the draft into approval.",
        reviewTitle: `Review ${context.eventLabel} Draft`,
        reviewDescription:
          "Confirm the linked fund, event dates, payout route, and rate mechanics before submission.",
        identityDescription:
          "Issuer identity and distribution workflow authority are being verified.",
        workflowTitle: "Submit Approval Request",
        workflowDescription:
          "The event setup is being routed into the approval workflow.",
        successTitle: `${context.eventLabel} submitted`,
        successDescription:
          "The event is now waiting for approval review.",
        impactType: "internal",
        requiresTa: false,
        requiresOnChain: false,
        nextStepHint:
          "This action routes the event into approval review without notifying TA or posting an on-chain update.",
        affectedObjects: ["Approval request", "Event timetable", "Payout configuration"],
        previewSummary: [
          { label: "Linked Fund", value: context.linkedFund?.name || distribution.fundName || "Fund pending" },
          { label: "Record Date", value: distribution.recordDate || "Pending" },
          { label: "Payment Date", value: distribution.paymentDate || "Pending" },
          { label: "Payout Mode", value: distribution.payoutMode || "Claim" },
          {
            label: `${context.eventLabel} Rate`,
            value: distribution.distributionRate
              ? `${distribution.distributionRate}${distribution.distributionRateType === "Fixed Rate" ? "%" : ` ${distribution.distributionUnit || ""}`}`
              : "Pending rate",
          },
        ],
        previewDetails: [
          {
            title: "Routing Package",
            items: [
              `Treasury route: ${distribution.payoutAccount || "Pending treasury account"}`,
              `Payout token: ${distribution.payoutToken || distribution.distributionUnit || "Pending token"}`,
              `Day-count basis: ${distribution.actualDaysInPeriod || "Pending"} / ${distribution.actualDaysInYear || "Pending"}`,
            ],
          },
        ],
        viewLinks: [{ label: "View Recipients", tab: "recipients" }],
      });
    case "Pending Approval":
      return buildDistributionActionConfig({
        label: context.eventLabel === "Dividend" ? `Approve ${context.eventLabel}` : "Approve Distribution",
        actionOwner: "checker",
        nextStatus: "Pending Listing",
        message: `${context.eventLabel} approved and moved into notice preparation`,
        modalTitle: `Approve ${context.eventLabel}`,
        modalDescription:
          "Verify checker identity before moving the approved event into notice preparation.",
        reviewTitle: "Review Approved Event",
        reviewDescription:
          "Confirm the event economics, dates, and payout route are ready for notice preparation.",
        identityDescription:
          "Checker identity and approval authority are being verified.",
        workflowTitle: "Advance To Notice Preparation",
        workflowDescription:
          "The event is being advanced into the notice-preparation stage.",
        successTitle: `${context.eventLabel} approved`,
        successDescription:
          "The event is now ready for notice publication.",
        impactType: "internal",
        requiresTa: false,
        requiresOnChain: false,
        nextStepHint:
          "This action completes internal approval and moves the event into notice preparation.",
        affectedObjects: ["Approval memo", "Notice preparation record", "Distribution control pack"],
        previewSummary: [
          { label: "Current Status", value: distribution.status },
          { label: "Next Status", value: "Pending Listing" },
          { label: "Transfer Agent", value: context.transferAgentOps?.transferAgentName || "Transfer Agent pending" },
          { label: "Payout Token", value: distribution.payoutToken || distribution.distributionUnit || "Pending" },
        ],
        viewLinks: [{ label: "View Recipients", tab: "recipients" }],
      });
    case "Pending Listing":
      return buildDistributionActionConfig({
        label: context.eventLabel === "Dividend" ? "Publish Dividend Notice" : "Publish Notice",
        nextStatus: "Upcoming",
        message: `${context.eventLabel} notice published`,
        modalTitle: `Publish ${context.eventLabel} Notice`,
        modalDescription:
          "Review the notice package before notifying TA and publishing the event timetable.",
        reviewTitle: "Review Notice Package",
        reviewDescription:
          "Confirm the record date, payment date, and distribution route before the notice goes live.",
        identityDescription:
          "Issuer identity and notice-publication authority are being verified.",
        workflowTitle: "Publish Notice",
        workflowDescription:
          "The notice package is being posted to the operating workflow.",
        taTitle: "Notify Transfer Agent",
        taDescription:
          "Transfer-agent teams are being notified to prepare the holder register and event calendar.",
        successTitle: "Notice published",
        successDescription:
          "The event has entered its notice period and is awaiting the record-date snapshot.",
        impactType: "ta",
        requiresTa: true,
        requiresOnChain: false,
        nextStepHint:
          "This action publishes the event notice and notifies TA to align the record-date and payout timetable.",
        affectedObjects: ["Notice package", "TA operating calendar", "Record-date timetable"],
        previewSummary: [
          { label: "Record Date", value: distribution.recordDate || "Pending" },
          { label: "Payment Date", value: distribution.paymentDate || "Pending" },
          { label: "Payout Mode", value: distribution.payoutMode || "Claim" },
          { label: "Transfer Agent", value: context.transferAgentOps?.transferAgentName || "Transfer Agent pending" },
        ],
        previewDetails: [{ title: "TA Intake", kind: "ta", items: taStatusItems }],
        viewLinks: [
          { label: "View Overview", tab: "overview" },
          { label: "View Recipients", tab: "recipients" },
        ],
      });
    case "Upcoming":
      return buildDistributionActionConfig({
        label: "Lock Snapshot",
        nextStatus: "Snapshot Locked",
        message: "Distribution holder snapshot locked",
        modalTitle: `Lock ${context.eventLabel} Snapshot`,
        modalDescription:
          "Review the current holder roster before sending the snapshot-lock instruction to TA.",
        reviewTitle: "Review Snapshot Lock",
        reviewDescription:
          "Confirm the event is ready to freeze the holder register for record-date entitlement.",
        identityDescription:
          "Issuer identity and snapshot-lock authority are being verified.",
        workflowTitle: "Post Snapshot Lock",
        workflowDescription:
          "The holder-register lock request is being posted to the TA operating queue.",
        taTitle: "Lock Holder Snapshot",
        taDescription:
          "The transfer agent is freezing the record-date holder snapshot for entitlement generation.",
        successTitle: "Snapshot locked",
        successDescription:
          "The event has moved into snapshot-controlled entitlement preparation.",
        impactType: "ta",
        requiresTa: true,
        requiresOnChain: false,
        nextStepHint:
          "This action notifies TA to freeze the holder register and create the record-date snapshot.",
        affectedObjects: ["Holder snapshot", "Record-date register", "Snapshot lock instruction"],
        previewSummary: [
          { label: "Active Recipients", value: `${context.recipientPreview.totalRecipients}` },
          { label: "Eligible Units", value: `${formatDistributionNumber(context.recipientPreview.totalEligibleUnits, 2)} units` },
          { label: "Estimated Payout", value: `${formatDistributionNumber(context.recipientPreview.totalEstimatedPayout)} ${currency}` },
          { label: "Manual Overrides", value: `${context.manuallyExcludedRecipients.length} excluded` },
        ],
        previewDetails: [
          { title: "Recipient Preview", kind: "ta", items: topRecipientItems },
          { title: "Manual Exclusions", kind: "ta", items: excludedRecipientItems },
        ],
        viewLinks: [
          { label: "View Recipients", tab: "recipients" },
          ...(context.canManualOverride
            ? [{ label: "Open Manual Override", tab: "manual" as const }]
            : []),
        ],
      });
    case "Snapshot Locked":
      return buildDistributionActionConfig({
        label: "Generate Recipient List",
        nextStatus: "Pending Allocation",
        message: "Distribution recipient list generated",
        modalTitle: "Generate Recipient List",
        modalDescription:
          "Review the frozen snapshot and send the entitlement-generation instruction to TA.",
        reviewTitle: "Review Entitlement Generation",
        reviewDescription:
          "Confirm the frozen holder snapshot is ready to be turned into the final recipient list.",
        identityDescription:
          "Issuer identity and entitlement-generation authority are being verified.",
        workflowTitle: "Generate Entitlement List",
        workflowDescription:
          "The entitlement-generation instruction is being sent to the transfer agent.",
        taTitle: "Generate Recipient List",
        taDescription:
          "The transfer agent is preparing the recipient list and validating destination controls.",
        successTitle: "Recipient list ready",
        successDescription:
          "The event has moved into payout preparation with a frozen recipient roster.",
        impactType: "ta",
        requiresTa: true,
        requiresOnChain: false,
        nextStepHint:
          "This action asks TA to convert the frozen snapshot into the final recipient list and payout roster.",
        affectedObjects: ["Recipient list", "Entitlement register", "Funding instruction pack"],
        previewSummary: [
          { label: "Snapshot ID", value: context.transferAgentOps?.holderSnapshotId || "Pending lock" },
          { label: "Recipients", value: `${context.recipientPreview.totalRecipients}` },
          { label: "Estimated Payout", value: `${formatDistributionNumber(context.recipientPreview.totalEstimatedPayout)} ${currency}` },
          { label: "Funding Check", value: context.transferAgentOps?.fundingCheckStatus || "Pending funding confirmation" },
        ],
        previewDetails: [
          { title: "Recipient Preview", kind: "ta", items: topRecipientItems },
          { title: "TA Control Plane", kind: "ta", items: taStatusItems },
        ],
        viewLinks: [
          { label: "View Recipients", tab: "recipients" },
          ...(context.canManualOverride
            ? [{ label: "Open Manual Override", tab: "manual" as const }]
            : []),
        ],
      });
    case "Pending Allocation":
      return buildDistributionActionConfig({
        label: "Put On Chain",
        nextStatus: "Put On Chain",
        message: `${context.eventLabel} release posted on chain`,
        modalTitle: "Put Distribution On Chain",
        modalDescription:
          "Review the final recipient list before notifying TA and posting the payout instruction on chain.",
        reviewTitle: "Review On-chain Release",
        reviewDescription:
          "Confirm the payout roster, treasury route, and release mode before the on-chain instruction is executed.",
        identityDescription:
          "Issuer identity and release authority are being verified.",
        workflowTitle: "Prepare Release Package",
        workflowDescription:
          "The final recipient list is being packaged for the release instruction.",
        taTitle: "Notify Transfer Agent",
        taDescription:
          "The transfer agent is confirming the final recipient list and funding package.",
        onChainTitle: "Execute On-chain Release",
        onChainDescription:
          "The payout release instruction is being posted to the smart-contract workflow.",
        successTitle: "Release posted on chain",
        successDescription:
          "The event has moved into its on-chain release stage.",
        impactType: "hybrid",
        requiresTa: true,
        requiresOnChain: true,
        nextStepHint:
          "This action notifies TA and posts the payout release instruction on chain using the finalized recipient list.",
        affectedObjects: ["Recipient list", "On-chain payout instruction", "Treasury release package"],
        previewSummary: [
          { label: "Recipients", value: `${context.recipientPreview.totalRecipients}` },
          { label: "Eligible Units", value: `${formatDistributionNumber(context.recipientPreview.totalEligibleUnits, 2)} units` },
          { label: "Estimated Payout", value: `${formatDistributionNumber(context.recipientPreview.totalEstimatedPayout)} ${currency}` },
          { label: "Payout Mode", value: distribution.payoutMode || "Claim" },
          { label: "Funding Check", value: context.transferAgentOps?.fundingCheckStatus || "Pending funding confirmation" },
        ],
        previewDetails: [
          { title: "Recipient Preview", kind: "onchain", items: topRecipientItems },
          { title: "TA Control Plane", kind: "ta", items: taStatusItems },
        ],
        viewLinks: [
          { label: "View Recipients", tab: "recipients" },
          { label: "View Payout", tab: "payout" },
          ...(context.canManualOverride
            ? [{ label: "Open Manual Override", tab: "manual" as const }]
            : []),
        ],
      });
    case "Put On Chain":
      return buildDistributionActionConfig({
        label:
          context.eventLabel === "Dividend"
            ? "Open Dividend"
            : context.isClaimMode
              ? "Open For Claim"
              : "Start Auto Distribution",
        nextStatus: "Open For Distribution",
        message: `${context.eventLabel} opened for distribution`,
        modalTitle: `Open ${context.eventLabel}`,
        modalDescription:
          "Review the posted payout instruction before opening the investor-facing distribution step.",
        reviewTitle: "Review Distribution Opening",
        reviewDescription:
          "Confirm the on-chain instruction is ready and the treasury route should move into active release.",
        identityDescription:
          "Issuer identity and distribution-opening authority are being verified.",
        workflowTitle: "Open Distribution",
        workflowDescription:
          "The distribution release is being transitioned into its live execution state.",
        taTitle: "Notify Transfer Agent",
        taDescription:
          "The transfer agent is being notified that the release window is now live.",
        onChainTitle: context.isClaimMode ? "Open Claim Window" : "Start On-chain Transfers",
        onChainDescription: context.isClaimMode
          ? "The claim contract is being opened for eligible recipients."
          : "The automated transfer process is being activated on chain.",
        successTitle: `${context.eventLabel} opened`,
        successDescription:
          "The event is now live for claim or automated distribution.",
        impactType: "hybrid",
        requiresTa: true,
        requiresOnChain: true,
        nextStepHint:
          "This action notifies TA and activates the live release path on chain for eligible recipients.",
        affectedObjects: ["Live payout route", "Recipient release roster", "Claim / transfer instruction"],
        previewSummary: [
          { label: "Payout Mode", value: distribution.payoutMode || "Claim" },
          { label: "Recipients", value: `${context.recipientPreview.totalRecipients}` },
          { label: "Estimated Payout", value: `${formatDistributionNumber(context.recipientPreview.totalEstimatedPayout)} ${currency}` },
          { label: "Treasury Route", value: distribution.payoutAccount || "Pending treasury account" },
        ],
        previewDetails: [
          { title: "Payout Preview", kind: "onchain", items: topRecipientItems },
          { title: "TA Control Plane", kind: "ta", items: taStatusItems },
        ],
        viewLinks: [
          { label: "View Payout", tab: "payout" },
          { label: "View Recipients", tab: "recipients" },
        ],
      });
    case "Open For Distribution":
      return buildDistributionActionConfig({
        label: "Reconcile Distribution",
        nextStatus: "Reconciled",
        message: `${context.eventLabel} reconciled`,
        modalTitle: "Reconcile Distribution",
        modalDescription:
          "Review the live payout state before recording TA reconciliation.",
        reviewTitle: "Review Reconciliation",
        reviewDescription:
          "Confirm payout execution is complete enough to move into reconciliation close-out.",
        identityDescription:
          "Issuer identity and reconciliation authority are being verified.",
        workflowTitle: "Record Reconciliation",
        workflowDescription:
          "The payout event is being advanced into reconciliation close-out.",
        taTitle: "Confirm Reconciliation",
        taDescription:
          "The transfer agent is confirming recipient settlement and final control checks.",
        successTitle: "Distribution reconciled",
        successDescription:
          "The event has moved into reconciled close-out.",
        impactType: "ta",
        requiresTa: true,
        requiresOnChain: false,
        nextStepHint:
          "This action records TA reconciliation after the live distribution route has executed.",
        affectedObjects: ["Payout reconciliation", "Recipient settlement log", "Close-out memo"],
        previewSummary: [
          { label: "Recipients", value: `${context.recipientPreview.totalRecipients}` },
          { label: "Estimated Payout", value: `${formatDistributionNumber(context.recipientPreview.totalEstimatedPayout)} ${currency}` },
          { label: "Reconciliation", value: context.transferAgentOps?.reconciliationStatus || "Pending" },
          { label: "Last TA Action", value: context.transferAgentOps?.lastTransferAgentAction || "Pending TA note" },
        ],
        previewDetails: [
          { title: "Payout Preview", kind: "ta", items: topRecipientItems },
          { title: "TA Control Plane", kind: "ta", items: taStatusItems },
        ],
        viewLinks: [{ label: "View Payout", tab: "payout" }],
      });
    case "Reconciled":
      return buildDistributionActionConfig({
        label: "Mark Complete",
        nextStatus: "Done",
        message: `${context.eventLabel} marked complete`,
        modalTitle: `Complete ${context.eventLabel}`,
        modalDescription:
          "Review the reconciled event before closing it out.",
        reviewTitle: "Review Close-out",
        reviewDescription:
          "Confirm reconciliation is complete and the event can be closed.",
        identityDescription:
          "Issuer identity and close-out authority are being verified.",
        workflowTitle: "Close Event",
        workflowDescription:
          "The reconciled event is being closed and archived.",
        successTitle: `${context.eventLabel} completed`,
        successDescription:
          "The distribution event is now marked complete.",
        impactType: "internal",
        requiresTa: false,
        requiresOnChain: false,
        nextStepHint:
          "This action closes the event after reconciliation has been completed.",
        affectedObjects: ["Close-out record", "Event archive", "Distribution audit trail"],
        previewSummary: [
          { label: "Current Status", value: distribution.status },
          { label: "Recipients", value: `${context.recipientPreview.totalRecipients}` },
          { label: "Estimated Payout", value: `${formatDistributionNumber(context.recipientPreview.totalEstimatedPayout)} ${currency}` },
          { label: "Reconciliation", value: context.transferAgentOps?.reconciliationStatus || "Completed" },
        ],
        viewLinks: [
          { label: "View Overview", tab: "overview" },
          { label: "View Payout", tab: "payout" },
        ],
      });
    default:
      return null;
  }
}

function buildDistributionEditState(distribution: FundDistribution): DistributionEditState {
  return {
    name: distribution.name,
    description: distribution.description,
    distributionRateType: distribution.distributionRateType || "Fixed Rate",
    distributionRate: distribution.distributionRate || "",
    distributionUnit: distribution.distributionUnit || "",
    payoutMode: distribution.payoutMode || "Claim",
    payoutToken: distribution.payoutToken || "",
    payoutAccount: distribution.payoutAccount || "",
    recordDate: toDateTimeLocal(distribution.recordDate),
    paymentDate: toDateTimeLocal(distribution.paymentDate),
    actualDaysInPeriod: distribution.actualDaysInPeriod || "",
    actualDaysInYear: distribution.actualDaysInYear || "",
  };
}

function includesKeyword(value: string | undefined, keyword: string) {
  return value?.toLowerCase().includes(keyword.toLowerCase()) ?? false;
}

function OpenEndDistributionContextCard({
  distribution,
}: {
  distribution: FundDistribution;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribution Module / Current Cycle</CardTitle>
        <p className="text-sm text-muted-foreground">
          For open-end funds, distribution should be read as a standing module plus the currently
          configured payout cycle. The cycle closes after payout, but the module remains available
          for the next record date.
        </p>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Record Date</div>
          <div className="mt-1 font-medium">{distribution.recordDate || "N/A"}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Payment Date</div>
          <div className="mt-1 font-medium">{distribution.paymentDate || "N/A"}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Distribution Mode</div>
          <div className="mt-1 font-medium">{distribution.payoutMode || "Claim"}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Current Cycle State</div>
          <div className="mt-1 font-medium">{distribution.status}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function DistributionSetupEditor({
  distribution,
  eventLabel,
  onSave,
  onCancel,
}: {
  distribution: FundDistribution;
  eventLabel: string;
  onSave: (updates: Partial<FundDistribution>) => void;
  onCancel: () => void;
}) {
  const editableSections = getEditableDistributionSections(distribution.status);
  const [form, setForm] = useState<DistributionEditState>(() => buildDistributionEditState(distribution));

  useEffect(() => {
    setForm(buildDistributionEditState(distribution));
  }, [distribution]);

  const canEditDetails = editableSections.includes("details");
  const canEditPayout = editableSections.includes("payout");

  const setField = <K extends keyof DistributionEditState,>(
    key: K,
    value: DistributionEditState[K],
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const handleSave = () => {
    if (!form.payoutToken.trim()) {
      toast.error("Distribution token is required.");
      return;
    }

    if (!form.payoutAccount.trim()) {
      toast.error("Distribution source account is required.");
      return;
    }

    if (!form.distributionRate.trim()) {
      toast.error(`${eventLabel} rate is required.`);
      return;
    }

    if (!form.actualDaysInPeriod.trim() || !form.actualDaysInYear.trim()) {
      toast.error("Day-count basis must include both actual days in period and actual days in year.");
      return;
    }

    if (form.recordDate && form.paymentDate && form.recordDate > form.paymentDate) {
      toast.error("Payment date must be later than or equal to record date.");
      return;
    }

    onSave({
      name: form.name.trim() || distribution.name,
      description: form.description.trim() || distribution.description,
      distributionRateType: form.distributionRateType,
      distributionRate: form.distributionRate.trim() || undefined,
      distributionUnit: form.distributionUnit.trim() || undefined,
      payoutMode: form.payoutMode,
      payoutToken: form.payoutToken.trim() || undefined,
      payoutAccount: form.payoutAccount.trim() || undefined,
      recordDate: fromDateTimeLocal(form.recordDate),
      paymentDate: fromDateTimeLocal(form.paymentDate),
      actualDaysInPeriod: form.actualDaysInPeriod.trim() || undefined,
      actualDaysInYear: form.actualDaysInYear.trim() || undefined,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Mode</CardTitle>
        <p className="text-sm text-muted-foreground">
          {getDistributionEditingPolicyMessage(distribution.status)}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {canEditDetails && (
          <div className="space-y-4 rounded-lg border p-4">
            <div>
              <h3 className="font-medium">{eventLabel} Details</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Core identity, description, and record-date configuration for this {eventLabel.toLowerCase()} event.
              </p>
            </div>

            <div className="space-y-2">
              <Label>{eventLabel} name</Label>
              <Input value={form.name} onChange={(event) => setField("name", event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(event) => setField("description", event.target.value)} rows={3} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Record date</Label>
                <Input type="datetime-local" value={form.recordDate} onChange={(event) => setField("recordDate", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Payment date</Label>
                <Input type="datetime-local" value={form.paymentDate} onChange={(event) => setField("paymentDate", event.target.value)} />
              </div>
            </div>
          </div>
        )}

        {canEditPayout && (
          <div className="space-y-4 rounded-lg border p-4">
            <div>
              <h3 className="font-medium">{eventLabel} Routing</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Configure the distribution token, destination, and rate mechanics.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{eventLabel} mode</Label>
                <Select value={form.payoutMode} onValueChange={(value) => setField("payoutMode", value as "Direct Transfer" | "Claim")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Direct Transfer">Direct Transfer</SelectItem>
                    <SelectItem value="Claim">Claim</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{eventLabel} token</Label>
                <Input value={form.payoutToken} onChange={(event) => setField("payoutToken", event.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
                <Label>{eventLabel} source account</Label>
                <Input value={form.payoutAccount} onChange={(event) => setField("payoutAccount", event.target.value)} />
              </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>{eventLabel} rate type</Label>
                <Select value={form.distributionRateType} onValueChange={(value) => setField("distributionRateType", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fixed Rate">Fixed Rate</SelectItem>
                    <SelectItem value="Per Unit">Per Unit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{eventLabel} rate</Label>
                <Input value={form.distributionRate} onChange={(event) => setField("distributionRate", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{eventLabel} unit</Label>
                <Input value={form.distributionUnit} onChange={(event) => setField("distributionUnit", event.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Actual days in period</Label>
                <Input value={form.actualDaysInPeriod} onChange={(event) => setField("actualDaysInPeriod", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Actual days in year</Label>
                <Input value={form.actualDaysInYear} onChange={(event) => setField("actualDaysInYear", event.target.value)} />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function FundDistributionDetail() {
  const { id, fundId } = useParams();
  const location = useLocation();
  const {
    fundDistributions,
    fundIssuances,
    fundOrders,
    updateDistributionStatus,
    updateFundDistribution,
    getPermissionResult,
    userRole,
  } = useApp();

  const distribution = fundDistributions.find(
    (item) => item.id === id && (!fundId || item.fundId === fundId),
  );
  const linkedFund = fundIssuances.find((fund) => fund.id === distribution?.fundId);
  const inFundContext = Boolean(fundId);
  const distributionsListPath =
    inFundContext && fundId
      ? `/fund-issuance/${fundId}/distributions`
      : userRole === "issuer"
        ? "/manage/fund-distribution"
        : "/marketplace/fund-distribution";
  const editIntentRequested = new URLSearchParams(location.search).get("mode") === "edit";

  if (!distribution) {
    return (
      <div className="container mx-auto px-6 py-20 text-center">
        <h2>Distribution Not Found</h2>
        <p className="text-muted-foreground mt-2">
          The distribution you're looking for doesn't exist or has been removed.
        </p>
      </div>
    );
  }

  const [currentStatus, setCurrentStatus] = useState(distribution.status);
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [hasAppliedEditIntent, setHasAppliedEditIntent] = useState(false);
  const [detailTab, setDetailTab] = useState<DistributionTab>("overview");
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<DistributionWorkflowActionConfig | null>(null);
  const detailSectionRef = useRef<HTMLDivElement | null>(null);
  const isClaimMode = distribution.payoutMode !== "Direct Transfer";

  useEffect(() => {
    setCurrentStatus(distribution.status);
  }, [distribution.status]);

  const isOpenEndDistribution = linkedFund?.fundType === "Open-end";
  const isClosedEndDividend = linkedFund?.fundType === "Closed-end";
  const eventLabel = isClosedEndDividend ? "Dividend" : "Distribution";
  const eventLabelLower = eventLabel.toLowerCase();
  const eventLabelPlural = isClosedEndDividend ? "Dividends" : "Distributions";

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "Draft": "bg-gray-100 text-gray-800",
      "Pending Approval": "bg-amber-100 text-amber-800",
      "Pending Listing": "bg-yellow-100 text-yellow-800",
      "Upcoming": "bg-blue-100 text-blue-800",
      "Snapshot Locked": "bg-sky-100 text-sky-800",
      "Pending Allocation": "bg-purple-100 text-purple-800",
      "Put On Chain": "bg-indigo-100 text-indigo-800",
      "Open For Distribution": "bg-green-100 text-green-800",
      "Reconciled": "bg-emerald-100 text-emerald-800",
      "Done": "bg-teal-100 text-teal-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getActionPermission = () => {
    return getPermissionResult(getDistributionPermissionAction(currentStatus), "distribution");
  };

  const updatePermission = getPermissionResult("update", "distribution");
  const canEditSetup =
    userRole === "issuer" &&
    updatePermission.allowed &&
    getEditableDistributionSections(currentStatus).length > 0;
  const editableFieldLabels = getEditableDistributionFieldLabels(currentStatus);
  const distributionViewModel = { ...distribution, status: currentStatus };
  const controlChecks = buildDistributionControlChecks(
    distributionViewModel,
    linkedFund?.status,
  );
  const manualExcludedInvestorIds = distribution.manualExcludedInvestorIds || [];
  const allRecipientPreview = buildDistributionRecipients(
    { ...distributionViewModel, manualExcludedInvestorIds: [] },
    linkedFund,
    fundOrders,
  );
  const recipientPreview = buildDistributionRecipients(
    distributionViewModel,
    linkedFund,
    fundOrders,
  );
  const manuallyExcludedRecipients = allRecipientPreview.rows.filter((recipient) =>
    manualExcludedInvestorIds.includes(recipient.investorId),
  );
  const transferAgentOps = distribution.transferAgentOps;
  const showTransferAgentLayer = isClosedEndDividend || Boolean(transferAgentOps);
  const distributionCurrency =
    distribution.payoutToken || distribution.distributionUnit || linkedFund?.assetCurrency || "Unit";
  const transferAgentFields = [
    {
      label: "Register date",
      value: transferAgentOps?.holderRegisterDate || distribution.recordDate || "Pending record date",
    },
    {
      label: "Snapshot ID",
      value: transferAgentOps?.holderSnapshotId || "Snapshot not locked yet",
    },
    {
      label: "Snapshot locked at",
      value: transferAgentOps?.holderSnapshotLockedAt || "Waiting for TA confirmation",
    },
    {
      label: "Recipient list status",
      value: transferAgentOps?.recipientListStatus || "Pending generation",
    },
    {
      label: "Recipient list generated at",
      value: transferAgentOps?.recipientListGeneratedAt || "Not generated yet",
    },
    {
      label: "Funding check",
      value: transferAgentOps?.fundingCheckStatus || "Pending funding confirmation",
    },
    {
      label: "Reconciliation status",
      value: transferAgentOps?.reconciliationStatus || "Pending",
    },
    {
      label: "Last operator action",
      value: transferAgentOps?.lastTransferAgentAction || "Transfer agent has not logged an action yet.",
    },
  ];
  const transferAgentChecklistItems = [
    {
      label: "Holder register verified",
      detail: transferAgentOps?.holderRegisterDate
        ? `Register refreshed on ${transferAgentOps.holderRegisterDate}.`
        : "Waiting for the transfer agent to confirm the holder register refresh.",
      status: transferAgentOps?.holderRegisterDate ? "done" : "pending",
    },
    {
      label: "Record date snapshot frozen",
      detail: transferAgentOps?.holderSnapshotId
        ? `${transferAgentOps.holderSnapshotId} locked at ${transferAgentOps.holderSnapshotLockedAt || "TA lock time pending"}.`
        : "Snapshot will be frozen on the record date before recipient generation.",
      status: transferAgentOps?.holderSnapshotId ? "done" : "pending",
    },
    {
      label: "Recipient list reviewed",
      detail: transferAgentOps?.recipientListStatus
        ? `${transferAgentOps.recipientListStatus}${transferAgentOps.recipientListGeneratedAt ? ` at ${transferAgentOps.recipientListGeneratedAt}` : ""}.`
        : "Recipient list has not been generated yet.",
      status:
        includesKeyword(transferAgentOps?.recipientListStatus, "generated") ||
        includesKeyword(transferAgentOps?.recipientListStatus, "ready")
          ? "done"
          : "pending",
    },
    {
      label: "Cash funding confirmed",
      detail: transferAgentOps?.fundingCheckStatus
        ? `${transferAgentOps.fundingCheckStatus}${transferAgentOps?.fundingConfirmedAt ? ` at ${transferAgentOps.fundingConfirmedAt}` : ""}.`
        : "Treasury funding has not been confirmed yet.",
      status: includesKeyword(transferAgentOps?.fundingCheckStatus, "confirmed")
        ? "done"
        : transferAgentOps?.fundingCheckStatus
          ? "attention"
          : "pending",
    },
    {
      label: "Payment execution completed",
      detail:
        currentStatus === "Done" || currentStatus === "Reconciled"
          ? "Dividend release has completed and entered close-out."
          : "Distribution release remains pending until the event moves into the completion stage.",
      status: currentStatus === "Done" || currentStatus === "Reconciled" ? "done" : "pending",
    },
    {
      label: "Reconciliation completed",
      detail: transferAgentOps?.reconciliationStatus
        ? `${transferAgentOps.reconciliationStatus}${transferAgentOps?.reconciledAt ? ` at ${transferAgentOps.reconciledAt}` : ""}.`
        : "Waiting for transfer-agent close-out.",
      status:
        includesKeyword(transferAgentOps?.reconciliationStatus, "reconciled") ||
        includesKeyword(transferAgentOps?.reconciliationStatus, "completed")
          ? "done"
          : transferAgentOps?.reconciliationStatus
            ? "attention"
            : "pending",
    },
  ] as const;
  const structuredAction = getStructuredDistributionAction(distributionViewModel, {
    distribution: distributionViewModel,
    linkedFund,
    eventLabel,
    eventLabelLower,
    isClaimMode,
    canManualOverride: userRole === "issuer",
    recipientPreview,
    allRecipients: allRecipientPreview,
    manuallyExcludedRecipients,
    transferAgentOps,
  });
  const distributionWorkflowTimings: WorkflowStepTiming[] = isOpenEndDistribution
    ? [
        {
          planned: formatWorkflowTiming(distribution.createdTime),
          actual:
            currentStatus !== "Draft" ? formatWorkflowTiming(distribution.createdTime) : undefined,
        },
        {
          planned: formatWorkflowTiming(distribution.recordDate),
          actual:
            ["Snapshot Locked", "Pending Allocation", "Put On Chain", "Open For Distribution", "Reconciled", "Done"].includes(
              currentStatus,
            )
              ? formatWorkflowTiming(distribution.recordDate)
              : undefined,
        },
        {
          planned: formatWorkflowTiming(distribution.recordDate),
          actual:
            ["Pending Allocation", "Put On Chain", "Open For Distribution", "Reconciled", "Done"].includes(
              currentStatus,
            )
              ? formatWorkflowTiming(distribution.recordDate)
              : undefined,
        },
        {
          planned: formatWorkflowTiming(distribution.paymentDate),
          actual:
            ["Open For Distribution", "Reconciled", "Done"].includes(currentStatus)
              ? formatWorkflowTiming(distribution.paymentDate)
              : undefined,
        },
        {
          planned: formatWorkflowTiming(distribution.paymentDate),
          actual:
            ["Reconciled", "Done"].includes(currentStatus)
              ? formatWorkflowTiming(distribution.lastActionAt || distribution.paymentDate)
              : undefined,
        },
      ]
    : [
        {
          planned: formatWorkflowTiming(distribution.createdTime),
          actual:
            currentStatus !== "Draft" ? formatWorkflowTiming(distribution.createdTime) : undefined,
        },
        {
          planned: formatWorkflowTiming(distribution.recordDate),
          actual:
            !["Draft", "Pending Approval"].includes(currentStatus)
              ? formatWorkflowTiming(distribution.recordDate)
              : undefined,
        },
        {
          planned: formatWorkflowTiming(distribution.recordDate),
          actual:
            ["Pending Allocation", "Put On Chain", "Open For Distribution", "Reconciled", "Done"].includes(
              currentStatus,
            )
              ? formatWorkflowTiming(distribution.recordDate)
              : undefined,
        },
        {
          planned: formatWorkflowTiming(distribution.paymentDate),
          actual:
            ["Open For Distribution", "Reconciled", "Done"].includes(currentStatus)
              ? formatWorkflowTiming(distribution.paymentDate)
              : undefined,
        },
        {
          planned: formatWorkflowTiming(distribution.paymentDate),
          actual:
            ["Reconciled", "Done"].includes(currentStatus)
              ? formatWorkflowTiming(distribution.lastActionAt || distribution.paymentDate)
              : undefined,
        },
      ];

  useEffect(() => {
    setHasAppliedEditIntent(false);
  }, [distribution.id]);

  useEffect(() => {
    if (editIntentRequested && canEditSetup && !hasAppliedEditIntent) {
      setIsInlineEditing(true);
      setHasAppliedEditIntent(true);
    }
  }, [editIntentRequested, canEditSetup, hasAppliedEditIntent]);

  const openDetailTab = (tab: DistributionTab) => {
    setDetailTab(tab);
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          detailSectionRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
      });
    }
  };

  const handleExcludeRecipient = (investorId: string, investorName: string) => {
    const updated = updateFundDistribution(
      distribution.id,
      {
        manualExcludedInvestorIds: [...manualExcludedInvestorIds, investorId],
      },
      "update",
    );
    if (!updated) return;
    toast.success(`${investorName} removed from the active recipient roster`);
  };

  const handleRestoreRecipient = (investorId: string, investorName: string) => {
    const updated = updateFundDistribution(
      distribution.id,
      {
        manualExcludedInvestorIds: manualExcludedInvestorIds.filter((id) => id !== investorId),
      },
      "update",
    );
    if (!updated) return;
    toast.success(`${investorName} restored to the active recipient roster`);
  };

  const handleStatusChange = (nextStatus: string, message: string) => {
    if (!pendingAction) return;
    const updated = updateDistributionStatus(
      distribution.id,
      nextStatus,
      getDistributionPermissionAction(currentStatus),
    );
    if (!updated) return;
    setCurrentStatus(nextStatus);
    toast.success(message);
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight className="w-4 h-4" />
        {inFundContext && linkedFund ? (
          <>
            <Link
              to={`/fund-issuance/${linkedFund.id}`}
              className="hover:text-foreground transition-colors"
            >
              {linkedFund.name}
            </Link>
            <ChevronRight className="w-4 h-4" />
          </>
        ) : null}
        <Link to={distributionsListPath} className="hover:text-foreground transition-colors">
          {inFundContext ? "Fund Distributions" : userRole === "issuer" ? "Global Distribution Queue" : "Fund Distribution Events"}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground">{distribution.name}</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-4">
              <h1 style={{ fontFamily: 'var(--font-heading)' }}>{distribution.name}</h1>
              <Badge className={getStatusColor(currentStatus)}>{currentStatus}</Badge>
            </div>
            {inFundContext && linkedFund && (
              <p className="mt-2 text-sm text-muted-foreground">
                {eventLabel} event for {linkedFund.name}
              </p>
            )}
          </div>
        </div>
        {!getActionPermission().allowed && (
          <p className="text-sm text-muted-foreground">{getActionPermission().reason}</p>
        )}
      </div>

      {/* Workflow Progress */}
      <div className="mb-8">
        <FundDistributionWorkflow
          currentStatus={currentStatus}
          stepTimings={distributionWorkflowTimings}
          actionPanel={
            structuredAction ? (
              <DistributionNextActionPanel
                action={structuredAction}
                currentStatus={currentStatus}
                disabled={!getActionPermission().allowed}
                disabledReason={getActionPermission().reason}
                onOpen={() => {
                  setPendingAction(structuredAction);
                  setActionModalOpen(true);
                }}
                onViewMore={(link) => openDetailTab(link.tab)}
              />
            ) : undefined
          }
          workflowModel={isOpenEndDistribution ? "open-end" : "default"}
          distributionLabel={eventLabel}
        />
      </div>

      {isOpenEndDistribution && (
        <div className="mb-8">
          <OpenEndDistributionContextCard
            distribution={{ ...distribution, status: currentStatus }}
          />
        </div>
      )}

      <div className="mb-8 flex flex-col gap-4 rounded-lg border bg-secondary/20 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-medium">Field Editing Policy</div>
          <div className="mt-1 text-sm text-muted-foreground">
            {getDistributionEditingPolicyMessage(currentStatus)}
          </div>
          {editableFieldLabels.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {editableFieldLabels.map((label) => (
                <Badge key={label} variant="outline">
                  Editable: {label}
                </Badge>
              ))}
            </div>
          )}
          {editIntentRequested && !canEditSetup && (
            <div className="mt-3 text-sm text-amber-700">
              This event is currently view-only, so the page opened in review mode instead of edit mode.
            </div>
          )}
        </div>
        {canEditSetup && !isInlineEditing && (
          <Button variant="outline" onClick={() => setIsInlineEditing(true)}>
            Enter Edit Mode
          </Button>
        )}
      </div>

      {isInlineEditing && (
        <div className="mb-8">
          <DistributionSetupEditor
            distribution={{ ...distribution, status: currentStatus }}
            eventLabel={eventLabel}
            onCancel={() => setIsInlineEditing(false)}
            onSave={(updates) => {
              const updated = updateFundDistribution(distribution.id, updates, "update");
              if (!updated) return;
              setIsInlineEditing(false);
              toast.success(`Allowed ${eventLabelLower} fields updated`);
            }}
          />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Sidebar - Information Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Fund Token</div>
                <div className="font-medium">
                  {distribution.fundToken || linkedFund?.tokenName || "–"}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Token Contract Address
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-sm">
                    {distribution.tokenAddress || "–"}
                  </code>
                  {distribution.tokenAddress && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(distribution.tokenAddress || "")}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">Distribution Mode</div>
                <div className="font-medium">{distribution.payoutMode || "Claim"}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {distribution.payoutMode === "Direct Transfer"
                    ? "Gas paid by fund operator, distribution is system-triggered."
                    : "Gas paid by investor at claim time."}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">Distribution Token</div>
                <div className="font-medium">
                  {distribution.payoutToken || distribution.distributionUnit || "–"}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">Distribution Source Account</div>
                <div className="font-medium">{distribution.payoutAccount || "–"}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">Asset Type</div>
                <div className="font-medium">{distribution.assetType}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Initial NAV / Issue Price
                </div>
                <div className="font-medium">
                  {distribution.initialNav || linkedFund?.currentNav || linkedFund?.initialNav || "–"}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  {eventLabel} Record Date
                </div>
                <div className="font-medium">
                  {distribution.recordDate || "–"}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  {eventLabel} Payment Date
                </div>
                <div className="font-medium">
                  {distribution.paymentDate || "–"}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  {eventLabel} Rate
                </div>
                <div className="font-medium">
                  {distribution.distributionRate
                    ? `${distribution.distributionRate}${distribution.distributionRateType === "Fixed Rate" ? "%" : ` ${distribution.distributionUnit || ""}`}`
                    : "–"}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  {eventLabel} actual days in period
                </div>
                <div className="font-medium">{distribution.actualDaysInPeriod || "–"}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  {eventLabel} actual days in year
                </div>
                <div className="font-medium">{distribution.actualDaysInYear || "–"}</div>
              </div>
            </CardContent>
          </Card>

          {showTransferAgentLayer && (
            <TransferAgentOperationsCard
              className="mt-6"
              description="Use the transfer-agent operating layer to prove who locked the snapshot, who generated the recipient list, and whether funding is ready."
              operatorName={transferAgentOps?.transferAgentName || "Transfer agent assignment pending"}
              status={transferAgentOps?.transferAgentStatus || "Pending Snapshot"}
              fields={transferAgentFields}
              note="Eligibility logic for this dividend is fixed: all holders on the record date are included in the recipient list."
            />
          )}

          {linkedFund && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Linked Fund Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Fund</div>
                  <div className="font-medium">{linkedFund.name}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Fund Status</div>
                  <div className="font-medium">{linkedFund.status}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Current NAV</div>
                  <div className="font-medium">{linkedFund.currentNav}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Settlement Cycle</div>
                  <div className="font-medium">{linkedFund.settlementCycle || "N/A"}</div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>{eventLabel} Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {controlChecks.map((check) => {
                const Icon = check.ok
                  ? CheckCircle2
                  : check.detail.includes("missing")
                    ? TriangleAlert
                    : CircleDashed;

                return (
                  <div key={check.label} className="rounded-lg border p-3">
                    <div className="flex items-start gap-3">
                      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${check.ok ? "text-green-600" : "text-amber-600"}`} />
                      <div>
                        <div className="font-medium">{check.label}</div>
                        <div className="mt-1 text-muted-foreground">{check.detail}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {showTransferAgentLayer && (
            <TransferAgentChecklistCard
              className="mt-6"
              description="This checklist focuses on transfer-agent controls instead of issuer form fields."
              items={[...transferAgentChecklistItems]}
            />
          )}
        </div>

        {/* Main Content - Tabs */}
        <div ref={detailSectionRef} className="lg:col-span-2 scroll-mt-24">
          <Tabs
            value={detailTab}
            onValueChange={(value) => setDetailTab(value as DistributionTab)}
            className="space-y-6"
          >
            <TabsList className={cn("grid w-full", userRole === "issuer" ? "grid-cols-4" : "grid-cols-3")}>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="recipients">
                {isClosedEndDividend ? "Recipient List" : "Recipients"}
              </TabsTrigger>
              <TabsTrigger value="payout">Distribution</TabsTrigger>
              {userRole === "issuer" && <TabsTrigger value="manual">Manual Override</TabsTrigger>}
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {isClosedEndDividend && (
                <Card>
                  <CardHeader>
                    <CardTitle>Eligibility Logic</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>All holders on the record date are eligible for this dividend event.</p>
                    <p>
                      The transfer agent freezes the snapshot first and then generates the recipient
                      list from the verified holder register instead of applying investor rules.
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>{eventLabel} Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {distribution.description}
                  </p>
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <div className="text-sm font-medium text-blue-900 mb-2">
                      {eventLabel} Process
                    </div>
                    <div className="text-xs text-blue-600">
                      {isClosedEndDividend
                        ? "Cash dividend is paid to holders recorded on the record date."
                        : "Income distribution is paid to fund holders based on their shareholding at the record date."}{" "}
                      {distribution.payoutMode === "Direct Transfer"
                        ? `After opening, the system starts ${eventLabelLower} transfer automatically.`
                        : `After opening, investors can claim the ${eventLabelLower} on-chain.`}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{isClosedEndDividend ? "Dividend Controls" : "Manager Controls"}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 text-sm">
                  <div className="rounded-lg border p-4">
                    <div className="text-muted-foreground">Distribution Route</div>
                    <div className="mt-1 font-medium">
                      {distribution.payoutMode || "Claim"} / {distribution.payoutToken || "Token pending"}
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-muted-foreground">Treasury Source</div>
                    <div className="mt-1 font-medium">{distribution.payoutAccount || "Account pending"}</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-muted-foreground">Record and Payment Discipline</div>
                    <div className="mt-1 font-medium">
                      {distribution.recordDate || "Record date pending"} / {distribution.paymentDate || "Payment date pending"}
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-muted-foreground">Day-count Basis</div>
                    <div className="mt-1 font-medium">
                      {distribution.actualDaysInPeriod || "Period pending"} / {distribution.actualDaysInYear || "Year pending"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recipients" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-1">
                      {isClosedEndDividend ? "Eligible Dividend Recipients" : "Eligible Recipients"}
                    </div>
                    <div className="text-2xl font-semibold">{recipientPreview.totalRecipients}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-1">Eligible Units</div>
                    <div className="text-2xl font-semibold">
                      {recipientPreview.totalEligibleUnits.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-1">
                      Estimated {eventLabel} Amount
                    </div>
                    <div className="text-2xl font-semibold">
                      {recipientPreview.totalEstimatedPayout.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {distribution.payoutToken || distribution.distributionUnit || linkedFund?.assetCurrency || "Unit"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>{isClosedEndDividend ? "Dividend Recipient List" : "Recipient Preview"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Share Class</TableHead>
                        <TableHead>Eligible Units</TableHead>
                        <TableHead>Estimated Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recipientPreview.rows.map((recipient) => (
                        <TableRow key={recipient.investorId}>
                          <TableCell>
                            <div className="font-medium">{recipient.investorName}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[220px]">
                              {recipient.investorWallet}
                            </div>
                          </TableCell>
                          <TableCell>{recipient.category}</TableCell>
                          <TableCell>{recipient.shareClass}</TableCell>
                          <TableCell>{recipient.eligibleUnits.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                          <TableCell>
                            {recipient.estimatedPayout.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
                            {distribution.payoutToken || distribution.distributionUnit || linkedFund?.assetCurrency || ""}
                          </TableCell>
                        </TableRow>
                      ))}
                      {recipientPreview.rows.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                            No eligible recipients can be derived from current fund orders yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recipient Category Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead>Recipient Count</TableHead>
                        <TableHead>Eligible Units</TableHead>
                        <TableHead>Estimated Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recipientPreview.categoryBreakdown.map((row) => (
                        <TableRow key={row.category}>
                          <TableCell>{row.category}</TableCell>
                          <TableCell>{row.holderCount}</TableCell>
                          <TableCell>{row.eligibleUnits.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                          <TableCell>
                            {row.estimatedPayout.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
                            {distribution.payoutToken || distribution.distributionUnit || linkedFund?.assetCurrency || ""}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payout" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-1">
                      Total {eventLabel} Amount
                    </div>
                    <div className="text-2xl font-semibold">
                      {recipientPreview.totalEstimatedPayout.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {distribution.payoutToken || distribution.distributionUnit || linkedFund?.assetCurrency || "Unit"}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-1">
                      {isClosedEndDividend ? "Recipient Count" : "Ready for Distribution"}
                    </div>
                    <div className="text-2xl font-semibold">
                      {isClosedEndDividend
                        ? recipientPreview.totalRecipients
                        : recipientPreview.rows.filter(() => currentStatus === "Open For Distribution" || currentStatus === "Done").length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {isClosedEndDividend ? eventLabelPlural : "recipients"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>{eventLabel} List</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Destination</TableHead>
                        <TableHead>Eligible Units</TableHead>
                        <TableHead>Distribution Amount</TableHead>
                        <TableHead>Distribution Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recipientPreview.rows.map((recipient) => {
                        const payoutStatus =
                          currentStatus === "Done"
                            ? "Paid"
                            : currentStatus === "Open For Distribution"
                              ? "Ready"
                              : currentStatus === "Put On Chain"
                                ? "Preparing"
                                : "Pending";

                        return (
                          <TableRow key={`${recipient.investorId}-payout`}>
                            <TableCell>
                              <div className="font-medium">{recipient.investorName}</div>
                              <div className="text-xs text-muted-foreground">{recipient.category}</div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {distribution.payoutMode === "Direct Transfer"
                                ? distribution.payoutAccount || "Settlement account pending"
                                : recipient.investorWallet}
                            </TableCell>
                            <TableCell>
                              {recipient.eligibleUnits.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell>
                              {recipient.estimatedPayout.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
                              {distribution.payoutToken || distribution.distributionUnit || linkedFund?.assetCurrency || ""}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{payoutStatus}</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {recipientPreview.rows.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                            No distribution recipients are available yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {userRole === "issuer" && (
              <TabsContent value="manual" className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground mb-1">Active Recipient Roster</div>
                      <div className="text-2xl font-semibold">{recipientPreview.totalRecipients}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground mb-1">Manual Overrides</div>
                      <div className="text-2xl font-semibold">{manuallyExcludedRecipients.length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground mb-1">Active Estimated Payout</div>
                      <div className="text-2xl font-semibold">
                        {formatDistributionNumber(recipientPreview.totalEstimatedPayout)}
                      </div>
                      <div className="text-sm text-muted-foreground">{distributionCurrency}</div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Manual Recipient Override</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Recipient</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Eligible Units</TableHead>
                          <TableHead>Estimated Amount</TableHead>
                          <TableHead>Recipient Roster</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allRecipientPreview.rows.length > 0 ? (
                          allRecipientPreview.rows.map((recipient) => {
                            const excluded = manualExcludedInvestorIds.includes(recipient.investorId);
                            return (
                              <TableRow key={`${recipient.investorId}-manual`}>
                                <TableCell>
                                  <div className="font-medium">{recipient.investorName}</div>
                                  <div className="text-xs text-muted-foreground truncate max-w-[220px]">
                                    {recipient.investorWallet}
                                  </div>
                                </TableCell>
                                <TableCell>{recipient.category}</TableCell>
                                <TableCell>
                                  {formatDistributionNumber(recipient.eligibleUnits, 2)}
                                </TableCell>
                                <TableCell>
                                  {formatDistributionNumber(recipient.estimatedPayout)} {distributionCurrency}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{excluded ? "Excluded" : "Included"}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      excluded
                                        ? handleRestoreRecipient(recipient.investorId, recipient.investorName)
                                        : handleExcludeRecipient(recipient.investorId, recipient.investorName)
                                    }
                                  >
                                    {excluded ? "Restore" : "Exclude"}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                              No recipient records are available for manual override yet.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>

      {pendingAction && (
        <OperationActionModal
          open={actionModalOpen}
          onOpenChange={(open) => {
            setActionModalOpen(open);
            if (!open) {
              setPendingAction(null);
            }
          }}
          onSuccess={() => handleStatusChange(pendingAction.nextStatus, pendingAction.message)}
          title={pendingAction.modalTitle}
          description={pendingAction.modalDescription}
          steps={pendingAction.modalSteps}
          startLabel="Start"
          completionLabel="Done"
          summary={pendingAction.previewSummary}
          impactBadges={pendingAction.impactBadges}
          detailGroups={pendingAction.previewDetails}
        />
      )}
    </div>
  );
}
