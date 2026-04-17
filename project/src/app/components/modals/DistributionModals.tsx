import { OperationActionModal } from "./OperationActionModal";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SubmitDistributionApprovalModal({
  open,
  onOpenChange,
  onSuccess,
}: ModalProps) {
  return (
    <OperationActionModal
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      title="Submit Distribution For Approval"
      description="Review the linked fund distribution request and complete identity verification before submission."
      startLabel="Submit"
      completionLabel="Done"
      steps={[
        {
          label: "Review",
          title: "Review Submission",
          description:
            "Check the distribution settings and confirm the request is ready for approval review.",
          state: "review",
        },
        {
          label: "Identity",
          title: "Verify Identity",
          description:
            "Issuer identity and wallet authority are being verified before distribution submission.",
          state: "loading",
        },
        {
          label: "Submit",
          title: "Submit Request",
          description:
            "The approval request is being recorded in the distribution workflow.",
          state: "loading",
        },
        {
          label: "Completed",
          title: "Distribution Submitted",
          description: "The distribution has been submitted for approval.",
          state: "success",
        },
      ]}
    />
  );
}

export function ListingDistributionModal({
  open,
  onOpenChange,
  onSuccess,
}: ModalProps) {
  return (
    <OperationActionModal
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      title="Listing Distribution"
      description="Verify issuer identity, sign the wallet actions, and list the distribution."
      startLabel="Start"
      completionLabel="Goto Inbox"
      steps={[
        {
          label: "Review",
          title: "Review Listing Request",
          description:
            "Confirm the distribution is approved and ready to be listed on the platform.",
          state: "review",
        },
        {
          label: "Identity",
          title: "Verify Identity",
          description:
            "Issuer identity and permissions are being verified before listing begins.",
          state: "loading",
        },
        {
          label: "Sign",
          title: "Personal Sign",
          description: "Please personal sign to proceed with distribution listing.",
          state: "loading",
        },
        {
          label: "Transaction",
          title: "Sign Transaction",
          description: "Please verify the smart contract call for listing.",
          state: "loading",
        },
        {
          label: "Completed",
          title: "Listing distribution has been executed",
          description: "You can go to Inbox page to view your request.",
          state: "success",
        },
      ]}
    />
  );
}

export function PendingAllocationDistributionModal({
  open,
  onOpenChange,
  onSuccess,
}: ModalProps) {
  return (
    <OperationActionModal
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      title="Record of Ownership"
      description="Verify identity before confirming the ownership snapshot for distribution."
      startLabel="Start"
      completionLabel="Close"
      steps={[
        {
          label: "Review",
          title: "Review Snapshot",
          description:
            "Confirm the ownership record date and holder snapshot before locking the list.",
          state: "review",
        },
        {
          label: "Identity",
          title: "Verify Identity",
          description:
            "Issuer identity and record date authority are being verified.",
          state: "loading",
        },
        {
          label: "Sign",
          title: "Personal Sign",
          description: "Please personal sign to confirm the ownership snapshot.",
          state: "loading",
        },
        {
          label: "Completed",
          title: "Snapshot confirmed",
          description:
            "Distribution list will be generated based on the verified ownership snapshot.",
          state: "success",
        },
      ]}
    />
  );
}

export function AllocationCompletedDistributionModal({
  open,
  onOpenChange,
  onSuccess,
}: ModalProps) {
  return (
    <OperationActionModal
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      title="Allocation Completed"
      description="Verify identity before marking the distribution allocation as complete."
      startLabel="Start"
      completionLabel="Close"
      steps={[
        {
          label: "Review",
          title: "Review Allocation",
          description:
            "Confirm the distribution allocation result before moving to on-chain completion.",
          state: "review",
        },
        {
          label: "Identity",
          title: "Verify Identity",
          description:
            "Issuer identity and distribution authority are being verified.",
          state: "loading",
        },
        {
          label: "Sign",
          title: "Personal Sign",
          description: "Please personal sign to confirm allocation completion.",
          state: "loading",
        },
        {
          label: "Completed",
          title: "Allocation completed",
          description: "The distribution is ready to move to the next step.",
          state: "success",
        },
      ]}
    />
  );
}

export function OpenForDistributionModal({
  open,
  onOpenChange,
  onSuccess,
}: ModalProps) {
  return (
    <OperationActionModal
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      title="Open For Distribution"
      description="Verify issuer identity and complete the wallet actions required to open the distribution window."
      startLabel="Start"
      completionLabel="Close"
      steps={[
        {
          label: "Review",
          title: "Review Window Opening",
          description:
            "Check the distribution funding and opening conditions before enabling investor claims.",
          state: "review",
        },
        {
          label: "Identity",
          title: "Verify Identity",
          description:
            "Issuer identity and claim-window authority are being verified.",
          state: "loading",
        },
        {
          label: "Approve",
          title: "Sign Approve",
          description: "Approve token transfer for the distribution.",
          state: "loading",
        },
        {
          label: "Open",
          title: "Sign Open",
          description: "Open the distribution claim window for investors.",
          state: "loading",
        },
        {
          label: "Completed",
          title: "Distribution opened",
          description: "Investors can now accept their distributions.",
          state: "success",
        },
      ]}
    />
  );
}
