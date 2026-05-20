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

import { MetricCard } from "../components/MetricCard";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useApp } from "../context/AppContext";
import type {
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
};

type SelectedWalletCommand = {
  action: WalletAction;
  row: AdmissionRow;
};

type ApprovalReadiness = {
  ready: boolean;
  reason?: string;
  actionLabel?: string;
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

function canApproveAdmission(row: AdmissionRow) {
  if (row.wallet.proofStatus === "Missing") return false;
  if (row.wallet.proofStatus === "Expired") return false;
  if (row.wallet.proofStatus === "Rejected") return false;
  if (["Removed", "Suspended"].includes(row.wallet.whitelistStatus)) return false;
  if (["Restricted", "Suspended", "Closed"].includes(row.account.accountStatus)) return false;
  return Boolean(row.wallet.proofRefId);
}

function getApproveBlockReason(row: AdmissionRow) {
  if (row.wallet.proofStatus === "Missing") return "KYC proof is required before this wallet can be approved.";
  if (row.wallet.proofStatus === "Expired") return "Expired proof must be refreshed before approval.";
  if (row.wallet.proofStatus === "Rejected") return "Rejected proof cannot be approved without a new submission.";
  if (["Removed", "Suspended"].includes(row.wallet.whitelistStatus)) return "Suspended or removed wallets require remediation before approval.";
  if (["Restricted", "Suspended", "Closed"].includes(row.account.accountStatus)) {
    return "Restricted, suspended, or closed holder accounts must be resolved before approval.";
  }
  return "Proof evidence is required before this wallet can be approved.";
}

function getApprovalReadiness(row: AdmissionRow): ApprovalReadiness {
  if (canApproveAdmission(row)) return { ready: true };
  if (row.wallet.proofStatus === "Expired") {
    return {
      ready: false,
      reason: getApproveBlockReason(row),
      actionLabel: "Request Proof Refresh",
    };
  }
  if (row.wallet.proofStatus === "Missing") {
    return {
      ready: false,
      reason: getApproveBlockReason(row),
      actionLabel: "Request KYC Proof",
    };
  }
  if (["Restricted", "Suspended", "Closed"].includes(row.account.accountStatus)) {
    return {
      ready: false,
      reason: getApproveBlockReason(row),
      actionLabel: "Review Restriction",
    };
  }
  return {
    ready: false,
    reason: getApproveBlockReason(row),
    actionLabel: "Resolve Evidence",
  };
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
    row.openTaskCount > 0
  );
}

