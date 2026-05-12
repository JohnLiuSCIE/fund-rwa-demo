import {
  initialHolderSnapshots,
  initialTransferAgencyInstructions,
  type ActorRole,
  type HolderSnapshot,
} from "../data/fundDemoData";

export type WorkflowSourceType = "Distribution" | "Redemption" | "Issuance";

export type WorkflowStepId =
  | "IssuerSubmitted"
  | "TARespond"
  | "MatchData"
  | "LockSnapshot"
  | "GenerateList"
  | "SubmitIssuerReview"
  | "IssuerAcknowledge"
  | "ReconcileCloseOut";

export type WorkflowStatus =
  | "IssuerSubmitted"
  | "TAPulled"
  | "TAResponded"
  | "MatchPassed"
  | "MatchException"
  | "ReturnedToIssuer"
  | "SnapshotLocked"
  | "RecipientListGenerated"
  | "PaymentListGenerated"
  | "SubmittedToIssuer"
  | "IssuerAcknowledged"
  | "Reconciled";

export type WorkflowTaskStatus =
  | "New Request"
  | "Awaiting Pull"
  | "Match Required"
  | "Ready For Approval"
  | "Awaiting Issuer"
  | "Ready To Reconcile"
  | "Returned"
  | "Completed"
  | "Blocked";

export interface WorkflowInstance {
  workflowId: string;
  sourceType: WorkflowSourceType;
  sourceReference: string;
  sourceEventReference?: string;
  relatedOrderIds?: string[];
  instructionId: string;
  snapshotId?: string;
  fundId: string;
  classId: string;
  status: WorkflowStatus;
  currentStepId: WorkflowStepId;
  createdAt: string;
  updatedAt: string;
  version: number;
  idempotencyKey: string;
  lastActorRole?: ActorRole;
  lastAction?: string;
}

