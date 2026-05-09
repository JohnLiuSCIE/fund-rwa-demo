import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  FileClock,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  WalletCards,
} from "lucide-react";

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
  SheetHeader,
  SheetTitle,
} from "../components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useApp } from "../context/AppContext";
import { buildHolderOwnershipProjection, getLatestRegisterVersion } from "../lib/transferAgency";
import { cn } from "../components/ui/utils";
import type { HolderSnapshot, RegisterAccount, RegisterDelta, WalletLink } from "../data/fundDemoData";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

function accountVariant(status: RegisterAccount["accountStatus"]): BadgeVariant {
  if (["Restricted", "Suspended", "Closed"].includes(status)) return "destructive";
  if (status === "Pending") return "secondary";
  return "outline";
}

function proofVariant(status: string): BadgeVariant {
  if (status.includes("Expired") || status.includes("Rejected") || status.includes("Missing") || status.includes("Suspended")) {
    return "destructive";
  }
  if (status.includes("Pending") || status.includes("Submitted")) return "secondary";
  return "outline";
}

function snapshotVariant(status: HolderSnapshot["status"]): BadgeVariant {
  if (status === "Reconciled" || status === "IssuerAcknowledged") return "default";
  if (status === "SubmittedToIssuer" || status === "Locked") return "secondary";
  return "outline";
}

