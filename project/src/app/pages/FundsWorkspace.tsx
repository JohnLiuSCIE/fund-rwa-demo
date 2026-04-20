import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Coins, HandCoins, Landmark, Plus, RefreshCcw } from "lucide-react";

import { StatusBadge } from "../components/StatusBadge";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useApp } from "../context/AppContext";
import type { FundIssuance } from "../data/fundDemoData";

type FundWorkspaceFilter = "all" | "open-end" | "closed-end";

function getInvestorVisibleFunds(funds: FundIssuance[]) {
  return funds.filter((fund) => {
    if (fund.fundType === "Open-end") {
      return ["Initial Subscription", "Active Dealing", "Paused"].includes(fund.status);
    }
    return ["Upcoming", "Open For Subscription"].includes(fund.status);
  });
}

function getLaunchModuleDescription(fund: FundIssuance) {
  if (fund.fundType === "Open-end") {
    return `Recurring dealing cycle with ${fund.dealingFrequency || fund.redemptionFrequency || "configured"} liquidity windows.`;
  }
  return "Primary issuance workflow from onboarding through subscription, allocation, and activation.";
}

function getRedemptionModuleDescription(
  fund: FundIssuance,
  redemption:
    | {
        status: string;
        redemptionMode: string;
        settlementCycle: string;
      }
    | undefined,
) {
  if (fund.fundType === "Closed-end") {
    return "Closed-end liquidity normally comes from maturity or secondary trading, not issuer-led redemption.";
  }
  if (!redemption) {
    return "No redemption setup linked yet for this fund.";
  }
  return `${redemption.redemptionMode} processing with ${redemption.settlementCycle} settlement.`;
}

function getDistributionModuleDescription(
  distribution:
    | {
        status: string;
        payoutMode?: string;
        paymentDate?: string;
      }
    | undefined,
) {
  if (!distribution) {
    return "No distribution event has been scheduled yet.";
  }
  const payoutMode = distribution.payoutMode || "Claim";
  const paymentDate = distribution.paymentDate || "payment date pending";
  return `${payoutMode} payout flow with ${paymentDate}.`;
}

