import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "./ui/utils";

export interface WorkflowStep {
  id: string;
  label: string;
  description: string;
  owner?: string;
}

type IssuanceFundType = "Open-end" | "Closed-end";

const CLOSED_END_ISSUANCE_STEPS: WorkflowStep[] = [
  {
    id: "step-1",
    label: "Listing",
    description: "Prepare listing",
    owner: "Issuer / Approver",
  },
  {
    id: "step-2",
    label: "Subscription",
    description: "Open for subscription",
    owner: "Investor / Issuer",
  },
  {
    id: "step-3",
    label: "Allocation",
    description: "Allocation period",
    owner: "Issuer / Transfer Agent",
  },
  {
    id: "step-4",
    label: "On-chain Issuance",
    description: "Issue allocations on-chain",
    owner: "Transfer Agent / System",
  },
  {
    id: "step-5",
    label: "Completed",
    description: "Issuance complete",
    owner: "Transfer Agent",
  },
];

const OPEN_END_ISSUANCE_STEPS: WorkflowStep[] = [
  {
    id: "step-1",
    label: "Launch",
    description: "Prepare launch",
    owner: "Issuer / Approver",
  },
  {
    id: "step-2",
    label: "Initial Subscription",
    description: "Open initial subscription",
    owner: "Investor / Transfer Agent",
  },
  {
    id: "step-3",
    label: "Active Dealing",
    description: "Ongoing dealing operations",
    owner: "Transfer Agent / System",
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
    label: "Draft",
    description: "Create draft",
    owner: "Issuer",
  },
  {
    id: "step-2",
    label: "Approval",
    description: "Submit for approval",
    owner: "Issuer / Approver",
  },
  {
    id: "step-3",
    label: "Activation",
    description: "Activate setup",
    owner: "Issuer",
  },
  {
    id: "step-4",
    label: "Window",
    description: "Operate redemption",
    owner: "Investor / Transfer Agent",
  },
  {
    id: "step-5",
    label: "Completed",
    description: "Redemption done",
    owner: "Transfer Agent",
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

const OPEN_END_REDEMPTION_STEPS: WorkflowStep[] = [
  {
    id: "step-1",
    label: "Draft",
    description: "Create setup",
    owner: "Issuer",
  },
  {
    id: "step-2",
    label: "Approval",
    description: "Authorize module",
    owner: "Issuer / Approver",
  },
  {
    id: "step-3",
    label: "Active Module",
    description: "Operate redemption",
    owner: "Transfer Agent / System",
  },
];

const STATUS_TO_OPEN_END_REDEMPTION_STEP: Record<string, number> = {
  Draft: 0,
  "Pending Approval": 1,
  Active: 2,
  Announced: 2,
  "Window Open": 2,
  Paused: 2,
  "Window Closed": 2,
};

export const FUND_DISTRIBUTION_STEPS: WorkflowStep[] = [
  {
    id: "step-1",
    label: "Draft",
    description: "Create event draft",
    owner: "Issuer",
  },
  {
    id: "step-2",
    label: "Approval",
    description: "Submit event for approval",
    owner: "Issuer / Approver",
  },
  {
    id: "step-3",
    label: "Listing",
    description: "Prepare listing",
    owner: "Issuer",
  },
  {
    id: "step-4",
    label: "Snapshot",
    description: "Record ownership",
    owner: "Transfer Agent",
  },
  {
    id: "step-5",
    label: "On-chain",
    description: "Put on chain",
    owner: "Transfer Agent / System",
  },
  {
    id: "step-6",
    label: "Open",
    description: "Open payout",
    owner: "Transfer Agent",
  },
  {
    id: "step-7",
    label: "Completed",
    description: "Payout done",
    owner: "Transfer Agent",
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

const OPEN_END_DISTRIBUTION_STEPS: WorkflowStep[] = [
  {
    id: "step-1",
    label: "Draft",
    description: "Create event draft",
    owner: "Issuer",
  },
  {
    id: "step-2",
    label: "Approval",
    description: "Approve event",
    owner: "Issuer / Approver",
  },
  {
    id: "step-3",
    label: "Record Date",
    description: "Lock holder snapshot",
    owner: "Transfer Agent",
  },
  {
    id: "step-4",
    label: "Payout Processing",
    description: "Prepare and open payout",
    owner: "Transfer Agent / System",
  },
  {
    id: "step-5",
    label: "Completed",
    description: "Close event",
    owner: "Transfer Agent",
  },
];

const STATUS_TO_OPEN_END_DISTRIBUTION_STEP: Record<string, number> = {
  Draft: 0,
  "Pending Approval": 1,
  "Pending Listing": 2,
  Upcoming: 2,
  "Pending Allocation": 2,
  "Put On Chain": 3,
  "Open For Distribution": 3,
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
  actionSlot?: ReactNode;
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
          description: "Track redemption setup approval and module activation under the active fund.",
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
          title: "Open-end Distribution Event",
          description: "Track a point-in-time distribution event without mixing it into the fund's main lifecycle.",
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
  workflowModel?: WorkflowModel;
  distributionLabel?: "Distribution" | "Dividend";
}

function getIssuanceStepStageCounts(fundType: IssuanceFundType) {
  return fundType === "Open-end" ? [3, 2, 2] : [3, 2, 3, 2, 2];
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
          stage("1.1 Draft", "Create the fund setup", "Issuer", [
            "Fund terms",
            "Token setup",
            "Dealing rule pack",
          ]),
          stage("1.2 Approval", "Submit and approve launch", "Issuer / Approver", [
            "Approval memo",
            "Launch checklist",
          ]),
          stage("1.3 Launch Ready", "Queue the launch window", "Issuer", [
            "Launch calendar",
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
        description: "The initial subscription step includes opening the launch window and collecting first subscriptions.",
        steps: [
          stage("2.1 Open Window", "Activate the launch subscription window", "Issuer", [
            "Subscription notice",
            "Launch window parameters",
          ]),
          stage("2.2 Accept Orders", "Collect initial subscriptions", "Investor / Transfer Agent", [
            "Subscription order book",
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
        description: "Daily dealing runs as an active operating stage with pause and resume controls.",
        steps: [
          stage("3.1 Active", "Run daily dealing", "Transfer Agent / System", [
            "Daily dealing batch",
            "NAV confirmation file",
            "Register delta file",
          ]),
          stage("3.2 Pause Control", "Pause or resume operations", "Issuer", [
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
          stage("1.1 Draft", "Create issuance draft", "Issuer", [
            "Issuance term sheet",
            "Subscription window setup",
          ]),
          stage("1.2 Approval", "Submit and approve", "Issuer / Approver", [
            "Approval packet",
            "Investor rule pack",
          ]),
          stage("1.3 Listing Prep", "Prepare listing", "Issuer", [
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
          stage("2.1 Upcoming", "Await opening", "Issuer", [
            "Subscription notice",
            "Investor onboarding queue",
          ]),
          stage("2.2 Open", "Accept subscriptions", "Investor / Issuer", [
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
          stage("3.1 Close Book", "Close subscription", "Issuer", [
            "Final subscription book",
            "Investor acceptance list",
          ]),
          stage("3.2 Allocation", "Run allocation period", "Issuer / Transfer Agent", [
            "Allocation workbook",
            "Cap table draft",
          ]),
          stage("3.3 Calculated", "Finalize result", "Transfer Agent", [
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
          stage("4.1 On-chain", "Execute issuance", "Transfer Agent / System", [
            "Mint instruction file",
            "Wallet allocation list",
          ]),
          stage("4.2 Completed", "Confirm allocation", "Transfer Agent", [
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
          stage("5.1 Issuance Done", "Close issuance workflow", "Transfer Agent", [
            "Initial holder register baseline",
            "TA close-out memo",
          ]),
          stage("5.2 Fund Active", "Activate fund", "Issuer / Transfer Agent", [
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
      return {
        title: "Step 1 Breakdown",
        description: "Draft the setup and confirm the linked fund configuration.",
        steps: [
          stage("1.1 Draft", "Create redemption setup", "Issuer", [
            "Redemption event terms",
            "Participation limits",
          ]),
          stage("1.2 Validate", "Check rules and limits", "Issuer", [
            "Window terms",
            "Eligibility controls",
          ]),
        ],
        currentIndex: 0,
      };
    case "Pending Approval":
      return {
        title: "Step 2 Breakdown",
        description: "Approval is a dedicated gate before redemption can be activated.",
        steps: [
          stage("2.1 Submit", "Send for approval", "Issuer", [
            "Approval request",
            "Liquidity event memo",
          ]),
          stage("2.2 Approve", "Authorize setup", "Issuer / Approver", [
            "Approved redemption setup",
          ]),
        ],
        currentIndex: 1,
      };
    case "Announced":
    case "Active":
      return {
        title: "Step 3 Breakdown",
        description: "Approved setups can either open directly or wait for an announcement period.",
        steps: [
          stage("3.1 Activate", "Turn setup on", "Issuer", [
            "Settlement account setup",
            "Window activation record",
          ]),
          stage("3.2 Announce", "Optional notice period", "Issuer", [
            "Investor notice",
            "Record-date communication",
          ]),
        ],
        currentIndex: currentStatus === "Announced" ? 1 : 0,
      };
    case "Window Open":
    case "Paused":
      return {
        title: "Step 4 Breakdown",
        description: "Operate the redemption window and pause/resume when needed.",
        steps: [
          stage("4.1 Open", "Accept redemption requests", "Investor / Transfer Agent", [
            "Participation order book",
            "Holder validation file",
            "Snapshot lock instruction",
          ]),
          stage("4.2 Pause", "Temporarily halt", "Issuer", [
            "Pause control log",
            "Window halt record",
          ]),
        ],
        currentIndex: currentStatus === "Paused" ? 1 : 0,
      };
    case "Window Closed":
      return {
        title: "Step 5 Breakdown",
        description: "Close the operating window after redemption processing is finished.",
        steps: [
          stage("5.1 Close Window", "Stop new requests", "Transfer Agent", [
            "Locked holder snapshot",
            "Redemption payment list",
          ]),
          stage("5.2 Complete", "Wrap up setup cycle", "Transfer Agent", [
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
      return {
        title: "Step 1 Breakdown",
        description: "Draft the redemption module and align it with the fund's dealing policy.",
        steps: [
          stage("1.1 Draft", "Create redemption setup", "Issuer", [
            "Redemption module setup",
            "Gate configuration",
          ]),
          stage("1.2 Policy Check", "Validate gates and cut-off rules", "Issuer", [
            "Cut-off policy",
            "Settlement policy",
          ]),
        ],
        currentIndex: 0,
      };
    case "Pending Approval":
      return {
        title: "Step 2 Breakdown",
        description: "Approval authorizes the redemption module before investors can use it.",
        steps: [
          stage("2.1 Submit", "Send setup for approval", "Issuer", [
            "Approval request",
            "Liquidity control memo",
          ]),
          stage("2.2 Approve", "Authorize module launch", "Issuer / Approver", [
            "Approved redemption module",
          ]),
        ],
        currentIndex: 1,
      };
    case "Active":
    case "Announced":
    case "Window Open":
    case "Paused":
      return {
        title: "Step 3 Breakdown",
        description:
          "Once active, the module runs daily-dealing or window-based redemption operations and can then be closed into a completed cycle.",
        steps: [
          stage("3.1 Activate", "Enable redemption module", "Issuer", [
            "Module activation log",
            "Operating calendar",
          ]),
          stage("3.2 Operate", "Run windows or daily dealing controls", "Transfer Agent / System", [
            "Redemption batch file",
            "Holdings validation",
            "Register update file",
          ]),
          stage("3.3 Close-out", "Close the current redemption cycle", "Transfer Agent / System", [
            "Window close record",
            "Cycle completion confirmation",
          ]),
        ],
        currentIndex: 1,
      };
    case "Window Closed":
      return {
        title: "Step 3 Breakdown",
        description:
          "The current redemption cycle has been closed and handed off to close-out handling.",
        steps: [
          stage("3.1 Activate", "Enable redemption module", "Issuer", [
            "Module activation log",
            "Operating calendar",
          ]),
          stage("3.2 Operate", "Run windows or daily dealing controls", "Transfer Agent / System", [
            "Redemption batch file",
            "Holdings validation",
            "Register update file",
          ]),
          stage("3.3 Close-out", "Close the current redemption cycle", "Transfer Agent / System", [
            "Window close record",
            "Cycle completion confirmation",
          ]),
        ],
        currentIndex: 2,
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
          stage("1.1 Draft", "Create distribution draft", "Issuer", [
            "Dividend terms",
            "Record and payment dates",
          ]),
          stage("2.1 Approval", "Approve distribution", "Issuer / Approver", [
            "Approved dividend memo",
          ]),
        ],
        currentIndex: currentStatus === "Draft" ? 0 : 1,
      };
    case "Pending Listing":
    case "Upcoming":
      return {
        title: "Steps 3-4 Breakdown",
        description: "Prepare listing, then record ownership before payout processing.",
        steps: [
          stage("3.1 Listing", "Prepare distribution listing", "Issuer", [
            "Record-date notice",
            "Payment timetable",
          ]),
          stage("4.1 Record Date", "Record ownership", "Transfer Agent", [
            "Holder snapshot",
            "Eligible holder list",
          ]),
        ],
        currentIndex: currentStatus === "Pending Listing" ? 0 : 1,
      };
    case "Pending Allocation":
      return {
        title: "Step 4 Breakdown",
        description: "Ownership snapshot is being locked before on-chain processing.",
        steps: [
          stage("4.1 Snapshot", "Freeze holder list", "Transfer Agent", [
            "Record-date snapshot",
            "Dividend entitlement base",
          ]),
          stage("4.2 Pending Allocation", "Prepare payout batch", "Transfer Agent", [
            "Recipient list",
            "Funding request file",
          ]),
        ],
        currentIndex: 1,
      };
    case "Put On Chain":
      return {
        title: "Step 5 Breakdown",
        description: "Push the payout result onto the on-chain distribution step.",
        steps: [
          stage("5.1 Prepare", "Review payout data", "Transfer Agent", [
            "Approved payout file",
            "Funding confirmation",
          ]),
          stage("5.2 On-chain", "Execute payout setup", "Transfer Agent / System", [
            "On-chain payout instruction",
          ]),
        ],
        currentIndex: 1,
      };
    case "Open For Distribution":
      return {
        title: "Step 6 Breakdown",
        description: "Distribution is now open for claiming or automated payout execution.",
        steps: [
          stage("6.1 Open", "Open distribution", "Transfer Agent", [
            "Released payout list",
          ]),
          stage("6.2 Execute", "Process investor payouts", "Transfer Agent / System", [
            "Payment execution file",
          ]),
        ],
        currentIndex: 1,
      };
    case "Done":
      return {
        title: "Step 7 Breakdown",
        description: "Mark the distribution cycle complete after payout execution finishes.",
        steps: [
          stage("7.1 Reconcile", "Confirm payout completion", "Transfer Agent", [
            "Payout reconciliation report",
          ]),
          stage("7.2 Done", "Close distribution cycle", "Transfer Agent", [
            "Closed dividend event record",
          ]),
        ],
        currentIndex: 1,
      };
    default:
      return null;
  }
}

function getOpenEndDistributionSubsteps(currentStatus?: string) {
  switch (currentStatus) {
    case "Draft":
      return {
        title: "Step 1 Breakdown",
        description: "Prepare the distribution event definition and payout assumptions.",
        steps: [
          stage("1.1 Draft", "Create event draft", "Issuer", [
            "Distribution terms",
            "Payout assumptions",
          ]),
          stage("1.2 Validate", "Review payout assumptions", "Issuer", [
            "Treasury route",
            "Record-date parameters",
          ]),
        ],
        currentIndex: 0,
      };
    case "Pending Approval":
      return {
        title: "Step 2 Breakdown",
        description: "Approval is a dedicated gate before record-date preparation starts.",
        steps: [
          stage("2.1 Submit", "Send event for approval", "Issuer", [
            "Approval request",
            "Distribution memo",
          ]),
          stage("2.2 Approve", "Authorize distribution event", "Issuer / Approver", [
            "Approved distribution event",
          ]),
        ],
        currentIndex: 1,
      };
    case "Pending Listing":
    case "Upcoming":
    case "Pending Allocation":
      return {
        title: "Step 3 Breakdown",
        description: "Prepare listing, reach the record date, and lock the holder snapshot.",
        steps: [
          stage("3.1 Listing Prep", "Prepare event listing", "Issuer", [
            "Record-date notice",
            "Distribution calendar",
          ]),
          stage("3.2 Record Date", "Reach holder snapshot date", "Transfer Agent", [
            "Holder register cut-off",
          ]),
          stage("3.3 Snapshot Locked", "Freeze payout base", "Transfer Agent", [
            "Locked snapshot",
            "Entitlement file",
          ]),
        ],
        currentIndex:
          currentStatus === "Pending Listing"
            ? 0
            : currentStatus === "Upcoming"
              ? 1
              : 2,
      };
    case "Put On Chain":
    case "Open For Distribution":
      return {
        title: "Step 4 Breakdown",
        description: "Move payout on chain and open the event for claim or transfer execution.",
        steps: [
          stage("4.1 On-chain Prep", "Prepare payout data", "Transfer Agent", [
            "Recipient list",
            "Funding confirmation",
          ]),
          stage("4.2 Open Payout", "Open claim or auto-transfer", "Transfer Agent / System", [
            "Released payout instruction",
          ]),
        ],
        currentIndex: currentStatus === "Put On Chain" ? 0 : 1,
      };
    case "Done":
      return {
        title: "Step 5 Breakdown",
        description: "Reconcile the payout event and close the distribution cycle.",
        steps: [
          stage("5.1 Reconcile", "Confirm payout completion", "Transfer Agent", [
            "Payout reconciliation",
          ]),
          stage("5.2 Closed", "Close event record", "Transfer Agent", [
            "Closed event register",
          ]),
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
  actionSlot,
  workflowModel = "default",
}: FundIssuanceWorkflowProps) {
  return (
    <FundWorkflow
      currentStatus={currentStatus}
      variant={variant}
      type="issuance"
      fundType={fundType}
      actionSlot={actionSlot}
      workflowModel={workflowModel}
    />
  );
}

export function FundRedemptionWorkflow({
  currentStatus,
  variant = "full",
  actionSlot,
  workflowModel = "default",
}: FundIssuanceWorkflowProps) {
  return (
    <FundWorkflow
      currentStatus={currentStatus}
      variant={variant}
      type="redemption"
      actionSlot={actionSlot}
      workflowModel={workflowModel}
    />
  );
}

export function FundDistributionWorkflow({
  currentStatus,
  variant = "full",
  actionSlot,
  workflowModel = "default",
  distributionLabel = "Distribution",
}: FundIssuanceWorkflowProps) {
  return (
    <FundWorkflow
      currentStatus={currentStatus}
      variant={variant}
      type="distribution"
      actionSlot={actionSlot}
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
  actionSlot,
  workflowModel = "default",
  distributionLabel = "Distribution",
}: FundWorkflowProps) {
  const config = getWorkflowConfig(type, fundType, workflowModel, distributionLabel);
  const steps = config.steps;
  const substepConfig = getWorkflowSubsteps(type, fundType, workflowModel, currentStatus);
  const issuanceStepStageCounts =
    type === "issuance" ? getIssuanceStepStageCounts(fundType) : null;

  // Find the current step index based on status
  const currentStepIndex = currentStatus
    ? (config.statusToStepMap[currentStatus] ?? -1)
    : -1;
  const currentOwner =
    currentStatus && currentStepIndex >= 0 ? steps[currentStepIndex]?.owner : undefined;
  const currentSubstep = substepConfig?.steps[substepConfig.currentIndex];

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
                  {step.owner && (
                    <div
                      className={cn(
                        "mt-1 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
                        step.owner.toLowerCase().includes("transfer agent")
                          ? "border-teal-200 bg-teal-50 text-teal-700"
                          : "border-slate-200 bg-slate-50 text-slate-600",
                      )}
                    >
                      {step.owner}
                    </div>
                  )}
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
              {currentOwner && (
                <div
                  className={cn(
                    "mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
                    currentOwner.toLowerCase().includes("transfer agent")
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
                      <div
                        className={cn(
                          "mt-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
                          step.owner.toLowerCase().includes("transfer agent")
                            ? "border-teal-200 bg-teal-50 text-teal-700"
                            : "border-slate-200 bg-slate-50 text-slate-600",
                        )}
                      >
                        {step.owner}
                      </div>
                    </div>
                  );
                })}
              </div>

              {currentSubstep && (
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="text-xs font-medium text-slate-700">Current Sub-stage Detail</div>
                  <div className="mt-1 text-sm font-medium text-foreground">
                    {currentSubstep.label}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {currentSubstep.description}
                  </div>
                  <div
                    className={cn(
                      "mt-3 inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
                      currentSubstep.owner.toLowerCase().includes("transfer agent")
                        ? "border-teal-200 bg-teal-50 text-teal-700"
                        : "border-slate-200 bg-slate-50 text-slate-700",
                    )}
                  >
                    Owner: {currentSubstep.owner}
                  </div>
                  {currentSubstep.artifacts && currentSubstep.artifacts.length > 0 && (
                    <div className="mt-4">
                      <div className="text-xs font-medium text-slate-700">
                        Data / objects approved at this sub-stage
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {currentSubstep.artifacts.map((artifact) => (
                          <div
                            key={artifact}
                            className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700"
                          >
                            {artifact}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {actionSlot && <div className="flex justify-end">{actionSlot}</div>}
        </div>
      )}
    </div>
  );
}
