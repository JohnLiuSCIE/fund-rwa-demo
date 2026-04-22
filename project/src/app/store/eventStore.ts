import type { Role } from "../auth/roles";
import type { ListingAction, ListingStatus } from "../workflow/listingStateMachine";

export interface ListingRecord {
  listingId: string;
  tenantId: string;
  name: string;
  step: 1 | 2 | 3 | 4 | 5;
  status: ListingStatus;
  version: number;
  updatedAt: string;
  updatedBy: string;
  reviewComment?: string;
}

export interface DomainEvent {
  eventId: string;
  aggregateId: string;
  aggregateType: "Listing";
  eventType: "LISTING_CREATED" | "LISTING_UPDATED" | "LISTING_ACTION_APPLIED";
  action?: ListingAction;
  payload: Partial<ListingRecord>;
  actor: { userId: string; role: Role; tenantId?: string };
  ts: string;
  expectedVersion: number;
}

const EVENT_KEY = "fund_demo.events.v2";

export function readEvents(): DomainEvent[] {
  const raw = localStorage.getItem(EVENT_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as DomainEvent[];
  } catch {
    return [];
  }
}

export function appendEvent(event: DomainEvent): { ok: true } | { ok: false; reason: string } {
  const events = readEvents();
  const currentVersion = events
    .filter((item) => item.aggregateId === event.aggregateId)
    .reduce((acc, item) => Math.max(acc, item.expectedVersion + 1), 0);

  if (event.expectedVersion !== currentVersion) {
    return {
      ok: false,
      reason: `Version conflict. expected ${event.expectedVersion}, current ${currentVersion}`,
    };
  }

  localStorage.setItem(EVENT_KEY, JSON.stringify([...events, event]));
  return { ok: true };
}

export function clearEventStore() {
  localStorage.removeItem(EVENT_KEY);
}

export const EVENT_STORE_KEY = EVENT_KEY;
