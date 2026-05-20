import { useDeferredValue, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Archive,
  Copy,
  FileCheck2,
  FileClock,
  Fingerprint,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { MetricCard } from "../components/MetricCard";
import { SnapshotReviewPanel } from "../components/transfer-agent/SnapshotReviewPanel";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
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
  SheetHeader,
  SheetTitle,
} from "../components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useApp } from "../context/AppContext";
import { getLatestRegisterVersion } from "../lib/transferAgency";
import { cn } from "../components/ui/utils";
import type { AnchoringEvent, EvidenceRecord, HolderSnapshot, RegisterDelta } from "../data/fundDemoData";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";
type FundPickerFilter = "all" | "open-end" | "closed-end" | "with-snapshots" | "with-anchors";

function statusVariant(status?: string): BadgeVariant {
  if (!status) return "outline";
  if (["Rejected", "Failed", "Voided", "Closed", "Suspended", "Restricted", "Held"].includes(status)) {
    return "destructive";
  }
  if (["Draft", "PendingChecker", "Pending", "Requested", "Locked", "SubmittedToIssuer", "Generated"].includes(status)) {
    return "secondary";
  }
  if (["Released", "Posted", "Reconciled", "IssuerAcknowledged", "Acknowledged", "Confirmed"].includes(status)) {
    return "default";
  }
  return "outline";
}

function retentionVariant(retentionClass?: string): BadgeVariant {
  if (retentionClass === "Regulatory") return "default";
  if (retentionClass === "Audit") return "secondary";
  return "outline";
}

function deltaStatus(delta: RegisterDelta) {
  return `${delta.makerStatus} / ${delta.checkerStatus} / ${delta.postingStatus}`;
}

