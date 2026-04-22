import { useMemo, useState } from "react";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
import { useRbacWorkflow } from "../modules/rbac/useRbacWorkflow";

const ACTIONS = [
  { key: "save_draft", label: "Save Draft" },
  { key: "submit_for_review", label: "Submit" },
  { key: "resubmit", label: "Resubmit" },
  { key: "approve", label: "Approve" },
  { key: "reject", label: "Reject" },
  { key: "final_confirm", label: "Final Confirm" },
] as const;

const UAT_CHECKLIST = [
  "Maker can create listing and keep status in Draft.",
  "Maker can submit Draft/ChangesRequested listing to PendingReview.",
  "Checker can approve/reject from PendingReview.",
  "Checker can final confirm ApprovedInternal to Listed.",
  "Platform user can view tenants and all tenant listings (read-only).",
  "Cross-tab sync works via BroadcastChannel/storage fallback.",
  "Version conflict shows warning and blocks stale write.",
];

const DEMO_SCRIPT = [
  "Step 1: switch to Alpha Maker and click Create Demo Listing.",
  "Step 2: run Submit action so listing enters PendingReview.",
  "Step 3: switch to Alpha Checker and run Approve -> Final Confirm.",
  "Step 4: switch to Platform Super Admin and verify penetrated read-only listing state is Listed.",
];

export function UserCenter() {
  const {
    users,
    tenants,
    events,
    currentUser,
    currentRole,
    tenantScopedListings,
    checkerQueue,
    error,
    stageByStep,
    setCurrentUserId,
    createListing,
    applyAction,
    resetAll,
  } = useRbacWorkflow();

  const [comment, setComment] = useState("");

  const groupedByTenant = useMemo(() => {
    return tenants.map((tenant) => ({
      ...tenant,
      listings: tenantScopedListings.filter((item) => item.tenantId === tenant.tenantId),
    }));
  }, [tenantScopedListings, tenants]);

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl space-y-6">
      <div>
        <h1 style={{ fontFamily: "var(--font-heading)" }}>RBAC Workflow Workbench (WF-01 ~ WF-08)</h1>
        <p className="text-muted-foreground mt-2">
          Platform / Tenant Maker / Tenant Checker unified simulation with local event store and sync.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Persona Switcher (WF-01)</CardTitle>
          <CardDescription>Switch identity to verify scoped access control and data synchronization.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <Label>Active User</Label>
            <select
              className="w-full h-10 rounded-md border px-3 bg-background"
              value={currentUser.userId}
              onChange={(event) => setCurrentUserId(event.target.value)}
            >
              {users.map((user) => (
                <option key={user.userId} value={user.userId}>
                  {user.displayName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Input value={currentRole} disabled />
          </div>
          <div className="space-y-2">
            <Label>Tenant Scope</Label>
            <Input value={currentUser.tenantId || "platform-global"} disabled />
          </div>
        </CardContent>
      </Card>

      {error && <div className="text-sm rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700">{error}</div>}

      <Tabs defaultValue="tenant" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full h-auto">
          <TabsTrigger value="tenant">Tenant Workbench</TabsTrigger>
          <TabsTrigger value="platform">Platform View</TabsTrigger>
          <TabsTrigger value="sync">Sync & Events</TabsTrigger>
          <TabsTrigger value="uat">UAT</TabsTrigger>
          <TabsTrigger value="api">API Mapping Draft</TabsTrigger>
        </TabsList>

        <TabsContent value="tenant" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Maker / Checker Board (WF-03, WF-04)</CardTitle>
              <CardDescription>Create listings and run state-machine actions by role.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button onClick={createListing}>Create Demo Listing</Button>
                <Button variant="outline" onClick={resetAll}>Reset Demo Data</Button>
                <Badge variant="secondary">Checker Queue: {checkerQueue.length}</Badge>
              </div>

              <div className="space-y-3">
                <Label>Review Comment (for approve/reject)</Label>
                <Textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Enter checker note or rejection reason"
                />
              </div>

              <div className="space-y-3">
                {tenantScopedListings.length === 0 && (
                  <div className="text-sm text-muted-foreground">No listings yet. Create one from maker persona first.</div>
                )}
                {tenantScopedListings.map((record) => (
                  <div key={record.listingId} className="rounded-md border p-4 space-y-3">
                    <div className="flex flex-wrap gap-2 items-center justify-between">
                      <div className="font-medium">{record.name}</div>
                      <div className="text-xs text-muted-foreground">{record.listingId}</div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="outline">Status: {record.status}</Badge>
                      <Badge variant="outline">Step: {record.step}</Badge>
                      <Badge variant="outline">Owner Tenant: {record.tenantId}</Badge>
                      <Badge variant="outline">Version: {record.version}</Badge>
                      <Badge variant="outline">Current Stage: {stageByStep(record.step)}</Badge>
                    </div>
                    <div className="grid md:grid-cols-3 gap-2">
                      {ACTIONS.map((action) => (
                        <Button
                          key={action.key}
                          size="sm"
                          variant="secondary"
                          onClick={() => applyAction(record, action.key, comment)}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                    {record.reviewComment && (
                      <div className="text-xs text-muted-foreground">Latest review note: {record.reviewComment}</div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platform" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform Tenant Management & Penetration View (WF-05)</CardTitle>
              <CardDescription>Platform user can inspect tenant status and all products in read-only mode.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {groupedByTenant.map((tenant) => (
                <div key={tenant.tenantId} className="border rounded-md p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{tenant.tenantName}</div>
                      <div className="text-xs text-muted-foreground">{tenant.tenantId}</div>
                    </div>
                    <Badge>{tenant.status}</Badge>
                  </div>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    {tenant.listings.length === 0 ? (
                      <div className="text-muted-foreground">No listing records under this tenant.</div>
                    ) : (
                      tenant.listings.map((item) => (
                        <div key={item.listingId} className="flex items-center justify-between">
                          <span>{item.name}</span>
                          <Badge variant="outline">{item.status}</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Log / Snapshot / Conflict Handling (WF-06, WF-07)</CardTitle>
              <CardDescription>
                Append-only events with optimistic version check; open another tab to observe sync behavior.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {events.length === 0 ? (
                <div className="text-sm text-muted-foreground">No events yet.</div>
              ) : (
                events
                  .slice()
                  .reverse()
                  .map((event) => (
                    <div key={event.eventId} className="border rounded-md p-3 text-sm">
                      <div className="font-medium">{event.eventType}</div>
                      <div className="text-xs text-muted-foreground">
                        {event.aggregateId} · {event.actor.role} · expectedVersion={event.expectedVersion}
                      </div>
                    </div>
                  ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="uat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>UAT Checklist + Demo Script (WF-08)</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="font-medium">Checklist</div>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {UAT_CHECKLIST.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <div className="font-medium">Demo Script</div>
                <ol className="list-decimal list-inside text-sm space-y-1">
                  {DEMO_SCRIPT.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Mapping Draft (WF-08)</CardTitle>
              <CardDescription>Interface draft for future backend integration.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div><code>POST /api/tenants/:tenantId/listings</code> create listing draft (maker).</div>
              <div><code>POST /api/listings/:listingId/actions/submit_for_review</code> maker submit.</div>
              <div><code>POST /api/listings/:listingId/actions/approve</code> checker approve.</div>
              <div><code>POST /api/listings/:listingId/actions/reject</code> checker reject with comment.</div>
              <div><code>POST /api/listings/:listingId/actions/final_confirm</code> checker confirm listing.</div>
              <div><code>GET /api/platform/tenants/:tenantId/listings</code> platform read-only penetration.</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
