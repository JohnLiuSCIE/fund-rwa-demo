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
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 style={{ fontFamily: "var(--font-heading)" }}>
            {inFundContext ? "Fund Redemptions" : "Global Redemption Queue"}
          </h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            {inFundContext
              ? `Manage redemption operations for ${linkedFund?.name || "this fund"}.`
              : "Manage redemption operations across all funds from the issuer operations queue."}
          </p>
        </div>

        <Button className="w-full sm:w-auto sm:shrink-0" onClick={() => navigate(createPath)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Redemption
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

      <div className="hidden overflow-hidden rounded-lg border bg-white sm:block">
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

      <div className="space-y-3 sm:hidden">
        {visibleRedemptions.map((redemption) => (
          <div key={redemption.id} className="rounded-lg border bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium leading-snug">{redemption.fundName}</div>
                <div className="mt-1 break-all font-mono text-xs text-muted-foreground">
                  {redemption.id}
                </div>
              </div>
              <StatusBadge status={redemption.status} />
            </div>
            <div className="mt-3 line-clamp-2 text-sm text-muted-foreground">
              {redemption.description}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Mode</div>
                <Badge variant="outline" className="mt-1 max-w-full whitespace-normal text-left">
                  {redemption.redemptionMode}
                </Badge>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Settlement</div>
                <div className="mt-1 font-medium">{redemption.settlementCycle}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-muted-foreground">Latest NAV</div>
                <div className="mt-1 font-medium">{redemption.latestNav}</div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 w-full"
              onClick={() => navigate(getDetailPath(redemption.id))}
            >
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
          </div>
        ))}
        {visibleRedemptions.length === 0 && (
          <div className="rounded-lg border border-dashed bg-white p-8 text-center text-muted-foreground">
            {inFundContext
              ? "No redemptions have been created for this fund yet."
              : "No redemption events found."}
          </div>
        )}
      </div>
    </div>
  );
}
