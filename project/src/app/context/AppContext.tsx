import { createContext, useContext, useState, ReactNode } from "react";

import {
  FundBatch,
  FundDistribution,
  FundIssuance,
  FundOrder,
  FundRedemptionConfig,
  initialDistributions,
  initialFundBatches,
  initialFundOrders,
  initialFunds,
  initialRedemptions,
} from "../data/fundDemoData";

type UserRole = "issuer" | "investor";

interface InvestorProfile {
  id: string;
  name: string;
  wallet: string;
  investorType: string;
  jurisdiction: string;
}

interface AppContextType {
  fundIssuances: FundIssuance[];
  addFundIssuance: (fund: FundIssuance) => void;
  updateFundStatus: (id: string, status: string) => void;
  fundRedemptions: FundRedemptionConfig[];
  addFundRedemption: (redemption: FundRedemptionConfig) => void;
  updateRedemptionStatus: (id: string, status: FundRedemptionConfig["status"]) => void;
  fundOrders: FundOrder[];
  addFundOrder: (order: FundOrder) => void;
  updateFundOrderStatus: (id: string, status: FundOrder["status"]) => void;
  fundBatches: FundBatch[];
  addFundBatch: (batch: FundBatch) => void;
  fundDistributions: FundDistribution[];
  addFundDistribution: (distribution: FundDistribution) => void;
  updateDistributionStatus: (id: string, status: string) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  currentInvestor: InvestorProfile;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultInvestor: InvestorProfile = {
  id: "inv-001",
  name: "John Doe",
  wallet: "0xa7E4F2c8b9D1e3A5C7F6B2d8E9A1c3F5b7D9e2A4",
  investorType: "Institutional",
  jurisdiction: "Hong Kong SAR",
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole>("issuer");
  const [fundIssuances, setFundIssuances] = useState<FundIssuance[]>(initialFunds);
  const [fundRedemptions, setFundRedemptions] = useState<FundRedemptionConfig[]>(initialRedemptions);
  const [fundOrders, setFundOrders] = useState<FundOrder[]>(initialFundOrders);
  const [fundBatches, setFundBatches] = useState<FundBatch[]>(initialFundBatches);
  const [fundDistributions, setFundDistributions] = useState<FundDistribution[]>(initialDistributions);

  const addFundIssuance = (fund: FundIssuance) => {
    setFundIssuances((prev) => [fund, ...prev]);
  };

  const updateFundStatus = (id: string, status: string) => {
    setFundIssuances((prev) =>
      prev.map((fund) => (fund.id === id ? { ...fund, status } : fund)),
    );
  };

  const addFundRedemption = (redemption: FundRedemptionConfig) => {
    setFundRedemptions((prev) => [redemption, ...prev]);
  };

  const updateRedemptionStatus = (
    id: string,
    status: FundRedemptionConfig["status"],
  ) => {
    setFundRedemptions((prev) =>
      prev.map((redemption) =>
        redemption.id === id ? { ...redemption, status } : redemption,
      ),
    );
  };

  const addFundOrder = (order: FundOrder) => {
    setFundOrders((prev) => [order, ...prev]);
  };

  const updateFundOrderStatus = (id: string, status: FundOrder["status"]) => {
    setFundOrders((prev) =>
      prev.map((order) => (order.id === id ? { ...order, status } : order)),
    );
  };

  const addFundBatch = (batch: FundBatch) => {
    setFundBatches((prev) => [batch, ...prev]);
  };

  const addFundDistribution = (distribution: FundDistribution) => {
    setFundDistributions((prev) => [distribution, ...prev]);
  };

  const updateDistributionStatus = (id: string, status: string) => {
    setFundDistributions((prev) =>
      prev.map((distribution) =>
        distribution.id === id ? { ...distribution, status } : distribution,
      ),
    );
  };

  return (
    <AppContext.Provider
      value={{
        fundIssuances,
        addFundIssuance,
        updateFundStatus,
        fundRedemptions,
        addFundRedemption,
        updateRedemptionStatus,
        fundOrders,
        addFundOrder,
        updateFundOrderStatus,
        fundBatches,
        addFundBatch,
        fundDistributions,
        addFundDistribution,
        updateDistributionStatus,
        userRole,
        setUserRole,
        currentInvestor: defaultInvestor,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
