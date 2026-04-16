import { Check } from "lucide-react";
import { cn } from "./ui/utils";

export interface WorkflowStep {
  id: string;
  label: string;
  description: string;
  statuses: string[];
}

export const FUND_ISSUANCE_STEPS: WorkflowStep[] = [
  {
    id: "step-1",
    label: "Draft",
    description: "Create draft",
    statuses: ["Draft"],
  },
  {
    id: "step-2",
    label: "Approval",
    description: "Submit for approval",
    statuses: ["Pending Approval", "Pending Listing"],
  },
  {
    id: "step-3",
    label: "Listing",
    description: "Prepare listing",
    statuses: ["Upcoming", "Upcoming Launch"],
  },
  {
    id: "step-4",
    label: "Subscription",
    description: "Open for subscription",
    statuses: ["Open For Subscription", "Initial Subscription"],
  },
  {
    id: "step-5",
    label: "Allocation",
    description: "Allocation period",
    statuses: ["Allocation Period", "Calculated"],
  },
  {
    id: "step-6",
    label: "On-chain",
    description: "On-chain allocation",
    statuses: ["Allocate On Chain", "Allocation Completed"],
  },
  {
    id: "step-7",
    label: "Completed",
    description: "Issuance complete",
    statuses: ["Issuance Completed"],
  },
  {
    id: "step-8",
    label: "Active",
    description: "Fund active",
    statuses: ["Issuance Active", "Active Dealing", "Paused"],
  },
];

export const FUND_REDEMPTION_STEPS: WorkflowStep[] = [
  {
    id: "step-1",
    label: "Draft",
    description: "Create draft",
    statuses: ["Draft"],
  },
  {
    id: "step-2",
    label: "Approval",
    description: "Submit for approval",
    statuses: ["Pending Approval", "Pending Listing"],
  },
  {
    id: "step-3",
    label: "Listing",
    description: "Prepare listing",
    statuses: ["Upcoming", "Announced"],
  },
  {
    id: "step-4",
    label: "Open",
    description: "Open for redemption",
    statuses: ["Open For Redemption", "Active", "Window Open", "Paused"],
  },
  {
    id: "step-5",
    label: "Completed",
    description: "Redemption done",
    statuses: ["Done", "Window Closed"],
  },
];

export const FUND_DISTRIBUTION_STEPS: WorkflowStep[] = [
  {
    id: "step-1",
    label: "Draft",
    description: "Create draft",
    statuses: ["Draft"],
  },
  {
    id: "step-2",
    label: "Approval",
    description: "Submit for approval",
    statuses: ["Pending Listing"],
  },
  {
    id: "step-3",
    label: "Listing",
    description: "Prepare listing",
    statuses: ["Upcoming"],
  },
  {
    id: "step-4",
    label: "Snapshot",
    description: "Record ownership",
    statuses: ["Pending Allocation"],
  },
  {
    id: "step-5",
    label: "On-chain",
    description: "Put on chain",
    statuses: ["Put On Chain"],
  },
  {
    id: "step-6",
    label: "Open",
    description: "Open for distribution",
    statuses: ["Open For Distribution"],
  },
  {
    id: "step-7",
    label: "Completed",
    description: "Distribution done",
    statuses: ["Done"],
  },
];

type WorkflowType = "issuance" | "redemption" | "distribution";

interface FundWorkflowProps {
  currentStatus?: string;
  variant?: "full" | "compact";
  type?: WorkflowType;
}

function getWorkflowConfig(type: WorkflowType) {
  switch (type) {
    case "redemption":
      return {
        steps: FUND_REDEMPTION_STEPS,
        title: "Fund Redemption Workflow",
        description: "Track the redemption process from creation to completion",
      };
    case "distribution":
      return {
        steps: FUND_DISTRIBUTION_STEPS,
        title: "Fund Distribution Workflow",
        description: "Track the distribution process from creation to completion",
      };
    case "issuance":
    default:
      return {
        steps: FUND_ISSUANCE_STEPS,
        title: "Fund Issuance Workflow",
        description: "Track your fund from creation to activation through the complete lifecycle",
      };
  }
}

