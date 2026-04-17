import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronRight, PauseCircle, PlayCircle, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { InfoAlert } from "../components/InfoAlert";
import { StatusBadge } from "../components/StatusBadge";
import { FundRedemptionWorkflow } from "../components/FundIssuanceWorkflow";
import { OperationActionModal } from "../components/modals/OperationActionModal";
import { useApp } from "../context/AppContext";
import { FundOrder, FundRedemptionConfig } from "../data/fundDemoData";

function getNextRedemptionOrderAction(order: FundOrder) {
  switch (order.status) {
    case "Submitted":
      return { label: "Review", nextStatus: "Pending Review" as const };
    case "Pending Review":
      return { label: "Approve", nextStatus: "Pending NAV" as const };
    case "Pending NAV":
      return { label: "Move to cash settle", nextStatus: "Pending Cash Settlement" as const };
    case "Pending Cash Settlement":
      return { label: "Complete", nextStatus: "Completed" as const };
    default:
      return null;
  }
}

function buildRedemptionActionFlow({
  reviewTitle,
  reviewDescription,
  identityDescription,
  actionLabel,
  actionTitle,
  actionDescription,
  successTitle,
  successDescription,
}: {
  reviewTitle: string;
  reviewDescription: string;
  identityDescription: string;
  actionLabel: string;
  actionTitle: string;
  actionDescription: string;
  successTitle: string;
  successDescription: string;
}) {
  return [
    {
      label: "Review",
      title: reviewTitle,
      description: reviewDescription,
      state: "review" as const,
    },
    {
      label: "Identity",
      title: "Verify Identity",
      description: identityDescription,
      state: "loading" as const,
    },
    {
      label: actionLabel,
      title: actionTitle,
      description: actionDescription,
      state: "loading" as const,
    },
    {
      label: "Completed",
      title: successTitle,
      description: successDescription,
      state: "success" as const,
    },
  ];
}

function getRedemptionAction(config: FundRedemptionConfig) {
  switch (config.status) {
    case "Draft":
      return {
        label: "Submit for Approval",
        nextStatus: "Pending Approval" as const,
        message: "Redemption setup submitted for approval",
        icon: Send,
        variant: "default" as const,
        modalTitle: "Submit Redemption Setup For Approval",
        modalDescription:
          "Review the redemption setup, verify issuer identity, and submit it for approval.",
        modalSteps: buildRedemptionActionFlow({
          reviewTitle: "Review Redemption Draft",
          reviewDescription:
            "Confirm the linked fund, cut-off rules, and liquidity settings before submission.",
          identityDescription:
            "Issuer identity and redemption setup authority are being verified.",
          actionLabel: "Submit",
          actionTitle: "Submit Approval Request",
          actionDescription:
            "The redemption approval request is being submitted to the workflow.",
          successTitle: "Redemption submitted",
          successDescription:
            "The redemption setup is now waiting for approval review.",
        }),
      };
    case "Pending Approval":
      return {
        label: "Activate Setup",
        nextStatus: config.pauseRedemptionAfterListing ? "Announced" as const : "Active" as const,
        message: "Redemption setup activated",
        icon: ShieldCheck,
        variant: "default" as const,
        modalTitle: "Activate Redemption Setup",
        modalDescription:
          "Verify issuer identity and activate the approved redemption operating setup.",
        modalSteps: buildRedemptionActionFlow({
          reviewTitle: "Review Redemption Activation",
          reviewDescription:
            "Confirm the approved redemption setup is ready to move into the operating stage.",
          identityDescription:
            "Issuer identity and redemption activation authority are being verified.",
          actionLabel: "Activate",
          actionTitle: "Activate Setup",
          actionDescription:
            "The redemption setup activation request is being processed.",
          successTitle: "Redemption setup activated",
          successDescription:
            "The redemption setup has moved into its next operating stage.",
        }),
      };
    case "Announced":
      return {
        label: "Open Window",
        nextStatus: "Window Open" as const,
        message: "Redemption window opened",
        icon: PlayCircle,
        variant: "default" as const,
        modalTitle: "Open Redemption Window",
        modalDescription:
          "Verify issuer identity before opening the announced redemption window.",
        modalSteps: buildRedemptionActionFlow({
          reviewTitle: "Review Window Opening",
          reviewDescription:
            "Confirm the announcement period is complete and the redemption window should be opened.",
          identityDescription:
            "Issuer identity and redemption window authority are being verified.",
          actionLabel: "Open",
          actionTitle: "Open Redemption Window",
          actionDescription:
            "The redemption window opening request is being processed.",
          successTitle: "Window opened",
          successDescription:
            "The redemption window is now open for investors.",
        }),
      };
    case "Active":
    case "Window Open":
      return {
        label: "Pause",
        nextStatus: "Paused" as const,
        message: "Redemption processing paused",
        icon: PauseCircle,
        variant: "outline" as const,
        modalTitle: "Pause Redemption Processing",
        modalDescription:
          "Verify issuer identity before pausing redemption processing.",
        modalSteps: buildRedemptionActionFlow({
          reviewTitle: "Review Pause Request",
          reviewDescription:
            "Confirm the redemption process should be paused at this stage.",
          identityDescription:
            "Issuer identity and redemption control authority are being verified.",
          actionLabel: "Pause",
          actionTitle: "Pause Redemption",
          actionDescription:
            "The pause request is being recorded in the redemption workflow.",
          successTitle: "Redemption paused",
          successDescription:
            "Redemption processing has been paused successfully.",
        }),
      };
    case "Paused":
      return {
        label: "Resume",
        nextStatus:
          config.redemptionMode === "Window-based"
            ? ("Window Open" as const)
            : ("Active" as const),
        message: "Redemption processing resumed",
        icon: PlayCircle,
        variant: "default" as const,
        modalTitle: "Resume Redemption Processing",
        modalDescription:
          "Verify issuer identity before resuming redemption processing.",
        modalSteps: buildRedemptionActionFlow({
          reviewTitle: "Review Resume Request",
          reviewDescription:
            "Confirm the redemption setup is ready to resume processing.",
          identityDescription:
            "Issuer identity and redemption restart authority are being verified.",
          actionLabel: "Resume",
          actionTitle: "Resume Redemption",
          actionDescription:
            "The resume request is being processed for the redemption workflow.",
          successTitle: "Redemption resumed",
          successDescription:
            "Redemption processing has resumed successfully.",
        }),
      };
    default:
      return null;
  }
}

