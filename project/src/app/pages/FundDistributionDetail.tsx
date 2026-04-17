import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ChevronRight, Copy } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";
import { EmptyState } from "../components/EmptyState";
import { Users } from "lucide-react";
import { FundDistributionWorkflow } from "../components/FundIssuanceWorkflow";
import {
  SubmitDistributionApprovalModal,
  ListingDistributionModal,
  PendingAllocationDistributionModal,
  AllocationCompletedDistributionModal,
  OpenForDistributionModal,
} from "../components/modals/DistributionModals";

export function FundDistributionDetail() {
  const { id } = useParams();
  const { fundDistributions, fundIssuances, updateDistributionStatus } = useApp();

  const distribution = fundDistributions.find(d => d.id === id);
  const linkedFund = fundIssuances.find((fund) => fund.id === distribution?.fundId);
  const payoutMode = distribution?.payoutMode || "Claim";
  const isClaimMode = payoutMode === "Claim";

  if (!distribution) {
    return (
      <div className="container mx-auto px-6 py-20 text-center">
        <h2>Distribution Not Found</h2>
        <p className="text-muted-foreground mt-2">
          The distribution you're looking for doesn't exist or has been removed.
        </p>
      </div>
    );
  }

  const [currentStatus, setCurrentStatus] = useState(distribution.status);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showListingModal, setShowListingModal] = useState(false);
  const [showPendingAllocationModal, setShowPendingAllocationModal] = useState(false);
  const [showAllocationCompletedModal, setShowAllocationCompletedModal] = useState(false);
  const [showOpenDistributionModal, setShowOpenDistributionModal] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "Draft": "bg-gray-100 text-gray-800",
      "Pending Approval": "bg-amber-100 text-amber-800",
      "Pending Listing": "bg-yellow-100 text-yellow-800",
      "Upcoming": "bg-blue-100 text-blue-800",
      "Pending Allocation": "bg-purple-100 text-purple-800",
      "Put On Chain": "bg-indigo-100 text-indigo-800",
      "Open For Distribution": "bg-green-100 text-green-800",
      "Done": "bg-teal-100 text-teal-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const openDistributionHint =
    currentStatus === "Open For Distribution"
      ? isClaimMode
        ? "可领取 / Claimable by investors"
        : "系统发放中 / System payout in progress"
      : null;

  const renderActionButtons = () => {
    switch (currentStatus) {
      case "Draft":
        return (
          <>
            <Button variant="outline">Edit</Button>
            <Button onClick={() => setShowSubmitModal(true)}>
              Submit For Approval
            </Button>
          </>
        );
      case "Pending Approval":
        return (
          <>
            <Button variant="outline">Cancel Deal</Button>
            <Button onClick={() => {
              setCurrentStatus("Pending Listing");
              updateDistributionStatus(id || "", "Pending Listing");
              toast.success("Distribution approved and queued for listing");
            }}>
              Approve Listing
            </Button>
          </>
        );
      case "Pending Listing":
        return (
          <>
            <Button variant="outline">Cancel Deal</Button>
            <Button onClick={() => setShowListingModal(true)}>
              Listing
            </Button>
          </>
        );
      case "Upcoming":
        return (
          <Button onClick={() => setShowPendingAllocationModal(true)}>
            Record of Ownership
          </Button>
        );
      case "Pending Allocation":
        return (
          <Button onClick={() => setShowAllocationCompletedModal(true)}>
            Put On Chain
          </Button>
        );
      case "Put On Chain":
        return (
          <Button onClick={() => setShowOpenDistributionModal(true)}>
            {isClaimMode ? "Open For Claim" : "Start Direct Transfer"}
          </Button>
        );
      case "Open For Distribution":
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/manage/fund-distribution" className="hover:text-foreground transition-colors">
          Manage Fund Distribution
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground">{distribution.name}</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h1 style={{ fontFamily: 'var(--font-heading)' }}>{distribution.name}</h1>
            <Badge className={getStatusColor(currentStatus)}>{currentStatus}</Badge>
          </div>
          <div className="flex gap-2">{renderActionButtons()}</div>
        </div>
        {openDistributionHint && (
          <p className="text-sm text-muted-foreground">{openDistributionHint}</p>
        )}
      </div>

      {/* Workflow Progress */}
      <div className="mb-8">
        <FundDistributionWorkflow currentStatus={currentStatus} />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Sidebar - Information Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Fund Token</div>
                <div className="font-medium">
                  {distribution.fundToken || linkedFund?.tokenName || "–"}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Token Contract Address
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-sm">
                    {distribution.tokenAddress || "–"}
                  </code>
                  {distribution.tokenAddress && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(distribution.tokenAddress || "")}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">Asset Type</div>
                <div className="font-medium">{distribution.assetType}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Initial NAV / Issue Price
                </div>
                <div className="font-medium">
                  {distribution.initialNav || linkedFund?.currentNav || linkedFund?.initialNav || "–"}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">Payout Mode</div>
                <div className="font-medium">{payoutMode}</div>
                <div className="text-xs text-muted-foreground">
                  {isClaimMode
                    ? "Investor claims and pays claim gas."
                    : "System direct transfer; issuer treasury pays transfer gas."}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">Payout Token</div>
                <div className="font-medium">{distribution.payoutToken || distribution.distributionUnit || "–"}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">Payout Account</div>
                <div className="font-medium">{distribution.payoutAccount || "–"}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Distribution Record Date
                </div>
                <div className="font-medium">
                  {distribution.recordDate || "–"}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Distribution Payment Date
                </div>
                <div className="font-medium">
                  {distribution.paymentDate || "–"}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Distribution Rate
                </div>
                <div className="font-medium">
                  {distribution.distributionRate
                    ? `${distribution.distributionRate}${distribution.distributionRateType === "Fixed Rate" ? "%" : ` ${distribution.distributionUnit || ""}`}`
                    : "–"}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Distribution actual days in period
                </div>
                <div className="font-medium">{distribution.actualDaysInPeriod || "–"}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Distribution actual days in year
                </div>
                <div className="font-medium">{distribution.actualDaysInYear || "–"}</div>
              </div>
            </CardContent>
          </Card>

          {linkedFund && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Linked Fund Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Fund</div>
                  <div className="font-medium">{linkedFund.name}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Fund Status</div>
                  <div className="font-medium">{linkedFund.status}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Current NAV</div>
                  <div className="font-medium">{linkedFund.currentNav}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Settlement Cycle</div>
                  <div className="font-medium">{linkedFund.settlementCycle || "N/A"}</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content - Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="distribution">Distribution</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distribution Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {distribution.description}
                  </p>
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <div className="text-sm font-medium text-blue-900 mb-2">
                      Distribution Process
                    </div>
                    <div className="text-xs text-blue-600">
                      Income distribution to fund holders based on their shareholding
                      at the record date. {isClaimMode
                        ? "Investors can claim distribution once opened."
                        : "System will transfer distribution automatically from the configured payout account."}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="distribution" className="space-y-6">
              {/* Distribution Summary */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-1">
                      Total Amount
                    </div>
                    <div className="text-2xl font-semibold">0</div>
                    <div className="text-sm text-muted-foreground">HKD</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-1">
                      Accepted Amount
                    </div>
                    <div className="text-2xl font-semibold">0</div>
                    <div className="text-sm text-muted-foreground">HKD</div>
                  </CardContent>
                </Card>
              </div>

              {/* Distribution List */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribution List</CardTitle>
                </CardHeader>
                <CardContent>
                  <EmptyState
                    icon={Users}
                    title="No Distributions Yet"
                    description="Distribution records will appear here after the record of ownership is completed."
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modals */}
      <SubmitDistributionApprovalModal
        open={showSubmitModal}
        onOpenChange={setShowSubmitModal}
        onSuccess={() => {
          setCurrentStatus("Pending Approval");
          updateDistributionStatus(id || "", "Pending Approval");
        }}
      />
      <ListingDistributionModal
        open={showListingModal}
        onOpenChange={setShowListingModal}
        onSuccess={() => {
          setCurrentStatus("Upcoming");
          updateDistributionStatus(id || "", "Upcoming");
        }}
      />
      <PendingAllocationDistributionModal
        open={showPendingAllocationModal}
        onOpenChange={setShowPendingAllocationModal}
        onSuccess={() => {
          setCurrentStatus("Pending Allocation");
          updateDistributionStatus(id || "", "Pending Allocation");
        }}
      />
      <AllocationCompletedDistributionModal
        open={showAllocationCompletedModal}
        onOpenChange={setShowAllocationCompletedModal}
        onSuccess={() => {
          setCurrentStatus("Put On Chain");
          updateDistributionStatus(id || "", "Put On Chain");
        }}
      />
      <OpenForDistributionModal
        open={showOpenDistributionModal}
        onOpenChange={setShowOpenDistributionModal}
        payoutMode={distribution.payoutMode}
        onSuccess={() => {
          setCurrentStatus("Open For Distribution");
          updateDistributionStatus(id || "", "Open For Distribution");
          toast.success(
            isClaimMode
              ? "Distribution is now claimable by investors"
              : "Direct transfer has started. System is distributing payouts",
          );
        }}
      />
    </div>
  );
}
