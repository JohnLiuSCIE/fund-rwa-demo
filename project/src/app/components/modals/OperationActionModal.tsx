import { useEffect, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";
import { LoadingStagePanel, type LoadingStageTone } from "./LoadingStagePanel";

type ActionModalStepKind = "review" | "identity" | "ta" | "onchain" | "success";

export interface ActionModalStep {
  label: string;
  title: string;
  description: string;
  state: "review" | "loading" | "success";
  kind?: ActionModalStepKind;
}

export interface ActionModalSummaryItem {
  label: string;
  value: string;
}

export interface ActionModalImpactBadge {
  label: string;
  kind: Exclude<ActionModalStepKind, "review" | "success">;
}

export interface ActionModalDetailGroup {
  title: string;
  items: string[];
  kind?: Exclude<ActionModalStepKind, "review" | "success">;
}

interface OperationActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  title: string;
  description: string;
  steps: ActionModalStep[];
  summary?: ActionModalSummaryItem[];
  impactBadges?: ActionModalImpactBadge[];
  detailGroups?: ActionModalDetailGroup[];
  startLabel?: string;
  completionLabel?: string;
  autoAdvanceMs?: number;
}

function resolveStepKind(step: ActionModalStep): ActionModalStepKind {
  if (step.kind) return step.kind;
  if (step.state === "review") return "review";
  if (step.state === "success") return "success";

  const normalizedLabel = step.label.toLowerCase();
  const normalizedTitle = step.title.toLowerCase();

  if (normalizedLabel.includes("ta") || normalizedTitle.includes("transfer agent")) {
    return "ta";
  }

  if (
    normalizedLabel.includes("chain") ||
    normalizedLabel.includes("transaction") ||
    normalizedLabel.includes("broadcast") ||
    normalizedTitle.includes("on-chain") ||
    normalizedTitle.includes("transaction")
  ) {
    return "onchain";
  }

  return "identity";
}

function getToneClasses(kind: ActionModalStepKind) {
  switch (kind) {
    case "ta":
      return {
        currentCircle: "border-teal-500 bg-teal-50 text-teal-700",
        completedCircle: "border-teal-600 bg-teal-600 text-white",
        connector: "bg-teal-500",
        badge: "border-teal-200 bg-teal-50 text-teal-700",
        iconWrap: "bg-teal-100 text-teal-700",
      };
    case "onchain":
      return {
        currentCircle: "border-cyan-500 bg-cyan-50 text-cyan-700",
        completedCircle: "border-cyan-600 bg-cyan-600 text-white",
        connector: "bg-cyan-500",
        badge: "border-cyan-200 bg-cyan-50 text-cyan-700",
        iconWrap: "bg-cyan-100 text-cyan-700",
      };
    case "success":
      return {
        currentCircle: "border-green-500 bg-green-50 text-green-700",
        completedCircle: "border-green-600 bg-green-600 text-white",
        connector: "bg-green-500",
        badge: "border-green-200 bg-green-50 text-green-700",
        iconWrap: "bg-green-100 text-green-700",
      };
    case "review":
      return {
        currentCircle: "border-slate-500 bg-slate-50 text-slate-700",
        completedCircle: "border-slate-600 bg-slate-600 text-white",
        connector: "bg-slate-500",
        badge: "border-slate-200 bg-slate-50 text-slate-700",
        iconWrap: "bg-slate-100 text-slate-700",
      };
    case "identity":
    default:
      return {
        currentCircle: "border-slate-500 bg-slate-50 text-slate-700",
        completedCircle: "border-slate-600 bg-slate-600 text-white",
        connector: "bg-slate-500",
        badge: "border-slate-200 bg-slate-50 text-slate-700",
        iconWrap: "bg-slate-100 text-slate-700",
      };
  }
}

function getLoadingTone(kind: ActionModalStepKind): LoadingStageTone {
  switch (kind) {
    case "ta":
      return "teal";
    case "onchain":
      return "cyan";
    case "review":
    case "identity":
    case "success":
    default:
      return "slate";
  }
}

function getDefaultLoadingItems(kind: ActionModalStepKind, title: string) {
  switch (kind) {
    case "ta":
      return [
        "Packaging transfer-agent instruction",
        "Dispatching operating request",
        "Recording register update checkpoint",
      ];
    case "onchain":
      return [
        "Preparing smart contract payload",
        "Awaiting wallet confirmation",
        "Broadcasting on-chain update",
      ];
    case "review":
    case "identity":
    case "success":
    default:
      return [
        `${title} request is in progress`,
        "Waiting for secure approval",
        "Syncing workflow status",
      ];
  }
}

