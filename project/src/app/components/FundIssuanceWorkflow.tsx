import type { ReactNode } from "react";
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
    label: "Activation",
    description: "Activate setup",
  },
  {
    id: "step-4",
    label: "Window",
    description: "Operate redemption",
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
  Active: 3,
  Announced: 2,
  "Window Open": 3,
  Paused: 3,
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
  "Pending Listing": 2,
  Upcoming: 3,
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
  actionSlot?: ReactNode;
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
  actionSlot?: ReactNode;
}

function getIssuanceStepStageCounts(fundType: IssuanceFundType) {
  return fundType === "Open-end" ? [3, 2, 2, 3, 2] : [3, 2, 3, 2, 2];
}

function getOpenEndSubsteps(currentStatus?: string) {
  switch (currentStatus) {
    case "Draft":
    case "Pending Approval":
    case "Pending Listing":
    case "Upcoming Launch":
      return {
        title: "Step 1 Breakdown",
        description: "Launch preparation moves through draft, approval, and readiness before the initial window opens.",
        steps: [
          { label: "1.1 Draft", description: "Create the fund setup" },
          { label: "1.2 Approval", description: "Submit and approve launch" },
          { label: "1.3 Launch Ready", description: "Queue the launch window" },
        ],
        currentIndex:
          currentStatus === "Draft"
            ? 0
            : currentStatus === "Pending Approval"
              ? 1
              : 2,
      };
    case "Initial Subscription":
      return {
        title: "Step 2 Breakdown",
        description: "The initial subscription step includes opening the launch window and collecting first subscriptions.",
        steps: [
          { label: "2.1 Open Window", description: "Activate the launch subscription window" },
          { label: "2.2 Accept Orders", description: "Collect initial subscriptions" },
        ],
        currentIndex: 1,
      };
    case "Active Dealing":
    case "Paused":
      return {
        title: "Step 3 Breakdown",
        description: "Daily dealing runs as an active operating stage with pause and resume controls.",
        steps: [
          { label: "3.1 Active", description: "Run daily dealing" },
          { label: "3.2 Pause Control", description: "Pause or resume operations" },
        ],
        currentIndex: currentStatus === "Paused" ? 1 : 0,
      };
    case "Pending NAV":
    case "Pending Confirmation":
    case "Confirmed":
      return {
        title: "Step 4 Breakdown",
        description: "NAV confirmation batches orders through valuation, review, and final confirmation.",
        steps: [
          { label: "4.1 Queue NAV", description: "Move orders into NAV processing" },
          { label: "4.2 Review", description: "Check valuation output" },
          { label: "4.3 Confirmed", description: "Finalize order confirmation" },
        ],
        currentIndex:
          currentStatus === "Pending NAV"
            ? 0
            : currentStatus === "Pending Confirmation"
              ? 1
              : 2,
      };
    case "Pending Cash Settlement":
    case "Completed":
      return {
        title: "Step 5 Breakdown",
        description: "Settlement closes the dealing cycle by moving cash or shares and reconciling completion.",
        steps: [
          { label: "5.1 Settle", description: "Process cash and share settlement" },
          { label: "5.2 Completed", description: "Close the dealing cycle" },
        ],
        currentIndex: currentStatus === "Pending Cash Settlement" ? 0 : 1,
      };
    default:
      return null;
  }
}

function getClosedEndSubsteps(currentStatus?: string) {
  switch (currentStatus) {
    case "Draft":
    case "Pending Approval":
    case "Pending Listing":
      return {
        title: "Step 1 Breakdown",
        description: "Listing preparation unfolds through draft, approval, and listing readiness.",
        steps: [
          { label: "1.1 Draft", description: "Create issuance draft" },
          { label: "1.2 Approval", description: "Submit and approve" },
          { label: "1.3 Listing Prep", description: "Prepare listing" },
        ],
        currentIndex:
          currentStatus === "Draft"
            ? 0
            : currentStatus === "Pending Approval"
              ? 1
              : 2,
      };
    case "Upcoming":
    case "Open For Subscription":
      return {
        title: "Step 2 Breakdown",
        description: "Subscription moves from readiness into the live investor window.",
        steps: [
          { label: "2.1 Upcoming", description: "Await opening" },
          { label: "2.2 Open", description: "Accept subscriptions" },
        ],
        currentIndex: currentStatus === "Upcoming" ? 0 : 1,
      };
    case "Allocation Period":
    case "Calculated":
      return {
        title: "Step 3 Breakdown",
        description: "Allocation starts after subscription closes and ends with calculation.",
        steps: [
          { label: "3.1 Close Book", description: "Close subscription" },
          { label: "3.2 Allocation", description: "Run allocation period" },
          { label: "3.3 Calculated", description: "Finalize result" },
        ],
        currentIndex: currentStatus === "Allocation Period" ? 1 : 2,
      };
    case "Allocate On Chain":
    case "Allocation Completed":
      return {
        title: "Step 4 Breakdown",
        description: "Move allocation on chain, then confirm execution completion.",
        steps: [
          { label: "4.1 On-chain", description: "Execute issuance" },
          { label: "4.2 Completed", description: "Confirm allocation" },
        ],
        currentIndex: currentStatus === "Allocate On Chain" ? 0 : 1,
      };
    case "Issuance Completed":
    case "Issuance Active":
      return {
        title: "Step 5 Breakdown",
        description: "Completion is explicit: issuance completion first, then fund activation.",
        steps: [
          { label: "5.1 Issuance Done", description: "Close issuance workflow" },
          { label: "5.2 Fund Active", description: "Activate fund" },
        ],
        currentIndex: currentStatus === "Issuance Completed" ? 0 : 1,
      };
    default:
      return null;
  }
}

