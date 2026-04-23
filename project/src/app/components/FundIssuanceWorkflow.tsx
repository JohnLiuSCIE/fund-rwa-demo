import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "./ui/utils";

export interface WorkflowStep {
  id: string;
  label: string;
  description: string;
  owner?: string;
}

export interface WorkflowStepTiming {
  planned?: string;
  actual?: string;
}

type IssuanceFundType = "Open-end" | "Closed-end";

const CLOSED_END_ISSUANCE_STEPS: WorkflowStep[] = [
  {
    id: "step-1",
    label: "Listing",
    description: "Prepare listing",
    owner: "Maker / Checker",
  },
  {
    id: "step-2",
    label: "Subscription",
    description: "Open for subscription",
    owner: "Investor / Maker",
  },
  {
    id: "step-3",
    label: "Allocation",
    description: "Allocation period",
    owner: "Maker / TA",
  },
  {
    id: "step-4",
    label: "On-chain Issuance",
    description: "Issue allocations on-chain",
    owner: "TA / System",
  },
  {
    id: "step-5",
    label: "Completed",
    description: "Issuance complete",
    owner: "TA / System",
  },
];

const OPEN_END_ISSUANCE_STEPS: WorkflowStep[] = [
  {
    id: "step-1",
    label: "Module Launch",
    description: "Approve and configure launch module",
    owner: "Maker / Checker",
  },
  {
    id: "step-2",
    label: "First Cycle",
    description: "Open and collect launch-cycle orders",
    owner: "Investor / TA",
  },
  {
    id: "step-3",
    label: "Recurring Dealing",
    description: "Operate standing module and daily cycles",
    owner: "TA / System",
  },
];

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
    "Pending NAV": 2,
    "Pending Confirmation": 2,
    Confirmed: 2,
    "Pending Cash Settlement": 2,
    Completed: 2,
  },
};

const ISSUANCE_STEPS_BY_FUND_TYPE: Record<IssuanceFundType, WorkflowStep[]> = {
  "Closed-end": CLOSED_END_ISSUANCE_STEPS,
  "Open-end": OPEN_END_ISSUANCE_STEPS,
};

export const FUND_REDEMPTION_STEPS: WorkflowStep[] = [
  {
    id: "step-1",
    label: "Setup",
    description: "Create and approve event",
    owner: "Maker / Checker",
  },
  {
    id: "step-2",
    label: "Notice",
    description: "Announce or activate module",
    owner: "Maker / TA",
  },
  {
    id: "step-3",
    label: "Window",
    description: "Operate participation window",
    owner: "Investor / TA",
  },
  {
    id: "step-4",
    label: "Settlement",
    description: "Snapshot, payment list, and burn",
    owner: "TA / System",
  },
  {
    id: "step-5",
    label: "Completed",
    description: "Close and reconcile event",
    owner: "TA",
  },
];

const STATUS_TO_REDEMPTION_STEP: Record<string, number> = {
  Draft: 0,
  "Pending Approval": 0,
  Active: 1,
  Announced: 1,
  "Window Open": 2,
  Paused: 2,
  "Snapshot Locked": 3,
  "Payment List Ready": 3,
  "Burn On Chain": 3,
  "Window Closed": 4,
};

const OPEN_END_REDEMPTION_STEPS: WorkflowStep[] = [
  {
    id: "step-1",
    label: "Module Setup",
    description: "Create recurring redemption module",
    owner: "Maker",
  },
  {
    id: "step-2",
    label: "Approval",
    description: "Authorize module",
    owner: "Checker",
  },
  {
    id: "step-3",
    label: "Operating",
    description: "Run current dealing cycle",
    owner: "Investor / TA",
  },
  {
    id: "step-4",
    label: "Close-out",
    description: "Settle and archive current cycle",
    owner: "TA / System",
  },
];

const STATUS_TO_OPEN_END_REDEMPTION_STEP: Record<string, number> = {
  Draft: 0,
  "Pending Approval": 1,
  Active: 2,
  Announced: 2,
  "Window Open": 2,
  Paused: 2,
  "Snapshot Locked": 3,
  "Payment List Ready": 3,
  "Burn On Chain": 3,
  "Window Closed": 3,
};

