import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock3, FileSearch, ShieldCheck, TriangleAlert } from "lucide-react";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { MetricCard } from "../components/MetricCard";
import { useApp } from "../context/AppContext";
import { getWorkflowTaskActionLabel, type WorkflowInstance, type WorkflowTaskStatus } from "../lib/workflowBackend";

type WorkflowAreaFilter = "all" | "issuanceApproval" | "distributionSnapshot" | "redemptionPayment";
type TaskStageFilter = "all" | "intake" | "match" | "taAction" | "issuerReview" | "exception" | "closed";
type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

function statusVariant(status: WorkflowTaskStatus): BadgeVariant {
  if (status === "Blocked" || status === "Returned") return "destructive";
  if (status === "Ready For Approval" || status === "Ready To Reconcile") return "default";
  if (status === "Awaiting Issuer" || status === "Match Required") return "secondary";
  return "outline";
}

function workflowPriority(status: WorkflowTaskStatus) {
  if (status === "Blocked" || status === "Returned") return "High";
  if (status === "New Request" || status === "Match Required" || status === "Ready For Approval") return "Normal";
  return "Low";
}

function getWorkflowAreaLabel(sourceType?: string) {
  if (sourceType === "Issuance") return "Issuance Approval";
  if (sourceType === "Distribution") return "Distribution Snapshot";
  if (sourceType === "Redemption") return "Redemption Payment";
  return "TA Workflow";
}

