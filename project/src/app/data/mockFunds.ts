export interface FundData {
  id: string;
  name: string;
  status: string;
  tokenName: string;
  tokenAddress: string;
  assetType: string;
  minSubscriptionAmount: string;
  maxSubscriptionAmount: string;
  initialNav: string;
  fundType: string;
  managementFee: string;
  performanceFee: string;
  redemptionFrequency: string;
  lockupPeriod: string;
  tradable: string;
  fundManager: string;
  targetFundSize: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  issueDate: string;
  maturityDate: string | null;
  description: string;
}

export const mockFunds: Record<string, FundData> = {
  "fund-001": {
    id: "fund-001",
    name: "Global Equity Fund 2026",
    status: "Draft",
    tokenName: "DEMO-FUND-2024",
    tokenAddress: "–",
    assetType: "Fund",
    minSubscriptionAmount: "1 HKD",
    maxSubscriptionAmount: "1,000 HKD",
    initialNav: "90 HKD",
    fundType: "Open-end",
    managementFee: "1.5% p.a.",
    performanceFee: "10%",
    redemptionFrequency: "Monthly",
    lockupPeriod: "90 Days",
    tradable: "Yes",
    fundManager: "Global Asset Management LLC",
    targetFundSize: "1,000,000 HKD",
    subscriptionStartDate: "2026-05-01 09:00:00",
    subscriptionEndDate: "2026-05-15 17:00:00",
    issueDate: "2026-05-20 10:00:00",
    maturityDate: null,
    description: "Diversified global equity investment fund",
  },
  "fund-002": {
    id: "fund-002",
    name: "Tech Growth Fund",
    status: "Pending Listing",
    tokenName: "TECH-GROWTH-2024",
    tokenAddress: "–",
    assetType: "Fund",
    minSubscriptionAmount: "5 HKD",
    maxSubscriptionAmount: "5,000 HKD",
    initialNav: "100 HKD",
    fundType: "Open-end",
    managementFee: "2.0% p.a.",
    performanceFee: "15%",
    redemptionFrequency: "Quarterly",
    lockupPeriod: "180 Days",
    tradable: "Yes",
    fundManager: "TechVenture Capital Partners",
    targetFundSize: "5,000,000 HKD",
    subscriptionStartDate: "2026-04-25 10:00:00",
    subscriptionEndDate: "2026-05-10 18:00:00",
    issueDate: "2026-05-15 09:00:00",
    maturityDate: null,
    description: "Focus on high-growth technology companies",
  },
  "fund-003": {
    id: "fund-003",
    name: "Real Estate Fund A",
    status: "Open For Subscription",
    tokenName: "RE-FUND-A-2024",
    tokenAddress: "0xa7E4F2c8b9D1e3A5C7F6B2d8E9A1c3F5b7D9e2A4",
    assetType: "Fund",
    minSubscriptionAmount: "10 HKD",
    maxSubscriptionAmount: "10,000 HKD",
    initialNav: "95 HKD",
    fundType: "Closed-end",
    managementFee: "1.25% p.a.",
    performanceFee: "12%",
    redemptionFrequency: "None",
    lockupPeriod: "365 Days",
    tradable: "No",
    fundManager: "Premium Real Estate Capital",
    targetFundSize: "10,000,000 HKD",
    subscriptionStartDate: "2026-04-01 09:00:00",
    subscriptionEndDate: "2026-04-30 17:00:00",
    issueDate: "2026-05-05 10:00:00",
    maturityDate: "2029-05-05 10:00:00",
    description: "Commercial real estate investment opportunities",
  },
  "fund-004": {
    id: "fund-004",
    name: "Sustainable Energy Fund",
    status: "Upcoming",
    tokenName: "SUSTAIN-ENERGY-2024",
    tokenAddress: "0xB3c7F9A2E8d4C1B6a5D8f3E7C2A9b1F4e6D8c3A5",
    assetType: "Fund",
    minSubscriptionAmount: "2 HKD",
    maxSubscriptionAmount: "2,000 HKD",
    initialNav: "85 HKD",
    fundType: "Open-end",
    managementFee: "1.75% p.a.",
    performanceFee: "8%",
    redemptionFrequency: "Monthly",
    lockupPeriod: "None",
    tradable: "Yes",
    fundManager: "GreenFuture Investments",
    targetFundSize: "3,000,000 HKD",
    subscriptionStartDate: "2026-05-10 08:00:00",
    subscriptionEndDate: "2026-05-25 20:00:00",
    issueDate: "2026-06-01 09:00:00",
    maturityDate: null,
    description: "Invest in renewable energy infrastructure",
  },
  "fund-005": {
    id: "fund-005",
    name: "Asia Pacific Growth",
    status: "Open For Subscription",
    tokenName: "APAC-GROWTH-2024",
    tokenAddress: "0xC8d4E5F1a2B3c6D7e9A4f2C5b8D3e6A1f4B7c9E2",
    assetType: "Fund",
    minSubscriptionAmount: "3 HKD",
    maxSubscriptionAmount: "3,000 HKD",
    initialNav: "92 HKD",
    fundType: "Open-end",
    managementFee: "1.8% p.a.",
    performanceFee: "18%",
    redemptionFrequency: "Weekly",
    lockupPeriod: "120 Days",
    tradable: "Yes",
    fundManager: "Asia Opportunities Fund Management",
    targetFundSize: "7,000,000 HKD",
    subscriptionStartDate: "2026-04-05 07:00:00",
    subscriptionEndDate: "2026-04-20 19:00:00",
    issueDate: "2026-04-25 08:00:00",
    maturityDate: null,
    description: "Emerging markets equity fund focused on APAC region",
  },
  "draft-example": {
    id: "draft-example",
    name: "New Fund Created",
    status: "Draft",
    tokenName: "NEW-FUND-2024",
    tokenAddress: "–",
    assetType: "Fund",
    minSubscriptionAmount: "1 HKD",
    maxSubscriptionAmount: "1,000 HKD",
    initialNav: "100 HKD",
    fundType: "Open-end",
    managementFee: "1.5% p.a.",
    performanceFee: "N/A",
    redemptionFrequency: "Monthly",
    lockupPeriod: "None",
    tradable: "Yes",
    fundManager: "To be determined",
    targetFundSize: "1,000,000 HKD",
    subscriptionStartDate: "2026-06-01 09:00:00",
    subscriptionEndDate: "2026-06-15 17:00:00",
    issueDate: "2026-06-20 10:00:00",
    maturityDate: null,
    description: "Newly created fund pending completion",
  },
};

export function getFundById(id: string): FundData | null {
  return mockFunds[id] || null;
}
