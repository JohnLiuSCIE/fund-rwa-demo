import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import type { AnchoringEvent, OnChainEvent } from "../data/fundDemoData";

export interface OnChainRequirement {
  label: string;
  category: "Contract" | "Hash Anchor" | "Off-chain";
  status: "Complete" | "Pending" | "Blocked" | "Private";
  detail: string;
}

function shortHash(value?: string) {
  if (!value) return "Pending";
  if (value.length <= 18) return value;
  return `${value.slice(0, 10)}...${value.slice(-6)}`;
}

function statusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  if (["Confirmed", "Finalized"].includes(status)) return "default";
  if (["Submitted", "Prepared"].includes(status)) return "secondary";
  if (status === "Failed") return "destructive";
  return "outline";
}

function requirementVariant(status: OnChainRequirement["status"]): "default" | "secondary" | "outline" | "destructive" {
  if (status === "Complete") return "default";
  if (status === "Blocked") return "destructive";
  if (status === "Private") return "outline";
  return "secondary";
}

interface OnChainEvidencePanelProps {
  title?: string;
  sourceReference: string;
  sourceReferences?: string[];
  onChainEvents: OnChainEvent[];
  anchoringEvents: AnchoringEvent[];
  requirements?: OnChainRequirement[];
}

export function OnChainEvidencePanel({
  title = "On-chain Evidence",
  sourceReference,
  sourceReferences,
  onChainEvents,
  anchoringEvents,
  requirements = [],
}: OnChainEvidencePanelProps) {
  const sourceReferenceSet = new Set(sourceReferences?.length ? sourceReferences : [sourceReference]);
  const scopedChainEvents = onChainEvents.filter((event) => sourceReferenceSet.has(event.sourceReference));
  const scopedAnchors = anchoringEvents.filter((event) => sourceReferenceSet.has(event.sourceReference));
  const confirmedCount =
    scopedChainEvents.filter((event) => ["Confirmed", "Finalized"].includes(event.status)).length +
    scopedAnchors.filter((event) => event.status === "Confirmed").length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>{title}</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{scopedChainEvents.length} contract event(s)</Badge>
            <Badge variant="outline">{scopedAnchors.length} anchor(s)</Badge>
            <Badge variant={confirmedCount > 0 ? "default" : "secondary"}>{confirmedCount} confirmed</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {requirements.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2">
            {requirements.map((requirement) => (
              <div key={`${requirement.category}-${requirement.label}`} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">{requirement.category}</div>
                    <div className="mt-1 font-medium">{requirement.label}</div>
                  </div>
                  <Badge variant={requirementVariant(requirement.status)}>{requirement.status}</Badge>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">{requirement.detail}</div>
              </div>
            ))}
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract Event</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Tx Hash</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scopedChainEvents.map((event) => (
                <TableRow key={event.onChainEventId}>
                  <TableCell>
                    <div className="font-medium">{event.eventType}</div>
                    <div className="text-xs text-muted-foreground">{event.chainId}</div>
                  </TableCell>
                  <TableCell>{event.method || "N/A"}</TableCell>
                  <TableCell>
                    {event.amount ? (
                      <div>
                        <div>{event.amount}</div>
                        <div className="text-xs text-muted-foreground">{event.currency || "Unit"}</div>
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{shortHash(event.txHash)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(event.status)}>{event.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {scopedChainEvents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                    No contract event has been recorded for this source yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Anchor</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Content Hash</TableHead>
                <TableHead>Merkle Root</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scopedAnchors.map((event) => (
                <TableRow key={event.anchoringEventId}>
                  <TableCell>
                    <div className="font-medium">{event.anchorType}</div>
                    <div className="text-xs text-muted-foreground">{event.chainId}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{event.targetId}</TableCell>
                  <TableCell className="font-mono text-xs">{shortHash(event.contentHash)}</TableCell>
                  <TableCell className="font-mono text-xs">{shortHash(event.merkleRoot)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(event.status)}>{event.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {scopedAnchors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                    No hash anchor has been recorded for this source yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
