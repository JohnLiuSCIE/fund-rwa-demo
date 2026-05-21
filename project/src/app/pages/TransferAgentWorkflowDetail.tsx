import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Circle, Clock3, FileCheck2, ShieldCheck, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "../components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { MetricCard } from "../components/MetricCard";
import {
  OperationActionModal,
  type ActionModalStep,
  type ActionModalSummaryItem,
} from "../components/modals/OperationActionModal";
import {
  ApprovalReviewWorkspace,
  type ApprovalReviewCashFlow,
  type ApprovalReviewEvidenceRow,
  type ApprovalReviewMetric,
  type ApprovalReviewTableRow,
  type ReviewTone,
} from "../components/ApprovalReviewWorkspace";
import { SnapshotReviewPanel } from "../components/transfer-agent/SnapshotReviewPanel";
import { useApp } from "../context/AppContext";
import { cn } from "../components/ui/utils";
import { shouldShowTaWorkflowApprovalWorkspace } from "../lib/approvalWorkspaceVisibility";
import { collectOrderLinkedFundingEvidence } from "../lib/transferAgency";
import {
  getWorkflowReviewChecklist,
  getWorkflowSteps,
  getWorkflowTaskActionLabel,
  isRedemptionCloseOutReference,
  type WorkflowActionLog,
  type WorkflowStepId,
  type WorkflowTaskStatus,
} from "../lib/workflowBackend";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";
type SecureAction =
  | "submit"
  | "return";

function taskVariant(status: WorkflowTaskStatus): BadgeVariant {
  if (status === "Blocked" || status === "Returned") return "destructive";
  if (status === "Ready For Approval" || status === "Ready To Reconcile") return "default";
  if (status === "Awaiting Issuer" || status === "Match Required") return "secondary";
  return "outline";
}

function actionStepId(log: WorkflowActionLog): WorkflowStepId {
  if (log.stepId) return log.stepId;
  if (log.action === "create") return "IssuerSubmitted";
  if (log.action === "accept" || log.action === "pull" || log.action === "respond") return "TARespond";
  if (log.action === "match" || log.action === "return" || log.action === "savePackage" || log.action === "decision") return "MatchData";
  if (log.action === "acknowledge") return "IssuerAcknowledge";
  if (log.action === "reconcile") return "ReconcileCloseOut";
  return "LockSnapshot";
}

function actorLabel(role: WorkflowActionLog["actorRole"]) {
  if (role === "transferAgent") return "Transfer Agent";
  if (role === "issuer") return "Issuer";
  return "Investor";
}

function actionLabel(action: WorkflowActionLog["action"]) {
  const labels: Record<WorkflowActionLog["action"], string> = {
    create: "Submitted",
    accept: "Accepted",
    pull: "Pulled",
    respond: "Responded",
    match: "Matched",
    return: "Returned",
    submit: "Submitted",
    acknowledge: "Acknowledged",
    reconcile: "Reconciled",
    savePackage: "Package Saved",
    decision: "Decision Recorded",
  };
  return labels[action];
}

function formatActionTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function getTaReviewTone(status?: string): ReviewTone {
  const normalized = status?.toLowerCase() || "";
  if (
    normalized.includes("complete") ||
    normalized.includes("confirmed") ||
    normalized.includes("cleared") ||
    normalized.includes("matched") ||
    normalized.includes("paid") ||
    normalized.includes("ready") ||
    normalized.includes("approved") ||
    normalized.includes("included") ||
    normalized.includes("booked")
  ) {
    return "success";
  }
  if (
    normalized.includes("blocked") ||
    normalized.includes("failed") ||
    normalized.includes("rejected") ||
    normalized.includes("excluded")
  ) {
    return "danger";
  }
  if (
    normalized.includes("pending") ||
    normalized.includes("awaiting") ||
    normalized.includes("expected") ||
    normalized.includes("proof") ||
    normalized.includes("submitted")
  ) {
    return "warning";
  }
  return "default";
}

