import type { AdmissionRemediationTask, RegisterAccount, WalletLink } from "../data/fundDemoData";

export type AdmissionApprovalActionLabel =
  | "Request Proof Refresh"
  | "Request KYC Proof"
  | "Review Restriction"
  | "Resolve Evidence";

export type AdmissionApprovalReadiness = {
  ready: boolean;
  reason?: string;
  actionLabel?: AdmissionApprovalActionLabel;
};

type ApprovalWallet = Pick<WalletLink, "proofStatus" | "whitelistStatus" | "proofRefId">;
type ApprovalAccount = Pick<RegisterAccount, "accountStatus">;
type ApprovalRemediationTask = Pick<AdmissionRemediationTask, "actionLabel" | "reason" | "status">;

const restrictedAccountStatuses: RegisterAccount["accountStatus"][] = ["Restricted", "Suspended", "Closed"];
const blockedWhitelistStatuses: WalletLink["whitelistStatus"][] = ["Removed", "Suspended"];

export function getAdmissionApprovalReadiness(
  wallet: ApprovalWallet,
  account?: ApprovalAccount,
  remediationTasks: ApprovalRemediationTask[] = [],
): AdmissionApprovalReadiness {
  const openRemediationTask = remediationTasks.find(
    (task) => task.status === "Open" || task.status === "InProgress",
  );
  if (openRemediationTask) {
    return {
      ready: false,
      reason: `Open remediation request must be completed before approval: ${openRemediationTask.reason}`,
      actionLabel: openRemediationTask.actionLabel as AdmissionApprovalActionLabel,
    };
  }

  if (wallet.proofStatus === "Missing") {
    return {
      ready: false,
      reason: "KYC proof is required before this wallet can be approved.",
      actionLabel: "Request KYC Proof",
    };
  }

  if (wallet.proofStatus === "Expired") {
    return {
      ready: false,
      reason: "Expired proof must be refreshed before approval.",
      actionLabel: "Request Proof Refresh",
    };
  }

  if (wallet.proofStatus === "Rejected") {
    return {
      ready: false,
      reason: "Rejected proof cannot be approved without a new submission.",
      actionLabel: "Resolve Evidence",
    };
  }

  if (blockedWhitelistStatuses.includes(wallet.whitelistStatus)) {
    return {
      ready: false,
      reason: "Suspended or removed wallets require remediation before approval.",
      actionLabel: "Resolve Evidence",
    };
  }

  if (account && restrictedAccountStatuses.includes(account.accountStatus)) {
    return {
      ready: false,
      reason: "Restricted, suspended, or closed holder accounts must be resolved before approval.",
      actionLabel: "Review Restriction",
    };
  }

  if (!wallet.proofRefId) {
    return {
      ready: false,
      reason: "Proof evidence is required before this wallet can be approved.",
      actionLabel: "Resolve Evidence",
    };
  }

  return { ready: true };
}
