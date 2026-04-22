import { useCallback, useEffect, useMemo, useState } from "react";

import { can } from "../../auth/accessControl";
import type { Permission } from "../../auth/permissions";
import type { Role } from "../../auth/roles";
import { transitionListingStatus, type ListingAction } from "../../workflow/listingStateMachine";
import { canEditListing, stageByStep } from "../../workflow/listingPolicy";
import { appendEvent, clearEventStore, readEvents, type DomainEvent } from "../../store/eventStore";
import { clearSnapshot, rebuildSnapshot, readSnapshot, type ListingRecord } from "../../store/snapshotStore";
import { SyncBus } from "../../store/syncBus";
import { DEMO_TENANTS, DEMO_USERS } from "./demoData";

const syncBus = new SyncBus();

function eventId() {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function listingId() {
  return `listing-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function useRbacWorkflow() {
  const [currentUserId, setCurrentUserId] = useState(DEMO_USERS[0].userId);
  const [listings, setListings] = useState<ListingRecord[]>(() => readSnapshot());
  const [events, setEvents] = useState<DomainEvent[]>(() => readEvents());
  const [error, setError] = useState<string | null>(null);

  const currentUser = useMemo(
    () => DEMO_USERS.find((user) => user.userId === currentUserId) ?? DEMO_USERS[0],
    [currentUserId],
  );

  const currentRole = currentUser.roles[0] as Role;

  const refresh = useCallback(() => {
    setEvents(readEvents());
    setListings(rebuildSnapshot());
  }, []);

  useEffect(() => {
    const unsubscribe = syncBus.subscribe(() => refresh());
    return unsubscribe;
  }, [refresh]);

  const emit = useCallback(
    (event: Omit<DomainEvent, "eventId" | "ts">) => {
      const result = appendEvent({
        ...event,
        eventId: eventId(),
        ts: new Date().toISOString(),
      });

      if (!result.ok) {
        setError(result.reason);
        return false;
      }

      setError(null);
      refresh();
      syncBus.publish();
      return true;
    },
    [refresh],
  );

  const createListing = useCallback(() => {
    const tenantId = currentUser.tenantId ?? DEMO_TENANTS[0].tenantId;
    if (!can(currentUser, "tenant:listing:create", { tenantId })) {
      setError("当前角色不能创建上架项目。");
      return false;
    }

    return emit({
      aggregateId: listingId(),
      aggregateType: "Listing",
      eventType: "LISTING_CREATED",
      payload: {
        listingId: "",
        tenantId,
        name: `Demo Listing ${new Date().toLocaleTimeString()}`,
        step: 1,
        status: "Draft",
        version: 0,
      },
      actor: {
        userId: currentUser.userId,
        role: currentRole,
        tenantId,
      },
      expectedVersion: 0,
    });
  }, [currentUser, currentRole, emit]);

  const applyAction = useCallback(
    (record: ListingRecord, action: ListingAction, comment?: string) => {
      const permissionMap: Record<ListingAction, Permission> = {
        save_draft: "tenant:listing:update",
        submit_for_review: "tenant:listing:submit",
        resubmit: "tenant:listing:submit",
        approve: "tenant:listing:approve",
        reject: "tenant:listing:reject",
        final_confirm: "tenant:listing:final_confirm",
      };

      if (!can(currentUser, permissionMap[action], { tenantId: record.tenantId })) {
        setError(`当前角色没有权限执行 ${action}`);
        return false;
      }

      if (action === "save_draft" && !canEditListing(record.status, currentRole)) {
        setError("当前状态不可编辑，请等待审批结论。");
        return false;
      }

      const transition = transitionListingStatus(record.status, action, currentRole);
      if (!transition.ok) {
        setError(transition.reason || "状态流转失败");
        return false;
      }

      const nextStep = transition.status === "PendingReview" ? 4 : transition.status === "Listed" ? 5 : record.step;

      return emit({
        aggregateId: record.listingId,
        aggregateType: "Listing",
        eventType: "LISTING_ACTION_APPLIED",
        action,
        payload: {
          status: transition.status,
          step: nextStep,
          reviewComment: comment,
        },
        actor: {
          userId: currentUser.userId,
          role: currentRole,
          tenantId: record.tenantId,
        },
        expectedVersion: record.version,
      });
    },
    [currentRole, currentUser, emit],
  );

  const resetAll = useCallback(() => {
    clearEventStore();
    clearSnapshot();
    refresh();
    syncBus.publish();
  }, [refresh]);

  const tenantScopedListings = useMemo(() => {
    if (currentRole === "platform_super_admin") return listings;
    return listings.filter((item) => item.tenantId === currentUser.tenantId);
  }, [currentRole, currentUser.tenantId, listings]);

  const checkerQueue = useMemo(
    () => tenantScopedListings.filter((item) => item.status === "PendingReview"),
    [tenantScopedListings],
  );

  return {
    users: DEMO_USERS,
    tenants: DEMO_TENANTS,
    events,
    listings,
    tenantScopedListings,
    checkerQueue,
    currentUser,
    currentRole,
    error,
    setCurrentUserId,
    createListing,
    applyAction,
    resetAll,
    stageByStep,
  };
}