export const FUND_DISTRIBUTION_STEPS: WorkflowStep[] = [
  {
    id: "step-1",
    label: "Draft & Approval",
    description: "Create and authorize event",
    owner: "Maker / Checker",
  },
  {
    id: "step-2",
    label: "Notice",
    description: "Publish record-date notice",
    owner: "Maker",
  },
  {
    id: "step-3",
    label: "Snapshot & Entitlement",
    description: "Lock snapshot and prepare recipient file",
    owner: "TA",
  },
  {
    id: "step-4",
    label: "Release",
    description: "Prepare and open payout",
    owner: "TA / System",
  },
  {
    id: "step-5",
    label: "Completed",
    description: "Reconcile and close event",
    owner: "TA",
  },
];

const STATUS_TO_DISTRIBUTION_STEP: Record<string, number> = {
  Draft: 0,
  "Pending Approval": 0,
  "Pending Listing": 1,
  Upcoming: 1,
  "Snapshot Locked": 2,
  "Pending Allocation": 2,
  "Put On Chain": 3,
  "Open For Distribution": 3,
  Reconciled: 4,
  Done: 4,
};

const OPEN_END_DISTRIBUTION_STEPS: WorkflowStep[] = [
  {
    id: "step-1",
    label: "Module Setup",
    description: "Approve standing distribution module",
    owner: "Maker / Checker",
  },
  {
    id: "step-2",
    label: "Cycle Setup",
    description: "Configure current record-date cycle",
    owner: "Maker / TA",
  },
  {
    id: "step-3",
    label: "Snapshot & Entitlement",
    description: "Freeze cycle snapshot and recipient list",
    owner: "TA",
  },
  {
    id: "step-4",
    label: "Release",
    description: "Prepare and open payout",
    owner: "TA / System",
  },
  {
    id: "step-5",
    label: "Cycle Closed",
    description: "Reconcile and archive current cycle",
    owner: "TA / System",
  },
];

const STATUS_TO_OPEN_END_DISTRIBUTION_STEP: Record<string, number> = {
  Draft: 0,
  "Pending Approval": 0,
  "Pending Listing": 1,
  Upcoming: 1,
  "Snapshot Locked": 2,
  "Pending Allocation": 2,
  "Put On Chain": 3,
  "Open For Distribution": 3,
  Reconciled: 4,
  Done: 4,
};

type WorkflowType = "issuance" | "redemption" | "distribution";
type WorkflowModel = "default" | "open-end";

interface WorkflowSubstep {
  label: string;
  description: string;
  owner: string;
  artifacts?: string[];
}

interface WorkflowSubstepConfig {
  title: string;
  description: string;
  steps: WorkflowSubstep[];
  currentIndex: number;
}

function stage(
  label: string,
  description: string,
  owner: string,
  artifacts: string[] = [],
): WorkflowSubstep {
  return { label, description, owner, artifacts };
}

interface FundWorkflowProps {
  currentStatus?: string;
  variant?: "full" | "compact";
  type?: WorkflowType;
  fundType?: IssuanceFundType;
  stepTimings?: WorkflowStepTiming[];
  actionSlot?: ReactNode;
  actionPanel?: ReactNode;
  workflowModel?: WorkflowModel;
  distributionLabel?: "Distribution" | "Dividend";
}

function getWorkflowConfig(
  type: WorkflowType,
  fundType: IssuanceFundType,
  workflowModel: WorkflowModel,
  distributionLabel: "Distribution" | "Dividend",
) {
  switch (type) {
    case "redemption":
      if (workflowModel === "open-end") {
        return {
          steps: OPEN_END_REDEMPTION_STEPS,
          statusToStepMap: STATUS_TO_OPEN_END_REDEMPTION_STEP,
          title: "Open-end Redemption Module",
          description: "Track module approval first, then follow the current redemption cycle through operation and close-out.",
        };
      }
      return {
        steps: FUND_REDEMPTION_STEPS,
        statusToStepMap: STATUS_TO_REDEMPTION_STEP,
        title: "Fund Redemption Workflow",
        description: "Track the redemption process from creation to completion",
      };
    case "distribution":
      if (workflowModel === "open-end") {
        return {
          steps: OPEN_END_DISTRIBUTION_STEPS,
          statusToStepMap: STATUS_TO_OPEN_END_DISTRIBUTION_STEP,
          title: "Open-end Distribution Module",
          description: "Track the standing distribution module and the currently active payout cycle without mixing it into the fund's main lifecycle.",
        };
      }
      return {
        steps: FUND_DISTRIBUTION_STEPS,
        statusToStepMap: STATUS_TO_DISTRIBUTION_STEP,
        title: `Fund ${distributionLabel} Workflow`,
        description: `Track the ${distributionLabel.toLowerCase()} process from creation to completion`,
      };
    case "issuance":
    default:
      return {
        steps: ISSUANCE_STEPS_BY_FUND_TYPE[fundType],
        statusToStepMap: STATUS_TO_ISSUANCE_STEP_BY_FUND_TYPE[fundType],
        title:
          fundType === "Open-end" ? "Open-end Issuance Module" : "Fund Issuance Workflow",
        description:
          fundType === "Open-end"
            ? "Track module launch first, then the first subscription cycle, before the fund moves into recurring dealing."
            : "Track your fund from creation to activation through the complete lifecycle",
      };
  }
}

