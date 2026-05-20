import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Plus, Eye } from "lucide-react";
import { useApp } from "../context/AppContext";

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    "Draft": "bg-gray-100 text-gray-800",
    "Pending Approval": "bg-amber-100 text-amber-800",
    "Pending Listing": "bg-yellow-100 text-yellow-800",
    "Upcoming": "bg-blue-100 text-blue-800",
    "Pending Allocation": "bg-purple-100 text-purple-800",
    "Put On Chain": "bg-indigo-100 text-indigo-800",
    "Open For Distribution": "bg-green-100 text-green-800",
    "Done": "bg-teal-100 text-teal-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

const getQueueOwner = (status: string) => {
  if (["Draft", "Pending Listing", "Upcoming"].includes(status)) return "Issuer Maker";
  if (status === "Pending Approval") return "Issuer Checker";
  if (["Snapshot Locked", "Pending Allocation"].includes(status)) return "Transfer Agent";
  if (["Put On Chain", "Open For Distribution"].includes(status)) return "Issuer Treasury";
  if (status === "Reconciled") return "Issuer Ops";
  return "Closed";
};

const getQueueNextAction = (status: string, payoutMode?: string) => {
  const actions: Record<string, string> = {
    Draft: "Submit for approval",
    "Pending Approval": "Approve",
    "Pending Listing": "Publish notice",
    Upcoming: "Lock snapshot",
    "Snapshot Locked": "Generate recipients",
    "Pending Allocation": "Put on chain",
    "Put On Chain": payoutMode === "Direct Transfer" ? "Start transfers" : "Open claims",
    "Open For Distribution": "Reconcile",
    Reconciled: "Mark complete",
    Done: "Archive",
  };
  return actions[status] || "Review";
};

const getQueueWaitingReason = (status: string) => {
  const reasons: Record<string, string> = {
    Draft: "Setup pending",
    "Pending Approval": "Checker decision",
    "Pending Listing": "Notice package",
    Upcoming: "Record date",
    "Snapshot Locked": "TA recipient file",
    "Pending Allocation": "Funding and TA output",
    "Put On Chain": "On-chain release",
    "Open For Distribution": "Payout evidence",
    Reconciled: "Close-out signoff",
    Done: "Complete",
  };
  return reasons[status] || "Review required";
};

