import { useMemo, useState } from "react";
import { Archive, FileCheck2, Fingerprint, ShieldCheck } from "lucide-react";

import { MetricCard } from "../components/MetricCard";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useApp } from "../context/AppContext";
import type { EvidenceRecord } from "../data/fundDemoData";
import { buildEvidencePacks } from "../lib/transferAgency";

type EvidenceFilter = "all" | EvidenceRecord["retentionClass"];
type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

function retentionVariant(retentionClass: string): BadgeVariant {
  if (retentionClass.includes("Regulatory")) return "default";
  if (retentionClass.includes("Audit")) return "secondary";
  return "outline";
}

function workflowVariant(status: string): BadgeVariant {
  if (status === "Reconciled" || status === "Acknowledged") return "default";
  if (status === "SubmittedToIssuer" || status === "IssuerAcknowledged" || status === "Generated") return "secondary";
  return "outline";
}

export function TransferAgentEvidence() {
  const {
    evidenceRecords,
    fundIssuances,
    holderSnapshots,
    holderSnapshotPositions,
    settlementLists,
    settlementListLines,
  } = useApp();
  const [filter, setFilter] = useState<EvidenceFilter>("all");

  const packs = useMemo(() => buildEvidencePacks(evidenceRecords), [evidenceRecords]);
  const filteredPacks = packs.filter((pack) => filter === "all" || pack.retentionClass.includes(filter));
  const regulatoryRecords = evidenceRecords.filter((record) => record.retentionClass === "Regulatory");
  const hashes = evidenceRecords.filter((record) => record.contentHash);
  const fundNameById = useMemo(
    () => new Map(fundIssuances.map((fund) => [fund.id, fund.name])),
    [fundIssuances],
  );
  const snapshotPacks = useMemo(
    () =>
      holderSnapshots
        .map((snapshot) => {
          const positions = holderSnapshotPositions.filter((position) => position.snapshotId === snapshot.snapshotId);
          const list = settlementLists.find((item) => item.snapshotId === snapshot.snapshotId);
          const lines = list ? settlementListLines.filter((line) => line.listId === list.listId) : [];
          const evidence = evidenceRecords.filter(
            (record) =>
              record.instructionId === snapshot.instructionId ||
              lines.some((line) => line.evidenceRefIds.includes(record.evidenceRefId)),
          );

          return {
            snapshot,
            list,
            positions,
            lines,
            evidence,
            includedCount: positions.filter((position) => position.included).length,
          };
        })
        .sort((left, right) => right.snapshot.recordDate.localeCompare(left.snapshot.recordDate)),
    [evidenceRecords, holderSnapshotPositions, holderSnapshots, settlementListLines, settlementLists],
  );

  return (
    <div className="container mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="outline">Evidence Pack</Badge>
          <Badge variant="secondary">Export Ready</Badge>
        </div>
        <h1 style={{ fontFamily: "var(--font-heading)" }}>TA Evidence</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Evidence grouped by instruction, register delta, and released register version.
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <MetricCard icon={Archive} label="Evidence Records" value={evidenceRecords.length} variant="primary" />
        <MetricCard icon={FileCheck2} label="Snapshot Packs" value={snapshotPacks.length} />
        <MetricCard icon={ShieldCheck} label="Regulatory Records" value={regulatoryRecords.length} variant="success" />
        <MetricCard icon={Fingerprint} label="Content Hashes" value={hashes.length} variant="warning" />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Snapshot / Settlement Packs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {snapshotPacks.map(({ snapshot, list, positions, lines, evidence, includedCount }) => (
            <div key={snapshot.snapshotId} className="rounded-lg border p-4">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium">
                    {fundNameById.get(snapshot.fundId) || snapshot.fundId}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {snapshot.sourceType} / {snapshot.sourceReference}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={workflowVariant(snapshot.status)}>{snapshot.status}</Badge>
                  {list ? <Badge variant={workflowVariant(list.status)}>{list.listType}</Badge> : null}
                </div>
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <div className="text-muted-foreground">Register Version</div>
                  <div className="mt-1 truncate font-mono text-xs">{snapshot.registerVersionId}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Record Date</div>
                  <div className="mt-1 font-medium">{snapshot.recordDate}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Positions</div>
                  <div className="mt-1 font-medium">
                    {includedCount} / {positions.length} included
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Settlement Lines</div>
                  <div className="mt-1 font-medium">
                    {list ? `${lines.length} ${list.status}` : "No list"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Evidence</div>
                  <div className="mt-1 font-medium">{evidence.length} record(s)</div>
                </div>
              </div>
            </div>
          ))}
          {snapshotPacks.length === 0 && (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No holder snapshot evidence has been created yet.
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={filter} onValueChange={(value) => setFilter(value as EvidenceFilter)} className="gap-4">
        <TabsList className="max-w-full overflow-x-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="Regulatory">Regulatory</TabsTrigger>
          <TabsTrigger value="Audit">Audit</TabsTrigger>
          <TabsTrigger value="Operational">Operational</TabsTrigger>
        </TabsList>

        <TabsContent value={filter}>
          <div className="grid gap-6 lg:grid-cols-[1fr_1.35fr]">
            <Card>
              <CardHeader>
                <CardTitle>Evidence Packs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredPacks.map((pack) => (
                  <div key={pack.packId} className="rounded-lg border p-4">
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="font-medium">{pack.title}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {pack.classId || "Class pending"} / {pack.latestEvidenceAt}
                        </div>
                      </div>
                      <Badge variant={retentionVariant(pack.retentionClass)}>{pack.retentionClass}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-muted-foreground">Records</div>
                        <div className="font-medium">{pack.recordCount}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Pack ID</div>
                        <div className="truncate font-mono text-xs">{pack.packId}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredPacks.length === 0 && (
                  <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                    No evidence packs match this retention filter.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Evidence Records</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Evidence</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Fund / Class</TableHead>
                      <TableHead>Retention</TableHead>
                      <TableHead>Hash</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {evidenceRecords
                      .filter((record) => filter === "all" || record.retentionClass === filter)
                      .map((record) => (
                        <TableRow key={record.evidenceRefId}>
                          <TableCell>
                            <div className="font-medium">{record.label}</div>
                            <div className="font-mono text-xs text-muted-foreground">{record.evidenceRefId}</div>
                          </TableCell>
                          <TableCell>{record.evidenceType}</TableCell>
                          <TableCell>
                            <div>{record.fundId || "Global"}</div>
                            <div className="text-xs text-muted-foreground">{record.classId || "N/A"}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={retentionVariant(record.retentionClass)}>{record.retentionClass}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[220px] truncate font-mono text-xs">
                            {record.contentHash || "No hash"}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
