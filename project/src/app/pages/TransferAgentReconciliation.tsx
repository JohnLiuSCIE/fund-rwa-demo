import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleSlash2, Clock3, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { MetricCard } from "../components/MetricCard";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useApp } from "../context/AppContext";
import type { ReconciliationBreak } from "../data/fundDemoData";

type BreakFilter = "open" | "critical" | "closed" | "all";
type BadgeVariant = "default" | "secondary" | "destructive" | "outline";
type BreakActionType = "resolve" | "waive";
type PendingAction = { type: BreakActionType; item: ReconciliationBreak } | null;

function severityVariant(severity: ReconciliationBreak["severity"]): BadgeVariant {
  if (severity === "Critical") return "destructive";
  if (severity === "High" || severity === "Medium") return "secondary";
  return "outline";
}

function statusVariant(status: ReconciliationBreak["status"]): BadgeVariant {
  if (status === "Resolved") return "outline";
  if (status === "Waived") return "secondary";
  if (status === "Open") return "destructive";
  return "secondary";
}

function isClosed(status: ReconciliationBreak["status"]) {
  return ["Resolved", "Waived"].includes(status);
}

function getBreakActionCopy(item: ReconciliationBreak) {
  if (isClosed(item.status)) {
    return {
      nextOwner: "Closed",
      taAction: "No TA action",
      eligibility: "Disabled: break already closed.",
      consequence: "This break is already closed and cannot be changed from this view.",
    };
  }

  if (item.ownerRole === "TransferAgent") {
    return {
      nextOwner: "TransferAgent",
      taAction: "Resolve or waive",
      eligibility: "Allowed: TA owns the break.",
      consequence: "Closing this break removes the blocker from TA reconciliation queues.",
    };
  }

  return {
    nextOwner: item.ownerRole,
    taAction: "Review evidence",
    eligibility: `Allowed: TA has reconciliation close authority; current owner remains ${item.ownerRole}.`,
    consequence: `Closing this break records a TA override while ${item.ownerRole} remains the source owner.`,
  };
}

function formatEvidenceSummary(item: ReconciliationBreak) {
  return [
    item.instructionId ? `Instruction ${item.instructionId}` : null,
    item.registerDeltaId ? `Register delta ${item.registerDeltaId}` : null,
    item.resolutionRefId ? `Resolution ${item.resolutionRefId}` : null,
  ]
    .filter(Boolean)
    .join(" / ") || "No linked evidence reference.";
}

function ActionButtons({
  item,
  onRequestAction,
}: {
  item: ReconciliationBreak;
  onRequestAction: (type: BreakActionType, item: ReconciliationBreak) => void;
}) {
  const copy = getBreakActionCopy(item);
  const closed = isClosed(item.status);

  return (
    <div className="min-w-0 space-y-2">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-1 xl:grid-cols-2">
        <Button size="sm" className="w-full" disabled={closed} onClick={() => onRequestAction("resolve", item)}>
          Resolve
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          disabled={closed}
          onClick={() => onRequestAction("waive", item)}
        >
          Waive
        </Button>
      </div>
      <div className="max-w-[16rem] text-xs text-muted-foreground">{copy.eligibility}</div>
    </div>
  );
}

