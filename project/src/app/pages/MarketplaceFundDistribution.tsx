import { useMemo } from "react";
import { Eye, HandCoins } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

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
import { useApp } from "../context/AppContext";

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    Draft: "bg-gray-100 text-gray-800",
    "Pending Approval": "bg-amber-100 text-amber-800",
    "Pending Listing": "bg-yellow-100 text-yellow-800",
    Upcoming: "bg-blue-100 text-blue-800",
    "Pending Allocation": "bg-purple-100 text-purple-800",
    "Put On Chain": "bg-indigo-100 text-indigo-800",
    "Open For Distribution": "bg-green-100 text-green-800",
    Done: "bg-teal-100 text-teal-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

export function MarketplaceFundDistribution() {
  const { fundDistributions } = useApp();

  const openForClaimCount = useMemo(
    () =>
      fundDistributions.filter(
        (distribution) =>
          distribution.status === "Open For Distribution" && distribution.payoutMode !== "Direct Transfer",
      ).length,
    [fundDistributions],
  );

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 style={{ fontFamily: "var(--font-heading)" }}>Fund Distribution Marketplace</h1>
        <p className="text-muted-foreground mt-2">
          View distribution schedules and claim payouts when claim windows are open.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Total Distributions</div>
          <div className="text-2xl font-semibold">{fundDistributions.length}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Open For Claim</div>
          <div className="text-2xl font-semibold">{openForClaimCount}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Auto Distribution</div>
          <div className="text-2xl font-semibold">
            {
              fundDistributions.filter(
                (distribution) =>
                  distribution.status === "Open For Distribution" && distribution.payoutMode === "Direct Transfer",
              ).length
            }
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Completed</div>
          <div className="text-2xl font-semibold">
            {fundDistributions.filter((distribution) => distribution.status === "Done").length}
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Payout Mode</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Record Date</TableHead>
              <TableHead>Payment Date</TableHead>
              <TableHead>Investor Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fundDistributions.map((distribution) => {
              const claimable =
                distribution.status === "Open For Distribution" && distribution.payoutMode !== "Direct Transfer";

              return (
                <TableRow key={distribution.id}>
                  <TableCell className="font-mono text-xs">{distribution.id}</TableCell>
                  <TableCell>
                    <div className="font-medium">{distribution.name}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[280px]">
                      {distribution.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{distribution.payoutMode || "Claim"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(distribution.status)}>{distribution.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{distribution.recordDate || "-"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{distribution.paymentDate || "-"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/marketplace/fund-distribution/${distribution.id}`}>
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        disabled={!claimable}
                        onClick={() => toast.success(`Claim request submitted for ${distribution.name}`)}
                      >
                        <HandCoins className="w-4 h-4 mr-1" />
                        Claim
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {fundDistributions.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No fund distributions are currently available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
