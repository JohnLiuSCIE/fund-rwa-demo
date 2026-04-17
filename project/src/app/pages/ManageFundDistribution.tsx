import { useNavigate } from "react-router-dom";
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
  const { fundDistributions } = useApp();

  const handleViewDetails = (id: string) => {
    navigate(`/fund-distribution/${id}`);
  };

  const handleCreateNew = () => {
    navigate("/create/fund-distribution");
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)' }}>Fund Distribution List</h1>
          <p className="text-muted-foreground mt-2">
            Manage all fund income distributions
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="w-4 h-4 mr-2" />
          Create Distribution
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Total Distributions</div>
          <div className="text-2xl font-semibold">{fundDistributions.length}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Draft</div>
          <div className="text-2xl font-semibold">
            {fundDistributions.filter(d => d.status === "Draft").length}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Active</div>
          <div className="text-2xl font-semibold">
            {fundDistributions.filter(d => d.status === "Open For Distribution").length}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Completed</div>
          <div className="text-2xl font-semibold">
            {fundDistributions.filter(d => d.status === "Done").length}
          </div>
        </div>
      </div>

      {/* Distribution List Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Asset Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
              <TableHead>Created Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fundDistributions.length > 0 ? (
              fundDistributions.map((distribution) => (
                <TableRow key={distribution.id}>
                  <TableCell className="font-mono text-xs">
                    <span className="text-muted-foreground">
                      {distribution.id.substring(0, 12)}...
                    </span>
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
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="text-muted-foreground">
                    No distributions found. Create your first distribution to get started!
                  </div>
                  <Button className="mt-4" onClick={handleCreateNew}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Distribution
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