function getRedemptionSubsteps(currentStatus?: string) {
  switch (currentStatus) {
    case "Draft":
      return {
        title: "Step 1 Breakdown",
        description: "Draft the setup and confirm the linked fund configuration.",
        steps: [
          { label: "1.1 Draft", description: "Create redemption setup" },
          { label: "1.2 Validate", description: "Check rules and limits" },
        ],
        currentIndex: 0,
      };
    case "Pending Approval":
      return {
        title: "Step 2 Breakdown",
        description: "Approval is a dedicated gate before redemption can be activated.",
        steps: [
          { label: "2.1 Submit", description: "Send for approval" },
          { label: "2.2 Approve", description: "Authorize setup" },
        ],
        currentIndex: 1,
      };
    case "Announced":
    case "Active":
      return {
        title: "Step 3 Breakdown",
        description: "Approved setups can either open directly or wait for an announcement period.",
        steps: [
          { label: "3.1 Activate", description: "Turn setup on" },
          { label: "3.2 Announce", description: "Optional notice period" },
        ],
        currentIndex: currentStatus === "Announced" ? 1 : 0,
      };
    case "Window Open":
    case "Paused":
      return {
        title: "Step 4 Breakdown",
        description: "Operate the redemption window and pause/resume when needed.",
        steps: [
          { label: "4.1 Open", description: "Accept redemption requests" },
          { label: "4.2 Pause", description: "Temporarily halt" },
        ],
        currentIndex: currentStatus === "Paused" ? 1 : 0,
      };
    case "Window Closed":
      return {
        title: "Step 5 Breakdown",
        description: "Close the operating window after redemption processing is finished.",
        steps: [
          { label: "5.1 Close Window", description: "Stop new requests" },
          { label: "5.2 Complete", description: "Wrap up setup cycle" },
        ],
        currentIndex: 1,
      };
    default:
      return null;
  }
}

function getDistributionSubsteps(currentStatus?: string) {
  switch (currentStatus) {
    case "Draft":
    case "Pending Approval":
      return {
        title: "Steps 1-2 Breakdown",
        description: "Draft and approval sit together as the pre-launch control stage.",
        steps: [
          { label: "1.1 Draft", description: "Create distribution draft" },
          { label: "2.1 Approval", description: "Approve distribution" },
        ],
        currentIndex: currentStatus === "Draft" ? 0 : 1,
      };
    case "Pending Listing":
    case "Upcoming":
      return {
        title: "Steps 3-4 Breakdown",
        description: "Prepare listing, then record ownership before payout processing.",
        steps: [
          { label: "3.1 Listing", description: "Prepare distribution listing" },
          { label: "4.1 Record Date", description: "Record ownership" },
        ],
        currentIndex: currentStatus === "Pending Listing" ? 0 : 1,
      };
    case "Pending Allocation":
      return {
        title: "Step 4 Breakdown",
        description: "Ownership snapshot is being locked before on-chain processing.",
        steps: [
          { label: "4.1 Snapshot", description: "Freeze holder list" },
          { label: "4.2 Pending Allocation", description: "Prepare payout batch" },
        ],
        currentIndex: 1,
      };
    case "Put On Chain":
      return {
        title: "Step 5 Breakdown",
        description: "Push the payout result onto the on-chain distribution step.",
        steps: [
          { label: "5.1 Prepare", description: "Review payout data" },
          { label: "5.2 On-chain", description: "Execute payout setup" },
        ],
        currentIndex: 1,
      };
    case "Open For Distribution":
      return {
        title: "Step 6 Breakdown",
        description: "Distribution is now open for claiming or automated payout execution.",
        steps: [
          { label: "6.1 Open", description: "Open distribution" },
          { label: "6.2 Execute", description: "Process investor payouts" },
        ],
        currentIndex: 1,
      };
    case "Done":
      return {
        title: "Step 7 Breakdown",
        description: "Mark the distribution cycle complete after payout execution finishes.",
        steps: [
          { label: "7.1 Reconcile", description: "Confirm payout completion" },
          { label: "7.2 Done", description: "Close distribution cycle" },
        ],
        currentIndex: 1,
      };
    default:
      return null;
  }
}

