import { Navigate, Outlet, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { CreateFundIssuance } from "./pages/CreateFundIssuance";
import { ManageFundIssuance } from "./pages/ManageFundIssuance";
import { ManageFundRedemption } from "./pages/ManageFundRedemption";
import { CreateFundRedemption } from "./pages/CreateFundRedemption";
import { CreateFundDistribution } from "./pages/CreateFundDistribution";
import { ManageFundDistribution } from "./pages/ManageFundDistribution";
import { FundIssuanceDetail } from "./pages/FundIssuanceDetail";
import { FundRedemptionDetail } from "./pages/FundRedemptionDetail";
import { FundDistributionDetail } from "./pages/FundDistributionDetail";
import { MarketplaceFundIssuance } from "./pages/MarketplaceFundIssuance";
import { UserCenter } from "./pages/UserCenter";
import { NotFound } from "./pages/NotFound";
import { LoginPage } from "./pages/LoginPage";
import { ConnectWalletPage } from "./pages/ConnectWalletPage";
import { UserRole, useApp } from "./context/AppContext";

function ProtectedRoute({ allow }: { allow: UserRole[] }) {
  const { authSession, isAuthSessionExpired } = useApp();
  if (!authSession?.walletAddress) {
    return <Navigate to="/connect-wallet" replace />;
  }
  if (!authSession?.role) {
    return <Navigate to="/login" replace />;
  }
  if (isAuthSessionExpired(authSession)) {
    return <Navigate to="/login?reason=expired" replace />;
  }
  const userRole = authSession.role;
  if (!allow.includes(userRole)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="connect-wallet" element={<ConnectWalletPage />} />
        <Route element={<ProtectedRoute allow={["issuer"]} />}>
          <Route path="create/fund-issuance" element={<CreateFundIssuance />} />
          <Route path="create/fund-redemption" element={<CreateFundRedemption />} />
          <Route path="create/fund-distribution" element={<CreateFundDistribution />} />
          <Route path="manage/fund-issuance" element={<ManageFundIssuance />} />
          <Route path="manage/fund-redemption" element={<ManageFundRedemption />} />
          <Route path="manage/fund-distribution" element={<ManageFundDistribution />} />
          <Route path="fund-issuance/:id" element={<FundIssuanceDetail />} />
          <Route path="fund-redemption/:id" element={<FundRedemptionDetail />} />
          <Route path="fund-distribution/:id" element={<FundDistributionDetail />} />
        </Route>
        <Route element={<ProtectedRoute allow={["investor"]} />}>
          <Route path="marketplace/fund-issuance" element={<MarketplaceFundIssuance />} />
          <Route path="marketplace/fund-issuance/:id" element={<FundIssuanceDetail />} />
          <Route path="marketplace/fund-redemption" element={<ManageFundRedemption />} />
          <Route path="marketplace/fund-distribution" element={<ManageFundDistribution />} />
        </Route>
        <Route path="user" element={<UserCenter />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