export function TransferAgentWorkflowDetail() {
  const { taskId } = useParams();
  const [reviewSheetOpen, setReviewSheetOpen] = useState(false);
  const [secureAction, setSecureAction] = useState<SecureAction | null>(null);
  const app = useApp();
  const {
    fundIssuances,
    fundDistributions,
    fundRedemptions,
    fundOrders,
    workflowState,
    holderSnapshots,
    holderSnapshotPositions,
    settlementLists,
    settlementListLines,
    cashMovements,
    evidenceRecords,
    workflowUpdateChecklist,
    workflowMatchTask,
    workflowReturnTask,
    workflowSubmitCurrentStep,
  } = app;

  const task = workflowState.tasks.find((item) => item.taskId === taskId);
  const instance = task ? workflowState.instances.find((item) => item.workflowId === task.workflowId) : undefined;
  const fund = instance ? fundIssuances.find((item) => item.id === instance.fundId) : undefined;
  const sourceDistribution =
    instance?.sourceType === "Distribution"
      ? fundDistributions.find((item) => item.id === instance.sourceReference)
      : undefined;
  const relatedRedemptionOrder =
    instance?.sourceType === "Redemption"
      ? fundOrders.find(
          (item) => item.id === instance.sourceReference || instance.relatedOrderIds?.includes(item.id),
        )
      : undefined;
  const redemptionEventReference =
    instance?.sourceType === "Redemption"
      ? instance.sourceEventReference ||
        (fundRedemptions.some((item) => item.id === instance.sourceReference) ? instance.sourceReference : undefined) ||
        fundRedemptions.find((item) => item.fundId === relatedRedemptionOrder?.fundId)?.id
      : undefined;
  const sourceRedemption =
    instance?.sourceType === "Redemption"
      ? fundRedemptions.find((item) => item.id === redemptionEventReference)
      : undefined;
  const sourceIssuance = instance?.sourceType === "Issuance" ? fund : undefined;
  const isIssuanceWorkflow = instance?.sourceType === "Issuance";
  const isCloseOutWorkflow = isRedemptionCloseOutReference(instance?.sourceType, instance?.sourceReference);
  const sourceEventName =
    sourceDistribution?.name ||
    sourceRedemption?.name ||
    (sourceIssuance
      ? `${sourceIssuance.name} - ${instance.sourceReference.split("--")[1] || "issuance approval"}`
      : instance?.sourceReference) ||
    "Workflow";
  const sourceFundName = sourceDistribution?.fundName || sourceRedemption?.fundName || sourceIssuance?.name || fund?.name || instance?.fundId || "Fund";
  const sourceReferenceLabel =
    isCloseOutWorkflow && sourceRedemption
      ? `Redemption / ${sourceRedemption.id} · Close-out reconciliation`
      : sourceRedemption && relatedRedemptionOrder
      ? `Redemption / ${sourceRedemption.id} · Order ${relatedRedemptionOrder.id}`
      : sourceRedemption
        ? `Redemption / ${sourceRedemption.id}`
        : instance
          ? `${instance.sourceType} / ${instance.sourceReference}`
          : "Workflow";
  const issuerDetailPath = sourceDistribution
    ? `/fund-distribution/${sourceDistribution.id}`
    : sourceRedemption
      ? `/fund-redemption/${sourceRedemption.id}`
      : sourceIssuance
        ? `/fund-issuance/${sourceIssuance.id}`
        : undefined;
  const sourceScopeItems = sourceDistribution
    ? [
        { label: "Record date", value: sourceDistribution.recordDate || "Pending" },
        { label: "Payment date", value: sourceDistribution.paymentDate || "Pending" },
        { label: "Payout mode", value: sourceDistribution.payoutMode || "Claim" },
      ]
    : sourceRedemption
      ? [
          ...(isCloseOutWorkflow
            ? [
                {
                  label: "Close-out scope",
                  value: "Burn evidence and cash/payment reconciliation",
                },
              ]
            : []),
          { label: "Window / cut-off", value: sourceRedemption.windowEnd || sourceRedemption.effectiveDate || "Pending" },
          { label: "Settlement", value: sourceRedemption.settlementCycle || "Pending" },
          { label: "Redemption mode", value: sourceRedemption.redemptionMode || "Pending" },
          ...(relatedRedemptionOrder
            ? [
                {
                  label: "Related order",
                  value: `${relatedRedemptionOrder.id} / ${relatedRedemptionOrder.investorName}`,
                },
              ]
            : []),
        ]
      : sourceIssuance
        ? [
            { label: "Issuance status", value: sourceIssuance.status },
            { label: "Token", value: sourceIssuance.tokenSymbol || sourceIssuance.tokenName },
            { label: "Action", value: instance?.sourceReference.split("--")[1] || "Issuance approval" },
          ]
        : [];
  const snapshot = instance
    ? holderSnapshots.find((item) => item.snapshotId === instance.snapshotId) ||
      holderSnapshots.find(
        (item) =>
          item.sourceType === instance.sourceType &&
          (item.sourceReference === instance.sourceReference || item.sourceReference === redemptionEventReference),
      )
    : undefined;
  const registerReferenceLabel =
    snapshot?.registerVersionId ||
    (isIssuanceWorkflow
      ? sourceIssuance?.transferAgentOps?.registerVersion ||
        sourceIssuance?.tokenSymbol ||
        "Issuance approval package"
      : "Pending snapshot");
  const registerReferenceHint =
    isCloseOutWorkflow
      ? "Close-out reconciliation reuses the acknowledged holder snapshot and payment list. TA does not lock another snapshot here."
      : isIssuanceWorkflow && !snapshot
        ? "Issuance approval does not use a holder snapshot; TA signs off the order book, allocation workbook, and register package."
        : undefined;
  const positions = snapshot ? holderSnapshotPositions.filter((item) => item.snapshotId === snapshot.snapshotId) : [];
  const list = snapshot ? settlementLists.find((item) => item.snapshotId === snapshot.snapshotId) : undefined;
  const lines = list ? settlementListLines.filter((item) => item.listId === list.listId) : [];
  const match = task?.matchResultId
    ? workflowState.matchResults.find((item) => item.matchResultId === task.matchResultId)
    : undefined;
  const approvalPackage = instance
    ? workflowState.approvalPackages.find((item) => item.workflowId === instance.workflowId)
    : undefined;
  const approvalPackageSummary = approvalPackage
    ? {
        packageId: approvalPackage.packageId,
        submissionStatus: approvalPackage.submissionStatus,
        updatedAt: approvalPackage.updatedAt,
        decisionCount: workflowState.approvalDecisions.filter(
          (decision) => decision.packageId === approvalPackage.packageId,
        ).length,
        blockerCount: workflowState.approvalPackageBlockers.filter(
          (blocker) => blocker.packageId === approvalPackage.packageId && !blocker.resolvedAt,
        ).length,
      }
    : undefined;
  const logs = instance
    ? workflowState.actionLogs.filter((item) => item.workflowId === instance.workflowId)
    : [];
  const snapshotEvidence = snapshot
    ? evidenceRecords.filter(
        (record) =>
          record.instructionId === snapshot.instructionId ||
          lines.some((line) => line.evidenceRefIds.includes(record.evidenceRefId)),
      )
    : [];

  if (!task || !instance) {
    return (
      <div className="container mx-auto max-w-5xl px-6 py-16">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Workflow task not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  const checklistItems = getWorkflowReviewChecklist(instance.sourceType, instance.sourceReference);
  const reviewComplete = checklistItems.every((item) => Boolean(task.reviewChecklist[item.key]));
  const canRunMatch = ["IssuerSubmitted", "TAPulled", "TAResponded", "MatchException"].includes(instance.status);
  const snapshotReviewGateRequired =
    !isCloseOutWorkflow &&
    Boolean(snapshot) &&
    ["RecipientListGenerated", "PaymentListGenerated"].includes(instance.status) &&
    !["SubmittedToIssuer", "IssuerAcknowledged", "Reconciled"].includes(snapshot?.status || "");
  const snapshotReviewComplete =
    !snapshotReviewGateRequired || ["review-snapshot", "manual-overwrite"].includes(snapshot?.lastAction || "");
  const canSubmit =
    (instance.status === "MatchPassed" ||
      instance.status === "SnapshotLocked" ||
      instance.status === "RecipientListGenerated" ||
      instance.status === "PaymentListGenerated") &&
    reviewComplete &&
    Boolean(match?.matched) &&
    snapshotReviewComplete;
  const isWorkflowComplete = instance.status === "IssuerAcknowledged" || instance.status === "Reconciled";
  const isSubmitStage = [
    "MatchPassed",
    "SnapshotLocked",
    "RecipientListGenerated",
    "PaymentListGenerated",
  ].includes(instance.status);
  const primaryDisabledReason = (() => {
    if (isWorkflowComplete) return "This TA workflow is complete.";
    if (instance.status === "SubmittedToIssuer") return "TA output is submitted and awaiting issuer acknowledgement.";
    if (instance.status === "MatchException" && match?.exception) {
      return "Resolve or return the match exception before continuing.";
    }
    if (canRunMatch) return undefined;
    if (snapshotReviewGateRequired && !snapshotReviewComplete) {
      return "Review the snapshot output or save a manual overwrite before submitting issuer review.";
    }
    if (isSubmitStage && !reviewComplete) return "Complete the Review & Match checklist before submitting.";
    if (isSubmitStage && !match?.matched) return "Run and pass the data match before submitting.";
    if (!canSubmit) return "Workflow is not ready for this TA action yet.";
    return undefined;
  })();
  const run = (result: { success: boolean; message: string }, options?: { quietSuccess?: boolean }) => {
    const toastOptions = { position: "top-center" as const };
    if (result.success) {
      if (!options?.quietSuccess) toast.success(result.message, toastOptions);
      return true;
    } else {
      toast.error(result.message, toastOptions);
      return false;
    }
  };

  const updateChecklistItem = (key: string, value: boolean) => {
    run(workflowUpdateChecklist(task.taskId, { ...task.reviewChecklist, [key]: value }), { quietSuccess: true });
  };

  const requestSecureAction = (action: SecureAction) => setSecureAction(action);

  const runMatchDecision = (matched: boolean) => {
    run(
      workflowMatchTask(
        task.taskId,
        matched,
        matched ? undefined : "Manual exception raised by TA reviewer.",
      ),
    );
  };

  const primaryAction = () => {
    if (primaryDisabledReason) return;
    if (canRunMatch) return setReviewSheetOpen(true);
    return requestSecureAction("submit");
  };

  const primaryDisabled = Boolean(primaryDisabledReason);

  const steps = getWorkflowSteps(instance.sourceType, instance.sourceReference);
  const currentIndex = Math.max(0, steps.findIndex((step) => step.stepId === instance.currentStepId));
  const completedChecklistCount = checklistItems.filter((item) => task.reviewChecklist[item.key]).length;
  const matchStatusLabel = match ? (match.matched ? "Match passed" : "Match exception") : "Not matched";
  const primaryActionLabel = (() => {
    if (isWorkflowComplete) return "TA Workflow Complete";
    if (instance.status === "MatchException" && match?.exception) return "Exception Pending";
    if (snapshotReviewGateRequired && !snapshotReviewComplete) return "Review Snapshot First";
    if (isSubmitStage && !reviewComplete) return "Complete Review First";
    if (isSubmitStage && !match?.matched) return "Run Match First";
    if (canRunMatch) return "Review & Match";
    return getWorkflowTaskActionLabel(instance, task);
  })();
  const hasMatchException = instance.status === "MatchException" || task.taskStatus === "Blocked";
  const secureActionLabel =
    secureAction === "return"
      ? "Return To Issuer"
      : getWorkflowTaskActionLabel(instance, task);
  const secureActionSummary: ActionModalSummaryItem[] = [
    { label: "Workflow", value: sourceReferenceLabel },
    { label: "Current step", value: instance.currentStepId },
    { label: isIssuanceWorkflow ? "Register / approval ref" : "Register version", value: registerReferenceLabel },
    { label: "Action", value: secureActionLabel },
  ];
  const secureActionSteps: ActionModalStep[] = [
    {
      label: "Review",
      title: `Review ${secureActionLabel}`,
      description: "Confirm the selected TA workflow action before identity verification.",
      state: "review",
      kind: "review",
    },
    {
      label: "Identity",
      title: "Verify Identity",
      description: "Transfer Agent operator identity and workflow authority are being verified.",
      state: "loading",
      kind: "identity",
    },
    {
      label: "TA Control",
      title: "Release Workflow Action",
      description: "The verified TA action is being recorded in the workflow engine.",
      state: "loading",
      kind: "ta",
    },
    {
      label: "Completed",
      title: `${secureActionLabel} verified`,
      description: "The action can now be reflected in the Transfer Agent workflow.",
      state: "success",
      kind: "success",
    },
  ];
  const workflowOrders = fundOrders.filter((order) => {
    if (order.fundId !== instance.fundId) return false;
    if (order.id === instance.sourceReference || instance.relatedOrderIds?.includes(order.id)) return true;
    if (isIssuanceWorkflow) return order.type === "subscription";
    if (sourceRedemption) return order.type === "redemption";
    if (sourceDistribution) return order.type === "subscription";
    return false;
  });
  const orderLinkedEvidence = collectOrderLinkedFundingEvidence({
    orders: workflowOrders,
    cashMovements,
    evidenceRecords,
  });
  const evidence = Array.from(
    new Map([...snapshotEvidence, ...orderLinkedEvidence.evidenceRecords].map((record) => [record.evidenceRefId, record])).values(),
  );
  const approvalMatchLabel = match ? (match.matched ? "Matched" : "Exception") : canRunMatch ? "Pending match" : "Not run";
  const approvalMatchTone: ReviewTone = match?.matched ? "success" : match ? "danger" : canRunMatch ? "warning" : "muted";
  const approvalReviewState = reviewComplete
    ? "Checklist complete"
    : `${completedChecklistCount}/${checklistItems.length} checks complete`;
  const approvalReviewTone: ReviewTone = reviewComplete ? "success" : "warning";
  const approvalNextAction =
    !reviewComplete
      ? "Complete checks"
      : !match
        ? "Run match"
        : match.matched
          ? getWorkflowTaskActionLabel(instance, task)
          : "Return or resolve";
  const approvalNextActionTone: ReviewTone =
    !reviewComplete || !match ? "warning" : match.matched ? "success" : "danger";
  const taApprovalSnapshotRows: ApprovalReviewTableRow[] =
    positions.length > 0
      ? positions.map((position) => ({
          id: position.positionId,
          title: position.holderName,
          subtitle: position.walletAddress,
          status: position.included ? "Included" : position.exclusionReason || "Excluded",
          statusTone: getTaReviewTone(position.included ? "Included" : position.exclusionReason || "Excluded"),
          matchResult: approvalMatchLabel,
          matchTone: approvalMatchTone,
          reviewState: approvalReviewState,
          reviewTone: approvalReviewTone,
          nextAction: approvalNextAction,
          nextActionTone: approvalNextActionTone,
          cells: [
            { label: "Units", value: position.units },
            { label: "Cash / entitlement", value: position.cashAmount || position.entitlementAmount || "Pending" },
            { label: "Restriction", value: position.restrictionStatus },
            { label: "Snapshot", value: snapshot?.snapshotId || instance.sourceReference },
          ],
        }))
      : workflowOrders.map((order) => ({
          id: order.id,
          title: order.investorName,
          subtitle: order.investorWallet,
          status: order.status,
          statusTone: getTaReviewTone(order.status),
          matchResult: approvalMatchLabel,
          matchTone: approvalMatchTone,
          reviewState: approvalReviewState,
          reviewTone: approvalReviewTone,
          nextAction: approvalNextAction,
          nextActionTone: approvalNextActionTone,
          cells: [
            { label: "Order type", value: order.type },
            { label: "Request amount", value: order.requestAmount },
            { label: "Request units", value: order.requestQuantity },
            { label: "Payment status", value: order.paymentStatus || "Not recorded" },
          ],
        }));
  const taApprovalListRows: ApprovalReviewTableRow[] =
    lines.length > 0
      ? lines.map((line) => ({
          id: line.lineId,
          title: line.holderName,
          subtitle: line.destination,
          status: line.status,
          statusTone: getTaReviewTone(line.status),
          matchResult: approvalMatchLabel,
          matchTone: approvalMatchTone,
          reviewState: approvalReviewState,
          reviewTone: approvalReviewTone,
          nextAction: approvalNextAction,
          nextActionTone: approvalNextActionTone,
          cells: [
            { label: "Amount", value: `${line.amount} ${line.currency}` },
            { label: "List", value: line.listId },
            { label: "Snapshot", value: line.snapshotId },
            { label: "Evidence", value: `${line.evidenceRefIds.length} record(s)` },
          ],
        }))
      : workflowOrders.map((order) => ({
          id: `${order.id}-list`,
          title: order.investorName,
          subtitle: order.investorWallet,
          status: order.unitBookingStatus || order.status,
          statusTone: getTaReviewTone(order.unitBookingStatus || order.status),
          matchResult: approvalMatchLabel,
          matchTone: approvalMatchTone,
          reviewState: approvalReviewState,
          reviewTone: approvalReviewTone,
          nextAction: approvalNextAction,
          nextActionTone: approvalNextActionTone,
          cells: [
            { label: "Source object", value: order.type === "subscription" ? "Subscription order" : "Redemption order" },
            { label: "Estimated value", value: order.estimatedSharesOrCash },
            { label: "Payment reference", value: order.paymentReference || "Pending" },
            { label: "Register effect", value: order.type === "subscription" ? "Issue units" : "Redeem units" },
          ],
        }));
  const relatedInstructionIds = new Set<string>(
    [
      snapshot?.instructionId,
      ...orderLinkedEvidence.orderInstructionIds,
      ...evidence.map((record) => record.instructionId).filter(Boolean),
    ]
      .filter(Boolean) as string[],
  );
  const orderLinkedCashMovementIds = new Set(orderLinkedEvidence.cashMovementIds);
  const canonicalTaCashFlows: ApprovalReviewCashFlow[] = cashMovements
    .filter(
      (movement) =>
        movement.fundId === instance.fundId &&
        (relatedInstructionIds.size === 0 ||
          relatedInstructionIds.has(movement.instructionId) ||
          orderLinkedCashMovementIds.has(movement.cashMovementId)),
    )
    .map((movement) => ({
      id: movement.cashMovementId,
      title: movement.direction === "In" ? "Cash receipt" : "Cash payout",
      direction: movement.direction === "In" ? "Cash in" : "Cash out",
      amount: `${movement.amount} ${movement.currency}`,
      rail: movement.owner,
      account: movement.reference || movement.instructionId,
      status: movement.status,
      statusTone: getTaReviewTone(movement.status),
      matchResult: movement.status,
      matchTone: getTaReviewTone(movement.status),
      reviewState: approvalReviewState,
      reviewTone: approvalReviewTone,
      nextAction: movement.status === "Failed" ? "Resolve cash break" : approvalNextAction,
      nextActionTone: movement.status === "Failed" ? "danger" : approvalNextActionTone,
      reference: movement.reference || movement.cashMovementId,
      timestamp: movement.confirmedAt || "Pending confirmation",
      owner: movement.owner,
    }));
  const expectedTaCashFlows: ApprovalReviewCashFlow[] = workflowOrders.map((order) => ({
    id: `expected-${order.id}`,
    title: `${order.investorName} ${order.type === "subscription" ? "funding" : "redemption payout"}`,
    direction: order.type === "subscription" ? "Expected cash in" : "Expected cash out",
    amount: order.type === "subscription" ? order.requestAmount : order.estimatedSharesOrCash,
    rail: order.paymentMethod || "Settlement rail pending",
    account: order.payerBankAccountMasked || order.investorWallet,
    status: order.paymentStatus || order.status,
    statusTone: getTaReviewTone(order.paymentStatus || order.status),
    matchResult: approvalMatchLabel,
    matchTone: approvalMatchTone,
    reviewState: approvalReviewState,
    reviewTone: approvalReviewTone,
    nextAction: approvalNextAction,
    nextActionTone: approvalNextActionTone,
    reference: order.paymentReference || order.id,
    timestamp: order.cashConfirmedAt || order.cashReceivedAt || order.settlementTime || order.submitTime,
    owner: order.cashConfirmedBy || "Issuer Ops / Bank",
  }));
  const taApprovalCashFlows = [...canonicalTaCashFlows, ...expectedTaCashFlows];
  const taApprovalEvidenceRows: ApprovalReviewEvidenceRow[] = evidence.map((record) => ({
    id: record.evidenceRefId,
    title: record.label,
    type: record.evidenceType,
    status: record.contentHash ? "Hash linked" : record.retentionClass,
    statusTone: record.contentHash ? "success" : "default",
    matchResult: record.contentHash ? "Evidence linked" : "Evidence pending",
    matchTone: record.contentHash ? "success" : "warning",
    reviewState: approvalReviewState,
    reviewTone: approvalReviewTone,
    nextAction: approvalNextAction,
    nextActionTone: approvalNextActionTone,
    detail: record.storageUri || record.createdAt,
    reference: record.contentHash || record.evidenceRefId,
  }));
  if (match) {
    taApprovalEvidenceRows.unshift({
      id: match.matchResultId,
      title: "Workflow match result",
      type: "MatchResult",
      status: match.matched ? "Match passed" : "Match exception",
      statusTone: match.matched ? "success" : "danger",
      matchResult: match.matched ? "Matched" : "Exception",
      matchTone: match.matched ? "success" : "danger",
      reviewState: approvalReviewState,
      reviewTone: approvalReviewTone,
      nextAction: match.matched ? getWorkflowTaskActionLabel(instance, task) : "Return or resolve",
      nextActionTone: match.matched ? "success" : "danger",
      detail:
        match.exception ||
        `${match.checks.filter((check) => check.passed).length}/${match.checks.length} check(s) passed`,
      reference: match.matchResultId,
    });
  }
  const taApprovalMetrics: ApprovalReviewMetric[] = [
    {
      label: positions.length > 0 ? "Snapshot rows" : "Order rows",
      value: `${positions.length || workflowOrders.length}`,
      detail: snapshot?.snapshotId || "Source order book",
      tone: positions.length || workflowOrders.length ? "success" : "warning",
    },
    {
      label: "List rows",
      value: `${lines.length || workflowOrders.length}`,
      detail: list?.listId || "Derived workflow list",
      tone: lines.length || workflowOrders.length ? "success" : "warning",
    },
    {
      label: "Cash movements",
      value: `${taApprovalCashFlows.length}`,
      detail:
        canonicalTaCashFlows.length > 0
          ? `${canonicalTaCashFlows.length} backend movement(s)`
          : "Expected order cash flows",
      tone: canonicalTaCashFlows.length > 0 ? "success" : "warning",
    },
    {
      label: "Evidence",
      value: `${taApprovalEvidenceRows.length}`,
      detail: matchStatusLabel,
      tone: match?.matched ? "success" : match ? "danger" : "muted",
    },
  ];
  const sourceLifecycleStatus = sourceDistribution?.status || sourceRedemption?.status || sourceIssuance?.status;
  const approvalWorkspaceDataCount =
    positions.length +
    workflowOrders.length +
    lines.length +
    taApprovalCashFlows.length +
    taApprovalEvidenceRows.length;
  const approvalWorkspaceControlCount = checklistItems.length + (match ? 1 : 0);
  const shouldShowApprovalWorkspace = shouldShowTaWorkflowApprovalWorkspace({
    sourceLifecycleStatus,
    isWorkflowComplete,
    dataCount: approvalWorkspaceDataCount,
    controlCount: approvalWorkspaceControlCount,
  });

  const executeSecureAction = () => {
    if (!secureAction) return;
    let success = false;
    if (secureAction === "return") {
      success = run(workflowReturnTask(task.taskId, "Match exception returned to issuer."));
    } else {
      success = run(workflowSubmitCurrentStep(task.taskId));
    }

    setSecureAction(null);
  };

  return (
    <div className="container mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6">
        <Button asChild variant="ghost" className="-ml-3">
          <Link to="/ta/queue">
            <ArrowLeft className="h-4 w-4" />
            Back to Workflows
          </Link>
        </Button>
      </div>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge variant="outline">Transfer Agent Workflow</Badge>
                <Badge variant={taskVariant(task.taskStatus)}>{task.taskStatus}</Badge>
              </div>
              <h1 style={{ fontFamily: "var(--font-heading)" }}>
                {sourceEventName}
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                {sourceFundName} · {sourceReferenceLabel}
              </p>
            </div>
            <div className="flex max-w-sm flex-col items-start gap-2 sm:items-end">
              <Button
                disabled={primaryDisabled}
                onClick={primaryAction}
                variant={hasMatchException ? "outline" : "default"}
              >
                <ShieldCheck className="h-4 w-4" />
                {primaryActionLabel}
              </Button>
              {primaryDisabledReason ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 sm:text-right">
                  {primaryDisabledReason}
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard icon={FileCheck2} label="Positions" value={positions.length} variant="primary" />
            <MetricCard icon={CheckCircle2} label="Included" value={positions.filter((item) => item.included).length} variant="success" />
            <MetricCard icon={Clock3} label="List Lines" value={lines.length} />
            <MetricCard icon={TriangleAlert} label="Evidence" value={evidence.length} variant="warning" />
          </div>
        </CardContent>
      </Card>

      {shouldShowApprovalWorkspace ? (
        <div className="mb-6">
          <ApprovalReviewWorkspace
            title="TA Approval Data Package"
            description="Use this workspace as the controlled review package for the current TA task. It connects source orders, holder snapshot rows, settlement list lines, cash movements, and evidence before the workflow action is released."
            badges={[
              {
                label: task.taskStatus,
                tone: getTaReviewTone(task.taskStatus),
              },
              {
                label: instance.sourceType,
                tone: "default",
              },
            ]}
            packageSummary={approvalPackageSummary}
            metrics={taApprovalMetrics}
            snapshotTitle={positions.length > 0 ? "Holder Snapshot Review" : "Source Order Snapshot"}
            snapshotRows={taApprovalSnapshotRows}
            listTitle={lines.length > 0 ? "Settlement List" : "Order / Register Effect List"}
            listRows={taApprovalListRows}
            cashFlows={taApprovalCashFlows}
            evidenceRows={taApprovalEvidenceRows}
            reviewHint="Review this data package, complete the match checks, then use the workflow action above. The issuer side reads the same workflow-backed state after TA submits output."
            detailPanel={{
              title: "TA Decision",
              status: primaryDisabledReason ? "Blocked" : approvalMatchLabel,
              tone: primaryDisabledReason ? "warning" : approvalMatchTone,
              summary:
                primaryDisabledReason ||
                "Complete the checklist, record the match decision, then release the next workflow action when available.",
              rows: [
                { label: "Checklist", value: `${completedChecklistCount}/${checklistItems.length}` },
                { label: "Match", value: matchStatusLabel },
                { label: "Next action", value: primaryActionLabel },
              ],
              action: canRunMatch
                ? {
                    label: "Open Review & Match",
                    onClick: () => setReviewSheetOpen(true),
                  }
                : undefined,
            }}
          />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Workflow Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {steps.map((step, index) => {
              const isCurrent = step.stepId === instance.currentStepId;
              const isDone = index < currentIndex || instance.status === "Reconciled";
              const stepLog = logs
                .filter((log) => actionStepId(log) === step.stepId)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
              return (
                <div key={step.stepId} className="relative flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full border",
                        isDone && "border-emerald-500 bg-emerald-50 text-emerald-700",
                        isCurrent && !isDone && "border-primary bg-primary/10 text-primary",
                        !isCurrent && !isDone && "text-muted-foreground",
                      )}
                    >
                      {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                    </div>
                    {index < steps.length - 1 && <div className="h-12 w-px bg-border" />}
                  </div>
                  <div className="pb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium">{step.label}</div>
                      <Badge variant="outline">{step.owner}</Badge>
                      {isCurrent && <Badge variant="secondary">Current</Badge>}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {stepLog ? (
                        <div>
                          <div className="text-foreground">{stepLog.message}</div>
                          <div className="mt-1 text-xs">
                            {actorLabel(stepLog.actorRole)} · {actionLabel(stepLog.action)} · {formatActionTime(stepLog.createdAt)}
                          </div>
                        </div>
                      ) : step.stepId === "MatchData" && isCurrent ? (
                        "Review source instruction, register version, holder data, and evidence before approving."
                      ) : (
                        "Awaiting action."
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Selected Request</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-1">
              <div>
                <div className="text-muted-foreground">Issuer Event</div>
                <div className="font-medium">{sourceEventName}</div>
                <div className="text-xs text-muted-foreground">{sourceFundName}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Source Reference</div>
                <div className="font-mono text-xs">{sourceReferenceLabel}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Workflow ID</div>
                <div className="break-all font-mono text-xs">{instance.workflowId}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Task ID</div>
                <div className="break-all font-mono text-xs">{task.taskId}</div>
              </div>
              <div>
                <div className="text-muted-foreground">
                  {isIssuanceWorkflow ? "Register / Approval Ref" : "Register Version"}
                </div>
                <div className="break-all font-mono text-xs">{registerReferenceLabel}</div>
                {registerReferenceHint ? (
                  <div className="mt-1 text-xs text-muted-foreground">{registerReferenceHint}</div>
                ) : null}
              </div>
              {sourceScopeItems.map((item) => (
                <div key={item.label}>
                  <div className="text-muted-foreground">{item.label}</div>
                  <div className="font-medium">{item.value}</div>
                </div>
              ))}
              {issuerDetailPath ? (
                <div className="sm:col-span-2 lg:col-span-1">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link to={issuerDetailPath}>Open Issuer Source</Link>
                  </Button>
                </div>
              ) : null}
              {snapshot ? (
                <div className="sm:col-span-2 lg:col-span-1">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link to={`/ta/register?snapshot=${snapshot.snapshotId}`}>
                      Open Snapshot In Book
                    </Link>
                  </Button>
                </div>
              ) : null}
              <div>
                <div className="text-muted-foreground">Workflow State</div>
                <div className="font-medium">{instance.status}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workflow State</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border bg-secondary/40 p-4">
                <div className="font-medium">
                  {instance.sourceType} - {instance.currentStepId}
                </div>
                <div className="mt-2">
                  <Badge variant={taskVariant(task.taskStatus)}>{task.taskStatus}</Badge>
                </div>
              </div>
              <Button
                className="w-full"
                disabled={primaryDisabled}
                onClick={primaryAction}
                variant={hasMatchException ? "outline" : "default"}
              >
                {primaryActionLabel}
              </Button>
              {primaryDisabledReason ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  {primaryDisabledReason}
                </div>
              ) : null}
              {canRunMatch || match ? (
                <div className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">Review & Match</div>
                      <div className="text-xs text-muted-foreground">
                        {completedChecklistCount}/{checklistItems.length} checks complete · {matchStatusLabel}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setReviewSheetOpen(true)}>
                      Open
                    </Button>
                  </div>
                </div>
              ) : null}
              {hasMatchException ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                  <div className="font-medium">Exception recovery</div>
                  <div className="mt-1 text-red-800">
                    Return sends the exception back to issuer. Review & Match lets TA correct the match before returning.
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                    <Button
                      className="w-full"
                      variant="destructive"
                      onClick={() => requestSecureAction("return")}
                    >
                      Return To Issuer
                    </Button>
                    <Button
                      className="w-full border-red-300 bg-white text-red-900 hover:bg-red-100 hover:text-red-950"
                      variant="outline"
                      onClick={() => setReviewSheetOpen(true)}
                    >
                      Open Review & Match
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      {!isIssuanceWorkflow && !isCloseOutWorkflow ? (
        <SnapshotReviewPanel snapshot={snapshot} positions={positions} list={list} lines={lines} />
      ) : null}

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Evidence Pack</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evidence</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Retention</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evidence.map((record) => (
                  <TableRow key={record.evidenceRefId}>
                    <TableCell>
                      <div className="font-medium">{record.label}</div>
                      <div className="font-mono text-xs text-muted-foreground">{record.evidenceRefId}</div>
                    </TableCell>
                    <TableCell>{record.evidenceType}</TableCell>
                    <TableCell>{record.retentionClass}</TableCell>
                  </TableRow>
                ))}
                {evidence.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                      No evidence linked yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Action Log</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {logs.map((log) => (
            <div key={log.actionLogId} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm">
              <div>
                <div className="font-medium">{log.message}</div>
                <div className="text-xs text-muted-foreground">{log.actorRole} / {log.action}</div>
              </div>
              <div className="text-xs text-muted-foreground">{log.createdAt}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Sheet open={reviewSheetOpen} onOpenChange={setReviewSheetOpen}>
        <SheetContent className="w-[100dvw] max-w-[100dvw] gap-0 overflow-hidden sm:max-w-2xl">
          <SheetHeader className="border-b pr-12">
            <SheetTitle>Review & Match</SheetTitle>
            <SheetDescription>
              Complete the TA review checks, then record the source data match for this workflow step.
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4">
            <div className="grid gap-3 rounded-lg border p-4 text-sm sm:grid-cols-3">
              <div>
                <div className="text-muted-foreground">Workflow</div>
                <div className="font-medium">{instance.sourceType}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Current step</div>
                <div className="font-medium">{instance.currentStepId}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Review state</div>
                <div className="font-medium">{completedChecklistCount}/{checklistItems.length} complete</div>
              </div>
            </div>

            <div>
              <div className="mb-3 font-medium">Review Checklist</div>
              <div className="space-y-3">
                {checklistItems.map((item) => {
                  const checklistId = `review-checklist-${task.taskId}-${item.key}`;
                  const labelId = `${checklistId}-label`;
                  return (
                    <div
                      key={item.key}
                      className="flex items-start gap-3 rounded-lg border p-3 text-sm transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"
                    >
                      <Checkbox
                        id={checklistId}
                        aria-labelledby={labelId}
                        checked={Boolean(task.reviewChecklist[item.key])}
                        onCheckedChange={(checked) => updateChecklistItem(item.key, Boolean(checked))}
                        disabled={["SubmittedToIssuer", "IssuerAcknowledged", "Reconciled"].includes(instance.status)}
                      />
                      <label id={labelId} htmlFor={checklistId} className="min-w-0 flex-1 cursor-pointer leading-snug">
                        {item.label}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="font-medium">Match Result</div>
                <Badge variant={match?.matched ? "default" : match ? "destructive" : "outline"}>
                  {match ? (match.matched ? "Matched" : "Exception") : "Not Run"}
                </Badge>
              </div>
              {match ? (
                <div className="rounded-lg border p-4">
                  <div className="mb-3 font-medium">{match.matched ? "Match Passed" : "Match Exception"}</div>
                  {match.exception ? (
                    <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                      {match.exception}
                    </div>
                  ) : null}
                  <div className="grid gap-2">
                    {match.checks.map((check) => (
                      <div key={check.checkId} className="flex items-start justify-between gap-3 rounded-md bg-muted px-3 py-2 text-sm">
                        <div>
                          <div className="font-medium">{check.label}</div>
                          <div className="text-xs text-muted-foreground">{check.detail}</div>
                        </div>
                        <Badge variant={check.passed ? "outline" : "destructive"}>{check.passed ? "Pass" : "Fail"}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Record a match decision after completing the review checklist.
                </div>
              )}
            </div>
            {!reviewComplete || !canRunMatch ? (
              <div
                className={
                  match && !canRunMatch
                    ? "rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-900"
                    : "rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
                }
              >
                {!reviewComplete
                  ? "Complete every review checklist item before running match."
                  : match && !canRunMatch
                    ? "Match recorded. This workflow is ready for the next TA action."
                    : "This workflow is not currently ready for Review & Match."}
              </div>
            ) : null}
          </div>

          <SheetFooter className="sticky bottom-0 mt-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
            <div className="grid w-full gap-2 sm:grid-cols-2">
              <Button
                disabled={!reviewComplete || !canRunMatch}
                onClick={() => runMatchDecision(true)}
              >
                Run Match
              </Button>
              <Button
                variant="outline"
                disabled={!reviewComplete || !canRunMatch}
                onClick={() => runMatchDecision(false)}
              >
                Record Exception
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <OperationActionModal
        open={Boolean(secureAction)}
        onOpenChange={(open) => {
          if (!open) setSecureAction(null);
        }}
        onSuccess={executeSecureAction}
        title={`Verify ${secureActionLabel}`}
        description="Complete Transfer Agent identity verification before applying this workflow action."
        startLabel="Verify"
        completionLabel="Return To Workflow"
        steps={secureActionSteps}
        summary={secureActionSummary}
        impactBadges={[
          { label: "Identity required", kind: "identity" },
          { label: "TA workflow control", kind: "ta" },
        ]}
        detailGroups={[
          {
            title: "Identity Verification",
            kind: "identity",
            items: [
              "Validate Transfer Agent operator session",
              "Confirm role authority for the active workflow task",
              "Bind approval to the current register workflow version",
            ],
          },
          {
            title: "Workflow Control",
            kind: "ta",
            items: [
              `Apply ${secureActionLabel} after verification`,
              "Append action log and refresh shared workflow projection",
              "Broadcast updated state to issuer and TA views",
            ],
          },
        ]}
      />
    </div>
  );
}
