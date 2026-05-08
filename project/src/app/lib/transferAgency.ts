import type {
  CashMovement,
  EvidenceRecord,
  FundDistribution,
  FundIssuance,
  FundOrder,
  FundRedemptionConfig,
  HolderSnapshot,
  HolderSnapshotPosition,
  RegisterAccount,
  RegisterDelta,
  RegisterVersion,
  ReconciliationBreak,
  SettlementList,
  SettlementListLine,
  TokenEvent,
  TransferAgencyInstruction,
  TransferAgencyNavRecord,
  WalletLink,
} from "../data/fundDemoData";

export type TransferAgentTaskType =
  | "ReviewEvidence"
  | "PrepareDelta"
  | "CheckerApproval"
  | "PostRegister"
  | "ResolveBreak"
  | "LockSnapshot"
  | "GenerateRecipientList"
  | "GeneratePaymentList"
  | "SubmitIssuerReview"
  | "ReconcileCloseOut"
  | "SecondaryBridgePlaceholder";

export type TransferAgentTaskProjection = {
  taskId: string;
  instructionId: string;
  deltaId?: string;
  breakId?: string;
  snapshotId?: string;
  listId?: string;
  sourceType?: HolderSnapshot["sourceType"];
  sourceReference?: string;
  fundId: string;
  classId: string;
  fundName: string;
  taskType: TransferAgentTaskType;
  priority: "Normal" | "High" | "Critical";
  source: string;
  registerImpact: string;
  blockingIssue?: string;
  nextActionLabel: string;
  dueAt?: string;
  status: string;
};

export type IssuerLifecycleProjection = {
  fundId: string;
  classId: string;
  lifecycleStatus: string;
  providerApprovalStatus: "NotRequired" | "Pending" | "Approved" | "Rejected";
  cashReadiness: "NotRequired" | "Pending" | "Confirmed" | "Blocked";
  taRegisterStatus: "NotStarted" | "PendingReview" | "DeltaPrepared" | "Posted" | "Blocked";
  latestRegisterVersion?: RegisterVersion;
  openBreakCount: number;
};

export type InvestorOrderProjection = {
  instructionId: string;
  fundId: string;
  classId: string;
  displayStatus: "Submitted" | "AwaitingPayment" | "AwaitingNAV" | "Processing" | "Booked" | "Settled" | "Rejected";
  requestedAmount?: string;
  confirmedUnits?: string;
  confirmedCash?: string;
  settlementAt?: string;
};

export type RegisterHealthProjection = {
  pendingDeltas: number;
  criticalBreaks: number;
  cashBlockedPostings: number;
  walletMappingExceptions: number;
  releasedToday: number;
};

export type RegisterRowProjection = RegisterAccount & {
  fundName: string;
  walletAddress: string;
  walletStatus: string;
  lastDeltaStatus: string;
};

export type EvidencePackProjection = {
  packId: string;
  fundId?: string;
  classId?: string;
  title: string;
  recordCount: number;
  latestEvidenceAt: string;
  retentionClass: string;
  records: EvidenceRecord[];
};

export type IssuerTaHandoffProjection = {
  sourceType: HolderSnapshot["sourceType"];
  sourceReference: string;
  instruction?: TransferAgencyInstruction;
  snapshot?: HolderSnapshot;
  list?: SettlementList;
  positions: HolderSnapshotPosition[];
  lines: SettlementListLine[];
  evidence: EvidenceRecord[];
  status:
    | "NotSent"
    | "Requested"
    | "SnapshotLocked"
    | "ListGenerated"
    | "SubmittedToIssuer"
    | "IssuerAcknowledged"
    | "Reconciled";
  nextActionLabel: string;
  registerVersionId?: string;
  holderCount: number;
  includedCount: number;
  totalUnits: string;
  totalAmount: string;
};

export type HolderOwnershipProjection = RegisterRowProjection & {
  latestSnapshotId?: string;
  latestSnapshotStatus?: HolderSnapshot["status"];
  latestListStatus?: SettlementList["status"];
};

function parseLeadingNumber(value?: string) {
  if (!value) return 0;
  const match = value.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function formatNumber(value: number, digits = 2) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value);
}

function findFund(funds: FundIssuance[], fundId: string) {
  return funds.find((fund) => fund.id === fundId);
}

function getFundName(funds: FundIssuance[], fundId: string) {
  return findFund(funds, fundId)?.name || fundId;
}

