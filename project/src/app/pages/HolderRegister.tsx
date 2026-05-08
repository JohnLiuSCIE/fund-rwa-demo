import { useMemo, useState } from "react";
import { FileClock, LockKeyhole, ShieldCheck, WalletCards } from "lucide-react";

import { MetricCard } from "../components/MetricCard";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useApp } from "../context/AppContext";
import { buildHolderOwnershipProjection } from "../lib/transferAgency";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

function accountVariant(status: string): BadgeVariant {
  if (["Restricted", "Suspended", "Closed"].includes(status)) return "destructive";
  if (status === "Pending") return "secondary";
  return "outline";
}

function proofVariant(status: string): BadgeVariant {
  if (status.includes("Expired") || status.includes("Rejected") || status.includes("Missing")) return "destructive";
  if (status.includes("Pending") || status.includes("Submitted")) return "secondary";
  return "outline";
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
  } = useApp();
  const [query, setQuery] = useState("");

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

  const filteredRows = rows.filter((row) => {
    const haystack = `${row.holderName} ${row.fundName} ${row.classId} ${row.walletAddress}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  const restrictedCount = rows.filter((row) => ["Restricted", "Suspended"].includes(row.accountStatus)).length;
  const walletExceptionCount = walletLinks.filter((link) =>
    ["Missing", "Expired", "Rejected"].includes(link.proofStatus),
  ).length;
  const latestVersions = [...registerVersions].sort((a, b) =>
    (b.releasedAt || b.effectiveAt).localeCompare(a.releasedAt || a.effectiveAt),
  );

  return (
    <div className="container mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="outline">Holder Register</Badge>
            <Badge variant="secondary">Canonical View</Badge>
          </div>
          <h1 style={{ fontFamily: "var(--font-heading)" }}>Current Register</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Holder positions, wallet links, restrictions, and released register versions from the shared record.
          </p>
        </div>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search holder, fund, class, wallet"
          className="max-w-md"
        />
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <MetricCard icon={ShieldCheck} label="Register Accounts" value={rows.length} variant="primary" />
        <MetricCard icon={WalletCards} label="Wallet Exceptions" value={walletExceptionCount} variant="warning" />
        <MetricCard icon={LockKeyhole} label="Restricted Accounts" value={restrictedCount} variant="warning" />
        <MetricCard
          icon={FileClock}
          label="Register Versions"
          value={registerVersions.length}
          variant="success"
        />
      </div>

      <Tabs defaultValue="register" className="gap-4">
        <TabsList className="max-w-full overflow-x-auto">
          <TabsTrigger value="register">Current Register</TabsTrigger>
          <TabsTrigger value="versions">Register Versions</TabsTrigger>
          <TabsTrigger value="wallets">Wallet Links</TabsTrigger>
          <TabsTrigger value="restrictions">Restrictions</TabsTrigger>
        </TabsList>

        <TabsContent value="register">
          <Card>
            <CardHeader>
              <CardTitle>Holder Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Holder</TableHead>
                    <TableHead>Fund / Class</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Wallet</TableHead>
                    <TableHead>Last Delta</TableHead>
                    <TableHead>Snapshot</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((row) => (
                    <TableRow key={row.registerAccountId}>
                      <TableCell>
                        <div className="font-medium">{row.holderName}</div>
                        <div className="text-xs text-muted-foreground">{row.holderType}</div>
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
                        <div className="max-w-[240px] truncate font-mono text-xs">{row.walletAddress}</div>
                        <Badge className="mt-1" variant={proofVariant(row.walletStatus)}>
                          {row.walletStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{row.lastDeltaStatus}</TableCell>
                      <TableCell>
                        <div className="max-w-[220px] truncate font-mono text-xs">
                          {row.latestSnapshotId || "No snapshot"}
                        </div>
                        {row.latestSnapshotStatus ? (
                          <Badge className="mt-1" variant="outline">
                            {row.latestSnapshotStatus} / {row.latestListStatus || "No list"}
                          </Badge>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                        No holder account matches this search.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions">
          <Card>
            <CardHeader>
              <CardTitle>Register Version History</CardTitle>
            </CardHeader>
            <CardContent>
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
                        <div>{version.fundId}</div>
                        <div className="text-xs text-muted-foreground">{version.classId}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={version.status === "Released" ? "outline" : "secondary"}>{version.status}</Badge>
                      </TableCell>
                      <TableCell>{version.totalHolders}</TableCell>
                      <TableCell>{version.totalUnits}</TableCell>
                      <TableCell>{version.releasedAt || "Not released"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallets">
          <Card>
            <CardHeader>
              <CardTitle>Wallet Links</CardTitle>
            </CardHeader>
            <CardContent>
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
                  {walletLinks.map((link) => (
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
                      <TableCell>{link.verifiedAt || "Not verified"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="restrictions">
          <Card>
            <CardHeader>
              <CardTitle>Restricted Register Accounts</CardTitle>
            </CardHeader>
            <CardContent>
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
                  {rows
                    .filter((row) => ["Restricted", "Suspended", "Closed"].includes(row.accountStatus))
                    .map((row) => (
                      <TableRow key={row.registerAccountId}>
                        <TableCell className="font-medium">{row.holderName}</TableCell>
                        <TableCell>
                          <div>{row.fundName}</div>
                          <div className="text-xs text-muted-foreground">{row.classId}</div>
                        </TableCell>
                        <TableCell>{row.source}</TableCell>
                        <TableCell>
                          <Badge variant={accountVariant(row.accountStatus)}>{row.accountStatus}</Badge>
                        </TableCell>
                        <TableCell>{row.lastReconciledAt || "Pending"}</TableCell>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