interface FundIssuanceWorkflowProps {
  currentStatus?: string;
  variant?: "full" | "compact";
}

export function FundIssuanceWorkflow({
  currentStatus,
  variant = "full",
}: FundIssuanceWorkflowProps) {
  return (
    <FundWorkflow
      currentStatus={currentStatus}
      variant={variant}
      type="issuance"
    />
  );
}

export function FundRedemptionWorkflow({
  currentStatus,
  variant = "full",
}: FundIssuanceWorkflowProps) {
  return (
    <FundWorkflow
      currentStatus={currentStatus}
      variant={variant}
      type="redemption"
    />
  );
}

export function FundDistributionWorkflow({
  currentStatus,
  variant = "full",
}: FundIssuanceWorkflowProps) {
  return (
    <FundWorkflow
      currentStatus={currentStatus}
      variant={variant}
      type="distribution"
    />
  );
}

function FundWorkflow({
  currentStatus,
  variant = "full",
  type = "issuance",
}: FundWorkflowProps) {
  const config = getWorkflowConfig(type);
  const steps = config.steps;

  // Find the current step index based on status
  const currentStepIndex = currentStatus
    ? steps.findIndex((step) => step.statuses.includes(currentStatus))
    : -1;

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-1">
        {steps.map((step, index) => {
          const isCompleted = currentStepIndex > index;
          const isCurrent = currentStepIndex === index;

          return (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors",
                  isCompleted &&
                    "bg-green-500 text-white",
                  isCurrent &&
                    "bg-blue-500 text-white ring-2 ring-blue-200",
                  !isCompleted &&
                    !isCurrent &&
                    "bg-gray-200 text-gray-500"
                )}
                title={`${step.label} - ${step.description}`}
              >
                {isCompleted ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "w-2 h-0.5 transition-colors",
                    isCompleted ? "bg-green-500" : "bg-gray-200"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  const gridColsClass =
    steps.length === 5 ? "grid-cols-5" :
    steps.length === 6 ? "grid-cols-6" :
    steps.length === 7 ? "grid-cols-7" :
    steps.length === 8 ? "grid-cols-8" :
    `grid-cols-${steps.length}`;

  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="mb-6">
        <h3 className="font-semibold text-lg">{config.title}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {config.description}
        </p>
      </div>

      <div className="relative">
        {/* Progress line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{
              width: `${
                currentStepIndex >= 0
                  ? ((currentStepIndex + 1) / steps.length) * 100
                  : 0
              }%`,
            }}
          />
        </div>

        {/* Steps */}
        <div className={cn("relative grid gap-2", gridColsClass)}>
          {steps.map((step, index) => {
            const isCompleted = currentStepIndex > index;
            const isCurrent = currentStepIndex === index;
            const isPending = currentStepIndex < index;

            return (
              <div key={step.id} className="flex flex-col items-center">
                {/* Step circle */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 relative z-10",
                    isCompleted &&
                      "bg-green-500 text-white shadow-md",
                    isCurrent &&
                      "bg-blue-500 text-white ring-4 ring-blue-100 shadow-lg scale-110",
                    isPending &&
                      "bg-white border-2 border-gray-300 text-gray-400"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm">{index + 1}</span>
                  )}
                </div>

                {/* Step label */}
                <div className="mt-3 text-center">
                  <div
                    className={cn(
                      "text-xs font-medium leading-tight",
                      isCurrent && "text-blue-600",
                      isCompleted && "text-green-600",
                      isPending && "text-gray-400"
                    )}
                  >
                    {step.label}
                  </div>
                  <div
                    className={cn(
                      "text-xs text-muted-foreground mt-0.5",
                      isCurrent && "text-blue-500",
                      isCompleted && "text-green-500"
                    )}
                  >
                    {step.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current status indicator */}
      {currentStatus && currentStepIndex >= 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-blue-900">
                Current Progress: Step {currentStepIndex + 1} of {steps.length}
              </div>
              <div className="text-xs text-blue-600 mt-0.5">
                {steps[currentStepIndex].label} -{" "}
                {steps[currentStepIndex].description}
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(
                ((currentStepIndex + 1) / steps.length) * 100
              )}
              %
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