function getOpenBreaks(breaks: ReconciliationBreak[], deltaId?: string, instructionId?: string) {
  return breaks.filter((item) => {
    if (["Resolved", "Waived"].includes(item.status)) return false;
    return (deltaId && item.registerDeltaId === deltaId) || (instructionId && item.instructionId === instructionId);
  });
}

function getPriority(openBreaks: ReconciliationBreak[]) {
  if (openBreaks.some((item) => item.severity === "Critical")) return "Critical";
  if (openBreaks.some((item) => ["High", "Medium"].includes(item.severity))) return "High";
  return "Normal";
}

function getTaskFromDelta({
  delta,
  instruction,
  funds,
  breaks,
}: {
  delta: RegisterDelta;
  instruction?: TransferAgencyInstruction;
  funds: FundIssuance[];
  breaks: ReconciliationBreak[];
}): TransferAgentTaskProjection | null {
  const openBreaks = getOpenBreaks(breaks, delta.deltaId, delta.instructionId);
  const priority = getPriority(openBreaks);

  if (delta.postingStatus === "Posted" && openBreaks.length === 0) return null;

  let taskType: TransferAgentTaskType = "PrepareDelta";
  let nextActionLabel = "Prepare Register Delta";
  let status = delta.postingStatus;

  if (openBreaks.length > 0) {
    taskType = "ResolveBreak";
    nextActionLabel = "Resolve Break";
    status = openBreaks[0].status;
  } else if (delta.makerStatus === "Draft") {
    taskType = "PrepareDelta";
    nextActionLabel = "Submit For Checker";
    status = "Draft Delta";
  } else if (delta.checkerStatus === "Pending") {
    taskType = "CheckerApproval";
    nextActionLabel = "Checker Approval";
    status = "Checker Pending";
  } else if (delta.postingStatus === "NotPosted") {
    taskType = "PostRegister";
    nextActionLabel = "Post Register Update";
    status = "Ready To Post";
  }

  return {
    taskId: `task-${delta.deltaId}`,
    instructionId: delta.instructionId,
    deltaId: delta.deltaId,
    breakId: openBreaks[0]?.breakId,
    fundId: delta.fundId,
    classId: delta.classId,
    fundName: getFundName(funds, delta.fundId),
    taskType,
    priority,
    source: instruction ? `${instruction.sourceActorType} / ${instruction.sourceChannel}` : "Register Service",
    registerImpact: delta.deltaType,
    blockingIssue: openBreaks[0]?.breakType,
    nextActionLabel,
    dueAt: delta.effectiveAt,
    status,
  };
}

export function buildTransferAgentTasks({
  funds,
  instructions,
  registerDeltas,
  reconciliationBreaks,
}: {
  funds: FundIssuance[];
  instructions: TransferAgencyInstruction[];
  registerDeltas: RegisterDelta[];
  reconciliationBreaks: ReconciliationBreak[];
}): TransferAgentTaskProjection[] {
  const tasks = registerDeltas
    .map((delta) =>
      getTaskFromDelta({
        delta,
        instruction: instructions.find((item) => item.instructionId === delta.instructionId),
        funds,
        breaks: reconciliationBreaks,
      }),
    )
    .filter(Boolean) as TransferAgentTaskProjection[];

  const placeholderTransfers = instructions
    .filter((instruction) => instruction.instructionType === "Transfer" && instruction.sourceActorType === "VATP")
    .map((instruction) => ({
      taskId: `task-${instruction.instructionId}`,
      instructionId: instruction.instructionId,
      fundId: instruction.fundId,
      classId: instruction.classId,
      fundName: getFundName(funds, instruction.fundId),
      taskType: "SecondaryBridgePlaceholder" as const,
      priority: "Normal" as const,
      source: `${instruction.sourceActorType} / ${instruction.sourceChannel}`,
      registerImpact: "Transfer",
      blockingIssue: "Designed, not enabled in MVP",
      nextActionLabel: "View Placeholder",
      dueAt: instruction.updatedAt,
      status: "Designed Only",
    }));

  return [...tasks, ...placeholderTransfers].sort((a, b) => {
    const priorityWeight = { Critical: 0, High: 1, Normal: 2 };
    return priorityWeight[a.priority] - priorityWeight[b.priority] || a.fundName.localeCompare(b.fundName);
  });
}

