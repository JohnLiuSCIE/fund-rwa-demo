type IssuerDistributionApprovalInput = {
  userRole?: string;
  currentStatus?: string;
  hasApprovalReviewData: boolean;
  primaryActionNeedsTa: boolean;
  hasUnfinishedWorkflow: boolean;
  needsIssuerAcknowledge: boolean;
};

type IssuerRedemptionApprovalInput = {
  userRole?: string;
  redemptionStatus?: string;
  hasApprovalReviewData: boolean;
  primaryActionNeedsTa: boolean;
  hasUnfinishedWorkflow: boolean;
  needsIssuerAcknowledge: boolean;
};

type IssuerIssuanceApprovalInput = {
  userRole?: string;
  fundStatus?: string;
  isMarketplaceView: boolean;
  hasApprovalReviewData: boolean;
  issuerActionRequiresTa: boolean;
  hasUnfinishedWorkflow: boolean;
  needsIssuerAcknowledge: boolean;
};

type TaWorkflowApprovalInput = {
  sourceLifecycleStatus?: string;
  isWorkflowComplete: boolean;
  dataCount: number;
  controlCount: number;
};

export function shouldShowIssuerDistributionApprovalWorkspace({
  userRole,
  currentStatus,
  hasApprovalReviewData,
  primaryActionNeedsTa,
  hasUnfinishedWorkflow,
  needsIssuerAcknowledge,
}: IssuerDistributionApprovalInput) {
  return (
    userRole === "issuer" &&
    !["Draft", "Done"].includes(currentStatus || "") &&
    hasApprovalReviewData &&
    (primaryActionNeedsTa || hasUnfinishedWorkflow || needsIssuerAcknowledge)
  );
}

export function shouldShowIssuerRedemptionApprovalWorkspace({
  userRole,
  redemptionStatus,
  hasApprovalReviewData,
  primaryActionNeedsTa,
  hasUnfinishedWorkflow,
  needsIssuerAcknowledge,
}: IssuerRedemptionApprovalInput) {
  return (
    userRole === "issuer" &&
    !["Draft", "Window Closed"].includes(redemptionStatus || "") &&
    hasApprovalReviewData &&
    (primaryActionNeedsTa || hasUnfinishedWorkflow || needsIssuerAcknowledge)
  );
}

export function shouldShowIssuerIssuanceApprovalWorkspace({
  userRole,
  fundStatus,
  isMarketplaceView,
  hasApprovalReviewData,
  issuerActionRequiresTa,
  hasUnfinishedWorkflow,
  needsIssuerAcknowledge,
}: IssuerIssuanceApprovalInput) {
  return (
    !isMarketplaceView &&
    userRole === "issuer" &&
    !["Draft", "Issuance Active"].includes(fundStatus || "") &&
    hasApprovalReviewData &&
    (issuerActionRequiresTa || hasUnfinishedWorkflow || needsIssuerAcknowledge)
  );
}

export function shouldShowTaWorkflowApprovalWorkspace({
  sourceLifecycleStatus,
  isWorkflowComplete,
  dataCount,
  controlCount,
}: TaWorkflowApprovalInput) {
  return (
    !["Draft", "Finalized"].includes(sourceLifecycleStatus || "") &&
    !isWorkflowComplete &&
    (dataCount > 0 || controlCount > 0)
  );
}
