import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock3,
  Copy,
  FileSearch,
  Filter,
  RefreshCw,
  ListChecks,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  WalletCards,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "../components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { useApp } from "../context/AppContext";
import {
  getAdmissionApprovalReadiness,
  type AdmissionApprovalReadiness,
} from "../lib/admissionReadiness";
import type {
  AdmissionRemediationResponsibleParty,
  AdmissionRemediationTask,
  EvidenceRecord,
  FundOrder,
  HolderSnapshotPosition,
  RegisterAccount,
  RegisterDelta,
  WalletLink,
} from "../data/fundDemoData";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";
type AdmissionTab = "all" | "needsReview" | "whitelisted" | "restricted";
type RiskFilter = "all" | "high" | "watch" | "standard";
type AdmissionRiskLevel = "High" | "Watch" | "Standard";
type WalletAction = "approve" | "reject" | "remove";

type AdmissionRow = {
  wallet: WalletLink;
  account: RegisterAccount;
  fundName: string;
  admissionState: string;
  requestLabel: string;
  proofEvidence?: EvidenceRecord;
  kycEvidence?: EvidenceRecord;
  relatedEvidence: EvidenceRecord[];
  relatedOrders: FundOrder[];
  relatedDeltas: RegisterDelta[];
  latestDelta?: RegisterDelta;
  latestPosition?: HolderSnapshotPosition;
  openTaskCount: number;
  remediationTasks: AdmissionRemediationTask[];
  openRemediationTasks: AdmissionRemediationTask[];
};

type SelectedWalletCommand = {
  action: WalletAction;
  row: AdmissionRow;
};

type SelectedRemediationCommand = {
  row: AdmissionRow;
  readiness: AdmissionApprovalReadiness;
};

type NextAction = {
  label: string;
  detail: string;
  variant: BadgeVariant;
};

type AdmissionRegisterRow = {
  row: AdmissionRow;
  nextAction: NextAction;
  risk: AdmissionRiskLevel;
  priorityScore: number;
  alertReasons: string[];
  lastActivityAt?: string;
};

type AdmissionSummary = {
  totalWallets: number;
  holderCount: number;
  totalUnits: number;
  needsReview: number;
  readyToApprove: number;
  whitelisted: number;
  restricted: number;
  evidenceLinked: number;
};

type AdmissionAlert = {
  id: string;
  title: string;
  detail: string;
  severity: BadgeVariant;
  rows: AdmissionRegisterRow[];
};

const admissionTabLabels: Record<AdmissionTab, string> = {
  all: "All",
  needsReview: "Needs Review",
  whitelisted: "Whitelisted",
  restricted: "Restricted",
};

function statusVariant(status: string): BadgeVariant {
  if (["Rejected", "Removed", "Suspended", "Expired", "Missing", "Exception"].includes(status)) return "destructive";
  if (
    ["Pending", "Submitted", "Pending KYC", "Awaiting TA Review", "Awaiting issuer", "Pending Review"].includes(status)
  ) {
    return "secondary";
  }
  if (["Whitelisted", "Verified", "Active", "Ready", "Active Wallet"].includes(status)) return "default";
  return "outline";
}

