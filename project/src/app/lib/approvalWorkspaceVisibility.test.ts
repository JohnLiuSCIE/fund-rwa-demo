import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  shouldShowIssuerDistributionApprovalWorkspace,
  shouldShowIssuerIssuanceApprovalWorkspace,
  shouldShowIssuerRedemptionApprovalWorkspace,
  shouldShowTaWorkflowApprovalWorkspace,
} from "./approvalWorkspaceVisibility.ts";

describe("approval workspace visibility", () => {
  it("shows at an issuer distribution control point with review data", () => {
    assert.equal(
      shouldShowIssuerDistributionApprovalWorkspace({
        userRole: "issuer",
        currentStatus: "Pending Allocation",
        hasApprovalReviewData: true,
        primaryActionNeedsTa: true,
        hasUnfinishedWorkflow: false,
        needsIssuerAcknowledge: false,
      }),
      true,
    );
  });

  it("hides for draft distribution and redemption states", () => {
    assert.equal(
      shouldShowIssuerDistributionApprovalWorkspace({
        userRole: "issuer",
        currentStatus: "Draft",
        hasApprovalReviewData: true,
        primaryActionNeedsTa: true,
        hasUnfinishedWorkflow: false,
        needsIssuerAcknowledge: false,
      }),
      false,
    );
    assert.equal(
      shouldShowIssuerRedemptionApprovalWorkspace({
        userRole: "issuer",
        redemptionStatus: "Draft",
        hasApprovalReviewData: true,
        primaryActionNeedsTa: true,
        hasUnfinishedWorkflow: false,
        needsIssuerAcknowledge: false,
      }),
      false,
    );
  });

  it("shows at an issuer redemption control point with an unfinished workflow", () => {
    assert.equal(
      shouldShowIssuerRedemptionApprovalWorkspace({
        userRole: "issuer",
        redemptionStatus: "Payment List Ready",
        hasApprovalReviewData: true,
        primaryActionNeedsTa: false,
        hasUnfinishedWorkflow: true,
        needsIssuerAcknowledge: false,
      }),
      true,
    );
  });

  it("hides for active open-end issuance and marketplace views", () => {
    assert.equal(
      shouldShowIssuerIssuanceApprovalWorkspace({
        userRole: "issuer",
        fundStatus: "Issuance Active",
        isMarketplaceView: false,
        hasApprovalReviewData: true,
        issuerActionRequiresTa: true,
        hasUnfinishedWorkflow: false,
        needsIssuerAcknowledge: false,
      }),
      false,
    );
    assert.equal(
      shouldShowIssuerIssuanceApprovalWorkspace({
        userRole: "issuer",
        fundStatus: "Pending Approval",
        isMarketplaceView: true,
        hasApprovalReviewData: true,
        issuerActionRequiresTa: true,
        hasUnfinishedWorkflow: false,
        needsIssuerAcknowledge: false,
      }),
      false,
    );
  });

  it("shows TA workflow approval workspace only for active, data-backed workflow reviews", () => {
    assert.equal(
      shouldShowTaWorkflowApprovalWorkspace({
        sourceLifecycleStatus: "Pending Allocation",
        isWorkflowComplete: false,
        dataCount: 1,
        controlCount: 0,
      }),
      true,
    );
    assert.equal(
      shouldShowTaWorkflowApprovalWorkspace({
        sourceLifecycleStatus: "Finalized",
        isWorkflowComplete: false,
        dataCount: 1,
        controlCount: 0,
      }),
      false,
    );
    assert.equal(
      shouldShowTaWorkflowApprovalWorkspace({
        sourceLifecycleStatus: "Pending Allocation",
        isWorkflowComplete: true,
        dataCount: 1,
        controlCount: 0,
      }),
      false,
    );
  });
});
