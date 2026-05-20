# Ticket: Remaining TA Approval Workflow Follow-ups

## 1. Background

The current implementation has consolidated the Transfer Agent experience around:

- `Workflows`: TA review, match, exception handling, and issuer handoff.
- `Book of Record / Fund Management`: fund picker, fund scope, register versions, snapshots, evidence, and fund audit.
- `Book of Record / User Management`: admissions overview, priority queue, alerts, KYC / wallet review, and admissions register.
- Shared approval workspace reuse across issuance, distribution, and redemption control points.

The major blockers reported in the latest review have been addressed:

- `Accept Request` is no longer the TA workflow entry action.
- TA can see `Review & Match` / approval package content on first entry.
- `Approval Review Workspace` appears only at workflow-gated control points.
- Distribution and Redemption reuse the newer approval package / evidence model.
- Legacy redemption close-out workflows such as `red-ce-*` now map to close-out handling instead of snapshot lock.
- Expired / rejected / restricted admissions cannot be approved from the UI or command boundary.
- `/ta/evidence` and `/ta/transfers` have been removed from the active MVP route model.

This ticket captures the remaining work that should be handed to the next development cycle.

## 2. Remaining TODO

### TODO 1: Extract Shared Admission Readiness Rules

#### Current Status

Partially complete. The UI and command boundary now both block unsafe approval, but the readiness logic still exists in two places:

- `project/src/app/pages/TransferAgentAdmissions.tsx`
- `project/src/app/context/AppContext.tsx`

The immediate mismatch found during review was fixed by requiring `wallet.proofRefId` in both layers. However, duplicated rules can drift again.

#### Files Involved

- `project/src/app/pages/TransferAgentAdmissions.tsx`
- `project/src/app/context/AppContext.tsx`
- Recommended new file: `project/src/app/lib/admissionReadiness.ts`

#### Acceptance Criteria

- A single shared helper defines admission approval readiness.
- Both UI and command boundary call the same helper.
- Missing, expired, rejected proof cannot be approved.
- Removed or suspended wallet cannot be approved.
- Restricted, suspended, or closed holder account cannot be approved.
- Submitted proof with valid `proofRefId` remains approvable.
- Unit-level regression coverage exists for all approval readiness cases.

#### Implementation Plan

1. Create a pure helper such as `getAdmissionApprovalReadiness(wallet, account)`.
2. Return `{ ready, reason, actionLabel }` from the helper.
3. Replace `canApproveAdmission` / `getApproveBlockReason` in `TransferAgentAdmissions.tsx`.
4. Replace `assertWalletApprovalReady` in `AppContext.tsx`.
5. Add tests for each blocked and allowed state.

## 3. TODO 2: Fix Remaining Sheet / Dialog Console Warnings

### Current Status

Investigated but not fixed in the current pass. Playwright review observed non-blocking React warnings:

- `flushSync was called from inside a lifecycle method`
- `SheetOverlay` ref warning

These do not currently block the demo workflow, but they may affect focus management, accessibility, and automation stability.

### Files Involved

- `project/src/app/components/ui/sheet.tsx`
- `project/src/app/pages/TransferAgentAdmissions.tsx`
- `project/src/app/pages/TransferAgentWorkflowDetail.tsx`
- Potentially other pages using `SheetContent`

### Acceptance Criteria

- Opening admissions action sheets does not emit React ref warnings.
- Opening workflow review sheets does not emit React lifecycle warnings.
- Sheet focus trap works with keyboard navigation.
- Escape key closes the sheet.
- Screen reader title / description are correctly attached.
- Playwright console monitoring shows no new warning during sheet open / close.

### Implementation Plan

1. Review the local shadcn/Radix `Sheet` wrapper.
2. Confirm overlay/content components use `forwardRef` correctly.
3. Audit custom `SheetContent` usage for invalid child structure or missing ref forwarding.
4. Add a small Playwright test that fails on console warnings while opening:
   - Admissions action sheet
   - TA `Review & Match` sheet
   - Fund Management snapshot sheet

