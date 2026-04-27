import { useMemo, useState } from "react";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ChartContainer, ChartTooltip } from "./ui/chart";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import type { FundDistribution, FundIssuance, FundRedemptionConfig } from "../data/fundDemoData";
import {
  buildExtendedNavHistory,
  buildFundNavTimeline,
  formatDateTag,
  FUND_EVENT_META,
  getLatestFundNavLabel,
  toDateFromTag,
} from "../lib/fundNav";

type NavViewMode = "day" | "month" | "year";

function toBucketKey(dateTag: string, viewMode: NavViewMode) {
  if (viewMode === "year") return dateTag.slice(0, 4);
  if (viewMode === "month") return dateTag.slice(0, 7);
  return dateTag;
}

function bucketKeyToDate(value: string, viewMode: NavViewMode) {
  if (viewMode === "year") return new Date(`${value}-01-01T00:00:00`);
  if (viewMode === "month") return new Date(`${value}-01T00:00:00`);
  return toDateFromTag(value);
}

function formatBucketLabel(value: string, viewMode: NavViewMode) {
  if (viewMode === "year") return value;
  if (viewMode === "month") {
    return new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit" }).format(
      bucketKeyToDate(value, viewMode),
    );
  }
  return formatDateTag(value);
}

function formatBucketFullLabel(value: string, viewMode: NavViewMode) {
  if (viewMode === "year") return value;
  if (viewMode === "month") {
    return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
      bucketKeyToDate(value, viewMode),
    );
  }
  return formatDateTag(value, { month: "short", day: "numeric", year: "numeric" });
}

function buildPresentedTimeline(
  timeline: ReturnType<typeof buildFundNavTimeline>,
  viewMode: NavViewMode,
  defaultPhaseLabel: string,
) {
  const pointMap = new Map<
    string,
    { bucket: string; navValue: number | null; markerNavValue: number; sourceDateTag: string }
  >();

  timeline.chartPoints.forEach((point) => {
    const bucket = toBucketKey(point.dateTag, viewMode);
    pointMap.set(bucket, {
      bucket,
      navValue: point.navValue ?? pointMap.get(bucket)?.navValue ?? null,
      markerNavValue: point.markerNavValue,
      sourceDateTag: point.dateTag,
    });
  });

  const chartPoints = Array.from(pointMap.values()).sort((left, right) =>
    bucketKeyToDate(left.bucket, viewMode).getTime() - bucketKeyToDate(right.bucket, viewMode).getTime(),
  );

  const eventMap = new Map<
    string,
    {
      id: string;
      bucket: string;
      type: keyof typeof FUND_EVENT_META;
      labels: string[];
    }
  >();

  timeline.eventDots.forEach((event) => {
    const bucket = toBucketKey(event.dateTag, viewMode);
    const mapKey = `${bucket}-${event.type}`;
    const existing = eventMap.get(mapKey);

    if (existing) {
      existing.labels.push(event.label);
      return;
    }

    eventMap.set(mapKey, {
      id: event.id,
      bucket,
      type: event.type,
      labels: [event.label],
    });
  });

  const milestones = Array.from(eventMap.values())
    .sort((left, right) =>
      bucketKeyToDate(left.bucket, viewMode).getTime() - bucketKeyToDate(right.bucket, viewMode).getTime(),
    )
    .map((event, index, allEvents) => ({
      ...event,
      label:
        event.labels.length === 1 ? event.labels[0] : `${event.labels[0]} +${event.labels.length - 1}`,
      showLabel: index >= Math.max(allEvents.length - (viewMode === "day" ? 6 : 4), 0),
    }))
    .filter((event) => !["subscription", "redemption"].includes(event.type));

  const windows = timeline.windows.map((window) => ({
    ...window,
    startBucket: toBucketKey(window.startDateTag, viewMode),
    endBucket: toBucketKey(window.endDateTag, viewMode),
  }));

  const buckets = chartPoints.map((point) => point.bucket);
  const phases: Array<{ id: string; label: string; type: "default" | "subscription" | "redemption"; span: number }> = [];

  buckets.forEach((bucket, index) => {
    const matchingWindow = windows.find((window) => {
      const current = bucketKeyToDate(bucket, viewMode).getTime();
      const start = bucketKeyToDate(window.startBucket, viewMode).getTime();
      const end = bucketKeyToDate(window.endBucket, viewMode).getTime();
      return current >= start && current <= end;
    });

    const currentLabel = matchingWindow
      ? matchingWindow.type === "subscription"
        ? matchingWindow.label
        : "Redemption window"
      : defaultPhaseLabel;
    const currentType = matchingWindow ? matchingWindow.type : "default";

    const previous = phases[phases.length - 1];
    if (previous && previous.label === currentLabel && previous.type === currentType) {
      previous.span += 1;
      return;
    }

    phases.push({
      id: `${bucket}-${currentLabel}`,
      label: currentLabel,
      type: currentType,
      span: 1,
    });
  });

  const minNav = Math.min(...timeline.chartPoints.map((point) => point.markerNavValue));
  const maxNav = Math.max(...timeline.chartPoints.map((point) => point.markerNavValue));
  const navPadding = Math.max((maxNav - minNav) * 0.2, maxNav * 0.003, 0.003);

  return {
    chartPoints,
    milestones,
    windows,
    phases,
    minNav: Number((Math.min(...timeline.chartPoints.map((point) => point.markerNavValue)) - navPadding).toFixed(4)),
    maxNav: Number((maxNav + navPadding).toFixed(4)),
  };
}