function buildSnapshotTask({
  snapshot,
  instruction,
  list,
  fundName,
}: {
  snapshot: HolderSnapshot;
  instruction?: TransferAgencyInstruction;
  list?: SettlementList;
  fundName: string;
}): TransferAgentTaskProjection | null {
  if (snapshot.status === "Reconciled") return null;

  let taskType: TransferAgentTaskType = "LockSnapshot";
  let nextActionLabel = "Lock Snapshot";
  let status = snapshot.status;

  if (snapshot.status === "Locked" && !list) {
    taskType = snapshot.sourceType === "Distribution" ? "GenerateRecipientList" : "GeneratePaymentList";
    nextActionLabel = snapshot.sourceType === "Distribution" ? "Generate Recipient List" : "Generate Payment List";
    status = "Snapshot Locked";
  } else if (list?.status === "Generated" && snapshot.status === "Locked") {
    taskType = "SubmitIssuerReview";
    nextActionLabel = "Submit Issuer Review";
    status = "List Generated";
  } else if (snapshot.status === "IssuerAcknowledged") {
    taskType = "ReconcileCloseOut";
    nextActionLabel = "Reconcile Close-out";
    status = "Issuer Acknowledged";
  } else if (snapshot.status === "SubmittedToIssuer") {
    return {
      taskId: `task-${snapshot.snapshotId}`,
      instructionId: snapshot.instructionId,
      snapshotId: snapshot.snapshotId,
      listId: list?.listId,
      sourceType: snapshot.sourceType,
      sourceReference: snapshot.sourceReference,
      fundId: snapshot.fundId,
      classId: snapshot.classId,
      fundName,
      taskType: "ReviewEvidence",
      priority: "Normal",
      source: instruction ? `${instruction.sourceActorType} / ${instruction.sourceChannel}` : "IssuerPortal",
      registerImpact: `${snapshot.sourceType} snapshot`,
      blockingIssue: "Awaiting issuer acknowledgement",
      nextActionLabel: "Waiting For Issuer",
      dueAt: snapshot.recordDate,
      status,
    };
  }

  return {
    taskId: `task-${snapshot.snapshotId}`,
    instructionId: snapshot.instructionId,
    snapshotId: snapshot.snapshotId,
    listId: list?.listId,
    sourceType: snapshot.sourceType,
    sourceReference: snapshot.sourceReference,
    fundId: snapshot.fundId,
    classId: snapshot.classId,
    fundName,
    taskType,
    priority: snapshot.status === "Requested" ? "High" : "Normal",
    source: instruction ? `${instruction.sourceActorType} / ${instruction.sourceChannel}` : "IssuerPortal",
    registerImpact: `${snapshot.sourceType} snapshot`,
    nextActionLabel,
    dueAt: snapshot.recordDate,
    status,
  };
}

export function buildTransferAgentSnapshotQueue({
  funds,
  instructions,
  holderSnapshots,
  settlementLists,
}: {
  funds: FundIssuance[];
  instructions: TransferAgencyInstruction[];
  holderSnapshots: HolderSnapshot[];
  settlementLists: SettlementList[];
}): TransferAgentTaskProjection[] {
  return holderSnapshots
    .map((snapshot) =>
      buildSnapshotTask({
        snapshot,
        instruction: instructions.find((instruction) => instruction.instructionId === snapshot.instructionId),
        list: settlementLists.find((list) => list.snapshotId === snapshot.snapshotId),
        fundName: getFundName(funds, snapshot.fundId),
      }),
    )
    .filter(Boolean) as TransferAgentTaskProjection[];
}

export function buildRegisterHealth({
  registerDeltas,
  reconciliationBreaks,
  cashMovements,
  walletLinks,
  registerVersions,
}: {
  registerDeltas: RegisterDelta[];
  reconciliationBreaks: ReconciliationBreak[];
  cashMovements: CashMovement[];
  walletLinks: WalletLink[];
  registerVersions: RegisterVersion[];
}): RegisterHealthProjection {
  const openBreaks = reconciliationBreaks.filter((item) => !["Resolved", "Waived"].includes(item.status));
  const today = new Date().toISOString().slice(0, 10);
  return {
    pendingDeltas: registerDeltas.filter((delta) => delta.postingStatus !== "Posted").length,
    criticalBreaks: openBreaks.filter((item) => item.severity === "Critical").length,
    cashBlockedPostings: cashMovements.filter((item) => !["Confirmed", "Matched"].includes(item.status)).length,
    walletMappingExceptions: walletLinks.filter((item) => ["Missing", "Expired", "Rejected"].includes(item.proofStatus)).length,
    releasedToday: registerVersions.filter((item) => item.status === "Released" && item.releasedAt?.startsWith(today)).length,
  };
}

