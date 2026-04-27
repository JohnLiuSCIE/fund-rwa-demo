import type {
  FundDistribution,
  FundIssuance,
  FundRedemptionConfig,
  NavRecord,
} from "../data/fundDemoData";

export type FundEventType = "subscription" | "redemption" | "distribution" | "oracle" | "manual";

export interface FundTimelineEvent {
  id: string;
  dateTag: string;
  label: string;
  detail: string;
  type: FundEventType;
}

export interface FundWindowOverlay {
  id: string;
  startDateTag: string;
  endDateTag: string;
  label: string;
  type: "subscription" | "redemption";
}

export interface FundNavPoint {
  dateTag: string;
  navValue: number | null;
  markerNavValue: number;
}

export const FUND_EVENT_META: Record<
  FundEventType,
  { label: string; dotColor: string; badgeClassName: string }
> = {
  subscription: {
    label: "Subscription window",
    dotColor: "#2563eb",
    badgeClassName: "border-blue-200 bg-blue-50 text-blue-700",
  },
  redemption: {
    label: "Redemption window",
    dotColor: "#d97706",
    badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
  },
  distribution: {
    label: "Distribution event",
    dotColor: "#7c3aed",
    badgeClassName: "border-violet-200 bg-violet-50 text-violet-700",
  },
  oracle: {
    label: "Oracle sync",
    dotColor: "#059669",
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  manual: {
    label: "Manual NAV update",
    dotColor: "#6b7280",
    badgeClassName: "border-slate-200 bg-slate-50 text-slate-700",
  },
};

function nowString() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

export function toDateTag(value?: string | null) {
  const match = value?.match(/\d{4}-\d{2}-\d{2}/);
  return match?.[0] ?? null;
}

export function toDateFromTag(dateTag: string) {
  return new Date(`${dateTag}T00:00:00`);
}

export function sortByDateTag(a: string, b: string) {
  return toDateFromTag(a).getTime() - toDateFromTag(b).getTime();
}

export function formatDateTag(dateTag: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(options || {}),
  }).format(toDateFromTag(dateTag));
}

export function getLatestFundNavValue(fund: FundIssuance) {
  return fund.currentNavValue || fund.initialNavValue || 0;
}

export function getLatestFundNavLabel(fund: FundIssuance) {
  return fund.currentNav || fund.initialNav;
}

function shouldShowSubscriptionWindow(fund: FundIssuance) {
  return fund.fundType === "Closed-end" || fund.status === "Initial Subscription";
}

function getSubscriptionWindowLabel(fund: FundIssuance) {
  return fund.fundType === "Open-end" ? "Initial subscription window" : "Subscription period";
}

export function buildExtendedNavHistory(fund: FundIssuance): NavRecord[] {
  const fallbackDateTag =
    toDateTag(fund.lastNavUpdateTime) || toDateTag(fund.issueDate) || toDateTag(nowString())!;
  const fallbackHistory =
    fund.navHistory.length > 0
      ? [...fund.navHistory]
      : [
          {
            id: `nav-${fund.id}-fallback`,
            navDate: fallbackDateTag,
            navValue: getLatestFundNavValue(fund) || 1,
            currency: fund.navCurrency,
            updatedAt: fund.lastNavUpdateTime || nowString(),
            note: "Generated fallback NAV record for demo charting",
          },
        ];

  const sortedActual = [...fallbackHistory].sort((left, right) =>
    sortByDateTag(left.navDate, right.navDate),
  );

  const targetCount = Math.max(sortedActual.length, fund.fundType === "Open-end" ? 10 : 7);
  if (sortedActual.length >= targetCount) return sortedActual;

  const firstActual = sortedActual[0];
  const firstActualDate = toDateFromTag(firstActual.navDate);
  const firstActualValue = firstActual.navValue || fund.initialNavValue || 1;
  const baseStartValue = fund.initialNavValue || firstActualValue;
  const missingCount = targetCount - sortedActual.length;
  const volatility = fund.navUpdateMode === "Oracle Feed" ? 0.0028 : 0.0014;

  const generatedHistory = Array.from({ length: missingCount }, (_, index) => {
    const pointDate = new Date(firstActualDate);
    pointDate.setDate(firstActualDate.getDate() - (missingCount - index));
    const progress = (index + 1) / (missingCount + 1);
    const baseValue = baseStartValue + (firstActualValue - baseStartValue) * progress;
    const wave = Math.sin((index + 1) * 1.15) * baseStartValue * volatility;
    const navValue = Number(Math.max(baseValue + wave, 0.0001).toFixed(4));
    const navDate = pointDate.toISOString().slice(0, 10);

    return {
      id: `nav-${fund.id}-generated-${index + 1}`,
      navDate,
      navValue,
      currency: fund.navCurrency,
      updatedAt: `${navDate} 18:00:00`,
      note:
        fund.navUpdateMode === "Oracle Feed"
          ? "Generated oracle-style history for demo visualization"
          : "Generated manual NAV history for demo visualization",
    };
  });

  return [...generatedHistory, ...sortedActual];
}

