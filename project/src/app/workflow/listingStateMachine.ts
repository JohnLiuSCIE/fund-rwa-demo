import type { Role } from "../auth/roles";

export type ListingStatus =
  | "Draft"
  | "PendingReview"
  | "ChangesRequested"
  | "ApprovedInternal"
  | "Listed";

export type ListingAction =
  | "save_draft"
  | "submit_for_review"
  | "resubmit"
  | "approve"
  | "reject"
  | "final_confirm";

const ROLE_ACTION_MAP: Partial<Record<Role, ListingAction[]>> = {
  tenant_maker: ["save_draft", "submit_for_review", "resubmit"],
  tenant_admin: ["save_draft", "submit_for_review", "resubmit"],
  tenant_checker: ["approve", "reject", "final_confirm"],
};

const TRANSITIONS: Record<ListingStatus, Partial<Record<ListingAction, ListingStatus>>> = {
  Draft: {
    save_draft: "Draft",
    submit_for_review: "PendingReview",
  },
  PendingReview: {
    reject: "ChangesRequested",
    approve: "ApprovedInternal",
  },
  ChangesRequested: {
    save_draft: "ChangesRequested",
    resubmit: "PendingReview",
  },
  ApprovedInternal: {
    final_confirm: "Listed",
  },
  Listed: {},
};

export interface TransitionResult {
  ok: boolean;
  status: ListingStatus;
  reason?: string;
}

export function canRoleDoAction(role: Role, action: ListingAction): boolean {
  return Boolean(ROLE_ACTION_MAP[role]?.includes(action));
}

export function transitionListingStatus(
  current: ListingStatus,
  action: ListingAction,
  actorRole: Role,
): TransitionResult {
  if (!canRoleDoAction(actorRole, action)) {
    return { ok: false, status: current, reason: `${actorRole} cannot execute ${action}` };
  }

  const next = TRANSITIONS[current][action];
  if (!next) {
    return {
      ok: false,
      status: current,
      reason: `Action ${action} is invalid when status is ${current}`,
    };
  }

  return { ok: true, status: next };
}
