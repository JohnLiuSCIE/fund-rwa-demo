import type { FundIssuance, FundOrder } from "../data/fundDemoData";

export function getSubscriptionOrdersForFund(fundId: string, orders: FundOrder[]) {
  return orders.filter((order) => order.fundId === fundId && order.type === "subscription");
}

export function shouldSeedClosedEndSubscriptionDemoOrders(
  fund: FundIssuance,
  nextStatus: string,
  existingOrders: FundOrder[],
) {
  return (
    fund.fundType === "Closed-end" &&
    ["Allocation Period", "Calculated"].includes(nextStatus) &&
    getSubscriptionOrdersForFund(fund.id, existingOrders).length === 0
  );
}

export function uniqueSubscriptionOrderIdsForFund(fundId: string, orders: FundOrder[]) {
  return Array.from(new Set(getSubscriptionOrdersForFund(fundId, orders).map((order) => order.id)));
}
