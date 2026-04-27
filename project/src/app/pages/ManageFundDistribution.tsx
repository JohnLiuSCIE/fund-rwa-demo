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
      <div className="flex items-center justify-between mb-8">
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
        <Button onClick={handleCreateNew}>
          <Plus className="w-4 h-4 mr-2" />
          {inFundContext ? "Create Distribution For This Fund" : "Create Distribution Event"}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
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
      <div className="bg-white border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Event Type</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Asset Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
              <TableHead>Created Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleDistributions.length > 0 ? (
              visibleDistributions.map((distribution) => (
                <TableRow key={distribution.id}>
                  {(() => {
                    return (
                      <>
                  <TableCell className="font-mono text-xs">
                    <span className="text-muted-foreground">
                      {distribution.id.substring(0, 12)}...
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">Distribution</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{distribution.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground max-w-[300px] truncate">
                      {distribution.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{distribution.assetType}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(distribution.status)}>
                      {distribution.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(distribution.id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {distribution.createdTime || "N/A"}
                  </TableCell>
                      </>
                    );
                  })()}
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
    </div>
  );
}
