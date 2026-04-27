import { OperationActionModal } from "./OperationActionModal";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  eventLabel?: string;
}

export function SubmitDistributionApprovalModal({
  open,
  onOpenChange,
  onSuccess,
  eventLabel = "Distribution",
}: ModalProps) {
  const eventLabelLower = eventLabel.toLowerCase();
  return (
    <OperationActionModal
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      title={`Submit ${eventLabel} For Approval`}
      description={`Review the linked fund ${eventLabelLower} request and complete identity verification before submission.`}
      startLabel="Submit"
      completionLabel="Done"
      steps={[
        {
          label: "Review",
          title: "Review Submission",
          description:
            `Check the ${eventLabelLower} settings and confirm the request is ready for approval review.`,
          state: "review",
        },
        {
          label: "Identity",
          title: "Verify Identity",
          description:
            `Issuer identity and wallet authority are being verified before ${eventLabelLower} submission.`,
          state: "loading",
        },
        {
          label: "Submit",
          title: "Submit Request",
          description:
            `The approval request is being recorded in the ${eventLabelLower} workflow.`,
          state: "loading",
        },
        {
          label: "Completed",
          title: `${eventLabel} Submitted`,
          description: `The ${eventLabelLower} has been submitted for approval.`,
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
  eventLabel = "Distribution",
}: ModalProps) {
  const eventLabelLower = eventLabel.toLowerCase();
  return (
    <OperationActionModal
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      title={`Listing ${eventLabel}`}
      description={`Verify issuer identity, sign the wallet actions, and list the ${eventLabelLower}.`}
      startLabel="Start"
      completionLabel="Goto Inbox"
      steps={[
        {
          label: "Review",
          title: "Review Listing Request",
          description:
            `Confirm the ${eventLabelLower} is approved and ready to be listed on the platform.`,
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
          description: `Please personal sign to proceed with ${eventLabelLower} listing.`,
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
          title: `Listing ${eventLabelLower} has been executed`,
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
  eventLabel = "Distribution",
}: ModalProps) {
  const eventLabelLower = eventLabel.toLowerCase();
  return (
    <OperationActionModal
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      title="Record of Ownership"
      description={`Verify identity before confirming the ownership snapshot for ${eventLabelLower}.`}
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
            `${eventLabel} recipient list will be generated based on the verified ownership snapshot.`,
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
  eventLabel = "Distribution",
}: ModalProps) {
  const eventLabelLower = eventLabel.toLowerCase();
  return (
    <OperationActionModal
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      title="Allocation Completed"
      description={`Verify identity before marking the ${eventLabelLower} allocation as complete.`}
      startLabel="Start"
      completionLabel="Close"
      steps={[
        {
          label: "Review",
          title: "Review Allocation",
          description:
            `Confirm the ${eventLabelLower} allocation result before moving to on-chain completion.`,
          state: "review",
        },
        {
          label: "Identity",
          title: "Verify Identity",
          description:
            `Issuer identity and ${eventLabelLower} authority are being verified.`,
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
          description: `The ${eventLabelLower} is ready to move to the next step.`,
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
  eventLabel = "Distribution",
}: ModalProps) {
  const eventLabelLower = eventLabel.toLowerCase();
  return (
    <OperationActionModal
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      title="Open For Distribution"
      description={`Verify issuer identity and complete the wallet actions required to open the ${eventLabelLower} window.`}
      startLabel="Start"
      completionLabel="Close"
      steps={[
        {
          label: "Review",
          title: "Review Window Opening",
          description:
            `Check the ${eventLabelLower} funding and opening conditions before enabling investor claims.`,
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
          description: `Approve token transfer for the ${eventLabelLower}.`,
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
          title: `${eventLabel} opened`,
          description: "Investors can now accept their distributions.",
          state: "success",
        },
      ]}
    />
  );
}
