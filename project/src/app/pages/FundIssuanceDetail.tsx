import { useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  ArrowRightLeft,
  ChevronRight,
  Clock3,
  Copy,
  LineChart,
  PauseCircle,
  PlayCircle,
  RefreshCcw,
  Send,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { InfoAlert } from "../components/InfoAlert";
import { MetricCard } from "../components/MetricCard";
import { StatusBadge } from "../components/StatusBadge";
import { FundIssuanceWorkflow } from "../components/FundIssuanceWorkflow";
import { RedeemModal, SubscribeModal } from "../components/modals/InvestorModals";
import { OperationActionModal } from "../components/modals/OperationActionModal";
import { useApp } from "../context/AppContext";
import { FundIssuance, FundOrder } from "../data/fundDemoData";

function formatNumber(value: number, digits = 2) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value);
}

function nowString() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function getNextOrderAction(order: FundOrder) {
  switch (order.status) {
    case "Submitted":
      return { label: "Queue for NAV", nextStatus: "Pending NAV" as const };
    case "Pending Review":
      return { label: "Approve", nextStatus: "Pending NAV" as const };
    case "Pending NAV":
      return {
        label:
          order.type === "subscription"
            ? "Confirm shares"
            : "Move to cash settle",
        nextStatus:
          order.type === "subscription"
            ? ("Confirmed" as const)
            : ("Pending Cash Settlement" as const),
      };
    case "Pending Cash Settlement":
      return { label: "Settle cash", nextStatus: "Completed" as const };
    case "Pending Confirmation":
      return { label: "Confirm", nextStatus: "Confirmed" as const };
    default:
      return null;
  }
}

function buildActionFlow({
  reviewTitle,
  reviewDescription,
  identityDescription,
  actionLabel,
  actionTitle,
  actionDescription,
  executionLabel,
  executionTitle,
  executionDescription,
  successTitle,
  successDescription,
}: {
  reviewTitle: string;
  reviewDescription: string;
  identityDescription: string;
  actionLabel: string;
  actionTitle: string;
  actionDescription: string;
  executionLabel?: string;
  executionTitle?: string;
  executionDescription?: string;
  successTitle: string;
  successDescription: string;
}) {
  const steps = [
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
  ];

  if (executionLabel && executionTitle && executionDescription) {
    steps.push({
      label: executionLabel,
      title: executionTitle,
      description: executionDescription,
      state: "loading" as const,
    });
  }

  steps.push({
    label: "Completed",
    title: successTitle,
    description: successDescription,
    state: "success" as const,
  });

  return steps;
}