function getLastActivityAt(row: AdmissionRow) {
  return (
    row.wallet.lastActionAt ||
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
  if (isAwaitingTAReview(row) || row.openTaskCount > 0) return "Watch";
  return "Standard";
}

function getNextAction(row: AdmissionRow): NextAction {
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
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function TransferAgentAdmissions() {
  const {
    approveWalletLink,
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
          };
        })
        .filter((item): item is AdmissionRow => Boolean(item)),
    [
      accountById,
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

  const openActionSheet = (action: WalletAction, row: AdmissionRow) => {
    if (action === "approve" && !canApproveAdmission(row)) {
      toast.error(getApproveBlockReason(row));
      return;
    }
    setSelectedCommand({ action, row });
  };

  const renderActions = (row: AdmissionRow) => {
    const { account, wallet } = row;
    const approvalReadiness = getApprovalReadiness(row);
    if (wallet.whitelistStatus === "Whitelisted") {
      return (
        <Button size="sm" variant="destructive" onClick={() => openActionSheet("remove", row)}>
          Remove
        </Button>
      );
    }

    if (wallet.whitelistStatus === "Pending" || wallet.proofStatus === "Submitted" || account.accountStatus === "Pending") {
      return (
        <div className="flex flex-wrap gap-2">
          {approvalReadiness.ready ? (
            <Button size="sm" onClick={() => openActionSheet("approve", row)}>
              Approve
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled title={approvalReadiness.reason}>
              <RefreshCw className="mr-1 h-3.5 w-3.5" />
              {approvalReadiness.actionLabel}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => openActionSheet("reject", row)}>
            Reject
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap gap-2">
        {approvalReadiness.ready ? (
          <Button size="sm" onClick={() => openActionSheet("approve", row)}>
            Approve
          </Button>
        ) : (
          <Button size="sm" variant="outline" disabled title={approvalReadiness.reason}>
            <RefreshCw className="mr-1 h-3.5 w-3.5" />
            {approvalReadiness.actionLabel}
          </Button>
        )}
        {wallet.whitelistStatus !== "Removed" && (
          <Button size="sm" variant="destructive" onClick={() => openActionSheet("remove", row)}>
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

  const renderRegisterRows = () => (
    <AdmissionsRegisterRows rows={visibleRegisterRows} renderActions={renderActions} />
  );

  return (
    <div className="container mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline">Book of Record</Badge>
            <Badge variant="secondary">Admissions</Badge>
          </div>
          <h1 style={{ fontFamily: "var(--font-heading)" }}>User Management / Admissions</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Review wallet admission risk, proof evidence, and whitelist actions before they affect the register.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[380px]">
          <div className="rounded-lg border bg-card p-3">
            <div className="text-xs text-muted-foreground">Active holders</div>
            <div className="mt-1 text-2xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
              {admissionSummary.holderCount}
            </div>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <div className="text-xs text-muted-foreground">Registered units</div>
            <div className="mt-1 truncate text-2xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
              {formatUnits(admissionSummary.totalUnits)}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard icon={Clock3} label="Needs Review" value={admissionSummary.needsReview} variant="warning" />
        <MetricCard icon={CheckCircle2} label="Ready To Approve" value={admissionSummary.readyToApprove} variant="success" />
        <MetricCard icon={ShieldCheck} label="Whitelisted Wallets" value={admissionSummary.whitelisted} variant="primary" />
        <MetricCard
          icon={FileSearch}
          label="Evidence Linked"
          value={`${admissionSummary.evidenceLinked}/${admissionSummary.totalWallets}`}
        />
        <MetricCard
          icon={AlertTriangle}
          label="Alerts"
          value={alertItemCount}
          variant="warning"
        />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <Card className="min-w-0">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                Priority Admissions Queue
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Highest-risk wallet admissions, ordered by review state and exception pressure.
              </p>
            </div>
            <Badge variant="outline">{priorityQueue.length} queued</Badge>
          </CardHeader>
          <CardContent>
            <PriorityAdmissionsQueue rows={priorityQueue} renderActions={renderActions} />
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="flex flex-col gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                Alerts & Exceptions
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Proof, restriction, and workflow items that can block admission decisions.
              </p>
            </div>
            <Badge variant="outline">{alertItemCount} items</Badge>
          </CardHeader>
          <CardContent>
            <AdmissionAlertsPanel alerts={alerts} />
          </CardContent>
        </Card>
      </div>

      <Card className="min-w-0">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileSearch className="h-4 w-4" />
              Admissions Register
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Search holder, wallet, fund, or status across the full admissions record.
            </p>
          </div>
          <Badge variant="outline">{visibleRegisterRows.length} shown</Badge>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-9"
                placeholder="Search holder, wallet, fund, or status"
              />
            </div>
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

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AdmissionTab)} className="gap-4">
            <TabsList className="max-w-full justify-start overflow-x-auto">
              <TabsTrigger value="all">All ({registerTabCounts.all})</TabsTrigger>
              <TabsTrigger value="needsReview">Needs Review ({registerTabCounts.needsReview})</TabsTrigger>
              <TabsTrigger value="whitelisted">Whitelisted ({registerTabCounts.whitelisted})</TabsTrigger>
              <TabsTrigger value="restricted">Restricted ({registerTabCounts.restricted})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              {renderRegisterRows()}
            </TabsContent>
            <TabsContent value="needsReview" className="mt-4">
              {renderRegisterRows()}
            </TabsContent>
            <TabsContent value="whitelisted" className="mt-4">
              {renderRegisterRows()}
            </TabsContent>
            <TabsContent value="restricted" className="mt-4">
              {renderRegisterRows()}
            </TabsContent>
          </Tabs>
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
    <div className="space-y-3">
      {rows.map((item) => {
        const { row } = item;
        return (
          <div key={row.wallet.walletLinkId} className="rounded-lg border p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={riskVariant(item.risk)}>{item.risk} risk</Badge>
                  <Badge variant={statusVariant(row.requestLabel)}>{row.requestLabel}</Badge>
                  {item.alertReasons.slice(0, 2).map((reason) => (
                    <Badge key={reason} variant="outline">
                      {reason}
                    </Badge>
                  ))}
                </div>

                <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold">{row.account.holderName}</div>
                    <div className="truncate font-mono text-xs text-muted-foreground">
                      {row.account.registerAccountId}
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <InfoBlock label="Fund / Class" value={`${row.fundName} / ${row.account.classId}`} />
                      <InfoBlock
                        label="Evidence"
                        value={row.proofEvidence?.label || row.wallet.proofRefId || "Missing proof"}
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <NextActionBlock item={item} />
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground">Wallet</div>
                      <div className="mt-1">
                        <WalletAddress address={row.wallet.walletAddress} chainId={row.wallet.chainId} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2 xl:justify-end">{renderActions(row)}</div>
            </div>
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
          <div className="mt-3 space-y-2">
            {alert.rows.slice(0, 3).map((item) => (
              <div key={`${alert.id}-${item.row.wallet.walletLinkId}`} className="rounded-md bg-muted/40 p-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{item.row.account.holderName}</div>
                    <div className="mt-1">
                      <WalletAddress address={item.row.wallet.walletAddress} chainId={item.row.wallet.chainId} compact />
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">Next: {item.nextAction.label}</div>
                  </div>
                  <Badge variant={riskVariant(item.risk)}>{item.risk}</Badge>
                </div>
              </div>
            ))}
            {alert.rows.length > 3 && (
              <div className="px-1 text-xs text-muted-foreground">+{alert.rows.length - 3} more in the register</div>
            )}
          </div>
        </div>
      ))}
    </div>
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
            <div key={row.wallet.walletLinkId} className="rounded-lg border p-4 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">{row.account.holderName}</div>
                  <div className="truncate font-mono text-xs text-muted-foreground">{row.account.registerAccountId}</div>
                </div>
                <Badge variant={riskVariant(item.risk)}>{item.risk}</Badge>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <InfoBlock label="Fund / Class" value={`${row.fundName} / ${row.account.classId}`} />
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

              <div className="mt-4">{renderActions(row)}</div>
            </div>
          );
        })}
        {rows.length === 0 && <EmptyState message="No wallet admission record matches this view." />}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <Table className="min-w-[1080px] table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[13%]">Risk</TableHead>
            <TableHead className="w-[17%]">Holder</TableHead>
            <TableHead className="w-[15%]">Wallet</TableHead>
            <TableHead className="w-[15%]">Fund / Class</TableHead>
            <TableHead className="w-[14%]">Status</TableHead>
            <TableHead className="w-[17%]">Next Action</TableHead>
            <TableHead className="w-[9%]">Command</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((item) => {
            const { row } = item;
            return (
              <TableRow key={row.wallet.walletLinkId}>
              <TableCell className="whitespace-normal align-top">
                <div className="flex flex-wrap gap-1">
                  <Badge variant={riskVariant(item.risk)}>{item.risk}</Badge>
                  <Badge variant={statusVariant(row.requestLabel)}>{row.requestLabel}</Badge>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">{formatDate(item.lastActivityAt)}</div>
              </TableCell>
              <TableCell className="whitespace-normal align-top">
                <div className="truncate font-medium">{row.account.holderName}</div>
                <div className="font-mono text-xs text-muted-foreground">{row.account.registerAccountId}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge variant={statusVariant(row.account.accountStatus)}>{row.account.accountStatus}</Badge>
                  <Badge variant="outline">{row.account.holderType}</Badge>
                </div>
              </TableCell>
              <TableCell className="whitespace-normal align-top">
                <WalletAddress address={row.wallet.walletAddress} chainId={row.wallet.chainId} />
              </TableCell>
              <TableCell className="whitespace-normal align-top">
                <div className="truncate font-medium">{row.fundName}</div>
                <div className="text-xs text-muted-foreground">{row.account.classId}</div>
                <div className="mt-1 text-xs text-muted-foreground">{row.account.units} units</div>
              </TableCell>
              <TableCell className="whitespace-normal align-top">
                <div className="flex flex-wrap gap-1">
                  <Badge variant={statusVariant(row.wallet.proofStatus)}>{row.wallet.proofStatus}</Badge>
                  <Badge variant={statusVariant(row.wallet.whitelistStatus)}>{row.wallet.whitelistStatus}</Badge>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {item.alertReasons.join(", ") || row.admissionState}
                </div>
              </TableCell>
              <TableCell className="whitespace-normal align-top">
                <NextActionBlock item={item} compact />
              </TableCell>
              <TableCell className="whitespace-normal align-top">{renderActions(row)}</TableCell>
            </TableRow>
            );
          })}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="py-12">
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
