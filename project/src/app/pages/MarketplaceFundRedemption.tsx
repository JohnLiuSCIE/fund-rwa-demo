import { useMemo, useState } from "react";
import { Eye } from "lucide-react";
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
import { StatusBadge } from "../components/StatusBadge";
import { RedeemModal } from "../components/modals/InvestorModals";
import { useApp } from "../context/AppContext";

export function MarketplaceFundRedemption() {
  const { fundRedemptions, fundIssuances } = useApp();
  const [selectedFundId, setSelectedFundId] = useState<string | null>(null);

  const selectedFund = useMemo(
    () => fundIssuances.find((fund) => fund.id === selectedFundId) || null,
    [fundIssuances, selectedFundId],
  );

  const openRedeemModal = (fundId: string) => {
    const linkedFund = fundIssuances.find((fund) => fund.id === fundId);
    if (!linkedFund) {
      toast.error("Linked fund information is unavailable");
      return;
    }
    setSelectedFundId(fundId);
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 style={{ fontFamily: "var(--font-heading)" }}>Fund Redemption Marketplace</h1>
        <p className="text-muted-foreground mt-2">
          Track redemption windows and submit investor redemption requests for available fund products.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Available Setups</div>
          <div className="text-2xl font-semibold">{fundRedemptions.length}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Daily Dealing</div>
          <div className="text-2xl font-semibold">
            {fundRedemptions.filter((item) => item.redemptionMode === "Daily dealing").length}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Redeemable Now</div>
          <div className="text-2xl font-semibold">
            {fundRedemptions.filter((item) => ["Active", "Window Open"].includes(item.status)).length}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Paused / Announced</div>
          <div className="text-2xl font-semibold">
            {fundRedemptions.filter((item) => ["Announced", "Paused"].includes(item.status)).length}
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
              <TableHead>Investor Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fundRedemptions.map((redemption) => {
              const redeemable = ["Active", "Window Open"].includes(redemption.status);

              return (
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
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/marketplace/fund-issuance/${redemption.fundId}`}>
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        disabled={!redeemable}
                        onClick={() => openRedeemModal(redemption.fundId)}
                      >
                        Redeem
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {fundRedemptions.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No redemption setups are currently available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selectedFund && (
        <RedeemModal
          open={Boolean(selectedFund)}
          onOpenChange={(open) => {
            if (!open) setSelectedFundId(null);
          }}
          fundData={selectedFund}
        />
      )}
    </div>
  );
}
