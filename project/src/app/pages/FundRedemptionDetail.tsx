import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { ChevronRight, Copy } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";
import { FundRedemptionWorkflow } from "../components/FundIssuanceWorkflow";
import {
  SubmitRedemptionApprovalModal,
  ListingRedemptionModal,
  OpenForRedemptionModal,
} from "../components/modals/RedemptionModals";

export function FundRedemptionDetail() {
  const { id } = useParams();
  const { fundRedemptions, updateRedemptionStatus } = useApp();

  const redemption = fundRedemptions.find(r => r.id === id);

  if (!redemption) {
    return (
      <div className="container mx-auto px-6 py-20 text-center">
        <h2>Redemption Not Found</h2>
        <p className="text-muted-foreground mt-2">
          The redemption you're looking for doesn't exist or has been removed.
        </p>
      </div>
    );
  }

  const [currentStatus, setCurrentStatus] = useState(redemption.status);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showListingModal, setShowListingModal] = useState(false);
  const [showOpenRedemptionModal, setShowOpenRedemptionModal] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "Draft": "bg-gray-100 text-gray-800",
      "Pending Listing": "bg-yellow-100 text-yellow-800",
      "Upcoming": "bg-blue-100 text-blue-800",
      "Open For Redemption": "bg-green-100 text-green-800",
      "Done": "bg-teal-100 text-teal-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

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
          <Button onClick={() => setShowOpenRedemptionModal(true)}>
            Open For Redemption
          </Button>
        );
      case "Open For Redemption":
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
        <Link to="/manage/fund-redemption" className="hover:text-foreground transition-colors">
          Manage Fund Redemption
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground">{redemption.name}</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h1 style={{ fontFamily: 'var(--font-heading)' }}>{redemption.name}</h1>
            <Badge className={getStatusColor(currentStatus)}>{currentStatus}</Badge>
          </div>
          <div className="flex gap-2">{renderActionButtons()}</div>
        </div>
      </div>

      {/* Workflow Progress */}
      <div className="mb-8">
        <FundRedemptionWorkflow currentStatus={currentStatus} />
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
                  {redemption.tokenAddress ? "DEMO-FUND-2024" : "–"}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Token Contract Address
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-sm">
                    {redemption.tokenAddress || "–"}
                  </code>
                  {redemption.tokenAddress && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(redemption.tokenAddress || "")}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">Asset Type</div>
                <div className="font-medium">{redemption.assetType}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">Redemption Date</div>
                <div className="font-medium">
                  {redemption.redemptionDate || "–"}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">Payment Date</div>
                <div className="font-medium">
                  {redemption.paymentDate || "–"}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Initial NAV / Issue Price
                </div>
                <div className="font-medium">90 HKD</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Redemption Price
                </div>
                <div className="font-medium">100 HKD</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Redemption Quantity
                </div>
                <div className="font-medium">3,000</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Total Liability Amount
                </div>
                <div className="font-medium text-lg">300,000 HKD</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {redemption.description}
              </p>
              <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="text-sm font-medium text-blue-900 mb-2">
                  Redemption Process
                </div>
                <div className="text-xs text-blue-600">
                  Investors can redeem their fund shares during the redemption window.
                  The redemption amount will be calculated based on the latest NAV.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <SubmitRedemptionApprovalModal
        open={showSubmitModal}
        onOpenChange={setShowSubmitModal}
        onSuccess={() => {
          setCurrentStatus("Pending Listing");
          updateRedemptionStatus(id || "", "Pending Listing");
        }}
      />
      <ListingRedemptionModal
        open={showListingModal}
        onOpenChange={setShowListingModal}
        onSuccess={() => {
          setCurrentStatus("Upcoming");
          updateRedemptionStatus(id || "", "Upcoming");
        }}
      />
      <OpenForRedemptionModal
        open={showOpenRedemptionModal}
        onOpenChange={setShowOpenRedemptionModal}
        onSuccess={() => {
          setCurrentStatus("Open For Redemption");
          updateRedemptionStatus(id || "", "Open For Redemption");
        }}
      />
    </div>
  );
}
