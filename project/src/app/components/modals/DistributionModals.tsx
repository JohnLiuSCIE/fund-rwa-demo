import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Check, AlertCircle } from "lucide-react";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
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

export function SubmitDistributionApprovalModal({ open, onOpenChange, onSuccess }: ModalProps) {
  const handleConfirm = () => {
    onSuccess?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit For Approval</DialogTitle>
          <DialogDescription>
            Confirm your distribution submission
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <p className="text-muted-foreground">
            Confirmation — Are you sure you want to submit this distribution for approval?
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

export function ListingDistributionModal({ open, onOpenChange, onSuccess }: ModalProps) {
  const [step, setStep] = useState(0);
  const steps = ["Start", "Sign", "Transaction", "Listing"];

  const handleStart = () => {
    setStep(1);
    setTimeout(() => setStep(2), 2000);
  };

  const handleSignComplete = () => {
    setTimeout(() => setStep(3), 2000);
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
          <DialogTitle>Listing Distribution</DialogTitle>
          <DialogDescription>
            Sign the transaction to list this distribution
          </DialogDescription>
        </DialogHeader>

        <ProgressSteps currentStep={step} steps={steps} />

        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You need to sign transaction for listing distribution via your wallet.
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
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <h3>Sign Transaction</h3>
            <p className="text-sm text-muted-foreground">
              Please verify the smart contract call
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-center py-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3>Listing distribution has been executed</h3>
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

export function PendingAllocationDistributionModal({ open, onOpenChange, onSuccess }: ModalProps) {
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
          <DialogTitle>Record of Ownership</DialogTitle>
          <DialogDescription>
            Confirm the ownership snapshot for distribution
          </DialogDescription>
        </DialogHeader>

        <ProgressSteps currentStep={step} steps={steps} />

        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You need to sign to confirm record-of-ownership snapshot via your wallet.
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
            <h3>Snapshot confirmed</h3>
            <p className="text-sm text-muted-foreground">
              Distribution list will be generated based on ownership snapshot.
            </p>
            <div className="flex justify-center">
              <Button onClick={handleComplete}>Close</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function AllocationCompletedDistributionModal({ open, onOpenChange, onSuccess }: ModalProps) {
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
          <DialogTitle>Allocation Completed</DialogTitle>
          <DialogDescription>
            Confirm the distribution allocation is complete
          </DialogDescription>
        </DialogHeader>

        <ProgressSteps currentStep={step} steps={steps} />

        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Confirm distribution allocation completion.
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
            <h3>Allocation completed</h3>
            <p className="text-sm text-muted-foreground">
              Ready to open for distribution.
            </p>
            <div className="flex justify-center">
              <Button onClick={handleComplete}>Close</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function OpenForDistributionModal({ open, onOpenChange, onSuccess }: ModalProps) {
  const [step, setStep] = useState(0);
  const steps = ["Start", "Sign Approve", "Sign Open", "Completed"];

  const handleStart = () => {
    setStep(1);
    setTimeout(() => setStep(2), 2000);
  };

  const handleApproveComplete = () => {
    setTimeout(() => setStep(3), 2000);
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
          <DialogTitle>Open For Distribution</DialogTitle>
          <DialogDescription>
            Open the distribution window for investors to claim
          </DialogDescription>
        </DialogHeader>

        <ProgressSteps currentStep={step} steps={steps} />

        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You need to sign transactions to open distribution for investors.
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
            <h3>Sign Approve</h3>
            <p className="text-sm text-muted-foreground">
              Approve token transfer for distribution
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 text-center py-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <h3>Sign Open</h3>
            <p className="text-sm text-muted-foreground">
              Open distribution claim window
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-center py-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3>Distribution opened</h3>
            <p className="text-sm text-muted-foreground">
              Investors can now accept their distributions.
            </p>
            <div className="flex justify-center">
              <Button onClick={handleComplete}>Close</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
