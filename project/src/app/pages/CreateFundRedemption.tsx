import { useMemo, useState } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
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

const MIN_NOTICE_PERIOD_DAYS = 0;

type FormFieldKey =
  | "selectedFundId"
  | "effectiveDate"
  | "announcementDate"
  | "windowStart"
  | "windowEnd"
  | "noticePeriodDays"
  | "maxRedemptionQuantityPerInvestor";

type FormErrors = Partial<Record<FormFieldKey, string>>;

export function CreateFundRedemption() {
  const navigate = useNavigate();
  const { fundIssuances, addFundRedemption } = useApp();
  const [activeTab, setActiveTab] = useState("about-fund");

  const openEndFunds = useMemo(
    () => fundIssuances.filter((fund) => fund.fundType === "Open-end"),
    [fundIssuances],
  );

  const [selectedFundId, setSelectedFundId] = useState(openEndFunds[0]?.id || "");
  const [redemptionMode, setRedemptionMode] = useState<"Daily dealing" | "Window-based">("Daily dealing");
  const [effectiveDate, setEffectiveDate] = useState("2026-04-17T09:00");
  const [windowStart, setWindowStart] = useState("");
  const [windowEnd, setWindowEnd] = useState("");
  const [announcementDate, setAnnouncementDate] = useState("2026-04-16T09:00");
  const [noticePeriodDays, setNoticePeriodDays] = useState("0");
  const [maxRedemptionQuantityPerInvestor, setMaxRedemptionQuantityPerInvestor] = useState("500000");
  const [manualApprovalRequired, setManualApprovalRequired] = useState(false);
  const [pauseAfterListing, setPauseAfterListing] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [errorSummary, setErrorSummary] = useState<string[]>([]);

  const selectedFund = openEndFunds.find((fund) => fund.id === selectedFundId) || openEndFunds[0];

  const parseDateTime = (value: string) => (value ? new Date(value) : null);
  const parsedEffectiveDate = parseDateTime(effectiveDate);
  const parsedAnnouncementDate = parseDateTime(announcementDate);
  const parsedWindowStart = parseDateTime(windowStart);
  const parsedWindowEnd = parseDateTime(windowEnd);
  const parsedNoticePeriodDays = Number(noticePeriodDays);
  const parsedMaxRedemptionQuantity = Number(maxRedemptionQuantityPerInvestor);

  const noticeGapDays = useMemo(() => {
    if (!parsedAnnouncementDate || !parsedWindowStart) {
      return null;
    }

    const gapInMs = parsedWindowStart.getTime() - parsedAnnouncementDate.getTime();
    return Math.ceil(gapInMs / (1000 * 60 * 60 * 24));
  }, [parsedAnnouncementDate, parsedWindowStart]);

  const ruleChecks = useMemo(() => {
    const windowFieldsReady =
      redemptionMode === "Daily dealing" || (!!windowStart && !!windowEnd);
    const windowChronologyPass =
      redemptionMode === "Daily dealing" ||
      (parsedWindowStart !== null && parsedWindowEnd !== null && parsedWindowStart < parsedWindowEnd);
    const effectiveWindowPass =
      redemptionMode === "Daily dealing" ||
      (parsedEffectiveDate !== null && parsedWindowStart !== null && parsedEffectiveDate <= parsedWindowStart);
    const announcementWindowPass =
      redemptionMode === "Daily dealing" ||
      (parsedAnnouncementDate !== null && parsedWindowStart !== null && parsedAnnouncementDate <= parsedWindowStart);
    const noticePeriodPass =
      noticeGapDays === null
        ? parsedNoticePeriodDays >= MIN_NOTICE_PERIOD_DAYS
        : parsedNoticePeriodDays >= noticeGapDays;
    const limitRulePass = parsedMaxRedemptionQuantity > 0;

    return {
      windowRulePass: windowFieldsReady && windowChronologyPass && effectiveWindowPass,
      announcementRulePass: announcementWindowPass && noticePeriodPass,
      limitRulePass,
      noticeGapDays,
    };
  }, [
    redemptionMode,
    windowStart,
    windowEnd,
    parsedWindowStart,
    parsedWindowEnd,
    parsedEffectiveDate,
    parsedAnnouncementDate,
    noticeGapDays,
    parsedNoticePeriodDays,
    parsedMaxRedemptionQuantity,
  ]);

  const validateForm = () => {
    const errors: FormErrors = {};
    const summaryMessages: string[] = [];

    if (!selectedFund) {
      errors.selectedFundId = "Please select an open-end fund before creating redemption setup.";
      summaryMessages.push(errors.selectedFundId);
    }

    if (redemptionMode === "Window-based") {
      if (!windowStart) {
        errors.windowStart = "Window start is required for Window-based mode.";
      }
      if (!windowEnd) {
        errors.windowEnd = "Window end is required for Window-based mode.";
      }

      if (parsedWindowStart && parsedWindowEnd && parsedWindowStart >= parsedWindowEnd) {
        errors.windowEnd = "Window end must be later than window start.";
        summaryMessages.push("Window rule failed: windowStart must be earlier than windowEnd.");
      }

      if (parsedAnnouncementDate && parsedWindowStart && parsedAnnouncementDate > parsedWindowStart) {
        errors.announcementDate = "Announcement date must be on or before window start.";
        summaryMessages.push("Announcement rule failed: announcementDate must be on or before windowStart.");
      }

      if (parsedEffectiveDate && parsedWindowStart && parsedEffectiveDate > parsedWindowStart) {
        errors.effectiveDate = "Effective date cannot be later than window start.";
        summaryMessages.push("Window rule failed: effectiveDate cannot be later than windowStart.");
      }
    }

    if (parsedMaxRedemptionQuantity <= 0) {
      errors.maxRedemptionQuantityPerInvestor = "Max redemption quantity per investor must be greater than 0.";
      summaryMessages.push("Limit rule failed: max redemption quantity per investor must be greater than 0.");
    }

    if (Number.isNaN(parsedNoticePeriodDays) || parsedNoticePeriodDays < MIN_NOTICE_PERIOD_DAYS) {
      errors.noticePeriodDays = `Notice period must be at least ${MIN_NOTICE_PERIOD_DAYS} day(s).`;
      summaryMessages.push(errors.noticePeriodDays);
    } else if (redemptionMode === "Window-based" && noticeGapDays !== null && parsedNoticePeriodDays < noticeGapDays) {
      errors.noticePeriodDays = `Notice period must be at least ${noticeGapDays} day(s), matching announcement-to-window gap.`;
      summaryMessages.push(
        `Announcement rule failed: notice period (${parsedNoticePeriodDays}) is shorter than required minimum (${noticeGapDays}).`,
      );
    }

    if (redemptionMode === "Window-based") {
      if (errors.windowStart) {
        summaryMessages.push(errors.windowStart);
      }
      if (errors.windowEnd) {
        summaryMessages.push(errors.windowEnd);
      }
    }

    setFormErrors(errors);
    setErrorSummary(summaryMessages);

    return { isValid: Object.keys(errors).length === 0, errors };
  };

  const handleCreate = () => {
    const { isValid, errors } = validateForm();

    if (!isValid) {
      if (errors.selectedFundId) {
        setActiveTab("about-fund");
      } else {
        setActiveTab("rules");
      }
      return;
    }

    const now = new Date();
    const redemptionId = `redemption-${Date.now()}`;
    const createdTime = format(now, "yyyy-MM-dd HH:mm:ss");

    addFundRedemption({
      id: redemptionId,
      fundId: selectedFund.id,
      name: `${selectedFund.name} Redemption Setup`,
      description:
        redemptionMode === "Daily dealing"
          ? "Daily dealing redemption configuration for ongoing open-end operations."
          : "Window-based redemption configuration for open-end fund operations.",
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
      latestNav: selectedFund.currentNav,
      settlementCycle: selectedFund.settlementCycle || "T+1",
      noticePeriodDays: Number(noticePeriodDays) || 0,
      maxRedemptionQuantityPerInvestor: `${maxRedemptionQuantityPerInvestor || "0"} units`,
      manualApprovalRequired,
      pauseRedemptionAfterListing: pauseAfterListing,
      cutOffTime: selectedFund.dealingCutoffTime || "16:00 HKT",
      createdTime,
    });

    toast.success("Redemption dealing setup created", {
      description: "The open-end redemption configuration has been saved as a draft.",
      action: {
        label: "View Detail",
        onClick: () => navigate(`/fund-redemption/${redemptionId}`),
      },
    });

    navigate(`/fund-redemption/${redemptionId}`);
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 style={{ fontFamily: "var(--font-heading)" }}>Configure Fund Redemption</h1>
        <p className="text-muted-foreground mt-2">
          Link redemption dealing rules to an existing open-end fund instead of hand-creating a one-off event.
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
              {errorSummary.length > 0 && (
                <Alert variant="destructive">
                  <AlertTitle>Unable to create redemption setup</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 space-y-1">
                      {errorSummary.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>Select Fund</Label>
                <Select value={selectedFundId} onValueChange={setSelectedFundId}>
                  <SelectTrigger aria-invalid={!!formErrors.selectedFundId}>
                    <SelectValue placeholder="Select an open-end fund" />
                  </SelectTrigger>
                  <SelectContent>
                    {openEndFunds.map((fund) => (
                      <SelectItem key={fund.id} value={fund.id}>
                        {fund.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.selectedFundId && <p className="text-sm text-destructive">{formErrors.selectedFundId}</p>}
              </div>

              {selectedFund ? (
                <div className="rounded-lg border bg-secondary/50 p-5 space-y-3 text-sm">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Fund token</span>
                      <span className="font-medium">{selectedFund.tokenName}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Current NAV</span>
                      <span className="font-medium">{selectedFund.currentNav}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Dealing frequency</span>
                      <span className="font-medium">{selectedFund.dealingFrequency || "Daily"}</span>
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
                  No open-end funds are available yet. Create an open-end fund first.
                </div>
              )}

              <div className="space-y-2">
                <Label>Redemption mode</Label>
                <Select value={redemptionMode} onValueChange={(value) => setRedemptionMode(value as "Daily dealing" | "Window-based")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daily dealing">Daily dealing</SelectItem>
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
              {errorSummary.length > 0 && (
                <Alert variant="destructive">
                  <AlertTitle>Please fix the following issues</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 space-y-1">
                      {errorSummary.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Effective date</Label>
                  <Input
                    aria-invalid={!!formErrors.effectiveDate}
                    type="datetime-local"
                    value={effectiveDate}
                    onChange={(event) => setEffectiveDate(event.target.value)}
                  />
                  {formErrors.effectiveDate && <p className="text-sm text-destructive">{formErrors.effectiveDate}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Announcement date</Label>
                  <Input
                    aria-invalid={!!formErrors.announcementDate}
                    type="datetime-local"
                    value={announcementDate}
                    onChange={(event) => setAnnouncementDate(event.target.value)}
                  />
                  {formErrors.announcementDate && <p className="text-sm text-destructive">{formErrors.announcementDate}</p>}
                </div>
              </div>

              {redemptionMode === "Window-based" && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Window start</Label>
                    <Input
                      aria-invalid={!!formErrors.windowStart}
                      type="datetime-local"
                      value={windowStart}
                      onChange={(event) => setWindowStart(event.target.value)}
                    />
                    {formErrors.windowStart && <p className="text-sm text-destructive">{formErrors.windowStart}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Window end</Label>
                    <Input
                      aria-invalid={!!formErrors.windowEnd}
                      type="datetime-local"
                      value={windowEnd}
                      onChange={(event) => setWindowEnd(event.target.value)}
                    />
                    {formErrors.windowEnd && <p className="text-sm text-destructive">{formErrors.windowEnd}</p>}
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Notice period (days)</Label>
                  <Input
                    aria-invalid={!!formErrors.noticePeriodDays}
                    type="number"
                    value={noticePeriodDays}
                    onChange={(event) => setNoticePeriodDays(event.target.value)}
                  />
                  {formErrors.noticePeriodDays && <p className="text-sm text-destructive">{formErrors.noticePeriodDays}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Max redemption quantity per investor</Label>
                  <Input
                    aria-invalid={!!formErrors.maxRedemptionQuantityPerInvestor}
                    type="number"
                    value={maxRedemptionQuantityPerInvestor}
                    onChange={(event) => setMaxRedemptionQuantityPerInvestor(event.target.value)}
                  />
                  {formErrors.maxRedemptionQuantityPerInvestor && (
                    <p className="text-sm text-destructive">{formErrors.maxRedemptionQuantityPerInvestor}</p>
                  )}
                </div>
              </div>

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
                      Useful for window-based setups that should remain announced until manually opened.
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
          <Card>
            <CardContent className="pt-6 space-y-4">
              {errorSummary.length > 0 && (
                <Alert variant="destructive">
                  <AlertTitle>Creation blocked by validation rules</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 space-y-1">
                      {errorSummary.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

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
                  <span className="font-medium">{selectedFund?.currentNav || "N/A"}</span>
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

              <div className="rounded-lg border p-5 space-y-3 text-sm">
                <div className="font-medium">规则检查摘要</div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">公告规则（公告日 &amp; 通知期）</span>
                  <span className={`font-medium ${ruleChecks.announcementRulePass ? "text-green-600" : "text-destructive"}`}>
                    {ruleChecks.announcementRulePass ? "通过" : "未通过"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">窗口规则（生效日 / 开窗 / 关窗）</span>
                  <span className={`font-medium ${ruleChecks.windowRulePass ? "text-green-600" : "text-destructive"}`}>
                    {ruleChecks.windowRulePass ? "通过" : "未通过"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">限额规则（单投资者赎回上限）</span>
                  <span className={`font-medium ${ruleChecks.limitRulePass ? "text-green-600" : "text-destructive"}`}>
                    {ruleChecks.limitRulePass ? "通过" : "未通过"}
                  </span>
                </div>
                {ruleChecks.noticeGapDays !== null && redemptionMode === "Window-based" && (
                  <p className="text-muted-foreground">
                    公告到开窗最小间隔：{ruleChecks.noticeGapDays} 天，当前通知期：{parsedNoticePeriodDays} 天。
                  </p>
                )}
              </div>

              <p className="text-sm text-muted-foreground">
                The resulting detail page will act as a redemption operations dashboard with request lists, batch history, and redemption status controls.
              </p>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("rules")}>
                  Back
                </Button>
                <Button disabled={!selectedFund} onClick={handleCreate}>
                  Create Redemption Setup
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
