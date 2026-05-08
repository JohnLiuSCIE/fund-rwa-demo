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
import { getWorkflowTaskActionLabel, type WorkflowTaskStatus } from "../lib/workflowBackend";

type QueueFilter = "all" | "new" | "match" | "approval" | "issuer" | "closed";
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

export function TransferAgentWorkQueue() {
  const { fundIssuances, workflowState } = useApp();
  const fundNameById = new Map(fundIssuances.map((fund) => [fund.id, fund.name]));
  const workflows = workflowState.tasks
    .map((task) => ({
      task,
      instance: workflowState.instances.find((item) => item.workflowId === task.workflowId),
      match: task.matchResultId
        ? workflowState.matchResults.find((item) => item.matchResultId === task.matchResultId)
        : undefined,
    }))
    .filter((item) => item.instance);

  const filters: Record<QueueFilter, typeof workflows> = {
    all: workflows,
    new: workflows.filter(({ task }) => task.taskStatus === "New Request"),
    match: workflows.filter(({ task }) => task.taskStatus === "Match Required" || task.taskStatus === "Blocked"),
    approval: workflows.filter(({ task }) => task.taskStatus === "Ready For Approval" || task.taskStatus === "Ready To Reconcile"),
    issuer: workflows.filter(({ task }) => task.taskStatus === "Awaiting Issuer"),
    closed: workflows.filter(({ task }) => task.taskStatus === "Completed"),
  };

  const [filter, setFilter] = useState<QueueFilter>("all");
  const filteredWorkflows = filters[filter];
  const openCount = workflows.filter(({ task }) => task.taskStatus !== "Completed").length;
  const readyCount = workflows.filter(({ task }) =>
    ["Ready For Approval", "Ready To Reconcile"].includes(task.taskStatus),
  ).length;
  const exceptionCount = workflows.filter(({ task }) => ["Blocked", "Returned"].includes(task.taskStatus)).length;
  const waitingIssuerCount = workflows.filter(({ task }) => task.taskStatus === "Awaiting Issuer").length;
  const tabClassName = "flex-none shrink-0 px-3";

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

      <div className="mb-6 overflow-x-auto pb-1">
        <Tabs value={filter} onValueChange={(value) => setFilter(value as QueueFilter)}>
          <TabsList className="w-max justify-start">
            <TabsTrigger className={tabClassName} value="all">All</TabsTrigger>
            <TabsTrigger className={tabClassName} value="new">New Request</TabsTrigger>
            <TabsTrigger className={tabClassName} value="match">Match</TabsTrigger>
            <TabsTrigger className={tabClassName} value="approval">Approval</TabsTrigger>
            <TabsTrigger className={tabClassName} value="issuer">Awaiting Issuer</TabsTrigger>
            <TabsTrigger className={tabClassName} value="closed">Closed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workflow Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 md:hidden">
            {filteredWorkflows.map(({ task, instance, match }) => (
              <div key={task.taskId} className="rounded-lg border p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{fundNameById.get(instance!.fundId) || instance!.fundId}</div>
                    <div className="text-xs text-muted-foreground">{instance!.sourceType} / {instance!.sourceReference}</div>
                  </div>
                  <Badge variant={statusVariant(task.taskStatus)}>{task.taskStatus}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-muted-foreground">Step</div>
                    <div className="font-medium">{instance!.currentStepId}</div>
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
            ))}
            {filteredWorkflows.length === 0 && (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No workflow tasks match this filter.
              </div>
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Fund / Event</TableHead>
                  <TableHead>Current Step</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Review / Match</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkflows.map(({ task, instance, match }) => {
                  const reviewComplete = Object.values(task.reviewChecklist).every(Boolean);
                  return (
                    <TableRow key={task.taskId}>
                      <TableCell>
                        <Badge variant={statusVariant(task.taskStatus)}>{task.taskStatus}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{fundNameById.get(instance!.fundId) || instance!.fundId}</div>
                        <div className="text-xs text-muted-foreground">
                          {instance!.sourceType} / {instance!.sourceReference}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{instance!.currentStepId}</div>
                        <div className="text-xs text-muted-foreground">{getWorkflowTaskActionLabel(instance, task)}</div>
                      </TableCell>
                      <TableCell>{task.ownerRole}</TableCell>
                      <TableCell>
                        <div className="text-sm">{reviewComplete ? "Review complete" : "Review pending"}</div>
                        <div className="text-xs text-muted-foreground">
                          {match ? (match.matched ? "Match passed" : "Match exception") : "Match pending"}
                        </div>
                      </TableCell>
                      <TableCell>
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
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
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