export interface WorkflowTask {
  taskId: string;
  workflowId: string;
  sourceType: WorkflowSourceType;
  sourceReference: string;
  ownerRole: ActorRole;
  taskStatus: WorkflowTaskStatus;
  currentStepId: WorkflowStepId;
  assignee?: string;
  reviewRequired: boolean;
  matchRequired: boolean;
  reviewChecklist: Record<string, boolean>;
  matchResultId?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface MatchResult {
  matchResultId: string;
  workflowId: string;
  matched: boolean;
  checks: Array<{ checkId: string; label: string; passed: boolean; detail: string }>;
  exception?: string;
  createdAt: string;
  actorRole: ActorRole;
  version: number;
}

export interface WorkflowActionLog {
  actionLogId: string;
  workflowId: string;
  taskId?: string;
  stepId?: WorkflowStepId;
  action:
    | "create"
    | "accept"
    | "pull"
    | "respond"
    | "match"
    | "return"
    | "submit"
    | "acknowledge"
    | "reconcile";
  actorRole: ActorRole;
  message: string;
  createdAt: string;
  idempotencyKey?: string;
}

export interface WorkflowBackendState {
  instances: WorkflowInstance[];
  tasks: WorkflowTask[];
  matchResults: MatchResult[];
  actionLogs: WorkflowActionLog[];
}

export interface WorkflowCommandResult {
  success: boolean;
  message: string;
  workflowId?: string;
  taskId?: string;
  error?: "NOT_FOUND" | "INVALID_STATE" | "VERSION_CONFLICT";
  currentVersion?: number;
}

export interface WorkflowCommandOptions {
  expectedVersion?: number;
  idempotencyKey?: string;
}

export interface WorkflowReviewChecklistItem {
  key: string;
  label: string;
  matchLabel: string;
  passDetail: string;
  failDetail: string;
}

const STORAGE_KEY = "fund-rwa-workflow-state-v4";
const CHANNEL_NAME = "fund-rwa-workflow";

function now() {
  return new Date().toISOString();
}

function dateTag() {
  return now().slice(0, 10).replaceAll("-", "");
}

function makeWorkflowId(sourceType: WorkflowSourceType, sourceReference: string) {
  return `wf-${sourceType.toLowerCase()}-${sourceReference}`.replace(/[^a-zA-Z0-9-]/g, "-");
}

function makeTaskId(workflowId: string) {
  return `task-${workflowId}`;
}

export function getWorkflowReviewChecklist(
  sourceType: WorkflowSourceType,
  sourceReference?: string,
): WorkflowReviewChecklistItem[] {
  if (sourceType === "Distribution") {
    return [
      {
        key: "distributionInstruction",
        label: "Distribution instruction matches approved event",
        matchLabel: "Distribution instruction present",
        passDetail: "Record-date, fund, class, and payout mode match the issuer event.",
        failDetail: "Distribution source terms do not match the issuer instruction.",
      },
      {
        key: "recordDateRegister",
        label: "Record-date register version is available",
        matchLabel: "Record-date register available",
        passDetail: "A register version is available for the distribution record date.",
        failDetail: "No usable record-date register version is available.",
      },
      {
        key: "entitlementEligibility",
        label: "Holder entitlements and restrictions are checked",
        matchLabel: "Entitlement eligibility ready",
        passDetail: "Eligible holders, restricted accounts, and excluded rows can be derived.",
        failDetail: "Holder eligibility or restrictions require issuer correction.",
      },
      {
        key: "recipientEvidence",
        label: "Recipient list and evidence pack are linked",
        matchLabel: "Recipient evidence linked",
        passDetail: "Recipient list, snapshot evidence, and payout references are attached.",
        failDetail: "Recipient list evidence is incomplete.",
      },
    ];
  }

  if (sourceType === "Redemption") {
    return [
      {
        key: "redemptionInstruction",
        label: "Redemption request matches cut-off roster",
        matchLabel: "Redemption instruction present",
        passDetail: "Redemption event, order roster, and cut-off terms match the issuer request.",
        failDetail: "Redemption source terms do not match the issuer request.",
      },
      {
        key: "ownershipBalance",
        label: "Holder ownership and restriction checks are valid",
        matchLabel: "Ownership balance available",
        passDetail: "Register balance, wallet link, and transfer restrictions support the redemption.",
        failDetail: "Holder ownership or restriction status blocks this redemption.",
      },
      {
        key: "paymentList",
        label: "Payment list and cash route are prepared",
        matchLabel: "Payment list ready",
        passDetail: "Payment rows, destination, currency, and settlement cycle can be derived.",
        failDetail: "Payment list or cash route is incomplete.",
      },
      {
        key: "burnEvidence",
        label: "Burn and cash evidence references are attached",
        matchLabel: "Burn/cash evidence linked",
        passDetail: "Burn package, cash evidence, and reconciliation references are available.",
        failDetail: "Burn or cash evidence is incomplete.",
      },
    ];
  }

  if (sourceReference?.includes("close-book") || sourceReference?.includes("calculate-allocation")) {
    return [
      {
        key: "subscriptionWindow",
        label: "Subscription window and close-book instruction match",
        matchLabel: "Subscription window closed",
        passDetail: "Issuer close-book instruction matches the active subscription window.",
        failDetail: "Subscription window or close-book source terms are inconsistent.",
      },
      {
        key: "acceptedOrderBook",
        label: "Accepted order book and cash confirmations are reconciled",
        matchLabel: "Accepted order book ready",
        passDetail: "Accepted subscriptions, cash confirmations, and manual overrides are aligned.",
        failDetail: "Accepted order book or cash confirmation requires review.",
      },
      {
        key: "allocationWorkbook",
        label: "Allocation workbook can derive register delta",
        matchLabel: "Allocation workbook ready",
        passDetail: "Allocation rows can be converted into the initial register package.",
        failDetail: "Allocation workbook cannot derive a clean register delta.",
      },
      {
        key: "registerPackage",
        label: "Register package and on-chain allocation evidence are linked",
        matchLabel: "Register package linked",
        passDetail: "Register package, token allocation evidence, and approval references are attached.",
        failDetail: "Register package or on-chain evidence is incomplete.",
      },
    ];
  }

  return [
    {
      key: "launchInstruction",
      label: "Issuer launch instruction matches approved fund setup",
      matchLabel: "Launch instruction present",
      passDetail: "Fund setup, token class, and issuer approval package are aligned.",
      failDetail: "Launch instruction does not match the approved setup package.",
    },
    {
      key: "dealingWindow",
      label: "Dealing window and investor eligibility controls are ready",
      matchLabel: "Dealing controls ready",
      passDetail: "Subscription window, eligibility rules, and investor intake controls are ready.",
      failDetail: "Dealing window or eligibility controls are incomplete.",
    },
    {
      key: "collectionRoute",
      label: "Collection route and cash control package are verified",
      matchLabel: "Collection route verified",
      passDetail: "Settlement account, currency, and cash control references are available.",
      failDetail: "Collection route or cash control evidence is incomplete.",
    },
    {
      key: "issuanceEvidence",
      label: "Issuance evidence and register setup are linked",
      matchLabel: "Issuance evidence linked",
      passDetail: "Register setup, approval evidence, and token control references are attached.",
      failDetail: "Issuance evidence or register setup is incomplete.",
    },
  ];
}

function buildInitialChecklist(sourceType: WorkflowSourceType, sourceReference?: string) {
  return Object.fromEntries(
    getWorkflowReviewChecklist(sourceType, sourceReference).map((item) => [item.key, false]),
  );
}

function migrateChecklist(
  checklist: Record<string, boolean> | undefined,
  sourceType: WorkflowSourceType,
  sourceReference?: string,
) {
  if (!checklist) return buildInitialChecklist(sourceType, sourceReference);
  const configured = getWorkflowReviewChecklist(sourceType, sourceReference);
  if (configured.some((item) => item.key in checklist)) {
    return Object.fromEntries(configured.map((item) => [item.key, Boolean(checklist[item.key])]));
  }

  const legacyValues = Object.values(checklist);
  const legacyComplete = legacyValues.length > 0 && legacyValues.every(Boolean);
  return Object.fromEntries(configured.map((item, index) => [item.key, legacyComplete || Boolean(legacyValues[index])]));
}

function isChecklistComplete(
  checklist: Record<string, boolean>,
  sourceType: WorkflowSourceType,
  sourceReference?: string,
) {
  return getWorkflowReviewChecklist(sourceType, sourceReference).every((item) => Boolean(checklist[item.key]));
}

function auditLog(
  workflowId: string,
  actorRole: ActorRole,
  action: WorkflowActionLog["action"],
  message: string,
  taskId?: string,
  idempotencyKey?: string,
  stepId?: WorkflowStepId,
): WorkflowActionLog {
  return {
    actionLogId: `log-${workflowId}-${action}-${Date.now()}`,
    workflowId,
    taskId,
    stepId,
    action,
    actorRole,
    message,
    createdAt: now(),
    idempotencyKey,
  };
}

function buildTask(
  instance: WorkflowInstance,
  status: WorkflowTaskStatus,
  ownerRole: ActorRole,
  reviewRequired: boolean,
  matchRequired: boolean,
): WorkflowTask {
  return {
    taskId: makeTaskId(instance.workflowId),
    workflowId: instance.workflowId,
    sourceType: instance.sourceType,
    sourceReference: instance.sourceReference,
    ownerRole,
    taskStatus: status,
    currentStepId: instance.currentStepId,
    reviewRequired,
    matchRequired,
    reviewChecklist: buildInitialChecklist(instance.sourceType, instance.sourceReference),
    createdAt: instance.createdAt,
    updatedAt: instance.updatedAt,
    version: 1,
  };
}

function createInitialWorkflowState(): WorkflowBackendState {
  const seededWorkflows: Array<{
    sourceType: WorkflowSourceType;
    sourceReference: string;
    sourceEventReference?: string;
    relatedOrderIds?: string[];
    status: WorkflowStatus;
    currentStepId: WorkflowStepId;
    taskStatus: WorkflowTaskStatus;
    ownerRole: ActorRole;
    createdAt: string;
    updatedAt: string;
    assignee?: string;
    reviewChecklist?: Record<string, boolean>;
    matchResult?: { matched: boolean; exception?: string };
    logs: Array<{
      action: WorkflowActionLog["action"];
      actorRole: ActorRole;
      message: string;
      stepId: WorkflowStepId;
      createdAt: string;
    }>;
  }> = [
    {
      sourceType: "Distribution",
      sourceReference: "distribution-002",
      status: "IssuerSubmitted",
      currentStepId: "TARespond",
      taskStatus: "New Request",
      ownerRole: "transferAgent",
      createdAt: "2026-05-20T17:30:00.000Z",
      updatedAt: "2026-05-20T17:30:00.000Z",
      logs: [
        {
          action: "create",
          actorRole: "issuer",
          message: "Issuer submitted 2026 interim distribution record-date request to TA.",
          stepId: "IssuerSubmitted",
          createdAt: "2026-05-20T17:30:00.000Z",
        },
      ],
    },
    {
      sourceType: "Redemption",
      sourceReference: "redemption-003",
      status: "TAResponded",
      currentStepId: "MatchData",
      taskStatus: "Match Required",
      ownerRole: "transferAgent",
      assignee: "ta-operator-demo",
      createdAt: "2026-05-12T16:30:00.000Z",
      updatedAt: "2026-05-12T17:08:00.000Z",
      reviewChecklist: {
        sourceInstruction: true,
        registerVersion: true,
        holderData: false,
        evidencePack: true,
      },
      logs: [
        {
          action: "create",
          actorRole: "issuer",
          message: "Issuer submitted repurchase event roster to transfer agent.",
          stepId: "IssuerSubmitted",
          createdAt: "2026-05-12T16:30:00.000Z",
        },
        {
          action: "pull",
          actorRole: "transferAgent",
          message: "TA pulled redemption package into review.",
          stepId: "TARespond",
          createdAt: "2026-05-12T16:42:00.000Z",
        },
        {
          action: "respond",
          actorRole: "transferAgent",
          message: "TA accepted redemption package and is matching holder data.",
          stepId: "TARespond",
          createdAt: "2026-05-12T17:08:00.000Z",
        },
      ],
    },
    {
      sourceType: "Redemption",
      sourceReference: "red-ce-001",
      sourceEventReference: "redemption-003",
      relatedOrderIds: ["red-ce-001"],
      status: "MatchException",
      currentStepId: "MatchData",
      taskStatus: "Blocked",
      ownerRole: "transferAgent",
      assignee: "ta-operator-demo",
      createdAt: "2026-05-13T09:18:00.000Z",
      updatedAt: "2026-05-13T09:30:00.000Z",
      reviewChecklist: {
        sourceInstruction: true,
        registerVersion: true,
        holderData: true,
        evidencePack: true,
      },
      matchResult: {
        matched: false,
        exception: "Cash confirmation is matched but not fully settled against the redemption register delta.",
      },
      logs: [
        {
          action: "create",
          actorRole: "issuer",
          message: "Issuer submitted accepted repurchase payment row for TA close-out.",
          stepId: "IssuerSubmitted",
          createdAt: "2026-05-13T09:18:00.000Z",
        },
        {
          action: "pull",
          actorRole: "transferAgent",
          message: "TA pulled the close-out request into controlled review.",
          stepId: "TARespond",
          createdAt: "2026-05-13T09:21:00.000Z",
        },
        {
          action: "respond",
          actorRole: "transferAgent",
          message: "TA accepted the request and prepared the match review.",
          stepId: "TARespond",
          createdAt: "2026-05-13T09:24:00.000Z",
        },
        {
          action: "match",
          actorRole: "transferAgent",
          message: "TA data match failed because cash evidence is incomplete.",
          stepId: "MatchData",
          createdAt: "2026-05-13T09:30:00.000Z",
        },
      ],
    },
  ];

  const instances: WorkflowInstance[] = [];
  const tasks: WorkflowTask[] = [];
  const matchResults: MatchResult[] = [];
  const actionLogs: WorkflowActionLog[] = [];

  seededWorkflows.forEach((seed) => {
    const workflowId = makeWorkflowId(seed.sourceType, seed.sourceReference);
    const instruction = initialTransferAgencyInstructions.find(
      (item) =>
        item.sourceReference === seed.sourceReference &&
        ((seed.sourceType === "Distribution" && item.instructionType === "RecordDate") ||
          (seed.sourceType === "Redemption" && item.instructionType === "Redemption")),
    );
    const snapshot = initialHolderSnapshots.find(
      (item) =>
        item.sourceType === seed.sourceType &&
        (item.sourceReference === seed.sourceReference || item.sourceReference === seed.sourceEventReference),
    );
    const instance: WorkflowInstance = {
      workflowId,
      sourceType: seed.sourceType,
      sourceReference: seed.sourceReference,
      sourceEventReference: seed.sourceEventReference,
      relatedOrderIds: seed.relatedOrderIds,
      instructionId: instruction?.instructionId || `instr-${seed.sourceType.toLowerCase()}-${seed.sourceReference}`,
      snapshotId: snapshot?.snapshotId,
      fundId: instruction?.fundId || snapshot?.fundId || "fund-closed-001",
      classId: instruction?.classId || snapshot?.classId || "REA-HKD",
      status: seed.status,
      currentStepId: seed.currentStepId,
      createdAt: seed.createdAt,
      updatedAt: seed.updatedAt,
      version: seed.status === "IssuerSubmitted" ? 1 : 2,
      idempotencyKey: instruction?.idempotencyKey || `MockSeed:${seed.sourceReference}:Workflow:${dateTag()}`,
      lastActorRole: seed.logs.at(-1)?.actorRole,
      lastAction: seed.logs.at(-1)?.action,
    };
    const task = {
      ...buildTask(instance, seed.taskStatus, seed.ownerRole, true, true),
      assignee: seed.assignee,
      reviewChecklist: migrateChecklist(seed.reviewChecklist, seed.sourceType, seed.sourceReference),
      updatedAt: seed.updatedAt,
      version: seed.status === "IssuerSubmitted" ? 1 : 2,
    };
    if (seed.matchResult) {
      const matchResult: MatchResult = {
        matchResultId: `match-${workflowId}-seed`,
        workflowId,
        matched: seed.matchResult.matched,
        checks: getWorkflowReviewChecklist(seed.sourceType, seed.sourceReference).map((item, index) => ({
          checkId: item.key,
          label: item.matchLabel,
          passed: index === 0 ? true : seed.matchResult!.matched,
          detail: index === 0 || seed.matchResult!.matched ? item.passDetail : item.failDetail,
        })),
        exception: seed.matchResult.exception,
        createdAt: seed.updatedAt,
        actorRole: "transferAgent",
        version: 1,
      };
      matchResults.push(matchResult);
      task.matchResultId = matchResult.matchResultId;
    }
    instances.push(instance);
    tasks.push(task);
    seed.logs.forEach((log, index) => {
      actionLogs.push({
        actionLogId: `log-${workflowId}-${log.action}-seed-${index}`,
        workflowId,
        taskId: task.taskId,
        stepId: log.stepId,
        action: log.action,
        actorRole: log.actorRole,
        message: log.message,
        createdAt: log.createdAt,
        idempotencyKey: `MockSeed:${workflowId}:${log.action}:${index}`,
      });
    });
  });

  return {
    instances,
    tasks,
    matchResults,
    actionLogs,
  };
}

function safeParseState(value: string | null): WorkflowBackendState | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as WorkflowBackendState;
    if (!Array.isArray(parsed.instances) || !Array.isArray(parsed.tasks)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function normalizeCompletedHandoffs(state: WorkflowBackendState): WorkflowBackendState {
  const completedWorkflowIds = new Set(
    state.instances
      .filter((instance) => instance.status === "IssuerAcknowledged")
      .map((instance) => instance.workflowId),
  );
  if (completedWorkflowIds.size === 0) return state;

  let changed = false;
  const instances = state.instances.map((instance) => {
    if (!completedWorkflowIds.has(instance.workflowId)) return instance;
    if (instance.currentStepId === "IssuerAcknowledge") return instance;
    changed = true;
    return {
      ...instance,
      currentStepId: "IssuerAcknowledge" as const,
    };
  });
  const tasks = state.tasks.map((task) => {
    if (!completedWorkflowIds.has(task.workflowId)) return task;
    if (task.taskStatus === "Completed" && task.ownerRole === "issuer") return task;
    changed = true;
    return {
      ...task,
      taskStatus: "Completed" as const,
      ownerRole: "issuer" as const,
      currentStepId: "IssuerAcknowledge" as const,
      reviewRequired: false,
      matchRequired: false,
    };
  });

  return changed ? { ...state, instances, tasks } : state;
}

function broadcast() {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.postMessage({ type: "workflow-state-updated", at: now() });
  channel.close();
}

function persist(state: WorkflowBackendState, shouldBroadcast = true) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  if (shouldBroadcast) broadcast();
  return state;
}

export function loadWorkflowState(): WorkflowBackendState {
  if (typeof window === "undefined") return createInitialWorkflowState();
  const existing = safeParseState(window.localStorage.getItem(STORAGE_KEY));
  if (existing) {
    const normalized = normalizeCompletedHandoffs(existing);
    if (normalized !== existing) return persist(normalized, false);
    return existing;
  }
  return persist(createInitialWorkflowState(), false);
}

export function resetWorkflowState() {
  return persist(createInitialWorkflowState());
}

function updateState(mutator: (state: WorkflowBackendState) => WorkflowBackendState) {
  const next = mutator(loadWorkflowState());
  return persist(next);
}

function getWorkflowByTask(state: WorkflowBackendState, taskId: string) {
  const task = state.tasks.find((item) => item.taskId === taskId);
  const instance = task ? state.instances.find((item) => item.workflowId === task.workflowId) : undefined;
  return { task, instance };
}

function getVersionConflict(
  task: WorkflowTask,
  options?: WorkflowCommandOptions,
): WorkflowCommandResult | null {
  if (options?.expectedVersion === undefined || task.version === options.expectedVersion) return null;
  return {
    success: false,
    message: `Workflow task changed from version ${options.expectedVersion} to ${task.version}. Refresh and retry.`,
    taskId: task.taskId,
    error: "VERSION_CONFLICT",
    currentVersion: task.version,
  };
}

function setInstanceStatus(
  instance: WorkflowInstance,
  status: WorkflowStatus,
  currentStepId: WorkflowStepId,
  actorRole: ActorRole,
  action: string,
): WorkflowInstance {
  return {
    ...instance,
    status,
    currentStepId,
    updatedAt: now(),
    version: instance.version + 1,
    lastActorRole: actorRole,
    lastAction: action,
  };
}

function setTaskStatus(
  task: WorkflowTask,
  instance: WorkflowInstance,
  taskStatus: WorkflowTaskStatus,
  ownerRole: ActorRole,
  reviewRequired: boolean,
  matchRequired: boolean,
): WorkflowTask {
  return {
    ...task,
    ownerRole,
    taskStatus,
    currentStepId: instance.currentStepId,
    reviewRequired,
    matchRequired,
    updatedAt: now(),
    version: task.version + 1,
  };
}

export function createIssuerWorkflowInstruction(input: {
  sourceType: WorkflowSourceType;
  sourceReference: string;
  sourceEventReference?: string;
  relatedOrderIds?: string[];
  instructionId: string;
  snapshotId?: string;
  fundId: string;
  classId: string;
  actorRole: ActorRole;
  idempotencyKey?: string;
}): WorkflowCommandResult {
  let result: WorkflowCommandResult = {
    success: true,
    message: "Workflow request created.",
  };

  updateState((state) => {
    const existing = state.instances.find(
      (item) => item.sourceType === input.sourceType && item.sourceReference === input.sourceReference,
    );
    if (existing) {
      result = {
        success: true,
        message: "Workflow request already exists.",
        workflowId: existing.workflowId,
        taskId: makeTaskId(existing.workflowId),
      };
      return state;
    }

    const createdAt = now();
    const instance: WorkflowInstance = {
      workflowId: makeWorkflowId(input.sourceType, input.sourceReference),
      sourceType: input.sourceType,
      sourceReference: input.sourceReference,
      sourceEventReference: input.sourceEventReference,
      relatedOrderIds: input.relatedOrderIds,
      instructionId: input.instructionId,
      snapshotId: input.snapshotId,
      fundId: input.fundId,
      classId: input.classId,
      status: "IssuerSubmitted",
      currentStepId: "TARespond",
      createdAt,
      updatedAt: createdAt,
      version: 1,
      idempotencyKey:
        input.idempotencyKey ||
        `IssuerPortal:${input.sourceReference}:Workflow:${dateTag()}`,
      lastActorRole: input.actorRole,
      lastAction: "create",
    };
    const task = buildTask(instance, "New Request", "transferAgent", true, true);
    result = {
      success: true,
      message: "Workflow request created.",
      workflowId: instance.workflowId,
      taskId: task.taskId,
    };
    return {
      ...state,
      instances: [instance, ...state.instances],
      tasks: [task, ...state.tasks],
      actionLogs: [
        auditLog(
          instance.workflowId,
          input.actorRole,
          "create",
          "Issuer submitted request to transfer agent.",
          task.taskId,
          input.idempotencyKey,
          "IssuerSubmitted",
        ),
        ...state.actionLogs,
      ],
    };
  });

  return result;
}

export function updateWorkflowTaskChecklist(
  taskId: string,
  checklist: Record<string, boolean>,
  options?: WorkflowCommandOptions,
): WorkflowCommandResult {
  let result: WorkflowCommandResult = { success: false, message: "Workflow task was not found.", error: "NOT_FOUND" };
  updateState((state) => {
    const { task } = getWorkflowByTask(state, taskId);
    if (!task) return state;
    const conflict = getVersionConflict(task, options);
    if (conflict) {
      result = conflict;
      return state;
    }
    result = { success: true, message: "Review checklist updated.", taskId };
    return {
      ...state,
      tasks: state.tasks.map((item) =>
        item.taskId === taskId
          ? { ...item, reviewChecklist: checklist, updatedAt: now(), version: item.version + 1 }
          : item,
      ),
    };
  });
  return result;
}

export function pullWorkflowTask(
  taskId: string,
  actorRole: ActorRole,
  options?: WorkflowCommandOptions,
): WorkflowCommandResult {
  let result: WorkflowCommandResult = { success: false, message: "Workflow task was not found.", error: "NOT_FOUND" };
  updateState((state) => {
    const { task, instance } = getWorkflowByTask(state, taskId);
    if (!task || !instance) return state;
    const conflict = getVersionConflict(task, options);
    if (conflict) {
      result = conflict;
      return state;
    }
    if (instance.status !== "IssuerSubmitted") {
      result = { success: false, message: "Only new issuer requests can be pulled.", error: "INVALID_STATE" };
      return state;
    }
    const nextInstance = setInstanceStatus(instance, "TAPulled", "TARespond", actorRole, "pull");
    result = { success: true, message: "Workflow request pulled into TA review.", workflowId: instance.workflowId, taskId };
    return {
      ...state,
      instances: state.instances.map((item) => item.workflowId === instance.workflowId ? nextInstance : item),
      tasks: state.tasks.map((item) =>
        item.taskId === taskId
          ? { ...setTaskStatus(item, nextInstance, "Match Required", "transferAgent", true, true), assignee: "ta-operator-demo" }
          : item,
      ),
      actionLogs: [
        auditLog(
          instance.workflowId,
          actorRole,
          "pull",
          "TA pulled request into workflow.",
          taskId,
          options?.idempotencyKey,
          "TARespond",
        ),
        ...state.actionLogs,
      ],
    };
  });
  return result;
}

export function acceptWorkflowTask(
  taskId: string,
  actorRole: ActorRole,
  options?: WorkflowCommandOptions,
): WorkflowCommandResult {
  let result: WorkflowCommandResult = { success: false, message: "Workflow task was not found.", error: "NOT_FOUND" };
  updateState((state) => {
    const { task, instance } = getWorkflowByTask(state, taskId);
    if (!task || !instance) return state;
    const conflict = getVersionConflict(task, options);
    if (conflict) {
      result = conflict;
      return state;
    }
    if (!["IssuerSubmitted", "TAPulled"].includes(instance.status)) {
      result = { success: false, message: "Only new issuer requests can be accepted.", error: "INVALID_STATE" };
      return state;
    }

    const nextInstance = setInstanceStatus(instance, "TAResponded", "MatchData", actorRole, "accept");
    result = {
      success: true,
      message: "TA accepted request into review. Complete review and match data.",
      workflowId: instance.workflowId,
      taskId,
    };
    return {
      ...state,
      instances: state.instances.map((item) => item.workflowId === instance.workflowId ? nextInstance : item),
      tasks: state.tasks.map((item) =>
        item.taskId === taskId
          ? { ...setTaskStatus(item, nextInstance, "Match Required", "transferAgent", true, true), assignee: "ta-operator-demo" }
          : item,
      ),
      actionLogs: [
        auditLog(
          instance.workflowId,
          actorRole,
          "accept",
          "TA accepted request into review.",
          taskId,
          options?.idempotencyKey,
          "TARespond",
        ),
        ...state.actionLogs,
      ],
    };
  });
  return result;
}

export function respondWorkflowTask(
  taskId: string,
  actorRole: ActorRole,
  options?: WorkflowCommandOptions,
): WorkflowCommandResult {
  let result: WorkflowCommandResult = { success: false, message: "Workflow task was not found.", error: "NOT_FOUND" };
  updateState((state) => {
    const { task, instance } = getWorkflowByTask(state, taskId);
    if (!task || !instance) return state;
    const conflict = getVersionConflict(task, options);
    if (conflict) {
      result = conflict;
      return state;
    }
    if (!["TAPulled", "TAResponded"].includes(instance.status)) {
      result = { success: false, message: "Pull the request before responding.", error: "INVALID_STATE" };
      return state;
    }
    const nextInstance = setInstanceStatus(instance, "TAResponded", "MatchData", actorRole, "respond");
    result = { success: true, message: "TA response accepted. Complete review and match data.", workflowId: instance.workflowId, taskId };
    return {
      ...state,
      instances: state.instances.map((item) => item.workflowId === instance.workflowId ? nextInstance : item),
      tasks: state.tasks.map((item) =>
        item.taskId === taskId ? setTaskStatus(item, nextInstance, "Match Required", "transferAgent", true, true) : item,
      ),
      actionLogs: [
        auditLog(
          instance.workflowId,
          actorRole,
          "respond",
          "TA accepted request for data match.",
          taskId,
          options?.idempotencyKey,
          "TARespond",
        ),
        ...state.actionLogs,
      ],
    };
  });
  return result;
}

export function matchWorkflowTask(
  taskId: string,
  actorRole: ActorRole,
  matched: boolean,
  exception?: string,
  options?: WorkflowCommandOptions,
): WorkflowCommandResult {
  let result: WorkflowCommandResult = { success: false, message: "Workflow task was not found.", error: "NOT_FOUND" };
  updateState((state) => {
    const { task, instance } = getWorkflowByTask(state, taskId);
    if (!task || !instance) return state;
    const conflict = getVersionConflict(task, options);
    if (conflict) {
      result = conflict;
      return state;
    }
    const reviewComplete = isChecklistComplete(task.reviewChecklist, instance.sourceType, instance.sourceReference);
    if (!reviewComplete) {
      result = { success: false, message: "Complete the review checklist before matching data.", error: "INVALID_STATE" };
      return state;
    }
    if (!["TAResponded", "MatchException"].includes(instance.status)) {
      result = { success: false, message: "Respond to the request before running match.", error: "INVALID_STATE" };
      return state;
    }
    const matchResult: MatchResult = {
      matchResultId: `match-${instance.workflowId}-${Date.now()}`,
      workflowId: instance.workflowId,
      matched,
      checks: getWorkflowReviewChecklist(instance.sourceType, instance.sourceReference).map((item, index) => ({
        checkId: item.key,
        label: item.matchLabel,
        passed: index === 0 ? true : matched,
        detail: index === 0 || matched ? item.passDetail : item.failDetail,
      })),
      exception,
      createdAt: now(),
      actorRole,
      version: 1,
    };
    const nextInstance = setInstanceStatus(
      instance,
      matched ? "MatchPassed" : "MatchException",
      matched
        ? instance.sourceType === "Issuance"
          ? "SubmitIssuerReview"
          : "LockSnapshot"
        : "MatchData",
      actorRole,
      "match",
    );
    result = {
      success: true,
      message: matched ? "Data match passed. Workflow is ready for approval action." : "Match exception recorded.",
      workflowId: instance.workflowId,
      taskId,
    };
    return {
      ...state,
      instances: state.instances.map((item) => item.workflowId === instance.workflowId ? nextInstance : item),
      tasks: state.tasks.map((item) =>
        item.taskId === taskId
          ? {
              ...setTaskStatus(
                item,
                nextInstance,
                matched ? "Ready For Approval" : "Blocked",
                "transferAgent",
                true,
                true,
              ),
              matchResultId: matchResult.matchResultId,
            }
          : item,
      ),
      matchResults: [matchResult, ...state.matchResults],
      actionLogs: [
        auditLog(
          instance.workflowId,
          actorRole,
          "match",
          matched ? "TA data match passed." : "TA data match failed.",
          taskId,
          options?.idempotencyKey,
          "MatchData",
        ),
        ...state.actionLogs,
      ],
    };
  });
  return result;
}

export function returnWorkflowTask(
  taskId: string,
  actorRole: ActorRole,
  reason: string,
  options?: WorkflowCommandOptions,
): WorkflowCommandResult {
  let result: WorkflowCommandResult = { success: false, message: "Workflow task was not found.", error: "NOT_FOUND" };
  updateState((state) => {
    const { task, instance } = getWorkflowByTask(state, taskId);
    if (!task || !instance) return state;
    const conflict = getVersionConflict(task, options);
    if (conflict) {
      result = conflict;
      return state;
    }
    const nextInstance = setInstanceStatus(instance, "ReturnedToIssuer", "IssuerSubmitted", actorRole, "return");
    result = { success: true, message: "Workflow returned to issuer.", workflowId: instance.workflowId, taskId };
    return {
      ...state,
      instances: state.instances.map((item) => item.workflowId === instance.workflowId ? nextInstance : item),
      tasks: state.tasks.map((item) =>
        item.taskId === taskId ? setTaskStatus(item, nextInstance, "Returned", "issuer", true, true) : item,
      ),
      actionLogs: [
        auditLog(
          instance.workflowId,
          actorRole,
          "return",
          reason || "TA returned request to issuer.",
          taskId,
          options?.idempotencyKey,
          instance.currentStepId,
        ),
        ...state.actionLogs,
      ],
    };
  });
  return result;
}

export function submitWorkflowStep(
  taskId: string,
  actorRole: ActorRole,
  options?: WorkflowCommandOptions,
): WorkflowCommandResult {
  let result: WorkflowCommandResult = { success: false, message: "Workflow task was not found.", error: "NOT_FOUND" };
  updateState((state) => {
    const { task, instance } = getWorkflowByTask(state, taskId);
    if (!task || !instance) return state;
    const conflict = getVersionConflict(task, options);
    if (conflict) {
      result = conflict;
      return state;
    }
    const match = task.matchResultId ? state.matchResults.find((item) => item.matchResultId === task.matchResultId) : undefined;
    if (task.reviewRequired && !isChecklistComplete(task.reviewChecklist, instance.sourceType, instance.sourceReference)) {
      result = { success: false, message: "Complete review before submitting workflow action.", error: "INVALID_STATE" };
      return state;
    }
    if (task.matchRequired && !match?.matched) {
      result = { success: false, message: "Pass data match before submitting workflow action.", error: "INVALID_STATE" };
      return state;
    }

    let nextStatus: WorkflowStatus;
    let nextStep: WorkflowStepId;
    let taskStatus: WorkflowTaskStatus;
    let message: string;
    let logStepId: WorkflowStepId;
    if (instance.status === "MatchPassed" && instance.sourceType === "Issuance") {
      nextStatus = "SubmittedToIssuer";
      nextStep = "IssuerAcknowledge";
      taskStatus = "Awaiting Issuer";
      message = "TA issuance approval submitted to issuer review.";
      logStepId = "SubmitIssuerReview";
    } else if (instance.status === "MatchPassed") {
      nextStatus = "SnapshotLocked";
      nextStep = "GenerateList";
      taskStatus = "Ready For Approval";
      message = "Snapshot locked through workflow approval.";
      logStepId = "LockSnapshot";
    } else if (instance.status === "SnapshotLocked") {
      nextStatus = instance.sourceType === "Distribution" ? "RecipientListGenerated" : "PaymentListGenerated";
      nextStep = "SubmitIssuerReview";
      taskStatus = "Ready For Approval";
      message = instance.sourceType === "Distribution" ? "Recipient list generated." : "Payment list generated.";
      logStepId = "GenerateList";
    } else if (instance.status === "RecipientListGenerated" || instance.status === "PaymentListGenerated") {
      nextStatus = "SubmittedToIssuer";
      nextStep = "IssuerAcknowledge";
      taskStatus = "Awaiting Issuer";
      message = "TA output submitted to issuer review.";
      logStepId = "SubmitIssuerReview";
    } else {
      result = { success: false, message: "Workflow is not ready for this submit action.", error: "INVALID_STATE" };
      return state;
    }

    const nextInstance = setInstanceStatus(instance, nextStatus, nextStep, actorRole, "submit");
    result = { success: true, message, workflowId: instance.workflowId, taskId };
    return {
      ...state,
      instances: state.instances.map((item) => item.workflowId === instance.workflowId ? nextInstance : item),
      tasks: state.tasks.map((item) =>
        item.taskId === taskId
          ? setTaskStatus(
              item,
              nextInstance,
              taskStatus,
              taskStatus === "Awaiting Issuer" ? "issuer" : "transferAgent",
              false,
              false,
            )
          : item,
      ),
      actionLogs: [
        auditLog(instance.workflowId, actorRole, "submit", message, taskId, options?.idempotencyKey, logStepId),
        ...state.actionLogs,
      ],
    };
  });
  return result;
}

export function acknowledgeWorkflowTask(
  taskId: string,
  actorRole: ActorRole,
  options?: WorkflowCommandOptions,
): WorkflowCommandResult {
  let result: WorkflowCommandResult = { success: false, message: "Workflow task was not found.", error: "NOT_FOUND" };
  updateState((state) => {
    const { task, instance } = getWorkflowByTask(state, taskId);
    if (!task || !instance) return state;
    const conflict = getVersionConflict(task, options);
    if (conflict) {
      result = conflict;
      return state;
    }
    if (instance.status !== "SubmittedToIssuer") {
      result = { success: false, message: "Workflow is not awaiting issuer acknowledgement.", error: "INVALID_STATE" };
      return state;
    }
    const nextInstance = setInstanceStatus(instance, "IssuerAcknowledged", "IssuerAcknowledge", actorRole, "acknowledge");
    result = { success: true, message: "Issuer acknowledged TA output. TA workflow is complete.", workflowId: instance.workflowId, taskId };
    return {
      ...state,
      instances: state.instances.map((item) => item.workflowId === instance.workflowId ? nextInstance : item),
      tasks: state.tasks.map((item) =>
        item.taskId === taskId ? setTaskStatus(item, nextInstance, "Completed", "issuer", false, false) : item,
      ),
      actionLogs: [
        auditLog(
          instance.workflowId,
          actorRole,
          "acknowledge",
          "Issuer acknowledged TA output.",
          taskId,
          options?.idempotencyKey,
          "IssuerAcknowledge",
        ),
        ...state.actionLogs,
      ],
    };
  });
  return result;
}

export function reconcileWorkflowTask(
  taskId: string,
  actorRole: ActorRole,
  options?: WorkflowCommandOptions,
): WorkflowCommandResult {
  let result: WorkflowCommandResult = { success: false, message: "Workflow task was not found.", error: "NOT_FOUND" };
  updateState((state) => {
    const { task, instance } = getWorkflowByTask(state, taskId);
    if (!task || !instance) return state;
    const conflict = getVersionConflict(task, options);
    if (conflict) {
      result = conflict;
      return state;
    }
    if (instance.status !== "IssuerAcknowledged") {
      result = { success: false, message: "Workflow is not ready for close-out reconciliation.", error: "INVALID_STATE" };
      return state;
    }
    if (instance.sourceType === "Issuance") {
      result = {
        success: true,
        message: "Issuance workflow is already complete after issuer acknowledgement.",
        workflowId: instance.workflowId,
        taskId,
      };
      return state;
    }
    const nextInstance = setInstanceStatus(instance, "Reconciled", "ReconcileCloseOut", actorRole, "reconcile");
    result = { success: true, message: "Workflow reconciled and closed.", workflowId: instance.workflowId, taskId };
    return {
      ...state,
      instances: state.instances.map((item) => item.workflowId === instance.workflowId ? nextInstance : item),
      tasks: state.tasks.map((item) =>
        item.taskId === taskId ? setTaskStatus(item, nextInstance, "Completed", "transferAgent", false, false) : item,
      ),
      actionLogs: [
        auditLog(
          instance.workflowId,
          actorRole,
          "reconcile",
          "TA reconciled close-out.",
          taskId,
          options?.idempotencyKey,
          "ReconcileCloseOut",
        ),
        ...state.actionLogs,
      ],
    };
  });
  return result;
}

export function subscribeWorkflowState(listener: (state: WorkflowBackendState) => void) {
  if (typeof window === "undefined") return () => undefined;
  const handleRefresh = () => listener(loadWorkflowState());
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) handleRefresh();
  };
  window.addEventListener("storage", onStorage);
  let channel: BroadcastChannel | null = null;
  if ("BroadcastChannel" in window) {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = handleRefresh;
  }
  return () => {
    window.removeEventListener("storage", onStorage);
    channel?.close();
  };
}

