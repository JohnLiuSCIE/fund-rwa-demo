import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  PauseCircle,
  PlayCircle,
  Send,
  ShieldCheck,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { InfoAlert } from "../components/InfoAlert";
import { StatusBadge } from "../components/StatusBadge";
import { FundRedemptionWorkflow, type WorkflowStepTiming } from "../components/FundIssuanceWorkflow";
import {
  OperationActionModal,
  type ActionModalDetailGroup,
  type ActionModalImpactBadge,
  type ActionModalStep,
  type ActionModalSummaryItem,
} from "../components/modals/OperationActionModal";
import {
  TransferAgentChecklistCard,
  TransferAgentOperationsCard,
} from "../components/TransferAgentPanels";
import { useApp } from "../context/AppContext";
import { FundIssuance, FundOrder, FundRedemptionConfig } from "../data/fundDemoData";
import { cn } from "../components/ui/utils";

type RedemptionTab =
  | "overview"
  | "snapshot"
  | "requests"
  | "payment-list"
  | "batches"
  | "manual";

type RedemptionActionImpactType = "internal" | "ta" | "onchain" | "hybrid";
type WorkflowActionOwner = "maker" | "checker";

interface RedemptionViewLink {
  label: string;
  tab: RedemptionTab;
}

interface RedemptionWorkflowActionConfig {
  label: string;
  actionOwner: WorkflowActionOwner;
  nextStatus: FundRedemptionConfig["status"];
  message: string;
  icon: LucideIcon;
  variant: "default" | "outline";
  modalTitle: string;
  modalDescription: string;
  modalSteps: ActionModalStep[];
  impactType: RedemptionActionImpactType;
  impactBadges: ActionModalImpactBadge[];
  nextStepHint: string;
  affectedObjects: string[];
  previewSummary: ActionModalSummaryItem[];
  previewDetails: ActionModalDetailGroup[];
  viewLinks: RedemptionViewLink[];
}

function getNextRedemptionOrderAction(order: FundOrder) {
  switch (order.status) {
    case "Submitted":
      return { label: "Review", nextStatus: "Pending Review" as const };
    case "Pending Review":
      return { label: "Approve", nextStatus: "Pending NAV" as const };
    case "Pending NAV":
      return { label: "Move to cash settle", nextStatus: "Pending Cash Settlement" as const };
    case "Pending Cash Settlement":
      return { label: "Complete", nextStatus: "Completed" as const };
    default:
      return null;
  }
}

function buildRedemptionActionFlow({
  reviewTitle,
  reviewDescription,
  identityDescription,
  actionLabel,
  actionTitle,
  actionDescription,
  successTitle,
  successDescription,
}: {
  reviewTitle: string;
  reviewDescription: string;
  identityDescription: string;
  actionLabel: string;
  actionTitle: string;
  actionDescription: string;
  successTitle: string;
  successDescription: string;
}) {
  return [
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
    {
      label: "Completed",
      title: successTitle,
      description: successDescription,
      state: "success" as const,
    },
  ];
}

type RedemptionActionConfig = {
  label: string;
  nextStatus: FundRedemptionConfig["status"];
  message: string;
  icon: LucideIcon;
  variant: "default" | "outline";
  modalTitle: string;
  modalDescription: string;
  modalSteps: ReturnType<typeof buildRedemptionActionFlow>;
};

function getCloseRedemptionAction(config: FundRedemptionConfig): RedemptionActionConfig {
  const isWindowBased = config.redemptionMode === "Window-based";
  const closeLabel = isWindowBased ? "Close Window" : "Close Current Cycle";
  const closeTarget = isWindowBased ? "redemption window" : "current redemption dealing cycle";

  return {
    label: closeLabel,
    nextStatus: "Window Closed",
    message: isWindowBased
      ? "Redemption window closed"
      : "Current redemption dealing cycle closed",
    icon: CheckCircle2,
    variant: "default",
    modalTitle: closeLabel,
    modalDescription: `Verify issuer identity before closing the ${closeTarget} and advancing to close-out handling.`,
    modalSteps: buildRedemptionActionFlow({
      reviewTitle: "Review Close-out Request",
      reviewDescription: `Confirm the ${closeTarget} should stop accepting new requests and move into the next close-out step.`,
      identityDescription:
        "Issuer identity and close-out authority are being verified.",
      actionLabel: "Close",
      actionTitle: closeLabel,
      actionDescription: `The ${closeTarget} close-out request is being processed.`,
      successTitle: isWindowBased ? "Window closed" : "Cycle closed",
      successDescription: isWindowBased
        ? "The redemption window has been closed and the workflow advanced to close-out."
        : "The current redemption dealing cycle has been closed and the workflow advanced to close-out.",
    }),
  };
}

function getRedemptionActions(config: FundRedemptionConfig): RedemptionActionConfig[] {
  switch (config.status) {
    case "Draft":
      return [{
        label: "Submit for Approval",
        nextStatus: "Pending Approval" as const,
        message: "Redemption operation submitted for approval",
        icon: Send,
        variant: "default" as const,
        modalTitle: "Submit Redemption Operation For Approval",
        modalDescription:
          "Review the redemption operation, verify issuer identity, and submit it for approval.",
        modalSteps: buildRedemptionActionFlow({
          reviewTitle: "Review Redemption Draft",
          reviewDescription:
            "Confirm the linked fund, cut-off rules, and liquidity settings before submission.",
          identityDescription:
            "Issuer identity and redemption authority are being verified.",
          actionLabel: "Submit",
          actionTitle: "Submit Approval Request",
          actionDescription:
            "The redemption approval request is being submitted to the workflow.",
          successTitle: "Redemption submitted",
          successDescription:
            "The redemption operation is now waiting for approval review.",
        }),
      }];
    case "Pending Approval":
      return [{
        label: "Activate Redemption",
        nextStatus: config.pauseRedemptionAfterListing ? "Announced" as const : "Active" as const,
        message: "Redemption operation activated",
        icon: ShieldCheck,
        variant: "default" as const,
        modalTitle: "Activate Redemption Operation",
        modalDescription:
          "Verify issuer identity and activate the approved redemption operation.",
        modalSteps: buildRedemptionActionFlow({
          reviewTitle: "Review Redemption Activation",
          reviewDescription:
            "Confirm the approved redemption operation is ready to move into the operating stage.",
          identityDescription:
            "Issuer identity and redemption activation authority are being verified.",
          actionLabel: "Activate",
          actionTitle: "Activate Redemption",
          actionDescription:
            "The redemption activation request is being processed.",
          successTitle: "Redemption activated",
          successDescription:
            "The redemption operation has moved into its next operating stage.",
        }),
      }];
    case "Announced":
      return [{
        label: "Open Window",
        nextStatus: "Window Open" as const,
        message: "Redemption window opened",
        icon: PlayCircle,
        variant: "default" as const,
        modalTitle: "Open Redemption Window",
        modalDescription:
          "Verify issuer identity before opening the announced redemption window.",
        modalSteps: buildRedemptionActionFlow({
          reviewTitle: "Review Window Opening",
          reviewDescription:
            "Confirm the announcement period is complete and the redemption window should be opened.",
          identityDescription:
            "Issuer identity and redemption window authority are being verified.",
          actionLabel: "Open",
          actionTitle: "Open Redemption Window",
          actionDescription:
            "The redemption window opening request is being processed.",
          successTitle: "Window opened",
          successDescription:
            "The redemption window is now open for investors.",
        }),
      }];
    case "Active":
    case "Window Open":
      return [
        {
          label: "Pause",
          nextStatus: "Paused" as const,
          message: "Redemption processing paused",
          icon: PauseCircle,
          variant: "outline" as const,
          modalTitle: "Pause Redemption Processing",
          modalDescription:
            "Verify issuer identity before pausing redemption processing.",
          modalSteps: buildRedemptionActionFlow({
            reviewTitle: "Review Pause Request",
            reviewDescription:
              "Confirm the redemption process should be paused at this stage.",
            identityDescription:
              "Issuer identity and redemption control authority are being verified.",
            actionLabel: "Pause",
            actionTitle: "Pause Redemption",
            actionDescription:
              "The pause request is being recorded in the redemption workflow.",
            successTitle: "Redemption paused",
            successDescription:
              "Redemption processing has been paused successfully.",
          }),
        },
        getCloseRedemptionAction(config),
      ];
    case "Paused":
      return [
        {
          label: "Resume",
          nextStatus:
            config.redemptionMode === "Window-based"
              ? ("Window Open" as const)
              : ("Active" as const),
          message: "Redemption processing resumed",
          icon: PlayCircle,
          variant: "default" as const,
          modalTitle: "Resume Redemption Processing",
          modalDescription:
            "Verify issuer identity before resuming redemption processing.",
          modalSteps: buildRedemptionActionFlow({
            reviewTitle: "Review Resume Request",
            reviewDescription:
              "Confirm the redemption setup is ready to resume processing.",
            identityDescription:
              "Issuer identity and redemption restart authority are being verified.",
            actionLabel: "Resume",
            actionTitle: "Resume Redemption",
            actionDescription:
              "The resume request is being processed for the redemption workflow.",
            successTitle: "Redemption resumed",
            successDescription:
              "Redemption processing has resumed successfully.",
          }),
        },
        {
          ...getCloseRedemptionAction(config),
          variant: "outline",
        },
      ];
    default:
      return [];
  }
}

