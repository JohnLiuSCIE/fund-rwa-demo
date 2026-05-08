import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Circle, Clock3, FileCheck2, ShieldCheck, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { MetricCard } from "../components/MetricCard";
import { useApp } from "../context/AppContext";
import { cn } from "../components/ui/utils";
import {
  getWorkflowSteps,
  getWorkflowTaskActionLabel,
  type WorkflowStatus,
  type WorkflowTaskStatus,
} from "../lib/workflowBackend";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

function taskVariant(status: WorkflowTaskStatus): BadgeVariant {
  if (status === "Blocked" || status === "Returned") return "destructive";
  if (status === "Ready For Approval" || status === "Ready To Reconcile") return "default";
  if (status === "Awaiting Issuer" || status === "Match Required") return "secondary";
  return "outline";
}

function statusOrder(status: WorkflowStatus) {
  const order: WorkflowStatus[] = [
    "IssuerSubmitted",
    "TAPulled",
    "TAResponded",
    "MatchPassed",
    "SnapshotLocked",
    "RecipientListGenerated",
    "PaymentListGenerated",
    "SubmittedToIssuer",
    "IssuerAcknowledged",
    "Reconciled",
  ];
  return order.indexOf(status);
}

export function TransferAgentWorkflowDetail() {
  const { taskId } = useParams();
  const app = useApp();
  const {
    fundIssuances,
    workflowState,
    holderSnapshots,
    holderSnapshotPositions,
    settlementLists,
    settlementListLines,
    evidenceRecords,
    workflowPullTask,
    workflowRespondTask,
    workflowUpdateChecklist,
    workflowMatchTask,
    workflowReturnTask,
    workflowSubmitCurrentStep,
    workflowReconcileTask,
  } = app;

  const task = workflowState.tasks.find((item) => item.taskId === taskId);
  const instance = task ? workflowState.instances.find((item) => item.workflowId === task.workflowId) : undefined;
  const fund = instance ? fundIssuances.find((item) => item.id === instance.fundId) : undefined;
  const snapshot = instance
    ? holderSnapshots.find((item) => item.snapshotId === instance.snapshotId) ||
      holderSnapshots.find((item) => item.sourceType === instance.sourceType && item.sourceReference === instance.sourceReference)
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
  const canReconcile = instance.status === "IssuerAcknowledged";

  const run = (result: { success: boolean; message: string }) => {
    if (result.success) toast.success(result.message);
    else toast.error(result.message);
  };

  const updateChecklistItem = (key: string, value: boolean) => {
    run(workflowUpdateChecklist(task.taskId, { ...task.reviewChecklist, [key]: value }));
  };

  const primaryAction = () => {
    if (instance.status === "IssuerSubmitted") return run(workflowPullTask(task.taskId));
    if (instance.status === "TAPulled") return run(workflowRespondTask(task.taskId));
    if (canRunMatch) return run(workflowMatchTask(task.taskId, true));
    if (canReconcile) return run(workflowReconcileTask(task.taskId));
    return run(workflowSubmitCurrentStep(task.taskId));
  };

  const primaryDisabled =
    (canRunMatch && !reviewComplete) ||
    (!canRunMatch && !canReconcile && !["IssuerSubmitted", "TAPulled"].includes(instance.status) && !canSubmit) ||
    instance.status === "SubmittedToIssuer" ||
    instance.status === "Reconciled";

  const steps = getWorkflowSteps(instance.sourceType);
  const currentIndex = Math.max(0, statusOrder(instance.status));

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
                {instance.sourceType} Request Review
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                Pull, respond, match, and approve the issuer request before releasing register actions.
              </p>
            </div>
            <Button disabled={primaryDisabled} onClick={primaryAction}>
              <ShieldCheck className="h-4 w-4" />
              {getWorkflowTaskActionLabel(instance, task)}
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
                      {step.stepId === "MatchData"
                        ? "Review source instruction, register version, holder data, and evidence before approving."
                        : "No action recorded yet."}
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
                <div className="text-muted-foreground">Fund</div>
                <div className="font-medium">{fund?.name || instance.fundId}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Source</div>
                <div className="font-medium">{instance.sourceType} / {instance.sourceReference}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Register Version</div>
                <div className="break-all font-mono text-xs">{snapshot?.registerVersionId || "Pending snapshot"}</div>
              </div>
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
                {getWorkflowTaskActionLabel(instance, task)}
              </Button>
              {instance.status === "MatchException" || task.taskStatus === "Blocked" ? (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => run(workflowReturnTask(task.taskId, "Match exception returned to issuer."))}
                >
                  Return To Issuer
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Review Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              ["sourceInstruction", "Issuer instruction matches source event"],
              ["registerVersion", "Register version is available for record date"],
              ["holderData", "Holder data can derive snapshot/list"],
              ["evidencePack", "Evidence pack references are attached"],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
                <Checkbox
                  checked={Boolean(task.reviewChecklist[key])}
                  onCheckedChange={(checked) => updateChecklistItem(key, Boolean(checked))}
                  disabled={["IssuerSubmitted", "SubmittedToIssuer", "IssuerAcknowledged", "Reconciled"].includes(instance.status)}
                />
                <span>{label}</span>
              </label>
            ))}
            <Button
              className="w-full"
              variant="outline"
              disabled={!reviewComplete || !canRunMatch}
              onClick={() => run(workflowMatchTask(task.taskId, true))}
            >
              Run Match
            </Button>
            <Button
              className="w-full"
              variant="outline"
              disabled={!reviewComplete || !canRunMatch}
              onClick={() => run(workflowMatchTask(task.taskId, false, "Manual exception raised by TA reviewer."))}
            >
              Record Match Exception
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Match Result & Evidence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {match ? (
              <div className="rounded-lg border p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="font-medium">{match.matched ? "Match Passed" : "Match Exception"}</div>
                  <Badge variant={match.matched ? "default" : "destructive"}>
                    {match.matched ? "Matched" : "Exception"}
                  </Badge>
                </div>
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
                Run match after completing the review checklist.
              </div>
            )}

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
    </div>
  );
}