export function buildFundTimelineEvents(
  fund: FundIssuance,
  relatedRedemptions: FundRedemptionConfig[],
  relatedDistributions: FundDistribution[],
) {
  const events: FundTimelineEvent[] = [];

  const subscriptionStart = toDateTag(fund.subscriptionStartDate);
  const subscriptionEnd = toDateTag(fund.subscriptionEndDate);
  if (shouldShowSubscriptionWindow(fund) && subscriptionStart) {
    events.push({
      id: `${fund.id}-subscription-open`,
      dateTag: subscriptionStart,
      label: "Subscription opens",
      detail: "Initial subscription window opens for fund onboarding and launch orders.",
      type: "subscription",
    });
  }
  if (shouldShowSubscriptionWindow(fund) && subscriptionEnd) {
    events.push({
      id: `${fund.id}-subscription-close`,
      dateTag: subscriptionEnd,
      label: "Subscription closes",
      detail: "Initial subscription window closes and launch orders are locked.",
      type: "subscription",
    });
  }

  const navSourceDate = toDateTag(fund.oracleLastSyncedAt || fund.lastNavUpdateTime);
  if (navSourceDate) {
    events.push({
      id: `${fund.id}-${fund.navUpdateMode === "Oracle Feed" ? "oracle" : "manual"}-sync`,
      dateTag: navSourceDate,
      label: fund.navUpdateMode === "Oracle Feed" ? "Latest oracle sync" : "Latest manual NAV update",
      detail:
        fund.navUpdateMode === "Oracle Feed"
          ? `${fund.oracleProvider || "Oracle feed"} published the latest demo NAV update.`
          : "Issuer or NAV committee manually confirmed the latest demo NAV update.",
      type: fund.navUpdateMode === "Oracle Feed" ? "oracle" : "manual",
    });
  }

  relatedRedemptions.forEach((redemption) => {
    const windowStart = toDateTag(redemption.windowStart || redemption.effectiveDate);
    const windowEnd = toDateTag(redemption.windowEnd);

    if (windowStart) {
      events.push({
        id: `${redemption.id}-open`,
        dateTag: windowStart,
        label: "Redemption window opens",
        detail: `${redemption.name} opens for redemption requests.`,
        type: "redemption",
      });
    }

    if (windowEnd) {
      events.push({
        id: `${redemption.id}-close`,
        dateTag: windowEnd,
        label: "Redemption window closes",
        detail: `${redemption.name} closes and the redemption batch moves to settlement.`,
        type: "redemption",
      });
    }
  });

  relatedDistributions.forEach((distribution) => {
    const recordDate = toDateTag(distribution.recordDate);
    const paymentDate = toDateTag(distribution.paymentDate);

    if (recordDate) {
      events.push({
        id: `${distribution.id}-record`,
        dateTag: recordDate,
        label: "Distribution record date",
        detail: `${distribution.name} freezes the eligible holder snapshot.`,
        type: "distribution",
      });
    }

    if (paymentDate) {
      events.push({
        id: `${distribution.id}-payment`,
        dateTag: paymentDate,
        label: "Distribution payment date",
        detail: `${distribution.name} is scheduled for payout or claim opening.`,
        type: "distribution",
      });
    }
  });

  return events.sort((left, right) => sortByDateTag(left.dateTag, right.dateTag));
}

