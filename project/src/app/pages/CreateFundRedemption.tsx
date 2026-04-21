import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Card, CardContent } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { useApp } from "../context/AppContext";

export function CreateFundRedemption() {
  const navigate = useNavigate();
  const { fundId } = useParams();
  const { fundIssuances, addFundRedemption } = useApp();
  const [activeTab, setActiveTab] = useState("about-fund");

  const eligibleFunds = useMemo(
    () => fundIssuances,
    [fundIssuances],
  );
  const contextFund = eligibleFunds.find((fund) => fund.id === fundId);
  const inFundContext = Boolean(fundId);

  const [selectedFundId, setSelectedFundId] = useState(
    contextFund?.id || (inFundContext ? "" : eligibleFunds[0]?.id || ""),
  );
  const [redemptionMode, setRedemptionMode] = useState<"Daily dealing" | "Window-based">(
    contextFund?.fundType === "Closed-end" ? "Window-based" : "Daily dealing",
  );
  const [effectiveDate, setEffectiveDate] = useState("2026-04-17T09:00");
  const [windowStart, setWindowStart] = useState("");
  const [windowEnd, setWindowEnd] = useState("");
  const [announcementDate, setAnnouncementDate] = useState("2026-04-16T09:00");
  const [noticePeriodDays, setNoticePeriodDays] = useState("0");
  const [maxRedemptionQuantityPerInvestor, setMaxRedemptionQuantityPerInvestor] = useState("500000");
  const [manualApprovalRequired, setManualApprovalRequired] = useState(false);
  const [pauseAfterListing, setPauseAfterListing] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [validationSummary, setValidationSummary] = useState<string[]>([]);

  const selectedFund = eligibleFunds.find((fund) => fund.id === selectedFundId) || (inFundContext ? undefined : eligibleFunds[0]);
  const minimumNoticePeriodDays = selectedFund?.noticePeriodDays || 0;
  const isClosedEndFund = selectedFund?.fundType === "Closed-end";
  const displayedNav = selectedFund
    ? selectedFund.fundType === "Open-end"
      ? selectedFund.currentNav
      : selectedFund.initialNav
    : "N/A";

  const parseDateTime = (value: string) => {
    if (!value) return undefined;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  };

  const validationChecks = useMemo(() => {
    const effectiveDateValue = parseDateTime(effectiveDate);
    const announcementDateValue = parseDateTime(announcementDate);
    const windowStartValue = parseDateTime(windowStart);
    const windowEndValue = parseDateTime(windowEnd);
    const noticeValue = Number(noticePeriodDays);
    const limitValue = Number(maxRedemptionQuantityPerInvestor);
    const referenceStartDate = redemptionMode === "Window-based" ? windowStartValue : effectiveDateValue;
    const gapDays =
      announcementDateValue && referenceStartDate
        ? (referenceStartDate.getTime() - announcementDateValue.getTime()) / (1000 * 60 * 60 * 24)
        : undefined;
    const isGapMatch = gapDays !== undefined && Math.abs(gapDays - noticeValue) < 0.000001;

    return {
      hasWindowFields: redemptionMode !== "Window-based" || (!!windowStartValue && !!windowEndValue),
      windowOrderOk: !windowStartValue || !windowEndValue || windowStartValue < windowEndValue,
      announcementBeforeWindowStart: !announcementDateValue || !windowStartValue || announcementDateValue <= windowStartValue,
      effectiveNotLaterThanWindowStart: !effectiveDateValue || !windowStartValue || effectiveDateValue <= windowStartValue,
      noticePeriodRuleOk:
        Number.isFinite(noticeValue) &&
        noticeValue >= 0 &&
        (!!isGapMatch || noticeValue >= minimumNoticePeriodDays),
      maxLimitRuleOk: Number.isFinite(limitValue) && limitValue > 0,
    };
  }, [
    effectiveDate,
    announcementDate,
    windowStart,
    windowEnd,
    noticePeriodDays,
    maxRedemptionQuantityPerInvestor,
    redemptionMode,
    minimumNoticePeriodDays,
  ]);

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    const nextSummary: string[] = [];

    const effectiveDateValue = parseDateTime(effectiveDate);
    const announcementDateValue = parseDateTime(announcementDate);
    const windowStartValue = parseDateTime(windowStart);
    const windowEndValue = parseDateTime(windowEnd);
    const noticeValue = Number(noticePeriodDays);
    const referenceStartDate = redemptionMode === "Window-based" ? windowStartValue : effectiveDateValue;

    if (!selectedFund) {
      nextErrors.selectedFund = "Please select a fund.";
      nextSummary.push("Please select a fund.");
    }

    if (!effectiveDateValue) {
      nextErrors.effectiveDate = "Effective date is required.";
      nextSummary.push("Effective date is required.");
    }

    if (!announcementDateValue) {
      nextErrors.announcementDate = "Announcement date is required.";
      nextSummary.push("Announcement date is required.");
    }

    if (redemptionMode === "Window-based") {
      if (!windowStartValue) {
        nextErrors.windowStart = "Window start is required in Window-based mode.";
        nextSummary.push("Window start is required in Window-based mode.");
      }

      if (!windowEndValue) {
        nextErrors.windowEnd = "Window end is required in Window-based mode.";
        nextSummary.push("Window end is required in Window-based mode.");
      }
    }

    if (windowStartValue && windowEndValue && windowStartValue >= windowEndValue) {
      nextErrors.windowEnd = "Window end must be later than window start.";
      nextSummary.push("Window start must be earlier than window end.");
    }

    if (announcementDateValue && windowStartValue && announcementDateValue > windowStartValue) {
      nextErrors.announcementDate = "Announcement date must be on or before window start.";
      nextSummary.push("Announcement date must be on or before window start.");
    }

    if (effectiveDateValue && windowStartValue && effectiveDateValue > windowStartValue) {
      nextErrors.effectiveDate = "Effective date cannot be later than window start.";
      nextSummary.push("Effective date cannot be later than window start.");
    }

    if (!Number.isFinite(noticeValue) || noticeValue < 0) {
      nextErrors.noticePeriodDays = "Notice period days must be 0 or greater.";
      nextSummary.push("Notice period days must be 0 or greater.");
    } else if (announcementDateValue && referenceStartDate) {
      const gapDays = (referenceStartDate.getTime() - announcementDateValue.getTime()) / (1000 * 60 * 60 * 24);
      const isGapMatch = Math.abs(gapDays - noticeValue) < 0.000001;
      const meetsMin = noticeValue >= minimumNoticePeriodDays;
      if (!isGapMatch && !meetsMin) {
        nextErrors.noticePeriodDays = `Notice period should equal the announcement gap (${gapDays.toFixed(2)} day(s)) or be at least ${minimumNoticePeriodDays} day(s).`;
        nextSummary.push("Notice period rule is not satisfied.");
      }
    }

    const maxLimitValue = Number(maxRedemptionQuantityPerInvestor);
    if (!Number.isFinite(maxLimitValue) || maxLimitValue <= 0) {
      nextErrors.maxRedemptionQuantityPerInvestor = "Max redemption quantity per investor must be greater than 0.";
      nextSummary.push("Max redemption quantity per investor must be greater than 0.");
    }

    setFieldErrors(nextErrors);
    setValidationSummary(nextSummary);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCreate = () => {
    if (!validateForm()) {
      setActiveTab("rules");
      return;
    }

    const now = new Date();
    const redemptionId = `redemption-${Date.now()}`;
    const createdTime = format(now, "yyyy-MM-dd HH:mm:ss");

    addFundRedemption({
      id: redemptionId,
      fundId: selectedFund.id,
      name:
        selectedFund.fundType === "Closed-end"
          ? `${selectedFund.name} Redemption Event`
          : `${selectedFund.name} Redemption Operation`,
      description:
        redemptionMode === "Daily dealing"
          ? "Daily dealing redemption operation for ongoing open-end fund activity."
          : selectedFund.fundType === "Closed-end"
            ? "Window-based redemption event for closed-end fund liquidity operations."
            : "Window-based redemption operation for open-end fund liquidity management.",
      status: "Draft",
      assetType: "Fund",
      fundName: selectedFund.name,
      fundToken: selectedFund.tokenName,
      tokenAddress: selectedFund.tokenAddress,
      redemptionMode,
      effectiveDate: effectiveDate ? effectiveDate.replace("T", " ") + ":00" : createdTime,
      windowStart: windowStart ? windowStart.replace("T", " ") + ":00" : undefined,
      windowEnd: windowEnd ? windowEnd.replace("T", " ") + ":00" : undefined,
      announcementDate: announcementDate ? announcementDate.replace("T", " ") + ":00" : undefined,
      latestNav: displayedNav,
      settlementCycle: selectedFund.settlementCycle || "T+1",
      noticePeriodDays: Number(noticePeriodDays) || 0,
      maxRedemptionQuantityPerInvestor: `${maxRedemptionQuantityPerInvestor || "0"} units`,
      manualApprovalRequired,
      pauseRedemptionAfterListing: pauseAfterListing,
      cutOffTime: selectedFund.dealingCutoffTime || "16:00 HKT",
      createdTime,
      identitySource: "authSession",
    });

    const detailPath = inFundContext
      ? `/fund-issuance/${selectedFund.id}/redemptions/${redemptionId}`
      : `/fund-redemption/${redemptionId}`;

    toast.success("Redemption operation created", {
      description:
        selectedFund.fundType === "Closed-end"
          ? "The closed-end redemption event has been saved as a draft."
          : "The redemption operation has been saved as a draft.",
      action: {
        label: "View Detail",
        onClick: () => navigate(detailPath),
      },
    });

    navigate(detailPath);
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-5xl">
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
            to={`/fund-issuance/${selectedFund.id}/redemptions`}
            className="hover:text-foreground transition-colors"
          >
            Redemptions
          </Link>
          <span>/</span>
          <span className="text-foreground">Create</span>
        </div>
      )}
      <div className="mb-8">
        <h1 style={{ fontFamily: "var(--font-heading)" }}>
          {inFundContext && selectedFund
            ? `Create Redemption For ${selectedFund.name}`
            : "Configure Fund Redemption"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {inFundContext && selectedFund
            ? "Configure a redemption operation for this fund."
            : "Link redemption rules to an existing fund instead of hand-creating a disconnected one-off process."}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="about-fund">About Fund</TabsTrigger>
          <TabsTrigger value="rules">Redemption Rules</TabsTrigger>
          <TabsTrigger value="review">Review</TabsTrigger>
        </TabsList>

        <TabsContent value="about-fund" className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label>Select Fund</Label>
                <Select
                  value={selectedFundId}
                  onValueChange={(value) => {
                    setSelectedFundId(value);
                    const fund = eligibleFunds.find((item) => item.id === value);
                    if (fund?.fundType === "Closed-end") {
                      setRedemptionMode("Window-based");
                    }
                  }}
                  disabled={inFundContext}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a fund" />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleFunds.map((fund) => (
                      <SelectItem key={fund.id} value={fund.id}>
                        {fund.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedFund ? (
                <div className="rounded-lg border bg-secondary/50 p-5 space-y-3 text-sm">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Fund token</span>
                        <span className="font-medium">{selectedFund.tokenName}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Reference NAV</span>
                        <span className="font-medium">{displayedNav}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Fund type</span>
                        <span className="font-medium">{selectedFund.fundType}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Dealing frequency</span>
                        <span className="font-medium">{selectedFund.dealingFrequency || "Window-based / Event-driven"}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Settlement cycle</span>
                      <span className="font-medium">{selectedFund.settlementCycle || "T+1"}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Subscription status</span>
                      <span className="font-medium">{selectedFund.subscriptionStatus || "Open"}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Redemption status</span>
                      <span className="font-medium">{selectedFund.redemptionStatus || "Open"}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
                  {inFundContext
                    ? "This fund is not available for redemption configuration."
                    : "No funds are available yet. Create a fund first."}
                </div>
              )}

              <div className="space-y-2">
                <Label>Redemption mode</Label>
                <Select
                  value={redemptionMode}
                  onValueChange={(value) => setRedemptionMode(value as "Daily dealing" | "Window-based")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {!isClosedEndFund && (
                      <SelectItem value="Daily dealing">Daily dealing</SelectItem>
                    )}
                    <SelectItem value="Window-based">Window-based</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end">
                <Button disabled={!selectedFund} onClick={() => setActiveTab("rules")}>
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Effective date</Label>
                  <Input
                    type="datetime-local"
                    value={effectiveDate}
                    onChange={(event) => {
                      setEffectiveDate(event.target.value);
                      setFieldErrors((prev) => ({ ...prev, effectiveDate: "" }));
                    }}
                  />
                  {fieldErrors.effectiveDate && <p className="text-sm text-destructive">{fieldErrors.effectiveDate}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Announcement date</Label>
                  <Input
                    type="datetime-local"
                    value={announcementDate}
                    onChange={(event) => {
                      setAnnouncementDate(event.target.value);
                      setFieldErrors((prev) => ({ ...prev, announcementDate: "" }));
                    }}
                  />
                  {fieldErrors.announcementDate && <p className="text-sm text-destructive">{fieldErrors.announcementDate}</p>}
                </div>
              </div>

              {redemptionMode === "Window-based" && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Window start</Label>
                    <Input
                      type="datetime-local"
                      value={windowStart}
                      onChange={(event) => {
                        setWindowStart(event.target.value);
                        setFieldErrors((prev) => ({ ...prev, windowStart: "" }));
                      }}
                    />
                    {fieldErrors.windowStart && <p className="text-sm text-destructive">{fieldErrors.windowStart}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Window end</Label>
                    <Input
                      type="datetime-local"
                      value={windowEnd}
                      onChange={(event) => {
                        setWindowEnd(event.target.value);
                        setFieldErrors((prev) => ({ ...prev, windowEnd: "" }));
                      }}
                    />
                    {fieldErrors.windowEnd && <p className="text-sm text-destructive">{fieldErrors.windowEnd}</p>}
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Notice period (days)</Label>
                  <Input
                    type="number"
                    value={noticePeriodDays}
                    onChange={(event) => {
                      setNoticePeriodDays(event.target.value);
                      setFieldErrors((prev) => ({ ...prev, noticePeriodDays: "" }));
                    }}
                  />
                  {fieldErrors.noticePeriodDays && <p className="text-sm text-destructive">{fieldErrors.noticePeriodDays}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Max redemption quantity per investor</Label>
                  <Input
                    type="number"
                    value={maxRedemptionQuantityPerInvestor}
                    onChange={(event) => {
                      setMaxRedemptionQuantityPerInvestor(event.target.value);
                      setFieldErrors((prev) => ({ ...prev, maxRedemptionQuantityPerInvestor: "" }));
                    }}
                  />
                  {fieldErrors.maxRedemptionQuantityPerInvestor && (
                    <p className="text-sm text-destructive">{fieldErrors.maxRedemptionQuantityPerInvestor}</p>
                  )}
                </div>
              </div>

              {validationSummary.length > 0 && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 space-y-2">
                  <div className="font-medium text-destructive">Please fix the following issues before creating:</div>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-destructive">
                    {validationSummary.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-lg border p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">Manual approval required</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Queue redemption orders for issuer review before NAV confirmation.
                    </div>
                  </div>
                  <Switch checked={manualApprovalRequired} onCheckedChange={setManualApprovalRequired} />
                </div>

                <div className="rounded-lg border p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">Pause redemption after listing</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Useful for window-based redemption events that should remain announced until manually opened.
                    </div>
                  </div>
                  <Switch checked={pauseAfterListing} onCheckedChange={setPauseAfterListing} />
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("about-fund")}>
                  Back
                </Button>
                <Button onClick={() => setActiveTab("review")}>Next</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review" className="space-y-6">
          {validationSummary.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 space-y-2">
                  <div className="font-medium text-destructive">Validation summary</div>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-destructive">
                    {validationSummary.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="font-medium">Rule Check Summary</div>
              <div className="rounded-lg border bg-secondary/50 p-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Announcement rule (announcementDate before or on window start)</span>
                  <span className={validationChecks.announcementBeforeWindowStart ? "font-medium text-green-600" : "font-medium text-destructive"}>
                    {validationChecks.announcementBeforeWindowStart ? "Pass" : "Fail"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Window rule (window start before window end)</span>
                  <span className={validationChecks.hasWindowFields && validationChecks.windowOrderOk ? "font-medium text-green-600" : "font-medium text-destructive"}>
                    {validationChecks.hasWindowFields && validationChecks.windowOrderOk ? "Pass" : "Fail"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Effective-date rule (effective date before or on window start)</span>
                  <span className={validationChecks.effectiveNotLaterThanWindowStart ? "font-medium text-green-600" : "font-medium text-destructive"}>
                    {validationChecks.effectiveNotLaterThanWindowStart ? "Pass" : "Fail"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Notice-period rule (gap matches or exceeds minimum)</span>
                  <span className={validationChecks.noticePeriodRuleOk ? "font-medium text-green-600" : "font-medium text-destructive"}>
                    {validationChecks.noticePeriodRuleOk ? "Pass" : "Fail"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Limit rule (maximum redemption above zero)</span>
                  <span className={validationChecks.maxLimitRuleOk ? "font-medium text-green-600" : "font-medium text-destructive"}>
                    {validationChecks.maxLimitRuleOk ? "Pass" : "Fail"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="rounded-lg border bg-secondary/50 p-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Selected fund</span>
                  <span className="font-medium">{selectedFund?.name || "N/A"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Redemption mode</span>
                  <span className="font-medium">{redemptionMode}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Latest NAV source</span>
                  <span className="font-medium">{displayedNav}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Settlement cycle</span>
                  <span className="font-medium">{selectedFund?.settlementCycle || "T+1"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Cut-off time</span>
                  <span className="font-medium">{selectedFund?.dealingCutoffTime || "16:00 HKT"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Manual approval</span>
                  <span className="font-medium">{manualApprovalRequired ? "Yes" : "No"}</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                The resulting detail page will act as this fund's redemption operations dashboard with request lists, batch history, and status controls.
              </p>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("rules")}>
                  Back
                </Button>
                <Button disabled={!selectedFund} onClick={handleCreate}>
                  {inFundContext ? "Create Redemption For This Fund" : "Create Redemption Event"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