function formatIssuanceActionReference(sourceReference: string) {
  const [, actionKey] = sourceReference.split("--");
  if (!actionKey) return "Issuance approval";
  return actionKey
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getTaskStageLabel(status: WorkflowTaskStatus) {
  if (status === "New Request" || status === "Awaiting Pull") return "Intake required";
  if (status === "Match Required") return "Data match";
  if (status === "Ready For Approval") return "TA action ready";
  if (status === "Awaiting Issuer") return "Issuer review";
  if (status === "Blocked" || status === "Returned") return "Exception";
  if (status === "Completed") return "Completed";
  return status;
}

export function TransferAgentWorkQueue() {
  const { fundIssuances, fundDistributions, fundRedemptions, fundOrders, workflowState } = useApp();
  const fundNameById = new Map(fundIssuances.map((fund) => [fund.id, fund.name]));
  const getWorkflowSourceMeta = (instance: WorkflowInstance) => {
    const distribution =
      instance.sourceType === "Distribution"
        ? fundDistributions.find((item) => item.id === instance.sourceReference)
        : undefined;
    const relatedRedemptionOrder =
      instance.sourceType === "Redemption"
        ? fundOrders.find(
            (item) => item.id === instance.sourceReference || instance.relatedOrderIds?.includes(item.id),
          )
        : undefined;
    const redemptionEventReference =
      instance.sourceType === "Redemption"
        ? instance.sourceEventReference ||
          (fundRedemptions.some((item) => item.id === instance.sourceReference) ? instance.sourceReference : undefined) ||
          fundRedemptions.find((item) => item.fundId === relatedRedemptionOrder?.fundId)?.id
        : undefined;
    const redemption =
      instance.sourceType === "Redemption"
        ? fundRedemptions.find((item) => item.id === redemptionEventReference)
        : undefined;
    const issuance = instance.sourceType === "Issuance" ? fundIssuances.find((item) => item.id === instance.fundId) : undefined;
    const eventName =
      distribution?.name ||
      redemption?.name ||
      (issuance ? `${issuance.name} - ${formatIssuanceActionReference(instance.sourceReference)}` : instance.sourceReference);
    const fundName =
      distribution?.fundName ||
      redemption?.fundName ||
      issuance?.name ||
      fundNameById.get(instance.fundId) ||
      instance.fundId;
    const primaryDate = distribution?.recordDate || redemption?.windowEnd || redemption?.effectiveDate || issuance?.status || "Pending";
    const secondaryDate = distribution?.paymentDate || redemption?.settlementCycle || issuance?.tokenSymbol || issuance?.tokenName || "Pending";

    return {
      eventName,
      fundName,
      sourceLabel:
        instance.sourceType === "Redemption" && redemption
          ? `Redemption / ${redemption.id}`
          : `${instance.sourceType} / ${instance.sourceReference}`,
      relatedLabel: relatedRedemptionOrder ? `Related order: ${relatedRedemptionOrder.id}` : undefined,
      primaryScope:
        instance.sourceType === "Distribution"
          ? `Record date: ${primaryDate}`
          : instance.sourceType === "Redemption"
            ? `Cut-off / effective: ${primaryDate}`
            : `Issuance status: ${primaryDate}`,
      secondaryScope:
        instance.sourceType === "Distribution"
          ? `Payment date: ${secondaryDate}`
          : instance.sourceType === "Redemption"
            ? `Settlement: ${secondaryDate}`
            : `Token: ${secondaryDate}`,
    };
  };
  const workflows = workflowState.tasks
    .map((task) => ({
      task,
      instance: workflowState.instances.find((item) => item.workflowId === task.workflowId),
      match: task.matchResultId
        ? workflowState.matchResults.find((item) => item.matchResultId === task.matchResultId)
        : undefined,
    }))
    .filter((item) => item.instance);

  const [areaFilter, setAreaFilter] = useState<WorkflowAreaFilter>("all");
  const [stageFilter, setStageFilter] = useState<TaskStageFilter>("all");
  const areaFilteredWorkflows = workflows.filter(({ instance }) => {
    if (areaFilter === "all") return true;
    if (areaFilter === "issuanceApproval") return instance!.sourceType === "Issuance";
    if (areaFilter === "distributionSnapshot") return instance!.sourceType === "Distribution";
    return instance!.sourceType === "Redemption";
  });
  const filteredWorkflows = areaFilteredWorkflows.filter(({ task }) => {
    if (stageFilter === "all") return true;
    if (stageFilter === "intake") return task.taskStatus === "New Request" || task.taskStatus === "Awaiting Pull";
    if (stageFilter === "match") return task.taskStatus === "Match Required";
    if (stageFilter === "taAction") return task.taskStatus === "Ready For Approval";
    if (stageFilter === "issuerReview") return task.taskStatus === "Awaiting Issuer";
    if (stageFilter === "exception") return task.taskStatus === "Blocked" || task.taskStatus === "Returned";
    return task.taskStatus === "Completed";
  });
  const openCount = workflows.filter(({ task }) => task.taskStatus !== "Completed").length;
  const readyCount = workflows.filter(({ task }) =>
    task.taskStatus === "Ready For Approval",
  ).length;
  const exceptionCount = workflows.filter(({ task }) => ["Blocked", "Returned"].includes(task.taskStatus)).length;
  const waitingIssuerCount = workflows.filter(({ task }) => task.taskStatus === "Awaiting Issuer").length;
  const areaOptions: Array<{ value: WorkflowAreaFilter; label: string; detail: string; count: number }> = [
    {
      value: "all",
      label: "All TA Workflows",
      detail: "Every issuer handoff that needs TA control.",
      count: workflows.length,
    },
    {
      value: "issuanceApproval",
      label: "Issuance Approval",
      detail: "Fund launch, allocation, and register sign-off approvals.",
      count: workflows.filter(({ instance }) => instance!.sourceType === "Issuance").length,
    },
    {
      value: "distributionSnapshot",
      label: "Distribution Snapshot",
      detail: "Record-date freeze and recipient list review.",
      count: workflows.filter(({ instance }) => instance!.sourceType === "Distribution").length,
    },
    {
      value: "redemptionPayment",
      label: "Redemption Payment",
      detail: "Holder snapshot, payment list, and issuer handoff.",
      count: workflows.filter(({ instance }) => instance!.sourceType === "Redemption").length,
    },
  ];
  const stageOptions: Array<{ value: TaskStageFilter; label: string; count: number }> = [
    { value: "all", label: "All stages", count: areaFilteredWorkflows.length },
    {
      value: "intake",
      label: "Intake required",
      count: areaFilteredWorkflows.filter(({ task }) => task.taskStatus === "New Request" || task.taskStatus === "Awaiting Pull").length,
    },
    {
      value: "match",
      label: "Data match",
      count: areaFilteredWorkflows.filter(({ task }) => task.taskStatus === "Match Required").length,
    },
    {
      value: "taAction",
      label: "TA action ready",
      count: areaFilteredWorkflows.filter(({ task }) =>
        task.taskStatus === "Ready For Approval",
      ).length,
    },
    {
      value: "issuerReview",
      label: "Issuer review",
      count: areaFilteredWorkflows.filter(({ task }) => task.taskStatus === "Awaiting Issuer").length,
    },
    {
      value: "exception",
      label: "Exception",
      count: areaFilteredWorkflows.filter(({ task }) => ["Blocked", "Returned"].includes(task.taskStatus)).length,
    },
    {
      value: "closed",
      label: "Completed",
      count: areaFilteredWorkflows.filter(({ task }) => task.taskStatus === "Completed").length,
    },
  ];

  return (
    <div className="container mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8">
        <div className="mb-2 flex flex-wrap gap-2">
          <Badge variant="outline">Workflow Engine</Badge>
          <Badge variant="secondary">Review-gated</Badge>
        </div>
        <h1 style={{ fontFamily: "var(--font-heading)" }}>TA Workflows</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Pull issuer requests into a controlled approval flow, match source data, then release register actions from the workflow detail page.
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <MetricCard icon={FileSearch} label="Open Workflows" value={openCount} variant="primary" />
        <MetricCard icon={ShieldCheck} label="Ready Actions" value={readyCount} variant="success" />
        <MetricCard icon={Clock3} label="Awaiting Issuer" value={waitingIssuerCount} />
        <MetricCard icon={TriangleAlert} label="Exceptions" value={exceptionCount} variant="warning" />
      </div>

      <div className="mb-6 rounded-lg border bg-card p-4">
        <div className="mb-4">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            1. Workflow area
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {areaOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setAreaFilter(option.value);
                  setStageFilter("all");
                }}
                className={`rounded-lg border p-3 text-left transition-colors hover:bg-secondary ${
                  areaFilter === option.value ? "border-primary bg-primary/5" : "bg-background"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{option.detail}</div>
                  </div>
                  <Badge variant={areaFilter === option.value ? "default" : "outline"}>{option.count}</Badge>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            2. Task stage
          </div>
          <div className="overflow-x-auto pb-1">
            <Tabs value={stageFilter} onValueChange={(value) => setStageFilter(value as TaskStageFilter)}>
              <TabsList className="w-max justify-start">
                {stageOptions.map((option) => (
                  <TabsTrigger key={option.value} className="flex-none shrink-0 px-3" value={option.value}>
                    {option.label}
                    <span className="ml-1 text-xs text-muted-foreground">{option.count}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workflow Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 xl:hidden">
            {filteredWorkflows.map(({ task, instance, match }) => {
              const meta = getWorkflowSourceMeta(instance!);
              return (
                <div key={task.taskId} className="rounded-lg border p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{meta.eventName}</div>
                      <div className="text-xs text-muted-foreground">{meta.fundName}</div>
                      <div className="mt-1 font-mono text-[11px] text-muted-foreground">{meta.sourceLabel}</div>
                      {meta.relatedLabel ? (
                        <div className="mt-1 text-[11px] text-muted-foreground">{meta.relatedLabel}</div>
                      ) : null}
                    </div>
                    <Badge variant={statusVariant(task.taskStatus)}>{task.taskStatus}</Badge>
                  </div>
                  <div className="mb-3 rounded-md bg-muted px-3 py-2 text-xs">
                    <div>{meta.primaryScope}</div>
                    <div>{meta.secondaryScope}</div>
                    <div className="mt-1 font-mono">Workflow: {instance!.workflowId}</div>
                    <div className="font-mono">Task: {task.taskId}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-muted-foreground">Step</div>
                      <div className="font-medium">{instance!.currentStepId}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Stage</div>
                      <div className="font-medium">{getTaskStageLabel(task.taskStatus)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Match</div>
                      <div className="font-medium">{match ? (match.matched ? "Passed" : "Exception") : "Pending"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Priority</div>
                    <div className="font-medium">{workflowPriority(task.taskStatus)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Assignee</div>
                    <div className="font-medium">{task.assignee || "Unassigned"}</div>
                  </div>
                </div>
                <Button asChild className="mt-4 w-full">
                  <Link to={`/ta/queue/${task.taskId}`}>
                    Open Workflow
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                </div>
              );
            })}
            {filteredWorkflows.length === 0 && (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No workflow tasks match this filter.
              </div>
            )}
          </div>

          <div className="hidden xl:block">
            <Table className="min-w-[1180px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Issuer Source</TableHead>
                  <TableHead>Workflow Linkage</TableHead>
                  <TableHead>Current Step</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Review / Match</TableHead>
                  <TableHead className="sticky right-0 z-20 bg-card shadow-[-8px_0_12px_-12px_rgba(15,23,41,0.45)]">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkflows.map(({ task, instance, match }) => {
                  const reviewComplete = Object.values(task.reviewChecklist).every(Boolean);
                  const meta = getWorkflowSourceMeta(instance!);
                  return (
                    <TableRow key={task.taskId}>
                      <TableCell>
                        <Badge variant={statusVariant(task.taskStatus)}>{task.taskStatus}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{meta.eventName}</div>
                        <div className="text-xs text-muted-foreground">{meta.fundName}</div>
                        <div className="text-xs text-muted-foreground">{getWorkflowAreaLabel(instance!.sourceType)}</div>
                        <div className="font-mono text-xs text-muted-foreground">{meta.sourceLabel}</div>
                        {meta.relatedLabel ? (
                          <div className="text-xs text-muted-foreground">{meta.relatedLabel}</div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">{meta.primaryScope}</div>
                        <div className="text-xs text-muted-foreground">{meta.secondaryScope}</div>
                        <div className="mt-1 font-mono text-[11px] text-muted-foreground">{instance!.workflowId}</div>
                        <div className="font-mono text-[11px] text-muted-foreground">{task.taskId}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{instance!.currentStepId}</div>
                        <div className="text-xs text-muted-foreground">{getTaskStageLabel(task.taskStatus)}</div>
                        <div className="text-xs text-muted-foreground">{getWorkflowTaskActionLabel(instance, task)}</div>
                      </TableCell>
                      <TableCell>{task.ownerRole}</TableCell>
                      <TableCell>
                        <div className="text-sm">{reviewComplete ? "Review complete" : "Review pending"}</div>
                        <div className="text-xs text-muted-foreground">
                          {match ? (match.matched ? "Match passed" : "Match exception") : "Match pending"}
                        </div>
                      </TableCell>
                      <TableCell className="sticky right-0 z-10 bg-card shadow-[-8px_0_12px_-12px_rgba(15,23,41,0.45)]">
                        <Button asChild size="sm">
                          <Link to={`/ta/queue/${task.taskId}`}>
                            Open Workflow
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredWorkflows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                      No workflow tasks match this filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