## 4. TODO 3: Improve Snapshot ID Traceability

### Current Status

Partially complete. Legacy snapshot deep links work, for example:

- `SNAP-DIV-20260520-001`
- `SNAP-RED-20260512-001`

They resolve into the Fund Management snapshot audit view. However, the UI tends to normalize to canonical internal IDs such as `snap-distribution-002-requested`, and the official `SNAP-*` label can disappear from the visible audit context.

### Files Involved

- `project/src/app/pages/HolderRegister.tsx`
- `project/src/app/components/transfer-agent/SnapshotReviewPanel.tsx`
- `project/src/app/data/fundDemoData.ts`
- `project/src/app/lib/transferAgency.ts`

### Acceptance Criteria

- Official snapshot ID and canonical internal snapshot ID are both visible.
- Snapshot audit drawer shows:
  - Official snapshot ID
  - Canonical snapshot ID
  - Source event
  - Fund / class
  - Register version
  - Evidence references
  - Anchor references
- Legacy deep links preserve the official ID context after resolution.
- Snapshot rows support copy for both IDs.

### Implementation Plan

1. Add an optional `officialSnapshotId` / alias map to snapshot data or projection.
2. Update the Fund Management sheet and snapshot audit table to display both IDs.
3. Keep URL canonicalization if needed, but show a visible "Opened from official ID" indicator.
4. Add Playwright coverage for legacy deep links.

## 5. TODO 4: Add Regression Tests For Workflow State Transitions

### Current Status

Manual and Playwright smoke tests pass, but the project still lacks a formal regression test suite for workflow transitions.

The most important fixed behaviors should be captured in automated tests:

- Intake workflows start at `Review & Match`, not `Accept Request`.
- `red-ce-*` redemption close-out maps to `Reconcile Close-out`.
- Match exceptions show exception-first actions.
- Distribution / Redemption evidence refs are pulled through instruction and list-line references.
- Approval workspace only appears at gated control points.

### Files Involved

- `project/src/app/lib/workflowBackend.ts`
- `project/src/app/lib/transferAgency.ts`
- `project/src/app/pages/TransferAgentWorkflowDetail.tsx`
- `project/src/app/pages/FundDistributionDetail.tsx`
- `project/src/app/pages/FundRedemptionDetail.tsx`
- `project/src/app/pages/FundIssuanceDetail.tsx`
- Recommended test files under `project/src/app/**/__tests__` or `project/tests`

### Acceptance Criteria

- Tests cover `isRedemptionCloseOutReference`.
- Tests cover `getWorkflowTaskActionLabel`.
- Tests cover match exception state.
- Tests cover evidence collection by:
  - instruction `evidenceRefIds`
  - settlement list line `evidenceRefIds`
  - legacy instruction IDs
- Tests cover approval workspace visibility for:
  - Issuer distribution control point
  - Issuer redemption control point
  - Active open-end fund
  - Draft distribution / redemption

### Implementation Plan

1. Add a lightweight test runner if the repo still has no test script.
2. Start with pure function tests for workflow and evidence projection.
3. Add Playwright route tests for the critical user journeys.
4. Add CI-friendly commands:
   - `npm run build`
   - `npm run test`
   - `npm run test:e2e` if Playwright is added.

## 6. TODO 5: Persist Review Package Decisions As First-Class Records

### Current Status

Partially complete in UI. The review workspace now exposes:

- Package status
- Workflow stepper
- Match result
- Blocking reason
- Review state
- Next action
- Evidence rows

However, some of this is still derived from local workflow state and demo canonical data rather than a durable approval package entity.

### Files Involved

- `project/src/app/components/ApprovalReviewWorkspace.tsx`
- `project/src/app/lib/workflowBackend.ts`
- `project/src/app/context/AppContext.tsx`
- `project/src/app/data/fundDemoData.ts`
- Future backend API / schema layer

### Acceptance Criteria

- Approval package has a stable ID.
- Review package stores:
  - selected snapshot rows
  - list rows
  - cash movement rows
  - evidence rows
  - match result
  - reviewer decisions
  - blocker reasons
  - submission status