function getRedemptionRequestActionConfig(order: FundOrder) {
  const nextAction = getNextRedemptionOrderAction(order);
  if (!nextAction) return null;

  const copyMap: Record<
    string,
    {
      modalTitle: string;
      modalDescription: string;
      reviewDescription: string;
      identityDescription: string;
      actionTitle: string;
      actionDescription: string;
      successTitle: string;
      successDescription: string;
    }
  > = {
    Review: {
      modalTitle: "Review Redemption Request",
      modalDescription:
        "Verify operator identity before moving the redemption request into review.",
      reviewDescription:
        "Confirm the redemption request is ready for issuer review and compliance handling.",
      identityDescription:
        "Operator identity and redemption review authority are being verified.",
      actionTitle: "Move To Review",
      actionDescription:
        "The redemption request is being moved into the pending review state.",
      successTitle: "Request moved to review",
      successDescription:
        "The redemption request is now waiting for manual review.",
    },
    Approve: {
      modalTitle: "Approve Redemption Request",
      modalDescription:
        "Verify operator identity before approving the redemption request for NAV processing.",
      reviewDescription:
        "Confirm the redemption request passed review and should move to NAV handling.",
      identityDescription:
        "Operator identity and redemption approval authority are being verified.",
      actionTitle: "Approve Request",
      actionDescription:
        "The redemption request approval is being recorded.",
      successTitle: "Request approved",
      successDescription:
        "The redemption request has moved to pending NAV.",
    },
    "Move to cash settle": {
      modalTitle: "Move Redemption To Cash Settlement",
      modalDescription:
        "Verify operator identity before moving the redemption request into cash settlement.",
      reviewDescription:
        "Confirm NAV handling is complete and the cash settlement step should begin.",
      identityDescription:
        "Operator identity and settlement authority are being verified.",
      actionTitle: "Start Cash Settlement",
      actionDescription:
        "The redemption request is being moved into pending cash settlement.",
      successTitle: "Cash settlement started",
      successDescription:
        "The redemption request is now waiting for cash settlement.",
    },
    Complete: {
      modalTitle: "Complete Redemption Request",
      modalDescription:
        "Verify operator identity before marking the redemption request as completed.",
      reviewDescription:
        "Confirm settlement has been completed and the request can be closed.",
      identityDescription:
        "Operator identity and completion authority are being verified.",
      actionTitle: "Complete Request",
      actionDescription:
        "The redemption request completion is being recorded.",
      successTitle: "Request completed",
      successDescription:
        "The redemption request has been completed successfully.",
    },
  };

  const copy = copyMap[nextAction.label];
  if (!copy) return null;

  return {
    ...nextAction,
    ...copy,
    modalSteps: buildRedemptionActionFlow({
      reviewTitle: nextAction.label,
      reviewDescription: copy.reviewDescription,
      identityDescription: copy.identityDescription,
      actionLabel: nextAction.label,
      actionTitle: copy.actionTitle,
      actionDescription: copy.actionDescription,
      successTitle: copy.successTitle,
      successDescription: copy.successDescription,
    }),
  };
}

type RedemptionEditableSection = "details" | "operations";

interface RedemptionEditState {
  name: string;
  description: string;
  effectiveDate: string;
  announcementDate: string;
  windowStart: string;
  windowEnd: string;
  latestNav: string;
  settlementCycle: string;
  noticePeriodDays: string;
  maxRedemptionQuantityPerInvestor: string;
  cutOffTime: string;
  manualApprovalRequired: boolean;
  pauseRedemptionAfterListing: boolean;
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

function parseLeadingNumber(value?: string) {
  if (!value) return 0;
  const normalized = value.replace(/,/g, "");
  const match = normalized.match(/[\d.]+/);
  return match ? Number(match[0]) : 0;
}

function getPaymentStatusLabel(status: FundOrder["status"]) {
  switch (status) {
    case "Completed":
      return "Paid";
    case "Pending Cash Settlement":
      return "Ready";
    case "Rejected":
      return "Failed";
    default:
      return "Pending";
  }
}

function buildRedemptionPaymentRows(requests: FundOrder[]) {
  return requests.map((request) => {
    const acceptedUnits = request.confirmedSharesOrCash
      ? request.requestQuantity
      : request.requestQuantity;
    const grossAmount = request.confirmedSharesOrCash || request.estimatedSharesOrCash;
    const pricePerUnitValue =
      parseLeadingNumber(grossAmount) / Math.max(parseLeadingNumber(request.requestQuantity), 1);
    const pricePerUnitCurrency =
      request.confirmedNav?.split(" ").slice(-1)[0] ||
      request.estimatedNav.split(" ").slice(-1)[0] ||
      "";

    return {
      id: request.id,
      investorName: request.investorName,
      destinationAccount: request.investorWallet,
      unitsAccepted: acceptedUnits,
      pricePerUnit: `${pricePerUnitValue.toFixed(4)} ${pricePerUnitCurrency}`.trim(),
      grossAmount,
      netAmount: grossAmount,
      paymentStatus: getPaymentStatusLabel(request.status),
      paymentReference:
        request.status === "Completed"
          ? `PAY-${request.id.toUpperCase()}`
          : request.status === "Pending Cash Settlement"
            ? `READY-${request.id.toUpperCase()}`
            : "—",
    };
  });
}

function buildHolderSnapshotRows(requests: FundOrder[]) {
  return requests.map((request) => ({
    id: request.id,
    investorName: request.investorName,
    destinationAccount: request.investorWallet,
    snapshotUnits: request.requestQuantity,
    estimatedCash: request.confirmedSharesOrCash || request.estimatedSharesOrCash,
    requestStatus: request.status,
  }));
}

function formatRedemptionNumber(value: number, digits = 2) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value);
}

