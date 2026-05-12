import {
  Banknote,
  ClipboardCheck,
  Database,
  FileCheck2,
  ListChecks,
  PencilLine,
} from "lucide-react";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { cn } from "./ui/utils";

export type ReviewTone = "default" | "success" | "warning" | "danger" | "muted";

export interface ApprovalReviewBadge {
  label: string;
  tone?: ReviewTone;
}

export interface ApprovalReviewMetric {
  label: string;
  value: string;
  detail?: string;
  tone?: ReviewTone;
}

export interface ApprovalReviewCell {
  label: string;
  value: string;
}

export interface ApprovalReviewRowAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export interface ApprovalReviewTableRow {
  id: string;
  title: string;
  subtitle?: string;
  status?: string;
  statusTone?: ReviewTone;
  cells: ApprovalReviewCell[];
  action?: ApprovalReviewRowAction;
}

export interface ApprovalReviewCashFlow {
  id: string;
  title: string;
  direction: string;
  amount: string;
  rail: string;
  account: string;
  status: string;
  statusTone?: ReviewTone;
  reference?: string;
  timestamp?: string;
  owner?: string;
}

export interface ApprovalReviewEvidenceRow {
  id: string;
  title: string;
  type: string;
  status: string;
  statusTone?: ReviewTone;
  detail?: string;
  reference?: string;
}

interface ApprovalReviewWorkspaceProps {
  title: string;
  description: string;
  badges?: ApprovalReviewBadge[];
  metrics: ApprovalReviewMetric[];
  snapshotTitle?: string;
  snapshotRows: ApprovalReviewTableRow[];
  listTitle?: string;
  listRows: ApprovalReviewTableRow[];
  cashFlows: ApprovalReviewCashFlow[];
  evidenceRows: ApprovalReviewEvidenceRow[];
  reviewHint?: string;
}

function toneClass(tone: ReviewTone = "default") {
  switch (tone) {
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "danger":
      return "border-red-200 bg-red-50 text-red-700";
    case "muted":
      return "border-border bg-muted text-muted-foreground";
    default:
      return "border-primary/20 bg-primary/5 text-primary";
  }
}

function StatusPill({ label, tone }: { label: string; tone?: ReviewTone }) {
  return (
    <Badge variant="outline" className={cn("border", toneClass(tone))}>
      {label}
    </Badge>
  );
}

function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-10 text-center text-muted-foreground">
        {message}
      </TableCell>
    </TableRow>
  );
}

function ReviewRowsTable({
  rows,
  emptyMessage,
}: {
  rows: ApprovalReviewTableRow[];
  emptyMessage: string;
}) {
  return (
    <Table className="min-w-[820px]">
      <TableHeader>
        <TableRow>
          <TableHead>Record</TableHead>
          <TableHead>Data Points</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Review Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="max-w-[260px] whitespace-normal">
              <div className="font-medium">{row.title}</div>
              {row.subtitle ? (
                <div className="mt-1 text-xs text-muted-foreground">{row.subtitle}</div>
              ) : null}
            </TableCell>
            <TableCell className="whitespace-normal">
              <div className="grid gap-2 sm:grid-cols-2">
                {row.cells.map((cell) => (
                  <div key={`${row.id}-${cell.label}`} className="rounded-md border bg-background px-3 py-2">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {cell.label}
                    </div>
                    <div className="mt-1 text-sm font-medium">{cell.value}</div>
                  </div>
                ))}
              </div>
            </TableCell>
            <TableCell>{row.status ? <StatusPill label={row.status} tone={row.statusTone} /> : "—"}</TableCell>
            <TableCell className="text-right">
              {row.action ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={row.action.disabled}
                  onClick={row.action.onClick}
                >
                  <PencilLine className="mr-2 h-4 w-4" />
                  {row.action.label}
                </Button>
              ) : (
                <span className="text-sm text-muted-foreground">Reviewed</span>
              )}
            </TableCell>
          </TableRow>
        ))}
        {rows.length === 0 ? <EmptyRow colSpan={4} message={emptyMessage} /> : null}
      </TableBody>
    </Table>
  );
}