export function FundsWorkspace() {
  const { fundIssuances, fundRedemptions, fundDistributions, userRole } = useApp();
  const [filter, setFilter] = useState<FundWorkspaceFilter>("all");

  const visibleFunds = useMemo(() => {
    if (userRole === "issuer") {
      return fundIssuances;
    }
    return getInvestorVisibleFunds(fundIssuances);
  }, [fundIssuances, userRole]);

  const redemptionByFundId = useMemo(
    () => new Map(fundRedemptions.map((redemption) => [redemption.fundId, redemption])),
    [fundRedemptions],
  );

  const distributionByFundId = useMemo(
    () =>
      new Map(
        fundDistributions
          .filter((distribution) => distribution.fundId)
          .map((distribution) => [distribution.fundId!, distribution]),
      ),
    [fundDistributions],
  );

  const filteredFunds = useMemo(() => {
    const funds = visibleFunds.filter((fund) => {
      if (filter === "open-end") return fund.fundType === "Open-end";
      if (filter === "closed-end") return fund.fundType === "Closed-end";
      return true;
    });

    return [...funds].sort((left, right) => {
      if (left.fundType !== right.fundType) {
        return left.fundType === "Open-end" ? -1 : 1;
      }
      return left.name.localeCompare(right.name);
    });
  }, [filter, visibleFunds]);

  const totalOpenEnd = visibleFunds.filter((fund) => fund.fundType === "Open-end").length;
  const totalClosedEnd = visibleFunds.filter((fund) => fund.fundType === "Closed-end").length;
  const totalRedemptionModules = visibleFunds.filter((fund) => redemptionByFundId.has(fund.id)).length;
  const totalDistributionModules = visibleFunds.filter((fund) => distributionByFundId.has(fund.id)).length;

  return (
    <div className="container mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <h1 style={{ fontFamily: "var(--font-heading)" }}>Funds Workspace</h1>
          <p className="mt-2 text-muted-foreground">
            {userRole === "issuer"
              ? "Manage each fund as a first-class object, then open issuance, redemption, and distribution modules from the same operating surface."
              : "Review each fund as a single product record, then move into subscription, redemption, and distribution touchpoints from one place."}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {userRole === "issuer" ? (
            <>
              <Button variant="outline" asChild>
                <Link to="/manage/fund-issuance">Open Operations Queue</Link>
              </Button>
              <Button asChild>
                <Link to="/create/fund-issuance">
                  <Plus className="w-4 h-4" />
                  Create New Fund
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link to="/marketplace/fund-redemption">View Redemption Windows</Link>
              </Button>
              <Button asChild>
                <Link to="/marketplace/fund-issuance">Explore Fund Opportunities</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-4">
          <div className="mb-1 text-sm text-muted-foreground">Visible Funds</div>
          <div className="text-2xl font-semibold">{visibleFunds.length}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="mb-1 text-sm text-muted-foreground">Open-end Funds</div>
          <div className="text-2xl font-semibold">{totalOpenEnd}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="mb-1 text-sm text-muted-foreground">Redemption Modules</div>
          <div className="text-2xl font-semibold">{totalRedemptionModules}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="mb-1 text-sm text-muted-foreground">Distribution Modules</div>
          <div className="text-2xl font-semibold">{totalDistributionModules}</div>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={filter} onValueChange={(value) => setFilter(value as FundWorkspaceFilter)}>
          <TabsList>
            <TabsTrigger value="all">All Funds ({visibleFunds.length})</TabsTrigger>
            <TabsTrigger value="open-end">Open-end ({totalOpenEnd})</TabsTrigger>
            <TabsTrigger value="closed-end">Closed-end ({totalClosedEnd})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="text-sm text-muted-foreground">
          {userRole === "issuer"
            ? "Operational queues stay available for specialists, but this page is now the primary fund-level control surface."
            : "Fund cards combine primary market visibility with downstream lifecycle events."}
        </div>
      </div>

      <div className="space-y-6">
        {filteredFunds.map((fund) => {
          const linkedRedemption = redemptionByFundId.get(fund.id);
          const linkedDistribution = distributionByFundId.get(fund.id);
          const fundDetailPath =
            userRole === "issuer" ? `/fund-issuance/${fund.id}` : `/marketplace/fund-issuance/${fund.id}`;

          return (
            <Card key={fund.id} className="overflow-hidden border-[var(--navy-100)] bg-white shadow-sm">
              <CardHeader className="border-b bg-gradient-to-br from-[var(--navy-50)] via-white to-[var(--gold-50)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle style={{ fontFamily: "var(--font-heading)" }}>{fund.name}</CardTitle>
                      <Badge variant="outline">{fund.fundType}</Badge>
                      <Badge variant={fund.tradable === "Yes" ? "secondary" : "outline"}>
                        {fund.tradable === "Yes"
                          ? "Secondary Market Enabled"
                          : "Secondary Market Restricted"}
                      </Badge>
                    </div>
                    <CardDescription className="max-w-3xl text-sm leading-6">
                      {fund.description}
                    </CardDescription>
                  </div>

                  <div className="flex flex-col items-start gap-2 lg:items-end">
                    <StatusBadge status={fund.status} />
                    <div className="font-mono text-xs text-muted-foreground">{fund.id}</div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-lg border bg-white/80 p-3">
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Manager</div>
                    <div className="mt-2 font-medium">{fund.fundManager}</div>
                  </div>
                  <div className="rounded-lg border bg-white/80 p-3">
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Latest NAV</div>
                    <div className="mt-2 font-medium">{fund.currentNav}</div>
                  </div>
                  <div className="rounded-lg border bg-white/80 p-3">
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Minimum Ticket
                    </div>
                    <div className="mt-2 font-medium">{fund.minSubscriptionAmount}</div>
                  </div>
                  <div className="rounded-lg border bg-white/80 p-3">
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Liquidity Model
                    </div>
                    <div className="mt-2 font-medium">
                      {fund.fundType === "Open-end"
                        ? fund.dealingFrequency || fund.redemptionFrequency || "Configured"
                        : "Closed-end primary issuance"}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-6">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Fund Modules</div>
                  <div className="mt-3 grid gap-3 lg:grid-cols-3">
                    <div className="rounded-xl border bg-[var(--navy-50)]/60 p-4">
                      <div className="mb-3 flex items-center gap-2 text-[var(--navy-700)]">
                        <Landmark className="w-4 h-4" />
                        <div className="font-medium">Launch</div>
                      </div>
                      <div className="mb-3">
                        <StatusBadge status={fund.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">{getLaunchModuleDescription(fund)}</p>
                    </div>

                    <div className="rounded-xl border bg-[var(--gold-50)]/70 p-4">
                      <div className="mb-3 flex items-center gap-2 text-[var(--gold-700)]">
                        <RefreshCcw className="w-4 h-4" />
                        <div className="font-medium">Redemption</div>
                      </div>
                      <div className="mb-3">
                        {linkedRedemption ? (
                          <StatusBadge status={linkedRedemption.status} />
                        ) : (
                          <Badge variant="outline">
                            {fund.fundType === "Closed-end" ? "Not Standard" : "Not Configured"}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {getRedemptionModuleDescription(fund, linkedRedemption)}
                      </p>
                    </div>

                    <div className="rounded-xl border bg-emerald-50 p-4">
                      <div className="mb-3 flex items-center gap-2 text-emerald-700">
                        <HandCoins className="w-4 h-4" />
                        <div className="font-medium">Distribution</div>
                      </div>
                      <div className="mb-3">
                        {linkedDistribution ? (
                          <StatusBadge status={linkedDistribution.status} />
                        ) : (
                          <Badge variant="outline">Not Scheduled</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {getDistributionModuleDescription(linkedDistribution)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-wrap gap-3 border-t bg-slate-50/70">
                <Button asChild>
                  <Link to={fundDetailPath}>
                    <Coins className="w-4 h-4" />
                    {userRole === "issuer" ? "Open Fund Workspace" : "Open Fund"}
                  </Link>
                </Button>

                {userRole === "issuer" && fund.fundType === "Open-end" && (
                  linkedRedemption ? (
                    <Button variant="outline" asChild>
                      <Link to={`/fund-redemption/${linkedRedemption.id}`}>
                        Open Redemption Setup
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="outline" asChild>
                      <Link to="/create/fund-redemption">
                        Add Redemption Setup
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  )
                )}

                {userRole === "issuer" &&
                  (linkedDistribution ? (
                    <Button variant="outline" asChild>
                      <Link to={`/fund-distribution/${linkedDistribution.id}`}>
                        Open Distribution Event
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="outline" asChild>
                      <Link to="/create/fund-distribution">
                        Add Distribution Event
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  ))}

                {userRole === "investor" && fund.fundType === "Open-end" && linkedRedemption && (
                  <Button variant="outline" asChild>
                    <Link to="/marketplace/fund-redemption">
                      View Redemption Window
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                )}

                {userRole === "investor" && linkedDistribution && (
                  <Button variant="outline" asChild>
                    <Link to={`/marketplace/fund-distribution/${linkedDistribution.id}`}>
                      View Distribution Event
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}

        {filteredFunds.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-lg font-medium">No funds matched this view.</div>
              <p className="mt-2 text-sm text-muted-foreground">
                {userRole === "issuer"
                  ? "Try another fund-type filter or create a new fund record."
                  : "Try another fund-type filter to reopen the relevant product set."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