function getWorkflowSubsteps(
  type: WorkflowType,
  fundType: IssuanceFundType,
  currentStatus?: string,
) {
  if (type === "issuance") {
    return fundType === "Open-end"
      ? getOpenEndSubsteps(currentStatus)
      : getClosedEndSubsteps(currentStatus);
  }
  if (type === "redemption") {
    return getRedemptionSubsteps(currentStatus);
  }
  if (type === "distribution") {
    return getDistributionSubsteps(currentStatus);
  }
  return null;
}

export function FundIssuanceWorkflow({
  currentStatus,
  variant = "full",
  fundType = "Closed-end",
  actionSlot,
}: FundIssuanceWorkflowProps) {
  return (
    <FundWorkflow
      currentStatus={currentStatus}
      variant={variant}
      type="issuance"
      fundType={fundType}
      actionSlot={actionSlot}
    />
  );
}

export function FundRedemptionWorkflow({
  currentStatus,
  variant = "full",
  actionSlot,
}: FundIssuanceWorkflowProps) {
  return (
    <FundWorkflow
      currentStatus={currentStatus}
      variant={variant}
      type="redemption"
      actionSlot={actionSlot}
    />
  );
}

export function FundDistributionWorkflow({
  currentStatus,
  variant = "full",
  actionSlot,
}: FundIssuanceWorkflowProps) {
  return (
    <FundWorkflow
      currentStatus={currentStatus}
      variant={variant}
      type="distribution"
      actionSlot={actionSlot}
    />
  );
}

function FundWorkflow({
  currentStatus,
  variant = "full",
  type = "issuance",
  fundType = "Closed-end",
  actionSlot,
}: FundWorkflowProps) {
  const config = getWorkflowConfig(type, fundType);
  const steps = config.steps;
  const substepConfig = getWorkflowSubsteps(type, fundType, currentStatus);
  const issuanceStepStageCounts =
    type === "issuance" ? getIssuanceStepStageCounts(fundType) : null;

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
                  {issuanceStepStageCounts && (
                    <div
                      className={cn(
                        "mt-1 text-[11px] font-medium",
                        isCurrent && "text-blue-700",
                        isCompleted && "text-green-700",
                        isPending && "text-slate-500",
                      )}
                    >
                      {issuanceStepStageCounts[index]}{" "}
                      {issuanceStepStageCounts[index] === 1 ? "sub-stage" : "sub-stages"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current status indicator */}
      {currentStatus && currentStepIndex >= 0 && (
        <div className="mt-6 space-y-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
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

          {substepConfig && (
            <div className="space-y-3 rounded-lg border border-blue-100 bg-white/80 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {substepConfig.title}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {substepConfig.description}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <div className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {substepConfig.steps.length} sub-stages
                  </div>
                  <div className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                    Current: {substepConfig.steps[substepConfig.currentIndex]?.label}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {substepConfig.steps.map((step, index) => {
                  const isCompleted = index < substepConfig.currentIndex;
                  const isCurrent = index === substepConfig.currentIndex;
                  return (
                    <div key={`${step.label}-rail`} className="flex items-center gap-2">
                      <div
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                          isCompleted && "border-green-200 bg-green-50 text-green-700",
                          isCurrent && "border-blue-200 bg-blue-50 text-blue-700",
                          !isCompleted && !isCurrent && "border-slate-200 bg-white text-slate-500",
                        )}
                      >
                        {step.label}
                      </div>
                      {index < substepConfig.steps.length - 1 && (
                        <div
                          className={cn(
                            "h-px w-4",
                            index < substepConfig.currentIndex ? "bg-green-300" : "bg-slate-200",
                          )}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {substepConfig.steps.map((step, index) => {
                  const isCompleted = index < substepConfig.currentIndex;
                  const isCurrent = index === substepConfig.currentIndex;
                  return (
                    <div
                      key={step.label}
                      className={cn(
                        "rounded-lg border p-3 transition-colors",
                        isCompleted && "border-green-200 bg-green-50",
                        isCurrent && "border-blue-200 bg-blue-50",
                        !isCompleted && !isCurrent && "bg-white",
                      )}
                    >
                      <div
                        className={cn(
                          "text-sm font-medium",
                          isCompleted && "text-green-700",
                          isCurrent && "text-blue-700",
                        )}
                      >
                        {step.label}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {step.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {actionSlot && <div className="flex justify-end">{actionSlot}</div>}
        </div>
      )}
    </div>
  );
}