function buildRedemptionImpactBadges({
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

function buildStructuredRedemptionModalFlow({
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

function getRedemptionActionPanelSurfaceClasses(impactType: RedemptionActionImpactType) {
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

function RedemptionNextActionPanel({
  action,
  currentStatus,
  disabled,
  disabledReason,
  secondaryActions,
  onOpen,
  onOpenSecondary,
  onViewMore,
}: {
  action: RedemptionWorkflowActionConfig;
  currentStatus: string;
  disabled: boolean;
  disabledReason?: string;
  secondaryActions: RedemptionWorkflowActionConfig[];
  onOpen: () => void;
  onOpenSecondary: (action: RedemptionWorkflowActionConfig) => void;
  onViewMore: (link: RedemptionViewLink) => void;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 shadow-sm",
        getRedemptionActionPanelSurfaceClasses(action.impactType),
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

          {secondaryActions.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Additional Controls
              </div>
              <div className="flex flex-wrap gap-2">
                {secondaryActions.map((secondaryAction) => (
                  <Button
                    key={`${secondaryAction.label}-${secondaryAction.nextStatus}`}
                    type="button"
                    size="sm"
                    variant={secondaryAction.variant}
                    className={cn(
                      "bg-white/90",
                      getActionButtonClasses(secondaryAction.actionOwner, secondaryAction.variant),
                    )}
                    onClick={() => onOpenSecondary(secondaryAction)}
                  >
                    <secondaryAction.icon className="mr-2 h-4 w-4" />
                    {secondaryAction.label}
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
            <action.icon className="mr-2 h-4 w-4" />
            {action.label}
          </Button>
        </div>
      </div>
    </div>
  );
}

function includesKeyword(value: string | undefined, keyword: string) {
  return value?.toLowerCase().includes(keyword.toLowerCase()) ?? false;
}

function getRedemptionPermissionAction(label: string) {
  const normalized = label.trim().toLowerCase();
  if (normalized.includes("submit")) return "submit";
  if (normalized.includes("activate")) return "approve";
  if (normalized.includes("open")) return "open";
  if (normalized.includes("resume")) return "open";
  if (normalized.includes("pause")) return "pause";
  if (normalized.includes("close")) return "manage";
  return "manage";
}

function getRedemptionOrderPermissionAction(label: string) {
  const normalized = label.trim().toLowerCase();
  if (normalized.includes("review")) return "review";
  if (normalized.includes("approve")) return "approve";
  return "manage";
}

interface RedemptionActionContext {
  fund?: FundIssuance;
  requests: FundOrder[];
  activeSettlementRequests: FundOrder[];
  manuallyExcludedRequests: FundOrder[];
  holderSnapshotRows: ReturnType<typeof buildHolderSnapshotRows>;
  paymentRows: ReturnType<typeof buildRedemptionPaymentRows>;
  transferAgentOps?: FundRedemptionConfig["transferAgentOps"];
  currencyLabel: string;
  batchesCount: number;
}

function buildRedemptionActionConfig({
  label,
  nextStatus,
  message,
  icon,
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
  nextStatus: FundRedemptionConfig["status"];
  message: string;
  icon: LucideIcon;
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
  impactType: RedemptionActionImpactType;
  requiresTa: boolean;
  requiresOnChain: boolean;
  nextStepHint: string;
  affectedObjects: string[];
  previewSummary: ActionModalSummaryItem[];
  previewDetails?: ActionModalDetailGroup[];
  viewLinks?: RedemptionViewLink[];
}): RedemptionWorkflowActionConfig {
  return {
    label,
    actionOwner: actionOwner || "maker",
    nextStatus,
    message,
    icon,
    variant,
    modalTitle,
    modalDescription,
    modalSteps: buildStructuredRedemptionModalFlow({
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
    impactBadges: buildRedemptionImpactBadges({ requiresTa, requiresOnChain }),
    nextStepHint,
    affectedObjects,
    previewSummary,
    previewDetails,
    viewLinks,
  };
}

function getStructuredRedemptionActions(
  config: FundRedemptionConfig,
  context: RedemptionActionContext,
): RedemptionWorkflowActionConfig[] {
  const totalRequestedUnits = context.activeSettlementRequests.reduce(
    (sum, request) => sum + parseLeadingNumber(request.requestQuantity),
    0,
  );
  const totalGrossCash = context.paymentRows.reduce(
    (sum, row) => sum + parseLeadingNumber(row.grossAmount),
    0,
  );
  const topRequestItems =
    context.activeSettlementRequests.length > 0
      ? context.activeSettlementRequests.slice(0, 3).map(
          (request) => `${request.investorName} - ${request.requestQuantity}`,
        )
      : ["No accepted redemption requests are in the active settlement roster."];
  const topPaymentItems =
    context.paymentRows.length > 0
      ? context.paymentRows
          .slice(0, 3)
          .map((row) => `${row.investorName} - ${row.netAmount} to ${row.destinationAccount}`)
      : ["No redemption payment rows are available yet."];
  const taStatusItems = [
    `Snapshot: ${context.transferAgentOps?.holderSnapshotId || "Pending"}`,
    `Payment list: ${context.transferAgentOps?.paymentListStatus || "Pending generation"}`,
    `Funding check: ${context.transferAgentOps?.fundingCheckStatus || "Pending funding confirmation"}`,
  ];
  const canShowSnapshot = context.fund?.fundType !== "Open-end";

  switch (config.status) {
    case "Draft":
      return [
        buildRedemptionActionConfig({
          label: "Submit for Approval",
          nextStatus: "Pending Approval",
          message: "Redemption operation submitted for approval",
          icon: Send,
          modalTitle: "Submit Redemption Operation For Approval",
          modalDescription:
            "Review the redemption operation, verify issuer identity, and submit it for approval.",
          reviewTitle: "Review Redemption Draft",
          reviewDescription:
            "Confirm the linked fund, cut-off rules, and liquidity settings before submission.",
          identityDescription:
            "Issuer identity and redemption authority are being verified.",
          workflowTitle: "Submit Approval Request",
          workflowDescription:
            "The redemption approval request is being submitted to the workflow.",
          successTitle: "Redemption submitted",
          successDescription:
            "The redemption operation is now waiting for approval review.",
          impactType: "internal",
          requiresTa: false,
          requiresOnChain: false,
          nextStepHint:
            "This action will route the redemption setup into approval review without changing TA or on-chain records.",
          affectedObjects: ["Approval request", "Liquidity event memo", "Redemption setup record"],
          previewSummary: [
            { label: "Linked Fund", value: config.fundName },
            { label: "Mode", value: config.redemptionMode },
            { label: "Notice Period", value: `${config.noticePeriodDays} day(s)` },
            { label: "Settlement Cycle", value: config.settlementCycle },
            { label: "Manual Approval", value: config.manualApprovalRequired ? "Enabled" : "Straight-through" },
          ],
          previewDetails: [
            {
              title: "Setup Controls",
              items: [
                `Cut-off: ${config.cutOffTime}`,
                `Window: ${config.windowStart || "N/A"} to ${config.windowEnd || "N/A"}`,
                `Per-investor limit: ${config.maxRedemptionQuantityPerInvestor}`,
              ],
            },
          ],
          viewLinks: [{ label: "View Requests", tab: "requests" }],
        }),
      ];
    case "Pending Approval":
      return [
        buildRedemptionActionConfig({
          label: config.pauseRedemptionAfterListing ? "Launch Notice Period" : "Activate Module",
          actionOwner: "checker",
          nextStatus: config.pauseRedemptionAfterListing ? "Announced" : "Active",
          message: config.pauseRedemptionAfterListing
            ? "Redemption notice period launched"
            : "Redemption module activated",
          icon: ShieldCheck,
          modalTitle: config.pauseRedemptionAfterListing
            ? "Launch Redemption Notice Period"
            : "Activate Redemption Module",
          modalDescription:
            "Verify checker identity and move the approved redemption setup into its next operating state.",
          reviewTitle: "Review Activation",
          reviewDescription:
            "Confirm the approved redemption setup is ready to move into its notice or active operating stage.",
          identityDescription:
            "Checker identity and redemption activation authority are being verified.",
          workflowTitle: config.pauseRedemptionAfterListing
            ? "Launch Notice Period"
            : "Activate Redemption Module",
          workflowDescription:
            "The approved redemption setup is being advanced to its next operating stage.",
          successTitle: config.pauseRedemptionAfterListing
            ? "Notice period started"
            : "Redemption activated",
          successDescription: config.pauseRedemptionAfterListing
            ? "The redemption event has moved into its notice period."
            : "The redemption module is now active.",
          impactType: "internal",
          requiresTa: false,
          requiresOnChain: false,
          nextStepHint:
            "This action completes checker approval and moves the redemption setup into its notice or active operating stage.",
          affectedObjects: ["Redemption operating calendar", "Module activation record", "Settlement account setup"],
          previewSummary: [
            { label: "Current Status", value: config.status },
            { label: "Next Status", value: config.pauseRedemptionAfterListing ? "Announced" : "Active" },
            { label: "Linked Fund", value: context.fund?.status || "Linked fund pending" },
            { label: "Cut-off", value: config.cutOffTime },
          ],
          viewLinks: [{ label: "View Requests", tab: "requests" }],
        }),
      ];
    case "Announced":
      return [
        buildRedemptionActionConfig({
          label: "Open Window",
          nextStatus: "Window Open",
          message: "Redemption window opened",
          icon: PlayCircle,
          modalTitle: "Open Redemption Window",
          modalDescription:
            "Verify issuer identity before opening the announced redemption window.",
          reviewTitle: "Review Window Opening",
          reviewDescription:
            "Confirm the notice period is complete and the redemption window should be opened.",
          identityDescription:
            "Issuer identity and redemption window authority are being verified.",
          workflowTitle: "Open Redemption Window",
          workflowDescription:
            "The redemption window opening request is being processed.",
          successTitle: "Window opened",
          successDescription:
            "The redemption window is now open for investors.",
          impactType: "internal",
          requiresTa: false,
          requiresOnChain: false,
          nextStepHint:
            "This action moves the redemption event from notice into the live participation window without sending a TA settlement package yet.",
          affectedObjects: ["Participation order book", "Window activation record", "Investor notice status"],
          previewSummary: [
            { label: "Announcement Date", value: config.announcementDate || "Pending" },
            { label: "Window", value: `${config.windowStart || "N/A"} to ${config.windowEnd || "N/A"}` },
            { label: "Active Requests", value: `${context.activeSettlementRequests.length}` },
            { label: "Cut-off", value: config.cutOffTime },
          ],
          previewDetails: [{ title: "Request Roster", items: topRequestItems }],
          viewLinks: [
            { label: "View Requests", tab: "requests" },
            ...(canShowSnapshot ? [{ label: "View Snapshot", tab: "snapshot" as const }] : []),
          ],
        }),
      ];
    case "Active":
    case "Window Open":
      return [
        buildRedemptionActionConfig({
          label: "Lock Snapshot",
          nextStatus: "Snapshot Locked",
          message: "Redemption holder snapshot locked",
          icon: CheckCircle2,
          modalTitle: "Lock Redemption Snapshot",
          modalDescription:
            "Verify issuer identity before handing the accepted redemption roster to the transfer agent for close-out.",
          reviewTitle: "Review Snapshot Lock",
          reviewDescription:
            "Confirm the current request roster is ready to be frozen for TA close-out and settlement preparation.",
          identityDescription:
            "Issuer identity and snapshot authority are being verified.",
          workflowTitle: "Post Snapshot Instruction",
          workflowDescription:
            "The current redemption roster is being handed into the TA snapshot queue.",
          taTitle: "Lock Holder Snapshot",
          taDescription:
            "The transfer agent is freezing the accepted holder snapshot and cut-off roster.",
          successTitle: "Snapshot locked",
          successDescription:
            "The redemption event has moved into TA close-out preparation.",
          impactType: "ta",
          requiresTa: true,
          requiresOnChain: false,
          nextStepHint:
            "This action will notify TA to freeze the accepted request roster and start settlement preparation.",
          affectedObjects: ["Holder snapshot", "Accepted request roster", "Snapshot lock instruction"],
          previewSummary: [
            { label: "Active Requests", value: `${context.activeSettlementRequests.length}` },
            { label: "Requested Units", value: `${formatRedemptionNumber(totalRequestedUnits, 2)} units` },
            { label: "Manual Overrides", value: `${context.manuallyExcludedRequests.length} excluded` },
            { label: "Cut-off", value: config.cutOffTime },
            { label: "Settlement Cycle", value: config.settlementCycle },
          ],
          previewDetails: [{ title: "Settlement Roster", kind: "ta", items: topRequestItems }],
          viewLinks: [
            { label: "View Requests", tab: "requests" },
            ...(canShowSnapshot
              ? [
                  { label: "Open Manual Override", tab: "manual" as const },
                  { label: "View Snapshot", tab: "snapshot" as const },
                ]
              : []),
          ],
        }),
        buildRedemptionActionConfig({
          label: "Pause",
          nextStatus: "Paused",
          message: "Redemption processing paused",
          icon: PauseCircle,
          variant: "outline",
          modalTitle: "Pause Redemption Processing",
          modalDescription:
            "Verify issuer identity before pausing redemption processing.",
          reviewTitle: "Review Pause Request",
          reviewDescription:
            "Confirm the redemption process should be paused at this stage.",
          identityDescription:
            "Issuer identity and redemption control authority are being verified.",
          workflowTitle: "Pause Redemption",
          workflowDescription:
            "The pause request is being recorded in the redemption workflow.",
          successTitle: "Redemption paused",
          successDescription:
            "Redemption processing has been paused successfully.",
          impactType: "internal",
          requiresTa: false,
          requiresOnChain: false,
          nextStepHint:
            "This control pauses the operating window without posting a TA settlement instruction.",
          affectedObjects: ["Pause control log", "Window halt record"],
          previewSummary: [
            { label: "Current Status", value: config.status },
            { label: "Active Requests", value: `${context.activeSettlementRequests.length}` },
            { label: "Window", value: `${config.windowStart || "N/A"} to ${config.windowEnd || "N/A"}` },
          ],
        }),
      ];
    case "Paused":
      return [
        buildRedemptionActionConfig({
          label: "Lock Snapshot",
          nextStatus: "Snapshot Locked",
          message: "Redemption holder snapshot locked",
          icon: CheckCircle2,
          modalTitle: "Lock Redemption Snapshot",
          modalDescription:
            "Verify issuer identity before progressing the paused redemption event into TA close-out.",
          reviewTitle: "Review Snapshot Lock",
          reviewDescription:
            "Confirm the paused redemption roster is final and ready for settlement preparation.",
          identityDescription:
            "Issuer identity and snapshot authority are being verified.",
          workflowTitle: "Post Snapshot Instruction",
          workflowDescription:
            "The paused redemption roster is being handed into the TA snapshot queue.",
          taTitle: "Lock Holder Snapshot",
          taDescription:
            "The transfer agent is freezing the accepted holder snapshot and cut-off roster.",
          successTitle: "Snapshot locked",
          successDescription:
            "The redemption event has moved into TA close-out preparation.",
          impactType: "ta",
          requiresTa: true,
          requiresOnChain: false,
          nextStepHint:
            "This action will notify TA to freeze the paused request roster and start settlement preparation.",
          affectedObjects: ["Holder snapshot", "Accepted request roster", "Snapshot lock instruction"],
          previewSummary: [
            { label: "Paused Requests", value: `${context.activeSettlementRequests.length}` },
            { label: "Manual Overrides", value: `${context.manuallyExcludedRequests.length} excluded` },
            { label: "Cut-off", value: config.cutOffTime },
            { label: "Settlement Cycle", value: config.settlementCycle },
          ],
          previewDetails: [{ title: "Settlement Roster", kind: "ta", items: topRequestItems }],
          viewLinks: [
            { label: "View Requests", tab: "requests" },
            ...(canShowSnapshot
              ? [{ label: "Open Manual Override", tab: "manual" as const }]
              : []),
          ],
        }),
        buildRedemptionActionConfig({
          label: "Resume",
          nextStatus: config.redemptionMode === "Window-based" ? "Window Open" : "Active",
          message: "Redemption processing resumed",
          icon: PlayCircle,
          variant: "outline",
          modalTitle: "Resume Redemption Processing",
          modalDescription:
            "Verify issuer identity before resuming redemption processing.",
          reviewTitle: "Review Resume Request",
          reviewDescription:
            "Confirm the redemption setup is ready to resume processing.",
          identityDescription:
            "Issuer identity and redemption restart authority are being verified.",
          workflowTitle: "Resume Redemption",
          workflowDescription:
            "The resume request is being processed for the redemption workflow.",
          successTitle: "Redemption resumed",
          successDescription:
            "Redemption processing has resumed successfully.",
          impactType: "internal",
          requiresTa: false,
          requiresOnChain: false,
          nextStepHint:
            "This control resumes the operating window without moving into TA close-out.",
          affectedObjects: ["Operating control log", "Pause / resume record"],
          previewSummary: [
            { label: "Current Status", value: config.status },
            { label: "Window", value: `${config.windowStart || "N/A"} to ${config.windowEnd || "N/A"}` },
            { label: "Active Requests", value: `${context.activeSettlementRequests.length}` },
          ],
        }),
      ];
    case "Snapshot Locked":
      return [
        buildRedemptionActionConfig({
          label: "Prepare Payment List",
          nextStatus: "Payment List Ready",
          message: "Redemption payment list prepared",
          icon: ShieldCheck,
          modalTitle: "Prepare Redemption Payment List",
          modalDescription:
            "Verify issuer identity before confirming the TA payment list package.",
          reviewTitle: "Review Payment Preparation",
          reviewDescription:
            "Confirm the locked snapshot is ready for payment-file generation and funding review.",
          identityDescription:
            "Issuer identity and payment-file authority are being verified.",
          workflowTitle: "Queue Payment Prep",
          workflowDescription:
            "The settlement package is being advanced to the TA payment-list stage.",
          taTitle: "Generate Payment List",
          taDescription:
            "The transfer agent is validating accepted units and preparing the payment file.",
          successTitle: "Payment list ready",
          successDescription:
            "The redemption payment list is now ready for burn and cash release.",
          impactType: "ta",
          requiresTa: true,
          requiresOnChain: false,
          nextStepHint:
            "This action will notify TA to generate the payment list and confirm the settlement roster.",
          affectedObjects: ["Payment list", "Funding confirmation pack", "Accepted unit ledger"],
          previewSummary: [
            { label: "Snapshot ID", value: context.transferAgentOps?.holderSnapshotId || "Pending" },
            { label: "Eligible Holders", value: `${context.holderSnapshotRows.length}` },
            { label: "Estimated Cash", value: `${formatRedemptionNumber(totalGrossCash, 2)} ${context.currencyLabel}`.trim() },
            { label: "Manual Overrides", value: `${context.manuallyExcludedRequests.length} excluded` },
          ],
          previewDetails: [
            { title: "Holder Snapshot", kind: "ta", items: topRequestItems },
            { title: "TA Status", kind: "ta", items: taStatusItems },
          ],
          viewLinks: [
            ...(canShowSnapshot ? [{ label: "View Snapshot", tab: "snapshot" as const }] : []),
            { label: "View Payment List", tab: "payment-list" },
            ...(canShowSnapshot
              ? [{ label: "Open Manual Override", tab: "manual" as const }]
              : []),
          ],
        }),
      ];
    case "Payment List Ready":
      return [
        buildRedemptionActionConfig({
          label: "Burn On Chain",
          nextStatus: "Burn On Chain",
          message: "Redemption burn instruction posted on chain",
          icon: ShieldCheck,
          modalTitle: "Execute Redemption Burn On Chain",
          modalDescription:
            "Verify issuer identity before executing the on-chain burn leg for accepted redemption units.",
          reviewTitle: "Review Burn Instruction",
          reviewDescription:
            "Confirm the payment list and funding pack are complete before posting the burn instruction on chain.",
          identityDescription:
            "Issuer identity and burn authority are being verified.",
          workflowTitle: "Queue Burn Instruction",
          workflowDescription:
            "The burn instruction is being posted to the settlement workflow.",
          taTitle: "Confirm Payment List",
          taDescription:
            "The transfer agent is confirming the payment file and funding pack before broadcast.",
          onChainTitle: "Execute Burn On Chain",
          onChainDescription:
            "Accepted redemption units are being moved into the on-chain burn leg.",
          successTitle: "Burn instruction posted",
          successDescription:
            "The redemption event is ready for final close-out and reconciliation.",
          impactType: "hybrid",
          requiresTa: true,
          requiresOnChain: true,
          nextStepHint:
            "This action will confirm the payment list with TA and execute the on-chain burn leg for accepted units.",
          affectedObjects: ["Payment list", "Funding confirmation pack", "On-chain burn instruction"],
          previewSummary: [
            { label: "Payment Rows", value: `${context.paymentRows.length}` },
            { label: "Gross Cash", value: `${formatRedemptionNumber(totalGrossCash, 2)} ${context.currencyLabel}`.trim() },
            { label: "Funding Check", value: context.transferAgentOps?.fundingCheckStatus || "Pending funding confirmation" },
            { label: "Payment List Status", value: context.transferAgentOps?.paymentListStatus || "Pending generation" },
          ],
          previewDetails: [
            { title: "Payment Preview", kind: "ta", items: topPaymentItems },
            { title: "TA Status", kind: "ta", items: taStatusItems },
          ],
          viewLinks: [
            { label: "View Payment List", tab: "payment-list" },
            ...(canShowSnapshot ? [{ label: "View Snapshot", tab: "snapshot" as const }] : []),
            ...(canShowSnapshot
              ? [{ label: "Open Manual Override", tab: "manual" as const }]
              : []),
          ],
        }),
      ];
    case "Burn On Chain":
      return [
        buildRedemptionActionConfig({
          label: "Close Window",
          nextStatus: "Window Closed",
          message: "Redemption close-out completed",
          icon: CheckCircle2,
          modalTitle: "Close Redemption Event",
          modalDescription:
            "Verify issuer identity before closing the redemption event and handing it into reconciliation.",
          reviewTitle: "Review Close-out",
          reviewDescription:
            "Confirm the burn instruction and payment list are complete before closing the current redemption event.",
          identityDescription:
            "Issuer identity and close-out authority are being verified.",
          workflowTitle: "Close Redemption Event",
          workflowDescription:
            "The redemption event is being moved into its final close-out state.",
          taTitle: "Close TA Event",
          taDescription:
            "The transfer agent is releasing the final payment file and marking the event for reconciliation.",
          successTitle: "Redemption closed",
          successDescription:
            "The redemption event has entered its completed reconciliation stage.",
          impactType: "ta",
          requiresTa: true,
          requiresOnChain: false,
          nextStepHint:
            "This action will close the redemption event, release the final TA settlement package, and mark the event complete.",
          affectedObjects: ["Released payment list", "Reconciliation memo", "Closed event record"],
          previewSummary: [
            { label: "Payment Rows", value: `${context.paymentRows.length}` },
            { label: "Batches", value: `${context.batchesCount}` },
            { label: "Reconciliation", value: context.transferAgentOps?.reconciliationStatus || "Pending" },
            { label: "Funding Check", value: context.transferAgentOps?.fundingCheckStatus || "Pending funding confirmation" },
          ],
          previewDetails: [{ title: "Payment Preview", kind: "ta", items: topPaymentItems }],
          viewLinks: [
            { label: "View Payment List", tab: "payment-list" },
            { label: "View Batches", tab: "batches" },
          ],
        }),
      ];
    default:
      return [];
  }
}

function getEditableRedemptionSections(config: FundRedemptionConfig): RedemptionEditableSection[] {
  if (["Draft", "Pending Approval"].includes(config.status)) {
    return ["details", "operations"];
  }
  if (["Announced", "Active", "Paused", "Window Open"].includes(config.status)) {
    return ["operations"];
  }
  return [];
}

function getRedemptionEditingPolicyMessage(config: FundRedemptionConfig) {
  const editableSections = getEditableRedemptionSections(config);
  if (editableSections.length === 0) {
    return "This stage is locked. Once the redemption cycle is closed, redemption details become read-only.";
  }
  if (editableSections.length === 2) {
    return "Current stage allows full editing of redemption details and operating rules.";
  }
  return "Current stage only allows operating-rule updates. Core redemption details are locked.";
}

function getEditableRedemptionFieldLabels(config: FundRedemptionConfig) {
  const editableSections = getEditableRedemptionSections(config);
  const labels: string[] = [];

  if (editableSections.includes("details")) {
    labels.push("redemption identity", "description", "effective dates", "window schedule", "reference NAV");
  }

  if (editableSections.includes("operations")) {
    labels.push(
      "settlement cycle",
      "cut-off time",
      "notice period",
      "per-investor redemption limit",
      "manual approval control",
    );
  }

  return labels;
}

function buildRedemptionControlChecks(
  redemption: FundRedemptionConfig,
  fund?: FundIssuance,
) {
  const minimumNoticePeriod = fund?.noticePeriodDays ?? 0;
  const hasWindowSchedule =
    redemption.redemptionMode !== "Window-based" ||
    (Boolean(redemption.windowStart) && Boolean(redemption.windowEnd));

  return [
    {
      label: "Linked fund is in an operating stage",
      ok: Boolean(fund) && !["Draft", "Pending Approval"].includes(fund.status),
      detail: fund ? fund.status : "Linked fund missing",
    },
    {
      label: "Reference NAV is available",
      ok: Boolean(redemption.latestNav),
      detail: redemption.latestNav || "No NAV value recorded",
    },
    {
      label: "Dealing cut-off is configured",
      ok: Boolean(redemption.cutOffTime),
      detail: redemption.cutOffTime || "Missing cut-off",
    },
    {
      label: "Settlement cycle is configured",
      ok: Boolean(redemption.settlementCycle),
      detail: redemption.settlementCycle || "Missing settlement cycle",
    },
    {
      label: "Notice period satisfies fund minimum",
      ok: redemption.noticePeriodDays >= minimumNoticePeriod,
      detail: `${redemption.noticePeriodDays} day(s) configured / minimum ${minimumNoticePeriod} day(s)`,
    },
    {
      label: "Window schedule is complete",
      ok: hasWindowSchedule,
      detail:
        redemption.redemptionMode === "Window-based"
          ? `${redemption.windowStart || "start missing"} to ${redemption.windowEnd || "end missing"}`
          : "Daily dealing does not require a separate window",
    },
    {
      label: "Per-investor limit and manual review are defined",
      ok: Boolean(redemption.maxRedemptionQuantityPerInvestor),
      detail: `${redemption.maxRedemptionQuantityPerInvestor} / manual approval ${redemption.manualApprovalRequired ? "on" : "off"}`,
    },
  ];
}

function buildRedemptionEditState(config: FundRedemptionConfig): RedemptionEditState {
  return {
    name: config.name,
    description: config.description,
    effectiveDate: toDateTimeLocal(config.effectiveDate),
    announcementDate: toDateTimeLocal(config.announcementDate),
    windowStart: toDateTimeLocal(config.windowStart),
    windowEnd: toDateTimeLocal(config.windowEnd),
    latestNav: config.latestNav,
    settlementCycle: config.settlementCycle,
    noticePeriodDays: String(config.noticePeriodDays),
    maxRedemptionQuantityPerInvestor: config.maxRedemptionQuantityPerInvestor,
    cutOffTime: config.cutOffTime,
    manualApprovalRequired: config.manualApprovalRequired,
    pauseRedemptionAfterListing: config.pauseRedemptionAfterListing,
  };
}

function OpenEndRedemptionOperatingCard({
  redemption,
}: {
  redemption: FundRedemptionConfig;
}) {
  if (redemption.redemptionMode === "Daily dealing") {
    const operatingState =
      redemption.status === "Paused"
        ? "Paused"
        : ["Snapshot Locked", "Payment List Ready", "Burn On Chain"].includes(redemption.status)
          ? "Close-out"
        : redemption.status === "Window Closed"
          ? "Cycle Closed"
          : "Live";
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Redemption Operating State</CardTitle>
          <p className="text-sm text-muted-foreground">
            Daily-dealing redemption does not run as a separate one-off window. It plugs into the
            fund's recurring cut-off, NAV, and settlement cycle once the module is active.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Module State</div>
            <div className="mt-1 font-medium">{operatingState}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Cut-off Time</div>
            <div className="mt-1 font-medium">{redemption.cutOffTime}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Settlement Cycle</div>
            <div className="mt-1 font-medium">{redemption.settlementCycle}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Per-investor Limit</div>
            <div className="mt-1 font-medium">
              {redemption.maxRedemptionQuantityPerInvestor}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const windowSteps = [
    { label: "Announced", description: "Notice period running" },
    { label: "Window Open", description: "Accept requests" },
    { label: "Paused", description: "Temporarily halted" },
    { label: "Window Closed", description: "Stop new requests" },
  ];

  const currentStepIndex =
    redemption.status === "Announced"
      ? 0
      : redemption.status === "Window Open" || redemption.status === "Active"
        ? 1
        : redemption.status === "Paused"
          ? 2
          : redemption.status === "Window Closed" ||
              redemption.status === "Snapshot Locked" ||
              redemption.status === "Payment List Ready" ||
              redemption.status === "Burn On Chain"
            ? 3
            : -1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Redemption Window</CardTitle>
        <p className="text-sm text-muted-foreground">
          This window state sits inside the active redemption module. It is an operating view, not
          a second fund lifecycle.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {windowSteps.map((step, index) => {
            const isCompleted = currentStepIndex > index;
            const isCurrent = currentStepIndex === index;
            return (
              <div key={step.label} className="flex items-center gap-2">
                <div
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium",
                    isCompleted && "border-green-200 bg-green-50 text-green-700",
                    isCurrent && "border-blue-200 bg-blue-50 text-blue-700",
                    !isCompleted && !isCurrent && "border-slate-200 bg-white text-slate-500",
                  )}
                >
                  {step.label}
                </div>
                {index < windowSteps.length - 1 && <div className="h-px w-4 bg-slate-200" />}
              </div>
            );
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Announcement Date</div>
            <div className="mt-1 font-medium">{redemption.announcementDate || "N/A"}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Window Start</div>
            <div className="mt-1 font-medium">{redemption.windowStart || "N/A"}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Window End</div>
            <div className="mt-1 font-medium">{redemption.windowEnd || "N/A"}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Current Module State</div>
            <div className="mt-1 font-medium">{redemption.status}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RedemptionSetupEditor({
  redemption,
  fund,
  onSave,
  onCancel,
}: {
  redemption: FundRedemptionConfig;
  fund?: FundIssuance;
  onSave: (updates: Partial<FundRedemptionConfig>) => void;
  onCancel: () => void;
}) {
  const editableSections = getEditableRedemptionSections(redemption);
  const [form, setForm] = useState<RedemptionEditState>(() => buildRedemptionEditState(redemption));

  useEffect(() => {
    setForm(buildRedemptionEditState(redemption));
  }, [redemption]);

  const canEditDetails = editableSections.includes("details");
  const canEditOperations = editableSections.includes("operations");

  const setField = <K extends keyof RedemptionEditState,>(
    key: K,
    value: RedemptionEditState[K],
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const handleSave = () => {
    const noticePeriodValue = Number(form.noticePeriodDays);
    const minimumNoticePeriod = fund?.noticePeriodDays ?? 0;

    if (!Number.isFinite(noticePeriodValue) || noticePeriodValue < 0) {
      toast.error("Notice period must be 0 or greater.");
      return;
    }

    if (noticePeriodValue < minimumNoticePeriod) {
      toast.error(`Notice period cannot be lower than the fund minimum of ${minimumNoticePeriod} day(s).`);
      return;
    }

    if (form.settlementCycle.trim() === "") {
      toast.error("Settlement cycle is required.");
      return;
    }

    if (form.cutOffTime.trim() === "") {
      toast.error("Cut-off time is required.");
      return;
    }

    if (redemption.redemptionMode === "Window-based") {
      if (!form.windowStart || !form.windowEnd) {
        toast.error("Window-based redemption requires both window start and window end.");
        return;
      }

      if (form.windowStart >= form.windowEnd) {
        toast.error("Window end must be later than window start.");
        return;
      }
    }

    onSave({
      name: form.name.trim() || redemption.name,
      description: form.description.trim() || redemption.description,
      effectiveDate: fromDateTimeLocal(form.effectiveDate) || redemption.effectiveDate,
      announcementDate: fromDateTimeLocal(form.announcementDate),
      windowStart: fromDateTimeLocal(form.windowStart),
      windowEnd: fromDateTimeLocal(form.windowEnd),
      latestNav: form.latestNav.trim() || redemption.latestNav,
      settlementCycle: form.settlementCycle,
      noticePeriodDays: noticePeriodValue,
      maxRedemptionQuantityPerInvestor:
        form.maxRedemptionQuantityPerInvestor.trim() ||
        redemption.maxRedemptionQuantityPerInvestor,
      cutOffTime: form.cutOffTime,
      manualApprovalRequired: form.manualApprovalRequired,
      pauseRedemptionAfterListing: form.pauseRedemptionAfterListing,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Mode</CardTitle>
        <p className="text-sm text-muted-foreground">
          {getRedemptionEditingPolicyMessage(redemption)}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {canEditDetails && (
          <div className="space-y-4 rounded-lg border p-4">
            <div>
              <h3 className="font-medium">Redemption Details</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Core redemption identity and the dates that define this redemption operation.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Redemption name</Label>
                <Input value={form.name} onChange={(event) => setField("name", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Latest NAV</Label>
                <Input value={form.latestNav} onChange={(event) => setField("latestNav", event.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(event) => setField("description", event.target.value)} rows={3} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Effective date</Label>
                <Input type="datetime-local" value={form.effectiveDate} onChange={(event) => setField("effectiveDate", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Announcement date</Label>
                <Input type="datetime-local" value={form.announcementDate} onChange={(event) => setField("announcementDate", event.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Window start</Label>
                <Input type="datetime-local" value={form.windowStart} onChange={(event) => setField("windowStart", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Window end</Label>
                <Input type="datetime-local" value={form.windowEnd} onChange={(event) => setField("windowEnd", event.target.value)} />
              </div>
            </div>
          </div>
        )}

        {canEditOperations && (
          <div className="space-y-4 rounded-lg border p-4">
            <div>
              <h3 className="font-medium">Operating Rules</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Rules that control how the redemption stays active after approval.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
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
              <div className="space-y-2">
                <Label>Notice period (days)</Label>
                <Input type="number" value={form.noticePeriodDays} onChange={(event) => setField("noticePeriodDays", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Cut-off time</Label>
                <Input type="time" value={form.cutOffTime} onChange={(event) => setField("cutOffTime", event.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Max redemption per investor</Label>
              <Input value={form.maxRedemptionQuantityPerInvestor} onChange={(event) => setField("maxRedemptionQuantityPerInvestor", event.target.value)} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <div className="font-medium">Manual approval required</div>
                </div>
                <Switch checked={form.manualApprovalRequired} onCheckedChange={(checked) => setField("manualApprovalRequired", checked)} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <div className="font-medium">Pause after listing</div>
                </div>
                <Switch checked={form.pauseRedemptionAfterListing} onCheckedChange={(checked) => setField("pauseRedemptionAfterListing", checked)} />
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

export function FundRedemptionDetail() {
  const { id, fundId } = useParams();
  const location = useLocation();
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [hasAppliedEditIntent, setHasAppliedEditIntent] = useState(false);
  const [detailTab, setDetailTab] = useState<RedemptionTab>("overview");
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<RedemptionWorkflowActionConfig | null>(null);
  const [requestActionModalOpen, setRequestActionModalOpen] = useState(false);
  const [pendingRequestAction, setPendingRequestAction] = useState<
    (ReturnType<typeof getRedemptionRequestActionConfig> & { orderId: string }) | null
  >(null);
  const detailSectionRef = useRef<HTMLDivElement | null>(null);
  const {
    fundRedemptions,
    fundOrders,
    fundBatches,
    fundIssuances,
    updateFundRedemption,
    updateRedemptionStatus,
    updateFundOrderStatus,
    getPermissionResult,
    userRole,
  } = useApp();

  const redemption = fundRedemptions.find(
    (item) => item.id === id && (!fundId || item.fundId === fundId),
  );

  if (!redemption) {
    return (
      <div className="container mx-auto px-6 py-20 text-center">
        <h2>Redemption Not Found</h2>
        <p className="text-muted-foreground mt-2">
          The redemption operation you are looking for does not exist or has been removed.
        </p>
      </div>
    );
  }

  const fund = fundIssuances.find((item) => item.id === redemption.fundId);
  const inFundContext = Boolean(fundId);
  const redemptionsListPath = inFundContext
    ? `/fund-issuance/${fundId}/redemptions`
    : "/manage/fund-redemption";
  const isOpenEndFund = fund?.fundType === "Open-end";
  const requests = fundOrders.filter(
    (order) => order.fundId === redemption.fundId && order.type === "redemption",
  );
  const manualExcludedRequestIds = redemption.manualExcludedRequestIds || [];
  const activeSettlementRequests = requests.filter(
    (request) => !manualExcludedRequestIds.includes(request.id),
  );
  const manuallyExcludedRequests = requests.filter((request) =>
    manualExcludedRequestIds.includes(request.id),
  );
  const paymentRows = buildRedemptionPaymentRows(activeSettlementRequests);
  const holderSnapshotRows = buildHolderSnapshotRows(activeSettlementRequests);
  const batches = fundBatches.filter(
    (batch) => batch.fundId === redemption.fundId && batch.type === "redemption",
  );
  const redemptionCurrency =
    requests[0]?.estimatedSharesOrCash.split(" ").slice(-1)[0] ||
    requests[0]?.confirmedSharesOrCash?.split(" ").slice(-1)[0] ||
    redemption.latestNav.split(" ").slice(-1)[0] ||
    "";
  const setupActions = getStructuredRedemptionActions(redemption, {
    fund,
    requests,
    activeSettlementRequests,
    manuallyExcludedRequests,
    holderSnapshotRows,
    paymentRows,
    transferAgentOps: redemption.transferAgentOps,
    currencyLabel: redemptionCurrency,
    batchesCount: batches.length,
  });
  const primarySetupAction = setupActions.find((action) => action.variant === "default") || null;
  const secondarySetupActions = setupActions.filter((action) => action !== primarySetupAction);
  const redemptionWorkflowTimings: WorkflowStepTiming[] = isOpenEndFund
    ? [
        {
          planned: formatWorkflowTiming(redemption.createdTime),
          actual:
            redemption.status !== "Draft" ? formatWorkflowTiming(redemption.createdTime) : undefined,
        },
        {
          planned: formatWorkflowTiming(redemption.effectiveDate),
          actual:
            redemption.status !== "Draft" && redemption.status !== "Pending Approval"
              ? formatWorkflowTiming(redemption.effectiveDate)
              : undefined,
        },
        {
          planned: formatWorkflowTiming(redemption.windowEnd || redemption.effectiveDate),
          actual:
            ["Snapshot Locked", "Payment List Ready", "Burn On Chain", "Window Closed"].includes(
              redemption.status,
            )
              ? formatWorkflowTiming(redemption.windowEnd || redemption.effectiveDate)
              : undefined,
        },
        {
          planned: formatWorkflowTiming(redemption.windowEnd || redemption.effectiveDate),
          actual:
            redemption.status === "Window Closed"
              ? formatWorkflowTiming(redemption.lastActionAt || redemption.windowEnd || redemption.effectiveDate)
              : undefined,
        },
      ]
    : [
        {
          planned: formatWorkflowTiming(redemption.createdTime),
          actual:
            redemption.status !== "Draft" ? formatWorkflowTiming(redemption.createdTime) : undefined,
        },
        {
          planned: formatWorkflowTiming(redemption.announcementDate || redemption.effectiveDate),
          actual:
            !["Draft", "Pending Approval"].includes(redemption.status)
              ? formatWorkflowTiming(redemption.announcementDate || redemption.effectiveDate)
              : undefined,
        },
        {
          planned: formatWorkflowTiming(redemption.windowEnd || redemption.windowStart),
          actual:
            ["Snapshot Locked", "Payment List Ready", "Burn On Chain", "Window Closed"].includes(
              redemption.status,
            )
              ? formatWorkflowTiming(redemption.windowEnd || redemption.windowStart)
              : undefined,
        },
        {
          planned: formatWorkflowTiming(redemption.windowEnd || redemption.effectiveDate),
          actual:
            ["Window Closed"].includes(redemption.status)
              ? formatWorkflowTiming(redemption.windowEnd || redemption.lastActionAt)
              : undefined,
        },
        {
          planned: formatWorkflowTiming(redemption.lastActionAt || redemption.windowEnd),
          actual:
            redemption.status === "Window Closed"
              ? formatWorkflowTiming(redemption.lastActionAt || redemption.windowEnd)
              : undefined,
        },
      ];
  const updatePermission = getPermissionResult("update", "redemption");
  const editableSections = getEditableRedemptionSections(redemption);
  const canEditSetup = userRole === "issuer" && updatePermission.allowed && editableSections.length > 0;
  const editableFieldLabels = getEditableRedemptionFieldLabels(redemption);
  const controlChecks = buildRedemptionControlChecks(redemption, fund);
  const editIntentRequested = new URLSearchParams(location.search).get("mode") === "edit";
  const transferAgentOps = redemption.transferAgentOps;
  const showTransferAgentLayer = !isOpenEndFund || Boolean(transferAgentOps);
  const totalSnapshotUnits = holderSnapshotRows.reduce(
    (sum, row) => sum + parseLeadingNumber(row.snapshotUnits),
    0,
  );
  const totalEstimatedCash = holderSnapshotRows.reduce(
    (sum, row) => sum + parseLeadingNumber(row.estimatedCash),
    0,
  );
  const paidPaymentCount = paymentRows.filter((row) => row.paymentStatus === "Paid").length;
  const transferAgentFields = [
    {
      label: "Register date",
      value: transferAgentOps?.holderRegisterDate || redemption.windowEnd || "Pending register cut-off",
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
      label: "Payment list status",
      value: transferAgentOps?.paymentListStatus || "Pending generation",
    },
    {
      label: "Payment list generated at",
      value: transferAgentOps?.paymentListGeneratedAt || "Not generated yet",
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
        : "Waiting for the transfer agent to validate the holder register.",
      status: transferAgentOps?.holderRegisterDate ? "done" : "pending",
    },
    {
      label: "Holder snapshot locked",
      detail: transferAgentOps?.holderSnapshotId
        ? `${transferAgentOps.holderSnapshotId} locked at ${transferAgentOps.holderSnapshotLockedAt || "TA lock time pending"}.`
        : "Snapshot lock will happen after the participation window is finalized.",
      status: transferAgentOps?.holderSnapshotId ? "done" : "pending",
    },
    {
      label: "Payment list generated",
      detail: transferAgentOps?.paymentListStatus
        ? `${transferAgentOps.paymentListStatus}${transferAgentOps.paymentListGeneratedAt ? ` at ${transferAgentOps.paymentListGeneratedAt}` : ""}.`
        : "Payment list has not been generated yet.",
      status:
        includesKeyword(transferAgentOps?.paymentListStatus, "generated") ||
        includesKeyword(transferAgentOps?.paymentListStatus, "ready")
          ? "done"
          : "pending",
    },
    {
      label: "Funding confirmed",
      detail: transferAgentOps?.fundingCheckStatus
        ? `${transferAgentOps.fundingCheckStatus}${transferAgentOps.fundingConfirmedAt ? ` at ${transferAgentOps.fundingConfirmedAt}` : ""}.`
        : "Issuer funding has not been confirmed yet.",
      status: includesKeyword(transferAgentOps?.fundingCheckStatus, "confirmed")
        ? "done"
        : transferAgentOps?.fundingCheckStatus
          ? "attention"
          : "pending",
    },
    {
      label: "Payment execution completed",
      detail:
        paymentRows.length > 0
          ? `${paidPaymentCount} of ${paymentRows.length} payment rows are marked paid.`
          : "No payment rows have been released yet.",
      status:
        paymentRows.length > 0 && paidPaymentCount === paymentRows.length
          ? "done"
          : paidPaymentCount > 0
            ? "attention"
            : "pending",
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

  useEffect(() => {
    setHasAppliedEditIntent(false);
  }, [redemption.id]);

  useEffect(() => {
    if (editIntentRequested && canEditSetup && !hasAppliedEditIntent) {
      setIsInlineEditing(true);
      setHasAppliedEditIntent(true);
    }
  }, [editIntentRequested, canEditSetup, hasAppliedEditIntent]);

  const openDetailTab = (tab: RedemptionTab) => {
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

  const handleExcludeFromSettlement = (request: FundOrder) => {
    const updated = updateFundRedemption(
      redemption.id,
      {
        manualExcludedRequestIds: [...manualExcludedRequestIds, request.id],
      },
      "manage",
    );
    if (!updated) return;
    toast.success(`${request.investorName} removed from the settlement roster`);
  };

  const handleRestoreToSettlement = (request: FundOrder) => {
    const updated = updateFundRedemption(
      redemption.id,
      {
        manualExcludedRequestIds: manualExcludedRequestIds.filter(
          (requestId) => requestId !== request.id,
        ),
      },
      "manage",
    );
    if (!updated) return;
    toast.success(`${request.investorName} restored to the settlement roster`);
  };

  const handleStatusChange = (nextStatus: typeof redemption.status, message: string) => {
    if (!pendingAction) return;
    const updated = updateRedemptionStatus(
      redemption.id,
      nextStatus,
      getRedemptionPermissionAction(pendingAction.label),
    );
    if (!updated) return;
    toast.success(message);
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight className="w-4 h-4" />
        {inFundContext && fund ? (
          <>
            <Link
              to={`/fund-issuance/${fund.id}`}
              className="hover:text-foreground transition-colors"
            >
              {fund.name}
            </Link>
            <ChevronRight className="w-4 h-4" />
          </>
        ) : null}
        <Link to={redemptionsListPath} className="hover:text-foreground transition-colors">
          {inFundContext ? "Fund Redemptions" : "Global Redemption Queue"}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground">{redemption.name}</span>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4 gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 style={{ fontFamily: "var(--font-heading)" }}>{redemption.name}</h1>
              <StatusBadge status={redemption.status} />
              <Badge variant="outline">{redemption.redemptionMode}</Badge>
            </div>
            {inFundContext && fund ? (
              <p className="text-sm text-muted-foreground mt-2">
                Redemption operation for {fund.name}
              </p>
            ) : null}
            <p className="text-muted-foreground mt-2 max-w-3xl">{redemption.description}</p>
          </div>
        </div>

        <InfoAlert
          variant="info"
          title={isOpenEndFund ? "Open-end Redemption Module" : "Redemption Operations"}
        >
          {isOpenEndFund
            ? "For open-end funds, redemption should be read as a standing module plus the current dealing cycle. The top progress bar tracks module setup and current-cycle close-out rather than a one-off event."
            : "This page tracks a one-off holder cash-out workflow, including request review, payment-list preparation, and final cash settlement."}
        </InfoAlert>
      </div>

      <div className="mb-8">
        <FundRedemptionWorkflow
          currentStatus={redemption.status}
          stepTimings={redemptionWorkflowTimings}
          workflowModel={isOpenEndFund ? "open-end" : "default"}
          actionPanel={
            primarySetupAction ? (
              <RedemptionNextActionPanel
                action={primarySetupAction}
                currentStatus={redemption.status}
                disabled={
                  !getPermissionResult(
                    getRedemptionPermissionAction(primarySetupAction.label),
                    "redemption",
                  ).allowed
                }
                disabledReason={
                  getPermissionResult(
                    getRedemptionPermissionAction(primarySetupAction.label),
                    "redemption",
                  ).reason
                }
                secondaryActions={secondarySetupActions}
                onOpen={() => {
                  setPendingAction(primarySetupAction);
                  setActionModalOpen(true);
                }}
                onOpenSecondary={(action) => {
                  setPendingAction(action);
                  setActionModalOpen(true);
                }}
                onViewMore={(link) => openDetailTab(link.tab)}
              />
            ) : undefined
          }
        />
      </div>

      {isOpenEndFund && (
        <div className="mb-8">
          <OpenEndRedemptionOperatingCard redemption={redemption} />
        </div>
      )}

      <div className="mb-8 flex flex-col gap-4 rounded-lg border bg-secondary/20 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-medium">Field Editing Policy</div>
          <div className="mt-1 text-sm text-muted-foreground">
            {getRedemptionEditingPolicyMessage(redemption)}
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
              This redemption is currently view-only, so the page opened in review mode instead of edit mode.
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
          <RedemptionSetupEditor
            redemption={redemption}
            fund={fund}
            onCancel={() => setIsInlineEditing(false)}
            onSave={(updates) => {
              const updated = updateFundRedemption(redemption.id, updates, "update");
              if (!updated) return;
              setIsInlineEditing(false);
              toast.success("Allowed redemption fields updated");
            }}
          />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <div className="text-muted-foreground mb-1">Fund</div>
                <div className="font-medium">{redemption.fundName}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Fund Token</div>
                <div className="font-medium">{redemption.fundToken}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Latest NAV</div>
                <div className="font-medium">{redemption.latestNav}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Cut-off Time</div>
                <div className="font-medium">{redemption.cutOffTime}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Settlement Cycle</div>
                <div className="font-medium">{redemption.settlementCycle}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Notice Period</div>
                <div className="font-medium">{redemption.noticePeriodDays} day(s)</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Max Redemption / Investor</div>
                <div className="font-medium">{redemption.maxRedemptionQuantityPerInvestor}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Manual Approval</div>
                <div className="font-medium">{redemption.manualApprovalRequired ? "Yes" : "No"}</div>
              </div>
              {redemption.windowStart && (
                <div>
                  <div className="text-muted-foreground mb-1">Window</div>
                  <div className="font-medium">
                    {redemption.windowStart} to {redemption.windowEnd}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {showTransferAgentLayer && (
            <TransferAgentOperationsCard
              description="This panel makes the transfer-agent operating role explicit: holder snapshot, payment-list generation, funding check, and close-out."
              operatorName={transferAgentOps?.transferAgentName || "Transfer agent assignment pending"}
              status={transferAgentOps?.transferAgentStatus || "Pending Snapshot"}
              fields={transferAgentFields}
              note="For this closed-end redemption event, the transfer agent controls the holder snapshot and publishes the payment list after the participation window closes."
            />
          )}

          {fund && (
            <Card>
              <CardHeader>
                <CardTitle>Linked Fund Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <div className="text-muted-foreground mb-1">Current Fund Status</div>
                  <div className="font-medium">{fund.status}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Current NAV</div>
                  <div className="font-medium">{fund.currentNav}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Next Settlement</div>
                  <div className="font-medium">{fund.nextSettlementTime || "N/A"}</div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Operational Checklist</CardTitle>
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
                      <Icon
                        className={cn(
                          "mt-0.5 h-4 w-4 shrink-0",
                          check.ok ? "text-green-600" : "text-amber-600",
                        )}
                      />
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
              description="These controls focus on transfer-agent workflow readiness rather than issuer form fields."
              items={[...transferAgentChecklistItems]}
            />
          )}
        </div>

        <div ref={detailSectionRef} className="lg:col-span-2 scroll-mt-24">
          <Tabs value={detailTab} onValueChange={(value) => setDetailTab(value as RedemptionTab)} className="space-y-6">
            <TabsList
              className={cn(
                "grid w-full",
                isOpenEndFund ? "grid-cols-4" : userRole === "issuer" ? "grid-cols-6" : "grid-cols-5",
              )}
            >
              <TabsTrigger value="overview">Overview</TabsTrigger>
              {!isOpenEndFund && <TabsTrigger value="snapshot">Holder Snapshot</TabsTrigger>}
              <TabsTrigger value="requests">Requests</TabsTrigger>
              <TabsTrigger value="payment-list">Payment List</TabsTrigger>
              <TabsTrigger value="batches">Batch History</TabsTrigger>
              {!isOpenEndFund && userRole === "issuer" && (
                <TabsTrigger value="manual">Manual Override</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-1">Active Settlement Requests</div>
                    <div className="text-2xl font-semibold">{activeSettlementRequests.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-1">Pending Review</div>
                    <div className="text-2xl font-semibold">
                      {requests.filter((item) => item.status === "Pending Review").length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-1">Manual Overrides</div>
                    <div className="text-2xl font-semibold">
                      {manuallyExcludedRequests.length}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Operating Notes</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-3">
                  <p>
                    Redemption requests are processed against the official fund NAV and may be reviewed manually before they move into cash settlement.
                  </p>
                  <p>
                    For the demo, this redemption also doubles as the main place to explain redemption gates, cut-off handling, and T+1 cash settlement behavior.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Manager Controls</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 text-sm">
                  <div className="rounded-lg border p-4">
                    <div className="text-muted-foreground">Approval Control</div>
                    <div className="mt-1 font-medium">
                      {redemption.manualApprovalRequired
                        ? "Manual issuer review before NAV"
                        : "Straight-through after submission"}
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-muted-foreground">Per-investor Limit</div>
                    <div className="mt-1 font-medium">{redemption.maxRedemptionQuantityPerInvestor}</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-muted-foreground">Notice and Activation</div>
                    <div className="mt-1 font-medium">
                      {redemption.noticePeriodDays} day(s) / {redemption.pauseRedemptionAfterListing ? "pause after listing enabled" : "activate immediately"}
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-muted-foreground">Settlement Discipline</div>
                    <div className="mt-1 font-medium">
                      {redemption.cutOffTime} / {redemption.settlementCycle}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {!isOpenEndFund && (
              <TabsContent value="snapshot" className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground mb-1">Snapshot ID</div>
                      <div className="text-2xl font-semibold">
                        {transferAgentOps?.holderSnapshotId || "Pending"}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground mb-1">Eligible Holders</div>
                      <div className="text-2xl font-semibold">{holderSnapshotRows.length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground mb-1">Eligible Units</div>
                      <div className="text-2xl font-semibold">
                        {totalSnapshotUnits.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Snapshot Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2 text-sm">
                    <div className="rounded-lg border p-4">
                      <div className="text-muted-foreground">Register Date</div>
                      <div className="mt-1 font-medium">
                        {transferAgentOps?.holderRegisterDate || redemption.windowEnd || "Pending"}
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-muted-foreground">Snapshot Locked At</div>
                      <div className="mt-1 font-medium">
                        {transferAgentOps?.holderSnapshotLockedAt || "Pending"}
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-muted-foreground">Estimated Cash Out</div>
                      <div className="mt-1 font-medium">
                        {totalEstimatedCash.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
                        {requests[0]?.estimatedSharesOrCash.split(" ").slice(-1)[0] || ""}
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-muted-foreground">Payment List Status</div>
                      <div className="mt-1 font-medium">
                        {transferAgentOps?.paymentListStatus || "Pending generation"}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Holder Snapshot</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Investor</TableHead>
                          <TableHead>Settlement Account</TableHead>
                          <TableHead>Snapshot Units</TableHead>
                          <TableHead>Estimated Cash</TableHead>
                          <TableHead>Request Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {holderSnapshotRows.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="font-medium">{row.investorName}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {row.destinationAccount}
                            </TableCell>
                            <TableCell>{row.snapshotUnits}</TableCell>
                            <TableCell>{row.estimatedCash}</TableCell>
                            <TableCell>
                              <StatusBadge status={row.requestStatus} />
                            </TableCell>
                          </TableRow>
                        ))}
                        {holderSnapshotRows.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                              No holder snapshot has been generated yet.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            <TabsContent value="requests">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Investor</TableHead>
                    <TableHead>Requested Shares</TableHead>
                    <TableHead>Estimated Cash</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submit Time</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => {
                    const nextAction = getNextRedemptionOrderAction(request);
                    const permission = nextAction
                      ? getPermissionResult(
                          getRedemptionOrderPermissionAction(nextAction.label),
                          "order",
                        )
                      : { allowed: true };
                    return (
                      <TableRow key={request.id}>
                        <TableCell className="font-mono text-xs">{request.id}</TableCell>
                        <TableCell>
                          <div className="font-medium">{request.investorName}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                            {request.investorWallet}
                          </div>
                        </TableCell>
                        <TableCell>{request.requestQuantity}</TableCell>
                        <TableCell>{request.estimatedSharesOrCash}</TableCell>
                        <TableCell>
                          <StatusBadge status={request.status} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {request.submitTime}
                        </TableCell>
                        <TableCell>
                          {nextAction ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!permission.allowed}
                              title={permission.allowed ? undefined : permission.reason}
                              onClick={() => {
                                const actionConfig = getRedemptionRequestActionConfig(request);
                                if (!actionConfig) return;
                                setPendingRequestAction({
                                  ...actionConfig,
                                  orderId: request.id,
                                });
                                setRequestActionModalOpen(true);
                              }}
                            >
                              {nextAction.label}
                            </Button>
                          ) : (
                            <span className="text-sm text-muted-foreground">No action</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="payment-list" className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-1">Payment Rows</div>
                    <div className="text-2xl font-semibold">{paymentRows.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-1">Ready / Paid</div>
                    <div className="text-2xl font-semibold">
                      {paymentRows.filter((row) => row.paymentStatus === "Ready" || row.paymentStatus === "Paid").length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-1">Total Gross Amount</div>
                    <div className="text-2xl font-semibold">
                      {paymentRows
                        .reduce((sum, row) => sum + parseLeadingNumber(row.grossAmount), 0)
                        .toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {redemptionCurrency}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Redemption Payment List</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Investor</TableHead>
                        <TableHead>Destination Account</TableHead>
                        <TableHead>Units Accepted</TableHead>
                        <TableHead>Price / Unit</TableHead>
                        <TableHead>Gross Amount</TableHead>
                        <TableHead>Net Amount</TableHead>
                        <TableHead>Payment Status</TableHead>
                        <TableHead>Reference</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentRows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.investorName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {row.destinationAccount}
                          </TableCell>
                          <TableCell>{row.unitsAccepted}</TableCell>
                          <TableCell>{row.pricePerUnit}</TableCell>
                          <TableCell>{row.grossAmount}</TableCell>
                          <TableCell>{row.netAmount}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{row.paymentStatus}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{row.paymentReference}</TableCell>
                        </TableRow>
                      ))}
                      {paymentRows.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                            No payment rows have been generated yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {!isOpenEndFund && userRole === "issuer" && (
              <TabsContent value="manual" className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground mb-1">Active Roster</div>
                      <div className="text-2xl font-semibold">{activeSettlementRequests.length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground mb-1">Excluded Requests</div>
                      <div className="text-2xl font-semibold">{manuallyExcludedRequests.length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground mb-1">Requested Units</div>
                      <div className="text-2xl font-semibold">
                        {formatRedemptionNumber(
                          activeSettlementRequests.reduce(
                            (sum, request) => sum + parseLeadingNumber(request.requestQuantity),
                            0,
                          ),
                          2,
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Manual Settlement Override</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Request ID</TableHead>
                          <TableHead>Investor</TableHead>
                          <TableHead>Requested Shares</TableHead>
                          <TableHead>Estimated Cash</TableHead>
                          <TableHead>Settlement Roster</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {requests.map((request) => {
                          const excluded = manualExcludedRequestIds.includes(request.id);
                          return (
                            <TableRow key={`${request.id}-manual`}>
                              <TableCell className="font-mono text-xs">{request.id}</TableCell>
                              <TableCell>
                                <div className="font-medium">{request.investorName}</div>
                                <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                                  {request.investorWallet}
                                </div>
                              </TableCell>
                              <TableCell>{request.requestQuantity}</TableCell>
                              <TableCell>{request.estimatedSharesOrCash}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{excluded ? "Excluded" : "Included"}</Badge>
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={request.status} />
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    excluded
                                      ? handleRestoreToSettlement(request)
                                      : handleExcludeFromSettlement(request)
                                  }
                                >
                                  {excluded ? "Restore" : "Exclude"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            <TabsContent value="batches">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch ID</TableHead>
                    <TableHead>Cut-off Time</TableHead>
                    <TableHead>NAV</TableHead>
                    <TableHead>Order Count</TableHead>
                    <TableHead>Total Shares</TableHead>
                    <TableHead>Total Cash</TableHead>
                    <TableHead>Settlement</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-mono text-xs">{batch.id}</TableCell>
                      <TableCell>{batch.cutoffTime}</TableCell>
                      <TableCell>{batch.nav}</TableCell>
                      <TableCell>{batch.orderCount}</TableCell>
                      <TableCell>{batch.totalQuantity}</TableCell>
                      <TableCell>{batch.totalAmount}</TableCell>
                      <TableCell>{batch.settlementDate}</TableCell>
                      <TableCell>
                        <StatusBadge status={batch.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
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

      {pendingRequestAction && (
        <OperationActionModal
          open={requestActionModalOpen}
          onOpenChange={(open) => {
            setRequestActionModalOpen(open);
            if (!open) {
              setPendingRequestAction(null);
            }
          }}
          onSuccess={() => {
            const updated = updateFundOrderStatus(
              pendingRequestAction.orderId,
              pendingRequestAction.nextStatus,
              getRedemptionOrderPermissionAction(pendingRequestAction.label),
            );
            if (!updated) return;
            toast.success(
              `${pendingRequestAction.orderId} moved to ${pendingRequestAction.nextStatus}`,
            );
          }}
          title={pendingRequestAction.modalTitle}
          description={pendingRequestAction.modalDescription}
          steps={pendingRequestAction.modalSteps}
          startLabel="Start"
          completionLabel="Done"
          summary={[
            { label: "Request ID", value: pendingRequestAction.orderId },
            { label: "Linked Fund", value: redemption.fundName },
            { label: "Current Status", value: requests.find((item) => item.id === pendingRequestAction.orderId)?.status || "N/A" },
            { label: "Requested Shares", value: requests.find((item) => item.id === pendingRequestAction.orderId)?.requestQuantity || "N/A" },
          ]}
        />
      )}
    </div>
  );
}
