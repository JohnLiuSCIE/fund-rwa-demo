import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Coins,
  HandCoins,
  Landmark,
  Plus,
  RefreshCcw,
  Search,
} from "lucide-react";

import { StatusBadge } from "../components/StatusBadge";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { cn } from "../components/ui/utils";
import { useApp } from "../context/AppContext";
import type { FundIssuance } from "../data/fundDemoData";

type FundWorkspaceFilter = "all" | "open-end" | "closed-end";

type WorkspaceRedemption = {
  id: string;
  status: string;
  redemptionMode: string;
  settlementCycle: string;
};

type WorkspaceDistribution = {
  id: string;
  status: string;
  payoutMode?: string;
  paymentDate?: string;
};

type WorkspaceAction = {
  label: string;
  to: string;
  summary: string;
};

function getInvestorVisibleFunds(funds: FundIssuance[]) {
  return funds.filter((fund) => {
    if (fund.fundType === "Open-end") {
      return ["Initial Subscription", "Active Dealing", "Paused"].includes(fund.status);
    }
    return ["Upcoming", "Open For Subscription"].includes(fund.status);
  });
}

function getFundDetailPath(userRole: "issuer" | "investor", fundId: string) {
  return userRole === "issuer" ? `/fund-issuance/${fundId}` : `/marketplace/fund-issuance/${fundId}`;
}

function getLiquidityModel(fund: FundIssuance) {
  if (fund.fundType === "Open-end") {
    return fund.dealingFrequency || fund.redemptionFrequency || "Configured dealing";
  }
  return "Closed-end issuance";
}

function getFundingLabel(fund: FundIssuance) {
  if (fund.subscriptionPaymentMethod === "Fiat") {
    return `${fund.subscriptionCashCurrency || fund.assetCurrency} bank transfer`;
  }
  if (fund.subscriptionPaymentMethod === "Tokenized Deposit") {
    return "Tokenized deposit";
  }
  if (fund.subscriptionPaymentMethod === "Stablecoin") {
    return `${fund.assetCurrency} stablecoin`;
  }
  return fund.assetCurrency;
}

function getLaunchModuleDescription(fund: FundIssuance) {
  if (fund.fundType === "Open-end") {
    return `Recurring dealing with ${getLiquidityModel(fund)} and ${fund.settlementCycle || "T+1"} settlement.`;
  }
  return "Primary issuance object covering onboarding, allocation, and activation milestones.";
}

function getRedemptionModuleDescription(
  fund: FundIssuance,
  redemption: WorkspaceRedemption | undefined,
) {
  if (fund.fundType === "Closed-end") {
    if (!redemption) {
      return "No cash-out event is scheduled. Liquidity stays outside the fund until a special redemption event is launched.";
    }
    return `${redemption.redemptionMode} cash-out event with ${redemption.settlementCycle} settlement.`;
  }

  if (!redemption) {
    return "No redemption object has been created yet for this fund.";
  }

  return `${redemption.redemptionMode} redemptions with ${redemption.settlementCycle} settlement.`;
}

function getDistributionModuleDescription(
  fund: FundIssuance,
  distribution: WorkspaceDistribution | undefined,
) {
  if (!distribution) {
    return fund.fundType === "Closed-end"
      ? "No dividend event has been scheduled yet."
      : "No distribution event has been scheduled yet.";
  }

  const routeLabel = distribution.payoutMode === "Direct Transfer" ? "Direct transfer" : "Claim";
  return `${routeLabel} route with ${distribution.paymentDate || "payment date pending"}.`;
}

function canManageRedemption(status: string) {
  return [
    "Draft",
    "Pending Approval",
    "Announced",
    "Active",
    "Paused",
    "Window Open",
  ].includes(status);
}

function canManageDistribution(status: string) {
  return [
    "Draft",
    "Pending Approval",
    "Pending Listing",
    "Upcoming",
    "Pending Allocation",
    "Put On Chain",
    "Open For Distribution",
  ].includes(status);
}

function canCreateDistributionForFund(status: string) {
  return !["Draft", "Pending Approval"].includes(status);
}