export function getLatestRegisterVersion(
  registerVersions: RegisterVersion[],
  fundId: string,
  classId?: string,
) {
  return [...registerVersions]
    .filter((item) => item.fundId === fundId && (!classId || item.classId === classId))
    .sort((a, b) => (b.releasedAt || b.effectiveAt).localeCompare(a.releasedAt || a.effectiveAt))[0];
}

export function buildIssuerLifecycleProjection({
  fund,
  registerDeltas,
  registerVersions,
  reconciliationBreaks,
  cashMovements,
}: {
  fund: FundIssuance;
  registerDeltas: RegisterDelta[];
  registerVersions: RegisterVersion[];
  reconciliationBreaks: ReconciliationBreak[];
  cashMovements: CashMovement[];
}): IssuerLifecycleProjection {
  const relatedDeltas = registerDeltas.filter((delta) => delta.fundId === fund.id);
  const openBreakCount = reconciliationBreaks.filter(
    (item) => item.fundId === fund.id && !["Resolved", "Waived"].includes(item.status),
  ).length;
  const hasBlocked = openBreakCount > 0;
  const latestRegisterVersion = getLatestRegisterVersion(registerVersions, fund.id);
  const hasPendingDeltas = relatedDeltas.some((delta) => delta.postingStatus !== "Posted");
  const hasPreparedDelta = relatedDeltas.some(
    (delta) => delta.makerStatus === "Submitted" && delta.postingStatus !== "Posted",
  );
  const cashReadiness = cashMovements.some((item) => item.fundId === fund.id && item.status === "Failed")
    ? "Blocked"
    : cashMovements.some((item) => item.fundId === fund.id && ["Confirmed", "Matched"].includes(item.status))
      ? "Confirmed"
      : "Pending";

  return {
    fundId: fund.id,
    classId: latestRegisterVersion?.classId || "N/A",
    lifecycleStatus: fund.status,
    providerApprovalStatus: "Approved",
    cashReadiness,
    taRegisterStatus: hasBlocked
      ? "Blocked"
      : hasPreparedDelta
        ? "DeltaPrepared"
        : hasPendingDeltas
          ? "PendingReview"
          : latestRegisterVersion
            ? "Posted"
            : "NotStarted",
    latestRegisterVersion,
    openBreakCount,
  };
}

export function buildInvestorOrderProjection({
  order,
  instructions,
  registerDeltas,
  cashMovements,
}: {
  order: FundOrder;
  instructions: TransferAgencyInstruction[];
  registerDeltas: RegisterDelta[];
  cashMovements: CashMovement[];
}): InvestorOrderProjection | null {
  const instruction = instructions.find((item) => item.sourceReference === order.id);
  if (!instruction) return null;
  const delta = registerDeltas.find((item) => item.instructionId === instruction.instructionId);
  const cash = cashMovements.find((item) => item.instructionId === instruction.instructionId);
  const displayStatus =
    delta?.postingStatus === "Posted"
      ? "Booked"
      : cash && !["Confirmed", "Matched"].includes(cash.status)
        ? "AwaitingPayment"
        : instruction.status === "Rejected"
          ? "Rejected"
          : instruction.status === "ReadyForRegisterReview" || delta
            ? "Processing"
            : "Submitted";

  return {
    instructionId: instruction.instructionId,
    fundId: instruction.fundId,
    classId: instruction.classId,
    displayStatus,
    requestedAmount: order.requestAmount,
    confirmedUnits: delta?.deltaType === "Issue" ? delta.units : undefined,
    confirmedCash: delta?.deltaType === "Redeem" ? order.confirmedSharesOrCash || order.estimatedSharesOrCash : undefined,
    settlementAt: order.settlementTime,
  };
}

