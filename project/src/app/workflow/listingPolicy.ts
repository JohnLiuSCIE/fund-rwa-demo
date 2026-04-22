import type { Role } from "../auth/roles";
import type { ListingStatus } from "./listingStateMachine";

const EDITABLE_BY_STATUS: Record<ListingStatus, Role[]> = {
  Draft: ["tenant_maker", "tenant_admin"],
  PendingReview: [],
  ChangesRequested: ["tenant_maker", "tenant_admin"],
  ApprovedInternal: [],
  Listed: [],
};

export function canEditListing(status: ListingStatus, role: Role): boolean {
  return EDITABLE_BY_STATUS[status].includes(role);
}

export function stageByStep(step: number): "maker" | "checker" {
  return step <= 3 ? "maker" : "checker";
}
