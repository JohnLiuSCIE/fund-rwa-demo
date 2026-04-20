import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
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
import { FundDistribution } from "../data/fundDemoData";

type DistributionEditableSection = "details" | "payout";

interface DistributionEditState {
  name: string;
  description: string;
  distributionRateType: string;
  distributionRate: string;
  distributionUnit: string;
  payoutMode: "Direct Transfer" | "Claim";
  payoutToken: string;
  payoutAccount: string;
  recordDate: string;
  paymentDate: string;
  actualDaysInPeriod: string;
  actualDaysInYear: string;
}

function toDateTimeLocal(value?: string) {
  return value ? value.slice(0, 16).replace(" ", "T") : "";
}

function fromDateTimeLocal(value: string) {
  return value ? `${value.replace("T", " ")}:00` : undefined;
}

function getEditableDistributionSections(status: string): DistributionEditableSection[] {
  if (["Draft", "Pending Approval", "Pending Listing", "Upcoming"].includes(status)) {
    return ["details", "payout"];
  }
  if (["Pending Allocation", "Put On Chain", "Open For Distribution"].includes(status)) {
    return ["payout"];
  }
  return [];
}

function getDistributionEditingPolicyMessage(status: string) {
  const editableSections = getEditableDistributionSections(status);
  if (editableSections.length === 0) {
    return "This stage is locked. After distribution is completed, fields become read-only.";
  }
  if (editableSections.length === 2) {
    return "Current stage allows full editing of distribution details and payout rules.";
  }
  return "Current stage only allows payout-rule updates. Core setup details are locked.";
}

function buildDistributionEditState(distribution: FundDistribution): DistributionEditState {
  return {
    name: distribution.name,
    description: distribution.description,
    distributionRateType: distribution.distributionRateType || "Fixed Rate",
    distributionRate: distribution.distributionRate || "",
    distributionUnit: distribution.distributionUnit || "",
    payoutMode: distribution.payoutMode || "Claim",
    payoutToken: distribution.payoutToken || "",
    payoutAccount: distribution.payoutAccount || "",
    recordDate: toDateTimeLocal(distribution.recordDate),
    paymentDate: toDateTimeLocal(distribution.paymentDate),
    actualDaysInPeriod: distribution.actualDaysInPeriod || "",
    actualDaysInYear: distribution.actualDaysInYear || "",
  };
}

