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
import { useApp } from "../context/AppContext";
import { cn } from "../components/ui/utils";
import {
  getWorkflowSteps,
  getWorkflowTaskActionLabel,
  type WorkflowActionLog,
  type WorkflowStepId,
  type WorkflowTaskStatus,
} from "../lib/workflowBackend";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";
type SecureAction =
  | "accept"
  | "submit"
  | "reconcile"
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
  if (log.action === "match" || log.action === "return") return "MatchData";
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
    evidenceRecords,
    workflowAcceptTask,
    workflowUpdateChecklist,
    workflowMatchTask,
    workflowReturnTask,
    workflowSubmitCurrentStep,
    workflowReconcileTask,
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
  const sourceEventName =
    sourceDistribution?.name ||
    sourceRedemption?.name ||
    (sourceIssuance
      ? `${sourceIssuance.name} - ${instance.sourceReference.split("--")[1] || "issuance approval"}`
      : instance?.sourceReference) ||
    "Workflow";
  const sourceFundName = sourceDistribution?.fundName || sourceRedemption?.fundName || sourceIssuance?.name || fund?.name || instance?.fundId || "Fund";
  const sourceReferenceLabel =
    sourceRedemption && relatedRedemptionOrder
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
    isIssuanceWorkflow && !snapshot
      ? "Issuance approval does not use a holder snapshot; TA signs off the order book, allocation workbook, and register package."
      : undefined;
  const positions = snapshot ? holderSnapshotPositions.filter((item) => item.snapshotId === snapshot.snapshotId) : [];
  const list = snapshot ? settlementLists.find((item) => item.snapshotId === snapshot.snapshotId) : undefined;
  const lines = list ? settlementListLines.filter((item) => item.listId === list.listId) : [];
  const match = task?.matchResultId
    ? workflowState.matchResults.find((item) => item.matchResultId === task.matchResultId)
    : undefined;
  const logs = instance
    ? workflowState.actionLogs.filter((item) => item.workflowId === instance.workflowId)
    : [];
  const evidence = snapshot
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

  const reviewComplete = Object.values(task.reviewChecklist).every(Boolean);
  const canRunMatch = instance.status === "TAResponded" || instance.status === "MatchException";
  const canSubmit =
    (instance.status === "MatchPassed" ||
      instance.status === "SnapshotLocked" ||
      instance.status === "RecipientListGenerated" ||
      instance.status === "PaymentListGenerated") &&
    reviewComplete &&
    Boolean(match?.matched);
  const canReconcile = instance.status === "IssuerAcknowledged" && instance.sourceType !== "Issuance";

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
    const success = run(
      workflowMatchTask(
        task.taskId,
        matched,
        matched ? undefined : "Manual exception raised by TA reviewer.",
      ),
    );
    if (success) setReviewSheetOpen(false);
  };

  const primaryAction = () => {
    if (instance.sourceType === "Issuance" && instance.status === "IssuerAcknowledged") return;
    if (instance.status === "IssuerSubmitted" || instance.status === "TAPulled") return requestSecureAction("accept");
    if (canRunMatch) return setReviewSheetOpen(true);
    if (canReconcile) return requestSecureAction("reconcile");
    return requestSecureAction("submit");
  };

  const primaryDisabled =
    (!canRunMatch && !canReconcile && !["IssuerSubmitted", "TAPulled"].includes(instance.status) && !canSubmit) ||
    instance.status === "SubmittedToIssuer" ||
    instance.status === "Reconciled" ||
    (instance.sourceType === "Issuance" && instance.status === "IssuerAcknowledged");

  const steps = getWorkflowSteps(instance.sourceType);
  const currentIndex = Math.max(0, steps.findIndex((step) => step.stepId === instance.currentStepId));
  const checklistItems = [
    ["sourceInstruction", "Issuer instruction matches source event"],
    ["registerVersion", "Register version is available for record date"],
    ["holderData", "Holder data can derive snapshot/list"],
    ["evidencePack", "Evidence pack references are attached"],
  ] as const;
  const completedChecklistCount = checklistItems.filter(([key]) => task.reviewChecklist[key]).length;
  const matchStatusLabel = match ? (match.matched ? "Match passed" : "Match exception") : "Not matched";
  const primaryActionLabel =
    instance.sourceType === "Issuance" && instance.status === "IssuerAcknowledged"
      ? "TA Approval Complete"
      : canRunMatch
        ? "Review & Match"
        : getWorkflowTaskActionLabel(instance, task);
  const secureActionLabel =
    secureAction === "accept"
      ? "Accept Request"
      : secureAction === "reconcile"
        ? "Reconcile Close-out"
        : secureAction === "return"
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

  const executeSecureAction = () => {
    if (!secureAction) return;
    let success = false;
    if (secureAction === "accept") {
      success = run(workflowAcceptTask(task.taskId));
    } else if (secureAction === "reconcile") {
      success = run(workflowReconcileTask(task.taskId));
    } else if (secureAction === "return") {
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
            <Button disabled={primaryDisabled} onClick={primaryAction}>
              <ShieldCheck className="h-4 w-4" />
              {primaryActionLabel}
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard icon={FileCheck2} label="Positions" value={positions.length} variant="primary" />
            <MetricCard icon={CheckCircle2} label="Included" value={positions.filter((item) => item.included).length} variant="success" />
            <MetricCard icon={Clock3} label="List Lines" value={lines.length} />
            <MetricCard icon={TriangleAlert} label="Evidence" value={evidence.length} variant="warning" />
          </div>
        </CardContent>
      </Card>

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
              <Button className="w-full" disabled={primaryDisabled} onClick={primaryAction}>
                {primaryActionLabel}
              </Button>
              {canRunMatch || match ? (
                <div className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">Review & Match</div>
                      <div className="text-xs text-muted-foreground">
                        {completedChecklistCount}/4 checks complete · {matchStatusLabel}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setReviewSheetOpen(true)}>
                      Open
                    </Button>
                  </div>
                </div>
              ) : null}
              {instance.status === "MatchException" || task.taskStatus === "Blocked" ? (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => requestSecureAction("return")}
                >
                  Return To Issuer
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

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
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Review & Match</SheetTitle>
            <SheetDescription>
              Complete the TA review checks, then record the source data match for this workflow step.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 px-4 pb-4">
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
                <div className="font-medium">{completedChecklistCount}/4 complete</div>
              </div>
            </div>

            <div>
              <div className="mb-3 font-medium">Review Checklist</div>
              <div className="space-y-3">
                {checklistItems.map(([key, label]) => (
                  <label key={key} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
                    <Checkbox
                      checked={Boolean(task.reviewChecklist[key])}
                      onCheckedChange={(checked) => updateChecklistItem(key, Boolean(checked))}
                      disabled={["IssuerSubmitted", "SubmittedToIssuer", "IssuerAcknowledged", "Reconciled"].includes(instance.status)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
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
          </div>

          <SheetFooter className="border-t">
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
