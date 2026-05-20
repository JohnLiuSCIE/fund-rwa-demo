import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildIssuerDistributionTaProjection,
  buildIssuerRedemptionTaProjection,
} from "./transferAgency.ts";
import {
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
});