export function ApprovalReviewWorkspace({
  title,
  description,
  badges = [],
  metrics,
  snapshotTitle = "Data Snapshot",
  snapshotRows,
  listTitle = "Settlement List",
  listRows,
  cashFlows,
  evidenceRows,
  reviewHint = "Review and adjust the approval package here. The workflow action above remains the control point for moving to the next step.",
}: ApprovalReviewWorkspaceProps) {
  return (
    <Card className="border-cyan-200 bg-cyan-50/30 shadow-none">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-cyan-700" />
              <CardTitle>{title}</CardTitle>
            </div>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{description}</p>
          </div>
          {badges.length > 0 ? (
            <div className="flex flex-wrap gap-2 lg:justify-end">
              {badges.map((badge) => (
                <StatusPill key={badge.label} label={badge.label} tone={badge.tone} />
              ))}
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className={cn("rounded-lg border bg-background p-4", toneClass(metric.tone))}>
              <div className="text-xs font-medium uppercase tracking-wide opacity-70">{metric.label}</div>
              <div className="mt-2 text-xl font-semibold">{metric.value}</div>
              {metric.detail ? <div className="mt-1 text-xs opacity-75">{metric.detail}</div> : null}
            </div>
          ))}
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-cyan-200 bg-background p-4 text-sm">
          <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-cyan-700" />
          <div>
            <div className="font-medium">Approval data package</div>
            <div className="mt-1 text-muted-foreground">{reviewHint}</div>
          </div>
        </div>

        <Tabs defaultValue="snapshot" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="snapshot" className="min-w-0 px-2 text-xs sm:text-sm">
              <Database className="mr-1.5 h-4 w-4" />
              Snapshot
            </TabsTrigger>
            <TabsTrigger value="list" className="min-w-0 px-2 text-xs sm:text-sm">
              <ListChecks className="mr-1.5 h-4 w-4" />
              List
            </TabsTrigger>
            <TabsTrigger value="cash" className="min-w-0 px-2 text-xs sm:text-sm">
              <Banknote className="mr-1.5 h-4 w-4" />
              Cash
            </TabsTrigger>
            <TabsTrigger value="evidence" className="min-w-0 px-2 text-xs sm:text-sm">
              <FileCheck2 className="mr-1.5 h-4 w-4" />
              Evidence
            </TabsTrigger>
          </TabsList>

          <TabsContent value="snapshot" className="rounded-lg border bg-background p-3">
            <div className="mb-3 text-sm font-medium">{snapshotTitle}</div>
            <ReviewRowsTable rows={snapshotRows} emptyMessage="No snapshot rows are available for review yet." />
          </TabsContent>

          <TabsContent value="list" className="rounded-lg border bg-background p-3">
            <div className="mb-3 text-sm font-medium">{listTitle}</div>
            <ReviewRowsTable rows={listRows} emptyMessage="No settlement list rows are available for review yet." />
          </TabsContent>

          <TabsContent value="cash" className="rounded-lg border bg-background p-3">
            <div className="mb-3 text-sm font-medium">Cash Movement</div>
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Movement</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Rail / Account</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Owner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cashFlows.map((flow) => (
                  <TableRow key={flow.id}>
                    <TableCell className="max-w-[240px] whitespace-normal">
                      <div className="font-medium">{flow.title}</div>
                      {flow.timestamp ? (
                        <div className="mt-1 text-xs text-muted-foreground">{flow.timestamp}</div>
                      ) : null}
                    </TableCell>
                    <TableCell>{flow.direction}</TableCell>
                    <TableCell className="font-medium">{flow.amount}</TableCell>
                    <TableCell className="max-w-[260px] whitespace-normal">
                      <div>{flow.rail}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{flow.account}</div>
                    </TableCell>
                    <TableCell>
                      <StatusPill label={flow.status} tone={flow.statusTone} />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{flow.reference || "—"}</TableCell>
                    <TableCell>{flow.owner || "—"}</TableCell>
                  </TableRow>
                ))}
                {cashFlows.length === 0 ? <EmptyRow colSpan={7} message="No cash movement has been linked yet." /> : null}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="evidence" className="rounded-lg border bg-background p-3">
            <div className="mb-3 text-sm font-medium">Evidence and Anchors</div>
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Evidence</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evidenceRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="max-w-[320px] whitespace-normal">
                      <div className="font-medium">{row.title}</div>
                      {row.detail ? <div className="mt-1 text-xs text-muted-foreground">{row.detail}</div> : null}
                    </TableCell>
                    <TableCell>{row.type}</TableCell>
                    <TableCell>
                      <StatusPill label={row.status} tone={row.statusTone} />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{row.reference || "—"}</TableCell>
                  </TableRow>
                ))}
                {evidenceRows.length === 0 ? <EmptyRow colSpan={4} message="No evidence has been attached yet." /> : null}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
