import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Eye, Filter, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { StatusBadge } from "../components/StatusBadge";
import { useApp } from "../context/AppContext";

type ManageView = "issuance-pipeline" | "active-operations";

export function ManageFundIssuance() {
  const navigate = useNavigate();
  const { fundIssuances, userRole } = useApp();
  const [statusFilter, setStatusFilter] = useState("All");
  const [manageView, setManageView] = useState<ManageView>("issuance-pipeline");

  const fundsByView = useMemo(() => {
    if (manageView === "issuance-pipeline") {
      return fundIssuances.filter((fund) => fund.fundType === "Closed-end");
    }
    return fundIssuances.filter((fund) => fund.fundType === "Open-end");
  }, [fundIssuances, manageView]);

  const filteredFunds = useMemo(() => {
    if (statusFilter === "All") return fundsByView;
    return fundsByView.filter((fund) => fund.status === statusFilter);
  }, [fundsByView, statusFilter]);

  const uniqueStatuses = useMemo(
    () => ["All", ...Array.from(new Set(fundsByView.map((fund) => fund.status)))],
    [fundsByView],
  );

  const handleViewDetails = (id: string) => {
    navigate(userRole === "issuer" ? `/fund-issuance/${id}` : `/marketplace/fund-issuance/${id}`);
  };

  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value);
    toast.success("Fund ID copied");
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 style={{ fontFamily: "var(--font-heading)" }}>
            {userRole === "issuer" ? "Fund Operations" : "Fund Marketplace Inventory"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {userRole === "issuer"
              ? "Switch between closed-end issuance pipeline monitoring and open-end active operations."
              : "Review issuance pipeline funds separately from active operating funds for clearer oversight."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                {statusFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {uniqueStatuses.map((status) => (
                <DropdownMenuItem key={status} onClick={() => setStatusFilter(status)}>
                  {status}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {userRole === "issuer" && (
            <Button onClick={() => navigate("/create/fund-issuance")}>
              <Plus className="w-4 h-4 mr-2" />
              Create Fund
            </Button>
          )}
        </div>
      </div>

      <div className="mb-6">
        <Tabs
          value={manageView}
          onValueChange={(value) => {
            setManageView(value as ManageView);
            setStatusFilter("All");
          }}
        >
          <TabsList>
            <TabsTrigger value="issuance-pipeline">Issuance Pipeline</TabsTrigger>
            <TabsTrigger value="active-operations">Active Operations</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">
            {manageView === "issuance-pipeline" ? "Pipeline Funds" : "Operating Funds"}
          </div>
          <div className="text-2xl font-semibold">{fundsByView.length}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">
            {manageView === "issuance-pipeline" ? "Pending Approval" : "Redemption Open"}
          </div>
          <div className="text-2xl font-semibold">
            {manageView === "issuance-pipeline"
              ? fundsByView.filter((fund) => fund.status === "Pending Approval").length
              : fundsByView.filter((fund) => fund.redemptionStatus === "Open").length}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">
            {manageView === "issuance-pipeline" ? "In Allocation" : "Active Dealing"}
          </div>
          <div className="text-2xl font-semibold">
            {manageView === "issuance-pipeline"
              ? fundsByView.filter((fund) =>
                  ["Allocation Period", "Calculated", "Allocate On Chain", "Allocation Completed"].includes(
                    fund.status,
                  ),
                ).length
              : fundsByView.filter((fund) => fund.status === "Active Dealing").length}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">
            {manageView === "issuance-pipeline" ? "Completed" : "Paused"}
          </div>
          <div className="text-2xl font-semibold">
            {manageView === "issuance-pipeline"
              ? fundsByView.filter((fund) => ["Issuance Completed", "Issuance Active"].includes(fund.status)).length
              : fundsByView.filter((fund) => fund.status === "Paused").length}
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              {manageView === "issuance-pipeline" ? (
                <TableHead>Allocation Status</TableHead>
              ) : (
                <TableHead>Dealing</TableHead>
              )}
              <TableHead>Status</TableHead>
              {manageView === "issuance-pipeline" ? (
                <>
                  <TableHead>Initial NAV</TableHead>
                  <TableHead>Created Time</TableHead>
                </>
              ) : (
                <>
                  <TableHead>Current NAV</TableHead>
                  <TableHead>Next Cut-off</TableHead>
                  <TableHead>Redemption Status</TableHead>
                </>
              )}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFunds.map((fund) => (
              <TableRow key={fund.id}>
                <TableCell className="font-mono text-xs">{fund.id}</TableCell>
                <TableCell>
                  <div className="font-medium">{fund.name}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-[260px]">
                    {fund.description}
                  </div>
                </TableCell>
                {manageView === "issuance-pipeline" ? (
                  <TableCell>
                    <Badge variant="outline">{fund.allocationStatus || "N/A"}</Badge>
                  </TableCell>
                ) : (
                  <TableCell className="text-sm">
                    {fund.dealingFrequency || fund.redemptionFrequency || "One-off"}
                  </TableCell>
                )}
                <TableCell>
                  <StatusBadge status={fund.status} />
                </TableCell>
                {manageView === "issuance-pipeline" ? (
                  <>
                    <TableCell className="text-sm">{fund.initialNav}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {fund.createdTime || "N/A"}
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell className="text-sm">{fund.currentNav}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {fund.nextCutoffTime || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={fund.redemptionStatus === "Open" ? "default" : "secondary"}>
                        {fund.redemptionStatus || "N/A"}
                      </Badge>
                    </TableCell>
                  </>
                )}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewDetails(fund.id)}>
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(fund.id)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredFunds.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={manageView === "issuance-pipeline" ? 7 : 8}
                  className="text-center py-12 text-muted-foreground"
                >
                  No funds matched the current filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
