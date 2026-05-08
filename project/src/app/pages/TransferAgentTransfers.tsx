import { Cable, CircleDashed, ShieldAlert, Workflow } from "lucide-react";

import { MetricCard } from "../components/MetricCard";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { useApp } from "../context/AppContext";

export function TransferAgentTransfers() {
  const { transferAgencyInstructions, reconciliationBreaks } = useApp();
  const transferInstructions = transferAgencyInstructions.filter((instruction) => instruction.instructionType === "Transfer");
  const vatpInstructions = transferInstructions.filter((instruction) => instruction.sourceActorType === "VATP");
  const restrictedBreaks = reconciliationBreaks.filter((item) =>
    ["RestrictedTransfer", "WalletNotMapped"].includes(item.breakType),
  );

  return (
    <div className="container mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="outline">Secondary Bridge</Badge>
          <Badge variant="secondary">Designed, not enabled in MVP</Badge>
        </div>
        <h1 style={{ fontFamily: "var(--font-heading)" }}>Transfer Bridge</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          VATP-originated transfer instructions are modeled as register instructions, but posting is disabled for this release.
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <MetricCard icon={Cable} label="Transfer Instructions" value={transferInstructions.length} variant="primary" />
        <MetricCard icon={Workflow} label="VATP Sources" value={vatpInstructions.length} />
        <MetricCard icon={ShieldAlert} label="Transfer Breaks" value={restrictedBreaks.length} variant="warning" />
        <MetricCard icon={CircleDashed} label="Posting Status" value="Disabled" variant="warning" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Modeled Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instruction</TableHead>
                  <TableHead>Fund / Class</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transferInstructions.map((instruction) => (
                  <TableRow key={instruction.instructionId}>
                    <TableCell className="font-medium">{instruction.instructionId}</TableCell>
                    <TableCell>
                      <div>{instruction.fundId}</div>
                      <div className="text-xs text-muted-foreground">{instruction.classId}</div>
                    </TableCell>
                    <TableCell>{instruction.sourceActorType} / {instruction.sourceChannel}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{instruction.status}</Badge>
                    </TableCell>
                    <TableCell>{instruction.sourceReference || "N/A"}</TableCell>
                  </TableRow>
                ))}
                {transferInstructions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                      No transfer instructions modeled yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enablement Gates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              ["Licensed source", "SFC-licensed VATP or approved omnibus source"],
              ["Wallet control", "Verified holder wallet and whitelist evidence"],
              ["Restriction check", "No restricted holder or blocked transfer reason"],
              ["Finality match", "Token movement, register delta, and evidence pack reconciled"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border p-4">
                <div className="font-medium">{label}</div>
                <div className="mt-1 text-sm text-muted-foreground">{value}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