function DistributionSetupEditor({
  distribution,
  onSave,
  onCancel,
}: {
  distribution: FundDistribution;
  onSave: (updates: Partial<FundDistribution>) => void;
  onCancel: () => void;
}) {
  const editableSections = getEditableDistributionSections(distribution.status);
  const [form, setForm] = useState<DistributionEditState>(() => buildDistributionEditState(distribution));

  useEffect(() => {
    setForm(buildDistributionEditState(distribution));
  }, [distribution]);

  const canEditDetails = editableSections.includes("details");
  const canEditPayout = editableSections.includes("payout");

  const setField = <K extends keyof DistributionEditState,>(
    key: K,
    value: DistributionEditState[K],
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Mode</CardTitle>
        <p className="text-sm text-muted-foreground">
          {getDistributionEditingPolicyMessage(distribution.status)}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {canEditDetails && (
          <div className="space-y-4 rounded-lg border p-4">
            <div>
              <h3 className="font-medium">Distribution Details</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Core identity, description, and record-date configuration for the distribution setup.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Distribution name</Label>
              <Input value={form.name} onChange={(event) => setField("name", event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(event) => setField("description", event.target.value)} rows={3} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Record date</Label>
                <Input type="datetime-local" value={form.recordDate} onChange={(event) => setField("recordDate", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Payment date</Label>
                <Input type="datetime-local" value={form.paymentDate} onChange={(event) => setField("paymentDate", event.target.value)} />
              </div>
            </div>
          </div>
        )}

        {canEditPayout && (
          <div className="space-y-4 rounded-lg border p-4">
            <div>
              <h3 className="font-medium">Payout Rules</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Configure the payout token, destination, and rate mechanics.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Payout mode</Label>
                <Select value={form.payoutMode} onValueChange={(value) => setField("payoutMode", value as "Direct Transfer" | "Claim")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Direct Transfer">Direct Transfer</SelectItem>
                    <SelectItem value="Claim">Claim</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payout token</Label>
                <Input value={form.payoutToken} onChange={(event) => setField("payoutToken", event.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Payout source account</Label>
              <Input value={form.payoutAccount} onChange={(event) => setField("payoutAccount", event.target.value)} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Distribution rate type</Label>
                <Select value={form.distributionRateType} onValueChange={(value) => setField("distributionRateType", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fixed Rate">Fixed Rate</SelectItem>
                    <SelectItem value="Per Unit">Per Unit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Distribution rate</Label>
                <Input value={form.distributionRate} onChange={(event) => setField("distributionRate", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Distribution unit</Label>
                <Input value={form.distributionUnit} onChange={(event) => setField("distributionUnit", event.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Actual days in period</Label>
                <Input value={form.actualDaysInPeriod} onChange={(event) => setField("actualDaysInPeriod", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Actual days in year</Label>
                <Input value={form.actualDaysInYear} onChange={(event) => setField("actualDaysInYear", event.target.value)} />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              onSave({
                name: form.name.trim() || distribution.name,
                description: form.description.trim() || distribution.description,
                distributionRateType: form.distributionRateType,
                distributionRate: form.distributionRate.trim() || undefined,
                distributionUnit: form.distributionUnit.trim() || undefined,
                payoutMode: form.payoutMode,
                payoutToken: form.payoutToken.trim() || undefined,
                payoutAccount: form.payoutAccount.trim() || undefined,
                recordDate: fromDateTimeLocal(form.recordDate),
                paymentDate: fromDateTimeLocal(form.paymentDate),
                actualDaysInPeriod: form.actualDaysInPeriod.trim() || undefined,
                actualDaysInYear: form.actualDaysInYear.trim() || undefined,
              })
            }
          >
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function FundDistributionDetail() {
  const { id } = useParams();
  const {
    fundDistributions,
    fundIssuances,
    updateDistributionStatus,
    updateFundDistribution,
    getPermissionResult,
    userRole,
  } = useApp();

  const distribution = fundDistributions.find(d => d.id === id);
  const linkedFund = fundIssuances.find((fund) => fund.id === distribution?.fundId);

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
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showListingModal, setShowListingModal] = useState(false);
  const [showPendingAllocationModal, setShowPendingAllocationModal] = useState(false);
  const [showAllocationCompletedModal, setShowAllocationCompletedModal] = useState(false);
  const [showOpenDistributionModal, setShowOpenDistributionModal] = useState(false);
  const isClaimMode = distribution.payoutMode !== "Direct Transfer";

  useEffect(() => {
    setCurrentStatus(distribution.status);
  }, [distribution.status]);

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

  const actionKeyByStatus: Record<string, string> = {
    Draft: "submit",
    "Pending Approval": "approve",
    "Pending Listing": "list",
    Upcoming: "open",
    "Pending Allocation": "put_on_chain",
    "Put On Chain": "open",
    "Open For Distribution": "update",
  };

  const getActionPermission = () => {
    const action = actionKeyByStatus[currentStatus];
    if (!action) return { allowed: true as const, reason: undefined };
    return getPermissionResult(action, "distribution");
  };

  const updatePermission = getPermissionResult("update", "distribution");
  const canEditSetup =
    userRole === "issuer" &&
    updatePermission.allowed &&
    getEditableDistributionSections(currentStatus).length > 0;

  const renderActionButton = () => {
    const permission = getActionPermission();
    switch (currentStatus) {
      case "Draft":
        return (
          <Button
            disabled={!permission.allowed}
            title={permission.reason}
            onClick={() => setShowSubmitModal(true)}
          >
            Submit For Approval
          </Button>
        );
      case "Pending Approval":
        return (
          <Button
            disabled={!permission.allowed}
            title={permission.reason}
            onClick={() => {
              setCurrentStatus("Pending Listing");
              updateDistributionStatus(id || "", "Pending Listing", "approve");
              toast.success("Distribution approved and queued for listing");
            }}
          >
            Approve Listing
          </Button>
        );
      case "Pending Listing":
        return (
          <Button
            disabled={!permission.allowed}
            title={permission.reason}
            onClick={() => setShowListingModal(true)}
          >
            Listing
          </Button>
        );
      case "Upcoming":
        return (
          <Button
            disabled={!permission.allowed}
            title={permission.reason}
            onClick={() => setShowPendingAllocationModal(true)}
          >
            Record of Ownership
          </Button>
        );
      case "Pending Allocation":
        return (
          <Button
            disabled={!permission.allowed}
            title={permission.reason}
            onClick={() => setShowAllocationCompletedModal(true)}
          >
            Put On Chain
          </Button>
        );
      case "Put On Chain":
        return (
          <Button
            disabled={!permission.allowed}
            title={permission.reason}
            onClick={() => setShowOpenDistributionModal(true)}
          >
            {isClaimMode ? "Open For Claim" : "Start Auto Distribution"}
          </Button>
        );
      case "Open For Distribution":
        return (
          <Button
            disabled={!permission.allowed}
            title={permission.reason}
            onClick={() => {
              setCurrentStatus("Done");
              updateDistributionStatus(id || "", "Done", "update");
              toast.success("Distribution marked complete");
            }}
          >
            Mark Complete
          </Button>
        );
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
        <Link
          to={userRole === "issuer" ? "/manage/fund-distribution" : "/marketplace/fund-distribution"}
          className="hover:text-foreground transition-colors"
        >
          {userRole === "issuer" ? "Manage Fund Distribution" : "Marketplace Fund Distribution"}
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
        </div>
        {!getActionPermission().allowed && (
          <p className="text-sm text-muted-foreground">{getActionPermission().reason}</p>
        )}
      </div>

      {/* Workflow Progress */}
      <div className="mb-8">
        <FundDistributionWorkflow currentStatus={currentStatus} actionSlot={renderActionButton()} />
      </div>

      <div className="mb-8 flex flex-col gap-4 rounded-lg border bg-secondary/20 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-medium">Field Editing Policy</div>
          <div className="mt-1 text-sm text-muted-foreground">
            {getDistributionEditingPolicyMessage(currentStatus)}
          </div>
        </div>
        {canEditSetup && !isInlineEditing && (
          <Button variant="outline" onClick={() => setIsInlineEditing(true)}>
            Enter Edit Mode
          </Button>
        )}
      </div>

      {isInlineEditing && (
        <div className="mb-8">
          <DistributionSetupEditor
            distribution={{ ...distribution, status: currentStatus }}
            onCancel={() => setIsInlineEditing(false)}
            onSave={(updates) => {
              const updated = updateFundDistribution(distribution.id, updates, "update");
              if (!updated) return;
              setIsInlineEditing(false);
              toast.success("Allowed distribution fields updated");
            }}
          />
        </div>
      )}

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
                <div className="text-sm text-muted-foreground mb-1">Payout Mode</div>
                <div className="font-medium">{distribution.payoutMode || "Claim"}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {distribution.payoutMode === "Direct Transfer"
                    ? "Gas paid by fund operator, payout is system-triggered."
                    : "Gas paid by investor at claim time."}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">Payout Token</div>
                <div className="font-medium">
                  {distribution.payoutToken || distribution.distributionUnit || "–"}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">Payout Source Account</div>
                <div className="font-medium">{distribution.payoutAccount || "–"}</div>
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
                      at the record date.{" "}
                      {distribution.payoutMode === "Direct Transfer"
                        ? "After opening, the system starts fund transfer automatically."
                        : "After opening, investors can claim payout on-chain."}
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
          updateDistributionStatus(id || "", "Pending Approval", "submit");
          toast.success(`Action recorded by ${userRole}`);
        }}
      />
      <ListingDistributionModal
        open={showListingModal}
        onOpenChange={setShowListingModal}
        onSuccess={() => {
          setCurrentStatus("Upcoming");
          updateDistributionStatus(id || "", "Upcoming", "list");
          toast.success(`Listing action recorded by ${userRole}`);
        }}
      />
      <PendingAllocationDistributionModal
        open={showPendingAllocationModal}
        onOpenChange={setShowPendingAllocationModal}
        onSuccess={() => {
          setCurrentStatus("Pending Allocation");
          updateDistributionStatus(id || "", "Pending Allocation", "open");
        }}
      />
      <AllocationCompletedDistributionModal
        open={showAllocationCompletedModal}
        onOpenChange={setShowAllocationCompletedModal}
        onSuccess={() => {
          setCurrentStatus("Put On Chain");
          updateDistributionStatus(id || "", "Put On Chain", "put_on_chain");
        }}
      />
      <OpenForDistributionModal
        open={showOpenDistributionModal}
        onOpenChange={setShowOpenDistributionModal}
        onSuccess={() => {
          setCurrentStatus("Open For Distribution");
          updateDistributionStatus(id || "", "Open For Distribution", "open");
          toast.success(
            isClaimMode
              ? "Distribution is open for claim by investors"
              : "Distribution opened and system payout is in progress",
          );
        }}
      />
    </div>
  );
}
