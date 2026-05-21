import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildIssuerDistributionTaProjection,
  buildIssuerRedemptionTaProjection,
  collectOrderLinkedFundingEvidence,
} from "./transferAgency.ts";
import {
  type CashMovement,
  type EvidenceRecord,
  type FundOrder,
  initialDistributions,
  initialEvidenceRecords,
  initialHolderSnapshotPositions,
  initialHolderSnapshots,
  initialRedemptions,
  initialSettlementListLines,
  initialSettlementLists,
  initialTransferAgencyInstructions,
} from "../data/fundDemoData.ts";

const canonicalState = {
  instructions: initialTransferAgencyInstructions,
  holderSnapshots: initialHolderSnapshots,
  holderSnapshotPositions: initialHolderSnapshotPositions,
  settlementLists: initialSettlementLists,
  settlementListLines: initialSettlementListLines,
  evidenceRecords: initialEvidenceRecords,
};

describe("transfer agency evidence projection", () => {
  it("collects distribution evidence from instruction references and settlement list lines", () => {
    const distribution = initialDistributions.find((item) => item.id === "distribution-002");
    assert.ok(distribution);

    const projection = buildIssuerDistributionTaProjection(distribution, canonicalState);
    const evidenceIds = new Set(projection.evidence.map((record) => record.evidenceRefId));

    assert.equal(projection.instruction?.instructionId, "instr-dist-002");
    assert.equal(evidenceIds.has("ev-issuer-dist-approval"), true);
    assert.equal(evidenceIds.has("ev-register-rea-20260520"), true);
  });

  it("collects redemption evidence from current and legacy instruction-linked list-line references", () => {
    const redemption = initialRedemptions.find((item) => item.id === "redemption-003");
    assert.ok(redemption);

    const projection = buildIssuerRedemptionTaProjection(redemption, canonicalState);
    const evidenceById = new Map(projection.evidence.map((record) => [record.evidenceRefId, record]));

    assert.equal(projection.instruction?.instructionId, "instr-redemption-003-ta");
    assert.equal(evidenceById.has("ev-issuer-redemption-approval"), true);
    assert.equal(evidenceById.get("ev-payment-red-ce-001")?.instructionId, "instr-red-ce-001");
  });

  it("collects subscription funding cash and evidence through order instructions and payment references", () => {
    const orders: FundOrder[] = [
      {
        id: "sub-issuance-001",
        fundId: "fund-closed-001",
        investorId: "investor-001",
        investorName: "Alpha Investor",
        investorWallet: "0xalpha",
        type: "subscription",
        requestAmount: "1,000.00 HKD",
        requestQuantity: "100.00 units",
        estimatedNav: "10.00 HKD",
        estimatedSharesOrCash: "100.00 units",
        submitTime: "2026-05-01T09:00:00.000Z",
        status: "Confirmed",
        paymentMethod: "Fiat",
        paymentStatus: "Funds Received",
        paymentReference: "PAY-ISS-001",
      },
    ];
    const cashMovements: CashMovement[] = [
      {
        cashMovementId: "cash-sub-issuance-001",
        instructionId: "instr-sub-issuance-001",
        fundId: "fund-closed-001",
        classId: "REA-HKD",
        direction: "In",
        amount: "1,000.00",
        currency: "HKD",
        status: "Matched",
        owner: "IssuerOps",
        reference: "PAY-ISS-001",
        confirmedAt: "2026-05-01T10:00:00.000Z",
        version: 1,
      },
    ];
    const evidenceRecords: EvidenceRecord[] = [
      {
        evidenceRefId: "ev-cash-sub-issuance-001",
        fundId: "fund-closed-001",
        classId: "REA-HKD",
        instructionId: "instr-sub-issuance-001",
        evidenceType: "CashConfirmation",
        label: "Alpha Investor subscription funding evidence",
        sourceActorType: "Investor",
        sourceActorId: "investor-001",
        createdAt: "2026-05-01T10:00:00.000Z",
        retentionClass: "Audit",
        version: 1,
      },
    ];

    const refs = collectOrderLinkedFundingEvidence({ orders, cashMovements, evidenceRecords });

    assert.deepEqual(refs.orderIds, ["sub-issuance-001"]);
    assert.deepEqual(refs.orderInstructionIds, ["instr-sub-issuance-001"]);
    assert.deepEqual(refs.paymentReferences, ["PAY-ISS-001"]);
    assert.deepEqual(refs.cashMovementIds, ["cash-sub-issuance-001"]);
    assert.deepEqual(refs.evidenceRefIds, ["ev-cash-sub-issuance-001"]);
  });
});