function getRedemptionRequestActionConfig(order: FundOrder) {
  const nextAction = getNextRedemptionOrderAction(order);
  if (!nextAction) return null;

  const copyMap: Record<
    string,
    {
      modalTitle: string;
      modalDescription: string;
      reviewDescription: string;
      identityDescription: string;
      actionTitle: string;
      actionDescription: string;
      successTitle: string;
      successDescription: string;
    }
  > = {
    Review: {
      modalTitle: "Review Redemption Request",
      modalDescription:
        "Verify operator identity before moving the redemption request into review.",
      reviewDescription:
        "Confirm the redemption request is ready for issuer review and compliance handling.",
      identityDescription:
        "Operator identity and redemption review authority are being verified.",
      actionTitle: "Move To Review",
      actionDescription:
        "The redemption request is being moved into the pending review state.",
      successTitle: "Request moved to review",
      successDescription:
        "The redemption request is now waiting for manual review.",
    },
    Approve: {
      modalTitle: "Approve Redemption Request",
      modalDescription:
        "Verify operator identity before approving the redemption request for NAV processing.",
      reviewDescription:
        "Confirm the redemption request passed review and should move to NAV handling.",
      identityDescription:
        "Operator identity and redemption approval authority are being verified.",
      actionTitle: "Approve Request",
      actionDescription:
        "The redemption request approval is being recorded.",
      successTitle: "Request approved",
      successDescription:
        "The redemption request has moved to pending NAV.",
    },
    "Move to cash settle": {
      modalTitle: "Move Redemption To Cash Settlement",
      modalDescription:
        "Verify operator identity before moving the redemption request into cash settlement.",
      reviewDescription:
        "Confirm NAV handling is complete and the cash settlement step should begin.",
      identityDescription:
        "Operator identity and settlement authority are being verified.",
      actionTitle: "Start Cash Settlement",
      actionDescription:
        "The redemption request is being moved into pending cash settlement.",
      successTitle: "Cash settlement started",
      successDescription:
        "The redemption request is now waiting for cash settlement.",
    },
    Complete: {
      modalTitle: "Complete Redemption Request",
      modalDescription:
        "Verify operator identity before marking the redemption request as completed.",
      reviewDescription:
        "Confirm settlement has been completed and the request can be closed.",
      identityDescription:
        "Operator identity and completion authority are being verified.",
      actionTitle: "Complete Request",
      actionDescription:
        "The redemption request completion is being recorded.",
      successTitle: "Request completed",
      successDescription:
        "The redemption request has been completed successfully.",
    },
  };

  const copy = copyMap[nextAction.label];
  if (!copy) return null;

  return {
    ...nextAction,
    ...copy,
    modalSteps: buildRedemptionActionFlow({
      reviewTitle: nextAction.label,
      reviewDescription: copy.reviewDescription,
      identityDescription: copy.identityDescription,
      actionLabel: nextAction.label,
      actionTitle: copy.actionTitle,
      actionDescription: copy.actionDescription,
      successTitle: copy.successTitle,
      successDescription: copy.successDescription,
    }),
  };
}