function formatDate(value?: string) {
  if (!value) return "Pending";
  const parsed = new Date(value.includes("T") ? value : value.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function shortWallet(value: string) {
  if (value.length <= 16) return value;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function parseUnits(value: string) {
  const match = value.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function formatUnits(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

function sortByDateDesc<T>(items: T[], getDate: (item: T) => string | undefined) {
  return [...items].sort((left, right) => (getDate(right) || "").localeCompare(getDate(left) || ""));
}

function getAdmissionState(account: RegisterAccount, link: WalletLink) {
  if (link.whitelistStatus === "Pending" || link.proofStatus === "Submitted" || account.accountStatus === "Pending") {
    return "Awaiting TA Review";
  }
  if (link.whitelistStatus === "Whitelisted") return "Whitelisted";
  if (link.proofStatus === "Rejected") return "Rejected";
  if (link.whitelistStatus === "Removed") return "Removed";
  if (link.whitelistStatus === "Suspended") return "Suspended";
  if (link.proofStatus === "Expired") return "Proof Expired";
  if (link.proofStatus === "Missing") return "Pending KYC";
  return link.whitelistStatus;
}

function getRequestLabel(account: RegisterAccount, link: WalletLink) {
  if (link.proofStatus === "Missing" || link.proofStatus === "Expired") return "Pending KYC";
  if (link.whitelistStatus === "Pending" || link.proofStatus === "Submitted" || account.accountStatus === "Pending") {
    return "Awaiting TA Review";
  }
  if (link.whitelistStatus === "Whitelisted") return "Active Wallet";
  return "Exception";
}

function getApprovalReadiness(row: AdmissionRow): AdmissionApprovalReadiness {
  return getAdmissionApprovalReadiness(row.wallet, row.account, row.openRemediationTasks);
}

function canApproveAdmission(row: AdmissionRow) {
  return getApprovalReadiness(row).ready;
}

function getApproveBlockReason(row: AdmissionRow) {
  return getApprovalReadiness(row).reason || "Proof evidence is required before this wallet can be approved.";
}

function getActionMeta(action: WalletAction) {
  if (action === "approve") {
    return {
      title: "Approve wallet admission",
      description: "Confirm the proof and whitelist update before this wallet is written back to User Management.",
      buttonLabel: "Approve",
      impact: [
        "Proof status moves to Verified.",
        "Whitelist status moves to Whitelisted.",
        "A Pending register account becomes Active.",
      ],
    };
  }
  if (action === "reject") {
    return {
      title: "Reject admission request",
      description: "Confirm the rejected proof and account impact before closing this request.",
      buttonLabel: "Reject",
      impact: [
        "Proof status moves to Rejected.",
        "Whitelist status moves to Removed.",
        "The register account is Suspended unless it is already Closed.",
      ],
    };
  }
  return {
    title: "Remove wallet from whitelist",
    description: "Confirm the whitelist removal and account impact before updating the Book of Record.",
    buttonLabel: "Remove",
    impact: [
      "Whitelist status moves to Removed.",
      "The wallet is no longer eligible for transfer activity.",
      "The register account is Suspended unless it is already Closed.",
    ],
  };
}

function evidenceActor(record?: EvidenceRecord) {
  if (!record) return "Evidence not found";
  return `${record.sourceActorType} / ${record.sourceActorId}`;
}

function evidenceHash(record?: EvidenceRecord) {
  return record?.contentHash || "No hash recorded";
}

function evidenceStorage(record?: EvidenceRecord) {
  return record?.storageUri || "No storage URI recorded";
}

function actionButtonVariant(action: WalletAction): "default" | "outline" | "destructive" {
  if (action === "approve") return "default";
  if (action === "reject") return "outline";
  return "destructive";
}

function isAwaitingTAReview(row: AdmissionRow) {
  return (
    row.wallet.whitelistStatus === "Pending" ||
    row.wallet.proofStatus === "Submitted" ||
    row.account.accountStatus === "Pending"
  );
}

function isRestrictedAdmission(row: AdmissionRow) {
  return (
    ["Restricted", "Suspended", "Closed"].includes(row.account.accountStatus) ||
    ["Removed", "Suspended"].includes(row.wallet.whitelistStatus) ||
    ["Rejected", "Expired"].includes(row.wallet.proofStatus)
  );
}

function isNeedsReviewAdmission(row: AdmissionRow) {
  return (
    isAwaitingTAReview(row) ||
    isRestrictedAdmission(row) ||
    row.wallet.proofStatus === "Missing" ||
    row.openTaskCount > 0 ||
    row.openRemediationTasks.length > 0
  );
}

function getLastActivityAt(row: AdmissionRow) {
  return (
    row.wallet.lastActionAt ||
    sortByDateDesc(row.remediationTasks, (task) => task.lastActionAt || task.createdAt)[0]?.lastActionAt ||
    row.wallet.verifiedAt ||
    row.latestDelta?.updatedAt ||
    row.latestDelta?.postedAt ||
    row.latestDelta?.effectiveAt ||
    row.proofEvidence?.createdAt ||
    row.kycEvidence?.createdAt
  );
}

function riskVariant(risk: AdmissionRiskLevel): BadgeVariant {
  if (risk === "High") return "destructive";
  if (risk === "Watch") return "secondary";
  return "outline";
}

function getAdmissionRisk(row: AdmissionRow): AdmissionRiskLevel {
  if (
    row.wallet.proofStatus === "Missing" ||
    row.wallet.proofStatus === "Expired" ||
    row.wallet.proofStatus === "Rejected" ||
    ["Removed", "Suspended"].includes(row.wallet.whitelistStatus) ||
    ["Restricted", "Suspended", "Closed"].includes(row.account.accountStatus)
  ) {
    return "High";
  }
  if (isAwaitingTAReview(row) || row.openTaskCount > 0 || row.openRemediationTasks.length > 0) return "Watch";
  return "Standard";
}

function getNextAction(row: AdmissionRow): NextAction {
  if (row.openRemediationTasks.length > 0) {
    const task = row.openRemediationTasks[0];
    return {
      label: "Remediation open",
      detail: `${task.actionLabel} assigned to ${task.responsibleParty}.`,
      variant: "secondary",
    };
  }

  if (row.wallet.proofStatus === "Missing") {
    return {
      label: "Collect KYC proof",
      detail: "Approval stays blocked until proof evidence is linked.",
      variant: "secondary",
    };
  }

  if (row.wallet.proofStatus === "Expired") {
    return {
      label: "Refresh proof",
      detail: "Expired proof should be replaced or the wallet removed.",
      variant: "destructive",
    };
  }

  if (isAwaitingTAReview(row)) {
    const approveBlocked = !canApproveAdmission(row);
    return {
      label: approveBlocked ? "Review evidence gap" : "Approve / reject",
      detail: approveBlocked ? getApproveBlockReason(row) : "Evidence is available for a TA decision.",
      variant: "secondary",
    };
  }

  if (row.wallet.whitelistStatus === "Whitelisted") {
    return {
      label: "Maintain whitelist",
      detail: "Wallet is eligible; remove only if holder access changes.",
      variant: "default",
    };
  }

  if (isRestrictedAdmission(row)) {
    return {
      label: "Resolve restriction",
      detail: "Confirm the removed or suspended state before re-opening access.",
      variant: "destructive",
    };
  }

  return {
    label: "Review admission",
    detail: "Validate proof and whitelist state before the next register action.",
    variant: "outline",
  };
}

function getPriorityScore(row: AdmissionRow) {
  let score = 0;
  if (isAwaitingTAReview(row)) score += 70;
  if (row.wallet.proofStatus === "Missing" || row.wallet.proofStatus === "Expired") score += 65;
  if (isRestrictedAdmission(row)) score += 55;
  if (canApproveAdmission(row) && isAwaitingTAReview(row)) score += 10;
  if (!canApproveAdmission(row) && isAwaitingTAReview(row)) score += 8;
  score += Math.min(row.openTaskCount * 6, 24);
  score += Math.min(row.openRemediationTasks.length * 10, 30);
  if (row.relatedOrders.some((order) => !["Completed", "Rejected"].includes(order.status))) score += 12;
  if (row.wallet.whitelistStatus === "Whitelisted") score += 5;
  return score;
}

function getAlertReasons(row: AdmissionRow) {
  const reasons: string[] = [];
  if (row.wallet.proofStatus === "Missing") reasons.push("Missing proof");
  if (row.wallet.proofStatus === "Expired") reasons.push("Expired proof");
  if (row.wallet.proofStatus === "Rejected") reasons.push("Rejected proof");
  if (["Removed", "Suspended"].includes(row.wallet.whitelistStatus)) {
    reasons.push(`${row.wallet.whitelistStatus} whitelist`);
  }
  if (["Restricted", "Suspended", "Closed"].includes(row.account.accountStatus)) {
    reasons.push(`${row.account.accountStatus} account`);
  }
  if (row.openTaskCount > 0) reasons.push(`${row.openTaskCount} open workflow${row.openTaskCount > 1 ? "s" : ""}`);
  if (row.openRemediationTasks.length > 0) {
    reasons.push(`${row.openRemediationTasks.length} remediation${row.openRemediationTasks.length > 1 ? "s" : ""}`);
  }
  return reasons;
}

function deriveAdmissionRegisterRow(row: AdmissionRow): AdmissionRegisterRow {
  return {
    row,
    nextAction: getNextAction(row),
    risk: getAdmissionRisk(row),
    priorityScore: getPriorityScore(row),
    alertReasons: getAlertReasons(row),
    lastActivityAt: getLastActivityAt(row),
  };
}

async function copyWalletAddress(value: string) {
  try {
    let copied = false;
    const clipboard = window.navigator?.clipboard;
    if (clipboard?.writeText) {
      try {
        await clipboard.writeText(value);
        copied = true;
      } catch {
        copied = false;
      }
    }

    if (!copied) {
      window.focus();
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, value.length);
      copied = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (!copied) throw new Error("Clipboard unavailable");
    }
    toast.success("Wallet address copied.");
  } catch {
    toast.error("Unable to copy wallet address.");
  }
}

function getRowHaystack(row: AdmissionRow) {
  return [
    row.account.holderName,
    row.account.holderId,
    row.account.registerAccountId,
    row.account.holderType,
    row.account.source,
    row.account.accountStatus,
    row.fundName,
    row.account.classId,
    row.wallet.walletAddress,
    row.wallet.chainId,
    row.wallet.proofStatus,
    row.wallet.whitelistStatus,
    row.wallet.proofRefId,
    row.admissionState,
    row.requestLabel,
    row.proofEvidence?.label,
    row.kycEvidence?.label,
    row.latestDelta?.deltaType,
    row.latestDelta?.postingStatus,
    row.relatedOrders.map((order) => `${order.id} ${order.status}`).join(" "),
    row.remediationTasks.map((task) => `${task.taskId} ${task.actionLabel} ${task.reason} ${task.status}`).join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function TransferAgentAdmissions() {
  const {
    admissionRemediationTasks,
    approveWalletLink,
    completeAdmissionRemediationTask,
    createAdmissionRemediationTask,
    evidenceRecords,
    fundIssuances,
    fundOrders,
    holderSnapshotPositions,
    registerAccounts,
    registerDeltas,
    rejectWalletLink,
    removeWalletFromWhitelist,
    walletLinks,
    workflowState,
  } = useApp();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<AdmissionTab>("all");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [selectedCommand, setSelectedCommand] = useState<SelectedWalletCommand | null>(null);
  const [selectedRemediation, setSelectedRemediation] = useState<SelectedRemediationCommand | null>(null);

  const normalizedQuery = query.trim().toLowerCase();

  const fundNameById = useMemo(
    () => new Map(fundIssuances.map((fund) => [fund.id, fund.name])),
    [fundIssuances],
  );
  const accountById = useMemo(
    () => new Map(registerAccounts.map((account) => [account.registerAccountId, account])),
    [registerAccounts],
  );
  const evidenceById = useMemo(
    () => new Map(evidenceRecords.map((record) => [record.evidenceRefId, record])),
    [evidenceRecords],
  );

  const rows = useMemo<AdmissionRow[]>(
    () =>
      walletLinks
        .map((wallet) => {
          const account = accountById.get(wallet.registerAccountId);
          if (!account) return null;

          const relatedDeltas = sortByDateDesc(
            registerDeltas.filter((delta) => delta.registerAccountId === account.registerAccountId),
            (delta) => delta.postedAt || delta.effectiveAt || delta.updatedAt,
          );
          const deltaRefs = new Set(relatedDeltas.flatMap((delta) => [delta.deltaId, delta.instructionId]));
          const proofEvidence = wallet.proofRefId ? evidenceById.get(wallet.proofRefId) : undefined;
          const accountName = account.holderName.toLowerCase();
          const accountHolderId = account.holderId.toLowerCase();
          const relatedEvidence = sortByDateDesc(
            evidenceRecords.filter((record) => {
              const isProof = record.evidenceRefId === wallet.proofRefId;
              const isDeltaEvidence =
                (record.registerDeltaId && deltaRefs.has(record.registerDeltaId)) ||
                (record.instructionId && deltaRefs.has(record.instructionId));
              const isNamedKyc =
                record.evidenceType === "KYCReference" &&
                record.fundId === account.fundId &&
                record.classId === account.classId &&
                (record.label.toLowerCase().includes(accountName) || record.label.toLowerCase().includes(accountHolderId));
              return isProof || isDeltaEvidence || isNamedKyc;
            }),
            (record) => record.createdAt,
          );
          const kycEvidence =
            relatedEvidence.find((record) => record.evidenceType === "KYCReference") ||
            (proofEvidence?.evidenceType === "KYCReference" ? proofEvidence : undefined);
          const latestPosition = sortByDateDesc(
            holderSnapshotPositions.filter((position) => position.registerAccountId === account.registerAccountId),
            (position) => position.snapshotId,
          )[0];
          const relatedOrders = sortByDateDesc(
            fundOrders.filter((order) => {
              const walletMatches = order.investorWallet.toLowerCase() === wallet.walletAddress.toLowerCase();
              return order.fundId === account.fundId && (walletMatches || order.investorName === account.holderName);
            }),
            (order) => order.settlementTime || order.confirmTime || order.submitTime,
          );
          const relatedWorkflowIds = new Set(
            workflowState.instances
              .filter((instance) => {
                const fromDelta = relatedDeltas.some((delta) => delta.instructionId === instance.instructionId);
                const fromOrder = relatedOrders.some(
                  (order) => instance.sourceReference === order.id || instance.relatedOrderIds?.includes(order.id),
                );
                return instance.fundId === account.fundId && instance.classId === account.classId && (fromDelta || fromOrder);
              })
              .map((instance) => instance.workflowId),
          );
          const openTaskCount = workflowState.tasks.filter(
            (task) => relatedWorkflowIds.has(task.workflowId) && task.taskStatus !== "Completed",
          ).length;
          const remediationTasks = sortByDateDesc(
            admissionRemediationTasks.filter(
              (task) =>
                task.walletLinkId === wallet.walletLinkId ||
                task.registerAccountId === account.registerAccountId,
            ),
            (task) => task.lastActionAt || task.createdAt,
          );
          const openRemediationTasks = remediationTasks.filter(
            (task) => task.status === "Open" || task.status === "InProgress",
          );

          return {
            wallet,
            account,
            fundName: fundNameById.get(account.fundId) || account.fundId,
            admissionState: getAdmissionState(account, wallet),
            requestLabel: getRequestLabel(account, wallet),
            proofEvidence,
            kycEvidence,
            relatedEvidence,
            relatedOrders,
            relatedDeltas,
            latestDelta: relatedDeltas[0],
            latestPosition,
            openTaskCount,
            remediationTasks,
            openRemediationTasks,
          };
        })
        .filter((item): item is AdmissionRow => Boolean(item)),
    [
      accountById,
      admissionRemediationTasks,
      evidenceById,
      evidenceRecords,
      fundNameById,
      fundOrders,
      holderSnapshotPositions,
      registerDeltas,
      walletLinks,
      workflowState.instances,
      workflowState.tasks,
    ],
  );

  const admissionRegisterRows = useMemo<AdmissionRegisterRow[]>(
    () =>
      rows
        .map(deriveAdmissionRegisterRow)
        .sort((left, right) => {
          if (left.priorityScore !== right.priorityScore) return right.priorityScore - left.priorityScore;
          return (right.lastActivityAt || "").localeCompare(left.lastActivityAt || "");
        }),
    [rows],
  );

  const needsReviewRows = admissionRegisterRows.filter(({ row }) => isNeedsReviewAdmission(row));
  const whitelistedRows = admissionRegisterRows.filter(({ row }) => row.wallet.whitelistStatus === "Whitelisted");
  const restrictedRows = admissionRegisterRows.filter(({ row }) => isRestrictedAdmission(row));
  const readyToApproveRows = admissionRegisterRows.filter(
    ({ row }) => isAwaitingTAReview(row) && canApproveAdmission(row),
  );

  const admissionSummary = useMemo<AdmissionSummary>(
    () => ({
      totalWallets: admissionRegisterRows.length,
      holderCount: new Set(admissionRegisterRows.map(({ row }) => row.account.holderId)).size,
      totalUnits: admissionRegisterRows.reduce((sum, { row }) => sum + parseUnits(row.account.units), 0),
      needsReview: needsReviewRows.length,
      readyToApprove: readyToApproveRows.length,
      whitelisted: whitelistedRows.length,
      restricted: restrictedRows.length,
      evidenceLinked: admissionRegisterRows.filter(({ row }) => row.proofEvidence || row.kycEvidence).length,
    }),
    [admissionRegisterRows, needsReviewRows.length, readyToApproveRows.length, restrictedRows.length, whitelistedRows.length],
  );

  const priorityQueue = useMemo(() => {
    const priorityRows = admissionRegisterRows.filter(({ priorityScore }) => priorityScore >= 45);
    return (priorityRows.length ? priorityRows : needsReviewRows).slice(0, 6);
  }, [admissionRegisterRows, needsReviewRows]);

  const alerts = useMemo<AdmissionAlert[]>(() => {
    const missingProofRows = admissionRegisterRows.filter(({ row }) => row.wallet.proofStatus === "Missing");
    const proofExceptionRows = admissionRegisterRows.filter(({ row }) =>
      ["Expired", "Rejected"].includes(row.wallet.proofStatus),
    );
    const restrictionRows = admissionRegisterRows.filter(({ row }) => isRestrictedAdmission(row));
    const workflowRows = admissionRegisterRows.filter(({ row }) => row.openTaskCount > 0);
    const remediationRows = admissionRegisterRows.filter(({ row }) => row.openRemediationTasks.length > 0);

    return [
      {
        id: "missing-proof",
        title: "Missing KYC proof",
        detail: "Wallets blocked from approval until evidence is linked.",
        severity: "destructive",
        rows: missingProofRows,
      },
      {
        id: "proof-exceptions",
        title: "Proof exceptions",
        detail: "Expired or rejected proof requires a cleanup decision.",
        severity: "destructive",
        rows: proofExceptionRows,
      },
      {
        id: "restricted-access",
        title: "Restricted access",
        detail: "Removed, suspended, or closed accounts need register attention.",
        severity: "secondary",
        rows: restrictionRows,
      },
      {
        id: "open-workflows",
        title: "Open workflows",
        detail: "Admission records tied to unfinished TA workflow tasks.",
        severity: "outline",
        rows: workflowRows,
      },
      {
        id: "remediation-requests",
        title: "Remediation requests",
        detail: "Open User Management requests block admission approval until completed.",
        severity: "secondary",
        rows: remediationRows,
      },
    ].filter((alert) => alert.rows.length > 0);
  }, [admissionRegisterRows]);

  const rowsByTab: Record<AdmissionTab, AdmissionRegisterRow[]> = {
    all: admissionRegisterRows,
    needsReview: needsReviewRows,
    whitelisted: whitelistedRows,
    restricted: restrictedRows,
  };
  const alertItemCount = alerts.reduce((total, alert) => total + alert.rows.length, 0);

  const visibleRegisterRows = rowsByTab[activeTab].filter((item) => {
    if (riskFilter !== "all" && item.risk.toLowerCase() !== riskFilter) return false;
    if (!normalizedQuery) return true;
    return getRowHaystack(item.row).includes(normalizedQuery);
  });

  const runWalletCommand = (action: WalletAction, row: AdmissionRow) => {
    if (action === "approve" && !canApproveAdmission(row)) {
      toast.error(getApproveBlockReason(row));
      return;
    }

    const { wallet } = row;
    const result =
      action === "approve"
        ? approveWalletLink(wallet.walletLinkId, wallet.version)
        : action === "reject"
          ? rejectWalletLink(wallet.walletLinkId, wallet.version)
          : removeWalletFromWhitelist(wallet.walletLinkId, wallet.version);

    if (result.success) {
      toast.success(result.message);
      setSelectedCommand(null);
      return;
    }
    toast.error(result.message || "Whitelist command failed.");
  };

  const runCreateRemediation = (
    row: AdmissionRow,
    readiness: AdmissionApprovalReadiness,
    input: {
      responsibleParty: AdmissionRemediationResponsibleParty;
      dueAt?: string;
    },
  ) => {
    const result = createAdmissionRemediationTask(
      row.wallet.walletLinkId,
      {
        actionLabel: readiness.actionLabel || "Resolve Evidence",
        reason: readiness.reason || "Admission evidence requires remediation before approval.",
        responsibleParty: input.responsibleParty,
        dueAt: input.dueAt,
      },
      row.wallet.version,
    );
    if (result.success) {
      toast.success(result.message);
      setSelectedRemediation(null);
      return;
    }
    toast.error(result.message || "Remediation request could not be created.");
  };

  const runCompleteRemediation = (task: AdmissionRemediationTask) => {
    const result = completeAdmissionRemediationTask(
      task.taskId,
      task.version,
      "TA reviewed the requested evidence or account update.",
    );
    if (result.success) {
      toast.success(result.message);
      return;
    }
    toast.error(result.message || "Remediation request could not be completed.");
  };

  const openActionSheet = (action: WalletAction, row: AdmissionRow) => {
    if (action === "approve" && !canApproveAdmission(row)) {
      toast.error(getApproveBlockReason(row));
      return;
    }
    setSelectedCommand({ action, row });
  };

  const openRemediationSheet = (row: AdmissionRow, readiness: AdmissionApprovalReadiness) => {
    setSelectedRemediation({ row, readiness });
  };

  const renderActions = (row: AdmissionRow) => {
    const { account, wallet } = row;
    const approvalReadiness = getApprovalReadiness(row);
    if (wallet.whitelistStatus === "Whitelisted") {
      return (
        <Button className="min-w-24" size="sm" variant="destructive" onClick={() => openActionSheet("remove", row)}>
          Remove
        </Button>
      );
    }

    if (wallet.whitelistStatus === "Pending" || wallet.proofStatus === "Submitted" || account.accountStatus === "Pending") {
      return (
        <div className="flex flex-wrap gap-2 md:min-w-[190px]">
          {approvalReadiness.ready ? (
            <Button className="min-w-24" size="sm" onClick={() => openActionSheet("approve", row)}>
              Approve
            </Button>
          ) : (
            <Button className="min-w-24" size="sm" variant="outline" title={approvalReadiness.reason} onClick={() => openRemediationSheet(row, approvalReadiness)}>
              <RefreshCw className="mr-1 h-3.5 w-3.5" />
              Resolve
            </Button>
          )}
          <Button className="min-w-20" size="sm" variant="outline" onClick={() => openActionSheet("reject", row)}>
            Reject
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap gap-2 md:min-w-[190px]">
        {approvalReadiness.ready ? (
          <Button className="min-w-24" size="sm" onClick={() => openActionSheet("approve", row)}>
            Approve
          </Button>
        ) : (
          <Button className="min-w-24" size="sm" variant="outline" title={approvalReadiness.reason} onClick={() => openRemediationSheet(row, approvalReadiness)}>
            <RefreshCw className="mr-1 h-3.5 w-3.5" />
            Resolve
          </Button>
        )}
        {wallet.whitelistStatus !== "Removed" && (
          <Button className="min-w-20" size="sm" variant="destructive" onClick={() => openActionSheet("remove", row)}>
            Remove
          </Button>
        )}
      </div>
    );
  };

  const registerTabCounts: Record<AdmissionTab, number> = {
    all: admissionRegisterRows.length,
    needsReview: needsReviewRows.length,
    whitelisted: whitelistedRows.length,
    restricted: restrictedRows.length,
  };

  const rowByWalletLinkId = useMemo(
    () => new Map(rows.map((row) => [row.wallet.walletLinkId, row])),
    [rows],
  );
  const openRemediationTasks = useMemo(
    () =>
      sortByDateDesc(
        admissionRemediationTasks.filter((task) => task.status === "Open" || task.status === "InProgress"),
        (task) => task.dueAt || task.lastActionAt || task.createdAt,
      ),
    [admissionRemediationTasks],
  );

  return (
    <div className="container mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:py-8">
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline">Book of Record</Badge>
            <Badge variant="secondary">Admissions</Badge>
          </div>
          <h1 style={{ fontFamily: "var(--font-heading)" }}>User Management / Admissions</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{admissionSummary.holderCount} holders</Badge>
          <Badge variant="outline">{formatUnits(admissionSummary.totalUnits)} units</Badge>
        </div>
      </div>

      <CompactAdmissionSummary summary={admissionSummary} alertItemCount={alertItemCount} />

      <div className="mt-4 grid gap-4 2xl:grid-cols-[minmax(0,1fr)_320px] 2xl:items-start">
        <Card className="min-w-0">
          <CardHeader className="border-b pb-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileSearch className="h-4 w-4" />
                Admissions Register
              </CardTitle>
              <Badge variant="outline">{visibleRegisterRows.length} shown</Badge>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="pl-9"
                  placeholder="Search admissions"
                />
              </div>
              <Select value={activeTab} onValueChange={(value) => setActiveTab(value as AdmissionTab)}>
                <SelectTrigger aria-label="Admission status filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(admissionTabLabels) as AdmissionTab[]).map((tab) => (
                    <SelectItem key={tab} value={tab}>
                      {admissionTabLabels[tab]} ({registerTabCounts[tab]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={riskFilter} onValueChange={(value) => setRiskFilter(value as RiskFilter)}>
                <SelectTrigger aria-label="Risk filter">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Risk filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All risk</SelectItem>
                  <SelectItem value="high">High risk</SelectItem>
                  <SelectItem value="watch">Watch</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="hidden flex-wrap gap-2 pt-3 md:flex">
              {(Object.keys(admissionTabLabels) as AdmissionTab[]).map((tab) => (
                <Button
                  key={tab}
                  type="button"
                  size="sm"
                  variant={activeTab === tab ? "default" : "outline"}
                  onClick={() => setActiveTab(tab)}
                >
                  {admissionTabLabels[tab]} ({registerTabCounts[tab]})
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <AdmissionsRegisterRows rows={visibleRegisterRows} renderActions={renderActions} />
          </CardContent>
        </Card>

        <div className="grid gap-4 2xl:sticky 2xl:top-4">
          <Card className="min-w-0">
            <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ListChecks className="h-4 w-4" />
                Priority Queue
              </CardTitle>
              <Badge variant="outline">{priorityQueue.length}</Badge>
            </CardHeader>
            <CardContent>
              <PriorityAdmissionsQueue rows={priorityQueue} renderActions={renderActions} />
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldAlert className="h-4 w-4" />
                Alerts
              </CardTitle>
              <Badge variant="outline">{alertItemCount}</Badge>
            </CardHeader>
            <CardContent>
              <AdmissionAlertsPanel alerts={alerts} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-6 min-w-0">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              User Management Requests
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Remediation requests that must close before unsafe admissions can be approved.
            </p>
          </div>
          <Badge variant="outline">{openRemediationTasks.length} open</Badge>
        </CardHeader>
        <CardContent>
          <AdmissionRemediationQueue
            tasks={openRemediationTasks}
            rowByWalletLinkId={rowByWalletLinkId}
            onComplete={runCompleteRemediation}
          />
        </CardContent>
      </Card>

      <Sheet open={Boolean(selectedCommand)} onOpenChange={(open) => (!open ? setSelectedCommand(null) : undefined)}>
        {selectedCommand && (
          <WalletActionSheetContent
            command={selectedCommand}
            onCancel={() => setSelectedCommand(null)}
            onConfirm={() => runWalletCommand(selectedCommand.action, selectedCommand.row)}
          />
        )}
      </Sheet>
      <Sheet open={Boolean(selectedRemediation)} onOpenChange={(open) => (!open ? setSelectedRemediation(null) : undefined)}>
        {selectedRemediation && (
          <RemediationRequestSheetContent
            command={selectedRemediation}
            onCancel={() => setSelectedRemediation(null)}
            onConfirm={(input) =>
              runCreateRemediation(selectedRemediation.row, selectedRemediation.readiness, input)
            }
          />
        )}
      </Sheet>
    </div>
  );
}

function CompactAdmissionSummary({
  summary,
  alertItemCount,
}: {
  summary: AdmissionSummary;
  alertItemCount: number;
}) {
  const items = [
    {
      label: "Needs review",
      value: summary.needsReview,
      icon: Clock3,
      variant: "secondary" as BadgeVariant,
    },
    {
      label: "Ready",
      value: summary.readyToApprove,
      icon: CheckCircle2,
      variant: "default" as BadgeVariant,
    },
    {
      label: "Whitelisted",
      value: summary.whitelisted,
      icon: ShieldCheck,
      variant: "outline" as BadgeVariant,
    },
    {
      label: "Evidence",
      value: `${summary.evidenceLinked}/${summary.totalWallets}`,
      icon: FileSearch,
      variant: "outline" as BadgeVariant,
    },
    {
      label: "Alerts",
      value: alertItemCount,
      icon: AlertTriangle,
      variant: alertItemCount > 0 ? ("secondary" as BadgeVariant) : ("outline" as BadgeVariant),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 rounded-lg border bg-card p-2 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="flex min-w-0 items-center justify-between gap-2 rounded-md bg-muted/35 px-3 py-2">
            <div className="min-w-0">
              <div className="truncate text-[11px] uppercase tracking-wide text-muted-foreground">{item.label}</div>
              <div className="truncate text-lg font-semibold leading-tight">{item.value}</div>
            </div>
            <Badge variant={item.variant} className="shrink-0 px-2">
              <Icon className="h-3.5 w-3.5" />
            </Badge>
          </div>
        );
      })}
    </div>
  );
}

function InfoBlock({ label, value, mono = false }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={mono ? "break-all font-mono text-xs [overflow-wrap:anywhere]" : "break-words font-medium"}>
        {value}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
        <Ban className="h-5 w-5" />
        {message}
      </div>
    </div>
  );
}

function WalletAddress({
  address,
  chainId,
  compact = false,
}: {
  address: string;
  chainId?: string;
  compact?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="truncate font-mono text-xs" title={address}>
          {shortWallet(address)}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label={`Copy wallet ${shortWallet(address)}`}
          onClick={() => void copyWalletAddress(address)}
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>
      {chainId && (
        <div className={`mt-1 flex items-center gap-1 text-muted-foreground ${compact ? "text-[11px]" : "text-xs"}`}>
          <WalletCards className="h-3.5 w-3.5" />
          <span className="truncate">{chainId}</span>
        </div>
      )}
    </div>
  );
}

function NextActionBlock({ item, compact = false }: { item: AdmissionRegisterRow; compact?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-muted-foreground">Next Action</div>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <Badge variant={item.nextAction.variant}>{item.nextAction.label}</Badge>
      </div>
      <div className={`${compact ? "mt-1 text-xs" : "mt-2 text-sm"} break-words text-muted-foreground`}>
        {item.nextAction.detail}
      </div>
    </div>
  );
}

function PriorityAdmissionsQueue({
  rows,
  renderActions,
}: {
  rows: AdmissionRegisterRow[];
  renderActions: (row: AdmissionRow) => ReactNode;
}) {
  if (rows.length === 0) {
    return <EmptyState message="No priority admission items right now." />;
  }

  return (
    <div className="space-y-2">
      {rows.map((item) => {
        const { row } = item;
        return (
          <div key={row.wallet.walletLinkId} className="rounded-lg border p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{row.account.holderName}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge variant={riskVariant(item.risk)}>{item.risk}</Badge>
                  <Badge variant={statusVariant(row.requestLabel)}>{row.requestLabel}</Badge>
                </div>
                <div className="mt-2 break-words text-xs text-muted-foreground">
                  {item.alertReasons[0] || item.nextAction.detail}
                </div>
              </div>
              <div className="shrink-0 text-right text-xs text-muted-foreground">
                {formatDate(item.lastActivityAt)}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">{renderActions(row)}</div>
          </div>
        );
      })}
    </div>
  );
}

function AdmissionAlertsPanel({ alerts }: { alerts: AdmissionAlert[] }) {
  if (alerts.length === 0) {
    return <EmptyState message="No admission alerts or exceptions." />;
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div key={alert.id} className="rounded-lg border p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium">{alert.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">{alert.detail}</div>
            </div>
            <Badge variant={alert.severity}>{alert.rows.length}</Badge>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {alert.rows.slice(0, 4).map((item) => (
              <Badge key={`${alert.id}-${item.row.wallet.walletLinkId}`} variant="outline" className="max-w-full truncate">
                {item.row.account.holderName}
              </Badge>
            ))}
            {alert.rows.length > 4 && (
              <Badge variant="secondary">+{alert.rows.length - 4}</Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function AdmissionRemediationQueue({
  tasks,
  rowByWalletLinkId,
  onComplete,
}: {
  tasks: AdmissionRemediationTask[];
  rowByWalletLinkId: Map<string, AdmissionRow>;
  onComplete: (task: AdmissionRemediationTask) => void;
}) {
  if (tasks.length === 0) {
    return <EmptyState message="No open User Management remediation requests." />;
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {tasks.map((task) => {
          const row = rowByWalletLinkId.get(task.walletLinkId);
          return (
            <div key={task.taskId} className="rounded-lg border p-4 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium">{task.actionLabel}</div>
                  <div className="mt-1 break-words text-xs text-muted-foreground">{task.reason}</div>
                </div>
                <Badge variant={statusVariant(task.status)}>{task.status}</Badge>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <InfoBlock label="Holder" value={row?.account.holderName || task.registerAccountId} />
                <InfoBlock label="Owner / Due" value={`${task.responsibleParty} / ${formatDate(task.dueAt)}`} />
                <InfoBlock label="Fund / Class" value={`${row?.fundName || task.fundId} / ${task.classId}`} />
                <InfoBlock label="Request ID" value={task.taskId} mono />
              </div>
              <Button className="mt-4 w-full" size="sm" variant="outline" onClick={() => onComplete(task)}>
                <CheckCircle2 className="h-4 w-4" />
                Complete
              </Button>
            </div>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <Table className="min-w-[900px] table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[20%]">Request</TableHead>
              <TableHead className="w-[20%]">Holder</TableHead>
              <TableHead className="w-[18%]">Owner</TableHead>
              <TableHead className="w-[28%]">Reason</TableHead>
              <TableHead className="w-[14%] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => {
              const row = rowByWalletLinkId.get(task.walletLinkId);
              return (
                <TableRow key={task.taskId}>
                  <TableCell className="whitespace-normal align-top">
                    <div className="font-medium">{task.actionLabel}</div>
                    <div className="mt-1 break-all font-mono text-xs text-muted-foreground">{task.taskId}</div>
                    <Badge className="mt-2" variant={statusVariant(task.status)}>{task.status}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-normal align-top">
                    <div className="truncate font-medium">{row?.account.holderName || task.registerAccountId}</div>
                    <div className="mt-1 font-mono text-xs text-muted-foreground">{task.registerAccountId}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{row?.fundName || task.fundId}</div>
                  </TableCell>
                  <TableCell className="whitespace-normal align-top">
                    <div className="font-medium">{task.responsibleParty}</div>
                    <div className="mt-1 text-xs text-muted-foreground">Due {formatDate(task.dueAt)}</div>
                  </TableCell>
                  <TableCell className="whitespace-normal align-top">
                    <div className="break-words text-sm">{task.reason}</div>
                  </TableCell>
                  <TableCell className="text-right align-top">
                    <Button size="sm" variant="outline" onClick={() => onComplete(task)}>
                      <CheckCircle2 className="h-4 w-4" />
                      Complete
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function AdmissionsRegisterRows({
  rows,
  renderActions,
}: {
  rows: AdmissionRegisterRow[];
  renderActions: (row: AdmissionRow) => ReactNode;
}) {
  return (
    <>
      <div className="space-y-3 md:hidden">
        {rows.map((item) => {
          const { row } = item;
          return (
            <div key={row.wallet.walletLinkId} className="rounded-lg border p-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">{row.account.holderName}</div>
                  <div className="truncate font-mono text-xs text-muted-foreground">{row.account.registerAccountId}</div>
                </div>
                <Badge variant={riskVariant(item.risk)}>{item.risk}</Badge>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">Wallet</div>
                  <div className="mt-1">
                    <WalletAddress address={row.wallet.walletAddress} chainId={row.wallet.chainId} />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Status</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Badge variant={statusVariant(row.wallet.proofStatus)}>{row.wallet.proofStatus}</Badge>
                    <Badge variant={statusVariant(row.wallet.whitelistStatus)}>{row.wallet.whitelistStatus}</Badge>
                  </div>
                </div>
                <NextActionBlock item={item} compact />
              </div>

              <div className="mt-3">{renderActions(row)}</div>
            </div>
          );
        })}
        {rows.length === 0 && <EmptyState message="No wallet admission record matches this view." />}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <Table className="min-w-[980px] table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[22%]">Holder</TableHead>
            <TableHead className="w-[10%]">Risk</TableHead>
            <TableHead className="w-[16%]">Status</TableHead>
            <TableHead className="w-[24%]">Blocker / Next Action</TableHead>
            <TableHead className="w-[12%]">Evidence</TableHead>
            <TableHead className="w-[16%] min-w-[200px]">Command</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((item) => {
            const { row } = item;
            return (
              <TableRow key={row.wallet.walletLinkId}>
              <TableCell className="whitespace-normal align-top">
                <div className="truncate font-medium">{row.account.holderName}</div>
                <div className="font-mono text-xs text-muted-foreground">{row.account.registerAccountId}</div>
                <div className="mt-2">
                  <WalletAddress address={row.wallet.walletAddress} chainId={row.wallet.chainId} compact />
                </div>
              </TableCell>
              <TableCell className="whitespace-normal align-top">
                <Badge variant={riskVariant(item.risk)}>{item.risk}</Badge>
                <div className="mt-2 text-xs text-muted-foreground">{formatDate(item.lastActivityAt)}</div>
              </TableCell>
              <TableCell className="whitespace-normal align-top">
                <div className="flex flex-wrap gap-1">
                  <Badge variant={statusVariant(row.requestLabel)}>{row.requestLabel}</Badge>
                  <Badge variant={statusVariant(row.wallet.proofStatus)}>{row.wallet.proofStatus}</Badge>
                  <Badge variant={statusVariant(row.wallet.whitelistStatus)}>{row.wallet.whitelistStatus}</Badge>
                </div>
                <div className="mt-2 truncate text-xs text-muted-foreground">{row.fundName} / {row.account.classId}</div>
              </TableCell>
              <TableCell className="whitespace-normal align-top">
                <NextActionBlock item={item} compact />
              </TableCell>
              <TableCell className="whitespace-normal align-top">
                <div className="truncate text-sm font-medium">
                  {row.proofEvidence?.label || row.wallet.proofRefId || "Missing proof"}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {row.relatedEvidence.length} linked
                </div>
              </TableCell>
              <TableCell className="whitespace-normal align-top">{renderActions(row)}</TableCell>
            </TableRow>
            );
          })}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-12">
                <EmptyState message="No wallet admission record matches this view." />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
    </>
  );
}

function DetailItem({ label, children, mono = false }: { label: string; children: ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div
        className={
          mono
            ? "mt-1 whitespace-normal break-all font-mono text-xs [overflow-wrap:anywhere]"
            : "mt-1 break-words text-sm font-medium"
        }
      >
        {children}
      </div>
    </div>
  );
}

const remediationResponsibleParties: AdmissionRemediationResponsibleParty[] = [
  "Investor",
  "Distributor",
  "Compliance",
  "Issuer",
  "TA Ops",
];

function defaultRemediationParty(actionLabel?: string): AdmissionRemediationResponsibleParty {
  if (actionLabel === "Review Restriction") return "Compliance";
  if (actionLabel === "Request KYC Proof" || actionLabel === "Request Proof Refresh") return "Investor";
  return "TA Ops";
}

function RemediationRequestSheetContent({
  command,
  onCancel,
  onConfirm,
}: {
  command: SelectedRemediationCommand;
  onCancel: () => void;
  onConfirm: (input: { responsibleParty: AdmissionRemediationResponsibleParty; dueAt?: string }) => void;
}) {
  const { row, readiness } = command;
  const [responsibleParty, setResponsibleParty] = useState<AdmissionRemediationResponsibleParty>(
    defaultRemediationParty(readiness.actionLabel),
  );
  const [dueDate, setDueDate] = useState("");
  const existingOpenTask = row.openRemediationTasks.find(
    (task) => task.actionLabel === readiness.actionLabel || task.reason === readiness.reason,
  );
  const dueAt = dueDate ? `${dueDate}T18:00:00.000Z` : undefined;

  return (
    <SheetContent className="!w-full overflow-y-auto sm:!max-w-2xl">
      <SheetHeader className="border-b pr-12">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge variant={statusVariant(row.wallet.proofStatus)}>{row.wallet.proofStatus}</Badge>
          <Badge variant={statusVariant(row.account.accountStatus)}>{row.account.accountStatus}</Badge>
          {existingOpenTask ? <Badge variant="secondary">Already open</Badge> : null}
        </div>
        <SheetTitle>{readiness.actionLabel || "Resolve admission evidence"}</SheetTitle>
        <SheetDescription>
          Create a User Management request before this wallet can move to whitelist approval.
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-5 py-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailItem label="Holder">{row.account.holderName}</DetailItem>
          <DetailItem label="Register Account" mono>{row.account.registerAccountId}</DetailItem>
          <DetailItem label="Wallet" mono>{row.wallet.walletAddress}</DetailItem>
          <DetailItem label="Fund / Class">{row.fundName} / {row.account.classId}</DetailItem>
        </div>

        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="text-sm font-medium">Approval Blocker</div>
          <div className="mt-2 text-sm text-muted-foreground">{readiness.reason}</div>
        </div>

        {existingOpenTask ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <div className="font-medium">Existing request</div>
            <div className="mt-1">
              {existingOpenTask.taskId} is assigned to {existingOpenTask.responsibleParty} and due{" "}
              {formatDate(existingOpenTask.dueAt)}.
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="mb-2 text-sm font-medium">Responsible party</div>
              <Select
                value={responsibleParty}
                onValueChange={(value) => setResponsibleParty(value as AdmissionRemediationResponsibleParty)}
              >
                <SelectTrigger aria-label="Responsible party">
                  <SelectValue placeholder="Responsible party" />
                </SelectTrigger>
                <SelectContent>
                  {remediationResponsibleParties.map((party) => (
                    <SelectItem key={party} value={party}>{party}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="mb-2 text-sm font-medium">Due date</div>
              <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            </div>
          </div>
        )}
      </div>

      <SheetFooter className="border-t pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={() => onConfirm({ responsibleParty, dueAt })}
          disabled={Boolean(existingOpenTask)}
        >
          <RefreshCw className="h-4 w-4" />
          {existingOpenTask ? "Request Open" : "Create Request"}
        </Button>
      </SheetFooter>
    </SheetContent>
  );
}

function WalletActionSheetContent({
  command,
  onCancel,
  onConfirm,
}: {
  command: SelectedWalletCommand;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { action, row } = command;
  const meta = getActionMeta(action);
  const evidence = row.proofEvidence;
  const kycEvidence = row.kycEvidence || evidence;
  const approveBlocked = action === "approve" && !canApproveAdmission(row);

  return (
    <SheetContent className="!w-full overflow-y-auto sm:!max-w-2xl">
      <SheetHeader className="border-b pr-12">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge variant={statusVariant(row.requestLabel)}>{row.requestLabel}</Badge>
          <Badge variant="outline">Version {row.wallet.version}</Badge>
        </div>
        <SheetTitle>{meta.title}</SheetTitle>
        <SheetDescription>{meta.description}</SheetDescription>
      </SheetHeader>

      <div className="space-y-4 px-4 pb-2">
        <section className="rounded-lg border p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <UserCheck className="h-4 w-4 text-muted-foreground" />
            Holder & Account
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailItem label="Holder">{row.account.holderName}</DetailItem>
            <DetailItem label="Holder ID" mono>
              {row.account.holderId}
            </DetailItem>
            <DetailItem label="Account" mono>
              {row.account.registerAccountId}
            </DetailItem>
            <DetailItem label="Account Status">
              <Badge variant={statusVariant(row.account.accountStatus)}>{row.account.accountStatus}</Badge>
            </DetailItem>
            <DetailItem label="Fund / Class">
              {row.fundName} / {row.account.classId}
            </DetailItem>
            <DetailItem label="Holding Status">
              {row.account.units} units · {row.latestPosition?.included === false ? "Excluded from latest snapshot" : "Included or pending snapshot"}
            </DetailItem>
          </div>
        </section>

        <section className="rounded-lg border p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <WalletCards className="h-4 w-4 text-muted-foreground" />
            Wallet & Proof
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailItem label="Wallet Address" mono>
              {row.wallet.walletAddress}
            </DetailItem>
            <DetailItem label="Chain">{row.wallet.chainId}</DetailItem>
            <DetailItem label="Proof Status">
              <Badge variant={statusVariant(row.wallet.proofStatus)}>{row.wallet.proofStatus}</Badge>
            </DetailItem>
            <DetailItem label="Whitelist Status">
              <Badge variant={statusVariant(row.wallet.whitelistStatus)}>{row.wallet.whitelistStatus}</Badge>
            </DetailItem>
            <DetailItem label="Proof Reference" mono>
              {row.wallet.proofRefId || "Missing proof reference"}
            </DetailItem>
            <DetailItem label="Verified At">{formatDate(row.wallet.verifiedAt)}</DetailItem>
          </div>
        </section>

        <section className="rounded-lg border p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <FileSearch className="h-4 w-4 text-muted-foreground" />
            Evidence Record
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailItem label="Evidence Record" mono>
              {evidence?.evidenceRefId || row.wallet.proofRefId || "Missing proof reference"}
            </DetailItem>
            <DetailItem label="Evidence Label">
              {evidence?.label || `No EvidenceRecord found for ${row.wallet.proofRefId || "this wallet"}`}
            </DetailItem>
            <DetailItem label="Evidence Type">{evidence?.evidenceType || "Fallback proofRefId"}</DetailItem>
            <DetailItem label="Retention">{evidence?.retentionClass || "Not recorded"}</DetailItem>
            <DetailItem label="Created">{formatDate(evidence?.createdAt)}</DetailItem>
            <DetailItem label="Related Evidence">{row.relatedEvidence.length} record(s)</DetailItem>
          </div>
        </section>

        <section className="rounded-lg border p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            KYC / Source
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailItem label="KYC Reference" mono>
              {kycEvidence?.evidenceRefId || row.wallet.proofRefId || "Missing KYC reference"}
            </DetailItem>
            <DetailItem label="Source Actor">{evidenceActor(kycEvidence)}</DetailItem>
            <DetailItem label="Storage" mono>
              {evidenceStorage(kycEvidence)}
            </DetailItem>
            <DetailItem label="Hash" mono>
              {evidenceHash(kycEvidence)}
            </DetailItem>
          </div>
        </section>

        <section className="rounded-lg border p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            {action === "approve" ? (
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground" />
            )}
            Decision Impact
          </div>
          <div className="space-y-2">
            {meta.impact.map((impact) => (
              <div key={impact} className="flex gap-2 text-sm">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{impact}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <SheetFooter className="border-t">
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant={actionButtonVariant(action)}
            disabled={approveBlocked}
            title={approveBlocked ? getApproveBlockReason(row) : undefined}
            onClick={onConfirm}
          >
            {meta.buttonLabel}
          </Button>
        </div>
      </SheetFooter>
    </SheetContent>
  );
}
