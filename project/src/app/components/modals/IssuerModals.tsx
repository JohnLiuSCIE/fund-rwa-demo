import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface ListingModalProps extends ModalProps {
  fundData: any;
}

// Progress indicator component
function ProgressSteps({ currentStep, steps }: { currentStep: number; steps: string[] }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => (
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
      ))}
    </div>
  );
}

export function SubmitForApprovalModal({ open, onOpenChange, onSuccess }: ModalProps) {
  const handleConfirm = () => {
    toast.success("Submit fund issuance successfully", {
      description: "You can click to view fund deal page.",
    });
    onSuccess?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit For Approval</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <p className="text-muted-foreground">
            Confirmation — Are you sure you want to submit this deal for approval?
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>Confirm</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ListingModal({ open, onOpenChange, onSuccess, fundData }: ListingModalProps) {
  const [step, setStep] = useState(0);
  const steps = ["Start", "Sign", "Completed"];

  const handleStart = () => {
    setStep(1);
    // Simulate signing
    setTimeout(() => {
      setStep(2);
    }, 2000);
  };

  const handleComplete = () => {
    onSuccess?.();
    onOpenChange(false);
    setStep(0);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { onOpenChange(open); if (!open) setStep(0); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Listing</DialogTitle>
        </DialogHeader>

        <ProgressSteps currentStep={step} steps={steps} />

        {step === 0 && (
          <div className="space-y-4">
            <div className="bg-secondary p-4 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fund name:</span>
                <span className="font-medium">{fundData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Target fund size:</span>
                <span className="font-medium">{fundData.targetFundSize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Issue date:</span>
                <span className="font-medium">{fundData.issueDate}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              You need to sign transaction for listing via your wallet.
            </p>
            <div className="flex justify-end">
              <Button onClick={handleStart}>Start</Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 text-center py-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <h3>Personal Sign</h3>
            <p className="text-sm text-muted-foreground">
              Please personal sign to proceed
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 text-center py-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3>Listing deal has been executed</h3>
            <p className="text-sm text-muted-foreground">
              You can go to Inbox page to view your request.
            </p>
            <div className="flex justify-center">
              <Button onClick={handleComplete}>Goto Inbox</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function OpenForSubscriptionModal({ open, onOpenChange, onSuccess }: ModalProps) {
  const [step, setStep] = useState(0);
  const steps = ["Start", "Sign", "Completed"];

  const handleStart = () => {
    setStep(1);
    setTimeout(() => setStep(2), 2000);
  };

  const handleComplete = () => {
    onSuccess?.();
    onOpenChange(false);
    setStep(0);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { onOpenChange(open); if (!open) setStep(0); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Open For Subscription</DialogTitle>
        </DialogHeader>

        <ProgressSteps currentStep={step} steps={steps} />

        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You need to sign transaction for open for subscription via your wallet.
            </p>
            <div className="flex justify-end">
              <Button onClick={handleStart}>Sign</Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 text-center py-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <h3>Personal Sign</h3>
            <p className="text-sm text-muted-foreground">
              Please personal sign to proceed
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 text-center py-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3>Open for subscription has been executed</h3>
            <p className="text-sm text-muted-foreground">
              You can go to Inbox page to view your request.
            </p>
            <div className="flex justify-center">
              <Button onClick={handleComplete}>Goto Inbox</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function PendingAllocationModal({ open, onOpenChange, onSuccess }: ModalProps) {
  const [step, setStep] = useState(0);
  const steps = ["Start", "Sign", "Completed"];

  const handleStart = () => {
    setStep(1);
    setTimeout(() => setStep(2), 2000);
  };

  const handleComplete = () => {
    onSuccess?.();
    onOpenChange(false);
    setStep(0);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { onOpenChange(open); if (!open) setStep(0); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pending Allocation</DialogTitle>
        </DialogHeader>

        <ProgressSteps currentStep={step} steps={steps} />

        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You are going to proceed to pending allocation.
            </p>
            <div className="flex justify-end">
              <Button onClick={handleStart}>Start</Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 text-center py-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <h3>Personal Sign</h3>
            <p className="text-sm text-muted-foreground">
              Please personal sign to proceed
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 text-center py-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3>Pending allocation has been executed</h3>
            <p className="text-sm text-muted-foreground">
              You can go to Inbox page to view your request.
            </p>
            <div className="flex justify-center">
              <Button onClick={handleComplete}>Goto Inbox</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function AllocateOnChainModal({ open, onOpenChange, onSuccess }: ModalProps) {
  const [step, setStep] = useState(0);
  const steps = ["Start", "Sign Approve", "Sign Transaction", "Completed"];

  const handleStart = () => {
    setStep(1);
    setTimeout(() => setStep(2), 2000);
    setTimeout(() => setStep(3), 4000);
  };

  const handleComplete = () => {
    onSuccess?.();
    onOpenChange(false);
    setStep(0);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { onOpenChange(open); if (!open) setStep(0); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Allocate On Chain</DialogTitle>
        </DialogHeader>

        <ProgressSteps currentStep={step} steps={steps} />

        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You need to sign transaction for on-chain allocation via your wallet.
            </p>
            <div className="flex justify-end">
              <Button onClick={handleStart}>Start</Button>
            </div>
          </div>
        )}

        {(step === 1 || step === 2) && (
          <div className="space-y-4 text-center py-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <h3>{step === 1 ? "Personal Sign" : "Sign Transaction"}</h3>
            <p className="text-sm text-muted-foreground">
              {step === 1
                ? "Please personal sign to proceed"
                : "Please verify the smart contract call"}
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-center py-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3>Allocation on chain has been executed</h3>
            <p className="text-sm text-muted-foreground">
              You can go to Inbox page to view your request.
            </p>
            <div className="flex justify-center">
              <Button onClick={handleComplete}>Goto Inbox</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function AllocationCompletedModal({ open, onOpenChange, onSuccess }: ModalProps) {
  const [step, setStep] = useState(0);
  const steps = ["Start", "Sign Approve", "Sign Transaction", "Completed"];

  const handleStart = () => {
    setStep(1);
    setTimeout(() => setStep(2), 2000);
    setTimeout(() => setStep(3), 4000);
  };

  const handleComplete = () => {
    onSuccess?.();
    onOpenChange(false);
    setStep(0);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { onOpenChange(open); if (!open) setStep(0); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Allocation Completed</DialogTitle>
        </DialogHeader>

        <ProgressSteps currentStep={step} steps={steps} />

        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You need to sign transaction to complete allocation via your wallet.
            </p>
            <div className="flex justify-end">
              <Button onClick={handleStart}>Start</Button>
            </div>
          </div>
        )}

        {(step === 1 || step === 2) && (
          <div className="space-y-4 text-center py-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <h3>{step === 1 ? "Personal Sign" : "Sign Transaction"}</h3>
            <p className="text-sm text-muted-foreground">
              {step === 1
                ? "Please personal sign to proceed"
                : "Please verify the smart contract call"}
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-center py-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3>Allocation completed has been executed</h3>
            <p className="text-sm text-muted-foreground">
              You can go to Inbox page to view your request.
            </p>
            <div className="flex justify-center">
              <Button onClick={handleComplete}>Goto Inbox</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function AcceptFundModal({ open, onOpenChange, onSuccess }: ModalProps) {
  const [step, setStep] = useState(0);
  const steps = ["Start", "Sign Approve", "Sign Transaction", "Completed"];

  const handleStart = () => {
    setStep(1);
    setTimeout(() => setStep(2), 2000);
    setTimeout(() => setStep(3), 4000);
  };

  const handleComplete = () => {
    onSuccess?.();
    onOpenChange(false);
    setStep(0);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { onOpenChange(open); if (!open) setStep(0); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Accept Fund</DialogTitle>
        </DialogHeader>

        <ProgressSteps currentStep={step} steps={steps} />

        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You need to sign transaction for accepting fund via your wallet.
            </p>
            <div className="flex justify-end">
              <Button onClick={handleStart}>Start</Button>
            </div>
          </div>
        )}

        {(step === 1 || step === 2) && (
          <div className="space-y-4 text-center py-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <h3>{step === 1 ? "Personal Sign" : "Sign Transaction"}</h3>
            <p className="text-sm text-muted-foreground">
              {step === 1
                ? "Please personal sign to proceed"
                : "Please verify the smart contract call"}
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-center py-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3>Accept fund has been executed</h3>
            <p className="text-sm text-muted-foreground">
              You can go to Inbox page to view your request.
            </p>
            <div className="flex justify-center">
              <Button onClick={handleComplete}>Goto Inbox</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