export function FundRedemptionDetail() {
  const { id } = useParams();
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    ReturnType<typeof getRedemptionAction> | null
  >(null);
  const [requestActionModalOpen, setRequestActionModalOpen] = useState(false);
  const [pendingRequestAction, setPendingRequestAction] = useState<
    (ReturnType<typeof getRedemptionRequestActionConfig> & { orderId: string }) | null
  >(null);
  const {
    fundRedemptions,
    fundOrders,
    fundBatches,
    fundIssuances,
    updateRedemptionStatus,
    updateFundOrderStatus,
  } = useApp();

  const redemption = fundRedemptions.find((item) => item.id === id);

  if (!redemption) {
    return (
      <div className="container mx-auto px-6 py-20 text-center">
        <h2>Redemption Setup Not Found</h2>
        <p className="text-muted-foreground mt-2">
          The redemption setup you are looking for does not exist or has been removed.
        </p>
      </div>
    );
  }

  const fund = fundIssuances.find((item) => item.id === redemption.fundId);
  const requests = fundOrders.filter(
    (order) => order.fundId === redemption.fundId && order.type === "redemption",
  );
  const batches = fundBatches.filter(
    (batch) => batch.fundId === redemption.fundId && batch.type === "redemption",
  );

  const handleStatusChange = (nextStatus: typeof redemption.status, message: string) => {
    updateRedemptionStatus(redemption.id, nextStatus);
    toast.success(message);
  };

  const renderActionButtons = () => {
    const action = getRedemptionAction(redemption);
    if (!action) return null;

    return (
      <Button
        variant={action.variant}
        onClick={() => {
          setPendingAction(action);
          setActionModalOpen(true);
        }}
      >
        <action.icon className="w-4 h-4 mr-2" />
        {action.label}
      </Button>
    );
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
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

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4 gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 style={{ fontFamily: "var(--font-heading)" }}>{redemption.name}</h1>
              <StatusBadge status={redemption.status} />
              <Badge variant="outline">{redemption.redemptionMode}</Badge>
            </div>
            <p className="text-muted-foreground mt-2 max-w-3xl">{redemption.description}</p>
          </div>
          <div>{renderActionButtons()}</div>
        </div>

        <InfoAlert variant="info" title="Redemption Operations">
          This page is the operating cockpit for open-end redemption, including request review, batch history, and liquidity window control.
        </InfoAlert>
      </div>

      <div className="mb-8">
        <FundRedemptionWorkflow currentStatus={redemption.status} />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <div className="text-muted-foreground mb-1">Fund</div>
                <div className="font-medium">{redemption.fundName}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Fund Token</div>
                <div className="font-medium">{redemption.fundToken}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Latest NAV</div>
                <div className="font-medium">{redemption.latestNav}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Cut-off Time</div>
                <div className="font-medium">{redemption.cutOffTime}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Settlement Cycle</div>
                <div className="font-medium">{redemption.settlementCycle}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Notice Period</div>
                <div className="font-medium">{redemption.noticePeriodDays} day(s)</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Max Redemption / Investor</div>
                <div className="font-medium">{redemption.maxRedemptionQuantityPerInvestor}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Manual Approval</div>
                <div className="font-medium">{redemption.manualApprovalRequired ? "Yes" : "No"}</div>
              </div>
              {redemption.windowStart && (
                <div>
                  <div className="text-muted-foreground mb-1">Window</div>
                  <div className="font-medium">
                    {redemption.windowStart} to {redemption.windowEnd}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {fund && (
            <Card>
              <CardHeader>
                <CardTitle>Linked Fund Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <div className="text-muted-foreground mb-1">Current Fund Status</div>
                  <div className="font-medium">{fund.status}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Current NAV</div>
                  <div className="font-medium">{fund.currentNav}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Next Settlement</div>
                  <div className="font-medium">{fund.nextSettlementTime || "N/A"}</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="requests">Requests</TabsTrigger>
              <TabsTrigger value="batches">Batch History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-1">Redemption Requests</div>
                    <div className="text-2xl font-semibold">{requests.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-1">Pending Review</div>
                    <div className="text-2xl font-semibold">
                      {requests.filter((item) => item.status === "Pending Review").length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-1">Pending Cash Settlement</div>
                    <div className="text-2xl font-semibold">
                      {requests.filter((item) => item.status === "Pending Cash Settlement").length}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Operating Notes</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-3">
                  <p>
                    Redemption requests are processed against the official fund NAV and may be reviewed manually before they move into cash settlement.
                  </p>
                  <p>
                    For the demo, this setup also doubles as the main place to explain redemption gates, cut-off handling, and T+1 cash settlement behavior.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="requests">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Investor</TableHead>
                    <TableHead>Requested Shares</TableHead>
                    <TableHead>Estimated Cash</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submit Time</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => {
                    const nextAction = getNextRedemptionOrderAction(request);
                    return (
                      <TableRow key={request.id}>
                        <TableCell className="font-mono text-xs">{request.id}</TableCell>
                        <TableCell>
                          <div className="font-medium">{request.investorName}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                            {request.investorWallet}
                          </div>
                        </TableCell>
                        <TableCell>{request.requestQuantity}</TableCell>
                        <TableCell>{request.estimatedSharesOrCash}</TableCell>
                        <TableCell>
                          <StatusBadge status={request.status} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {request.submitTime}
                        </TableCell>
                        <TableCell>
                          {nextAction ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const actionConfig = getRedemptionRequestActionConfig(request);
                                if (!actionConfig) return;
                                setPendingRequestAction({
                                  ...actionConfig,
                                  orderId: request.id,
                                });
                                setRequestActionModalOpen(true);
                              }}
                            >
                              {nextAction.label}
                            </Button>
                          ) : (
                            <span className="text-sm text-muted-foreground">No action</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="batches">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch ID</TableHead>
                    <TableHead>Cut-off Time</TableHead>
                    <TableHead>NAV</TableHead>
                    <TableHead>Order Count</TableHead>
                    <TableHead>Total Shares</TableHead>
                    <TableHead>Total Cash</TableHead>
                    <TableHead>Settlement</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-mono text-xs">{batch.id}</TableCell>
                      <TableCell>{batch.cutoffTime}</TableCell>
                      <TableCell>{batch.nav}</TableCell>
                      <TableCell>{batch.orderCount}</TableCell>
                      <TableCell>{batch.totalQuantity}</TableCell>
                      <TableCell>{batch.totalAmount}</TableCell>
                      <TableCell>{batch.settlementDate}</TableCell>
                      <TableCell>
                        <StatusBadge status={batch.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {pendingAction && (
        <OperationActionModal
          open={actionModalOpen}
          onOpenChange={(open) => {
            setActionModalOpen(open);
            if (!open) {
              setPendingAction(null);
            }
          }}
          onSuccess={() => handleStatusChange(pendingAction.nextStatus, pendingAction.message)}
          title={pendingAction.modalTitle}
          description={pendingAction.modalDescription}
          steps={pendingAction.modalSteps}
          startLabel="Start"
          completionLabel="Done"
          summary={[
            { label: "Redemption Setup", value: redemption.name },
            { label: "Linked Fund", value: redemption.fundName },
            { label: "Mode", value: redemption.redemptionMode },
            { label: "Current Status", value: redemption.status },
          ]}
        />
      )}

      {pendingRequestAction && (
        <OperationActionModal
          open={requestActionModalOpen}
          onOpenChange={(open) => {
            setRequestActionModalOpen(open);
            if (!open) {
              setPendingRequestAction(null);
            }
          }}
          onSuccess={() => {
            updateFundOrderStatus(
              pendingRequestAction.orderId,
              pendingRequestAction.nextStatus,
            );
            toast.success(
              `${pendingRequestAction.orderId} moved to ${pendingRequestAction.nextStatus}`,
            );
          }}
          title={pendingRequestAction.modalTitle}
          description={pendingRequestAction.modalDescription}
          steps={pendingRequestAction.modalSteps}
          startLabel="Start"
          completionLabel="Done"
          summary={[
            { label: "Request ID", value: pendingRequestAction.orderId },
            { label: "Linked Fund", value: redemption.fundName },
            { label: "Current Status", value: requests.find((item) => item.id === pendingRequestAction.orderId)?.status || "N/A" },
            { label: "Requested Shares", value: requests.find((item) => item.id === pendingRequestAction.orderId)?.requestQuantity || "N/A" },
          ]}
        />
      )}
    </div>
  );
}
