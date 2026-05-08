import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleSlash2, Clock3 } from "lucide-react";
import { toast } from "sonner";

import { MetricCard } from "../components/MetricCard";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useApp } from "../context/AppContext";
import type { ReconciliationBreak } from "../data/fundDemoData";

type BreakFilter = "open" | "critical" | "closed" | "all";
type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

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

export function TransferAgentReconciliation() {
  const {
    fundIssuances,
    reconciliationBreaks,
    resolveReconciliationBreak,
    waiveReconciliationBreak,
  } = useApp();
  const [filter, setFilter] = useState<BreakFilter>("open");

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

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <MetricCard icon={AlertTriangle} label="Open Breaks" value={openBreaks.length} variant="warning" />
        <MetricCard icon={Clock3} label="TA Owned" value={taOwnedBreaks.length} variant="primary" />
        <MetricCard icon={CircleSlash2} label="Critical" value={criticalBreaks.length} variant="warning" />
        <MetricCard icon={CheckCircle2} label="Closed" value={closedBreaks.length} variant="success" />
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Severity</TableHead>
                <TableHead>Break</TableHead>
                <TableHead>Fund / Class</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Detected</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBreaks.map((item) => (
                <TableRow key={item.breakId}>
                  <TableCell>
                    <Badge variant={severityVariant(item.severity)}>{item.severity}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{item.breakType}</div>
                    <div className="max-w-xl text-sm text-muted-foreground">{item.description}</div>
                    <div className="mt-1 font-mono text-xs text-muted-foreground">{item.breakId}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{fundNameById.get(item.fundId) || item.fundId}</div>
                    <div className="text-xs text-muted-foreground">{item.classId}</div>
                  </TableCell>
                  <TableCell>{item.ownerRole}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                  </TableCell>
                  <TableCell>{item.detectedAt}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        disabled={isClosed(item.status)}
                        onClick={() => runCommand(resolveReconciliationBreak(item.breakId, item.version))}
                      >
                        Resolve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isClosed(item.status)}
                        onClick={() => runCommand(waiveReconciliationBreak(item.breakId, item.version))}
                      >
                        Waive
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredBreaks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    No reconciliation breaks in this view.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
