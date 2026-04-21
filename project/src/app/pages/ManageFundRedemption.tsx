import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
  const { fundId } = useParams();
  const { fundRedemptions, fundIssuances } = useApp();
  const linkedFund = fundIssuances.find((fund) => fund.id === fundId);
  const inFundContext = Boolean(fundId);
  const visibleRedemptions = useMemo(
    () =>
      inFundContext
        ? fundRedemptions.filter((redemption) => redemption.fundId === fundId)
        : fundRedemptions,
    [fundId, fundRedemptions, inFundContext],
  );
  const activeCount = visibleRedemptions.filter(
    (item) => item.status === "Active" || item.status === "Window Open",
  ).length;
  const dailyDealingCount = visibleRedemptions.filter(
    (item) => item.redemptionMode === "Daily dealing",
  ).length;
  const draftPendingCount = visibleRedemptions.filter(
    (item) => item.status === "Draft" || item.status === "Pending Approval",
  ).length;
  const createPath = inFundContext
    ? `/fund-issuance/${fundId}/redemptions/create`
    : "/create/fund-redemption";
  const getDetailPath = (id: string) =>
    inFundContext ? `/fund-issuance/${fundId}/redemptions/${id}` : `/fund-redemption/${id}`;

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
          <span className="text-foreground">Redemptions</span>
        </div>
      )}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 style={{ fontFamily: "var(--font-heading)" }}>
            {inFundContext ? "Fund Redemptions" : "Global Redemption Queue"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {inFundContext
              ? `Manage redemption operations for ${linkedFund?.name || "this fund"}.`
              : "Manage redemption operations across all funds from the issuer operations queue."}
          </p>
        </div>

        <Button onClick={() => navigate(createPath)}>
          <Plus className="w-4 h-4 mr-2" />
          {inFundContext ? "Create Redemption For This Fund" : "Create Redemption Event"}
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Total Redemptions</div>
          <div className="text-2xl font-semibold">{visibleRedemptions.length}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Daily dealing</div>
          <div className="text-2xl font-semibold">{dailyDealingCount}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Active</div>
          <div className="text-2xl font-semibold">{activeCount}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Draft / Pending</div>
          <div className="text-2xl font-semibold">{draftPendingCount}</div>
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
            {visibleRedemptions.map((redemption) => (
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(getDetailPath(redemption.id))}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {visibleRedemptions.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  {inFundContext
                    ? "No redemptions have been created for this fund yet."
                    : "No redemption events found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
