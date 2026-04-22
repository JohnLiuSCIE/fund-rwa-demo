# API MAPPING DRAFT - RBAC & Maker-Checker

## Listing

- `POST /api/tenants/:tenantId/listings`
  - create draft by maker/admin
- `GET /api/tenants/:tenantId/listings`
  - list tenant listings
- `GET /api/listings/:listingId`
  - listing detail

## Workflow Actions

- `POST /api/listings/:listingId/actions/submit_for_review`
- `POST /api/listings/:listingId/actions/resubmit`
- `POST /api/listings/:listingId/actions/approve`
- `POST /api/listings/:listingId/actions/reject`
- `POST /api/listings/:listingId/actions/final_confirm`

## Platform Management

- `GET /api/platform/tenants`
- `POST /api/platform/tenants`
- `PATCH /api/platform/tenants/:tenantId`
- `GET /api/platform/tenants/:tenantId/listings` (read-only penetration)

## Event Stream / Audit

- `GET /api/listings/:listingId/events`
- `GET /api/platform/audit/events?tenantId=:tenantId`
