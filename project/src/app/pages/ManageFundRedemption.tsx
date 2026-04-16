import { useNavigate } from "react-router-dom";
import { Eye, Plus } from "lucide-react";

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

export function ManageFundRedemption() {
  const navigate = useNavigate();
  const { fundRedemptions } = useApp();

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 style={{ fontFamily: "var(--font-heading)" }}>Fund Redemption Operations</h1>
          <p className="text-muted-foreground mt-2">
            Manage daily dealing and window-based redemption setups for open-end funds.
          </p>
        </div>

        <Button onClick={() => navigate("/create/fund-redemption")}>
          <Plus className="w-4 h-4 mr-2" />
          Create Redemption Setup
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Total Setups</div>
          <div className="text-2xl font-semibold">{fundRedemptions.length}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Daily dealing</div>
          <div className="text-2xl font-semibold">
            {fundRedemptions.filter((item) => item.redemptionMode === "Daily dealing").length}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Active</div>
          <div className="text-2xl font-semibold">
            {fundRedemptions.filter((item) => item.status === "Active" || item.status === "Window Open").length}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Draft / Pending</div>
          <div className="text-2xl font-semibold">
            {fundRedemptions.filter((item) => item.status === "Draft" || item.status === "Pending Approval").length}
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Fund</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Latest NAV</TableHead>
              <TableHead>Settlement</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fundRedemptions.map((redemption) => (
              <TableRow key={redemption.id}>
                <TableCell className="font-mono text-xs">{redemption.id}</TableCell>
                <TableCell>
                  <div className="font-medium">{redemption.fundName}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-[260px]">
                    {redemption.description}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{redemption.redemptionMode}</Badge>
                </TableCell>
                <TableCell>
                  <StatusBadge status={redemption.status} />
                </TableCell>
                <TableCell className="text-sm">{redemption.latestNav}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {redemption.settlementCycle}
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/fund-redemption/${redemption.id}`)}>
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {fundRedemptions.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No redemption setups found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