function deltaVariant(delta: RegisterDelta): BadgeVariant {
  if (delta.postingStatus === "Posted") return "default";
  if (delta.checkerStatus === "Rejected" || delta.postingStatus === "Failed") return "destructive";
  if (delta.makerStatus === "Submitted" || delta.checkerStatus === "Pending") return "secondary";
  return "outline";
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

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
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

function walletBucket(link?: WalletLink) {
  if (!link || link.proofStatus === "Missing") return "Missing";
  if (link.proofStatus === "Verified" && link.whitelistStatus === "Whitelisted") return "Verified";
  if (link.proofStatus === "Submitted" || link.whitelistStatus === "Pending") return "Pending";
  return "Exception";
}

function sortByDateDesc<T>(items: T[], getDate: (item: T) => string | undefined) {
  return [...items].sort((left, right) => (getDate(right) || "").localeCompare(getDate(left) || ""));
}

export function HolderRegister() {
  const {
    fundIssuances,
    registerAccounts,
    walletLinks,
    registerDeltas,
    registerVersions,
    holderSnapshots,
    holderSnapshotPositions,
    settlementLists,
    evidenceRecords,
    workflowState,
  } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [fundFilter, setFundFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [versionFilter, setVersionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [walletFilter, setWalletFilter] = useState("all");
  const [snapshotFilter, setSnapshotFilter] = useState("all");
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>();

  const snapshotParam = searchParams.get("snapshot") || "";
  const holderParam = searchParams.get("holder") || "";

  useEffect(() => {
    if (!holderParam) return;
    const match = registerAccounts.find(
      (account) => account.registerAccountId === holderParam || account.holderId === holderParam,
    );
    if (match) setSelectedAccountId(match.registerAccountId);
  }, [holderParam, registerAccounts]);

  const rows = useMemo(
    () =>
      buildHolderOwnershipProjection({
        funds: fundIssuances,
        registerAccounts,
        walletLinks,
        registerDeltas,
        holderSnapshots,
        holderSnapshotPositions,
        settlementLists,
      }),
    [fundIssuances, registerAccounts, walletLinks, registerDeltas, holderSnapshots, holderSnapshotPositions, settlementLists],
  );

  const fundNameById = useMemo(
    () => new Map(fundIssuances.map((fund) => [fund.id, fund.name])),
    [fundIssuances],
  );
  const walletByAccount = useMemo(
    () => new Map(walletLinks.map((wallet) => [wallet.registerAccountId, wallet])),
    [walletLinks],
  );
  const snapshotById = useMemo(
    () => new Map(holderSnapshots.map((snapshot) => [snapshot.snapshotId, snapshot])),
    [holderSnapshots],
  );
  const listBySnapshot = useMemo(
    () => new Map(settlementLists.map((list) => [list.snapshotId, list])),
    [settlementLists],
  );

  const getAccountSnapshots = (registerAccountId: string) =>
    sortByDateDesc(
      holderSnapshotPositions
        .filter((position) => position.registerAccountId === registerAccountId)
        .map((position) => ({
          position,
          snapshot: snapshotById.get(position.snapshotId),
          list: listBySnapshot.get(position.snapshotId),
        }))
        .filter((item) => item.snapshot),
      (item) => item.snapshot?.recordDate,
    );

  const getLatestSnapshot = (registerAccountId: string) => getAccountSnapshots(registerAccountId)[0]?.snapshot;

  const filteredRows = rows.filter((row) => {
    const wallet = walletByAccount.get(row.registerAccountId);
    const accountSnapshots = getAccountSnapshots(row.registerAccountId).map((item) => item.snapshot!);
    const latestVersion = getLatestRegisterVersion(registerVersions, row.fundId, row.classId);
    const versionIds = unique([
      latestVersion?.registerVersionId || "",
      ...accountSnapshots.map((snapshot) => snapshot.registerVersionId),
    ]);
    const haystack = [
      row.holderName,
      row.holderId,
      row.registerAccountId,
      row.fundName,
      row.classId,
      row.accountStatus,
      row.source,
      row.walletAddress,
      row.walletStatus,
      row.lastDeltaStatus,
      ...versionIds,
      ...accountSnapshots.flatMap((snapshot) => [snapshot.snapshotId, snapshot.sourceReference, snapshot.sourceType]),
    ]
      .join(" ")
      .toLowerCase();
    const normalizedQuery = query.trim().toLowerCase();

    return (
      (!normalizedQuery || haystack.includes(normalizedQuery)) &&
      (fundFilter === "all" || row.fundId === fundFilter) &&
      (classFilter === "all" || row.classId === classFilter) &&
      (versionFilter === "all" || versionIds.includes(versionFilter)) &&
      (statusFilter === "all" || row.accountStatus === statusFilter) &&
      (walletFilter === "all" || walletBucket(wallet) === walletFilter) &&
      (snapshotFilter === "all" || accountSnapshots.some((snapshot) => snapshot.sourceType === snapshotFilter))
    );
  });

  const visibleAccountIds = new Set(filteredRows.map((row) => row.registerAccountId));
  const restrictedCount = rows.filter((row) => ["Restricted", "Suspended"].includes(row.accountStatus)).length;
  const walletExceptionCount = walletLinks.filter((link) =>
    ["Missing", "Expired", "Rejected"].includes(link.proofStatus) || ["Suspended", "Removed"].includes(link.whitelistStatus),
  ).length;
  const totalUnits = rows.reduce((sum, row) => sum + parseUnits(row.units), 0);
  const latestVersions = sortByDateDesc(registerVersions, (version) => version.releasedAt || version.effectiveAt);
  const latestReleasedVersion = latestVersions.find((version) => version.status === "Released");

  const selectedRow = selectedAccountId ? rows.find((row) => row.registerAccountId === selectedAccountId) : undefined;
  const selectedWallet = selectedRow ? walletByAccount.get(selectedRow.registerAccountId) : undefined;
  const selectedSnapshots = selectedRow ? getAccountSnapshots(selectedRow.registerAccountId) : [];
  const selectedDeltas = selectedRow
    ? sortByDateDesc(
        registerDeltas.filter((delta) => delta.registerAccountId === selectedRow.registerAccountId),
        (delta) => delta.postedAt || delta.effectiveAt || delta.updatedAt,
      )
    : [];
  const selectedWorkflowSourceRefs = new Set(selectedSnapshots.map((item) => item.snapshot?.sourceReference).filter(Boolean));
  const selectedWorkflows = selectedRow
    ? workflowState.instances.filter(
        (instance) =>
          selectedWorkflowSourceRefs.has(instance.sourceReference) ||
          selectedDeltas.some((delta) => delta.instructionId === instance.instructionId),
      )
    : [];
  const selectedEvidence = selectedRow
    ? evidenceRecords.filter(
        (record) =>
          selectedDeltas.some((delta) => delta.deltaId === record.registerDeltaId || delta.instructionId === record.instructionId) ||
          selectedSnapshots.some((item) => item.snapshot?.instructionId === record.instructionId),
      )
    : [];

  const snapshotRows = holderSnapshots.map((snapshot) => {
    const positions = holderSnapshotPositions.filter((position) => position.snapshotId === snapshot.snapshotId);
    const list = settlementLists.find((item) => item.snapshotId === snapshot.snapshotId);
    return {
      snapshot,
      list,
      positions,
      includedCount: positions.filter((position) => position.included).length,
      totalUnits: formatUnits(positions.reduce((sum, position) => sum + parseUnits(position.units), 0)),
      fundName: fundNameById.get(snapshot.fundId) || snapshot.fundId,
    };
  });

  const filteredSnapshots = snapshotRows.filter(({ snapshot, positions }) => {
    const haystack = [
      snapshot.snapshotId,
      snapshot.sourceType,
      snapshot.sourceReference,
      snapshot.registerVersionId,
      snapshot.status,
      fundNameById.get(snapshot.fundId) || snapshot.fundId,
      snapshot.classId,
      ...positions.flatMap((position) => [position.holderName, position.holderId, position.registerAccountId]),
    ]
      .join(" ")
      .toLowerCase();
    const normalizedQuery = query.trim().toLowerCase();
    return (
      (!normalizedQuery || haystack.includes(normalizedQuery)) &&
      (fundFilter === "all" || snapshot.fundId === fundFilter) &&
      (classFilter === "all" || snapshot.classId === classFilter) &&
      (versionFilter === "all" || snapshot.registerVersionId === versionFilter) &&
      (snapshotFilter === "all" || snapshot.sourceType === snapshotFilter)
    );
  });

  const historyRows = sortByDateDesc(
    [
      ...registerDeltas.map((delta) => {
        const account = registerAccounts.find((item) => item.registerAccountId === delta.registerAccountId);
        return {
          id: delta.deltaId,
          accountId: delta.registerAccountId,
          holderName: account?.holderName || delta.registerAccountId,
          fundId: delta.fundId,
          classId: delta.classId,
          type: "Register Delta",
          event: delta.deltaType,
          units: delta.units,
          status: `${delta.makerStatus} / ${delta.checkerStatus} / ${delta.postingStatus}`,
          at: delta.postedAt || delta.effectiveAt || delta.updatedAt,
          reference: delta.reasonCode,
        };
      }),
      ...holderSnapshotPositions.map((position) => {
        const snapshot = snapshotById.get(position.snapshotId);
        return {
          id: position.positionId,
          accountId: position.registerAccountId,
          holderName: position.holderName,
          fundId: snapshot?.fundId || "",
          classId: snapshot?.classId || "",
          type: "Snapshot Position",
          event: snapshot?.sourceType || "Snapshot",
          units: position.units,
          status: `${snapshot?.status || "Unknown"} / ${position.included ? "Included" : "Excluded"}`,
          at: snapshot?.recordDate,
          reference: snapshot?.sourceReference || position.snapshotId,
        };
      }),
    ].filter((item) => visibleAccountIds.has(item.accountId)),
    (item) => item.at,
  );

  const resetFilters = () => {
    setQuery("");
    setFundFilter("all");
    setClassFilter("all");
    setVersionFilter("all");
    setStatusFilter("all");
    setWalletFilter("all");
    setSnapshotFilter("all");
  };

  const openHolderDetail = (registerAccountId: string) => {
    setSelectedAccountId(registerAccountId);
    const next = new URLSearchParams(searchParams);
    next.set("holder", registerAccountId);
    setSearchParams(next, { replace: true });
  };

  const closeHolderDetail = () => {
    setSelectedAccountId(undefined);
    const next = new URLSearchParams(searchParams);
    next.delete("holder");
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="container mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_420px] lg:items-end">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline">Book of Record</Badge>
            <Badge variant="secondary">Holder Lookup</Badge>
          </div>
          <h1 style={{ fontFamily: "var(--font-heading)" }}>Holder Ownership Register</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Search who owns each fund class, trace wallet proof, inspect record-date snapshots, and open holder-level evidence from the canonical TA record.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Search className="h-4 w-4 text-muted-foreground" />
            Holder Search
          </div>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Holder, account ID, holder ID, wallet, snapshot, version"
          />
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <MetricCard icon={Users} label="Register Accounts" value={rows.length} variant="primary" />
        <MetricCard icon={ShieldCheck} label="Registered Units" value={formatUnits(totalUnits)} />
        <MetricCard icon={WalletCards} label="Wallet Exceptions" value={walletExceptionCount} variant="warning" />
        <MetricCard icon={FileClock} label="Latest Version" value={latestReleasedVersion?.registerVersionId || "N/A"} variant="success" />
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Register Filters
          </CardTitle>
          <Button variant="outline" size="sm" onClick={resetFilters}>
            Reset
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Select value={fundFilter} onValueChange={setFundFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Fund" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All funds</SelectItem>
                {fundIssuances.map((fund) => (
                  <SelectItem key={fund.id} value={fund.id}>
                    {fund.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
                {unique(rows.map((row) => row.classId)).map((classId) => (
                  <SelectItem key={classId} value={classId}>
                    {classId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={versionFilter} onValueChange={setVersionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Register version" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All versions</SelectItem>
                {latestVersions.map((version) => (
                  <SelectItem key={version.registerVersionId} value={version.registerVersionId}>
                    {version.registerVersionId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Account status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {unique(rows.map((row) => row.accountStatus)).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={walletFilter} onValueChange={setWalletFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Wallet proof" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All wallet states</SelectItem>
                <SelectItem value="Verified">Verified</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Exception">Exception</SelectItem>
                <SelectItem value="Missing">Missing</SelectItem>
              </SelectContent>
            </Select>

            <Select value={snapshotFilter} onValueChange={setSnapshotFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Snapshot type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All snapshots</SelectItem>
                <SelectItem value="Distribution">Distribution</SelectItem>
                <SelectItem value="Redemption">Redemption</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue={snapshotParam ? "snapshots" : "ownership"} className="gap-4">
        <TabsList className="max-w-full overflow-x-auto">
          <TabsTrigger value="ownership">Holder Search</TabsTrigger>
          <TabsTrigger value="snapshots">Snapshots</TabsTrigger>
          <TabsTrigger value="history">Position History</TabsTrigger>
          <TabsTrigger value="versions">Register Versions</TabsTrigger>
          <TabsTrigger value="wallets">Wallet Links</TabsTrigger>
          <TabsTrigger value="restrictions">Restrictions</TabsTrigger>
        </TabsList>

        <TabsContent value="ownership">
          <Card>
            <CardHeader>
              <CardTitle>Current Ownership</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 md:hidden">
                {filteredRows.map((row) => {
                  const wallet = walletByAccount.get(row.registerAccountId);
                  const latestSnapshot = getLatestSnapshot(row.registerAccountId);
                  return (
                    <button
                      key={row.registerAccountId}
                      type="button"
                      onClick={() => openHolderDetail(row.registerAccountId)}
                      className="w-full rounded-lg border p-4 text-left text-sm transition hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-medium">{row.holderName}</div>
                          <div className="font-mono text-xs text-muted-foreground">{row.registerAccountId}</div>
                        </div>
                        <Badge variant={accountVariant(row.accountStatus)}>{row.accountStatus}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-muted-foreground">Fund</div>
                          <div className="font-medium">{row.fundName}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Units</div>
                          <div className="font-medium">{row.units}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Wallet</div>
                          <Badge variant={proofVariant(row.walletStatus)}>{walletBucket(wallet)}</Badge>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Snapshot</div>
                          <div className="truncate text-xs">{latestSnapshot?.sourceType || "None"}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Holder</TableHead>
                      <TableHead>Fund / Class</TableHead>
                      <TableHead>Units</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Wallet Proof</TableHead>
                      <TableHead>Register Version</TableHead>
                      <TableHead>Latest Snapshot</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.map((row) => {
                      const wallet = walletByAccount.get(row.registerAccountId);
                      const latestSnapshot = getLatestSnapshot(row.registerAccountId);
                      const latestVersion = getLatestRegisterVersion(registerVersions, row.fundId, row.classId);
                      return (
                        <TableRow key={row.registerAccountId}>
                          <TableCell>
                            <div className="font-medium">{row.holderName}</div>
                            <div className="font-mono text-xs text-muted-foreground">{row.registerAccountId}</div>
                            <div className="text-xs text-muted-foreground">{row.holderId}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{row.fundName}</div>
                            <div className="text-xs text-muted-foreground">{row.classId}</div>
                          </TableCell>
                          <TableCell className="font-medium">{row.units}</TableCell>
                          <TableCell>
                            <Badge variant={accountVariant(row.accountStatus)}>{row.accountStatus}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[220px] truncate font-mono text-xs">{row.walletAddress}</div>
                            <Badge className="mt-1" variant={proofVariant(row.walletStatus)}>
                              {walletBucket(wallet)}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[220px] truncate font-mono text-xs">
                            {latestVersion?.registerVersionId || "No released version"}
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[220px] truncate font-mono text-xs">{latestSnapshot?.snapshotId || "No snapshot"}</div>
                            {latestSnapshot ? (
                              <Badge className="mt-1" variant={snapshotVariant(latestSnapshot.status)}>
                                {latestSnapshot.sourceType} / {latestSnapshot.status}
                              </Badge>
                            ) : null}
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => openHolderDetail(row.registerAccountId)}>
                              View Holder
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredRows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                          No holder account matches the current search and filters.
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
            <CardHeader>
              <CardTitle>Record-Date And Cutoff Snapshots</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Snapshot</TableHead>
                      <TableHead>Source Event</TableHead>
                      <TableHead>Fund / Class</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Holders</TableHead>
                      <TableHead>Total Units</TableHead>
                      <TableHead>List</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSnapshots.map(({ snapshot, list, positions, includedCount, totalUnits, fundName }) => (
                      <TableRow
                        key={snapshot.snapshotId}
                        className={cn(snapshotParam === snapshot.snapshotId && "bg-primary/5")}
                      >
                        <TableCell>
                          <div className="font-mono text-xs font-medium">{snapshot.snapshotId}</div>
                          <div className="text-xs text-muted-foreground">{formatDate(snapshot.recordDate)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{snapshot.sourceType}</div>
                          <div className="text-xs text-muted-foreground">{snapshot.sourceReference}</div>
                        </TableCell>
                        <TableCell>
                          <div>{fundName}</div>
                          <div className="text-xs text-muted-foreground">{snapshot.classId}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={snapshotVariant(snapshot.status)}>{snapshot.status}</Badge>
                        </TableCell>
                        <TableCell>{includedCount} / {positions.length}</TableCell>
                        <TableCell>{totalUnits}</TableCell>
                        <TableCell>
                          <div>{list?.listType || "No list"}</div>
                          <div className="text-xs text-muted-foreground">{list?.status || "Pending"}</div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredSnapshots.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                          No snapshot matches the current filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Position History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Holder</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Units</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyRows.map((event) => (
                      <TableRow key={`${event.type}-${event.id}`}>
                        <TableCell>
                          <div className="font-medium">{event.holderName}</div>
                          <div className="font-mono text-xs text-muted-foreground">{event.accountId}</div>
                        </TableCell>
                        <TableCell>
                          <div>{event.event}</div>
                          <div className="text-xs text-muted-foreground">{event.type}</div>
                        </TableCell>
                        <TableCell>{event.units}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{event.status}</Badge>
                        </TableCell>
                        <TableCell>{event.reference}</TableCell>
                        <TableCell>{formatDate(event.at)}</TableCell>
                      </TableRow>
                    ))}
                    {historyRows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                          No register delta or snapshot history matches the current filters.
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
              <CardTitle>Register Version History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Version</TableHead>
                      <TableHead>Fund / Class</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Holders</TableHead>
                      <TableHead>Total Units</TableHead>
                      <TableHead>Released</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {latestVersions.map((version) => (
                      <TableRow key={version.registerVersionId}>
                        <TableCell>
                          <div className="font-medium">{version.registerVersionId}</div>
                          <div className="max-w-[180px] truncate font-mono text-xs text-muted-foreground">
                            {version.registerHash}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>{fundNameById.get(version.fundId) || version.fundId}</div>
                          <div className="text-xs text-muted-foreground">{version.classId}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={version.status === "Released" ? "outline" : "secondary"}>{version.status}</Badge>
                        </TableCell>
                        <TableCell>{version.totalHolders}</TableCell>
                        <TableCell>{version.totalUnits}</TableCell>
                        <TableCell>{formatDate(version.releasedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallets">
          <Card>
            <CardHeader>
              <CardTitle>Wallet Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Register Account</TableHead>
                      <TableHead>Wallet</TableHead>
                      <TableHead>Chain</TableHead>
                      <TableHead>Proof</TableHead>
                      <TableHead>Whitelist</TableHead>
                      <TableHead>Verified</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {walletLinks
                      .filter((link) => visibleAccountIds.has(link.registerAccountId))
                      .map((link) => (
                        <TableRow key={link.walletLinkId}>
                          <TableCell className="font-medium">{link.registerAccountId}</TableCell>
                          <TableCell className="max-w-[280px] truncate font-mono text-xs">{link.walletAddress}</TableCell>
                          <TableCell>{link.chainId}</TableCell>
                          <TableCell>
                            <Badge variant={proofVariant(link.proofStatus)}>{link.proofStatus}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={proofVariant(link.whitelistStatus)}>{link.whitelistStatus}</Badge>
                          </TableCell>
                          <TableCell>{formatDate(link.verifiedAt)}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="restrictions">
          <Card>
            <CardHeader>
              <CardTitle>Restricted Register Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Holder</TableHead>
                      <TableHead>Fund / Class</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Reconciled</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows
                      .filter((row) => ["Restricted", "Suspended", "Closed"].includes(row.accountStatus))
                      .map((row) => (
                        <TableRow key={row.registerAccountId}>
                          <TableCell>
                            <div className="font-medium">{row.holderName}</div>
                            <div className="font-mono text-xs text-muted-foreground">{row.registerAccountId}</div>
                          </TableCell>
                          <TableCell>
                            <div>{row.fundName}</div>
                            <div className="text-xs text-muted-foreground">{row.classId}</div>
                          </TableCell>
                          <TableCell>{row.source}</TableCell>
                          <TableCell>
                            <Badge variant={accountVariant(row.accountStatus)}>{row.accountStatus}</Badge>
                          </TableCell>
                          <TableCell>{formatDate(row.lastReconciledAt)}</TableCell>
                        </TableRow>
                      ))}
                    {restrictedCount === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                          No restricted register accounts.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet open={Boolean(selectedRow)} onOpenChange={(open) => (!open ? closeHolderDetail() : undefined)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          {selectedRow ? (
            <>
              <SheetHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={accountVariant(selectedRow.accountStatus)}>{selectedRow.accountStatus}</Badge>
                  <Badge variant="outline">{selectedRow.holderType}</Badge>
                </div>
                <SheetTitle>{selectedRow.holderName}</SheetTitle>
                <SheetDescription>
                  {selectedRow.registerAccountId} · {selectedRow.holderId}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 px-4 pb-6">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">Current units</div>
                    <div className="mt-1 text-lg font-semibold">{selectedRow.units}</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">Fund / class</div>
                    <div className="mt-1 font-medium">{selectedRow.fundName}</div>
                    <div className="text-xs text-muted-foreground">{selectedRow.classId}</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">Wallet state</div>
                    <Badge className="mt-2" variant={proofVariant(selectedRow.walletStatus)}>
                      {walletBucket(selectedWallet)}
                    </Badge>
                  </div>
                </div>

                <Tabs defaultValue="overview" className="gap-4">
                  <TabsList className="max-w-full overflow-x-auto">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                    <TabsTrigger value="snapshots">Snapshots</TabsTrigger>
                    <TabsTrigger value="workflows">Workflows</TabsTrigger>
                    <TabsTrigger value="evidence">Evidence</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview">
                    <div className="grid gap-4 text-sm sm:grid-cols-2">
                      <div className="rounded-lg border p-4">
                        <div className="mb-3 font-medium">Account</div>
                        <div className="space-y-3">
                          <div>
                            <div className="text-muted-foreground">Registered address</div>
                            <div>{selectedRow.registeredAddress}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Source</div>
                            <div>{selectedRow.source}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Opened</div>
                            <div>{formatDate(selectedRow.openedAt)}</div>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg border p-4">
                        <div className="mb-3 font-medium">Wallet</div>
                        <div className="space-y-3">
                          <div>
                            <div className="text-muted-foreground">Address</div>
                            <div className="break-all font-mono text-xs">{selectedWallet?.walletAddress || "No wallet linked"}</div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant={proofVariant(selectedWallet?.proofStatus || "Missing")}>
                              {selectedWallet?.proofStatus || "Missing"}
                            </Badge>
                            <Badge variant={proofVariant(selectedWallet?.whitelistStatus || "Missing")}>
                              {selectedWallet?.whitelistStatus || "Missing"}
                            </Badge>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Verified</div>
                            <div>{formatDate(selectedWallet?.verifiedAt)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="history">
                    <div className="space-y-3">
                      {selectedDeltas.map((delta) => (
                        <div key={delta.deltaId} className="rounded-lg border p-3 text-sm">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="font-medium">{delta.deltaType} · {delta.units} units</div>
                              <div className="font-mono text-xs text-muted-foreground">{delta.deltaId}</div>
                            </div>
                            <Badge variant={deltaVariant(delta)}>{delta.postingStatus}</Badge>
                          </div>
                          <div className="mt-3 grid gap-2 sm:grid-cols-3">
                            <div>
                              <div className="text-muted-foreground">Reason</div>
                              <div>{delta.reasonCode}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Checker</div>
                              <div>{delta.checkerStatus}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Effective</div>
                              <div>{formatDate(delta.effectiveAt)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {selectedDeltas.length === 0 && (
                        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                          No register deltas for this holder.
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="snapshots">
                    <div className="space-y-3">
                      {selectedSnapshots.map(({ snapshot, position, list }) => (
                        <div key={position.positionId} className="rounded-lg border p-3 text-sm">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="font-medium">{snapshot?.sourceType} · {snapshot?.sourceReference}</div>
                              <div className="font-mono text-xs text-muted-foreground">{snapshot?.snapshotId}</div>
                            </div>
                            {snapshot ? <Badge variant={snapshotVariant(snapshot.status)}>{snapshot.status}</Badge> : null}
                          </div>
                          <div className="mt-3 grid gap-2 sm:grid-cols-3">
                            <div>
                              <div className="text-muted-foreground">Units</div>
                              <div>{position.units}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Included</div>
                              <div>{position.included ? "Yes" : position.exclusionReason || "No"}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">List</div>
                              <div>{list?.listType || "No list"} / {list?.status || "Pending"}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {selectedSnapshots.length === 0 && (
                        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                          No holder snapshot position yet.
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="workflows">
                    <div className="space-y-3">
                      {selectedWorkflows.map((workflow) => (
                        <div key={workflow.workflowId} className="rounded-lg border p-3 text-sm">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="font-medium">{workflow.sourceType} / {workflow.sourceReference}</div>
                              <div className="text-xs text-muted-foreground">{workflow.currentStepId} · {workflow.status}</div>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/ta/queue/task-${workflow.workflowId}`}>
                                Open
                                <ArrowUpRight className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                      {selectedWorkflows.length === 0 && (
                        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                          No workflow is linked to this holder yet.
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="evidence">
                    <div className="space-y-3">
                      {selectedEvidence.map((record) => (
                        <div key={record.evidenceRefId} className="rounded-lg border p-3 text-sm">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="font-medium">{record.label}</div>
                              <div className="font-mono text-xs text-muted-foreground">{record.evidenceRefId}</div>
                            </div>
                            <Badge variant="outline">{record.evidenceType}</Badge>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            {record.retentionClass} · {formatDate(record.createdAt)}
                          </div>
                        </div>
                      ))}
                      {selectedEvidence.length === 0 && (
                        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                          No evidence records are linked to this holder.
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
