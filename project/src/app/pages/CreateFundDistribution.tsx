import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";

export function CreateFundDistribution() {
  const navigate = useNavigate();
  const { addFundDistribution, fundIssuances } = useApp();
  const [activeTab, setActiveTab] = useState("about-deal");

  const eligibleFunds = useMemo(
    () =>
      fundIssuances.filter(
        (fund) => !["Draft", "Pending Approval"].includes(fund.status),
      ),
    [fundIssuances],
  );

  const [selectedFundId, setSelectedFundId] = useState(eligibleFunds[0]?.id || "");
  const [dealName, setDealName] = useState("");
  const [dealDescription, setDealDescription] = useState("");
  const [distributionRateType, setDistributionRateType] = useState("Fixed Rate");
  const [distributionRate, setDistributionRate] = useState("");
  const [recordDate, setRecordDate] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [distributionUnit, setDistributionUnit] = useState(
    eligibleFunds[0]?.assetCurrency || "HKD",
  );
  const [payoutMode, setPayoutMode] = useState<"Direct Transfer" | "Claim">("Claim");
  const [payoutToken, setPayoutToken] = useState(eligibleFunds[0]?.assetCurrency || "HKD");
  const [payoutAccount, setPayoutAccount] = useState("");
  const [actualDaysInPeriod, setActualDaysInPeriod] = useState("");
  const [actualDaysInYear, setActualDaysInYear] = useState("360");

  const selectedFund =
    eligibleFunds.find((fund) => fund.id === selectedFundId) || eligibleFunds[0];
  const displayedNav = selectedFund
    ? selectedFund.fundType === "Open-end"
      ? selectedFund.currentNav
      : selectedFund.initialNav
    : "N/A";

  const handleFundChange = (value: string) => {
    setSelectedFundId(value);
    const fund = eligibleFunds.find((item) => item.id === value);
    if (fund) {
      setDistributionUnit(fund.assetCurrency);
      setPayoutToken(fund.assetCurrency);
    }
  };

  const handleCreate = () => {
    if (!selectedFund) {
      toast.error("Please select an existing fund");
      return;
    }

    const newDistributionId = `distribution-${Date.now()}`;
    const now = new Date();
    const createdTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

    const newDistribution = {
      id: newDistributionId,
      fundId: selectedFund.id,
      fundName: selectedFund.name,
      fundToken: selectedFund.tokenName,
      name: dealName || `${selectedFund.name} Distribution`,
      description:
        dealDescription ||
        "Distribution request linked to an existing fund in the demo pool.",
      status: "Draft",
      assetType: "Fund",
      tokenAddress: selectedFund.tokenAddress,
      initialNav: displayedNav,
      distributionRateType,
      distributionRate,
      distributionUnit,
      payoutMode,
      payoutToken,
      payoutAccount:
        payoutAccount ||
        (payoutMode === "Direct Transfer"
          ? "Fund treasury settlement account"
          : "Investor self-claim wallet"),
      actualDaysInPeriod,
      actualDaysInYear,
      recordDate,
      paymentDate,
      createdTime,
      identitySource: "authSession",
    };

    addFundDistribution(newDistribution);
    toast.success("Fund distribution created successfully!");
    navigate(`/fund-distribution/${newDistributionId}`);
  };

  return (
    <div className="container mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8">
        <h1 style={{ fontFamily: "var(--font-heading)" }}>Create Fund Distribution</h1>
        <p className="mt-2 text-muted-foreground">
          Select an existing fund from the demo pool, then configure the linked income
          distribution request.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="about-deal">About Deal</TabsTrigger>
          <TabsTrigger value="about-distribution">About Distribution</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="about-deal" className="space-y-6">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div>
                <label className="mb-2 block text-sm font-medium">* Select fund</label>
                <select
                  className="w-full rounded-md border px-3 py-2"
                  value={selectedFundId}
                  onChange={(event) => handleFundChange(event.target.value)}
                >
                  {eligibleFunds.length === 0 ? (
                    <option value="">No eligible funds</option>
                  ) : (
                    eligibleFunds.map((fund) => (
                      <option key={fund.id} value={fund.id}>
                        {fund.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {selectedFund ? (
                <div className="space-y-3 rounded-lg border bg-secondary/50 p-4 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Fund token</span>
                      <span className="font-medium">{selectedFund.tokenName}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Fund type</span>
                      <span className="font-medium">{selectedFund.fundType}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Token address</span>
                      <span className="font-medium">{selectedFund.tokenAddress}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Reference NAV</span>
                      <span className="font-medium">{displayedNav}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
                  No eligible fund is available yet. Create and approve a fund first.
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium">* Deal name</label>
                <input
                  type="text"
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="Q1 2026 Distribution"
                  value={dealName}
                  onChange={(e) => setDealName(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">* Deal description</label>
                <textarea
                  className="w-full rounded-md border px-3 py-2"
                  rows={3}
                  placeholder="Describe this distribution"
                  value={dealDescription}
                  onChange={(e) => setDealDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    * Distribution rate type
                  </label>
                  <select
                    className="w-full rounded-md border px-3 py-2"
                    value={distributionRateType}
                    onChange={(e) => setDistributionRateType(e.target.value)}
                  >
                    <option>Fixed Rate</option>
                    <option>Fixed Amount Per Share</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    * Distribution rate
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      className="flex-1 rounded-md border px-3 py-2"
                      placeholder="3.5"
                      value={distributionRate}
                      onChange={(e) => setDistributionRate(e.target.value)}
                    />
                    <span className="rounded-md border bg-gray-50 px-3 py-2 text-muted-foreground">
                      {distributionRateType === "Fixed Rate" ? "%" : distributionUnit}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button disabled={!selectedFund} onClick={() => setActiveTab("about-distribution")}>
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about-distribution" className="space-y-6">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    * Distribution record date
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-md border px-3 py-2"
                    value={recordDate}
                    onChange={(e) => setRecordDate(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Snapshot date for determining eligible holders
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    * Distribution payment date
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-md border px-3 py-2"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">* Distribution unit</label>
                <select
                  className="w-full rounded-md border px-3 py-2"
                  value={distributionUnit}
                  onChange={(e) => setDistributionUnit(e.target.value)}
                >
                  <option>HKD</option>
                  <option>USDC</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">* Payout mode</label>
                  <select
                    className="w-full rounded-md border px-3 py-2"
                    value={payoutMode}
                    onChange={(e) =>
                      setPayoutMode(e.target.value as "Direct Transfer" | "Claim")
                    }
                  >
                    <option value="Direct Transfer">Direct Transfer</option>
                    <option value="Claim">Claim</option>
                  </select>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {payoutMode === "Direct Transfer"
                      ? "System pushes payout to holders automatically."
                      : "Holders claim payout on-chain after distribution opens."}
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">* Payout token</label>
                  <input
                    type="text"
                    className="w-full rounded-md border px-3 py-2"
                    placeholder="HKD / USDC"
                    value={payoutToken}
                    onChange={(e) => setPayoutToken(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  * Payout source account / treasury
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="Fund treasury settlement account"
                  value={payoutAccount}
                  onChange={(e) => setPayoutAccount(e.target.value)}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {payoutMode === "Direct Transfer"
                    ? "Gas is paid by the fund operator during batch transfer."
                    : "Gas is paid by each investor when claiming distribution."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    * Distribution actual days in period
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      className="flex-1 rounded-md border px-3 py-2"
                      placeholder="180"
                      value={actualDaysInPeriod}
                      onChange={(e) => setActualDaysInPeriod(e.target.value)}
                    />
                    <span className="rounded-md border bg-gray-50 px-3 py-2 text-muted-foreground">
                      Days
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    * Distribution actual days in year
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      className="flex-1 rounded-md border px-3 py-2"
                      value={actualDaysInYear}
                      onChange={(e) => setActualDaysInYear(e.target.value)}
                    />
                    <span className="rounded-md border bg-gray-50 px-3 py-2 text-muted-foreground">
                      Days
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setActiveTab("about-deal")}>
                  Back
                </Button>
                <Button onClick={() => setActiveTab("rules")}>Next</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Investor rules (Optional)
                </label>
                <p className="mb-4 text-sm text-muted-foreground">
                  Add specific rules for distribution eligibility.
                </p>
                <Button variant="outline" size="sm">
                  + Add Rule
                </Button>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setActiveTab("about-distribution")}>
                  Back
                </Button>
                <Button onClick={handleCreate}>Create</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
