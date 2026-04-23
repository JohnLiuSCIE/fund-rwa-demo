import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Check, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { FundIssuance } from "../../data/fundDemoData";
import { LoadingStagePanel } from "./LoadingStagePanel";

interface AcceptAllocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allocation: any;
  onSuccess?: () => void;
}

interface SubscribeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fundData: FundIssuance;
  onSuccess?: (payload: {
    amount: number;
    estimatedUnits: number;
    paymentReference?: string;
  }) => void;
}

interface RedeemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fundData: FundIssuance;
  onSuccess?: (payload: {
    quantity: number;
    estimatedCash: number;
  }) => void;
}

function ProgressSteps({
  currentStep,
  steps,
}: {
  currentStep: number;
  steps: string[];
}) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => {
        const isActiveLoadingStep =
          index === currentStep && currentStep > 0 && currentStep < steps.length - 1;

        return (
          <div key={index} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  index < currentStep
                    ? "bg-primary border-primary text-primary-foreground"
                    : index === currentStep
                      ? "border-primary text-primary"
                      : "border-gray-300 text-gray-400"
                }`}
              >
                {index < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : isActiveLoadingStep ? (
                  <LoaderCircle className="w-5 h-5 animate-spin" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <div className="text-xs mt-2 text-center max-w-20">{step}</div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-2 transition-colors ${
                  index < currentStep ? "bg-primary" : "bg-gray-300"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function formatNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value);
}

export function AcceptAllocationModal({
  open,
  onOpenChange,
  allocation,
  onSuccess,
}: AcceptAllocationModalProps) {
  const [step, setStep] = useState(0);
  const steps = ["Start", "Personal Sign", "Transaction Sign", "Completed"];

  const handleStart = () => {
    setStep(1);
    setTimeout(() => setStep(2), 1200);
    setTimeout(() => setStep(3), 2400);
  };

  const handleComplete = () => {
    toast.success("Accept allocation has been executed");
    onSuccess?.();
    onOpenChange(false);
    setStep(0);
  };

  if (!allocation) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) setStep(0);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Accept Allocation</DialogTitle>
        </DialogHeader>

        <ProgressSteps currentStep={step} steps={steps} />

        {step === 0 && (
          <div className="space-y-4">
            <div className="bg-secondary p-4 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deal ID:</span>
                <span className="font-medium font-mono">{allocation.dealId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity:</span>
                <span className="font-medium">{allocation.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Allocate Time:</span>
                <span className="font-medium">{allocation.allocateTime}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              You need to sign transactions to accept the allocated fund shares.
            </p>
            <div className="flex justify-end">
              <Button onClick={handleStart}>Start</Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <LoadingStagePanel
            title="Personal Sign"
            description="Please personal sign to proceed"
            items={[
              "Wallet signature request is ready",
              "Validating allocation acceptance",
              "Preparing settlement transfer",
            ]}
            tone="slate"
          />
        )}

        {step === 2 && (
          <LoadingStagePanel
            title="Sign Transaction"
            description="Please verify the smart contract call"
            items={[
              "Preparing smart contract payload",
              "Awaiting wallet confirmation",
              "Broadcasting allocation acceptance",
            ]}
            tone="cyan"
          />
        )}

        {step === 3 && (
          <div className="space-y-4 text-center py-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3>Accept allocation has been executed</h3>
            <p className="text-sm text-muted-foreground">
              Fund shares have been transferred to your wallet.
            </p>
            <div className="flex justify-center">
              <Button onClick={handleComplete}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function SubscribeModal({
  open,
  onOpenChange,
  fundData,
  onSuccess,
}: SubscribeModalProps) {
  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const isOpenEnd = fundData.fundType === "Open-end";
  const isBankTransferFunding =
    fundData.subscriptionPaymentRail === "Off-chain Bank Transfer" ||
    fundData.subscriptionPaymentMethod === "Fiat";
  const paymentCurrency = fundData.subscriptionCashCurrency || fundData.navCurrency;
  const steps = isBankTransferFunding
    ? ["Order", "Payment", "Cash Review", "Completed"]
    : ["Order", "Sign", "Broadcast", "Completed"];

  const amountValue = Number(amount) || 0;
  const estimatedUnits = useMemo(() => {
    if (!amountValue || !fundData.currentNavValue) return 0;
    return amountValue / fundData.currentNavValue;
  }, [amountValue, fundData.currentNavValue]);

  const reset = () => {
    setStep(0);
    setAmount("");
    setPaymentReference("");
  };

  const buildPaymentReference = () => {
    const prefix = (fundData.tokenSymbol || fundData.name || "FUND")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6) || "FUND";
    return `${prefix}-${Date.now().toString().slice(-8)}`;
  };

  const handleSubmit = () => {
    if (amountValue < fundData.minSubscriptionAmountValue) {
      toast.error(
        `Minimum subscription amount is ${fundData.minSubscriptionAmount}`,
      );
      return;
    }
    if (amountValue > fundData.maxSubscriptionAmountValue) {
      toast.error(
        `Maximum subscription amount is ${fundData.maxSubscriptionAmount}`,
      );
      return;
    }

    if (isBankTransferFunding) {
      setPaymentReference(buildPaymentReference());
      setStep(1);
      return;
    }

    setStep(1);
    setTimeout(() => setStep(2), 1200);
    setTimeout(() => setStep(3), 2400);
  };

  const handlePaymentInstructionComplete = () => {
    setStep(2);
    setTimeout(() => setStep(3), 1600);
  };

  const handleComplete = () => {
    toast.success("Subscription order submitted");
    onSuccess?.({
      amount: amountValue,
      estimatedUnits,
      paymentReference: paymentReference || undefined,
    });
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) reset();
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isOpenEnd ? "Subscribe to Open-end Fund" : "Subscribe to Closed-end Fund"}
          </DialogTitle>
        </DialogHeader>

        <ProgressSteps currentStep={step} steps={steps} />

        {step === 0 && (
          <div className="space-y-6">
            <div className="bg-secondary p-4 rounded-lg space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fund Name:</span>
                <span className="font-medium">{fundData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Latest NAV:</span>
                <span className="font-medium">{fundData.currentNav}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {isOpenEnd ? "Next dealing cut-off:" : "Subscription window closes:"}
                </span>
                <span className="font-medium">
                  {isOpenEnd
                    ? fundData.nextCutoffTime || "TBD"
                    : fundData.subscriptionEndDate || "TBD"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {isOpenEnd ? "Expected confirmation:" : "Expected allocation review:"}
                </span>
                <span className="font-medium">
                  {isOpenEnd
                    ? fundData.nextConfirmationDate || "T+1"
                    : fundData.issueDate || "Post subscription close"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {isOpenEnd ? "Settlement cycle:" : "Issue date:"}
                </span>
                <span className="font-medium">
                  {isOpenEnd ? fundData.settlementCycle || "T+1" : fundData.issueDate || "TBD"}
                </span>
              </div>
            </div>

            <div className="space-y-4 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label>
                  Subscription amount <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={fundData.minSubscriptionAmountValue}
                    max={fundData.maxSubscriptionAmountValue}
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder={`Enter amount in ${paymentCurrency}`}
                  />
                  <div className="px-3 py-2 bg-secondary rounded-md text-sm flex items-center">
                    {paymentCurrency}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Range: {fundData.minSubscriptionAmount} to {fundData.maxSubscriptionAmount}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Estimated shares</Label>
                <Input
                  value={`${formatNumber(estimatedUnits, 4)} units`}
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  {isOpenEnd
                    ? "Final shares will be confirmed using the official dealing NAV at cut-off."
                    : "Final allocated shares will be confirmed after the issuer completes allocation review."}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-dashed p-4 text-sm">
              <div className="font-medium">Subscription funding route</div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <div className="text-muted-foreground">Payment method</div>
                  <div className="font-medium">
                    {fundData.subscriptionPaymentMethod || "Stablecoin"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Payment rail</div>
                  <div className="font-medium">
                    {fundData.subscriptionPaymentRail || "On-chain Wallet Transfer"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Cash confirmation owner</div>
                  <div className="font-medium">
                    {fundData.cashConfirmationOwner || "Operations"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Payment proof</div>
                  <div className="font-medium">
                    {fundData.paymentProofRequired ? "Required" : "Optional"}
                  </div>
                </div>
              </div>
              {fundData.paymentReferenceRule && (
                <p className="mt-3 text-muted-foreground">
                  Reference rule: {fundData.paymentReferenceRule}
                </p>
              )}
            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
              {isBankTransferFunding
                ? `This order will be submitted first, then the issuer-side cash leg must be confirmed before the transfer agent can book units into the holder register.`
                : isOpenEnd
                  ? `This order will be queued for the next dealing batch. Confirmation happens after NAV valuation, and settlement follows on ${fundData.settlementCycle || "T+1"}.`
                  : "This subscription request will enter the closed-end issuance queue. The issuer will review subscriptions, run allocation, and then complete issuance."}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>Submit Order</Button>
            </div>
          </div>
        )}

        {step === 1 && (
          isBankTransferFunding ? (
            <div className="space-y-6">
              <div className="rounded-lg border bg-secondary p-4 text-sm">
                <div className="mb-3 font-medium">Payment Instructions</div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <div className="text-muted-foreground">Receiving bank</div>
                    <div className="font-medium">{fundData.receivingBankName || "Issuer bank account"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Account name</div>
                    <div className="font-medium">
                      {fundData.receivingBankAccountName || "Issuer subscription collection account"}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Account number</div>
                    <div className="font-medium">
                      {fundData.receivingBankAccountNumberMasked || "To be provided by issuer"}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">SWIFT / bank code</div>
                    <div className="font-medium">
                      {fundData.receivingBankSwiftCode || "To be provided by issuer"}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Amount to remit</div>
                    <div className="font-medium">
                      {formatNumber(amountValue, 2)} {paymentCurrency}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Payment reference</div>
                    <div className="font-medium">{paymentReference}</div>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                {fundData.paymentProofRequired
                  ? "Upload or provide remittance proof to the issuer after the transfer. Cash confirmation will not complete until the issuer-side review is done."
                  : "After the transfer is sent, the issuer-side cash review will confirm receipt before the transfer agent books units."}
              </div>
              <div className="flex justify-end">
                <Button onClick={handlePaymentInstructionComplete}>I Have Sent Payment</Button>
              </div>
            </div>
          ) : (
            <LoadingStagePanel
              title="Sign Subscription Order"
              description="Please approve the subscription request in your wallet."
              items={[
                "Wallet approval request is ready",
                "Validating subscription order details",
                "Preparing submission for booking",
              ]}
              tone="slate"
            />
          )
        )}

        {step === 2 && (
          <LoadingStagePanel
            title={isBankTransferFunding ? "Cash Review In Progress" : "Broadcasting Order"}
            description={
              isBankTransferFunding
                ? `${fundData.cashConfirmationOwner || "Issuer"} is reviewing the incoming cash leg. The transfer agent will book units only after funds are confirmed.`
                : isOpenEnd
                  ? "Your order is being recorded for the next open-end dealing batch."
                  : "Your order is being recorded for the current closed-end subscription round."
            }
            items={
              isBankTransferFunding
                ? [
                    "Matching remittance and payment reference",
                    "Reviewing settlement evidence",
                    "Releasing transfer-agent unit booking",
                  ]
                : [
                    "Preparing order broadcast payload",
                    "Submitting subscription instruction",
                    "Updating dealing queue status",
                  ]
            }
            tone={isBankTransferFunding ? "teal" : "cyan"}
          />
        )}

        {step === 3 && (
          <div className="space-y-4 text-center py-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3>Order submitted</h3>
            <p className="text-sm text-muted-foreground">
              {isBankTransferFunding
                ? `Your subscription is now waiting for ${fundData.cashConfirmationOwner || "issuer"} cash confirmation and transfer-agent unit booking.`
                : isOpenEnd
                  ? "Your subscription request is pending NAV confirmation and will be processed at the next dealing cut-off."
                  : "Your subscription request has entered the closed-end issuance workflow and is waiting for issuer review and allocation."}
            </p>
            <div className="bg-secondary p-3 rounded-lg text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-muted-foreground">Requested amount:</span>
                <span className="font-medium">
                  {formatNumber(amountValue, 2)} {paymentCurrency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated shares:</span>
                <span className="font-medium">{formatNumber(estimatedUnits, 4)} units</span>
              </div>
              {paymentReference && (
                <div className="mt-2 flex justify-between">
                  <span className="text-muted-foreground">Payment reference:</span>
                  <span className="font-medium">{paymentReference}</span>
                </div>
              )}
            </div>
            <div className="flex justify-center">
              <Button onClick={handleComplete}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function RedeemModal({
  open,
  onOpenChange,
  fundData,
  onSuccess,
}: RedeemModalProps) {
  const [step, setStep] = useState(0);
  const [quantity, setQuantity] = useState("");
  const steps = ["Order", "Sign", "Broadcast", "Completed"];

  const quantityValue = Number(quantity) || 0;
  const estimatedCash = useMemo(() => {
    if (!quantityValue || !fundData.currentNavValue) return 0;
    return quantityValue * fundData.currentNavValue;
  }, [quantityValue, fundData.currentNavValue]);

  const reset = () => {
    setStep(0);
    setQuantity("");
  };

  const maxRedeemable = fundData.availableHoldingUnits || 0;

  const handleSubmit = () => {
    if (quantityValue <= 0) {
      toast.error("Please enter a redemption quantity");
      return;
    }
    if (quantityValue > maxRedeemable) {
      toast.error(`Available holdings are ${fundData.availableHoldingLabel || "0 units"}`);
      return;
    }

    setStep(1);
    setTimeout(() => setStep(2), 1200);
    setTimeout(() => setStep(3), 2400);
  };

  const handleComplete = () => {
    toast.success("Redemption order submitted");
    onSuccess?.({ quantity: quantityValue, estimatedCash });
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) reset();
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Redeem Fund Shares</DialogTitle>
        </DialogHeader>

        <ProgressSteps currentStep={step} steps={steps} />

        {step === 0 && (
          <div className="space-y-6">
            <div className="bg-secondary p-4 rounded-lg space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fund Name:</span>
                <span className="font-medium">{fundData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Available holdings:</span>
                <span className="font-medium">{fundData.availableHoldingLabel || "0 units"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Latest NAV reference:</span>
                <span className="font-medium">{fundData.currentNav}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expected payment date:</span>
                <span className="font-medium">{fundData.nextSettlementTime || "T+1"}</span>
              </div>
            </div>

            <div className="space-y-4 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label>
                  Redeem quantity <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={maxRedeemable}
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  placeholder="Enter units to redeem"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum redeemable today: {fundData.maxRedemptionPerInvestor || fundData.availableHoldingLabel || "N/A"}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Estimated cash amount</Label>
                <div className="flex gap-2">
                  <Input
                    value={formatNumber(estimatedCash, 2)}
                    disabled
                    className="flex-1"
                  />
                  <div className="px-3 py-2 bg-secondary rounded-md text-sm flex items-center">
                    {fundData.navCurrency}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Final cash amount is subject to confirmed NAV at the dealing cut-off.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
              Redemption orders are reviewed against lock-up and gate rules before they enter cash settlement.
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>Submit Redemption</Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <LoadingStagePanel
            title="Sign Redemption Order"
            description="Please approve the redemption request in your wallet."
            items={[
              "Wallet approval request is ready",
              "Checking dealing-window eligibility",
              "Preparing redemption submission",
            ]}
            tone="slate"
          />
        )}

        {step === 2 && (
          <LoadingStagePanel
            title="Broadcasting Redemption"
            description="Your request has entered the next dealing batch and is waiting for review / NAV confirmation."
            items={[
              "Submitting redemption instruction",
              "Recording dealing batch entry",
              "Syncing cash settlement workflow",
            ]}
            tone="cyan"
          />
        )}

        {step === 3 && (
          <div className="space-y-4 text-center py-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3>Redemption order submitted</h3>
            <p className="text-sm text-muted-foreground">
              Your request is pending confirmation and expected cash settlement on {fundData.nextSettlementTime || "T+1"}.
            </p>
            <div className="bg-secondary p-3 rounded-lg text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-muted-foreground">Requested quantity:</span>
                <span className="font-medium">{formatNumber(quantityValue, 2)} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated cash:</span>
                <span className="font-medium">
                  {formatNumber(estimatedCash, 2)} {fundData.navCurrency}
                </span>
              </div>
            </div>
            <div className="flex justify-center">
              <Button onClick={handleComplete}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
