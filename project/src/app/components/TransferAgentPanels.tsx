import { CheckCircle2, CircleDashed, TriangleAlert } from "lucide-react";

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

export function TransferAgentOutputNotice({
  title = "TA has approved the above operation.",
  description,
  items = [],
}: {
  title?: string;
  description: string;
  items?: string[];
}) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-3 text-sm">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
        <div className="min-w-0">
          <div className="font-medium text-emerald-950">{title}</div>
          <div className="mt-1 text-emerald-900/80">{description}</div>
          {items.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {items.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-medium text-emerald-900"
                >
                  {item}
                </span>
              ))}
            </div>
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