function isFundLaunchHeavy(status: string) {
  return [
    "Draft",
    "Pending Approval",
    "Pending Listing",
    "Upcoming Launch",
    "Allocation Period",
    "Calculated",
    "Allocate On Chain",
    "Allocation Completed",
  ].includes(status);
}

function isLiveRedemption(status: string) {
  return ["Announced", "Active", "Paused", "Window Open"].includes(status);
}

function isLiveDistribution(status: string) {
  return ["Pending Listing", "Upcoming", "Pending Allocation", "Put On Chain", "Open For Distribution"].includes(status);
}

function getFundSortPriority(status: string) {
  const priorities: Record<string, number> = {
    "Active Dealing": 0,
    "Issuance Active": 1,
    "Initial Subscription": 2,
    "Open For Subscription": 3,
    "Paused": 4,
    "Upcoming": 5,
    "Issuance Completed": 6,
    "Allocation Completed": 7,
    "Allocation Period": 8,
    "Calculated": 9,
    "Allocate On Chain": 10,
    "Pending Listing": 11,
    "Pending Approval": 12,
    "Draft": 13,
  };

  return priorities[status] ?? 99;
}

function getRedemptionEntryAction(
  userRole: "issuer" | "investor",
  fund: FundIssuance,
  redemption: WorkspaceRedemption | undefined,
): WorkspaceAction | null {
  if (userRole === "investor") {
    if (!redemption) return null;
    return {
      label: "View Windows",
      to: "/marketplace/fund-redemption",
      summary: "Review the live redemption window and investor-facing terms.",
    };
  }

  if (!redemption) {
    return {
      label: "Create Redemption",
      to: `/fund-issuance/${fund.id}/redemptions/create`,
      summary: "Launch a new redemption object for this fund.",
    };
  }

  return {
    label: "Open Redemptions",
    to: `/fund-issuance/${fund.id}/redemptions`,
    summary: "Review the linked redemption object and manage the active cash-out workflow.",
  };
}

function getDistributionEntryAction(
  userRole: "issuer" | "investor",
  fund: FundIssuance,
  distribution: WorkspaceDistribution | undefined,
): WorkspaceAction | null {
  if (userRole === "investor") {
    if (!distribution) return null;
    return {
      label: "View Event",
      to: `/marketplace/fund-distribution/${distribution.id}`,
      summary: "Open the investor-facing distribution event for this fund.",
    };
  }

  if (!distribution) {
    return {
      label: "Create Distribution",
      to: `/fund-issuance/${fund.id}/distributions/create`,
      summary: "Launch a new distribution object for this fund.",
    };
  }

  return {
    label: "Open Distributions",
    to: `/fund-issuance/${fund.id}/distributions`,
    summary: "Review the linked distribution object and manage the live event states.",
  };
}

function getRecommendedAction(
  userRole: "issuer" | "investor",
  fund: FundIssuance,
  redemption: WorkspaceRedemption | undefined,
  distribution: WorkspaceDistribution | undefined,
): WorkspaceAction {
  const detailPath = getFundDetailPath(userRole, fund.id);

  if (userRole === "investor") {
    return {
      label: "Open Fund",
      to: detailPath,
      summary: "Review the product record first, then move into the investor activity relevant to this fund.",
    };
  }

  if (isFundLaunchHeavy(fund.status)) {
    return {
      label: "Continue Fund Setup",
      to: detailPath,
      summary: "This fund is still launch-heavy, so the clearest next step is to continue the main fund object before opening more lifecycle events.",
    };
  }

  if (!redemption && fund.fundType === "Open-end") {
    return {
      label: "Create Redemption",
      to: `/fund-issuance/${fund.id}/redemptions/create`,
      summary: "Open-end funds usually need a redemption object ready before the workspace feels complete.",
    };
  }

  if (redemption && canManageRedemption(redemption.status)) {
    return {
      label: "Review Redemptions",
      to: `/fund-issuance/${fund.id}/redemptions`,
      summary: "The linked redemption object is still in a manageable stage and is the strongest next operational surface.",
    };
  }

  if (!distribution && canCreateDistributionForFund(fund.status)) {
    return {
      label: "Create Distribution",
      to: `/fund-issuance/${fund.id}/distributions/create`,
      summary: "This fund is eligible for a distribution object and does not have one linked yet.",
    };
  }

  if (distribution && canManageDistribution(distribution.status)) {
    return {
      label: "Review Distributions",
      to: `/fund-issuance/${fund.id}/distributions`,
      summary: "The linked distribution object is active enough to deserve the next click from this workspace.",
    };
  }

  return {
    label: "Open Fund",
    to: detailPath,
    summary: "Use the core fund record as the anchor and then open the object you need from the detail page.",
  };
}