function buildIssuerTaHandoffProjection({
  sourceType,
  sourceReference,
  instructions,
  holderSnapshots,
  holderSnapshotPositions,
  settlementLists,
  settlementListLines,
  evidenceRecords,
}: {
  sourceType: HolderSnapshot["sourceType"];
  sourceReference: string;
  instructions: TransferAgencyInstruction[];
  holderSnapshots: HolderSnapshot[];
  holderSnapshotPositions: HolderSnapshotPosition[];
  settlementLists: SettlementList[];
  settlementListLines: SettlementListLine[];
  evidenceRecords: EvidenceRecord[];
}): IssuerTaHandoffProjection {
  const instruction = instructions.find((item) => {
    const matchesType =
      sourceType === "Distribution" ? item.instructionType === "RecordDate" : item.instructionType === "Redemption";
    return item.sourceActorType === "Issuer" && item.sourceReference === sourceReference && matchesType;
  });
  const snapshot = holderSnapshots.find(
    (item) => item.sourceType === sourceType && item.sourceReference === sourceReference,
  );
  const list = snapshot ? settlementLists.find((item) => item.snapshotId === snapshot.snapshotId) : undefined;
  const positions = snapshot
    ? holderSnapshotPositions.filter((position) => position.snapshotId === snapshot.snapshotId)
    : [];
  const lines = list ? settlementListLines.filter((line) => line.listId === list.listId) : [];
  const evidence = evidenceRecords.filter(
    (record) =>
      (instruction && record.instructionId === instruction.instructionId) ||
      lines.some((line) => line.evidenceRefIds.includes(record.evidenceRefId)),
  );
  const totalUnits = positions.reduce((sum, position) => sum + parseLeadingNumber(position.units), 0);
  const totalAmount = lines.reduce((sum, line) => sum + parseLeadingNumber(line.amount), 0);
  const currency = lines[0]?.currency || "HKD";

  const status: IssuerTaHandoffProjection["status"] = !instruction
    ? "NotSent"
    : snapshot?.status === "Reconciled"
      ? "Reconciled"
      : snapshot?.status === "IssuerAcknowledged"
        ? "IssuerAcknowledged"
        : snapshot?.status === "SubmittedToIssuer"
          ? "SubmittedToIssuer"
          : list?.status === "Generated"
            ? "ListGenerated"
            : snapshot?.status === "Locked"
              ? "SnapshotLocked"
              : "Requested";

  const nextActionLabel =
    status === "NotSent"
      ? "Send To Transfer Agent"
      : status === "SubmittedToIssuer"
        ? "Acknowledge TA Output"
        : status === "IssuerAcknowledged"
          ? "Await TA Reconciliation"
          : status === "Reconciled"
            ? "Reconciled"
            : "Await Transfer Agent";

  return {
    sourceType,
    sourceReference,
    instruction,
    snapshot,
    list,
    positions,
    lines,
    evidence,
    status,
    nextActionLabel,
    registerVersionId: snapshot?.registerVersionId,
    holderCount: positions.length,
    includedCount: positions.filter((position) => position.included).length,
    totalUnits: formatNumber(totalUnits, 2),
    totalAmount: lines.length ? `${formatNumber(totalAmount, 2)} ${currency}` : "Pending",
  };
}

export function buildIssuerDistributionTaProjection(
  distribution: FundDistribution,
  canonicalState: {
    instructions: TransferAgencyInstruction[];
    holderSnapshots: HolderSnapshot[];
    holderSnapshotPositions: HolderSnapshotPosition[];
    settlementLists: SettlementList[];
    settlementListLines: SettlementListLine[];
    evidenceRecords: EvidenceRecord[];
  },
) {
  return buildIssuerTaHandoffProjection({
    sourceType: "Distribution",
    sourceReference: distribution.id,
    ...canonicalState,
  });
}

export function buildIssuerRedemptionTaProjection(
  redemption: FundRedemptionConfig,
  canonicalState: {
    instructions: TransferAgencyInstruction[];
    holderSnapshots: HolderSnapshot[];
    holderSnapshotPositions: HolderSnapshotPosition[];
    settlementLists: SettlementList[];
    settlementListLines: SettlementListLine[];
    evidenceRecords: EvidenceRecord[];
  },
) {
  return buildIssuerTaHandoffProjection({
    sourceType: "Redemption",
    sourceReference: redemption.id,
    ...canonicalState,
  });
}