export function ManageFundDistribution() {
  const navigate = useNavigate();
  const { fundId } = useParams();
  const { fundDistributions, fundIssuances } = useApp();
  const linkedFund = fundIssuances.find((fund) => fund.id === fundId);
  const inFundContext = Boolean(fundId);
  const visibleDistributions = useMemo(
    () =>
      inFundContext
        ? fundDistributions.filter((distribution) => distribution.fundId === fundId)
        : fundDistributions,
    [fundDistributions, fundId, inFundContext],
  );
  const createPath = inFundContext
    ? `/fund-issuance/${fundId}/distributions/create`
    : "/create/fund-distribution";
  const getDetailPath = (id: string) =>
    inFundContext ? `/fund-issuance/${fundId}/distributions/${id}` : `/fund-distribution/${id}`;

  const handleViewDetails = (id: string) => {
    navigate(getDetailPath(id));
  };

  const handleCreateNew = () => {
    navigate(createPath);
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      {inFundContext && linkedFund && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link
            to={`/fund-issuance/${linkedFund.id}`}
            className="hover:text-foreground transition-colors"
          >
            {linkedFund.name}
          </Link>
          <span>/</span>
          <span className="text-foreground">Distributions</span>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)' }}>
            {inFundContext ? "Fund Distributions" : "Global Distribution Queue"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {inFundContext
              ? `Manage distribution events for ${linkedFund?.name || "this fund"}.`
              : "Manage open-end and closed-end distributions from one global operations queue."}
          </p>
        </div>
        <Button className="w-full md:w-auto" onClick={handleCreateNew}>
          <Plus className="w-4 h-4 mr-2" />
          {inFundContext ? "Create Distribution For This Fund" : "Create Distribution Event"}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Total Distribution Events</div>
          <div className="text-2xl font-semibold">{visibleDistributions.length}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Draft</div>
          <div className="text-2xl font-semibold">
            {visibleDistributions.filter(d => d.status === "Draft").length}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Active</div>
          <div className="text-2xl font-semibold">
            {visibleDistributions.filter(d => d.status === "Open For Distribution").length}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Completed</div>
          <div className="text-2xl font-semibold">
            {visibleDistributions.filter(d => d.status === "Done").length}
          </div>
        </div>
      </div>

      {/* Distribution List Table */}
      <div className="hidden bg-white border rounded-lg md:block">
        <Table className="min-w-[1120px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[22%]">Distribution</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Record Date</TableHead>
              <TableHead>Payment Date</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Next Action</TableHead>
              <TableHead>Blocker / Waiting</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleDistributions.length > 0 ? (
              visibleDistributions.map((distribution) => (
                <TableRow key={distribution.id}>
                  <TableCell>
                    <div className="min-w-0">
                      <div className="font-medium">{distribution.name}</div>
                      <div className="mt-1 font-mono text-xs text-muted-foreground">
                        {distribution.id.substring(0, 12)}...
                      </div>
                      <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {distribution.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(distribution.status)}>
                      {distribution.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {distribution.recordDate || "Pending"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {distribution.paymentDate || "Pending"}
                  </TableCell>
                  <TableCell className="text-sm">{getQueueOwner(distribution.status)}</TableCell>
                  <TableCell className="text-sm font-medium">
                    {getQueueNextAction(distribution.status, distribution.payoutMode)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {getQueueWaitingReason(distribution.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(distribution.id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="text-muted-foreground">
                    {inFundContext
                      ? "No distribution events have been created for this fund yet."
                      : "No distribution events found. Create your first distribution to get started."}
                  </div>
                  <Button className="mt-4" onClick={handleCreateNew}>
                    <Plus className="w-4 h-4 mr-2" />
                    {inFundContext ? "Create Distribution For This Fund" : "Create Your First Distribution Event"}
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 md:hidden">
        {visibleDistributions.length > 0 ? (
          visibleDistributions.map((distribution) => (
            <div key={distribution.id} className="rounded-lg border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="break-words font-medium">{distribution.name}</div>
                  <div className="mt-1 font-mono text-xs text-muted-foreground">{distribution.id.substring(0, 12)}...</div>
                </div>
                <Badge className={getStatusColor(distribution.status)}>{distribution.status}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Record</div>
                  <div className="font-medium">{distribution.recordDate || "Pending"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Payment</div>
                  <div className="font-medium">{distribution.paymentDate || "Pending"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Owner</div>
                  <div className="font-medium">{getQueueOwner(distribution.status)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Next</div>
                  <div className="font-medium">{getQueueNextAction(distribution.status, distribution.payoutMode)}</div>
                </div>
              </div>
              <div className="mt-3 rounded-md border bg-secondary/30 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Waiting: </span>
                <span className="font-medium">{getQueueWaitingReason(distribution.status)}</span>
              </div>
              <Button className="mt-4 w-full" variant="outline" onClick={() => handleViewDetails(distribution.id)}>
                <Eye className="w-4 h-4 mr-2" />
                View Distribution
              </Button>
            </div>
          ))
        ) : (
          <div className="rounded-lg border bg-white p-6 text-center">
            <div className="text-muted-foreground">
              {inFundContext
                ? "No distribution events have been created for this fund yet."
                : "No distribution events found. Create your first distribution to get started."}
            </div>
            <Button className="mt-4 w-full" onClick={handleCreateNew}>
              <Plus className="w-4 h-4 mr-2" />
              {inFundContext ? "Create Distribution For This Fund" : "Create Your First Distribution Event"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
