import { Link } from "react-router-dom";
import { Info } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { StatusBadge } from "../components/StatusBadge";
import { useApp } from "../context/AppContext";

export function MarketplaceFundIssuance() {
  const { fundIssuances } = useApp();

  const marketplaceFunds = fundIssuances.filter((fund) => {
    if (fund.fundType === "Open-end") {
      return ["Active Dealing", "Initial Subscription", "Paused"].includes(fund.status);
    }
    return ["Upcoming", "Open For Subscription"].includes(fund.status);
  });

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 style={{ fontFamily: "var(--font-heading)" }}>Fund Marketplace</h1>
        <p className="text-muted-foreground mt-2">
          Explore tokenized funds with transparent NAV, daily dealing, and self-custody.
        </p>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Fund Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Latest NAV</TableHead>
              <TableHead>Next Cut-off</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {marketplaceFunds.map((fund) => (
              <TableRow key={fund.id} className="cursor-pointer hover:bg-secondary/50">
                <TableCell className="font-mono text-xs">
                  <Link to={`/marketplace/fund-issuance/${fund.id}`} className="hover:text-primary transition-colors">
                    {fund.id}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link to={`/marketplace/fund-issuance/${fund.id}`} className="hover:text-primary transition-colors font-medium">
                    {fund.name}
                  </Link>
                  <div className="text-xs text-muted-foreground truncate max-w-[320px]">
                    {fund.description}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{fund.fundType}</Badge>
                </TableCell>
                <TableCell>
                  <StatusBadge status={fund.status} />
                </TableCell>
                <TableCell>{fund.currentNav}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {fund.nextCutoffTime || "N/A"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-8 bg-gradient-to-br from-[var(--navy-50)] to-[var(--gold-50)] border border-[var(--navy-200)] rounded-lg p-8">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-[var(--navy-700)] flex items-center justify-center">
              <Info className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 style={{ fontFamily: "var(--font-heading)" }}>Why Open-end Demo Matters</h3>
            <p className="text-muted-foreground mt-2">
              This marketplace now highlights the difference between one-off issuance and open-end fund operations. Investors can review current NAV, next dealing cut-off, and ongoing subscription / redemption access before placing orders.
            </p>
            <div className="mt-4 grid md:grid-cols-3 gap-4">
              <div className="bg-white/70 backdrop-blur rounded-md p-3 border border-[var(--navy-100)]">
                <div className="font-medium text-sm">Daily Dealing</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Orders queue into the next cut-off batch.
                </div>
              </div>
              <div className="bg-white/70 backdrop-blur rounded-md p-3 border border-[var(--navy-100)]">
                <div className="font-medium text-sm">Transparent NAV</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Latest NAV and update time stay visible in the detail page.
                </div>
              </div>
              <div className="bg-white/70 backdrop-blur rounded-md p-3 border border-[var(--navy-100)]">
                <div className="font-medium text-sm">T+1 Settlement</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Order confirmation and settlement are clearly separated in the demo.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