export function FundNavEventsCard({
  fundData,
  relatedRedemptions,
  relatedDistributions,
}: {
  fundData: FundIssuance;
  relatedRedemptions: FundRedemptionConfig[];
  relatedDistributions: FundDistribution[];
}) {
  const timeline = buildFundNavTimeline(fundData, relatedRedemptions, relatedDistributions);
  const [viewMode, setViewMode] = useState<NavViewMode>("day");
  const defaultPhaseLabel =
    fundData.fundType === "Open-end" ? "Daily dealing period" : "Closed operation period";
  const presented = useMemo(
    () => buildPresentedTimeline(timeline, viewMode, defaultPhaseLabel),
    [defaultPhaseLabel, timeline, viewMode],
  );
  const latestNavRecord = timeline.navHistory[timeline.navHistory.length - 1];
  const hasSubscriptionWindow = presented.windows.some((window) => window.type === "subscription");
  const hasRedemptionWindow = presented.windows.some((window) => window.type === "redemption");
  const chartConfig = {
    nav: { label: "NAV", color: "#1d4ed8" },
    subscription: { label: FUND_EVENT_META.subscription.label, color: FUND_EVENT_META.subscription.dotColor },
    redemption: { label: FUND_EVENT_META.redemption.label, color: FUND_EVENT_META.redemption.dotColor },
    distribution: { label: FUND_EVENT_META.distribution.label, color: FUND_EVENT_META.distribution.dotColor },
    oracle: { label: FUND_EVENT_META.oracle.label, color: FUND_EVENT_META.oracle.dotColor },
    manual: { label: FUND_EVENT_META.manual.label, color: FUND_EVENT_META.manual.dotColor },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>NAV & Fund Events</CardTitle>
        <p className="text-sm text-muted-foreground">
          This view shows the fund's own market-facing attributes over time: NAV history, subscription
          windows, redemption windows, and distribution milestones. It stays separate from the issuer's
          workflow actions on the progress bar.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">NAV source</div>
            <div className="mt-1 font-medium">{fundData.navUpdateMode || "Manual"}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Provider / owner</div>
            <div className="mt-1 font-medium">
              {fundData.navUpdateMode === "Oracle Feed"
                ? fundData.oracleProvider || "Oracle provider pending"
                : "Issuer / NAV committee"}
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Latest NAV</div>
            <div className="mt-1 font-medium">
              {latestNavRecord.navValue.toFixed(4)} {latestNavRecord.currency}
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Last update</div>
            <div className="mt-1 font-medium">
              {fundData.oracleLastSyncedAt || fundData.lastNavUpdateTime || latestNavRecord.updatedAt}
            </div>
          </div>
        </div>

        {fundData.navUpdateMode === "Oracle Feed" ? (
          <div className="rounded-lg border bg-emerald-50/70 p-4 text-sm">
            <div className="font-medium text-emerald-900">
              Oracle feed: {fundData.oracleFeedId || "Feed ID pending"}
            </div>
            <div className="mt-1 text-emerald-800">
              Update frequency: {fundData.oracleUpdateFrequency || "Configured by issuer"}
            </div>
            {fundData.oracleFallbackRule && (
              <div className="mt-2 text-emerald-900">Fallback: {fundData.oracleFallbackRule}</div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border bg-slate-50 p-4 text-sm">
            <div className="font-medium text-slate-900">Manual NAV governance</div>
            <div className="mt-1 text-slate-700">
              {fundData.oracleFallbackRule || "NAV is manually reviewed and published by the issuer for this demo."}
            </div>
          </div>
        )}

        <div className="relative">
          <div className="absolute right-3 top-3 z-10 flex rounded-lg border bg-background/95 p-1 shadow-sm">
            {(["day", "month", "year"] as NavViewMode[]).map((mode) => (
              <Button
                key={mode}
                type="button"
                variant={viewMode === mode ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode(mode)}
                className="capitalize"
              >
                {mode}
              </Button>
            ))}
          </div>
          <ChartContainer config={chartConfig} className="h-[420px] w-full">
            <ComposedChart data={presented.chartPoints} margin={{ top: 44, right: 24, left: 12, bottom: 64 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="bucket"
                tickLine={false}
                axisLine={false}
                minTickGap={24}
                tickFormatter={(value) => formatBucketLabel(String(value), viewMode)}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={80}
                domain={[presented.minNav, presented.maxNav]}
                tickFormatter={(value) => Number(value).toFixed(4)}
              />
              <ChartTooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length || !label) return null;

                  const navEntry = payload.find((item) => item.dataKey === "navValue" && item.value !== null);

                  return (
                    <div className="min-w-[14rem] rounded-lg border bg-background px-3 py-2 text-xs shadow-xl">
                      <div className="font-medium">
                        {formatBucketFullLabel(String(label), viewMode)}
                      </div>
                      {navEntry?.value !== undefined && (
                        <div className="mt-2">
                          NAV: {Number(navEntry.value).toFixed(4)} {fundData.navCurrency}
                        </div>
                      )}
                    </div>
                  );
                }}
              />

              {presented.windows.map((window) => (
                <ReferenceArea
                  key={window.id}
                  x1={window.startBucket}
                  x2={window.endBucket}
                  strokeOpacity={0}
                  fill={window.type === "subscription" ? "#bfdbfe" : "#fde68a"}
                  fillOpacity={0.3}
                  label={{
                    value: window.type === "subscription" ? window.label : "Redemption window",
                    position: "insideTop",
                    fill: window.type === "subscription" ? "#1d4ed8" : "#b45309",
                    fontSize: 11,
                  }}
                />
              ))}

              {presented.milestones.map((milestone) => (
                <ReferenceLine
                  key={milestone.id}
                  x={milestone.bucket}
                  stroke={FUND_EVENT_META[milestone.type].dotColor}
                  strokeDasharray="4 4"
                  ifOverflow="extendDomain"
                  label={
                    milestone.showLabel
                      ? {
                          value: milestone.label,
                          position: "top",
                          fill: FUND_EVENT_META[milestone.type].dotColor,
                          fontSize: 11,
                        }
                      : undefined
                  }
                />
              ))}

              <Line
                type="monotone"
                dataKey="navValue"
                name="nav"
                stroke="var(--color-nav)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "var(--color-nav)" }}
                activeDot={{ r: 5 }}
                connectNulls={false}
              />
            </ComposedChart>
          </ChartContainer>

          <div className="pointer-events-none absolute bottom-3 left-4 right-4 z-10">
            <div className="overflow-hidden rounded-xl border bg-background/92 shadow-sm">
              <div className="flex">
                {presented.phases.map((phase) => (
                  <div
                    key={phase.id}
                    style={{ flex: phase.span }}
                    className={
                      phase.type === "subscription"
                        ? "border-r bg-blue-50 px-3 py-2 text-center text-[11px] text-blue-700 last:border-r-0"
                        : phase.type === "redemption"
                          ? "border-r bg-amber-50 px-3 py-2 text-center text-[11px] text-amber-700 last:border-r-0"
                          : "border-r bg-slate-50 px-3 py-2 text-center text-[11px] text-slate-700 last:border-r-0"
                    }
                  >
                    <div className="font-medium">{phase.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {hasSubscriptionWindow && (
            <Badge className="border border-blue-200 bg-blue-50 text-blue-700">
              {fundData.fundType === "Open-end" ? "Initial subscription window" : "Subscription period"}
            </Badge>
          )}
          {hasRedemptionWindow && (
            <Badge className="border border-amber-200 bg-amber-50 text-amber-700">Redemption window</Badge>
          )}
          <Badge className="border border-slate-200 bg-slate-50 text-slate-700">{defaultPhaseLabel}</Badge>
          <Badge className="border border-violet-200 bg-violet-50 text-violet-700">Distribution milestone</Badge>
          <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">Oracle update</Badge>
          <Badge className="border border-slate-300 bg-white text-slate-700">Manual NAV update</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export function FundNavMiniPanel({
  fundData,
  relatedRedemptions,
  relatedDistributions,
}: {
  fundData: FundIssuance;
  relatedRedemptions: FundRedemptionConfig[];
  relatedDistributions: FundDistribution[];
}) {
  const timeline = buildFundNavTimeline(fundData, relatedRedemptions, relatedDistributions);
  const latest = timeline.navHistory[timeline.navHistory.length - 1];
  const recentEvents = timeline.events.slice(-3).reverse();

  return (
    <Card className="border-[var(--navy-100)] shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">NAV Surface</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border p-3">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Latest NAV</div>
            <div className="mt-2 font-medium">{getLatestFundNavLabel(fundData)}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">NAV Source</div>
            <div className="mt-2 font-medium">{fundData.navUpdateMode || "Manual"}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Last Update</div>
            <div className="mt-2 font-medium">{fundData.oracleLastSyncedAt || fundData.lastNavUpdateTime || latest.updatedAt}</div>
          </div>
        </div>

        <ChartContainer config={{ nav: { label: "NAV", color: "#1d4ed8" } }} className="h-[180px] w-full">
          <ComposedChart data={timeline.chartPoints} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="dateTag"
              tickLine={false}
              axisLine={false}
              minTickGap={20}
              tickFormatter={(value) => formatDateTag(String(value))}
            />
            <YAxis hide domain={[timeline.minNav, timeline.maxNav]} />
            <ChartTooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length || !label) return null;
                const navEntry = payload.find((item) => item.dataKey === "navValue" && item.value !== null);
                if (!navEntry) return null;

                return (
                  <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-xl">
                    <div className="font-medium">
                      {formatDateTag(String(label), { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                    <div className="mt-1">
                      NAV: {Number(navEntry.value).toFixed(4)} {fundData.navCurrency}
                    </div>
                  </div>
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="navValue"
              stroke="var(--color-nav)"
              strokeWidth={2.25}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls={false}
            />
          </ComposedChart>
        </ChartContainer>

        <div className="space-y-2">
          <div className="text-sm font-medium">Recent fund events</div>
          <div className="flex flex-wrap gap-2">
            {recentEvents.map((event) => (
              <Badge key={event.id} className={`border ${FUND_EVENT_META[event.type].badgeClassName}`}>
                {event.label}
              </Badge>
            ))}
            {recentEvents.length === 0 && <Badge variant="outline">No recent fund events</Badge>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FundNavSparkline({
  fundData,
  relatedRedemptions,
  relatedDistributions,
}: {
  fundData: FundIssuance;
  relatedRedemptions: FundRedemptionConfig[];
  relatedDistributions: FundDistribution[];
}) {
  const timeline = buildFundNavTimeline(fundData, relatedRedemptions, relatedDistributions);

  return (
    <ChartContainer config={{ nav: { label: "NAV", color: "#1d4ed8" } }} className="h-[72px] w-full">
      <ComposedChart data={timeline.chartPoints} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
        <YAxis hide domain={[timeline.minNav, timeline.maxNav]} />
        <XAxis hide dataKey="dateTag" />
        <Line
          type="monotone"
          dataKey="navValue"
          stroke="var(--color-nav)"
          strokeWidth={2}
          dot={false}
          connectNulls={false}
        />
      </ComposedChart>
    </ChartContainer>
  );
}

export function FundNavRecordsTable({ fundData }: { fundData: FundIssuance }) {
  const records = buildExtendedNavHistory(fundData);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Raw NAV Records</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 font-medium">NAV Date</th>
                <th className="pb-3 font-medium">NAV</th>
                <th className="pb-3 font-medium">Updated At</th>
                <th className="pb-3 font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-b last:border-b-0">
                  <td className="py-3">{record.navDate}</td>
                  <td className="py-3">
                    {record.navValue.toFixed(4)} {record.currency}
                  </td>
                  <td className="py-3">{record.updatedAt}</td>
                  <td className="py-3 text-muted-foreground">{record.note || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