function getCompactSignalLabel(
  fund: FundIssuance,
  redemption: WorkspaceRedemption | undefined,
  distribution: WorkspaceDistribution | undefined,
) {
  if (distribution && isLiveDistribution(distribution.status)) return "Distribution live";
  if (redemption && isLiveRedemption(redemption.status)) return "Redemption live";
  if (fund.status === "Active Dealing" || fund.status === "Issuance Active") return "Operating";
  if (fund.status === "Paused") return "Paused";
  return "In launch";
}

function getCompactSignalClass(label: string) {
  switch (label) {
    case "Distribution live":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Redemption live":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Operating":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "Paused":
      return "border-slate-200 bg-slate-100 text-slate-700";
    default:
      return "border-[var(--navy-100)] bg-[var(--navy-50)] text-[var(--navy-700)]";
  }
}

function FundActionRow({
  title,
  icon: Icon,
  tintClassName,
  status,
  emptyState,
  description,
  action,
}: {
  title: string;
  icon: typeof Landmark;
  tintClassName: string;
  status?: string;
  emptyState: string;
  description: string;
  action: WorkspaceAction | null;
}) {
  return (
    <div className={cn("rounded-2xl border p-4 shadow-sm", tintClassName)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/90 shadow-sm">
            <Icon className="h-4 w-4" />
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="font-medium">{title}</div>
              {status ? <StatusBadge status={status} /> : <Badge variant="outline">{emptyState}</Badge>}
            </div>
            <div className="text-sm text-muted-foreground">{description}</div>
          </div>
        </div>
        {action ? (
          <Button asChild className="shrink-0">
            <Link to={action.to}>
              {action.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function FundsWorkspace() {
  const { fundIssuances, fundRedemptions, fundDistributions, userRole } = useApp();
  const [filter, setFilter] = useState<FundWorkspaceFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFundId, setSelectedFundId] = useState<string | null>(null);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const deferredSearchQuery = useDeferredValue(searchQuery.trim().toLowerCase());

  const visibleFunds = useMemo(() => {
    if (userRole === "issuer") {
      return fundIssuances;
    }
    return getInvestorVisibleFunds(fundIssuances);
  }, [fundIssuances, userRole]);

  const redemptionByFundId = useMemo(
    () =>
      new Map(
        fundRedemptions.map((redemption) => [
          redemption.fundId,
          {
            id: redemption.id,
            status: redemption.status,
            redemptionMode: redemption.redemptionMode,
            settlementCycle: redemption.settlementCycle,
          },
        ]),
      ),
    [fundRedemptions],
  );

  const distributionByFundId = useMemo(
    () =>
      new Map(
        fundDistributions
          .filter((distribution) => distribution.fundId)
          .map((distribution) => [
            distribution.fundId!,
            {
              id: distribution.id,
              status: distribution.status,
              payoutMode: distribution.payoutMode,
              paymentDate: distribution.paymentDate,
            },
          ]),
      ),
    [fundDistributions],
  );

  const filteredFunds = useMemo(() => {
    const funds = visibleFunds.filter((fund) => {
      if (filter === "open-end" && fund.fundType !== "Open-end") return false;
      if (filter === "closed-end" && fund.fundType !== "Closed-end") return false;

      if (!deferredSearchQuery) return true;

      const searchTarget = [
        fund.name,
        fund.id,
        fund.fundManager,
        fund.tokenName,
        fund.legalStructure,
        fund.assetStrategyCategory,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchTarget.includes(deferredSearchQuery);
    });

    return [...funds].sort((left, right) => {
      const statusGap = getFundSortPriority(left.status) - getFundSortPriority(right.status);
      if (statusGap !== 0) return statusGap;
      if (left.fundType !== right.fundType) {
        return left.fundType === "Open-end" ? -1 : 1;
      }
      return left.name.localeCompare(right.name);
    });
  }, [deferredSearchQuery, filter, visibleFunds]);

  useEffect(() => {
    if (filteredFunds.length === 0) {
      setSelectedFundId(null);
      setIsWorkspaceOpen(false);
      return;
    }

    if (selectedFundId && !filteredFunds.some((fund) => fund.id === selectedFundId)) {
      setSelectedFundId(null);
      setIsWorkspaceOpen(false);
    }
  }, [filteredFunds, selectedFundId]);

  const selectedFund =
    filteredFunds.find((fund) => fund.id === selectedFundId) || null;
  const selectedRedemption = selectedFund ? redemptionByFundId.get(selectedFund.id) : undefined;
  const selectedDistribution = selectedFund ? distributionByFundId.get(selectedFund.id) : undefined;

  const totalOpenEnd = visibleFunds.filter((fund) => fund.fundType === "Open-end").length;
  const totalClosedEnd = visibleFunds.filter((fund) => fund.fundType === "Closed-end").length;
  const totalOperatingFunds = visibleFunds.filter((fund) =>
    ["Active Dealing", "Issuance Active", "Initial Subscription", "Open For Subscription", "Paused"].includes(fund.status),
  ).length;
  const totalLiveEventFunds = visibleFunds.filter((fund) => {
    const redemption = redemptionByFundId.get(fund.id);
    const distribution = distributionByFundId.get(fund.id);
    return Boolean(
      (redemption && isLiveRedemption(redemption.status)) ||
      (distribution && isLiveDistribution(distribution.status)),
    );
  }).length;

  const fundDetailPath = selectedFund ? getFundDetailPath(userRole, selectedFund.id) : "#";
  const recommendedAction =
    selectedFund &&
    getRecommendedAction(userRole, selectedFund, selectedRedemption, selectedDistribution);
  const launchAction =
    selectedFund
      ? {
          label: userRole === "issuer" ? "Open Fund" : "View Fund",
          to: fundDetailPath,
          summary: "Open the core fund object and review the full lifecycle context.",
        }
      : null;
  const redemptionAction =
    selectedFund &&
    getRedemptionEntryAction(userRole, selectedFund, selectedRedemption);
  const distributionAction =
    selectedFund &&
    getDistributionEntryAction(userRole, selectedFund, selectedDistribution);

  const handleSelectFund = (fundId: string) => {
    if (selectedFundId === fundId && isWorkspaceOpen) {
      setIsWorkspaceOpen(false);
      setSelectedFundId(null);
      return;
    }

    setSelectedFundId(fundId);
    setIsWorkspaceOpen(true);
  };

  return (
    <div className="container mx-auto max-w-[1440px] px-6 py-8">
      <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <h1 style={{ fontFamily: "var(--font-heading)" }}>Funds Workspace</h1>
          <p className="mt-2 text-muted-foreground">
            {userRole === "issuer"
              ? "Use a denser fund list on the left to pick the product you want, then manage its launch, redemption, and distribution objects from one focused panel."
              : "Review the fund universe from a compact list first, then inspect the selected product and its investor-facing lifecycle events on the right."}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {userRole === "issuer" ? (
            <>
              <Button variant="outline" asChild>
                <Link to="/manage/fund-issuance">Open Launch Queue</Link>
              </Button>
              <Button asChild>
                <Link to="/create/fund-issuance">
                  <Plus className="h-4 w-4" />
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

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-[var(--navy-100)] bg-gradient-to-br from-white to-[var(--navy-50)] shadow-sm">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Funds In Scope</div>
            <div className="mt-2 text-3xl font-semibold">{visibleFunds.length}</div>
          </CardContent>
        </Card>
        <Card className="border-[var(--navy-100)] bg-gradient-to-br from-white to-sky-50 shadow-sm">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Operating Now</div>
            <div className="mt-2 text-3xl font-semibold">{totalOperatingFunds}</div>
          </CardContent>
        </Card>
        <Card className="border-[var(--navy-100)] bg-gradient-to-br from-white to-[var(--gold-50)] shadow-sm">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Open-end / Closed-end</div>
            <div className="mt-2 text-3xl font-semibold">
              {totalOpenEnd} <span className="text-base font-medium text-muted-foreground">/</span> {totalClosedEnd}
            </div>
          </CardContent>
        </Card>
        <Card className="border-[var(--navy-100)] bg-gradient-to-br from-white to-emerald-50 shadow-sm">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Funds With Live Events</div>
            <div className="mt-2 text-3xl font-semibold">{totalLiveEventFunds}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-[var(--navy-100)] shadow-sm">
        <CardHeader className="space-y-4 border-b bg-white">
          <div>
            <CardTitle className="text-lg">Fund Picker</CardTitle>
            <CardDescription>
              Click a fund card to open its workspace from the right. Click the same card again to close it.
            </CardDescription>
          </div>

          <Tabs value={filter} onValueChange={(value) => setFilter(value as FundWorkspaceFilter)}>
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="open-end">Open-end</TabsTrigger>
              <TabsTrigger value="closed-end">Closed-end</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by fund, manager, token, or ID"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {filteredFunds.map((fund) => {
              const linkedRedemption = redemptionByFundId.get(fund.id);
              const linkedDistribution = distributionByFundId.get(fund.id);
              const signalLabel = getCompactSignalLabel(fund, linkedRedemption, linkedDistribution);
              const isActiveCard = isWorkspaceOpen && selectedFund?.id === fund.id;

              return (
                <button
                  key={fund.id}
                  type="button"
                  onClick={() => handleSelectFund(fund.id)}
                  className={cn(
                    "w-full rounded-2xl border px-4 py-4 text-left transition-all",
                    isActiveCard
                      ? "border-[var(--navy-300)] bg-[var(--navy-50)] shadow-sm ring-1 ring-[var(--navy-200)]"
                      : "border-border bg-white hover:border-[var(--navy-200)] hover:bg-secondary/20",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{fund.name}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{fund.fundType}</Badge>
                        <Badge className={cn("border", getCompactSignalClass(signalLabel))}>
                          {signalLabel}
                        </Badge>
                        {isActiveCard && <Badge variant="secondary">Workspace Open</Badge>}
                      </div>
                    </div>
                    <StatusBadge status={fund.status} />
                  </div>

                  <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                    <div>
                      <div className="text-xs uppercase tracking-[0.16em]">NAV</div>
                      <div className="mt-1 font-medium text-foreground">{fund.currentNav}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.16em]">Liquidity</div>
                      <div className="mt-1 font-medium text-foreground">{getLiquidityModel(fund)}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline">
                      Redemption: {linkedRedemption ? linkedRedemption.status : "None"}
                    </Badge>
                    <Badge variant="outline">
                      Distribution: {linkedDistribution ? linkedDistribution.status : "None"}
                    </Badge>
                  </div>
                </button>
              );
            })}

            {filteredFunds.length === 0 && (
              <div className="rounded-2xl border border-dashed px-4 py-10 text-center lg:col-span-2 xl:col-span-3">
                <div className="text-lg font-medium">No funds matched this view.</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try another filter or search term to reopen the relevant fund set.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Sheet
        open={isWorkspaceOpen}
        onOpenChange={(open) => {
          setIsWorkspaceOpen(open);
          if (!open) {
            setSelectedFundId(null);
          }
        }}
      >
        {selectedFund && (
          <SheetContent
            side="right"
            className="w-[82vw] max-w-none p-0 sm:max-w-none lg:w-[80vw] xl:w-[78vw]"
          >
            <div className="flex h-full flex-col">
              <SheetHeader className="border-b bg-gradient-to-br from-[var(--navy-50)] via-white to-[var(--gold-50)] pr-12">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{selectedFund.fundType}</Badge>
                  <Badge variant="outline">{selectedFund.legalStructure || "Structure Pending"}</Badge>
                  <Badge variant={selectedFund.tradable === "Yes" ? "secondary" : "outline"}>
                    {selectedFund.tradable === "Yes" ? "Secondary Market Enabled" : "Secondary Market Restricted"}
                  </Badge>
                </div>
                <SheetTitle style={{ fontFamily: "var(--font-heading)" }}>{selectedFund.name}</SheetTitle>
                <SheetDescription className="max-w-4xl leading-6">
                  {selectedFund.description}
                </SheetDescription>
              </SheetHeader>

              <ScrollArea className="flex-1">
                <div className="space-y-6 p-6">
                  <Card className="border-[var(--navy-100)] shadow-sm">
                    <CardContent className="grid gap-4 pt-6 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-xl border bg-white/85 p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Status</div>
                        <div className="mt-3">
                          <StatusBadge status={selectedFund.status} />
                        </div>
                      </div>
                      <div className="rounded-xl border bg-white/85 p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Latest NAV</div>
                        <div className="mt-3 font-medium">{selectedFund.currentNav}</div>
                      </div>
                      <div className="rounded-xl border bg-white/85 p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Liquidity Model</div>
                        <div className="mt-3 font-medium">{getLiquidityModel(selectedFund)}</div>
                      </div>
                      <div className="rounded-xl border bg-white/85 p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Subscription Funding</div>
                        <div className="mt-3 font-medium">{getFundingLabel(selectedFund)}</div>
                      </div>
                    </CardContent>
                  </Card>

                  {recommendedAction && (
                    <Card className="border-[var(--navy-100)] shadow-sm">
                      <CardHeader className="space-y-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <CardTitle className="text-lg">Recommended Next Step</CardTitle>
                            <CardDescription className="mt-2 max-w-3xl leading-6">
                              {recommendedAction.summary}
                            </CardDescription>
                          </div>
                          <Button asChild>
                            <Link to={recommendedAction.to}>
                              {recommendedAction.label}
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>
                  )}

                  <Card className="border-[var(--navy-100)] shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">Fund Actions</CardTitle>
                      <CardDescription>
                        Use these entry points to move from the selected fund into its main lifecycle objects.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FundActionRow
                        title="Launch"
                        icon={Landmark}
                        tintClassName="bg-[var(--navy-50)]/70"
                        status={selectedFund.status}
                        emptyState="No Launch Data"
                        description={getLaunchModuleDescription(selectedFund)}
                        action={launchAction}
                      />

                      <FundActionRow
                        title="Redemptions"
                        icon={RefreshCcw}
                        tintClassName="bg-[var(--gold-50)]/80"
                        status={selectedRedemption?.status}
                        emptyState={selectedFund.fundType === "Closed-end" ? "Not Scheduled" : "Not Created"}
                        description={getRedemptionModuleDescription(selectedFund, selectedRedemption)}
                        action={redemptionAction}
                      />

                      <FundActionRow
                        title="Distributions"
                        icon={HandCoins}
                        tintClassName="bg-emerald-50"
                        status={selectedDistribution?.status}
                        emptyState="Not Scheduled"
                        description={getDistributionModuleDescription(selectedFund, selectedDistribution)}
                        action={distributionAction}
                      />
                    </CardContent>
                  </Card>

                  <Card className="border-[var(--navy-100)] shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">Fund Snapshot</CardTitle>
                      <CardDescription>
                        Keep the most useful fund metadata visible without burying it under full detail-page content.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-lg border px-4 py-3">
                        <div className="text-sm text-muted-foreground">Jurisdiction</div>
                        <div className="mt-1 font-medium">{selectedFund.fundJurisdiction || "Pending"}</div>
                      </div>
                      <div className="rounded-lg border px-4 py-3">
                        <div className="text-sm text-muted-foreground">Asset Strategy</div>
                        <div className="mt-1 font-medium">{selectedFund.assetStrategyCategory || selectedFund.assetType}</div>
                      </div>
                      <div className="rounded-lg border px-4 py-3">
                        <div className="text-sm text-muted-foreground">Share Class</div>
                        <div className="mt-1 font-medium">{selectedFund.shareClass || "Standard"}</div>
                      </div>
                      <div className="rounded-lg border px-4 py-3">
                        <div className="text-sm text-muted-foreground">Token</div>
                        <div className="mt-1 font-medium">{selectedFund.tokenName}</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </div>
          </SheetContent>
        )}
      </Sheet>
    </div>
  );
}
