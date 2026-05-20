import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getAdmissionApprovalReadiness } from "./admissionReadiness.ts";
import type { AdmissionRemediationTask, RegisterAccount, WalletLink } from "../data/fundDemoData.ts";

type TestWallet = Pick<WalletLink, "proofStatus" | "whitelistStatus" | "proofRefId">;
type TestAccount = Pick<RegisterAccount, "accountStatus">;
type TestRemediationTask = Pick<AdmissionRemediationTask, "actionLabel" | "reason" | "status">;

const readyWallet: TestWallet = {
  proofStatus: "Submitted",
  whitelistStatus: "Pending",
  proofRefId: "ev-wallet-ready",
};

const activeAccount: TestAccount = { accountStatus: "Active" };

function readiness(
  wallet: Partial<TestWallet>,
  account: TestAccount | undefined = activeAccount,
  remediationTasks: TestRemediationTask[] = [],
) {
  return getAdmissionApprovalReadiness({ ...readyWallet, ...wallet }, account, remediationTasks);
}

describe("getAdmissionApprovalReadiness", () => {
  it("allows a submitted proof with a valid proof reference", () => {
    assert.deepEqual(readiness({ proofStatus: "Submitted" }), { ready: true });
  });

  it("allows a verified proof with a valid proof reference", () => {
    assert.deepEqual(readiness({ proofStatus: "Verified" }), { ready: true });
  });

  it("blocks missing proof", () => {
    assert.deepEqual(readiness({ proofStatus: "Missing" }), {
      ready: false,
      reason: "KYC proof is required before this wallet can be approved.",
      actionLabel: "Request KYC Proof",
    });
  });

  it("blocks expired proof", () => {
    assert.deepEqual(readiness({ proofStatus: "Expired" }), {
      ready: false,
      reason: "Expired proof must be refreshed before approval.",
      actionLabel: "Request Proof Refresh",
    });
  });

  it("blocks rejected proof", () => {
    assert.deepEqual(readiness({ proofStatus: "Rejected" }), {
      ready: false,
      reason: "Rejected proof cannot be approved without a new submission.",
      actionLabel: "Resolve Evidence",
    });
  });

  it("blocks removed wallets", () => {
    assert.deepEqual(readiness({ whitelistStatus: "Removed" }), {
      ready: false,
      reason: "Suspended or removed wallets require remediation before approval.",
      actionLabel: "Resolve Evidence",
    });
  });

  it("blocks suspended wallets", () => {
    assert.deepEqual(readiness({ whitelistStatus: "Suspended" }), {
      ready: false,
      reason: "Suspended or removed wallets require remediation before approval.",
      actionLabel: "Resolve Evidence",
    });
  });

  it("blocks restricted holder accounts", () => {
    assert.deepEqual(readiness({}, { accountStatus: "Restricted" }), {
      ready: false,
      reason: "Restricted, suspended, or closed holder accounts must be resolved before approval.",
      actionLabel: "Review Restriction",
    });
  });

  it("blocks suspended holder accounts", () => {
    assert.deepEqual(readiness({}, { accountStatus: "Suspended" }), {
      ready: false,
      reason: "Restricted, suspended, or closed holder accounts must be resolved before approval.",
      actionLabel: "Review Restriction",
    });
  });

  it("blocks closed holder accounts", () => {
    assert.deepEqual(readiness({}, { accountStatus: "Closed" }), {
      ready: false,
      reason: "Restricted, suspended, or closed holder accounts must be resolved before approval.",
      actionLabel: "Review Restriction",
    });
  });

  it("blocks missing proof references", () => {
    assert.deepEqual(readiness({ proofRefId: undefined }), {
      ready: false,
      reason: "Proof evidence is required before this wallet can be approved.",
      actionLabel: "Resolve Evidence",
    });
  });

  it("allows pending holder accounts when proof evidence is linked", () => {
    assert.deepEqual(readiness({}, { accountStatus: "Pending" }), { ready: true });
  });

  it("blocks approval while a proof-refresh remediation request is open", () => {
    assert.deepEqual(readiness({}, activeAccount, [
      {
        actionLabel: "Request Proof Refresh",
        reason: "Expired proof must be refreshed before approval.",
        status: "Open",
      },
    ]), {
      ready: false,
      reason: "Open remediation request must be completed before approval: Expired proof must be refreshed before approval.",
      actionLabel: "Request Proof Refresh",
    });
  });

  it("continues to block completed remediation when account restrictions remain", () => {
    assert.deepEqual(readiness({}, { accountStatus: "Restricted" }, [
      {
        actionLabel: "Review Restriction",
        reason: "Account restriction review requested.",
        status: "Completed",
      },
    ]), {
      ready: false,
      reason: "Restricted, suspended, or closed holder accounts must be resolved before approval.",
      actionLabel: "Review Restriction",
    });
  });

  it("allows approval after remediation is completed and proof/account state is fixed", () => {
    assert.deepEqual(readiness({}, activeAccount, [
      {
        actionLabel: "Request Proof Refresh",
        reason: "Proof refreshed.",
        status: "Completed",
      },
    ]), { ready: true });
  });
});
