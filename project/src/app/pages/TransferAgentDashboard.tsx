import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileSearch,
  ListChecks,
  LockKeyhole,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import { MetricCard } from "../components/MetricCard";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { useApp } from "../context/AppContext";
import { buildRegisterHealth, buildTransferAgentSnapshotQueue, buildTransferAgentTasks } from "../lib/transferAgency";
import { getWorkflowTaskActionLabel, type WorkflowTaskStatus } from "../lib/workflowBackend";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

function priorityVariant(priority: string): BadgeVariant {
  if (priority === "Critical") return "destructive";
  if (priority === "High") return "secondary";
  return "outline";
}

function workflowStatusVariant(status: WorkflowTaskStatus): BadgeVariant {
  if (status === "Blocked" || status === "Returned") return "destructive";
  if (status === "Ready For Approval" || status === "Ready To Reconcile") return "default";
  if (status === "Awaiting Issuer" || status === "Match Required") return "secondary";
  return "outline";
}

function getBacklogLink(taskType: string) {
  if (taskType === "ResolveBreak") return "/ta/reconciliation";
  if (taskType === "SecondaryBridgePlaceholder") return "/ta/transfers";
  return "/ta/register";
}

export function TransferAgentDashboard() {
  const {
    fundIssuances,
    transferAgencyInstructions,
    registerDeltas,
    reconciliationBreaks,
    cashMovements,
    walletLinks,
    registerVersions,
    registerAccounts,
    holderSnapshots,
    settlementLists,
    workflowState,
  } = useApp();

  const health = buildRegisterHealth({
    registerDeltas,
    reconciliationBreaks,
    cashMovements,
    walletLinks,
    registerVersions,
  });
  const tasks = [
    ...buildTransferAgentSnapshotQueue({
      funds: fundIssuances,
      instructions: transferAgencyInstructions,
      holderSnapshots,
      settlementLists,
    }),
    ...buildTransferAgentTasks({
      funds: fundIssuances,
      instructions: transferAgencyInstructions,
      registerDeltas,
      reconciliationBreaks,
    }),
  ].slice(0, 6);
  const openBreaks = reconciliationBreaks.filter((item) => !["Resolved", "Waived"].includes(item.status));
  const totalUnits = registerAccounts.reduce((sum, account) => {
    const match = account.units.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
    return sum + (match ? Number(match[0]) : 0);
  }, 0);
  const restrictedHolders = registerAccounts.filter((account) =>
    ["Restricted", "Suspended"].includes(account.accountStatus),
  ).length;
  const unreconciledSnapshots = holderSnapshots.filter((snapshot) => snapshot.status !== "Reconciled").length;
  const latestVersions = [...registerVersions]
    .filter((item) => item.status === "Released")
    .sort((a, b) => (b.releasedAt || b.effectiveAt).localeCompare(a.releasedAt || a.effectiveAt))
    .slice(0, 4);
  const workflowRows = workflowState.tasks
    .map((task) => ({
      task,
      instance: workflowState.instances.find((item) => item.workflowId === task.workflowId),
    }))
    .filter((item) => item.instance)
    .sort((a, b) => {
      const aClosed = a.task.taskStatus === "Completed" ? 1 : 0;
      const bClosed = b.task.taskStatus === "Completed" ? 1 : 0;
      if (aClosed !== bClosed) return aClosed - bClosed;
      return b.task.updatedAt.localeCompare(a.task.updatedAt);
    })
    .slice(0, 5);
  const openWorkflowCount = workflowState.tasks.filter((task) => task.taskStatus !== "Completed").length;
  const newRequestCount = workflowState.tasks.filter((task) => task.taskStatus === "New Request").length;
  const waitingIssuerCount = workflowState.tasks.filter((task) => task.taskStatus === "Awaiting Issuer").length;
  const completedWorkflowCount = workflowState.tasks.filter((task) => task.taskStatus === "Completed").length;

  return (
    <div className="container mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="outline">Registrar / Transfer Agency</Badge>
            <Badge variant="secondary">Hong Kong MVP</Badge>
          </div>
          <h1 style={{ fontFamily: "var(--font-heading)" }}>Book of Record</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Maintain the legal ownership register, holder snapshots, evidence, and reconciliation from one shared operating record.
          </p>
        </div>
        <Button asChild>
          <Link to="/ta/queue">
            Open Workflows
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-5">
        <MetricCard icon={ShieldCheck} label="Registered Holders" value={registerAccounts.length} variant="primary" />
        <MetricCard icon={ListChecks} label="Registered Units" value={totalUnits.toLocaleString()} />
        <MetricCard icon={LockKeyhole} label="Restricted Holders" value={restrictedHolders} variant="warning" />
        <MetricCard icon={AlertTriangle} label="Unreconciled Snapshots" value={unreconciledSnapshots} variant="warning" />
        <MetricCard icon={WalletCards} label="Wallet Exceptions" value={health.walletMappingExceptions} variant="warning" />
      </div>

      <Card className="mb-6 min-w-0">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Workflow Intake</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Issuer handoffs arrive here before TA pulls, matches, and releases register actions.
            </p>
          </div>
          <Button asChild>
            <Link to="/ta/queue">
              Open Workflows
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-3 text-sm">
              <div className="flex items-center justify-between gap-2 text-muted-foreground">
                Open
                <FileSearch className="h-4 w-4" />
              </div>
              <div className="mt-2 text-2xl font-semibold">{openWorkflowCount}</div>
            </div>
            <div className="rounded-lg border p-3 text-sm">
              <div className="flex items-center justify-between gap-2 text-muted-foreground">
                New Request
                <Clock3 className="h-4 w-4" />
              </div>
              <div className="mt-2 text-2xl font-semibold">{newRequestCount}</div>
            </div>
            <div className="rounded-lg border p-3 text-sm">
              <div className="flex items-center justify-between gap-2 text-muted-foreground">
                Awaiting Issuer
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="mt-2 text-2xl font-semibold">{waitingIssuerCount}</div>
            </div>
            <div className="rounded-lg border p-3 text-sm">
              <div className="flex items-center justify-between gap-2 text-muted-foreground">
                Completed
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="mt-2 text-2xl font-semibold">{completedWorkflowCount}</div>
            </div>
          </div>

          <div className="space-y-3 md:hidden">
            {workflowRows.map(({ task, instance }) => (
              <div key={task.taskId} className="rounded-lg border p-4 text-sm">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {instance!.sourceType} / {instance!.sourceReference}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {fundIssuances.find((fund) => fund.id === instance!.fundId)?.name || instance!.fundId}
                    </div>
                  </div>
                  <Badge variant={workflowStatusVariant(task.taskStatus)}>{task.taskStatus}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-muted-foreground">Step</div>
                    <div className="font-medium">{instance!.currentStepId}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Owner</div>
                    <div className="font-medium">{task.ownerRole}</div>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
                  <Link to={`/ta/queue/${task.taskId}`}>Open Workflow</Link>
                </Button>
              </div>
            ))}
            {workflowRows.length === 0 && (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No issuer workflow requests yet.
              </div>
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Source Event</TableHead>
                  <TableHead>Current Step</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workflowRows.map(({ task, instance }) => (
                  <TableRow key={task.taskId}>
                    <TableCell>
                      <Badge variant={workflowStatusVariant(task.taskStatus)}>{task.taskStatus}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {instance!.sourceType} / {instance!.sourceReference}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {fundIssuances.find((fund) => fund.id === instance!.fundId)?.name || instance!.fundId}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{instance!.currentStepId}</div>
                      <div className="text-xs text-muted-foreground">
                        {getWorkflowTaskActionLabel(instance!, task)}
                      </div>
                    </TableCell>
                    <TableCell>{task.ownerRole}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/ta/queue/${task.taskId}`}>Open Workflow</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {workflowRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      No issuer workflow requests yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        <Card className="min-w-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Register Operations Backlog</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link to="/ta/register">Search Holder Book</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:hidden">
              {tasks.map((task) => (
                <div key={task.taskId} className="rounded-lg border p-4 text-sm">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{task.fundName}</div>
                      <div className="text-xs text-muted-foreground">{task.classId}</div>
                    </div>
                    <Badge variant={priorityVariant(task.priority)}>{task.priority}</Badge>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-muted-foreground">Task</div>
                      <div className="font-medium">{task.taskType}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Issue</div>
                      <div className="font-medium break-words">{task.blockingIssue || "None"}</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
                    <Link to={getBacklogLink(task.taskType)}>{task.nextActionLabel}</Link>
                  </Button>
                </div>
              ))}
              {tasks.length === 0 && (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No register work pending.
                </div>
              )}
            </div>

            <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Priority</TableHead>
                  <TableHead>Fund / Class</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Blocking Issue</TableHead>
                  <TableHead>Next Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.taskId}>
                    <TableCell>
                      <Badge variant={priorityVariant(task.priority)}>{task.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{task.fundName}</div>
                      <div className="text-xs text-muted-foreground">{task.classId}</div>
                    </TableCell>
                    <TableCell>{task.taskType}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{task.blockingIssue || "None"}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={getBacklogLink(task.taskType)}>{task.nextActionLabel}</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {tasks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      No register work pending.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Exceptions</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link to="/ta/reconciliation">Resolve</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {openBreaks.slice(0, 4).map((item) => (
              <div key={item.breakId} className="rounded-lg border p-3 text-sm">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Badge variant={item.severity === "Critical" ? "destructive" : "outline"}>{item.severity}</Badge>
                  <span className="text-xs text-muted-foreground">{item.status}</span>
                </div>
                <div className="font-medium">{item.breakType}</div>
                <div className="mt-1 text-muted-foreground">{item.description}</div>
              </div>
            ))}
            {openBreaks.length === 0 && (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                No open reconciliation breaks.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 min-w-0">
        <CardHeader>
          <CardTitle>Latest Register Versions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          {latestVersions.map((version) => (
            <div key={version.registerVersionId} className="rounded-lg border p-4 text-sm">
              <div className="font-medium">{version.registerVersionId}</div>
              <div className="mt-1 text-muted-foreground">{version.classId}</div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <div className="text-muted-foreground">Holders</div>
                  <div className="font-medium">{version.totalHolders}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Units</div>
                  <div className="font-medium">{version.totalUnits}</div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
