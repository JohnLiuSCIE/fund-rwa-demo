import { CheckCircle2, CircleDashed, Loader2, TriangleAlert } from "lucide-react";

import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { cn } from "./ui/utils";

export interface ResponsibilityItem {
  label: string;
  owner: string;
  description: string;
}

export interface OperationsField {
  label: string;
  value: string;
}

export interface ChecklistItem {
  label: string;
  detail: string;
  status: "done" | "pending" | "attention";
}

export interface TransferAgentApprovalLockState {
  status: "waiting" | "approved";
  title: string;
  description: string;
  statusLabel?: string;
}

export function TransferAgentApprovalLock({
  state,
}: {
  state?: TransferAgentApprovalLockState;
}) {
  if (!state) return null;

  const isApproved = state.status === "approved";
  const Icon = isApproved ? CheckCircle2 : Loader2;

  return (
    <div
      className={cn(
        "relative rounded-lg border p-3 text-sm shadow-sm xl:mt-3",
        "before:absolute before:-top-2 before:right-8 before:h-4 before:w-4 before:rotate-45 before:border-l before:border-t before:bg-inherit",
        isApproved
          ? "border-emerald-200 bg-emerald-50 text-emerald-950 before:border-emerald-200"
          : "border-teal-200 bg-teal-50 text-teal-950 before:border-teal-200",
      )}
    >
      <div className="flex items-start gap-2">
        <Icon
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0",
            isApproved ? "text-emerald-700" : "animate-spin text-teal-700",
          )}
        />
        <div className="min-w-0">
          <div className="font-medium">{state.title}</div>
          <div className={cn("mt-1", isApproved ? "text-emerald-900/80" : "text-teal-900/80")}>
            {state.description}
          </div>
          {state.statusLabel ? (
            <Badge
              variant="outline"
              className={cn(
                "mt-3 w-fit bg-white/80",
                isApproved
                  ? "border-emerald-200 text-emerald-800"
                  : "border-teal-200 text-teal-800",
              )}
            >
              {state.statusLabel}
            </Badge>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function WorkflowResponsibilityCard({
  title = "Workflow Responsibility Map",
  description,
  items,
  className,
}: {
  title?: string;
  description: string;
  items: ResponsibilityItem[];
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg border p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium">{item.label}</div>
              <Badge variant="outline">{item.owner}</Badge>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">{item.description}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function TransferAgentOperationsCard({
  title = "Transfer Agent Operations",
  description,
  operatorName,
  status,
  fields,
  note,
  className,
}: {
  title?: string;
  description: string;
  operatorName?: string;
  status?: string;
  fields: OperationsField[];
  note?: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>{title}</CardTitle>
          {status ? <Badge variant="outline">{status}</Badge> : null}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {operatorName ? (
          <div className="rounded-lg border p-4">
            <div className="text-muted-foreground">Assigned Transfer Agent</div>
            <div className="mt-1 font-medium">{operatorName}</div>
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          {fields.map((field) => (
            <div key={field.label} className="rounded-lg border p-4">
              <div className="text-muted-foreground">{field.label}</div>
              <div className="mt-1 font-medium">{field.value}</div>
            </div>
          ))}
        </div>

        {note ? (
          <div className="rounded-lg border border-dashed bg-secondary/20 p-4 text-muted-foreground">
            {note}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function TransferAgentChecklistCard({
  title = "Transfer Agent Checklist",
  description,
  items,
  className,
}: {
  title?: string;
  description?: string;
  items: ChecklistItem[];
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {items.map((item) => {
          const Icon =
            item.status === "done"
              ? CheckCircle2
              : item.status === "attention"
                ? TriangleAlert
                : CircleDashed;

          return (
            <div key={item.label} className="rounded-lg border p-3">
              <div className="flex items-start gap-3">
                <Icon
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    item.status === "done" && "text-green-600",
                    item.status === "attention" && "text-amber-600",
                    item.status === "pending" && "text-slate-500",
                  )}
                />
                <div>
                  <div className="font-medium">{item.label}</div>
                  <div className="mt-1 text-muted-foreground">{item.detail}</div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
