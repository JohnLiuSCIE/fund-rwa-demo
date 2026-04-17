import { useEffect, useState } from "react";
import { AlertCircle, Check } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";

export interface ActionModalStep {
  label: string;
  title: string;
  description: string;
  state: "review" | "loading" | "success";
}

interface SummaryItem {
  label: string;
  value: string;
}

interface OperationActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  title: string;
  description: string;
  steps: ActionModalStep[];
  summary?: SummaryItem[];
  startLabel?: string;
  completionLabel?: string;
  autoAdvanceMs?: number;
}

function ProgressSteps({
  currentStep,
  steps,
}: {
  currentStep: number;
  steps: string[];
}) {
  return (
    <div className="mb-8 flex items-center justify-between">
      {steps.map((step, index) => (
        <div key={index} className="flex flex-1 items-center">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                index < currentStep
                  ? "border-primary bg-primary text-primary-foreground"
                  : index === currentStep
                    ? "border-primary text-primary"
                    : "border-gray-300 text-gray-400"
              }`}
            >
              {index < currentStep ? <Check className="h-5 w-5" /> : <span>{index + 1}</span>}
            </div>
            <div className="mt-2 max-w-20 text-center text-xs">{step}</div>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`mx-2 h-0.5 flex-1 transition-colors ${
                index < currentStep ? "bg-primary" : "bg-gray-300"
              }`}
            />
          )}
        </div>
      ))}
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
  startLabel = "Start",
  completionLabel = "Done",
  autoAdvanceMs = 1400,
}: OperationActionModalProps) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const isLastStep = step === steps.length - 1;

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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <ProgressSteps currentStep={step} steps={steps.map((item) => item.label)} />

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
          <div className="space-y-4 py-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
            <h3>{current.title}</h3>
            <p className="text-sm text-muted-foreground">{current.description}</p>
          </div>
        )}

        {current.state === "success" && (
          <div className="space-y-4 py-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              {title.toLowerCase().includes("identity") ? (
                <Check className="h-8 w-8 text-green-600" />
              ) : (
                <AlertCircle className="h-8 w-8 text-green-600" />
              )}
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