export function buildRegisterRows({
  funds,
  registerAccounts,
  walletLinks,
  registerDeltas,
}: {
  funds: FundIssuance[];
  registerAccounts: RegisterAccount[];
  walletLinks: WalletLink[];
  registerDeltas: RegisterDelta[];
}): RegisterRowProjection[] {
  return registerAccounts.map((account) => {
    const wallet = walletLinks.find((item) => item.registerAccountId === account.registerAccountId);
    const lastDelta = registerDeltas.find((item) => item.deltaId === account.lastDeltaId);
    return {
      ...account,
      fundName: getFundName(funds, account.fundId),
      walletAddress: wallet?.walletAddress || "No wallet linked",
      walletStatus: wallet ? `${wallet.proofStatus} / ${wallet.whitelistStatus}` : "Missing",
      lastDeltaStatus: lastDelta ? `${lastDelta.deltaType} / ${lastDelta.postingStatus}` : account.lastDeltaId || "No delta yet",
    };
  });
}

export function buildHolderOwnershipProjection({
  funds,
  registerAccounts,
  walletLinks,
  registerDeltas,
  holderSnapshots,
  holderSnapshotPositions,
  settlementLists,
}: {
  funds: FundIssuance[];
  registerAccounts: RegisterAccount[];
  walletLinks: WalletLink[];
  registerDeltas: RegisterDelta[];
  holderSnapshots: HolderSnapshot[];
  holderSnapshotPositions: HolderSnapshotPosition[];
  settlementLists: SettlementList[];
}): HolderOwnershipProjection[] {
  return buildRegisterRows({ funds, registerAccounts, walletLinks, registerDeltas }).map((row) => {
    const latestPosition = [...holderSnapshotPositions]
      .filter((position) => position.registerAccountId === row.registerAccountId)
      .sort((left, right) => right.snapshotId.localeCompare(left.snapshotId))[0];
    const latestSnapshot = latestPosition
      ? holderSnapshots.find((snapshot) => snapshot.snapshotId === latestPosition.snapshotId)
      : undefined;
    const latestList = latestSnapshot
      ? settlementLists.find((list) => list.snapshotId === latestSnapshot.snapshotId)
      : undefined;
    return {
      ...row,
      latestSnapshotId: latestSnapshot?.snapshotId,
      latestSnapshotStatus: latestSnapshot?.status,
      latestListStatus: latestList?.status,
    };
  });
}

export function buildEvidencePacks(evidenceRecords: EvidenceRecord[]): EvidencePackProjection[] {
  const groups = new Map<string, EvidenceRecord[]>();
  evidenceRecords.forEach((record) => {
    const key = record.registerDeltaId || record.instructionId || `${record.fundId || "global"}-${record.evidenceType}`;
    groups.set(key, [...(groups.get(key) || []), record]);
  });

  return Array.from(groups.entries()).map(([packId, records]) => {
    const latestEvidenceAt = records
      .map((record) => record.createdAt)
      .sort()
      .at(-1) || "N/A";
    const primaryRecord = records[0];
    return {
      packId,
      fundId: primaryRecord.fundId,
      classId: primaryRecord.classId,
      title: primaryRecord.registerDeltaId
        ? `Register delta evidence: ${primaryRecord.registerDeltaId}`
        : `Instruction evidence: ${primaryRecord.instructionId || primaryRecord.evidenceType}`,
      recordCount: records.length,
      latestEvidenceAt,
      retentionClass: Array.from(new Set(records.map((record) => record.retentionClass))).join(" / "),
      records,
    };
  });
}

export function getDeltaEvidence(
  evidenceRecords: EvidenceRecord[],
  deltaId?: string,
  instructionId?: string,
) {
  return evidenceRecords.filter(
    (record) => (deltaId && record.registerDeltaId === deltaId) || (instructionId && record.instructionId === instructionId),
  );
}

export function getDeltaSupportObjects({
  delta,
  instructions,
  cashMovements,
  navRecords,
  tokenEvents,
  registerAccounts,
}: {
  delta?: RegisterDelta;
  instructions: TransferAgencyInstruction[];
  cashMovements: CashMovement[];
  navRecords: TransferAgencyNavRecord[];
  tokenEvents: TokenEvent[];
  registerAccounts: RegisterAccount[];
}) {
  if (!delta) {
    return {
      instruction: undefined,
      cash: undefined,
      nav: undefined,
      token: undefined,
      account: undefined,
    };
  }
  return {
    instruction: instructions.find((item) => item.instructionId === delta.instructionId),
    cash: cashMovements.find((item) => item.cashMovementId === delta.cashRefId),
    nav: navRecords.find((item) => item.navRefId === delta.navRefId),
    token: tokenEvents.find((item) => item.tokenEventRefId === delta.tokenEventRefId),
    account: registerAccounts.find((item) => item.registerAccountId === delta.registerAccountId),
  };
}
