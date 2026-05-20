import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileCheck2,
  ListChecks,
  PencilLine,
  ShieldCheck,
  type LucideIcon,
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
  matchResult?: string;
  matchTone?: ReviewTone;
  reviewState?: string;
  reviewTone?: ReviewTone;
  nextAction?: string;
  nextActionTone?: ReviewTone;
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
  matchResult?: string;
  matchTone?: ReviewTone;
  reviewState?: string;
  reviewTone?: ReviewTone;
  nextAction?: string;
  nextActionTone?: ReviewTone;
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
  matchResult?: string;
  matchTone?: ReviewTone;
  reviewState?: string;
  reviewTone?: ReviewTone;
  nextAction?: string;
  nextActionTone?: ReviewTone;
  detail?: string;
  reference?: string;
}

export interface ApprovalReviewDetailPanel {
  title: string;
  status?: string;
  tone?: ReviewTone;
  summary?: string;
  rows?: ApprovalReviewCell[];
  action?: ApprovalReviewRowAction;
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
  detailPanel?: ApprovalReviewDetailPanel;
}

type ReviewStageId = "snapshot" | "list" | "cash" | "evidence";

interface ReviewStage {
  id: ReviewStageId;
  label: string;
  icon: LucideIcon;
  count: number;
  issueCount: number;
  status: string;
  tone: ReviewTone;
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

function rowToneClass(tone: ReviewTone = "default") {
  switch (tone) {
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "danger":
      return "border-red-200 bg-red-50 text-red-700";
    case "muted":
      return "border-border bg-muted/70 text-muted-foreground";
    default:
      return "border-border bg-background text-foreground";
  }
}

function isIssueTone(tone?: ReviewTone) {
  return tone === "warning" || tone === "danger";
}

function statusToneFromText(value?: string): ReviewTone {
  const normalized = value?.toLowerCase() || "";
  if (
    normalized.includes("pass") ||
    normalized.includes("matched") ||
    normalized.includes("reviewed") ||
    normalized.includes("ready") ||
    normalized.includes("linked") ||
    normalized.includes("confirmed") ||
    normalized.includes("included") ||
    normalized.includes("paid") ||
    normalized.includes("cleared") ||
    normalized.includes("booked")
  ) {
    return "success";
  }
  if (
    normalized.includes("fail") ||
    normalized.includes("exception") ||
    normalized.includes("blocked") ||
    normalized.includes("rejected") ||
    normalized.includes("excluded") ||
    normalized.includes("missing")
  ) {
    return "danger";
  }
  if (
    normalized.includes("pending") ||
    normalized.includes("awaiting") ||
    normalized.includes("expected") ||
    normalized.includes("draft") ||
    normalized.includes("proof")
  ) {
    return "warning";
  }
  return "default";
}

function StatusPill({ label, tone }: { label: string; tone?: ReviewTone }) {
  return (
    <Badge variant="outline" className={cn("border whitespace-nowrap", toneClass(tone))}>
      {label}
    </Badge>
  );
}

function StageStatusIcon({ tone }: { tone: ReviewTone }) {
  if (tone === "danger" || tone === "warning") {
    return <AlertTriangle className="h-3.5 w-3.5" />;
  }
  if (tone === "success") {
    return <CheckCircle2 className="h-3.5 w-3.5" />;
  }
  return <ShieldCheck className="h-3.5 w-3.5" />;
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

function getStageTone(count: number, issueCount: number): ReviewTone {
  if (issueCount > 0) return "warning";
  if (count > 0) return "success";
  return "muted";
}

function getStageStatus(count: number, issueCount: number) {
  if (issueCount > 0) return `${issueCount} issue${issueCount === 1 ? "" : "s"}`;
  if (count > 0) return "Ready";
  return "No data";
}

function countTableIssues(rows: ApprovalReviewTableRow[]) {
  return rows.filter((row) =>
    [row.statusTone, row.matchTone, row.reviewTone, row.nextActionTone].some(isIssueTone),
  ).length;
}

function countCashIssues(rows: ApprovalReviewCashFlow[]) {
  return rows.filter((row) =>
    [row.statusTone, row.matchTone, row.reviewTone, row.nextActionTone].some(isIssueTone),
  ).length;
}

function countEvidenceIssues(rows: ApprovalReviewEvidenceRow[]) {
  return rows.filter((row) =>
    [row.statusTone, row.matchTone, row.reviewTone, row.nextActionTone].some(isIssueTone),
  ).length;
}

function getRowMatch(row: ApprovalReviewTableRow) {
  const label = row.matchResult || row.status || "Match pending";
  return {
    label,
    tone: row.matchTone || row.statusTone || statusToneFromText(label),
  };
}

function getRowReview(row: ApprovalReviewTableRow) {
  const label =
    row.reviewState ||
    (row.action?.disabled ? "Blocked" : row.action ? "Needs review" : row.status ? "Reviewed" : "Ready");
  return {
    label,
    tone: row.reviewTone || statusToneFromText(label),
  };
}

function getRowNextAction(row: ApprovalReviewTableRow) {
  const label =
    row.nextAction ||
    row.action?.label ||
    (isIssueTone(row.statusTone) || isIssueTone(row.matchTone) || isIssueTone(row.reviewTone)
      ? "Resolve issue"
      : "No row action");
  return {
    label,
    tone: row.nextActionTone || (label === "No row action" ? "muted" : statusToneFromText(label)),
  };
}

function getCashMatch(row: ApprovalReviewCashFlow) {
  const label = row.matchResult || row.status || "Cash pending";
  return {
    label,
    tone: row.matchTone || row.statusTone || statusToneFromText(label),
  };
}

function getCashReview(row: ApprovalReviewCashFlow) {
  const label = row.reviewState || (isIssueTone(row.statusTone) ? "Needs review" : "Cash reviewed");
  return {
    label,
    tone: row.reviewTone || statusToneFromText(label),
  };
}

function getCashNextAction(row: ApprovalReviewCashFlow) {
  const label = row.nextAction || (isIssueTone(row.statusTone) ? "Resolve cash break" : "Monitor settlement");
  return {
    label,
    tone: row.nextActionTone || statusToneFromText(label),
  };
}

function getEvidenceMatch(row: ApprovalReviewEvidenceRow) {
  const label = row.matchResult || row.status || "Evidence pending";
  return {
    label,
    tone: row.matchTone || row.statusTone || statusToneFromText(label),
  };
}

function getEvidenceReview(row: ApprovalReviewEvidenceRow) {
  const label = row.reviewState || (isIssueTone(row.statusTone) ? "Needs review" : "Evidence reviewed");
  return {
    label,
    tone: row.reviewTone || statusToneFromText(label),
  };
}

function getEvidenceNextAction(row: ApprovalReviewEvidenceRow) {
  const label = row.nextAction || (isIssueTone(row.statusTone) ? "Collect evidence" : "No row action");
  return {
    label,
    tone: row.nextActionTone || (label === "No row action" ? "muted" : statusToneFromText(label)),
  };
}

function FieldChips({ cells, max = 4 }: { cells: ApprovalReviewCell[]; max?: number }) {
  const visible = cells.slice(0, max);
  const hidden = cells.length - visible.length;
  return (
    <div className="flex max-w-[300px] flex-wrap gap-1.5">
      {visible.map((cell) => (
        <span
          key={cell.label}
          className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-md border bg-muted/40 px-2 py-1 text-xs"
        >
          <span className="shrink-0 text-muted-foreground">{cell.label}</span>
          <span className="truncate font-medium">{cell.value}</span>
        </span>
      ))}
      {hidden > 0 ? (
        <span className="rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground">
          +{hidden} more
        </span>
      ) : null}
    </div>
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
    <Table className="min-w-[760px] table-fixed">
      <TableHeader>
        <TableRow>
          <TableHead>Record</TableHead>
          <TableHead>Match Result</TableHead>
          <TableHead>Review State</TableHead>
          <TableHead>Key Values</TableHead>
          <TableHead className="text-right">Next Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const match = getRowMatch(row);
          const review = getRowReview(row);
          const next = getRowNextAction(row);
          return (
            <TableRow key={row.id}>
              <TableCell className="whitespace-normal align-top">
                <div className="font-medium">{row.title}</div>
                {row.subtitle ? (
                  <div className="mt-1 break-all text-xs text-muted-foreground">{row.subtitle}</div>
                ) : null}
              </TableCell>
              <TableCell className="align-top">
                <StatusPill label={match.label} tone={match.tone} />
              </TableCell>
              <TableCell className="align-top">
                <StatusPill label={review.label} tone={review.tone} />
              </TableCell>
              <TableCell className="whitespace-normal align-top">
                <FieldChips cells={row.cells} />
              </TableCell>
              <TableCell className="text-right align-top">
                {row.action ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={row.action.disabled}
                    onClick={row.action.onClick}
                  >
                    <PencilLine className="h-4 w-4" />
                    {row.action.label}
                  </Button>
                ) : (
                  <span className={cn("inline-flex rounded-md border px-2 py-1 text-xs", rowToneClass(next.tone))}>
                    {next.label}
                  </span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
        {rows.length === 0 ? <EmptyRow colSpan={5} message={emptyMessage} /> : null}
      </TableBody>
    </Table>
  );
}

function CashFlowTable({ rows }: { rows: ApprovalReviewCashFlow[] }) {
  return (
    <Table className="min-w-[900px]">
      <TableHeader>
        <TableRow>
          <TableHead>Movement</TableHead>
          <TableHead>Match Result</TableHead>
          <TableHead>Review State</TableHead>
          <TableHead>Amount / Rail</TableHead>
          <TableHead>Reference</TableHead>
          <TableHead>Next Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((flow) => {
          const match = getCashMatch(flow);
          const review = getCashReview(flow);
          const next = getCashNextAction(flow);
          return (
            <TableRow key={flow.id}>
              <TableCell className="max-w-[240px] whitespace-normal">
                <div className="font-medium">{flow.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{flow.direction}</div>
                {flow.timestamp ? (
                  <div className="mt-1 text-xs text-muted-foreground">{flow.timestamp}</div>
                ) : null}
              </TableCell>
              <TableCell>
                <StatusPill label={match.label} tone={match.tone} />
              </TableCell>
              <TableCell>
                <StatusPill label={review.label} tone={review.tone} />
              </TableCell>
              <TableCell className="max-w-[260px] whitespace-normal">
                <div className="font-medium">{flow.amount}</div>
                <div className="mt-1 text-xs text-muted-foreground">{flow.rail}</div>
                <div className="mt-1 break-all text-xs text-muted-foreground">{flow.account}</div>
              </TableCell>
              <TableCell className="max-w-[180px] break-all font-mono text-xs">
                {flow.reference || flow.owner || "-"}
              </TableCell>
              <TableCell>
                <span className={cn("inline-flex rounded-md border px-2 py-1 text-xs", rowToneClass(next.tone))}>
                  {next.label}
                </span>
              </TableCell>
            </TableRow>
          );
        })}
        {rows.length === 0 ? <EmptyRow colSpan={6} message="No cash movement has been linked yet." /> : null}
      </TableBody>
    </Table>
  );
}

function EvidenceTable({ rows }: { rows: ApprovalReviewEvidenceRow[] }) {
  return (
    <Table className="min-w-[820px]">
      <TableHeader>
        <TableRow>
          <TableHead>Evidence</TableHead>
          <TableHead>Match Result</TableHead>
          <TableHead>Review State</TableHead>
          <TableHead>Type / Reference</TableHead>
          <TableHead>Next Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const match = getEvidenceMatch(row);
          const review = getEvidenceReview(row);
          const next = getEvidenceNextAction(row);
          return (
            <TableRow key={row.id}>
              <TableCell className="max-w-[300px] whitespace-normal">
                <div className="font-medium">{row.title}</div>
                {row.detail ? <div className="mt-1 break-all text-xs text-muted-foreground">{row.detail}</div> : null}
              </TableCell>
              <TableCell>
                <StatusPill label={match.label} tone={match.tone} />
              </TableCell>
              <TableCell>
                <StatusPill label={review.label} tone={review.tone} />
              </TableCell>
              <TableCell className="max-w-[260px] whitespace-normal">
                <div>{row.type}</div>
                <div className="mt-1 break-all font-mono text-xs text-muted-foreground">
                  {row.reference || "-"}
                </div>
              </TableCell>
              <TableCell>
                <span className={cn("inline-flex rounded-md border px-2 py-1 text-xs", rowToneClass(next.tone))}>
                  {next.label}
                </span>
              </TableCell>
            </TableRow>
          );
        })}
        {rows.length === 0 ? <EmptyRow colSpan={5} message="No evidence has been attached yet." /> : null}
      </TableBody>
    </Table>
  );
}

function ReviewDetailPanel({
  panel,
  stage,
}: {
  panel?: ApprovalReviewDetailPanel;
  stage: ReviewStage;
}) {
  const derivedRows: ApprovalReviewCell[] = [
    { label: "Active step", value: stage.label },
    { label: "Rows in scope", value: `${stage.count}` },
    { label: "Open issues", value: `${stage.issueCount}` },
  ];
  const rows = panel?.rows?.length ? panel.rows : derivedRows;
  const status = panel?.status || stage.status;
  const tone = panel?.tone || stage.tone;

  return (
    <aside className="rounded-lg border bg-muted/25 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{panel?.title || "Review Focus"}</div>
          <div className="mt-2">
            <StatusPill label={status} tone={tone} />
          </div>
        </div>
        <StageStatusIcon tone={tone} />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        {panel?.summary ||
          "Use the row states to decide whether the approval package can move forward or needs exception handling."}
      </p>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{row.label}</span>
            <span className="max-w-[150px] text-right font-medium">{row.value}</span>
          </div>
        ))}
      </div>
      {panel?.action ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4 w-full"
          disabled={panel.action.disabled}
          onClick={panel.action.onClick}
        >
          <ArrowRight className="h-4 w-4" />
          {panel.action.label}
        </Button>
      ) : null}
    </aside>
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
  detailPanel,
}: ApprovalReviewWorkspaceProps) {
  const [activeStageId, setActiveStageId] = useState<ReviewStageId>("snapshot");
  const stages = useMemo<ReviewStage[]>(
    () => [
      {
        id: "snapshot",
        label: "Snapshot",
        icon: Database,
        count: snapshotRows.length,
        issueCount: countTableIssues(snapshotRows),
        status: getStageStatus(snapshotRows.length, countTableIssues(snapshotRows)),
        tone: getStageTone(snapshotRows.length, countTableIssues(snapshotRows)),
      },
      {
        id: "list",
        label: "List",
        icon: ListChecks,
        count: listRows.length,
        issueCount: countTableIssues(listRows),
        status: getStageStatus(listRows.length, countTableIssues(listRows)),
        tone: getStageTone(listRows.length, countTableIssues(listRows)),
      },
      {
        id: "cash",
        label: "Cash",
        icon: Banknote,
        count: cashFlows.length,
        issueCount: countCashIssues(cashFlows),
        status: getStageStatus(cashFlows.length, countCashIssues(cashFlows)),
        tone: getStageTone(cashFlows.length, countCashIssues(cashFlows)),
      },
      {
        id: "evidence",
        label: "Evidence",
        icon: FileCheck2,
        count: evidenceRows.length,
        issueCount: countEvidenceIssues(evidenceRows),
        status: getStageStatus(evidenceRows.length, countEvidenceIssues(evidenceRows)),
        tone: getStageTone(evidenceRows.length, countEvidenceIssues(evidenceRows)),
      },
    ],
    [cashFlows, evidenceRows, listRows, snapshotRows],
  );
  const activeStage = stages.find((stage) => stage.id === activeStageId) || stages[0];
  const totalIssues = stages.reduce((sum, stage) => sum + stage.issueCount, 0);
  const totalRows = stages.reduce((sum, stage) => sum + stage.count, 0);
  const workspaceTone = totalIssues > 0 ? "warning" : totalRows > 0 ? "success" : "muted";
  const workspaceStatus =
    totalIssues > 0 ? `${totalIssues} issue${totalIssues === 1 ? "" : "s"} to clear` : totalRows > 0 ? "Ready for review" : "No approval data";

  const renderStage = (stageId: ReviewStageId, heading: string, content: ReactNode) => (
    <TabsContent value={stageId} className="mt-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 rounded-lg border bg-background p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-semibold">{heading}</div>
            <StatusPill label={activeStage.status} tone={activeStage.tone} />
          </div>
          <div className="overflow-x-auto">{content}</div>
        </div>
        <ReviewDetailPanel panel={detailPanel} stage={activeStage} />
      </div>
    </TabsContent>
  );

  return (
    <Card className="border-cyan-200 bg-cyan-50/25 shadow-none">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-cyan-700" />
              <CardTitle>{title}</CardTitle>
              <StatusPill label={workspaceStatus} tone={workspaceTone} />
            </div>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{description}</p>
          </div>
          {badges.length > 0 ? (
            <div className="flex flex-wrap gap-2 xl:justify-end">
              {badges.map((badge) => (
                <StatusPill key={badge.label} label={badge.label} tone={badge.tone} />
              ))}
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className={cn("rounded-lg border bg-background p-4", rowToneClass(metric.tone))}
            >
              <div className="text-xs font-medium uppercase tracking-wide opacity-70">{metric.label}</div>
              <div className="mt-2 text-xl font-semibold">{metric.value}</div>
              {metric.detail ? <div className="mt-1 text-xs opacity-75">{metric.detail}</div> : null}
            </div>
          ))}
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-cyan-200 bg-background p-4 text-sm">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-700" />
          <div>
            <div className="font-medium">Approval control summary</div>
            <div className="mt-1 text-muted-foreground">{reviewHint}</div>
          </div>
        </div>

        <Tabs value={activeStageId} onValueChange={(value) => setActiveStageId(value as ReviewStageId)}>
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-muted/60 p-1 lg:grid-cols-4">
            {stages.map((stage) => {
              const Icon = stage.icon;
              return (
                <TabsTrigger
                  key={stage.id}
                  value={stage.id}
                  className="min-w-0 justify-start gap-2 px-3 py-2 text-left data-[state=active]:bg-background"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium">{stage.label}</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                        {stage.count}
                      </span>
                    </span>
                    <span className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <StageStatusIcon tone={stage.tone} />
                      {stage.status}
                    </span>
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {renderStage(
            "snapshot",
            snapshotTitle,
            <ReviewRowsTable rows={snapshotRows} emptyMessage="No snapshot rows are available for review yet." />,
          )}
          {renderStage(
            "list",
            listTitle,
            <ReviewRowsTable rows={listRows} emptyMessage="No settlement list rows are available for review yet." />,
          )}
          {renderStage("cash", "Cash Movement", <CashFlowTable rows={cashFlows} />)}
          {renderStage("evidence", "Evidence and Anchors", <EvidenceTable rows={evidenceRows} />)}
        </Tabs>
      </CardContent>
    </Card>
  );
}
