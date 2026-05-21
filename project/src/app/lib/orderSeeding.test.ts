import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { initialFundOrders, initialFunds } from "../data/fundDemoData.ts";
import {
  shouldSeedClosedEndSubscriptionDemoOrders,
  uniqueSubscriptionOrderIdsForFund,
} from "./orderSeeding.ts";

const closedEndFund = initialFunds.find((fund) => fund.id === "fund-closed-001");

describe("closed-end subscription demo seeding", () => {
  it("allows subscription demo seeding when existing orders are redemption-only", () => {
    assert.ok(closedEndFund);
    const redemptionOnlyOrders = initialFundOrders.filter(
      (order) => order.fundId === closedEndFund.id && order.type === "redemption",
    );

    assert.equal(
      shouldSeedClosedEndSubscriptionDemoOrders(closedEndFund, "Calculated", redemptionOnlyOrders),
      true,
    );
  });

  it("does not seed duplicate closed-end subscriptions when subscription orders already exist", () => {
    assert.ok(closedEndFund);
    const existingOrders = initialFundOrders.filter((order) => order.fundId === closedEndFund.id);

    assert.equal(
      shouldSeedClosedEndSubscriptionDemoOrders(closedEndFund, "Calculated", existingOrders),
      false,
    );
    assert.deepEqual(uniqueSubscriptionOrderIdsForFund(closedEndFund.id, existingOrders), [
      "sub-ce-001",
      "sub-ce-002",
      "sub-ce-003",
    ]);
  });
});
