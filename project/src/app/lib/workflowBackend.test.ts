import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createIssuerWorkflowInstruction,
  getApprovalPackageForWorkflow,
  getWorkflowTaskActionLabel,
  isRedemptionCloseOutReference,
  loadWorkflowState,
  resetWorkflowState,
  type WorkflowInstance,
} from "./workflowBackend.ts";

function withMemoryWorkflowStorage(run: () => void) {
  const previousWindow = (globalThis as { window?: unknown }).window;
  const storage = new Map<string, string>();
  Object.defineProperty(globalThis, "window", {
    value: {
      localStorage: {
        getItem: (key: string) => storage.get(key) || null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
      },
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    },
    configurable: true,
  });

  try {
    resetWorkflowState();
    run();
  } finally {
    if (previousWindow === undefined) {
      delete (globalThis as { window?: unknown }).window;
    } else {
      Object.defineProperty(globalThis, "window", { value: previousWindow, configurable: true });
    }
  }
}

function getTaskFixture(sourceReference: string) {
  const state = loadWorkflowState();
  const task = state.tasks.find((item) => item.sourceReference === sourceReference);
  const instance = task ? state.instances.find((item) => item.workflowId === task.workflowId) : undefined;
  const match = task?.matchResultId
    ? state.matchResults.find((item) => item.matchResultId === task.matchResultId)
    : undefined;

  assert.ok(task, `Expected task for ${sourceReference}`);
  assert.ok(instance, `Expected workflow instance for ${sourceReference}`);
  return { task, instance, match };
}

describe("workflow backend regression behavior", () => {
  it("detects legacy redemption close-out references", () => {
    assert.equal(isRedemptionCloseOutReference("Redemption", "red-ce-001"), true);
    assert.equal(isRedemptionCloseOutReference("Redemption", "redemption-003--close-out"), true);
    assert.equal(isRedemptionCloseOutReference("Redemption", "redemption-003"), false);
    assert.equal(isRedemptionCloseOutReference("Distribution", "red-ce-001"), false);
  });

  it("starts intake workflow tasks at Review & Match instead of Accept Request", () => {
    const { task, instance } = getTaskFixture("distribution-002");

    assert.equal(task.taskStatus, "Match Required");
    assert.equal(instance.currentStepId, "MatchData");
    assert.equal(getWorkflowTaskActionLabel(instance, task), "Review & Match");
    assert.notEqual(getWorkflowTaskActionLabel(instance, task), "Accept Request");
  });

  it("maps close-out workflows to Reconcile Close-out after match passes", () => {
    const { task, instance } = getTaskFixture("red-ce-001");
    const matchPassedInstance: WorkflowInstance = {
      ...instance,
      status: "MatchPassed",
      currentStepId: "TAAction",
    };

    assert.equal(getWorkflowTaskActionLabel(matchPassedInstance, task), "Reconcile Close-out");
  });

  it("preserves match exception state for exception-first workflow actions", () => {
    const { task, instance, match } = getTaskFixture("red-ce-001");

    assert.equal(instance.status, "MatchException");
    assert.equal(task.taskStatus, "Blocked");
    assert.equal(match?.matched, false);
    assert.match(match?.exception || "", /Cash confirmation/);
    assert.equal(getWorkflowTaskActionLabel(instance, task), "Review & Match");
  });

  it("creates stable approval packages for seeded workflow tasks", () => {
    const { task, instance } = getTaskFixture("distribution-002");
    const state = loadWorkflowState();
    const approvalPackage = getApprovalPackageForWorkflow(state, instance.workflowId);

    assert.equal(approvalPackage?.packageId, `pkg-${instance.workflowId}`);
    assert.equal(approvalPackage?.taskId, task.taskId);
    assert.equal(approvalPackage?.reviewChecklist.distributionInstruction, false);
    assert.equal(approvalPackage?.submissionStatus, "InReview");
  });

  it("carries seeded match exception blockers on approval packages", () => {
    const { task, instance, match } = getTaskFixture("red-ce-001");
    const state = loadWorkflowState();
    const approvalPackage = getApprovalPackageForWorkflow(state, instance.workflowId);
    const blockers = state.approvalPackageBlockers.filter(
      (blocker) => blocker.packageId === approvalPackage?.packageId && !blocker.resolvedAt,
    );

    assert.equal(approvalPackage?.matchResultId, task.matchResultId);
    assert.equal(approvalPackage?.submissionStatus, "MatchException");
    assert.equal(blockers.length, 1);
    assert.equal(blockers[0].source, "Match");
    assert.equal(blockers[0].sourceId, match?.matchResultId);
  });

  it("creates issuance workflows with related subscription refs on the approval package", () => {
    withMemoryWorkflowStorage(() => {
      const relatedOrderIds = ["sub-ce-001", "sub-ce-002", "sub-ce-003"];
      const result = createIssuerWorkflowInstruction({
        sourceType: "Issuance",
        sourceReference: "fund-closed-001--close-book-calculate-allocation",
        relatedOrderIds,
        instructionId: "instr-issuance-fund-closed-001-close-book-calculate-allocation-ta",
        fundId: "fund-closed-001",
        classId: "REA-HKD",
        actorRole: "issuer",
        idempotencyKey: "test-issuance-related-orders",
      });
      const state = loadWorkflowState();
      const instance = state.instances.find((item) => item.workflowId === result.workflowId);
      const approvalPackage = instance ? getApprovalPackageForWorkflow(state, instance.workflowId) : undefined;

      assert.equal(result.success, true);
      assert.equal(instance?.status, "TAResponded");
      assert.equal(instance?.currentStepId, "MatchData");
      assert.deepEqual(instance?.relatedOrderIds, relatedOrderIds);
      assert.deepEqual(approvalPackage?.sourceOrderIds, relatedOrderIds);
      assert.equal(approvalPackage?.submissionStatus, "InReview");
    });
  });

  it("backfills missing subscription refs on an existing issuance workflow without changing status", () => {
    withMemoryWorkflowStorage(() => {
      const sourceReference = "fund-closed-001--close-book-calculate-allocation";
      createIssuerWorkflowInstruction({
        sourceType: "Issuance",
        sourceReference,
        instructionId: "instr-issuance-fund-closed-001-close-book-calculate-allocation-ta",
        fundId: "fund-closed-001",
        classId: "REA-HKD",
        actorRole: "issuer",
        idempotencyKey: "test-issuance-no-related-orders",
      });

      const relatedOrderIds = ["sub-demo-fund-closed-001-1", "sub-demo-fund-closed-001-2"];
      const result = createIssuerWorkflowInstruction({
        sourceType: "Issuance",
        sourceReference,
        relatedOrderIds,
        instructionId: "instr-issuance-fund-closed-001-close-book-calculate-allocation-ta",
        fundId: "fund-closed-001",
        classId: "REA-HKD",
        actorRole: "issuer",
        idempotencyKey: "test-issuance-backfill-related-orders",
      });
      const state = loadWorkflowState();
      const instance = state.instances.find((item) => item.workflowId === result.workflowId);
      const approvalPackage = instance ? getApprovalPackageForWorkflow(state, instance.workflowId) : undefined;

      assert.equal(result.success, true);
      assert.equal(result.message, "Workflow request already exists.");
      assert.equal(instance?.status, "TAResponded");
      assert.equal(instance?.currentStepId, "MatchData");
      assert.deepEqual(instance?.relatedOrderIds, relatedOrderIds);
      assert.deepEqual(approvalPackage?.sourceOrderIds, relatedOrderIds);
    });
  });
});