- TA and Issuer read the same package record.
- Reopening the workflow displays the previously saved review state.
- Returning to issuer records a reason and timestamp.

### Implementation Plan

1. Define an `ApprovalPackage` data model.
2. Map current derived data into the model.
3. Add create / update commands in the workflow backend.
4. Replace page-local derivations only after the package model is stable.
5. Add audit log events for save, match, return, submit, and issuer acknowledge.

## 7. TODO 6: Add Remediation Workflows For Blocked Admissions

### Current Status

Partially complete. Unsafe approvals are blocked and UI shows remediation labels such as:

- `Request Proof Refresh`
- `Request KYC Proof`
- `Review Restriction`
- `Resolve Evidence`

These labels are currently action cues, not full workflows.

### Files Involved

- `project/src/app/pages/TransferAgentAdmissions.tsx`
- `project/src/app/context/AppContext.tsx`
- `project/src/app/data/fundDemoData.ts`
- Future backend request / task model

### Acceptance Criteria

- Clicking a remediation action opens a confirmation drawer or creates a to-do item.
- Remediation actions can be assigned to responsible party:
  - Investor
  - Issuer
  - Distributor
  - Compliance
  - TA Ops
- Remediation request appears in the lower request / to-do area of User Management.
- Admission cannot be approved until remediation completes.
- Audit trail records remediation creation and completion.

### Implementation Plan

1. Introduce a `UserManagementRequest` / `AdmissionRemediationTask` data model.
2. Convert disabled remediation labels into enabled remediation actions.
3. Add drawer for remediation request creation.
4. Add request list in User Management lower section.
5. Add tests for expired proof refresh and restriction review.

## 8. TODO 7: Mobile And Projection QA Pass

### Current Status

Desktop Playwright smoke passes. The dark-mode rollback was completed and TA is now identified with a deep navy top bar while issuer remains light.

Mobile and projector-room QA should still be run explicitly across the updated screens.

### Files Involved

- `project/src/app/components/Layout.tsx`
- `project/src/app/components/ApprovalReviewWorkspace.tsx`
- `project/src/app/pages/TransferAgentAdmissions.tsx`
- `project/src/app/pages/HolderRegister.tsx`
- `project/src/app/pages/TransferAgentWorkflowDetail.tsx`

### Acceptance Criteria

- No horizontal overflow at 390px, 768px, 1280px, and 1440px.
- TA top bar remains readable on projector-style brightness.
- Tables remain scannable on smaller widths.
- Long wallet addresses and snapshot IDs truncate cleanly.
- Primary next action remains visible without requiring excessive scrolling.
- All buttons have accessible labels and usable hit targets.

### Implementation Plan

1. Add Playwright viewport matrix screenshots.
2. Review the screenshots as UI-critical review, not only functional testing.
3. Fix overflow, text wrapping, button density, and card spacing.
4. Store baseline screenshots for future comparison if the project adds visual regression.

## 9. Out Of Scope

The following items are not part of this follow-up ticket unless explicitly reprioritized:

- New chain transaction flows.
- Full backend authorization model.
- New KYC vendor integration.
- Secondary trading / VATP bridge implementation.
- Complex workflow engine replacement.
- Full mobile redesign beyond responsive QA fixes.

## 10. QA Checklist

- [ ] Admission readiness helper is shared by UI and command boundary.
- [ ] Expired proof cannot be approved.
- [ ] Rejected proof cannot be approved.
- [ ] Restricted account cannot be approved.
- [ ] Normal submitted proof with `proofRefId` can be approved.
- [ ] Sheet / dialog console warnings are resolved.
- [ ] Legacy snapshot IDs remain visible in audit UI.
- [ ] Workflow transition tests cover `red-ce-*` close-out.
- [ ] Evidence projection tests cover instruction and list-line refs.
- [ ] Approval workspace visibility tests cover gated and non-gated states.
- [ ] Remediation actions can create request / to-do items.
- [ ] Desktop and mobile viewport screenshots pass UI review.
