import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getApprovalPackageForWorkflow,
  getWorkflowTaskActionLabel,
  isRedemptionCloseOutReference,
  loadWorkflowState,
  type WorkflowInstance,
} from "./workflowBackend.ts";

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
});
