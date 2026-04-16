import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";

export function CreateFundDistribution() {
  const navigate = useNavigate();
  const { addFundDistribution } = useApp();
  const [activeTab, setActiveTab] = useState("about-deal");

  // About Deal fields
  const [dealName, setDealName] = useState("");
  const [dealDescription, setDealDescription] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [initialNav, setInitialNav] = useState("90");
  const [distributionRateType, setDistributionRateType] = useState("Fixed Rate");
  const [distributionRate, setDistributionRate] = useState("");

  // About Distribution fields
  const [recordDate, setRecordDate] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [distributionUnit, setDistributionUnit] = useState("HKD");
  const [actualDaysInPeriod, setActualDaysInPeriod] = useState("");
  const [actualDaysInYear, setActualDaysInYear] = useState("360");

  const handleCreate = () => {
    // Validation disabled for testing
    // if (!dealName || !dealDescription || !tokenAddress || !distributionRate || !recordDate || !paymentDate) {
    //   toast.error("Please fill in all required fields");
    //   return;
    // }

    const newDistributionId = `distribution-${Date.now()}`;
    const now = new Date();
    const createdTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const newDistribution = {
      id: newDistributionId,
      name: dealName || "New Distribution",
      description: dealDescription || "Distribution description",
      status: "Draft",
      assetType: "Fund",
      tokenAddress,
      recordDate,
      paymentDate,
      createdTime,
    };

    addFundDistribution(newDistribution);
    toast.success("Fund distribution created successfully!");
    navigate("/manage/fund-distribution");
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 style={{ fontFamily: 'var(--font-heading)' }}>Create Fund Distribution</h1>
        <p className="text-muted-foreground mt-2">
          Set up a new income distribution for fund investors
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="about-deal">About Deal</TabsTrigger>
          <TabsTrigger value="about-distribution">About Distribution</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="fee-charge">Fee Charge</TabsTrigger>
        </TabsList>

        {/* Tab 1: About Deal */}
        <TabsContent value="about-deal" className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  * Deal name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Q1 2026 Distribution"
                  value={dealName}
                  onChange={(e) => setDealName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  * Deal description
                </label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                  placeholder="Describe this distribution"
                  value={dealDescription}
                  onChange={(e) => setDealDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  * Fund token contract address
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="0x..."
                  value={tokenAddress}
                  onChange={(e) => {
                    setTokenAddress(e.target.value);
                    if (e.target.value) setTokenSymbol("DEMO-FUND-2024");
                  }}
                />
              </div>

              {tokenSymbol && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Fund token symbol
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-md bg-gray-50"
                    value={tokenSymbol}
                    readOnly
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  Initial NAV / Issue Price
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    className="flex-1 px-3 py-2 border rounded-md bg-gray-50"
                    value={initialNav}
                    readOnly
                  />
                  <span className="px-3 py-2 border rounded-md bg-gray-50 text-muted-foreground">
                    HKD
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    * Distribution rate type
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={distributionRateType}
                    onChange={(e) => setDistributionRateType(e.target.value)}
                  >
                    <option>Fixed Rate</option>
                    <option>Fixed Amount Per Share</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    * Distribution rate
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      className="flex-1 px-3 py-2 border rounded-md"
                      placeholder="3.5"
                      value={distributionRate}
                      onChange={(e) => setDistributionRate(e.target.value)}
                    />
                    <span className="px-3 py-2 border rounded-md bg-gray-50 text-muted-foreground">
                      {distributionRateType === "Fixed Rate" ? "%" : "HKD"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={() => setActiveTab("about-distribution")}>Next</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: About Distribution */}
        <TabsContent value="about-distribution" className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    * Distribution record date
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full px-3 py-2 border rounded-md"
                    value={recordDate}
                    onChange={(e) => setRecordDate(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Snapshot date for determining eligible holders
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    * Distribution payment date
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full px-3 py-2 border rounded-md"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  * Distribution unit
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={distributionUnit}
                  onChange={(e) => setDistributionUnit(e.target.value)}
                >
                  <option>HKD</option>
                  <option>USDC</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    * Distribution actual days in period
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      className="flex-1 px-3 py-2 border rounded-md"
                      placeholder="180"
                      value={actualDaysInPeriod}
                      onChange={(e) => setActualDaysInPeriod(e.target.value)}
                    />
                    <span className="px-3 py-2 border rounded-md bg-gray-50 text-muted-foreground">
                      Days
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    * Distribution actual days in year
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      className="flex-1 px-3 py-2 border rounded-md"
                      value={actualDaysInYear}
                      onChange={(e) => setActualDaysInYear(e.target.value)}
                    />
                    <span className="px-3 py-2 border rounded-md bg-gray-50 text-muted-foreground">
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

        {/* Tab 3: Rules */}
        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Investor rules (Optional)
                </label>
                <p className="text-sm text-muted-foreground mb-4">
                  Add specific rules for distribution eligibility
                </p>
                <Button variant="outline" size="sm">
                  + Add Rule
                </Button>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setActiveTab("about-distribution")}>
                  Back
                </Button>
                <Button onClick={() => setActiveTab("fee-charge")}>Next</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Fee Charge */}
        <TabsContent value="fee-charge" className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground">
                  We normally charge issuer the distribution amount(s) subject to listing, in HKD as commission fee.
                  If issuer terminates this distribution application after listing, the commission fee is not refundable.
                </p>
                <p className="text-muted-foreground mt-4">
                  The commission fee will be charged once upon listing the distribution.
                  For any query about the commission fee, you can contact us at support@platform.com.
                </p>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setActiveTab("rules")}>
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