function parseUnits(value?: string) {
  if (!value) return 0;
  const match = value.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function formatUnits(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value?: string) {
  if (!value) return "Pending";
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function sortByDateDesc<T>(items: T[], getDate: (item: T) => string | undefined) {
  return [...items].sort((left, right) => (getDate(right) || "").localeCompare(getDate(left) || ""));
}

function matchesQuery(parts: Array<string | number | undefined>, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;
  return parts.join(" ").toLowerCase().includes(normalizedQuery);
}

function snapshotLabel(snapshot: HolderSnapshot) {
  return snapshot.sourceType === "Distribution" ? "Record-date snapshot" : "Cutoff snapshot";
}

function normalizeSnapshotKey(value?: string) {
  return (value || "").trim().toLowerCase();
}

async function copySnapshotReference(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied.`);
  } catch {
    toast.error(`Could not copy ${label.toLowerCase()}.`);
  }
}

function SnapshotReferenceValue({
  label,
  value,
  muted = false,
}: {
  label: string;
  value?: string;
  muted?: boolean;
}) {
  if (!value) {
    return <div className="text-xs text-muted-foreground">Not assigned</div>;
  }

  return (
    <div className="flex min-w-0 items-start gap-1.5">
      <span className={cn("min-w-0 break-all font-mono text-xs", muted && "text-muted-foreground")}>{value}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        aria-label={`Copy ${label}`}
        title={`Copy ${label}`}
        onClick={(event) => {
          event.stopPropagation();
          void copySnapshotReference(value, label);
        }}
      >
        <Copy className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function SnapshotIdStack({
  snapshot,
  officialSnapshotId,
}: {
  snapshot: HolderSnapshot;
  officialSnapshotId?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div>
        <div className="text-[11px] font-medium uppercase text-muted-foreground">Official ID</div>
        <SnapshotReferenceValue label="Official snapshot ID" value={officialSnapshotId} />
      </div>
      <div>
        <div className="text-[11px] font-medium uppercase text-muted-foreground">Canonical ID</div>
        <SnapshotReferenceValue label="Canonical snapshot ID" value={snapshot.snapshotId} muted />
      </div>
    </div>
  );
}

function TraceabilityItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 min-w-0">{children}</div>
    </div>
  );
}

function getFundSortPriority(status: string) {
  const priorities: Record<string, number> = {
    "Active Dealing": 0,
    "Issuance Active": 1,
    "Initial Subscription": 2,
    "Open For Subscription": 3,
    "Snapshot Locked": 4,
    "Payment List Ready": 5,
    Paused: 6,
    Upcoming: 7,
    "Pending Allocation": 8,
    "Pending Approval": 9,
    Draft: 10,
  };

  return priorities[status] ?? 99;
}

export function HolderRegister() {
  const {
    fundIssuances,
    fundRedemptions,
    fundDistributions,
    transferAgencyInstructions,
    registerAccounts,
    registerDeltas,
    registerVersions,
    holderSnapshots,
    holderSnapshotPositions,
    settlementLists,
    settlementListLines,
    evidenceRecords,
    anchoringEvents,
  } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [fundQuery, setFundQuery] = useState("");
  const [fundFilter, setFundFilter] = useState<FundPickerFilter>("all");
  const [artifactQuery, setArtifactQuery] = useState("");
  const [selectedFundId, setSelectedFundId] = useState("");
  const [isFundSheetOpen, setIsFundSheetOpen] = useState(false);
  const [classFilter, setClassFilter] = useState("all");
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState(searchParams.get("snapshot") ? "snapshots" : "overview");
  const deferredFundQuery = useDeferredValue(fundQuery.trim().toLowerCase());

  const snapshotParam = searchParams.get("snapshot") || "";
  const fundNameById = useMemo(
    () => new Map(fundIssuances.map((fund) => [fund.id, fund.name])),
    [fundIssuances],
  );
  const snapshotById = useMemo(
    () => new Map(holderSnapshots.map((snapshot) => [snapshot.snapshotId, snapshot])),
    [holderSnapshots],
  );
  const officialSnapshotIdById = useMemo(() => {
    const officialIds = new Map<string, string>();

    holderSnapshots.forEach((snapshot) => {
      if (snapshot.officialSnapshotId) {
        officialIds.set(snapshot.snapshotId, snapshot.officialSnapshotId);
      }
    });

    fundRedemptions.forEach((redemption) => {
      const officialSnapshotId = redemption.transferAgentOps?.holderSnapshotId;
      const snapshot = holderSnapshots.find(
        (item) => item.fundId === redemption.fundId && item.sourceReference === redemption.id,
      );
      if (officialSnapshotId && snapshot) {
        officialIds.set(snapshot.snapshotId, officialSnapshotId);
      }
    });

    fundDistributions.forEach((distribution) => {
      const officialSnapshotId = distribution.transferAgentOps?.holderSnapshotId;
      const snapshot = holderSnapshots.find(
        (item) => item.fundId === distribution.fundId && item.sourceReference === distribution.id,
      );
      if (officialSnapshotId && snapshot) {
        officialIds.set(snapshot.snapshotId, officialSnapshotId);
      }
    });

    return officialIds;
  }, [fundDistributions, fundRedemptions, holderSnapshots]);
  const getOfficialSnapshotId = (snapshot?: HolderSnapshot) =>
    snapshot ? officialSnapshotIdById.get(snapshot.snapshotId) || snapshot.officialSnapshotId : undefined;
  const instructionById = useMemo(
    () => new Map(transferAgencyInstructions.map((instruction) => [instruction.instructionId, instruction])),
    [transferAgencyInstructions],
  );
  const evidenceById = useMemo(
    () => new Map(evidenceRecords.map((record) => [record.evidenceRefId, record])),
    [evidenceRecords],
  );
  const snapshotAliasById = useMemo(() => {
    const aliases = new Map<string, string>();

    holderSnapshots.forEach((snapshot) => {
      aliases.set(normalizeSnapshotKey(snapshot.snapshotId), snapshot.snapshotId);
    });

    officialSnapshotIdById.forEach((officialSnapshotId, snapshotId) => {
      aliases.set(normalizeSnapshotKey(officialSnapshotId), snapshotId);
    });

    return aliases;
  }, [holderSnapshots, officialSnapshotIdById]);

  const fundEvidenceByFund = useMemo(() => {
    const result = new Map<string, { records: EvidenceRecord[]; anchors: AnchoringEvent[] }>();

    fundIssuances.forEach((fund) => {
      const fundInstructions = transferAgencyInstructions.filter((instruction) => instruction.fundId === fund.id);
      const fundDeltas = registerDeltas.filter((delta) => delta.fundId === fund.id);
      const fundVersions = registerVersions.filter((version) => version.fundId === fund.id);
      const fundSnapshots = holderSnapshots.filter((snapshot) => snapshot.fundId === fund.id);
      const fundSnapshotIds = new Set(fundSnapshots.map((snapshot) => snapshot.snapshotId));
      const fundLists = settlementLists.filter((list) => fundSnapshotIds.has(list.snapshotId));
      const fundListIds = new Set(fundLists.map((list) => list.listId));
      const fundLines = settlementListLines.filter((line) => fundListIds.has(line.listId));
      const deltaIds = new Set(fundDeltas.map((delta) => delta.deltaId));
      const instructionIds = new Set([
        ...fundInstructions.map((instruction) => instruction.instructionId),
        ...fundDeltas.map((delta) => delta.instructionId),
        ...fundSnapshots.map((snapshot) => snapshot.instructionId),
      ]);
      const instructionEvidenceIds = new Set(fundInstructions.flatMap((instruction) => instruction.evidenceRefIds));
      const lineEvidenceIds = new Set(fundLines.flatMap((line) => line.evidenceRefIds));
      const targetIds = new Set([
        ...fundVersions.map((version) => version.registerVersionId),
        ...fundSnapshots.map((snapshot) => snapshot.snapshotId),
        ...fundLists.map((list) => list.listId),
      ]);
      const sourceReferences = new Set([
        ...fundSnapshots.map((snapshot) => snapshot.sourceReference),
        ...fundDeltas.map((delta) => delta.instructionId),
        ...fundLists.map((list) => list.sourceReference),
        ...fundInstructions.map((instruction) => instruction.sourceReference || ""),
      ]);

      const records = evidenceRecords.filter(
        (record) =>
          record.fundId === fund.id ||
          (record.registerDeltaId ? deltaIds.has(record.registerDeltaId) : false) ||
          (record.instructionId ? instructionIds.has(record.instructionId) : false) ||
          instructionEvidenceIds.has(record.evidenceRefId) ||
          lineEvidenceIds.has(record.evidenceRefId),
      );
      const anchors = anchoringEvents.filter(
        (event) =>
          event.fundId === fund.id ||
          targetIds.has(event.targetId) ||
          sourceReferences.has(event.sourceReference),
      );

      result.set(fund.id, { records, anchors });
    });

    return result;
  }, [
    anchoringEvents,
    evidenceRecords,
    fundIssuances,
    holderSnapshots,
    registerDeltas,
    registerVersions,
    settlementListLines,
    settlementLists,
    transferAgencyInstructions,
  ]);

  const fundSummaries = useMemo(
    () =>
      fundIssuances.map((fund) => {
        const accounts = registerAccounts.filter((account) => account.fundId === fund.id);
        const versions = registerVersions.filter((version) => version.fundId === fund.id);
        const snapshots = holderSnapshots.filter((snapshot) => snapshot.fundId === fund.id);
        const snapshotIds = new Set(snapshots.map((snapshot) => snapshot.snapshotId));
        const lists = settlementLists.filter((list) => snapshotIds.has(list.snapshotId));
        const deltas = registerDeltas.filter((delta) => delta.fundId === fund.id);
        const evidence = fundEvidenceByFund.get(fund.id);
        const classIds = unique([
          ...accounts.map((account) => account.classId),
          ...versions.map((version) => version.classId),
          ...snapshots.map((snapshot) => snapshot.classId),
        ]);
        const latestVersion = sortByDateDesc(versions, (version) => version.releasedAt || version.effectiveAt)[0];

        return {
          fund,
          accounts,
          versions,
          snapshots,
          lists,
          deltas,
          classIds,
          latestVersion,
          totalUnits: accounts.reduce((sum, account) => sum + parseUnits(account.units), 0),
          evidenceCount: evidence?.records.length || 0,
          anchorCount: evidence?.anchors.length || 0,
        };
      }),
    [fundEvidenceByFund, fundIssuances, holderSnapshots, registerAccounts, registerDeltas, registerVersions, settlementLists],
  );

  useEffect(() => {
    if (!fundIssuances.length) return;
    if (snapshotParam) {
      const canonicalSnapshotId = snapshotAliasById.get(normalizeSnapshotKey(snapshotParam)) || snapshotParam;
      const deepLinkedSnapshot = snapshotById.get(canonicalSnapshotId);
      if (deepLinkedSnapshot) {
        setSelectedSnapshotId(deepLinkedSnapshot.snapshotId);
        setSelectedFundId(deepLinkedSnapshot.fundId);
        setClassFilter(deepLinkedSnapshot.classId);
        setActiveTab("snapshots");
        setIsFundSheetOpen(true);
      } else {
        setSelectedSnapshotId(undefined);
      }
      return;
    }

    setSelectedFundId((current) =>
      current && fundIssuances.some((fund) => fund.id === current) ? current : fundIssuances[0].id,
    );
  }, [fundIssuances, snapshotAliasById, snapshotById, snapshotParam]);

  const selectedFund = fundIssuances.find((fund) => fund.id === selectedFundId) || fundIssuances[0];
  const selectedSummary = selectedFund ? fundSummaries.find((summary) => summary.fund.id === selectedFund.id) : undefined;

  const filteredFundSummaries = useMemo(() => {
    return fundSummaries
      .filter((summary) => {
        if (fundFilter === "open-end" && summary.fund.fundType !== "Open-end") return false;
        if (fundFilter === "closed-end" && summary.fund.fundType !== "Closed-end") return false;
        if (fundFilter === "with-snapshots" && summary.snapshots.length === 0) return false;
        if (fundFilter === "with-anchors" && summary.anchorCount === 0) return false;

        if (!deferredFundQuery) return true;

        return [
          summary.fund.id,
          summary.fund.name,
          summary.fund.status,
          summary.fund.fundManager,
          summary.fund.assetCurrency,
          summary.fund.tokenName,
          summary.fund.tokenSymbol,
          summary.fund.legalStructure,
          summary.fund.assetStrategyCategory,
          ...summary.classIds,
          ...summary.snapshots.map((snapshot) => snapshot.snapshotId),
          ...summary.snapshots.map((snapshot) => officialSnapshotIdById.get(snapshot.snapshotId)),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(deferredFundQuery);
      })
      .sort((left, right) => {
        const statusGap = getFundSortPriority(left.fund.status) - getFundSortPriority(right.fund.status);
        if (statusGap !== 0) return statusGap;
        if (left.snapshots.length !== right.snapshots.length) return right.snapshots.length - left.snapshots.length;
        return left.fund.name.localeCompare(right.fund.name);
      });
  }, [deferredFundQuery, fundFilter, fundSummaries, officialSnapshotIdById]);

  const selectedClassIds = useMemo(() => {
    if (!selectedFund) return [];
    return unique([
      ...registerAccounts.filter((account) => account.fundId === selectedFund.id).map((account) => account.classId),
      ...registerVersions.filter((version) => version.fundId === selectedFund.id).map((version) => version.classId),
      ...holderSnapshots.filter((snapshot) => snapshot.fundId === selectedFund.id).map((snapshot) => snapshot.classId),
    ]);
  }, [holderSnapshots, registerAccounts, registerVersions, selectedFund]);

  useEffect(() => {
    if (classFilter !== "all" && selectedClassIds.length && !selectedClassIds.includes(classFilter)) {
      setClassFilter("all");
    }
  }, [classFilter, selectedClassIds]);

  const selectedEvidenceLayer = useMemo(() => {
    if (!selectedFund) return { records: [] as EvidenceRecord[], anchors: [] as AnchoringEvent[] };
    const layer = fundEvidenceByFund.get(selectedFund.id) || { records: [], anchors: [] };
    if (classFilter === "all") return layer;
    return {
      records: layer.records.filter((record) => !record.classId || record.classId === classFilter),
      anchors: layer.anchors.filter((event) => !event.classId || event.classId === classFilter),
    };
  }, [classFilter, fundEvidenceByFund, selectedFund]);

  const classSummaries = useMemo(() => {
    if (!selectedFund) return [];
    return selectedClassIds.map((classId) => {
      const accounts = registerAccounts.filter((account) => account.fundId === selectedFund.id && account.classId === classId);
      const versions = registerVersions.filter((version) => version.fundId === selectedFund.id && version.classId === classId);
      const snapshots = holderSnapshots.filter((snapshot) => snapshot.fundId === selectedFund.id && snapshot.classId === classId);
      const deltas = registerDeltas.filter((delta) => delta.fundId === selectedFund.id && delta.classId === classId);
      const latestVersion = getLatestRegisterVersion(registerVersions, selectedFund.id, classId);

      return {
        classId,
        accounts,
        versions,
        snapshots,
        deltas,
        latestVersion,
        totalUnits: accounts.reduce((sum, account) => sum + parseUnits(account.units), 0),
        pendingDeltas: deltas.filter((delta) => delta.postingStatus !== "Posted").length,
      };
    });
  }, [holderSnapshots, registerAccounts, registerDeltas, registerVersions, selectedClassIds, selectedFund]);

  const visibleVersions = useMemo(() => {
    if (!selectedFund) return [];
    return sortByDateDesc(
      registerVersions.filter(
        (version) =>
          version.fundId === selectedFund.id &&
          (classFilter === "all" || version.classId === classFilter) &&
          matchesQuery(
            [
              version.registerVersionId,
              version.classId,
              version.status,
              version.registerHash,
              version.releasedBy,
              fundNameById.get(version.fundId),
            ],
            artifactQuery,
          ),
      ),
      (version) => version.releasedAt || version.effectiveAt || version.createdAt,
    );
  }, [artifactQuery, classFilter, fundNameById, registerVersions, selectedFund]);

  const snapshotRows = useMemo(() => {
    if (!selectedFund) return [];
    return sortByDateDesc(
      holderSnapshots
        .filter(
          (snapshot) =>
            snapshot.fundId === selectedFund.id &&
            (classFilter === "all" || snapshot.classId === classFilter) &&
            matchesQuery(
              [
                snapshot.snapshotId,
                officialSnapshotIdById.get(snapshot.snapshotId),
                snapshot.sourceType,
                snapshot.sourceReference,
                snapshot.registerVersionId,
                snapshot.status,
                snapshot.classId,
                fundNameById.get(snapshot.fundId),
              ],
              artifactQuery,
            ),
        )
        .map((snapshot) => {
          const positions = holderSnapshotPositions.filter((position) => position.snapshotId === snapshot.snapshotId);
          const list = settlementLists.find((item) => item.snapshotId === snapshot.snapshotId);
          const lines = list ? settlementListLines.filter((line) => line.listId === list.listId) : [];
          const lineEvidenceIds = new Set(lines.flatMap((line) => line.evidenceRefIds));
          const evidence = evidenceRecords.filter(
            (record) =>
              record.instructionId === snapshot.instructionId ||
              lineEvidenceIds.has(record.evidenceRefId),
          );
          const anchors = anchoringEvents.filter(
            (event) =>
              event.targetId === snapshot.snapshotId ||
              event.targetId === list?.listId ||
              event.sourceReference === snapshot.sourceReference,
          );
          const totalAmount = lines.reduce((sum, line) => sum + parseUnits(line.amount), 0);

          return {
            snapshot,
            positions,
            list,
            lines,
            evidence,
            anchors,
            includedCount: positions.filter((position) => position.included).length,
            totalUnits: positions.reduce((sum, position) => sum + parseUnits(position.units), 0),
            totalAmount,
            currency: lines[0]?.currency || "HKD",
          };
        }),
      (row) => row.snapshot.recordDate || row.snapshot.lockedAt || row.snapshot.createdAt,
    );
  }, [
    anchoringEvents,
    artifactQuery,
    classFilter,
    evidenceRecords,
    fundNameById,
    holderSnapshotPositions,
    holderSnapshots,
    officialSnapshotIdById,
    selectedFund,
    settlementListLines,
    settlementLists,
  ]);

  const auditEvents = useMemo(() => {
    if (!selectedFund) return [];
    const inSelectedClass = (classId?: string) => classFilter === "all" || classId === classFilter;
    const selectedSnapshots = holderSnapshots.filter(
      (snapshot) => snapshot.fundId === selectedFund.id && inSelectedClass(snapshot.classId),
    );
    const selectedSnapshotIds = new Set(selectedSnapshots.map((snapshot) => snapshot.snapshotId));
    const selectedLists = settlementLists.filter((list) => selectedSnapshotIds.has(list.snapshotId));
    const selectedListIds = new Set(selectedLists.map((list) => list.listId));
    const selectedDeltas = registerDeltas.filter(
      (delta) => delta.fundId === selectedFund.id && inSelectedClass(delta.classId),
    );

    const evidenceFor = (params: { instructionId?: string; registerDeltaId?: string; evidenceIds?: Set<string> }) =>
      evidenceRecords.filter(
        (record) =>
          (params.instructionId && record.instructionId === params.instructionId) ||
          (params.registerDeltaId && record.registerDeltaId === params.registerDeltaId) ||
          (params.evidenceIds ? params.evidenceIds.has(record.evidenceRefId) : false),
      );

    const anchorsFor = (params: { targetId?: string; sourceReference?: string }) =>
      anchoringEvents.filter(
        (event) =>
          (params.targetId && event.targetId === params.targetId) ||
          (params.sourceReference && event.sourceReference === params.sourceReference),
      );

    return sortByDateDesc(
      [
        ...selectedDeltas.map((delta) => {
          const anchors = anchorsFor({
            targetId: delta.newRegisterVersionId,
            sourceReference: delta.instructionId,
          });
          return {
            id: delta.deltaId,
            kind: "Register Delta",
            title: `${delta.deltaType} delta`,
            detail: `${delta.units} units / ${delta.reasonCode}`,
            status: deltaStatus(delta),
            statusTone: delta.postingStatus,
            classId: delta.classId,
            at: delta.postedAt || delta.effectiveAt || delta.updatedAt,
            reference: delta.newRegisterVersionId || delta.instructionId,
            evidenceCount: evidenceFor({ instructionId: delta.instructionId, registerDeltaId: delta.deltaId }).length,
            anchorCount: anchors.length,
          };
        }),
        ...selectedSnapshots.map((snapshot) => {
          const positions = holderSnapshotPositions.filter((position) => position.snapshotId === snapshot.snapshotId);
          const list = settlementLists.find((item) => item.snapshotId === snapshot.snapshotId);
          const lines = list ? settlementListLines.filter((line) => line.listId === list.listId) : [];
          const lineEvidenceIds = new Set(lines.flatMap((line) => line.evidenceRefIds));
          const evidence = evidenceFor({
            instructionId: snapshot.instructionId,
            evidenceIds: lineEvidenceIds,
          });
          const anchors = anchorsFor({
            targetId: snapshot.snapshotId,
            sourceReference: snapshot.sourceReference,
          });
          return {
            id: snapshot.snapshotId,
            kind: "Holder Snapshot",
            title: snapshotLabel(snapshot),
            detail: `${positions.filter((position) => position.included).length} / ${positions.length} included`,
            status: snapshot.status,
            statusTone: snapshot.status,
            classId: snapshot.classId,
            at: snapshot.lockedAt || snapshot.recordDate || snapshot.createdAt,
            reference: snapshot.sourceReference,
            evidenceCount: evidence.length,
            anchorCount: anchors.length,
          };
        }),
        ...selectedLists.map((list) => {
          const snapshot = snapshotById.get(list.snapshotId);
          const lines = settlementListLines.filter((line) => line.listId === list.listId);
          const lineEvidenceIds = new Set(lines.flatMap((line) => line.evidenceRefIds));
          const evidence = evidenceFor({
            instructionId: snapshot?.instructionId,
            evidenceIds: lineEvidenceIds,
          });
          const anchors = anchorsFor({
            targetId: list.listId,
            sourceReference: list.sourceReference,
          });
          return {
            id: list.listId,
            kind: "Settlement List",
            title: list.listType,
            detail: `${lines.length} line(s) / ${list.status}`,
            status: list.status,
            statusTone: list.status,
            classId: snapshot?.classId || "N/A",
            at: list.generatedAt || list.updatedAt || list.createdAt,
            reference: list.sourceReference,
            evidenceCount: evidence.length,
            anchorCount: anchors.length,
          };
        }),
      ].filter((event) =>
        matchesQuery(
          [event.id, event.kind, event.title, event.detail, event.status, event.classId, event.reference],
          artifactQuery,
        ),
      ),
      (event) => event.at,
    );
  }, [
    anchoringEvents,
    artifactQuery,
    classFilter,
    evidenceRecords,
    holderSnapshotPositions,
    holderSnapshots,
    registerDeltas,
    selectedFund,
    settlementListLines,
    settlementLists,
    snapshotById,
  ]);

  const evidenceDetails = useMemo(
    () =>
      sortByDateDesc(
        [
          ...selectedEvidenceLayer.records.map((record) => ({
            id: record.evidenceRefId,
            type: "Evidence",
            label: record.label,
            detail: record.evidenceType,
            classId: record.classId || "Fund",
            status: record.retentionClass,
            hash: record.contentHash,
            at: record.createdAt,
          })),
          ...selectedEvidenceLayer.anchors.map((event) => ({
            id: event.anchoringEventId,
            type: "Anchor",
            label: event.anchorType,
            detail: event.targetId,
            classId: event.classId || "Fund",
            status: event.status,
            hash: event.merkleRoot || event.contentHash,
            at: event.anchoredAt || event.createdAt,
          })),
        ],
        (item) => item.at,
      ),
    [selectedEvidenceLayer],
  );

  const selectedSnapshot = selectedSnapshotId ? holderSnapshots.find((snapshot) => snapshot.snapshotId === selectedSnapshotId) : undefined;
  const selectedSnapshotOfficialId = getOfficialSnapshotId(selectedSnapshot);
  const selectedSnapshotOpenedFromId =
    selectedSnapshot && snapshotParam
      ? snapshotAliasById.get(normalizeSnapshotKey(snapshotParam)) === selectedSnapshot.snapshotId &&
        normalizeSnapshotKey(snapshotParam) !== normalizeSnapshotKey(selectedSnapshot.snapshotId)
        ? snapshotParam
        : undefined
      : undefined;
  const selectedSnapshotPositions = selectedSnapshot
    ? holderSnapshotPositions.filter((position) => position.snapshotId === selectedSnapshot.snapshotId)
    : [];
  const selectedSnapshotList = selectedSnapshot
    ? settlementLists.find((list) => list.snapshotId === selectedSnapshot.snapshotId)
    : undefined;
  const selectedSnapshotLines = selectedSnapshotList
    ? settlementListLines.filter((line) => line.listId === selectedSnapshotList.listId)
    : [];
  const selectedSnapshotAudit = useMemo(() => {
    if (!selectedSnapshot) {
      return {
        records: [] as EvidenceRecord[],
        anchors: [] as AnchoringEvent[],
        expectedRefIds: [] as string[],
        pendingRefIds: [] as string[],
      };
    }

    const instruction = instructionById.get(selectedSnapshot.instructionId);
    const expectedRefIds = unique([
      ...(instruction?.evidenceRefIds || []),
      ...selectedSnapshotLines.flatMap((line) => line.evidenceRefIds),
    ]);
    const recordsById = new Map<string, EvidenceRecord>();

    expectedRefIds.forEach((refId) => {
      const record = evidenceById.get(refId);
      if (record) recordsById.set(record.evidenceRefId, record);
    });

    evidenceRecords
      .filter(
        (record) =>
          record.instructionId === selectedSnapshot.instructionId ||
          expectedRefIds.includes(record.evidenceRefId),
      )
      .forEach((record) => recordsById.set(record.evidenceRefId, record));

    const anchors = anchoringEvents.filter(
      (event) =>
        event.targetId === selectedSnapshot.snapshotId ||
        event.targetId === selectedSnapshotList?.listId ||
        event.sourceReference === selectedSnapshot.sourceReference,
    );

    return {
      records: sortByDateDesc(Array.from(recordsById.values()), (record) => record.createdAt),
      anchors: sortByDateDesc(anchors, (event) => event.anchoredAt || event.createdAt),
      expectedRefIds,
      pendingRefIds: expectedRefIds.filter((refId) => !recordsById.has(refId)),
    };
  }, [
    anchoringEvents,
    evidenceById,
    evidenceRecords,
    instructionById,
    selectedSnapshot,
    selectedSnapshotLines,
    selectedSnapshotList,
  ]);

  const totalFundClasses = fundSummaries.reduce((sum, summary) => sum + summary.classIds.length, 0);
  const latestReleasedVersion = sortByDateDesc(
    registerVersions.filter((version) => version.status === "Released"),
    (version) => version.releasedAt || version.effectiveAt,
  )[0];

  const selectFund = (fundId: string) => {
    setSelectedFundId(fundId);
    setClassFilter("all");
    setSelectedSnapshotId(undefined);
    setActiveTab("overview");
    setIsFundSheetOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete("snapshot");
    next.delete("holder");
    setSearchParams(next, { replace: true });
  };

  const openSnapshotPreview = (snapshotId: string) => {
    const canonicalSnapshotId = snapshotAliasById.get(normalizeSnapshotKey(snapshotId)) || snapshotId;
    const snapshot = holderSnapshots.find((item) => item.snapshotId === canonicalSnapshotId);
    if (!snapshot) return;
    setSelectedSnapshotId(snapshot.snapshotId);
    setSelectedFundId(snapshot.fundId);
    setClassFilter(snapshot.classId);
    setActiveTab("snapshots");
    setIsFundSheetOpen(true);
    const next = new URLSearchParams(searchParams);
    next.set("snapshot", snapshot.snapshotId);
    next.delete("holder");
    setSearchParams(next, { replace: false });
  };

  const clearSnapshotPreview = () => {
    setSelectedSnapshotId(undefined);
    const next = new URLSearchParams(searchParams);
    next.delete("snapshot");
    setSearchParams(next, { replace: true });
  };

  const resetFilters = () => {
    setArtifactQuery("");
    setClassFilter("all");
  };

  const resetFundPicker = () => {
    setFundQuery("");
    setFundFilter("all");
  };

  return (
    <div className="container mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_380px] lg:items-end">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline">Book of Record</Badge>
            <Badge variant="secondary">Fund Management</Badge>
          </div>
          <h1 style={{ fontFamily: "var(--font-heading)" }}>Fund Management</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Manage issued fund registers by fund and class, then preview each historical snapshot as a read-only record.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Search className="h-4 w-4 text-muted-foreground" />
            Find Register Artifact
          </div>
          <Input
            value={artifactQuery}
            onChange={(event) => setArtifactQuery(event.target.value)}
            placeholder="Version, snapshot ID, event reference"
          />
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <MetricCard icon={Archive} label="Issued Funds" value={fundSummaries.length} variant="primary" />
        <MetricCard icon={Users} label="Fund Classes" value={totalFundClasses} />
        <MetricCard icon={FileClock} label="Register Versions" value={registerVersions.length} />
        <MetricCard icon={ShieldCheck} label="Latest Released" value={latestReleasedVersion?.registerVersionId || "N/A"} variant="success" />
      </div>

      <Card className="mb-6 overflow-hidden border-[var(--navy-100)] shadow-sm">
        <CardHeader className="space-y-4 border-b bg-white">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="text-lg">Fund Picker</CardTitle>
              <CardDescription>
                Search, filter, then open one fund audit sheet instead of scanning every register card.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={resetFundPicker}>
              Reset Picker
            </Button>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                value={fundQuery}
                onChange={(event) => setFundQuery(event.target.value)}
                placeholder="Search by fund, class, token, manager, or snapshot"
              />
            </div>
            <Select value={fundFilter} onValueChange={(value) => setFundFilter(value as FundPickerFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter funds" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All funds</SelectItem>
                <SelectItem value="open-end">Open-end funds</SelectItem>
                <SelectItem value="closed-end">Closed-end funds</SelectItem>
                <SelectItem value="with-snapshots">With snapshots</SelectItem>
                <SelectItem value="with-anchors">With anchors</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="max-h-[540px] space-y-3 overflow-y-auto pr-1">
            {filteredFundSummaries.map((summary) => {
              const isActive = isFundSheetOpen && selectedFund?.id === summary.fund.id;
              const auditState = summary.anchorCount > 0 ? "Anchored" : summary.evidenceCount > 0 ? "Evidence" : "Pending";

              return (
                <button
                  key={summary.fund.id}
                  type="button"
                  onClick={() => selectFund(summary.fund.id)}
                  className={cn(
                    "w-full rounded-lg border bg-card p-4 text-left transition hover:border-primary/60 hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive && "border-primary bg-primary/5 ring-1 ring-primary/20",
                  )}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="truncate font-medium">{summary.fund.name}</div>
                        {isActive ? <Badge variant="secondary">Sheet Open</Badge> : null}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant={statusVariant(summary.fund.status)}>{summary.fund.status}</Badge>
                        <Badge variant="outline">{summary.fund.fundType}</Badge>
                        <Badge variant="outline">{summary.fund.tokenSymbol || summary.fund.tokenName}</Badge>
                        <Badge variant={summary.anchorCount > 0 ? "default" : summary.evidenceCount > 0 ? "secondary" : "outline"}>
                          {auditState}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid min-w-0 grid-cols-4 gap-3 text-sm lg:w-[440px]">
                      <div>
                        <div className="text-xs text-muted-foreground">Classes</div>
                        <div className="font-medium">{summary.classIds.length}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Versions</div>
                        <div className="font-medium">{summary.versions.length}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Snapshots</div>
                        <div className="font-medium">{summary.snapshots.length}</div>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-xs text-muted-foreground">Anchors</div>
                          <div className="font-medium">{summary.anchorCount}</div>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}

            {filteredFundSummaries.length === 0 ? (
              <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                No funds match the current picker filters.
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Sheet
        open={isFundSheetOpen}
        onOpenChange={(open) => {
          setIsFundSheetOpen(open);
          if (!open) {
            setSelectedSnapshotId(undefined);
            const next = new URLSearchParams(searchParams);
            next.delete("snapshot");
            next.delete("holder");
            setSearchParams(next, { replace: true });
          }
        }}
      >
        {selectedFund ? (
          <SheetContent
            side="right"
            className="w-full max-w-none overflow-hidden p-0 sm:max-w-none lg:w-[86vw] xl:w-[80vw]"
          >
            <div className="flex h-full min-h-0 flex-col">
              <SheetHeader className="border-b bg-gradient-to-br from-[var(--navy-50)] via-white to-[var(--gold-50)] pr-12">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge variant="outline">Fund Scope</Badge>
                      <Badge variant={statusVariant(selectedFund.status)}>{selectedFund.status}</Badge>
                      <Badge variant="outline">{selectedFund.fundType}</Badge>
                    </div>
                    <SheetTitle style={{ fontFamily: "var(--font-heading)" }}>{selectedFund.name}</SheetTitle>
                    <SheetDescription className="max-w-4xl">
                      {selectedFund.fundManager || "Fund manager pending"} / {selectedFund.fundJurisdiction || "Jurisdiction pending"} / {selectedFund.assetCurrency}
                    </SheetDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={resetFilters} className="shrink-0">
                    Reset Scope
                  </Button>
                </div>
              </SheetHeader>

              <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
      <Card className="mb-6">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Fund Scope
          </CardTitle>
          <Button variant="outline" size="sm" onClick={resetFilters}>
            Reset
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <div className="rounded-lg border bg-secondary/25 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium">{selectedFund?.name || "No fund selected"}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {selectedFund?.fundManager || "Fund manager pending"} / {selectedFund?.assetCurrency || "Currency pending"}
                  </div>
                </div>
                {selectedFund ? <Badge variant={statusVariant(selectedFund.status)}>{selectedFund.status}</Badge> : null}
              </div>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
                <div>
                  <div className="text-muted-foreground">Total Units</div>
                  <div className="font-medium">{formatUnits(selectedSummary?.totalUnits || 0)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Register</div>
                  <div className="truncate font-mono text-xs">{selectedSummary?.latestVersion?.registerVersionId || "No version"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Audit Records</div>
                  <div className="font-medium">{selectedSummary?.evidenceCount || 0}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Hash Anchors</div>
                  <div className="font-medium">{selectedSummary?.anchorCount || 0}</div>
                </div>
              </div>
            </div>

            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
                {selectedClassIds.map((classId) => (
                  <SelectItem key={classId} value={classId}>
                    {classId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-4">
        <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
          <TabsList className="min-w-max max-w-none justify-start rounded-lg">
            <TabsTrigger className="shrink-0 px-3" value="overview">Fund Summary</TabsTrigger>
            <TabsTrigger className="shrink-0 px-3" value="versions">Regional / Register Version</TabsTrigger>
            <TabsTrigger className="shrink-0 px-3" value="snapshots">Snapshots</TabsTrigger>
            <TabsTrigger className="shrink-0 px-3" value="audit">Fund Audit</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Fund / Class Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 md:hidden">
                {classSummaries.map((item) => (
                  <button
                    key={item.classId}
                    type="button"
                    onClick={() => setClassFilter(item.classId)}
                    className={cn(
                      "w-full rounded-lg border p-4 text-left text-sm transition hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      classFilter === item.classId && "border-primary bg-primary/5",
                    )}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{item.classId}</div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {item.latestVersion?.registerVersionId || "No released version"}
                        </div>
                      </div>
                      <Badge variant={item.pendingDeltas ? "secondary" : "outline"}>
                        {item.pendingDeltas ? `${item.pendingDeltas} pending` : "Current"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-muted-foreground">Accounts</div>
                        <div className="font-medium">{item.accounts.length}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Units</div>
                        <div className="font-medium">{formatUnits(item.totalUnits)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Versions</div>
                        <div className="font-medium">{item.versions.length}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Snapshots</div>
                        <div className="font-medium">{item.snapshots.length}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <Table className="min-w-[900px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class</TableHead>
                      <TableHead>Current Units</TableHead>
                      <TableHead>Accounts</TableHead>
                      <TableHead>Latest Version</TableHead>
                      <TableHead>Register Versions</TableHead>
                      <TableHead>Snapshots</TableHead>
                      <TableHead>Delta State</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classSummaries.map((item) => (
                      <TableRow key={item.classId} className={cn(classFilter === item.classId && "bg-primary/5")}>
                        <TableCell className="font-medium">{item.classId}</TableCell>
                        <TableCell>{formatUnits(item.totalUnits)}</TableCell>
                        <TableCell>{item.accounts.length}</TableCell>
                        <TableCell>
                          <div className="font-mono text-xs">{item.latestVersion?.registerVersionId || "No released version"}</div>
                          <div className="text-xs text-muted-foreground">{formatDate(item.latestVersion?.releasedAt)}</div>
                        </TableCell>
                        <TableCell>{item.versions.length}</TableCell>
                        <TableCell>{item.snapshots.length}</TableCell>
                        <TableCell>
                          <Badge variant={item.pendingDeltas ? "secondary" : "outline"}>
                            {item.pendingDeltas ? `${item.pendingDeltas} pending` : "Posted"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {classSummaries.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                          No class register has been created for this fund yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions">
          <Card>
            <CardHeader>
              <CardTitle>Regional / Register Version</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 md:hidden">
                {visibleVersions.map((version) => (
                  <div key={version.registerVersionId} className="rounded-lg border p-4 text-sm">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-mono text-xs font-medium">{version.registerVersionId}</div>
                        <div className="text-xs text-muted-foreground">{version.classId}</div>
                      </div>
                      <Badge variant={statusVariant(version.status)}>{version.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-muted-foreground">Holders</div>
                        <div className="font-medium">{version.totalHolders}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Units</div>
                        <div className="font-medium">{version.totalUnits}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-muted-foreground">Released</div>
                        <div>{formatDate(version.releasedAt)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <Table className="min-w-[980px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Version</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Holders</TableHead>
                      <TableHead>Total Units</TableHead>
                      <TableHead>Released</TableHead>
                      <TableHead>Register Hash</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleVersions.map((version) => (
                      <TableRow key={version.registerVersionId}>
                        <TableCell>
                          <div className="font-mono text-xs font-medium">{version.registerVersionId}</div>
                          <div className="text-xs text-muted-foreground">{version.previousRegisterVersionId || "Initial version"}</div>
                        </TableCell>
                        <TableCell>{version.classId}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(version.status)}>{version.status}</Badge>
                        </TableCell>
                        <TableCell>{version.totalHolders}</TableCell>
                        <TableCell>{version.totalUnits}</TableCell>
                        <TableCell>{formatDate(version.releasedAt)}</TableCell>
                        <TableCell className="max-w-[280px] truncate font-mono text-xs">{version.registerHash}</TableCell>
                      </TableRow>
                    ))}
                    {visibleVersions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                          No register version matches the current fund scope.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="snapshots">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Snapshots</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Select a snapshot to preview the exact holder rows captured for that fund event.
                </p>
              </div>
              {selectedSnapshot ? (
                <Button variant="outline" size="sm" onClick={clearSnapshotPreview}>
                  Clear Preview
                </Button>
              ) : null}
            </CardHeader>
            <CardContent>
              <div className="space-y-3 md:hidden">
                {snapshotRows.map(({ snapshot, list, positions, includedCount, totalUnits, evidence, anchors }) => {
                  const officialSnapshotId = getOfficialSnapshotId(snapshot);

                  return (
                    <div
                      key={snapshot.snapshotId}
                      role="button"
                      tabIndex={0}
                      aria-label={`Open ${snapshotLabel(snapshot)}`}
                      onClick={() => openSnapshotPreview(snapshot.snapshotId)}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter" && event.key !== " ") return;
                        event.preventDefault();
                        openSnapshotPreview(snapshot.snapshotId);
                      }}
                      className={cn(
                        "w-full rounded-lg border p-4 text-left text-sm transition hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        selectedSnapshotId === snapshot.snapshotId && "border-primary bg-primary/5",
                      )}
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-medium">{snapshotLabel(snapshot)}</div>
                          <SnapshotIdStack snapshot={snapshot} officialSnapshotId={officialSnapshotId} />
                        </div>
                        <Badge variant={statusVariant(snapshot.status)}>{snapshot.status}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-muted-foreground">Class</div>
                          <div className="font-medium">{snapshot.classId}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Rows</div>
                          <div className="font-medium">
                            {includedCount} / {positions.length}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Units</div>
                          <div className="font-medium">{formatUnits(totalUnits)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Evidence</div>
                          <div className="font-medium">{evidence.length + anchors.length}</div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-muted-foreground">List</div>
                          <div>{list ? `${list.listType} / ${list.status}` : "No list"}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <Table className="min-w-[1080px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Snapshot</TableHead>
                      <TableHead>Source Event</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Rows</TableHead>
                      <TableHead>Total Units</TableHead>
                      <TableHead>Expected Amount</TableHead>
                      <TableHead>List</TableHead>
                      <TableHead>Evidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {snapshotRows.map(({ snapshot, list, positions, includedCount, totalUnits, totalAmount, currency, evidence, anchors }) => {
                      const officialSnapshotId = getOfficialSnapshotId(snapshot);

                      return (
                        <TableRow
                          key={snapshot.snapshotId}
                          onClick={() => openSnapshotPreview(snapshot.snapshotId)}
                          className={cn(
                            "cursor-pointer",
                            selectedSnapshotId === snapshot.snapshotId && "bg-primary/5",
                          )}
                        >
                          <TableCell>
                            <div className="font-medium">{snapshotLabel(snapshot)}</div>
                            <SnapshotIdStack snapshot={snapshot} officialSnapshotId={officialSnapshotId} />
                            <div className="text-xs text-muted-foreground">{formatDate(snapshot.recordDate)}</div>
                          </TableCell>
                          <TableCell>
                            <div>{snapshot.sourceType}</div>
                            <div className="font-mono text-xs text-muted-foreground">{snapshot.sourceReference}</div>
                          </TableCell>
                          <TableCell>{snapshot.classId}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(snapshot.status)}>{snapshot.status}</Badge>
                          </TableCell>
                          <TableCell>
                            {includedCount} / {positions.length}
                          </TableCell>
                          <TableCell>{formatUnits(totalUnits)}</TableCell>
                          <TableCell>{totalAmount ? `${formatUnits(totalAmount)} ${currency}` : "Pending"}</TableCell>
                          <TableCell>
                            <div>{list?.listType || "No list"}</div>
                            <div className="text-xs text-muted-foreground">{list?.status || "Pending"}</div>
                          </TableCell>
                          <TableCell>
                            <div>{evidence.length} record(s)</div>
                            <div className="text-xs text-muted-foreground">{anchors.length} anchor(s)</div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {snapshotRows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                          No snapshot matches the current fund scope.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {selectedSnapshot ? (
            <>
              <SnapshotReviewPanel
                snapshot={selectedSnapshot}
                officialSnapshotId={selectedSnapshotOfficialId}
                positions={selectedSnapshotPositions}
                list={selectedSnapshotList}
                lines={selectedSnapshotLines}
                readOnly
                hideActions
              />

              <Card className="mt-6">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle>Snapshot Audit</CardTitle>
                    <CardDescription>
                      Evidence records and anchoring events linked to the selected snapshot and settlement list.
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{selectedSnapshotAudit.records.length} evidence</Badge>
                    <Badge variant={selectedSnapshotAudit.anchors.length ? "default" : "outline"}>
                      {selectedSnapshotAudit.anchors.length ? `${selectedSnapshotAudit.anchors.length} anchor(s)` : "Anchor pending"}
                    </Badge>
                    {selectedSnapshotAudit.pendingRefIds.length ? (
                      <Badge variant="secondary">{selectedSnapshotAudit.pendingRefIds.length} pending ref(s)</Badge>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="rounded-lg border bg-secondary/30 p-4">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <Badge variant="outline">Snapshot Traceability</Badge>
                      {selectedSnapshotOpenedFromId ? (
                        <Badge variant="secondary">Opened from official ID {selectedSnapshotOpenedFromId}</Badge>
                      ) : null}
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <TraceabilityItem label="Official Snapshot ID">
                        <SnapshotReferenceValue label="Official snapshot ID" value={selectedSnapshotOfficialId} />
                      </TraceabilityItem>
                      <TraceabilityItem label="Canonical Snapshot ID">
                        <SnapshotReferenceValue label="Canonical snapshot ID" value={selectedSnapshot.snapshotId} muted />
                      </TraceabilityItem>
                      <TraceabilityItem label="Source Event">
                        <div className="font-medium">{selectedSnapshot.sourceType}</div>
                        <div className="break-all font-mono text-xs text-muted-foreground">{selectedSnapshot.sourceReference}</div>
                      </TraceabilityItem>
                      <TraceabilityItem label="Fund / Class">
                        <div className="font-medium">{fundNameById.get(selectedSnapshot.fundId) || selectedFund?.name || selectedSnapshot.fundId}</div>
                        <div className="font-mono text-xs text-muted-foreground">{selectedSnapshot.classId}</div>
                      </TraceabilityItem>
                      <TraceabilityItem label="Register Version">
                        <SnapshotReferenceValue label="Register version" value={selectedSnapshot.registerVersionId} muted />
                      </TraceabilityItem>
                      <TraceabilityItem label="Evidence References">
                        {selectedSnapshotAudit.expectedRefIds.length ? (
                          <div className="flex flex-wrap gap-1.5">
                            {selectedSnapshotAudit.expectedRefIds.map((refId) => (
                              <Badge key={refId} variant="outline" className="max-w-full break-all font-mono">
                                {refId}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">No evidence refs linked</div>
                        )}
                      </TraceabilityItem>
                      <TraceabilityItem label="Anchor References">
                        {selectedSnapshotAudit.anchors.length ? (
                          <div className="flex flex-wrap gap-1.5">
                            {selectedSnapshotAudit.anchors.map((event) => (
                              <Badge key={event.anchoringEventId} variant="outline" className="max-w-full break-all font-mono">
                                {event.anchoringEventId}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">No anchor refs linked</div>
                        )}
                      </TraceabilityItem>
                    </div>
                  </div>

                  {selectedSnapshotAudit.pendingRefIds.length ? (
                    <div className="rounded-lg border border-dashed bg-secondary/30 p-4 text-sm">
                      <div className="font-medium">Derived / pending evidence references</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedSnapshotAudit.pendingRefIds.map((refId) => (
                          <Badge key={refId} variant="outline" className="font-mono">
                            {refId}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="grid gap-5 xl:grid-cols-2">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <FileCheck2 className="h-4 w-4 text-muted-foreground" />
                        Evidence Records
                      </div>
                      <div className="overflow-x-auto rounded-lg border">
                        <Table className="min-w-[680px]">
                          <TableHeader>
                            <TableRow>
                              <TableHead>Evidence</TableHead>
                              <TableHead>Class</TableHead>
                              <TableHead>Retention</TableHead>
                              <TableHead>Hash</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedSnapshotAudit.records.map((record) => (
                              <TableRow key={record.evidenceRefId}>
                                <TableCell>
                                  <div className="font-medium">{record.label}</div>
                                  <div className="text-xs text-muted-foreground">{record.evidenceType}</div>
                                  <div className="font-mono text-xs text-muted-foreground">{record.evidenceRefId}</div>
                                </TableCell>
                                <TableCell>{record.classId || "Fund"}</TableCell>
                                <TableCell>
                                  <Badge variant={retentionVariant(record.retentionClass)}>{record.retentionClass}</Badge>
                                </TableCell>
                                <TableCell className="max-w-[220px] truncate font-mono text-xs">
                                  {record.contentHash || "Derived / pending"}
                                </TableCell>
                              </TableRow>
                            ))}
                            {selectedSnapshotAudit.records.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                                  No evidence record is linked to this snapshot yet.
                                </TableCell>
                              </TableRow>
                            ) : null}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Fingerprint className="h-4 w-4 text-muted-foreground" />
                        Anchoring Events
                      </div>
                      <div className="overflow-x-auto rounded-lg border">
                        <Table className="min-w-[680px]">
                          <TableHeader>
                            <TableRow>
                              <TableHead>Anchor</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Target</TableHead>
                              <TableHead>Hash</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedSnapshotAudit.anchors.map((event) => (
                              <TableRow key={event.anchoringEventId}>
                                <TableCell>
                                  <div className="font-medium">{event.anchorType}</div>
                                  <div className="text-xs text-muted-foreground">{formatDate(event.anchoredAt || event.createdAt)}</div>
                                  <div className="font-mono text-xs text-muted-foreground">{event.anchoringEventId}</div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={statusVariant(event.status)}>{event.status}</Badge>
                                </TableCell>
                                <TableCell className="max-w-[180px] truncate font-mono text-xs">{event.targetId}</TableCell>
                                <TableCell className="max-w-[220px] truncate font-mono text-xs">
                                  {event.merkleRoot || event.contentHash}
                                </TableCell>
                              </TableRow>
                            ))}
                            {selectedSnapshotAudit.anchors.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                                  No anchoring event has been recorded for this snapshot or list.
                                </TableCell>
                              </TableRow>
                            ) : null}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="mt-6">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Select a snapshot above to open a read-only preview.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="audit">
          <div className="grid gap-6 xl:grid-cols-[1.25fr_.85fr]">
            <Card>
              <CardHeader>
                <CardTitle>Fund-Level Audit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 md:hidden">
                  {auditEvents.map((event) => (
                    <div key={`${event.kind}-${event.id}`} className="rounded-lg border p-4 text-sm">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium">{event.title}</div>
                          <div className="font-mono text-xs text-muted-foreground">{event.id}</div>
                        </div>
                        <Badge variant={statusVariant(event.statusTone)}>{event.status}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-muted-foreground">Type</div>
                          <div>{event.kind}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Class</div>
                          <div>{event.classId}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Evidence</div>
                          <div>{event.evidenceCount} record(s)</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Anchor</div>
                          <div>{event.anchorCount}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <Table className="min-w-[980px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Audit Event</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Evidence</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditEvents.map((event) => (
                        <TableRow key={`${event.kind}-${event.id}`}>
                          <TableCell>
                            <div className="font-medium">{event.title}</div>
                            <div className="text-xs text-muted-foreground">{event.kind} / {event.detail}</div>
                            <div className="font-mono text-xs text-muted-foreground">{event.id}</div>
                          </TableCell>
                          <TableCell>{event.classId}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(event.statusTone)}>{event.status}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[220px] truncate font-mono text-xs">{event.reference}</TableCell>
                          <TableCell>
                            <div>{event.evidenceCount} record(s)</div>
                            <div className="text-xs text-muted-foreground">{event.anchorCount} anchor(s)</div>
                          </TableCell>
                          <TableCell>{formatDate(event.at)}</TableCell>
                        </TableRow>
                      ))}
                      {auditEvents.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                            No register, snapshot, or settlement audit event matches this fund scope.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>Evidence Details</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    <FileCheck2 className="h-3.5 w-3.5" />
                    {selectedEvidenceLayer.records.length}
                  </Badge>
                  <Badge variant="outline">
                    <Fingerprint className="h-3.5 w-3.5" />
                    {selectedEvidenceLayer.anchors.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table className="min-w-[720px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Detail</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Hash</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {evidenceDetails.map((item) => (
                        <TableRow key={`${item.type}-${item.id}`}>
                          <TableCell>
                            <div className="font-medium">{item.label}</div>
                            <div className="text-xs text-muted-foreground">{item.type} / {item.detail}</div>
                            <div className="font-mono text-xs text-muted-foreground">{item.id}</div>
                          </TableCell>
                          <TableCell>{item.classId}</TableCell>
                          <TableCell>
                            <Badge variant={item.type === "Evidence" ? retentionVariant(item.status) : statusVariant(item.status)}>
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[220px] truncate font-mono text-xs">{item.hash || "No hash"}</TableCell>
                        </TableRow>
                      ))}
                      {evidenceDetails.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                            No evidence or anchor detail is linked to this fund scope.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
              </div>
            </div>
          </SheetContent>
        ) : null}
      </Sheet>
    </div>
  );
}
