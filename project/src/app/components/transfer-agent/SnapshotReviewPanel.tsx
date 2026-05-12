import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, FilePenLine, ListChecks, ShieldCheck, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { MetricCard } from "../MetricCard";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Textarea } from "../ui/textarea";
import { useApp } from "../../context/AppContext";
import type { HolderSnapshot, HolderSnapshotPosition, SettlementList, SettlementListLine } from "../../data/fundDemoData";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

type SnapshotDraft = {
  included: boolean;
  units: string;
  amount: string;
  destination: string;
  reason: string;
  status: SettlementListLine["status"];
};

function parseAmount(value?: string) {
  if (!value) return 0;
  const match = value.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

function statusVariant(status?: string): BadgeVariant {
  if (!status) return "outline";
  if (["Held", "Rejected", "Suspended", "Restricted"].includes(status)) return "destructive";
  if (["Submitted", "SubmittedToIssuer", "Locked", "Generated"].includes(status)) return "secondary";
  if (["Ready", "Paid", "Reconciled", "IssuerAcknowledged"].includes(status)) return "default";
  return "outline";
}

function formatDate(value?: string) {
  if (!value) return "Not reviewed";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function buildDraft(position: HolderSnapshotPosition, line?: SettlementListLine): SnapshotDraft {
  return {
    included: position.included,
    units: position.units,
    amount: line?.amount || position.entitlementAmount || position.cashAmount || "0",
    destination: line?.destination || position.walletAddress,
    reason: position.exclusionReason || "",
    status: line?.status || (position.included ? "Ready" : "Held"),
  };
}

export function SnapshotReviewPanel({
  snapshot,
  positions,
  list,
  lines,
}: {
  snapshot?: HolderSnapshot;
  positions: HolderSnapshotPosition[];
  list?: SettlementList;
  lines: SettlementListLine[];
}) {
  const { overwriteHolderSnapshotPosition, reviewHolderSnapshot } = useApp();
  const [drafts, setDrafts] = useState<Record<string, SnapshotDraft>>({});

  const lineByPosition = useMemo(
    () => new Map(lines.map((line) => [line.holderSnapshotPositionId, line])),
    [lines],
  );
  const reviewComplete = ["review-snapshot", "manual-overwrite", "review"].includes(snapshot?.lastAction || "");
  const readOnly = !snapshot || ["SubmittedToIssuer", "IssuerAcknowledged", "Reconciled"].includes(snapshot.status);
  const totalUnits = positions.reduce((sum, position) => sum + parseAmount(position.units), 0);
  const totalAmount = lines.reduce((sum, line) => sum + parseAmount(line.amount), 0);
  const manualOverwriteCount = new Set([
    ...positions
      .filter((position) => position.lastAction === "manual-overwrite")
      .map((position) => position.positionId),
    ...lines
      .filter((line) => line.lastAction === "manual-overwrite")
      .map((line) => line.holderSnapshotPositionId),
  ]).size;

  useEffect(() => {
    const nextDrafts = Object.fromEntries(
      positions.map((position) => [
        position.positionId,
        buildDraft(position, lineByPosition.get(position.positionId)),
      ]),
    );
    setDrafts(nextDrafts);
  }, [positions, lineByPosition]);

  const updateDraft = (positionId: string, updates: Partial<SnapshotDraft>) => {
    setDrafts((current) => ({
      ...current,
      [positionId]: {
        ...current[positionId],
        ...updates,
      },
    }));
  };

  const saveRow = (position: HolderSnapshotPosition) => {
    const draft = drafts[position.positionId];
    if (!draft) return;
    const line = lineByPosition.get(position.positionId);
    const result = overwriteHolderSnapshotPosition(
      position.positionId,
      {
        included: draft.included,
        units: draft.units,
        exclusionReason: draft.included ? undefined : draft.reason || "Manually excluded by TA reviewer.",
        entitlementAmount: snapshot?.sourceType === "Distribution" ? draft.amount : position.entitlementAmount,
        cashAmount: snapshot?.sourceType === "Redemption" ? draft.amount : position.cashAmount,
      },
      position.version,
      line?.lineId,
      line
        ? {
            amount: draft.amount,
            destination: draft.destination,
            status: draft.included ? draft.status : "Held",
          }
        : undefined,
      line?.version,
    );
    if (result.success) {
      toast.success(result.message, { position: "top-center" });
    } else {
      toast.error(result.message || "Snapshot overwrite failed.", { position: "top-center" });
    }
  };

  const markReviewed = () => {
    if (!snapshot) return;
    const result = reviewHolderSnapshot(snapshot.snapshotId, snapshot.version);
    if (result.success) {
      toast.success(result.message, { position: "top-center" });
    } else {
      toast.error(result.message || "Snapshot review failed.", { position: "top-center" });
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline">Snapshot Review</Badge>
            <Badge variant={reviewComplete ? "default" : "secondary"}>
              {reviewComplete ? "Reviewed" : "Review Required"}
            </Badge>
            {list ? <Badge variant={statusVariant(list.status)}>{list.listType}</Badge> : null}
          </div>
          <CardTitle>Holder Snapshot Output</CardTitle>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Review the holder-level snapshot and expected allocation/payment list before sending it back to issuer review.
            Manual overwrites are versioned and recorded as audit evidence.
          </p>
        </div>
        <Button disabled={readOnly || reviewComplete || !snapshot || !list || positions.length === 0} onClick={markReviewed}>
          <ShieldCheck className="h-4 w-4" />
          {reviewComplete ? "Snapshot Reviewed" : "Mark Snapshot Reviewed"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        {!snapshot ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Lock the workflow snapshot before reviewing holder data.
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <MetricCard icon={ListChecks} label="Snapshot Rows" value={positions.length} variant="primary" />
              <MetricCard icon={CheckCircle2} label="Included" value={positions.filter((position) => position.included).length} variant="success" />
              <MetricCard icon={FilePenLine} label="Manual Overwrites" value={manualOverwriteCount} variant={manualOverwriteCount ? "warning" : "default"} />
              <MetricCard icon={TriangleAlert} label="Expected Amount" value={lines.length ? `${formatAmount(totalAmount)} ${lines[0]?.currency || "HKD"}` : "Pending"} />
            </div>

            <div className="grid gap-3 rounded-lg border bg-secondary/30 p-4 text-sm md:grid-cols-4">
              <div>
                <div className="text-muted-foreground">Snapshot ID</div>
                <div className="break-all font-mono text-xs">{snapshot.snapshotId}</div>
              </div>
              <div>
                <div className="text-muted-foreground">List ID</div>
                <div className="break-all font-mono text-xs">{list?.listId || "Generate list first"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Snapshot Version</div>
                <div className="font-medium">v{snapshot.version}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Last Review Action</div>
                <div className="font-medium">{snapshot.lastAction || "Not reviewed"}</div>
                <div className="text-xs text-muted-foreground">{formatDate(snapshot.lastActionAt)}</div>
              </div>
            </div>

            {!list ? (
              <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                The holder rows can be inspected now. Generate the recipient/payment list before final snapshot review.
              </div>
            ) : null}

            <div className="space-y-3 md:hidden">
              {positions.map((position) => {
                const draft = drafts[position.positionId] || buildDraft(position, lineByPosition.get(position.positionId));
                const line = lineByPosition.get(position.positionId);
                return (
                  <div key={position.positionId} className="rounded-lg border p-4 text-sm">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{position.holderName}</div>
                        <div className="font-mono text-xs text-muted-foreground">{position.registerAccountId}</div>
                      </div>
                      <Badge variant={statusVariant(draft.included ? line?.status || "Ready" : "Held")}>
                        {draft.included ? line?.status || "Ready" : "Held"}
                      </Badge>
                    </div>
                    <div className="grid gap-3">
                      <label className="flex items-center gap-2">
                        <Checkbox
                          checked={draft.included}
                          disabled={readOnly}
                          onCheckedChange={(checked) => updateDraft(position.positionId, { included: Boolean(checked) })}
                        />
                        Include in issuer output
                      </label>
                      <Input disabled={readOnly} value={draft.units} onChange={(event) => updateDraft(position.positionId, { units: event.target.value })} />
                      <Input disabled={readOnly} value={draft.amount} onChange={(event) => updateDraft(position.positionId, { amount: event.target.value })} />
                      <Input disabled={readOnly} value={draft.destination} onChange={(event) => updateDraft(position.positionId, { destination: event.target.value })} />
                      <Textarea disabled={readOnly} value={draft.reason} onChange={(event) => updateDraft(position.positionId, { reason: event.target.value })} placeholder="Override reason" />
                      <Button disabled={readOnly} onClick={() => saveRow(position)}>Save Row Override</Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <Table className="min-w-[1120px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Holder</TableHead>
                    <TableHead>Include</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Expected Amount</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Override Reason</TableHead>
                    <TableHead>Trace</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.map((position) => {
                    const line = lineByPosition.get(position.positionId);
                    const draft = drafts[position.positionId] || buildDraft(position, line);
                    return (
                      <TableRow key={position.positionId}>
                        <TableCell>
                          <div className="font-medium">{position.holderName}</div>
                          <div className="font-mono text-xs text-muted-foreground">{position.registerAccountId}</div>
                          <Badge className="mt-1" variant={statusVariant(position.restrictionStatus)}>
                            {position.restrictionStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={draft.included}
                            disabled={readOnly}
                            onCheckedChange={(checked) => updateDraft(position.positionId, { included: Boolean(checked) })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input className="w-32" disabled={readOnly} value={draft.units} onChange={(event) => updateDraft(position.positionId, { units: event.target.value })} />
                        </TableCell>
                        <TableCell>
                          <Input className="w-36" disabled={readOnly} value={draft.amount} onChange={(event) => updateDraft(position.positionId, { amount: event.target.value })} />
                        </TableCell>
                        <TableCell>
                          <Input className="w-48" disabled={readOnly} value={draft.destination} onChange={(event) => updateDraft(position.positionId, { destination: event.target.value })} />
                        </TableCell>
                        <TableCell>
                          <Select
                            disabled={readOnly || !line}
                            value={draft.included ? draft.status : "Held"}
                            onValueChange={(status) => updateDraft(position.positionId, { status: status as SettlementListLine["status"] })}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Ready">Ready</SelectItem>
                              <SelectItem value="Held">Held</SelectItem>
                              <SelectItem value="Submitted">Submitted</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Textarea
                            className="min-h-16 w-56"
                            disabled={readOnly}
                            value={draft.reason}
                            onChange={(event) => updateDraft(position.positionId, { reason: event.target.value })}
                            placeholder="Required when excluded or overwritten"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <div>Position v{position.version}</div>
                            <div>{line ? `Line v${line.version}` : "No line yet"}</div>
                            <div className="text-muted-foreground">{position.lastAction || line?.lastAction || "Seed / generated"}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button disabled={readOnly} size="sm" onClick={() => saveRow(position)}>
                            Save
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {positions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                        No holder rows are attached to this snapshot yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