export function TransferAgentReconciliation() {
  const {
    fundIssuances,
    reconciliationBreaks,
    resolveReconciliationBreak,
    waiveReconciliationBreak,
  } = useApp();
  const [filter, setFilter] = useState<BreakFilter>("open");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const fundNameById = useMemo(
    () => new Map(fundIssuances.map((fund) => [fund.id, fund.name])),
    [fundIssuances],
  );

  const filteredBreaks = reconciliationBreaks.filter((item) => {
    if (filter === "open") return !isClosed(item.status);
    if (filter === "critical") return !isClosed(item.status) && item.severity === "Critical";
    if (filter === "closed") return isClosed(item.status);
    return true;
  });

  const openBreaks = reconciliationBreaks.filter((item) => !isClosed(item.status));
  const criticalBreaks = openBreaks.filter((item) => item.severity === "Critical");
  const closedBreaks = reconciliationBreaks.filter((item) => isClosed(item.status));
  const taOwnedBreaks = openBreaks.filter((item) => item.ownerRole === "TransferAgent");

  const runCommand = (result: { success: boolean; message?: string }) => {
    if (result.success) {
      toast.success(result.message || "Reconciliation action completed.");
    } else {
      toast.error(result.message || "Reconciliation action failed.");
    }
  };

  const confirmPendingAction = () => {
    if (!pendingAction) return;

    const { item, type } = pendingAction;
    const result =
      type === "resolve"
        ? resolveReconciliationBreak(item.breakId, item.version)
        : waiveReconciliationBreak(item.breakId, item.version);
    runCommand(result);
    setPendingAction(null);
  };

  const pendingCopy = pendingAction ? getBreakActionCopy(pendingAction.item) : null;

  return (
    <div className="container mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="outline">Reconciliation</Badge>
          <Badge variant="secondary">Maker-checker Control</Badge>
        </div>
        <h1 style={{ fontFamily: "var(--font-heading)" }}>Break Management</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Register, cash, wallet, token, and instruction exceptions owned by the shared operating record.
        </p>
      </div>

      <div className="mb-6">
        <Tabs value={filter} onValueChange={(value) => setFilter(value as BreakFilter)}>
          <TabsList className="max-w-full overflow-x-auto">
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="critical">Critical</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reconciliation Breaks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 md:hidden">
            {filteredBreaks.map((item) => {
              const copy = getBreakActionCopy(item);

              return (
                <div key={item.breakId} className="rounded-lg border p-4 text-sm">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="break-words font-mono text-xs text-muted-foreground">{item.breakId}</div>
                      <div className="mt-1 font-medium">{item.breakType}</div>
                    </div>
                    <Badge variant={severityVariant(item.severity)}>{item.severity}</Badge>
                  </div>
                  <div className="mb-3 break-words text-muted-foreground">{item.description}</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-muted-foreground">Current owner</div>
                      <div className="font-medium">{item.ownerRole}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Next owner</div>
                      <div className="font-medium">{copy.nextOwner}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Status</div>
                      <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Detected</div>
                      <div className="font-medium">{item.detectedAt}</div>
                    </div>
                  </div>
                  <div className="mt-3 rounded-md border bg-muted/30 p-3">
                    <div className="text-muted-foreground">TA next action</div>
                    <div className="font-medium">{copy.taAction}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{copy.eligibility}</div>
                  </div>
                  <div className="mt-4">
                    <ActionButtons item={item} onRequestAction={(type, target) => setPendingAction({ type, item: target })} />
                  </div>
                </div>
              );
            })}
            {filteredBreaks.length === 0 && (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No reconciliation breaks in this view.
              </div>
            )}
          </div>

          <div className="hidden space-y-3 md:block">
              {filteredBreaks.map((item) => {
                const copy = getBreakActionCopy(item);

                return (
                  <div
                    key={item.breakId}
                    className="grid min-w-0 gap-4 rounded-lg border p-4 text-sm lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)_minmax(0,0.9fr)_148px] xl:grid-cols-[minmax(0,1.5fr)_minmax(0,0.8fr)_minmax(0,0.95fr)_172px]"
                  >
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge variant={severityVariant(item.severity)}>{item.severity}</Badge>
                        <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                      </div>
                      <div className="font-medium">{item.breakType}</div>
                      <div className="mt-1 break-words text-muted-foreground">{item.description}</div>
                      <div className="mt-2 break-all font-mono text-xs text-muted-foreground">{item.breakId}</div>
                    </div>

                    <div className="grid min-w-0 grid-cols-2 gap-3 lg:block lg:space-y-3">
                      <div className="min-w-0">
                        <div className="text-muted-foreground">Fund / Class</div>
                        <div className="break-words font-medium">{fundNameById.get(item.fundId) || item.fundId}</div>
                        <div className="text-xs text-muted-foreground">{item.classId}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-muted-foreground">Detected</div>
                        <div className="font-medium">{item.detectedAt}</div>
                      </div>
                    </div>

                    <div className="grid min-w-0 grid-cols-2 gap-3 lg:block lg:space-y-3">
                      <div className="min-w-0">
                        <div className="text-muted-foreground">Current owner</div>
                        <div className="font-medium">{item.ownerRole}</div>
                        <div className="text-xs text-muted-foreground">Next owner: {copy.nextOwner}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-muted-foreground">TA next action</div>
                        <div className="font-medium">{copy.taAction}</div>
                        <div className="text-xs text-muted-foreground">{copy.eligibility}</div>
                      </div>
                    </div>

                    <div className="min-w-0 lg:justify-self-end">
                      <ActionButtons item={item} onRequestAction={(type, target) => setPendingAction({ type, item: target })} />
                    </div>
                  </div>
                );
              })}
              {filteredBreaks.length === 0 && (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No reconciliation breaks in this view.
                </div>
              )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <MetricCard icon={AlertTriangle} label="Open Breaks" value={openBreaks.length} variant="warning" />
        <MetricCard icon={Clock3} label="TA Owned" value={taOwnedBreaks.length} variant="primary" />
        <MetricCard icon={CircleSlash2} label="Critical" value={criticalBreaks.length} variant="warning" />
        <MetricCard icon={CheckCircle2} label="Closed" value={closedBreaks.length} variant="success" />
      </div>

      <Dialog open={Boolean(pendingAction)} onOpenChange={(open) => !open && setPendingAction(null)}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
          {pendingAction && pendingCopy && (
            <>
              <DialogHeader>
                <div className="mb-1 flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-destructive" />
                  <Badge variant={severityVariant(pendingAction.item.severity)}>{pendingAction.item.severity}</Badge>
                  <Badge variant={statusVariant(pendingAction.item.status)}>{pendingAction.item.status}</Badge>
                </div>
                <DialogTitle>
                  Confirm {pendingAction.type === "resolve" ? "resolve" : "waive"} for {pendingAction.item.breakId}
                </DialogTitle>
                <DialogDescription>
                  Review owner, blocker, evidence, and consequence before changing this break status.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-md border p-3">
                  <div className="text-muted-foreground">Current owner</div>
                  <div className="font-medium">{pendingAction.item.ownerRole}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-muted-foreground">Next owner</div>
                  <div className="font-medium">{pendingCopy.nextOwner}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-muted-foreground">Blocker</div>
                  <div className="font-medium">{pendingAction.item.breakType}</div>
                  <div className="mt-1 text-muted-foreground">{pendingAction.item.description}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-muted-foreground">Evidence summary</div>
                  <div className="font-medium">{formatEvidenceSummary(pendingAction.item)}</div>
                </div>
                <div className="rounded-md border p-3 sm:col-span-2">
                  <div className="text-muted-foreground">Consequence</div>
                  <div className="font-medium">{pendingCopy.consequence}</div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setPendingAction(null)}>
                  Cancel
                </Button>
                <Button
                  variant={pendingAction.type === "waive" ? "outline" : "default"}
                  onClick={confirmPendingAction}
                >
                  {pendingAction.type === "resolve" ? "Resolve break" : "Waive break"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
