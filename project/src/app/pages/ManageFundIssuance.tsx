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
import { StatusBadge } from "../components/StatusBadge";
import { useApp } from "../context/AppContext";

export function ManageFundIssuance() {
  const navigate = useNavigate();
  const { fundIssuances, userRole } = useApp();
  const [statusFilter, setStatusFilter] = useState("All");

  const openEndFunds = useMemo(
    () => fundIssuances.filter((fund) => fund.fundType === "Open-end"),
    [fundIssuances],
  );

  const filteredFunds = useMemo(() => {
    if (statusFilter === "All") return fundIssuances;
    return fundIssuances.filter((fund) => fund.status === statusFilter);
  }, [fundIssuances, statusFilter]);

  const uniqueStatuses = useMemo(
    () => ["All", ...Array.from(new Set(fundIssuances.map((fund) => fund.status)))],
    [fundIssuances],
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
              ? "Track both open-end operating funds and closed-end issuance pipelines from approval through activation."
              : "Review available open-end and closed-end funds with their current operating or issuance status."}
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

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Total Funds</div>
          <div className="text-2xl font-semibold">{fundIssuances.length}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Open-end</div>
          <div className="text-2xl font-semibold">{openEndFunds.length}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Active Dealing</div>
          <div className="text-2xl font-semibold">
            {fundIssuances.filter((fund) => fund.status === "Active Dealing").length}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Paused</div>
          <div className="text-2xl font-semibold">
            {fundIssuances.filter((fund) => fund.status === "Paused").length}
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Fund Type</TableHead>
              <TableHead>Dealing</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Current NAV</TableHead>
              <TableHead>Next Cut-off</TableHead>
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
                <TableCell>
                  <Badge variant="outline">{fund.fundType}</Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {fund.dealingFrequency || fund.redemptionFrequency || "One-off"}
                </TableCell>
                <TableCell>
                  <StatusBadge status={fund.status} />
                </TableCell>
                <TableCell className="text-sm">
                  {fund.fundType === "Open-end" ? fund.currentNav : fund.initialNav}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {fund.nextCutoffTime || "N/A"}
                </TableCell>
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
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
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