function getLoadingItems(
  kind: ActionModalStepKind,
  title: string,
  detailGroups: ActionModalDetailGroup[],
) {
  const scopedItems = detailGroups
    .filter((group) => !group.kind || group.kind === kind)
    .flatMap((group) => group.items)
    .filter(Boolean);

  if (scopedItems.length > 0) {
    return scopedItems.slice(0, 3);
  }

  return getDefaultLoadingItems(kind, title);
}

function ProgressSteps({
  currentStep,
  steps,
}: {
  currentStep: number;
  steps: ActionModalStep[];
}) {
  return (
    <div className="mb-8 flex items-center justify-between">
      {steps.map((step, index) => {
        const tone = getToneClasses(resolveStepKind(step));
        const isActiveLoadingStep = index === currentStep && step.state === "loading";

        return (
          <div key={index} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                  index < currentStep && tone.completedCircle,
                  index === currentStep && tone.currentCircle,
                  index > currentStep && "border-gray-300 text-gray-400",
                )}
              >
                {index < currentStep ? (
                  <Check className="h-5 w-5" />
                ) : isActiveLoadingStep ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <div className="mt-2 max-w-20 text-center text-xs">{step.label}</div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "mx-2 h-0.5 flex-1 transition-colors",
                  index < currentStep ? tone.connector : "bg-gray-300",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function OperationActionModal({
  open,
  onOpenChange,
  onSuccess,
  title,
  description,
  steps,
  summary = [],
  impactBadges = [],
  detailGroups = [],
  startLabel = "Start",
  completionLabel = "Done",
  autoAdvanceMs = 1400,
}: OperationActionModalProps) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const isLastStep = step === steps.length - 1;
  const currentKind = resolveStepKind(current);
  const loadingTone = getLoadingTone(currentKind);
  const loadingItems = getLoadingItems(currentKind, current.title, detailGroups);

  useEffect(() => {
    if (!open) return;
    if (step === 0 || isLastStep) return;
    if (current.state !== "loading") return;

    const timeoutId = window.setTimeout(() => {
      setStep((previous) => Math.min(previous + 1, steps.length - 1));
    }, autoAdvanceMs);

    return () => window.clearTimeout(timeoutId);
  }, [autoAdvanceMs, current.state, isLastStep, open, step, steps.length]);

  const reset = () => setStep(0);

  const handleStart = () => {
    if (steps.length > 1) {
      setStep(1);
    }
  };

  const handleComplete = () => {
    onSuccess?.();
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) reset();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:!max-w-5xl xl:!max-w-6xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {impactBadges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {impactBadges.map((badge) => (
              <Badge
                key={`${badge.kind}-${badge.label}`}
                variant="outline"
                className={getToneClasses(badge.kind).badge}
              >
                {badge.label}
              </Badge>
            ))}
          </div>
        )}

        <ProgressSteps currentStep={step} steps={steps} />

        {current.state === "review" && (
          <div className="space-y-4">
            {summary.length > 0 && (
              <div className="space-y-2 rounded-lg bg-secondary p-4 text-sm">
                {summary.map((item) => (
                  <div key={item.label} className="flex justify-between gap-4">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium text-right">{item.value}</span>
                  </div>
                ))}
              </div>
            )}
            {detailGroups.length > 0 && (
              <div className="grid gap-3 md:grid-cols-2">
                {detailGroups.map((group) => (
                  <div key={group.title} className="rounded-lg border bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium">{group.title}</div>
                      {group.kind ? (
                        <Badge
                          variant="outline"
                          className={getToneClasses(group.kind).badge}
                        >
                          {group.kind === "ta"
                            ? "TA"
                            : group.kind === "onchain"
                              ? "On-chain"
                              : "Identity"}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {group.items.map((item) => (
                        <div key={item}>{item}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-sm text-muted-foreground">{current.description}</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleStart}>{startLabel}</Button>
            </div>
          </div>
        )}

        {current.state === "loading" && (
          <LoadingStagePanel
            title={current.title}
            description={current.description}
            items={loadingItems}
            tone={loadingTone}
          />
        )}

        {current.state === "success" && (
          <div className="space-y-4 py-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3>{current.title}</h3>
            <p className="text-sm text-muted-foreground">{current.description}</p>
            <div className="flex justify-center">
              <Button onClick={handleComplete}>{completionLabel}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
