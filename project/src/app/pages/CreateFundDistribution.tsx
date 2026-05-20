import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { CheckCircle2, CircleDashed, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";

function setDateTime(date: Date, hours: number, minutes: number) {
  const next = new Date(date);
  next.setHours(hours, minutes, 0, 0);
  return next;
}

function shiftDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toDateTimeLocalValue(date: Date) {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

function buildDefaultDistributionSchedule() {
  const baseDate = setDateTime(new Date(), 18, 0);
  const recordDate = setDateTime(shiftDays(baseDate, 7), 18, 0);
  const paymentDate = setDateTime(shiftDays(recordDate, 5), 10, 0);

  return {
    recordDate: toDateTimeLocalValue(recordDate),
    paymentDate: toDateTimeLocalValue(paymentDate),
  };
}

function formatReviewDate(value: string) {
  return value ? value.replace("T", " ") : "Missing";
}

export function CreateFundDistribution() {
  const navigate = useNavigate();
  const { fundId } = useParams();
  const { addFundDistribution, fundIssuances } = useApp();
  const [activeTab, setActiveTab] = useState("about-deal");

  const eligibleFunds = useMemo(
    () =>
      fundIssuances.filter(
        (fund) => !["Draft", "Pending Approval"].includes(fund.status),
      ),
    [fundIssuances],
  );
  const contextFund = eligibleFunds.find((fund) => fund.id === fundId);
  const inFundContext = Boolean(fundId);

  const [selectedFundId, setSelectedFundId] = useState(
    contextFund?.id || (inFundContext ? "" : eligibleFunds[0]?.id || ""),
  );
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
    eligibleFunds.find((fund) => fund.id === selectedFundId) ||
    (inFundContext ? undefined : eligibleFunds[0]);
  const isClosedEndSelected = selectedFund?.fundType === "Closed-end";
  const eventLabel = "Distribution";
  const eventLabelLower = "distribution";
  const displayedNav = selectedFund
    ? selectedFund.fundType === "Open-end"
      ? selectedFund.currentNav
      : selectedFund.initialNav
    : "N/A";
  const paymentAfterRecord =
    !recordDate ||
    !paymentDate ||
    new Date(paymentDate).getTime() >= new Date(recordDate).getTime();
  const reviewChecks = [
    {
      label: "Fund selected",
      value: selectedFund ? `${selectedFund.name} / ${selectedFund.fundType}` : "Missing",
      ok: Boolean(selectedFund),
      required: true,
    },
    {
      label: "Record date",
      value: formatReviewDate(recordDate),
      ok: Boolean(recordDate),
      required: true,
    },
    {
      label: "Payment date",
      value: formatReviewDate(paymentDate),
      ok: Boolean(paymentDate) && paymentAfterRecord,
      required: true,
    },
    {
      label: "Payout route",
      value: `${payoutMode} / ${payoutToken || "token missing"} / ${
        payoutAccount || (payoutMode === "Direct Transfer" ? "default treasury account" : "default claim wallet")
      }`,
      ok: Boolean(payoutMode) && Boolean(payoutToken),
      required: true,
    },
    {
      label: "Rate basis",
      value: distributionRate
        ? `${distributionRate} ${distributionRateType === "Fixed Rate" ? "%" : distributionUnit}`
        : "Missing",
      ok: Boolean(distributionRate) && Boolean(distributionRateType) && Boolean(distributionUnit),
      required: true,
    },
    {
      label: "Day-count basis",
      value: `${actualDaysInPeriod || "period missing"} / ${actualDaysInYear || "year missing"}`,
      ok: Boolean(actualDaysInPeriod) && Boolean(actualDaysInYear),
      required: true,
    },
    {
      label: "Recipient rule",
      value: "All record-date holders from the linked holder register",
      ok: true,
      required: false,
    },
  ];
  const requiredComplete = reviewChecks.filter((check) => check.required).every((check) => check.ok);

  useEffect(() => {
    const defaults = buildDefaultDistributionSchedule();
    setDistributionUnit(selectedFund?.assetCurrency || eligibleFunds[0]?.assetCurrency || "HKD");
    setPayoutToken(selectedFund?.assetCurrency || eligibleFunds[0]?.assetCurrency || "HKD");
    setPayoutMode(selectedFund?.fundType === "Closed-end" ? "Direct Transfer" : "Claim");
    setRecordDate(defaults.recordDate);
    setPaymentDate(defaults.paymentDate);
  }, [selectedFundId, selectedFund, eligibleFunds]);

  const handleFundChange = (value: string) => {
    setSelectedFundId(value);
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
      name: dealName || `${selectedFund.name} ${eventLabel}`,
      description:
        dealDescription ||
        `${eventLabel} request linked to an existing fund in the demo pool.`,
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
    toast.success(`Fund ${eventLabelLower} created successfully!`);
    navigate(
      inFundContext
        ? `/fund-issuance/${selectedFund.id}/distributions/${newDistributionId}`
        : `/fund-distribution/${newDistributionId}`,
    );
  };

  return (
    <div className="container mx-auto max-w-5xl px-6 py-8">
      {inFundContext && selectedFund && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link
            to={`/fund-issuance/${selectedFund.id}`}
            className="hover:text-foreground transition-colors"
          >
            {selectedFund.name}
          </Link>
          <span>/</span>
          <Link
            to={`/fund-issuance/${selectedFund.id}/distributions`}
            className="hover:text-foreground transition-colors"
          >
            Distributions
          </Link>
          <span>/</span>
          <span className="text-foreground">Create</span>
        </div>
      )}
      <div className="mb-8">
        <h1 style={{ fontFamily: "var(--font-heading)" }}>
          {inFundContext && selectedFund
            ? `Create Distribution For ${selectedFund.name}`
            : `Create Fund ${eventLabel}`}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {inFundContext && selectedFund
            ? "Configure a distribution operation for this fund. This fund will create a distribution event."
            : "Select an existing fund from the demo pool, then configure the linked income distribution request."}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="about-deal">About Deal</TabsTrigger>
          <TabsTrigger value="about-distribution">
            {isClosedEndSelected ? "Record & Payment" : `About ${eventLabel}`}
          </TabsTrigger>
          <TabsTrigger value="rules">Review</TabsTrigger>
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
                  disabled={inFundContext}
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
                  {inFundContext
                    ? "This fund is not yet eligible for a distribution event."
                    : "No eligible fund is available yet. Create and approve a fund first."}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium">* Deal name</label>
                <input
                  type="text"
                  className="w-full rounded-md border px-3 py-2"
                  placeholder={`Q1 2026 ${eventLabel}`}
                  value={dealName}
                  onChange={(e) => setDealName(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">* Deal description</label>
                <textarea
                  className="w-full rounded-md border px-3 py-2"
                  rows={3}
                  placeholder={`Describe this ${eventLabelLower}`}
                  value={dealDescription}
                  onChange={(e) => setDealDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    * {isClosedEndSelected ? "Distribution method" : "Distribution rate type"}
                  </label>
                  <select
                    className="w-full rounded-md border px-3 py-2"
                    value={distributionRateType}
                    onChange={(e) => setDistributionRateType(e.target.value)}
                  >
                    <option>Fixed Rate</option>
                    <option>Per Unit</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    * {isClosedEndSelected ? "Distribution amount" : "Distribution rate"}
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
                    * {eventLabel} record date
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
                    * {eventLabel} payment date
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
                <label className="mb-2 block text-sm font-medium">
                  * {isClosedEndSelected ? "Distribution currency" : "Distribution unit"}
                </label>
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
                  <label className="mb-2 block text-sm font-medium">* {eventLabel} mode</label>
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
                      ? `System releases ${eventLabelLower} to holders automatically.`
                      : `Holders claim the ${eventLabelLower} on-chain after it opens.`}
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">* {eventLabel} token</label>
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
                  * {eventLabel} source account / treasury
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="Fund treasury distribution account"
                  value={payoutAccount}
                  onChange={(e) => setPayoutAccount(e.target.value)}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {payoutMode === "Direct Transfer"
                    ? "Gas is paid by the fund operator during batch transfer."
                    : `Gas is paid by each investor when claiming ${eventLabelLower}.`}
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
              <div className="flex flex-col gap-3 rounded-lg border bg-secondary/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-semibold">Decision checklist</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Required fields must be complete before the distribution draft is created.
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    requiredComplete
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }
                >
                  {requiredComplete ? "Required complete" : "Required incomplete"}
                </Badge>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {reviewChecks.map((check) => {
                  const Icon = check.ok ? CheckCircle2 : check.required ? TriangleAlert : CircleDashed;
                  return (
                    <div key={check.label} className="rounded-lg border p-3">
                      <div className="flex items-start gap-3">
                        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${check.ok ? "text-emerald-600" : "text-amber-600"}`} />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium">{check.label}</span>
                            {check.required ? <Badge variant="outline">Required</Badge> : null}
                          </div>
                          <div className="mt-1 break-words text-sm text-muted-foreground">{check.value}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setActiveTab("about-distribution")}>
                  Back
                </Button>
                <Button disabled={!requiredComplete} onClick={handleCreate}>
                  {inFundContext ? "Create Distribution For This Fund" : `Create ${eventLabel}`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