export function getWorkflowSteps(sourceType: WorkflowSourceType) {
  if (sourceType === "Issuance") {
    return [
      { stepId: "IssuerSubmitted" as const, label: "Issuer Submit", owner: "Issuer" },
      { stepId: "TARespond" as const, label: "TA Accept", owner: "Transfer Agent" },
      { stepId: "MatchData" as const, label: "Review & Match", owner: "Transfer Agent" },
      { stepId: "SubmitIssuerReview" as const, label: "Submit Issuer Review", owner: "Transfer Agent" },
      { stepId: "IssuerAcknowledge" as const, label: "Issuer Acknowledge", owner: "Issuer" },
    ];
  }

  return [
    { stepId: "IssuerSubmitted" as const, label: "Issuer Submit", owner: "Issuer" },
    { stepId: "TARespond" as const, label: "TA Accept", owner: "Transfer Agent" },
    { stepId: "MatchData" as const, label: "Review & Match", owner: "Transfer Agent" },
    { stepId: "LockSnapshot" as const, label: "Lock Snapshot", owner: "Transfer Agent" },
    { stepId: "GenerateList" as const, label: sourceType === "Distribution" ? "Recipient List" : "Payment List", owner: "Transfer Agent" },
    { stepId: "SubmitIssuerReview" as const, label: "Submit Issuer Review", owner: "Transfer Agent" },
    { stepId: "IssuerAcknowledge" as const, label: "Issuer Acknowledge", owner: "Issuer" },
  ];
}

export function getWorkflowTaskActionLabel(instance?: WorkflowInstance, task?: WorkflowTask) {
  if (!instance || !task) return "Open Workflow";
  if (task.taskStatus === "Completed") return "View Workflow";
  if (instance.status === "IssuerSubmitted" || instance.status === "TAPulled") return "Accept Request";
  if (instance.status === "TAResponded" || instance.status === "MatchException") return "Review & Match";
  if (instance.status === "MatchPassed") return instance.sourceType === "Issuance" ? "Submit TA Approval" : "Lock Snapshot";
  if (instance.status === "SnapshotLocked") return instance.sourceType === "Distribution" ? "Generate Recipient List" : "Generate Payment List";
  if (instance.status === "RecipientListGenerated" || instance.status === "PaymentListGenerated") return "Submit Issuer Review";
  if (instance.status === "SubmittedToIssuer") return "Await Issuer";
  if (instance.status === "IssuerAcknowledged") return "View Workflow";
  return "Open Workflow";
}