interface FundIssuanceWorkflowProps {
  currentStatus?: string;
  variant?: "full" | "compact";
  fundType?: IssuanceFundType;
  stepTimings?: WorkflowStepTiming[];
  actionSlot?: ReactNode;
  actionPanel?: ReactNode;
  workflowModel?: WorkflowModel;
  distributionLabel?: "Distribution" | "Dividend";
}

function getOpenEndSubsteps(currentStatus?: string) {
  switch (currentStatus) {
    case "Draft":
    case "Pending Approval":
    case "Pending Listing":
    case "Upcoming Launch":
      return {
        title: "Step 1 Breakdown",
        description: "Module launch moves through draft, checker approval, and first-cycle readiness before the initial window opens.",
        steps: [
          stage("1.1 Draft", "Create the issuance module", "Maker", [
            "Fund terms",
            "Token setup",
            "Dealing rule pack",
          ]),
          stage("1.2 Approval", "Checker reviews module launch", "Checker", [
            "Approval memo",
            "Launch checklist",
          ]),
          stage("1.3 Launch Ready", "Configure the first dealing cycle", "Maker", [
            "Launch cycle calendar",
            "Investor access rules",
          ]),
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
        description: "The first cycle opens the launch window and collects the initial dealing orders.",
        steps: [
          stage("2.1 Open Window", "Activate the first dealing window", "Maker", [
            "Subscription notice",
            "Launch window parameters",
          ]),
          stage("2.2 Accept Orders", "Collect first-cycle subscriptions", "Investor / TA", [
            "Cycle order book",
            "Investor onboarding pack",
            "Initial holder register draft",
          ]),
        ],
        currentIndex: 1,
      };
    case "Active Dealing":
    case "Paused":
      return {
        title: "Step 3 Breakdown",
        description: "After launch, the standing module stays active while dealing cycles recur and can be paused or resumed.",
        steps: [
          stage("3.1 Active", "Run recurring dealing cycles", "TA / System", [
            "Current dealing batch",
            "NAV confirmation file",
            "Register delta file",
          ]),
          stage("3.2 Pause Control", "Pause or resume the standing module", "Maker", [
            "Operating control log",
            "Pause / resume approval",
          ]),
        ],
        currentIndex: currentStatus === "Paused" ? 1 : 0,
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
          stage("1.1 Draft", "Create issuance draft", "Maker", [
            "Issuance term sheet",
            "Subscription window setup",
          ]),
          stage("1.2 Approval", "Checker reviews issuance draft", "Checker", [
            "Approval packet",
            "Investor rule pack",
          ]),
          stage("1.3 Listing Prep", "Prepare listing", "Maker", [
            "Listing readiness checklist",
            "Offering summary",
          ]),
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
          stage("2.1 Upcoming", "Await opening", "Maker", [
            "Subscription notice",
            "Public notice timetable",
          ]),
          stage("2.2 Open", "Accept subscriptions", "Investor / System", [
            "Subscription order book",
            "Eligibility review pack",
            "Pre-allocation register draft",
          ]),
        ],
        currentIndex: currentStatus === "Upcoming" ? 0 : 1,
      };
    case "Allocation Period":
    case "Calculated":
      return {
        title: "Step 3 Breakdown",
        description: "Allocation starts after subscription closes and ends with calculation.",
        steps: [
          stage("3.1 Close Book", "Close subscription", "Maker / System", [
            "Final subscription book",
            "Investor acceptance list",
            "Closed subscription gate",
          ]),
          stage("3.2 Allocation", "Run allocation period", "Maker / TA", [
            "Allocation workbook",
            "Cap table draft",
          ]),
          stage("3.3 Calculated", "Finalize result", "TA", [
            "Final allocation file",
            "Register delta approval",
          ]),
        ],
        currentIndex: currentStatus === "Allocation Period" ? 1 : 2,
      };
    case "Allocate On Chain":
    case "Allocation Completed":
      return {
        title: "Step 4 Breakdown",
        description: "Move allocation on chain, then confirm execution completion.",
        steps: [
          stage("4.1 On-chain", "Execute issuance", "TA / System", [
            "Mint instruction file",
            "Wallet allocation list",
          ]),
          stage("4.2 Completed", "Confirm allocation", "TA", [
            "Booked holder register",
            "Issuance execution confirmation",
          ]),
        ],
        currentIndex: currentStatus === "Allocate On Chain" ? 0 : 1,
      };
    case "Issuance Completed":
    case "Issuance Active":
      return {
        title: "Step 5 Breakdown",
        description: "Completion is explicit: issuance completion first, then fund activation.",
        steps: [
          stage("5.1 Issuance Done", "Close issuance workflow", "TA", [
            "Initial holder register baseline",
            "TA close-out memo",
          ]),
          stage("5.2 Fund Active", "Activate fund", "Maker / System", [
            "Active fund ledger baseline",
            "Post-issuance operating handoff",
          ]),
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
    case "Pending Approval":
      return {
        title: "Step 1 Breakdown",
        description: "Draft and approval sit together as the event setup stage.",
        steps: [
          stage("1.1 Draft", "Create redemption setup", "Maker", [
            "Redemption event terms",
            "Participation limits",
          ]),
          stage("1.2 Approval", "Checker reviews redemption setup", "Checker", [
            "Approval request",
            "Liquidity event memo",
          ]),
        ],
        currentIndex: currentStatus === "Draft" ? 0 : 1,
      };
    case "Announced":
    case "Active":
      return {
        title: "Step 2 Breakdown",
        description: "After approval, the event is either announced or activated for the operating window.",
        steps: [
          stage("2.1 Activate", "Turn setup on", "Maker", [
            "Settlement account setup",
            "Window activation record",
          ]),
          stage("2.2 Notice", "Run notice period", "System / Investor", [
            "Investor notice",
            "Record-date communication",
          ]),
        ],
        currentIndex: currentStatus === "Active" ? 0 : 1,
      };
    case "Window Open":
    case "Paused":
      return {
        title: "Step 3 Breakdown",
        description: "Operate the redemption window and pause/resume when needed.",
        steps: [
          stage("3.1 Open", "Accept redemption requests", "Investor / TA", [
            "Participation order book",
            "Holder validation file",
            "Snapshot lock instruction",
          ]),
          stage("3.2 Pause", "Temporarily halt", "Maker", [
            "Pause control log",
            "Window halt record",
          ]),
        ],
        currentIndex: currentStatus === "Paused" ? 1 : 0,
      };
    case "Snapshot Locked":
    case "Payment List Ready":
    case "Burn On Chain":
      return {
        title: "Step 4 Breakdown",
        description:
          "Close-out moves through TA snapshot control, payment-list preparation, and the on-chain burn leg.",
        steps: [
          stage("4.1 Snapshot", "Lock holder snapshot", "TA", [
            "Locked holder snapshot",
            "Accepted unit ledger",
          ]),
          stage("4.2 Payment List", "Prepare redemption payment list", "TA", [
            "Redemption payment file",
            "Funding confirmation pack",
          ]),
          stage("4.3 Burn On Chain", "Execute unit burn leg", "TA / System", [
            "On-chain burn instruction",
            "Register delta confirmation",
          ]),
        ],
        currentIndex:
          currentStatus === "Snapshot Locked"
            ? 0
            : currentStatus === "Payment List Ready"
              ? 1
              : 2,
      };
    case "Window Closed":
      return {
        title: "Step 5 Breakdown",
        description:
          "Close the operating window after redemption processing and reconciliation are finished.",
        steps: [
          stage("5.1 Close Window", "Stop new requests", "TA", [
            "Released payment list",
            "Burn confirmation",
          ]),
          stage("5.2 Complete", "Wrap up setup cycle", "TA", [
            "Funding confirmation",
            "Cash and units reconciliation",
          ]),
        ],
        currentIndex: 1,
      };
    default:
      return null;
  }
}

function getOpenEndRedemptionSubsteps(currentStatus?: string) {
  switch (currentStatus) {
    case "Draft":
    case "Pending Approval":
      return {
        title: "Step 1-2 Breakdown",
        description: "Open-end redemption begins with module setup and checker approval before any cycle can run.",
        steps: [
          stage("1.1 Setup", "Create redemption module", "Maker", [
            "Redemption module setup",
            "Gate configuration",
          ]),
          stage("2.1 Approval", "Authorize module launch", "Checker", [
            "Approval request",
            "Liquidity control memo",
          ]),
        ],
        currentIndex: currentStatus === "Draft" ? 0 : 1,
      };
    case "Active":
    case "Announced":
    case "Window Open":
    case "Paused":
      return {
        title: "Step 3 Breakdown",
        description:
          "Once active, the module runs daily-dealing or window-based redemption operations and can then be handed into close-out.",
        steps: [
          stage("3.1 Activate", "Enable redemption module", "Maker", [
            "Module activation log",
            "Operating calendar",
          ]),
          stage("3.2 Operate", "Run the current redemption cycle", "Investor / TA", [
            "Current-cycle request file",
            "Holdings validation",
            "Register update file",
          ]),
          stage("3.3 Close-out", "Close the current redemption cycle", "Maker / TA", [
            "Cycle cut-off record",
            "Cycle completion confirmation",
          ]),
        ],
        currentIndex: 1,
      };
    case "Snapshot Locked":
    case "Payment List Ready":
    case "Burn On Chain":
    case "Window Closed":
      return {
        title: "Step 4 Breakdown",
        description:
          "Close-out covers register lock, payment-file preparation, and final cycle reconciliation.",
        steps: [
          stage("4.1 Snapshot", "Lock accepted dealing batch", "TA", [
            "Register cut-off",
            "Accepted dealing roster",
          ]),
          stage("4.2 Payment Prep", "Prepare settlement and burn instructions", "TA / System", [
            "Payment file",
            "Burn instruction",
          ]),
          stage("4.3 Close Cycle", "Finalize current dealing cycle", "TA / System", [
            "Cycle completion confirmation",
            "Reconciliation memo",
          ]),
        ],
        currentIndex:
          currentStatus === "Snapshot Locked"
            ? 0
            : currentStatus === "Payment List Ready" || currentStatus === "Burn On Chain"
              ? 1
              : 2,
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
        title: "Step 1 Breakdown",
        description: "Draft and approval sit together as the event setup stage.",
        steps: [
          stage("1.1 Draft", "Create distribution draft", "Maker", [
            "Dividend terms",
            "Record and payment dates",
          ]),
          stage("1.2 Approval", "Approve distribution", "Checker", [
            "Approved dividend memo",
          ]),
        ],
        currentIndex: currentStatus === "Draft" ? 0 : 1,
      };
    case "Pending Listing":
    case "Upcoming":
      return {
        title: "Step 2 Breakdown",
        description: "Publish the event notice and wait for the record-date cycle to begin.",
        steps: [
          stage("2.1 Notice", "Prepare distribution notice", "Maker", [
            "Record-date notice",
            "Payment timetable",
          ]),
          stage("2.2 Upcoming", "Await record date", "System / TA", [
            "Upcoming record date",
            "TA operating calendar",
          ]),
        ],
        currentIndex: currentStatus === "Pending Listing" ? 0 : 1,
      };
    case "Snapshot Locked":
    case "Pending Allocation":
      return {
        title: "Step 3 Breakdown",
        description: "The transfer agent locks the holder snapshot and prepares the recipient entitlement file.",
        steps: [
          stage("3.1 Snapshot Locked", "Freeze holder list", "TA", [
            "Record-date snapshot",
            "Dividend entitlement base",
          ]),
          stage("3.2 Recipient List", "Prepare payout batch", "TA", [
            "Recipient list",
            "Funding request file",
          ]),
        ],
        currentIndex: currentStatus === "Snapshot Locked" ? 0 : 1,
      };
    case "Put On Chain":
    case "Open For Distribution":
      return {
        title: "Step 4 Breakdown",
        description:
          "Prepare the release package and then move the payout into the on-chain/open state.",
        steps: [
          stage("4.1 Prepare", "Review payout data", "TA", [
            "Approved payout file",
            "Funding confirmation",
          ]),
          stage("4.2 Release", "Execute payout setup", "TA / System", [
            "On-chain payout instruction",
          ]),
        ],
        currentIndex: currentStatus === "Put On Chain" ? 0 : 1,
      };
    case "Reconciled":
    case "Done":
      return {
        title: "Step 5 Breakdown",
        description: "Reconcile the payout event and close the distribution cycle.",
        steps: [
          stage("5.1 Reconcile", "Confirm payout completion", "TA", [
            "Payout reconciliation report",
          ]),
          stage("5.2 Done", "Close distribution cycle", "TA", [
            "Closed dividend event record",
          ]),
        ],
        currentIndex: currentStatus === "Reconciled" ? 0 : 1,
      };
    default:
      return null;
  }
}

function getOpenEndDistributionSubsteps(currentStatus?: string) {
  switch (currentStatus) {
    case "Draft":
    case "Pending Approval":
      return {
        title: "Step 1 Breakdown",
        description: "Open-end distribution starts by approving the standing module before a current payout cycle is configured.",
        steps: [
          stage("1.1 Draft", "Create distribution module", "Maker", [
            "Distribution policy",
            "Payout assumptions",
          ]),
          stage("1.2 Approve", "Authorize distribution module", "Checker", [
            "Approval request",
            "Module governance memo",
          ]),
        ],
        currentIndex: currentStatus === "Draft" ? 0 : 1,
      };
    case "Pending Listing":
    case "Upcoming":
    case "Snapshot Locked":
    case "Pending Allocation":
      return {
        title: "Step 2-3 Breakdown",
        description: "Configure the current payout cycle, reach record date, and lock the entitlement snapshot for this cycle.",
        steps: [
          stage("2.1 Listing Prep", "Configure current payout cycle", "Maker", [
            "Record-date notice",
            "Distribution calendar",
          ]),
          stage("2.2 Record Date", "Reach holder snapshot date", "TA", [
            "Holder register cut-off",
          ]),
          stage("3.3 Snapshot Locked", "Freeze payout base", "TA", [
            "Locked snapshot",
            "Entitlement file",
          ]),
          stage("3.4 Recipient List", "Prepare recipient payout file", "TA", [
            "Recipient list",
            "Funding request",
          ]),
        ],
        currentIndex:
          currentStatus === "Pending Listing"
            ? 0
            : currentStatus === "Upcoming"
              ? 1
              : currentStatus === "Snapshot Locked"
                ? 2
                : 3,
      };
    case "Put On Chain":
    case "Open For Distribution":
      return {
        title: "Step 4 Breakdown",
        description: "Move payout on chain and open the event for claim or transfer execution.",
        steps: [
          stage("4.1 On-chain Prep", "Prepare payout data", "TA", [
            "Recipient list",
            "Funding confirmation",
          ]),
          stage("4.2 Open Payout", "Open claim or auto-transfer", "TA / System", [
            "Released payout instruction",
          ]),
        ],
        currentIndex: currentStatus === "Put On Chain" ? 0 : 1,
      };
    case "Reconciled":
    case "Done":
      return {
        title: "Step 5 Breakdown",
        description: "Reconcile the payout event and close the distribution cycle.",
        steps: [
          stage("5.1 Reconcile", "Confirm payout completion", "TA", [
            "Payout reconciliation",
          ]),
          stage("5.2 Closed", "Archive current cycle", "TA / System", [
            "Closed cycle register",
          ]),
        ],
        currentIndex: currentStatus === "Reconciled" ? 0 : 1,
      };
    default:
      return null;
  }
}

function getWorkflowSubsteps(
  type: WorkflowType,
  fundType: IssuanceFundType,
  workflowModel: WorkflowModel,
  currentStatus?: string,
) {
  if (type === "issuance") {
    return fundType === "Open-end"
      ? getOpenEndSubsteps(currentStatus)
      : getClosedEndSubsteps(currentStatus);
  }
  if (type === "redemption") {
    if (workflowModel === "open-end") {
      return getOpenEndRedemptionSubsteps(currentStatus);
    }
    return getRedemptionSubsteps(currentStatus);
  }
  if (type === "distribution") {
    if (workflowModel === "open-end") {
      return getOpenEndDistributionSubsteps(currentStatus);
    }
    return getDistributionSubsteps(currentStatus);
  }
  return null;
}

export function FundIssuanceWorkflow({
  currentStatus,
  variant = "full",
  fundType = "Closed-end",
  stepTimings,
  actionSlot,
  actionPanel,
  workflowModel = "default",
}: FundIssuanceWorkflowProps) {
  return (
    <FundWorkflow
      currentStatus={currentStatus}
      variant={variant}
      type="issuance"
      fundType={fundType}
      stepTimings={stepTimings}
      actionSlot={actionSlot}
      actionPanel={actionPanel}
      workflowModel={workflowModel}
    />
  );
}

export function FundRedemptionWorkflow({
  currentStatus,
  variant = "full",
  stepTimings,
  actionSlot,
  actionPanel,
  workflowModel = "default",
}: FundIssuanceWorkflowProps) {
  return (
    <FundWorkflow
      currentStatus={currentStatus}
      variant={variant}
      type="redemption"
      stepTimings={stepTimings}
      actionSlot={actionSlot}
      actionPanel={actionPanel}
      workflowModel={workflowModel}
    />
  );
}

export function FundDistributionWorkflow({
  currentStatus,
  variant = "full",
  stepTimings,
  actionSlot,
  actionPanel,
  workflowModel = "default",
  distributionLabel = "Distribution",
}: FundIssuanceWorkflowProps) {
  return (
    <FundWorkflow
      currentStatus={currentStatus}
      variant={variant}
      type="distribution"
      stepTimings={stepTimings}
      actionSlot={actionSlot}
      actionPanel={actionPanel}
      workflowModel={workflowModel}
      distributionLabel={distributionLabel}
    />
  );
}

function FundWorkflow({
  currentStatus,
  variant = "full",
  type = "issuance",
  fundType = "Closed-end",
  stepTimings,
  actionSlot,
  actionPanel,
  workflowModel = "default",
  distributionLabel = "Distribution",
}: FundWorkflowProps) {
  const config = getWorkflowConfig(type, fundType, workflowModel, distributionLabel);
  const steps = config.steps;
  const substepConfig = getWorkflowSubsteps(type, fundType, workflowModel, currentStatus);

  // Find the current step index based on status
  const currentStepIndex = currentStatus
    ? (config.statusToStepMap[currentStatus] ?? -1)
    : -1;
  const currentSubstep = substepConfig?.steps[substepConfig.currentIndex];
  const currentOwner =
    currentSubstep?.owner ||
    (currentStatus && currentStepIndex >= 0 ? steps[currentStepIndex]?.owner : undefined);

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
    steps.length === 3 ? "grid-cols-3" :
    steps.length === 4 ? "grid-cols-4" :
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
            const timing = stepTimings?.[index];
            const resolvedActual = timing?.actual || (isCompleted ? timing?.planned : undefined);
            const hasTiming = Boolean(timing?.planned || resolvedActual);

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
                  {hasTiming && (
                    <div
                      className={cn(
                        "mt-1.5 space-y-0.5 text-[11px]",
                        isCurrent && "text-blue-700",
                        isCompleted && "text-green-700",
                        isPending && "text-slate-500",
                      )}
                    >
                      <div>
                        <span className="font-medium">Target:</span>{" "}
                        <span>{timing?.planned || "Pending"}</span>
                      </div>
                      <div>
                        <span className="font-medium">Actual:</span>{" "}
                        <span>{resolvedActual || "Pending"}</span>
                      </div>
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
              {currentOwner && (
                <div
                  className={cn(
                    "mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
                    currentOwner.toLowerCase().includes("transfer agent") ||
                      currentOwner.toLowerCase().includes("ta")
                      ? "border-teal-200 bg-teal-50 text-teal-700"
                      : "border-blue-200 bg-white text-blue-700",
                  )}
                >
                  Current owner: {currentOwner}
                </div>
              )}
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

              {currentSubstep && (
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <div>
                    <div className="text-xs font-medium text-slate-700">Current sub-stage</div>
                    <div className="mt-1 text-sm font-medium text-foreground">
                      {currentSubstep.label}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {currentSubstep.description}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {actionPanel}

          {actionSlot && <div className="flex justify-end">{actionSlot}</div>}
        </div>
      )}
    </div>
  );
}