function getFundAction(fund: FundIssuance) {
  if (fund.fundType === "Open-end") {
    switch (fund.status) {
      case "Draft":
        return {
          label: "Submit for Approval",
          nextStatus: "Pending Approval",
          message: "Open-end fund draft submitted for approval",
          icon: Send,
          variant: "default" as const,
          modalTitle: "Submit Open-end Fund For Approval",
          modalDescription:
            "Review the open-end fund draft, verify issuer identity, and submit the issuance request for approval.",
          modalSteps: buildActionFlow({
            reviewTitle: "Review Draft Submission",
            reviewDescription:
              "Confirm the open-end fund draft, dealing rules, and launch configuration before submission.",
            identityDescription:
              "Issuer identity, compliance permissions, and wallet authority are being verified.",
            actionLabel: "Submit",
            actionTitle: "Submit Approval Request",
            actionDescription:
              "The approval request is being recorded in the fund issuance workflow.",
            successTitle: "Open-end fund submitted",
            successDescription:
              "The open-end fund draft is now waiting for approval review.",
          }),
        };
      case "Pending Approval":
        return {
          label: "Approve Launch",
          nextStatus: "Upcoming Launch",
          message: "Approval completed. Fund is queued for launch",
          icon: ShieldCheck,
          variant: "default" as const,
          modalTitle: "Approve Open-end Launch",
          modalDescription:
            "Verify the approver identity and release the fund into the launch preparation stage.",
          modalSteps: buildActionFlow({
            reviewTitle: "Review Approval Decision",
            reviewDescription:
              "Confirm the fund is ready to move from approval review into launch preparation.",
            identityDescription:
              "Approver identity and issuer authorization are being verified.",
            actionLabel: "Approve",
            actionTitle: "Approve Launch",
            actionDescription:
              "The approval signature is being recorded for the fund launch decision.",
            successTitle: "Launch approved",
            successDescription:
              "The fund has moved into the upcoming launch stage.",
          }),
        };
      case "Upcoming Launch":
        return {
          label: "Open Initial Subscription",
          nextStatus: "Initial Subscription",
          message: "Initial subscription window is now open",
          icon: PlayCircle,
          variant: "default" as const,
          modalTitle: "Open Initial Subscription",
          modalDescription:
            "Verify issuer identity and activate the initial subscription window for the open-end fund.",
          modalSteps: buildActionFlow({
            reviewTitle: "Review Subscription Opening",
            reviewDescription:
              "Confirm the launch window, subscription terms, and investor access before opening.",
            identityDescription:
              "Issuer identity and subscription-opening authority are being verified.",
            actionLabel: "Sign",
            actionTitle: "Sign Opening Request",
            actionDescription:
              "The initial subscription opening request is being signed and submitted.",
            successTitle: "Initial subscription opened",
            successDescription:
              "Investors can now enter the initial subscription stage.",
          }),
        };
      case "Initial Subscription":
        return {
          label: "Activate Daily Dealing",
          nextStatus: "Active Dealing",
          message: "Fund moved into active daily dealing mode",
          icon: PlayCircle,
          variant: "default" as const,
          modalTitle: "Activate Daily Dealing",
          modalDescription:
            "Verify issuer identity and activate ongoing daily dealing for the open-end fund.",
          modalSteps: buildActionFlow({
            reviewTitle: "Review Daily Dealing Activation",
            reviewDescription:
              "Check the launch readiness, NAV cycle, and settlement settings before activation.",
            identityDescription:
              "Issuer identity and dealing activation authority are being verified.",
            actionLabel: "Activate",
            actionTitle: "Activate Daily Dealing",
            actionDescription:
              "The fund is being switched into daily dealing mode.",
            successTitle: "Daily dealing activated",
            successDescription:
              "The open-end fund is now in active dealing mode.",
          }),
        };
      case "Active Dealing":
        return {
          label: "Pause Dealing",
          nextStatus: "Paused",
          message: "Daily dealing paused",
          icon: PauseCircle,
          variant: "outline" as const,
          modalTitle: "Pause Daily Dealing",
          modalDescription:
            "Verify issuer identity before pausing open-end dealing operations.",
          modalSteps: buildActionFlow({
            reviewTitle: "Review Pause Request",
            reviewDescription:
              "Confirm the dealing pause reason and operating impact before proceeding.",
            identityDescription:
              "Issuer identity and dealing control authority are being verified.",
            actionLabel: "Pause",
            actionTitle: "Pause Dealing",
            actionDescription:
              "The daily dealing pause request is being recorded.",
            successTitle: "Daily dealing paused",
            successDescription:
              "The open-end fund has been paused successfully.",
          }),
        };
      case "Paused":
        return {
          label: "Resume Dealing",
          nextStatus: "Active Dealing",
          message: "Daily dealing resumed",
          icon: PlayCircle,
          variant: "default" as const,
          modalTitle: "Resume Daily Dealing",
          modalDescription:
            "Verify issuer identity before resuming open-end dealing operations.",
          modalSteps: buildActionFlow({
            reviewTitle: "Review Resume Request",
            reviewDescription:
              "Confirm the fund is ready to resume daily dealing for investors.",
            identityDescription:
              "Issuer identity and dealing restart authority are being verified.",
            actionLabel: "Resume",
            actionTitle: "Resume Dealing",
            actionDescription:
              "The daily dealing restart request is being processed.",
            successTitle: "Daily dealing resumed",
            successDescription:
              "The open-end fund has resumed daily dealing.",
          }),
        };
      default:
        return null;
    }
  }

  switch (fund.status) {
    case "Draft":
      return {
        label: "Submit for Approval",
        nextStatus: "Pending Approval",
        message: "Closed-end fund draft submitted for approval",
        icon: Send,
        variant: "default" as const,
        modalTitle: "Submit Closed-end Fund For Approval",
        modalDescription:
          "Review the closed-end issuance draft, verify issuer identity, and submit it for approval.",
        modalSteps: buildActionFlow({
          reviewTitle: "Review Draft Submission",
          reviewDescription:
            "Check the issuance terms, subscription window, and supporting setup before submission.",
          identityDescription:
            "Issuer identity, compliance permissions, and wallet authority are being verified.",
          actionLabel: "Submit",
          actionTitle: "Submit Approval Request",
          actionDescription:
            "The closed-end fund approval request is being submitted.",
          successTitle: "Closed-end fund submitted",
          successDescription:
            "The fund draft is now waiting for approval review.",
        }),
      };
    case "Pending Approval":
      return {
        label: "Approve Listing",
        nextStatus: "Pending Listing",
        message: "Approval completed. Ready for listing",
        icon: ShieldCheck,
        variant: "default" as const,
        modalTitle: "Approve Closed-end Listing",
        modalDescription:
          "Verify approver identity and move the closed-end fund into listing preparation.",
        modalSteps: buildActionFlow({
          reviewTitle: "Review Listing Approval",
          reviewDescription:
            "Confirm the closed-end fund is ready to proceed to listing.",
          identityDescription:
            "Approver identity and listing authority are being verified.",
          actionLabel: "Approve",
          actionTitle: "Approve Listing",
          actionDescription:
            "The approval signature for listing is being recorded.",
          successTitle: "Listing approved",
          successDescription:
            "The fund is now ready for listing actions.",
        }),
      };
    case "Pending Listing":
      return {
        label: "List Fund",
        nextStatus: "Upcoming",
        message: "Fund listing has been prepared",
        icon: PlayCircle,
        variant: "default" as const,
        modalTitle: "List Closed-end Fund",
        modalDescription:
          "Verify issuer identity and complete the listing actions for the closed-end fund.",
        modalSteps: buildActionFlow({
          reviewTitle: "Review Listing Request",
          reviewDescription:
            "Confirm the fund should move from pending listing into the upcoming subscription stage.",
          identityDescription:
            "Issuer identity and listing authority are being verified.",
          actionLabel: "Sign",
          actionTitle: "Sign Listing Request",
          actionDescription:
            "The wallet signature for fund listing is being recorded.",
          executionLabel: "List",
          executionTitle: "Execute Listing",
          executionDescription:
            "The listing request is being posted to the issuance workflow.",
          successTitle: "Fund listed",
          successDescription:
            "The closed-end fund is now in the upcoming stage.",
        }),
      };
    case "Upcoming":
      return {
        label: "Open Subscription",
        nextStatus: "Open For Subscription",
        message: "Closed-end subscription window is now open",
        icon: PlayCircle,
        variant: "default" as const,
        modalTitle: "Open Closed-end Subscription",
        modalDescription:
          "Verify issuer identity and open the subscription window for investors.",
        modalSteps: buildActionFlow({
          reviewTitle: "Review Subscription Opening",
          reviewDescription:
            "Confirm the subscription window and issuance terms before opening investor access.",
          identityDescription:
            "Issuer identity and subscription authority are being verified.",
          actionLabel: "Sign",
          actionTitle: "Sign Opening Request",
          actionDescription:
            "The subscription opening request is being signed.",
          successTitle: "Subscription opened",
          successDescription:
            "The closed-end fund is now open for subscription.",
        }),
      };
    case "Open For Subscription":
      return {
        label: "Close and Start Allocation",
        nextStatus: "Allocation Period",
        message: "Subscription closed. Allocation period started",
        icon: PauseCircle,
        variant: "outline" as const,
        modalTitle: "Close Subscription And Start Allocation",
        modalDescription:
          "Verify issuer identity and close subscriptions before starting allocation.",
        modalSteps: buildActionFlow({
          reviewTitle: "Review Allocation Start",
          reviewDescription:
            "Confirm subscriptions should be closed and allocation processing should begin.",
          identityDescription:
            "Issuer identity and allocation-start authority are being verified.",
          actionLabel: "Close",
          actionTitle: "Close Subscription Window",
          actionDescription:
            "The subscription close instruction is being processed.",
          successTitle: "Allocation started",
          successDescription:
            "The fund is now in the allocation period.",
        }),
      };
    case "Allocation Period":
      return {
        label: "Calculate Allocation",
        nextStatus: "Calculated",
        message: "Allocation calculation completed",
        icon: ShieldCheck,
        variant: "default" as const,
        modalTitle: "Calculate Allocation",
        modalDescription:
          "Verify issuer identity before running the allocation calculation step.",
        modalSteps: buildActionFlow({
          reviewTitle: "Review Allocation Calculation",
          reviewDescription:
            "Confirm the subscription book is ready for allocation calculation.",
          identityDescription:
            "Issuer identity and allocation-calculation authority are being verified.",
          actionLabel: "Calculate",
          actionTitle: "Calculate Allocation",
          actionDescription:
            "The allocation result is being calculated for the closed-end fund.",
          successTitle: "Allocation calculated",
          successDescription:
            "The allocation result is ready for the next on-chain step.",
        }),
      };
    case "Calculated":
      return {
        label: "Allocate On Chain",
        nextStatus: "Allocate On Chain",
        message: "Allocation moved to on-chain execution",
        icon: PlayCircle,
        variant: "default" as const,
        modalTitle: "Allocate On Chain",
        modalDescription:
          "Verify issuer identity and execute the on-chain allocation step.",
        modalSteps: buildActionFlow({
          reviewTitle: "Review On-chain Allocation",
          reviewDescription:
            "Confirm the calculated allocation result before pushing it on chain.",
          identityDescription:
            "Issuer identity and on-chain allocation authority are being verified.",
          actionLabel: "Approve",
          actionTitle: "Approve Allocation",
          actionDescription:
            "The on-chain allocation approval is being signed.",
          executionLabel: "Execute",
          executionTitle: "Execute Allocation",
          executionDescription:
            "The calculated allocation is being sent to the on-chain step.",
          successTitle: "Allocation moved on chain",
          successDescription:
            "The allocation is now in the on-chain execution stage.",
        }),
      };
    case "Allocate On Chain":
      return {
        label: "Mark Allocation Completed",
        nextStatus: "Allocation Completed",
        message: "On-chain allocation completed",
        icon: ShieldCheck,
        variant: "default" as const,
        modalTitle: "Mark Allocation Completed",
        modalDescription:
          "Verify issuer identity before confirming the on-chain allocation is complete.",
        modalSteps: buildActionFlow({
          reviewTitle: "Review Allocation Completion",
          reviewDescription:
            "Confirm the on-chain allocation step completed successfully.",
          identityDescription:
            "Issuer identity and completion authority are being verified.",
          actionLabel: "Confirm",
          actionTitle: "Confirm Completion",
          actionDescription:
            "The allocation completion confirmation is being recorded.",
          successTitle: "Allocation completed",
          successDescription:
            "The fund has completed the allocation step.",
        }),
      };
    case "Allocation Completed":
      return {
        label: "Complete Issuance",
        nextStatus: "Issuance Completed",
        message: "Issuance process completed",
        icon: ShieldCheck,
        variant: "default" as const,
        modalTitle: "Complete Issuance",
        modalDescription:
          "Verify issuer identity and complete the closed-end issuance process.",
        modalSteps: buildActionFlow({
          reviewTitle: "Review Issuance Completion",
          reviewDescription:
            "Confirm the issuance can move from allocation completion to final completion.",
          identityDescription:
            "Issuer identity and issuance-completion authority are being verified.",
          actionLabel: "Complete",
          actionTitle: "Complete Issuance",
          actionDescription:
            "The issuance completion request is being processed.",
          successTitle: "Issuance completed",
          successDescription:
            "The closed-end issuance process has been completed.",
        }),
      };
    case "Issuance Completed":
      return {
        label: "Activate Fund",
        nextStatus: "Issuance Active",
        message: "Closed-end fund is now active",
        icon: PlayCircle,
        variant: "default" as const,
        modalTitle: "Activate Closed-end Fund",
        modalDescription:
          "Verify issuer identity and activate the fund after issuance completion.",
        modalSteps: buildActionFlow({
          reviewTitle: "Review Fund Activation",
          reviewDescription:
            "Confirm the fund is ready to enter its active post-issuance state.",
          identityDescription:
            "Issuer identity and fund-activation authority are being verified.",
          actionLabel: "Activate",
          actionTitle: "Activate Fund",
          actionDescription:
            "The activation request is being recorded for the closed-end fund.",
          successTitle: "Fund activated",
          successDescription:
            "The closed-end fund is now active.",
        }),
      };
    default:
      return null;
  }
}