export function buildFundWindowOverlays(
  fund: FundIssuance,
  relatedRedemptions: FundRedemptionConfig[],
) {
  const overlays: FundWindowOverlay[] = [];
  const subscriptionStart = toDateTag(fund.subscriptionStartDate);
  const subscriptionEnd = toDateTag(fund.subscriptionEndDate);

  if (shouldShowSubscriptionWindow(fund) && subscriptionStart && subscriptionEnd) {
    overlays.push({
      id: `${fund.id}-subscription-window`,
      startDateTag: subscriptionStart,
      endDateTag: subscriptionEnd,
      label: getSubscriptionWindowLabel(fund),
      type: "subscription",
    });
  }

  relatedRedemptions.forEach((redemption) => {
    const windowStart = toDateTag(redemption.windowStart || redemption.effectiveDate);
    const windowEnd = toDateTag(redemption.windowEnd);

    if (windowStart && windowEnd) {
      overlays.push({
        id: `${redemption.id}-window`,
        startDateTag: windowStart,
        endDateTag: windowEnd,
        label: redemption.name,
        type: "redemption",
      });
    }
  });

  return overlays.sort((left, right) => sortByDateTag(left.startDateTag, right.startDateTag));
}

export function buildFundNavTimeline(
  fund: FundIssuance,
  relatedRedemptions: FundRedemptionConfig[],
  relatedDistributions: FundDistribution[],
) {
  const navHistory = buildExtendedNavHistory(fund);
  const events = buildFundTimelineEvents(fund, relatedRedemptions, relatedDistributions);
  const windows = buildFundWindowOverlays(fund, relatedRedemptions);
  const navByDate = new Map(navHistory.map((record) => [record.navDate, record]));
  const dateTags = new Set<string>(navHistory.map((record) => record.navDate));

  events.forEach((event) => dateTags.add(event.dateTag));
  windows.forEach((window) => {
    dateTags.add(window.startDateTag);
    dateTags.add(window.endDateTag);
  });

  const sortedDateTags = Array.from(dateTags).sort(sortByDateTag);
  const actualNavValues = navHistory.map((record) => record.navValue);
  const minNav = Math.min(...actualNavValues);
  const maxNav = Math.max(...actualNavValues);
  const navPadding = Math.max((maxNav - minNav) * 0.25, maxNav * 0.003, 0.003);

  let latestKnownNav = navHistory[0]?.navValue || getLatestFundNavValue(fund) || 1;
  const chartPoints: FundNavPoint[] = sortedDateTags.map((dateTag) => {
    const record = navByDate.get(dateTag);
    if (record?.navValue !== undefined) {
      latestKnownNav = record.navValue;
    }

    return {
      dateTag,
      navValue: record?.navValue ?? null,
      markerNavValue: latestKnownNav,
    };
  });

  const chartPointMap = new Map(chartPoints.map((point) => [point.dateTag, point]));
  const stackedEventsByDate = new Map<string, number>();
  const eventDots = events.map((event) => {
    const point = chartPointMap.get(event.dateTag);
    const stackIndex = stackedEventsByDate.get(event.dateTag) || 0;
    stackedEventsByDate.set(event.dateTag, stackIndex + 1);

    return {
      ...event,
      markerNavValue: (point?.markerNavValue || latestKnownNav) + stackIndex * navPadding * 0.35,
    };
  });

  return {
    navHistory,
    events,
    windows,
    chartPoints,
    eventDots,
    minNav: Number((minNav - navPadding).toFixed(4)),
    maxNav: Number((maxNav + navPadding).toFixed(4)),
  };
}
