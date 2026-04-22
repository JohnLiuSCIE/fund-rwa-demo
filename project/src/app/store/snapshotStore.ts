import { readEvents, type ListingRecord } from "./eventStore";

const SNAPSHOT_KEY = "fund_demo.snapshot.v2";

function reduceListing(events: ReturnType<typeof readEvents>) {
  const map = new Map<string, ListingRecord>();

  events.forEach((event) => {
    const current = map.get(event.aggregateId);

    if (!current) {
      const next: ListingRecord = {
        listingId: event.aggregateId,
        tenantId: String(event.payload.tenantId || event.actor.tenantId || "unknown-tenant"),
        name: String(event.payload.name || "Untitled Listing"),
        step: (event.payload.step as ListingRecord["step"]) || 1,
        status: event.payload.status || "Draft",
        version: event.expectedVersion + 1,
        updatedAt: event.ts,
        updatedBy: event.actor.userId,
        reviewComment: event.payload.reviewComment,
      };
      map.set(event.aggregateId, next);
      return;
    }

    map.set(event.aggregateId, {
      ...current,
      ...event.payload,
      version: event.expectedVersion + 1,
      updatedAt: event.ts,
      updatedBy: event.actor.userId,
    });
  });

  return Array.from(map.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function rebuildSnapshot() {
  const readModel = reduceListing(readEvents());
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(readModel));
  return readModel;
}

export function readSnapshot(): ListingRecord[] {
  const raw = localStorage.getItem(SNAPSHOT_KEY);
  if (!raw) return rebuildSnapshot();

  try {
    return JSON.parse(raw) as ListingRecord[];
  } catch {
    return rebuildSnapshot();
  }
}

export function clearSnapshot() {
  localStorage.removeItem(SNAPSHOT_KEY);
}

export const SNAPSHOT_STORE_KEY = SNAPSHOT_KEY;