function renderOrderTable(
  orders: FundOrder[],
  isMarketplaceView: boolean,
  onAdvance: (order: FundOrder) => void,
  canAdvanceOrder: boolean,
  deniedReason?: string,
) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order ID</TableHead>
          <TableHead>Investor</TableHead>
          <TableHead>Request</TableHead>
          <TableHead>Estimated</TableHead>
          <TableHead>Confirmed</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Submit Time</TableHead>
          {!isMarketplaceView && <TableHead>Action</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => {
          const nextAction = getNextOrderAction(order);
          return (
            <TableRow key={order.id}>
              <TableCell className="font-mono text-xs">{order.id}</TableCell>
              <TableCell>
                <div className="font-medium">{order.investorName}</div>
                <div className="max-w-[200px] truncate text-xs text-muted-foreground">
                  {order.investorWallet}
                </div>
              </TableCell>
              <TableCell>
                <div>{order.requestAmount}</div>
                <div className="text-xs text-muted-foreground">{order.requestQuantity}</div>
              </TableCell>
              <TableCell>{order.estimatedSharesOrCash}</TableCell>
              <TableCell>{order.confirmedSharesOrCash || "Pending"}</TableCell>
              <TableCell>
                <StatusBadge status={order.status} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {order.submitTime}
              </TableCell>
              {!isMarketplaceView && (
                <TableCell>
                  {nextAction ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!canAdvanceOrder}
                      title={canAdvanceOrder ? undefined : deniedReason}
                      onClick={() => onAdvance(order)}
                    >
                      {nextAction.label}
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">No action</span>
                  )}
                </TableCell>
              )}
            </TableRow>
          );
        })}
        {orders.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={isMarketplaceView ? 7 : 8}
              className="py-12 text-center text-muted-foreground"
            >
              No orders yet.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

export function FundIssuanceDetail() {
  const { id } = useParams();
  const location = useLocation();
  const isMarketplaceView = location.pathname.includes("marketplace");
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [issuerActionModalOpen, setIssuerActionModalOpen] = useState(false);
  const [pendingIssuerAction, setPendingIssuerAction] = useState<
    ReturnType<typeof getFundAction> | null
  >(null);

  const {
    currentInvestor,
    fundIssuances,
    fundOrders,
    addFundOrder,
    updateFundOrderStatus,
    updateFundStatus,
    getPermissionResult,
    userRole,
  } = useApp();

  const fundData = fundIssuances.find((fund) => fund.id === id);

  const allFundOrders = useMemo(
    () => fundOrders.filter((order) => order.fundId === id),
    [fundOrders, id],
  );

  const visibleOrders = useMemo(() => {
    if (!isMarketplaceView) return allFundOrders;
    return allFundOrders.filter((order) => order.investorId === currentInvestor.id);
  }, [allFundOrders, currentInvestor.id, isMarketplaceView]);

  if (!fundData) {
    return (
      <div className="container mx-auto px-6 py-20 text-center">
        <h2>Fund Not Found</h2>
        <p className="mt-2 text-muted-foreground">
          The fund you are looking for does not exist or has been removed.
        </p>
      </div>
    );
  }

  const isOpenEnd = fundData.fundType === "Open-end";
  const subscriptionOrders = visibleOrders.filter((order) => order.type === "subscription");
  const redemptionOrders = visibleOrders.filter((order) => order.type === "redemption");
  const pendingSubscriptionOrders = allFundOrders.filter(
    (order) =>
      order.type === "subscription" &&
      ["Submitted", "Pending Review", "Pending NAV", "Pending Confirmation"].includes(
        order.status,
      ),
  ).length;
  const pendingRedemptionOrders = allFundOrders.filter(
    (order) =>
      order.type === "redemption" &&
      ["Submitted", "Pending Review", "Pending NAV", "Pending Cash Settlement"].includes(
        order.status,
      ),
  ).length;

  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value);
    toast.success("Copied to clipboard");
  };

  const transitionFundStatus = (nextStatus: string, description: string) => {
    if (!pendingIssuerAction) return;
    const updated = updateFundStatus(
      fundData.id,
      nextStatus,
      pendingIssuerAction.label.toLowerCase(),
    );
    if (!updated) return;
    toast.success(description);
  };

  const handleOrderAdvance = (order: FundOrder) => {
    const nextAction = getNextOrderAction(order);
    if (!nextAction) return;
    const updated = updateFundOrderStatus(
      order.id,
      nextAction.nextStatus,
      nextAction.label.toLowerCase(),
    );
    if (!updated) return;
    toast.success(`${order.id} moved to ${nextAction.nextStatus}`);
  };

  const handleSubscribeSuccess = ({
    amount,
    estimatedUnits,
  }: {
    amount: number;
    estimatedUnits: number;
  }) => {
    const added = addFundOrder({
      id: `sub-${Date.now()}`,
      fundId: fundData.id,
      investorId: currentInvestor.id,
      investorName: currentInvestor.name,
      investorWallet: currentInvestor.wallet,
      type: "subscription",
      requestAmount: `${formatNumber(amount, 2)} ${fundData.navCurrency}`,
      requestQuantity: `${formatNumber(estimatedUnits, 4)} units`,
      estimatedNav: fundData.currentNav,
      estimatedSharesOrCash: `${formatNumber(estimatedUnits, 4)} units`,
      submitTime: nowString(),
      status: !isOpenEnd
        ? "Pending Review"
        : fundData.orderConfirmationMethod === "Issuer review then confirm"
          ? "Pending Review"
          : "Pending NAV",
      note:
        fundData.fundType === "Open-end"
          ? "Created from marketplace subscription modal"
          : "Created from marketplace closed-end subscription modal",
    });
    if (!added) return;
  };

  const handleRedeemSuccess = ({
    quantity,
    estimatedCash,
  }: {
    quantity: number;
    estimatedCash: number;
  }) => {
    const added = addFundOrder({
      id: `red-${Date.now()}`,
      fundId: fundData.id,
      investorId: currentInvestor.id,
      investorName: currentInvestor.name,
      investorWallet: currentInvestor.wallet,
      type: "redemption",
      requestAmount: `${formatNumber(quantity, 2)} units`,
      requestQuantity: `${formatNumber(quantity, 2)} units`,
      estimatedNav: fundData.currentNav,
      estimatedSharesOrCash: `${formatNumber(estimatedCash, 2)} ${fundData.navCurrency}`,
      submitTime: nowString(),
      status:
        fundData.orderConfirmationMethod === "Issuer review then confirm"
          ? "Pending Review"
          : "Pending Cash Settlement",
      note: "Created from marketplace redemption modal",
    });
    if (!added) return;
  };

  const issuerAction = getFundAction(fundData);
  const canOpenEndSubscribe =
    isOpenEnd &&
    ["Initial Subscription", "Active Dealing"].includes(fundData.status) &&
    fundData.subscriptionStatus !== "Paused";
  const canOpenEndRedeem =
    isOpenEnd &&
    fundData.status === "Active Dealing" &&
    fundData.redemptionStatus === "Open";
  const canClosedEndSubscribe = !isOpenEnd && fundData.status === "Open For Subscription";
  const subscribePermission = getPermissionResult("subscribe", "order");
  const redeemPermission = getPermissionResult("redeem", "order");
  const issuerActionPermission = issuerAction
    ? getPermissionResult(issuerAction.label.toLowerCase(), "issuance")
    : { allowed: true as const };
  const manageOrderPermission = getPermissionResult("review", "order");

  return (
    <div className="container mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="transition-colors hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        {isMarketplaceView ? (
          <>
            <Link
              to="/marketplace/fund-issuance"
              className="transition-colors hover:text-foreground"
            >
              Marketplace
            </Link>
            <ChevronRight className="h-4 w-4" />
          </>
        ) : (
          <>
            <Link
              to="/manage/fund-issuance"
              className="transition-colors hover:text-foreground"
            >
              Manage Fund Issuance
            </Link>
            <ChevronRight className="h-4 w-4" />
          </>
        )}
        <span className="text-foreground">{fundData.name}</span>
      </div>

      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 style={{ fontFamily: "var(--font-heading)" }}>{fundData.name}</h1>
              <StatusBadge status={fundData.status} />
              <Badge variant="outline">{fundData.fundType}</Badge>
              {fundData.dealingFrequency && (
                <Badge variant="outline">{fundData.dealingFrequency} dealing</Badge>
              )}
            </div>
            <p className="mt-2 max-w-3xl text-muted-foreground">{fundData.description}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {isMarketplaceView ? (
              <>
                {canOpenEndSubscribe && (
                  <Button
                    disabled={!subscribePermission.allowed}
                    title={subscribePermission.reason}
                    onClick={() => setShowSubscribeModal(true)}
                  >
                    Subscribe
                  </Button>
                )}
                {canOpenEndRedeem && (
                  <Button
                    variant="outline"
                    disabled={!redeemPermission.allowed}
                    title={redeemPermission.reason}
                    onClick={() => setShowRedeemModal(true)}
                  >
                    Redeem
                  </Button>
                )}
                {canClosedEndSubscribe && (
                  <Button
                    disabled={!subscribePermission.allowed}
                    title={subscribePermission.reason}
                    onClick={() => setShowSubscribeModal(true)}
                  >
                    Subscribe
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button asChild variant="outline">
                  <Link to="/manage/fund-redemption">Go to Redemption Setup</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/manage/fund-distribution">Go to Distribution Setup</Link>
                </Button>
                {issuerAction && (
                  <Button
                    variant={issuerAction.variant}
                    disabled={!issuerActionPermission.allowed}
                    title={issuerActionPermission.reason}
                    onClick={() => {
                      setPendingIssuerAction(issuerAction);
                      setIssuerActionModalOpen(true);
                    }}
                  >
                    <issuerAction.icon className="mr-2 h-4 w-4" />
                    {issuerAction.label}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {isOpenEnd ? (
          <InfoAlert variant="info" title="Open-end Operating Flow">
            This demo keeps approval, launch, initial subscription, daily dealing, NAV
            confirmation, and settlement as separate stages so the operating flow stays
            visible.
          </InfoAlert>
        ) : (
          <InfoAlert variant="info" title="Closed-end Issuance Flow">
            Closed-end issuance remains fully supported in the demo, including approval,
            listing, subscription, allocation, on-chain completion, and activation.
          </InfoAlert>
        )}
      </div>

      <div className="mb-8">
        <FundIssuanceWorkflow
          currentStatus={fundData.status}
          fundType={fundData.fundType}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Fund Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <div className="mb-1 text-muted-foreground">Fund Token</div>
                <div className="font-medium">{fundData.tokenName}</div>
              </div>
              <div>
                <div className="mb-1 text-muted-foreground">Token Contract Address</div>
                <div className="flex items-center gap-2">
                  <code className="break-all text-sm">{fundData.tokenAddress}</code>
                  {fundData.tokenAddress !== "–" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(fundData.tokenAddress)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <div className="mb-1 text-muted-foreground">
                  {isOpenEnd ? "Current NAV" : "Initial NAV"}
                </div>
                <div className="font-medium">
                  {isOpenEnd ? fundData.currentNav : fundData.initialNav}
                </div>
              </div>
              <div>
                <div className="mb-1 text-muted-foreground">Fund Manager</div>
                <div className="font-medium">{fundData.fundManager}</div>
              </div>
              <div>
                <div className="mb-1 text-muted-foreground">Target Fund Size</div>
                <div className="font-medium">{fundData.targetFundSize}</div>
              </div>
              <div>
                <div className="mb-1 text-muted-foreground">Management Fee</div>
                <div className="font-medium">{fundData.managementFee}</div>
              </div>
              <div>
                <div className="mb-1 text-muted-foreground">Performance Fee</div>
                <div className="font-medium">{fundData.performanceFee}</div>
              </div>
              <div>
                <div className="mb-1 text-muted-foreground">Tradable</div>
                <div className="font-medium">{fundData.tradable}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Operational Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <div className="mb-1 text-muted-foreground">Subscription Window</div>
                <div className="font-medium">
                  {fundData.subscriptionStartDate || "TBD"} to{" "}
                  {fundData.subscriptionEndDate || "TBD"}
                </div>
              </div>
              <div>
                <div className="mb-1 text-muted-foreground">Issue Date</div>
                <div className="font-medium">{fundData.issueDate || "N/A"}</div>
              </div>
              {isOpenEnd ? (
                <>
                  <div>
                    <div className="mb-1 text-muted-foreground">Next Cut-off</div>
                    <div className="font-medium">{fundData.nextCutoffTime || "N/A"}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-muted-foreground">Next Confirmation</div>
                    <div className="font-medium">
                      {fundData.nextConfirmationDate || "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-muted-foreground">Next Settlement</div>
                    <div className="font-medium">{fundData.nextSettlementTime || "N/A"}</div>
                  </div>
                </>
              ) : (
                <div>
                  <div className="mb-1 text-muted-foreground">Maturity Date</div>
                  <div className="font-medium">{fundData.maturityDate || "N/A"}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {isOpenEnd ? (
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="information">Information</TabsTrigger>
                <TabsTrigger value="dealing">Dealing</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="nav-history">NAV History</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                  <MetricCard
                    icon={LineChart}
                    label="Current NAV"
                    value={fundData.currentNavValue.toFixed(4)}
                    suffix={fundData.navCurrency}
                    variant="primary"
                  />
                  <MetricCard
                    icon={RefreshCcw}
                    label="Pending Subscription Orders"
                    value={pendingSubscriptionOrders}
                    variant="success"
                  />
                  <MetricCard
                    icon={ArrowRightLeft}
                    label="Pending Redemption Orders"
                    value={pendingRedemptionOrders}
                    variant="warning"
                  />
                  <MetricCard
                    icon={Clock3}
                    label="Next Settlement"
                    value={fundData.nextSettlementTime?.split(" ")[0] || "T+1"}
                    variant="default"
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Operational Snapshot</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 text-sm md:grid-cols-2">
                    <div className="rounded-lg border p-4">
                      <div className="text-muted-foreground">Order confirmation</div>
                      <div className="mt-1 font-medium">
                        {fundData.orderConfirmationMethod || "Auto at cut-off"}
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-muted-foreground">Available holdings</div>
                      <div className="mt-1 font-medium">
                        {fundData.availableHoldingLabel || "0 units"}
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-muted-foreground">Subscribed amount</div>
                      <div className="mt-1 font-medium">
                        {fundData.totalSubscribedAmount || "0"}
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-muted-foreground">Redeemed amount</div>
                      <div className="mt-1 font-medium">
                        {fundData.totalRedeemedAmount || "0"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="information" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Fund Strategy & Setup</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="mb-1 text-sm text-muted-foreground">
                        Investment Strategy
                      </div>
                      <p className="text-sm leading-6">{fundData.investmentStrategy}</p>
                    </div>
                    <div className="grid gap-4 text-sm md:grid-cols-2">
                      <div className="rounded-lg border p-4">
                        <div className="text-muted-foreground">Target fund size</div>
                        <div className="mt-1 font-medium">{fundData.targetFundSize}</div>
                      </div>
                      <div className="rounded-lg border p-4">
                        <div className="text-muted-foreground">Lock-up period</div>
                        <div className="mt-1 font-medium">{fundData.lockupPeriod}</div>
                      </div>
                      <div className="rounded-lg border p-4">
                        <div className="text-muted-foreground">Subscription amount range</div>
                        <div className="mt-1 font-medium">
                          {fundData.minSubscriptionAmount} to {fundData.maxSubscriptionAmount}
                        </div>
                      </div>
                      <div className="rounded-lg border p-4">
                        <div className="text-muted-foreground">Redemption gate</div>
                        <div className="mt-1 font-medium">
                          {fundData.maxRedemptionPerInvestor || "N/A"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="dealing" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Dealing & Settlement Rules</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 text-sm md:grid-cols-2">
                    <div className="rounded-lg border p-4">
                      <div className="text-muted-foreground">Dealing frequency</div>
                      <div className="mt-1 font-medium">
                        {fundData.dealingFrequency || "Daily"}
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-muted-foreground">Cut-off time</div>
                      <div className="mt-1 font-medium">
                        {fundData.dealingCutoffTime || "N/A"}
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-muted-foreground">NAV valuation time</div>
                      <div className="mt-1 font-medium">
                        {fundData.navValuationTime || "N/A"}
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-muted-foreground">Settlement cycle</div>
                      <div className="mt-1 font-medium">
                        {fundData.settlementCycle || "T+1"}
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-muted-foreground">Subscription status</div>
                      <div className="mt-1 font-medium">
                        {fundData.subscriptionStatus || "Open"}
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-muted-foreground">Redemption status</div>
                      <div className="mt-1 font-medium">
                        {fundData.redemptionStatus || "Open"}
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-muted-foreground">Notice period</div>
                      <div className="mt-1 font-medium">
                        {fundData.noticePeriodDays || 0} day(s)
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-muted-foreground">
                        Fund-level redemption gate
                      </div>
                      <div className="mt-1 font-medium">
                        {fundData.fundLevelRedemptionGate || "N/A"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="orders" className="space-y-6">
                <Tabs defaultValue="subscription" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="subscription">Subscription Orders</TabsTrigger>
                    <TabsTrigger value="redemption">Redemption Orders</TabsTrigger>
                  </TabsList>
                  <TabsContent value="subscription">
                    {renderOrderTable(
                      subscriptionOrders,
                      isMarketplaceView,
                      handleOrderAdvance,
                      manageOrderPermission.allowed,
                      manageOrderPermission.reason,
                    )}
                  </TabsContent>
                  <TabsContent value="redemption">
                    {renderOrderTable(
                      redemptionOrders,
                      isMarketplaceView,
                      handleOrderAdvance,
                      manageOrderPermission.allowed,
                      manageOrderPermission.reason,
                    )}
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="nav-history">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NAV Date</TableHead>
                      <TableHead>NAV</TableHead>
                      <TableHead>Updated At</TableHead>
                      <TableHead>Note</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fundData.navHistory.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.navDate}</TableCell>
                        <TableCell>
                          {record.navValue.toFixed(4)} {record.currency}
                        </TableCell>
                        <TableCell>{record.updatedAt}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {record.note || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          ) : (
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="information">Information</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <MetricCard
                    icon={ShieldCheck}
                    label="Initial NAV"
                    value={fundData.initialNavValue.toFixed(2)}
                    suffix={fundData.navCurrency}
                    variant="primary"
                  />
                  <MetricCard
                    icon={Wallet}
                    label="Target Size"
                    value={formatNumber(fundData.targetFundSizeValue)}
                    suffix={fundData.assetCurrency}
                    variant="default"
                  />
                  <MetricCard
                    icon={RefreshCcw}
                    label="Subscription Orders"
                    value={subscriptionOrders.length}
                    variant="success"
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Closed-end Issuance Snapshot</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 text-sm md:grid-cols-2">
                    <div className="rounded-lg border p-4">
                      <div className="text-muted-foreground">Current stage</div>
                      <div className="mt-1 font-medium">{fundData.status}</div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-muted-foreground">Allocation status</div>
                      <div className="mt-1 font-medium">
                        {fundData.allocationStatus || "N/A"}
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-muted-foreground">Subscription amount range</div>
                      <div className="mt-1 font-medium">
                        {fundData.minSubscriptionAmount} to {fundData.maxSubscriptionAmount}
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-muted-foreground">Lock-up period</div>
                      <div className="mt-1 font-medium">{fundData.lockupPeriod}</div>
                    </div>
                  </CardContent>
                </Card>

                {isMarketplaceView && canClosedEndSubscribe && (
                  <InfoAlert variant="info" title="Closed-end Subscription Window">
                    This fund is still in its closed-end subscription stage. Investors can
                    place subscription requests during the current issuance window, and the
                    issuer will continue with allocation afterward.
                  </InfoAlert>
                )}
              </TabsContent>

              <TabsContent value="information">
                <Card>
                  <CardHeader>
                    <CardTitle>Fund Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div>
                      <div className="mb-1 text-muted-foreground">Investment Strategy</div>
                      <p className="leading-6">{fundData.investmentStrategy}</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-lg border p-4">
                        <div className="text-muted-foreground">Fund manager</div>
                        <div className="mt-1 font-medium">{fundData.fundManager}</div>
                      </div>
                      <div className="rounded-lg border p-4">
                        <div className="text-muted-foreground">Redemption frequency</div>
                        <div className="mt-1 font-medium">
                          {fundData.redemptionFrequency}
                        </div>
                      </div>
                      <div className="rounded-lg border p-4">
                        <div className="text-muted-foreground">Management fee</div>
                        <div className="mt-1 font-medium">{fundData.managementFee}</div>
                      </div>
                      <div className="rounded-lg border p-4">
                        <div className="text-muted-foreground">Performance fee</div>
                        <div className="mt-1 font-medium">{fundData.performanceFee}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="timeline">
                <Card>
                  <CardHeader>
                    <CardTitle>Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Created time</span>
                      <span className="font-medium">{fundData.createdTime || "N/A"}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Subscription window</span>
                      <span className="font-medium text-right">
                        {fundData.subscriptionStartDate || "TBD"} to{" "}
                        {fundData.subscriptionEndDate || "TBD"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Issue date</span>
                      <span className="font-medium">{fundData.issueDate || "N/A"}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Maturity date</span>
                      <span className="font-medium">
                        {fundData.maturityDate || "N/A"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="orders">
                {renderOrderTable(
                  subscriptionOrders,
                  isMarketplaceView,
                  handleOrderAdvance,
                  manageOrderPermission.allowed,
                  manageOrderPermission.reason,
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {(canOpenEndSubscribe || canClosedEndSubscribe) && (
        <SubscribeModal
          open={showSubscribeModal}
          onOpenChange={setShowSubscribeModal}
          fundData={fundData}
          onSuccess={handleSubscribeSuccess}
        />
      )}

      {canOpenEndRedeem && (
        <RedeemModal
          open={showRedeemModal}
          onOpenChange={setShowRedeemModal}
          fundData={fundData}
          onSuccess={handleRedeemSuccess}
        />
      )}

      {pendingIssuerAction && (
        <OperationActionModal
          open={issuerActionModalOpen}
          onOpenChange={(open) => {
            setIssuerActionModalOpen(open);
            if (!open) {
              setPendingIssuerAction(null);
            }
          }}
          onSuccess={() =>
            transitionFundStatus(
              pendingIssuerAction.nextStatus,
              pendingIssuerAction.message,
            )
          }
          title={pendingIssuerAction.modalTitle}
          description={pendingIssuerAction.modalDescription}
          steps={pendingIssuerAction.modalSteps}
          startLabel="Start"
          completionLabel="Done"
          summary={[
            { label: "Fund", value: fundData.name },
            { label: "Fund Type", value: fundData.fundType },
            { label: "Current Status", value: fundData.status },
            { label: "Actor Role", value: userRole },
            {
              label: isOpenEnd ? "Current NAV" : "Issue Price",
              value: isOpenEnd ? fundData.currentNav : fundData.initialNav,
            },
          ]}
        />
      )}
    </div>
  );
}
