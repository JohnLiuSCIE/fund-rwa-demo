import { Check } from "lucide-react";
import { cn } from "./ui/utils";

export interface WorkflowStep {
  id: string;
  label: string;
  description: string;
}

type IssuanceFundType = "Open-end" | "Closed-end";

const CLOSED_END_ISSUANCE_STEPS: WorkflowStep[] = [
  {
    id: "step-1",
    label: "Listing",
    description: "Prepare listing",
  },
  {
    id: "step-2",
    label: "Subscription",
    description: "Open for subscription",
  },
  {
    id: "step-3",
    label: "Allocation",
    description: "Allocation period",
  },
  {
    id: "step-4",
    label: "On-chain Issuance",
    description: "Issue allocations on-chain",
  },
  {
    id: "step-5",
    label: "Completed",
    description: "Issuance complete",
  },
];

const OPEN_END_ISSUANCE_STEPS: WorkflowStep[] = [
  {
    id: "step-1",
    label: "Launch",
    description: "Prepare launch",
  },
  {
    id: "step-2",
    label: "Initial Subscription",
    description: "Open initial subscription",
  },
  {
    id: "step-3",
    label: "Active Dealing",
    description: "Ongoing dealing operations",
  },
  {
    id: "step-4",
    label: "NAV Confirmation",
    description: "Confirm dealing NAV",
  },
  {
    id: "step-5",
    label: "Settlement",
    description: "Settlement cycle (continuous)",
  },
];

const ISSUANCE_STEPS_BY_FUND_TYPE: Record<IssuanceFundType, WorkflowStep[]> = {
  "Closed-end": CLOSED_END_ISSUANCE_STEPS,
  "Open-end": OPEN_END_ISSUANCE_STEPS,
};

const STATUS_TO_ISSUANCE_STEP_BY_FUND_TYPE: Record<
  IssuanceFundType,
  Record<string, number>
> = {
  "Closed-end": {
    Draft: 0,
    "Pending Approval": 0,
    "Pending Listing": 0,
    Upcoming: 0,
    "Open For Subscription": 1,
    "Allocation Period": 2,
    Calculated: 2,
    "Allocate On Chain": 3,
    "Allocation Completed": 3,
    "Issuance Completed": 4,
    "Issuance Active": 4,
  },
  "Open-end": {
    Draft: 0,
    "Pending Approval": 0,
    "Pending Listing": 0,
    "Upcoming Launch": 0,
    "Initial Subscription": 1,
    "Active Dealing": 2,
    Paused: 2,
    "Pending NAV": 3,
    "Pending Confirmation": 3,
    Confirmed: 3,
    "Pending Cash Settlement": 4,
    Completed: 4,
  },
};

export const FUND_REDEMPTION_STEPS: WorkflowStep[] = [
  {
    id: "step-1",
    label: "Draft",
    description: "Create draft",
  },
  {
    id: "step-2",
    label: "Approval",
    description: "Submit for approval",
  },
  {
    id: "step-3",
    label: "Listing",
    description: "Prepare listing",
  },
  {
    id: "step-4",
    label: "Open",
    description: "Open for redemption",
  },
  {
    id: "step-5",
    label: "Completed",
    description: "Redemption done",
  },
];

const STATUS_TO_REDEMPTION_STEP: Record<string, number> = {
  Draft: 0,
  "Pending Approval": 1,
  "Pending Listing": 1,
  Upcoming: 2,
  Announced: 2,
  "Open For Redemption": 3,
  Active: 3,
  "Window Open": 3,
  Paused: 3,
  Done: 4,
  "Window Closed": 4,
};

export const FUND_DISTRIBUTION_STEPS: WorkflowStep[] = [
  {
    id: "step-1",
    label: "Draft",
    description: "Create draft",
  },
  {
    id: "step-2",
    label: "Approval",
    description: "Submit for approval",
  },
  {
    id: "step-3",
    label: "Listing",
    description: "Prepare listing",
  },
  {
    id: "step-4",
    label: "Snapshot",
    description: "Record ownership",
  },
  {
    id: "step-5",
    label: "On-chain",
    description: "Put on chain",
  },
  {
    id: "step-6",
    label: "Open",
    description: "Open for distribution",
  },
  {
    id: "step-7",
    label: "Completed",
    description: "Distribution done",
  },
];

const STATUS_TO_DISTRIBUTION_STEP: Record<string, number> = {
  Draft: 0,
  "Pending Approval": 1,
  "Pending Listing": 1,
  Upcoming: 2,
  "Pending Allocation": 3,
  "Put On Chain": 4,
  "Open For Distribution": 5,
  Done: 6,
};

type WorkflowType = "issuance" | "redemption" | "distribution";

interface FundWorkflowProps {
  currentStatus?: string;
  variant?: "full" | "compact";
  type?: WorkflowType;
  fundType?: IssuanceFundType;
}

function getWorkflowConfig(type: WorkflowType, fundType: IssuanceFundType) {
  switch (type) {
    case "redemption":
      return {
        steps: FUND_REDEMPTION_STEPS,
        statusToStepMap: STATUS_TO_REDEMPTION_STEP,
        title: "Fund Redemption Workflow",
        description: "Track the redemption process from creation to completion",
      };
    case "distribution":
      return {
        steps: FUND_DISTRIBUTION_STEPS,
        statusToStepMap: STATUS_TO_DISTRIBUTION_STEP,
        title: "Fund Distribution Workflow",
        description: "Track the distribution process from creation to completion",
      };
    case "issuance":
    default:
      return {
        steps: ISSUANCE_STEPS_BY_FUND_TYPE[fundType],
        statusToStepMap: STATUS_TO_ISSUANCE_STEP_BY_FUND_TYPE[fundType],
        title: "Fund Issuance Workflow",
        description: "Track your fund from creation to activation through the complete lifecycle",
      };
  }
}

interface FundIssuanceWorkflowProps {
  currentStatus?: string;
  variant?: "full" | "compact";
  fundType?: IssuanceFundType;
}

export function FundIssuanceWorkflow({
  currentStatus,
  variant = "full",
  fundType = "Closed-end",
}: FundIssuanceWorkflowProps) {
  return (
    <FundWorkflow
      currentStatus={currentStatus}
      variant={variant}
      type="issuance"
      fundType={fundType}
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
  fundType = "Closed-end",
}: FundWorkflowProps) {
  const config = getWorkflowConfig(type, fundType);
  const steps = config.steps;

  // Find the current step index based on status
  const currentStepIndex = currentStatus
    ? (config.statusToStepMap[currentStatus] ?? -1)
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
