# TICKET - Hong Kong Transfer Agent Client UI

Date: 2026-05-08  
Status: Draft for review  
Related architecture:

- `05_Architecture/Specs/SPEC - Hong Kong Transfer Agent Client.md`
- `05_Architecture/Specs/SPEC - Transfer Agency Data Contract and Synchronization.md`
- `04_User_Flows/FLOW - Hong Kong Transfer Agency Register Operations.md`

## 1. Goal

Create a dedicated Transfer Agent / Registrar client for the Hong Kong fund RWA demo.

The client should make the Transfer Agent role operationally accurate in a Hong Kong context:

- It maintains and controls the official holder / shareholder register.
- It reviews and posts register deltas.
- It reconciles register records against orders, cash evidence, NAV, token movements, and service-provider messages.
- It produces audit evidence for the Product Provider, trustee / custodian, auditors, and regulators.

This client should not treat Transfer Agent as a generic external approver.
The correct mental model is:

> Product Provider remains accountable; Transfer Agent operates the registrar / transfer-agency workflow and controls register-affecting changes.

## 2. User Goal

The TA operator logs in to clear register-affecting work safely.

Daily goals:

1. See which funds / classes have pending register work.
2. Review subscriptions, redemptions, wallet changes, transfers, and record-date events.
3. Confirm that each register delta has required evidence.
4. Post register updates with maker-checker control.
5. Resolve reconciliation breaks before releasing a register version.
6. Export evidence when asked by Product Provider, trustee / custodian, auditor, or regulator.

## 3. Information Hierarchy

1. Register health
2. Work queue requiring action
3. Blocking exceptions
4. Register versions and deltas
5. Token / cash / NAV reconciliation
6. Evidence and audit trail

## 4. Primary Action Language

Avoid generic `Approve`.

Use action labels that describe the actual TA function:

| Avoid | Use |
| --- | --- |
| `Approve Subscription` | `Post Issue Delta` |
| `Approve Redemption` | `Post Redemption Delta` |
| `Approve Distribution` | `Lock Record Date` / `Release Entitlement List` |
| `Confirm Cash` | `Use Cash Confirmation` / `Validate Cash Evidence` |
| `Mint Tokens` | `Release Mint Instruction` / `Reconcile Mint Event` |
| `Transfer Agent Confirmation` | `Register Posting Confirmation` |

## 5. Visual Direction

UI type:

- internal operations console
- dense fund-administration dashboard
- table-first workflow console

Visual direction:

- restrained Hong Kong financial-operations style
- compact tables, status badges, side drawers, timelines, evidence chips
- minimal explanatory text
- no hero section
- no generic gradient / marketing composition

Component strategy:

- reuse existing shadcn-style components already in the app
- use cards only for top metrics and repeated operational objects
- tables for queues and register rows
- tabs for detail pages
- sheet / drawer for register delta review
- badges for severity and status
- lucide icons only where they improve scan speed

Responsive behavior:

- desktop is primary
- tablet uses stacked panels
- mobile keeps the dashboard readable, but complex register tables may become compact row cards

## 6. Role Model

Add a third role:

```ts
type UserRole = "issuer" | "investor" | "transferAgent";
```

Recommended display labels:

| Internal role | UI label |
| --- | --- |
| `issuer` | `Product Provider` or `Issuer` |
| `investor` | `Investor` |
| `transferAgent` | `Transfer Agent` |

For demo consistency, keep `Issuer` in existing pages if renaming is too broad.
Inside TA pages, use `Product Provider` when showing responsibility boundaries.

## 7. Navigation

When logged in as `transferAgent`, top navigation should show:

1. `Dashboard`
2. `Work Queue`
3. `Holder Register`
4. `Dealing Cycles`
5. `Transfers`
6. `Reconciliation`
7. `Evidence`

Recommended route map:

| Route | Page |
| --- | --- |
| `/ta` | TA Dashboard |
| `/ta/queue` | Work Queue |
| `/ta/register` | Holder Register |
| `/ta/register/:fundId/:classId` | Register Detail |
| `/ta/dealing-cycles` | Dealing Cycle Queue |
| `/ta/dealing-cycles/:cycleId` | Dealing Cycle Detail |
| `/ta/transfers` | Transfers and Wallet Changes |
| `/ta/reconciliation` | Reconciliation Breaks |
| `/ta/evidence` | Evidence Packs |

## 8. Dashboard Page

### 8.1 Purpose

The dashboard answers:

- Is the register healthy?
- What must TA act on today?
- What is blocked?
- Which register versions were released?

### 8.2 Layout

Top metric strip:

| Metric | Example |
| --- | --- |
| `Pending Register Deltas` | `18` |
| `Critical Breaks` | `2` |
| `Cash-Blocked Postings` | `6` |
| `Wallet Mapping Exceptions` | `3` |
| `Register Versions Released Today` | `4` |

Main layout:

- left 65%: `Priority Work Queue`
- right 35%: `Exceptions Requiring Resolution`
- bottom: `Latest Register Versions`

### 8.3 Dashboard states

Loading:

- skeleton metric cards
- skeleton queue rows

Empty:

- title: `No register work pending`
- summary: `All register deltas are posted or waiting for external evidence.`
- CTA: `View Register Versions`

Error:

- title: `Register status unavailable`
- CTA: `Retry`
- secondary action: `Open Evidence`

Permission denied:

- title: `Transfer Agent access required`
- CTA: `Switch Role`

## 9. Work Queue Page

### 9.1 Queue filters

Filters:

- Fund
- Class
- Task Type
- SLA
- Severity
- Source
- Blocking Status
- Owner

Task type options:

- `Investor Onboarding`
- `Subscription Posting`
- `Redemption Posting`
- `Wallet Change`
- `Secondary Transfer`
- `Record Date`
- `Distribution Entitlement`
- `Register Correction`
- `Reconciliation Break`

### 9.2 Queue table columns

| Column | Notes |
| --- | --- |
| `Priority` | `Critical` / `High` / `Normal` |
| `SLA` | time remaining or overdue |
| `Fund / Class` | fund name and tokenised class |
| `Task` | task type and short name |
| `Source` | distributor, issuer, VATP, custodian, system |
| `Register Impact` | issue / redeem / transfer / restriction / correction |
| `Blocking Issue` | cash, NAV, KYC, wallet, token, approval |
| `Next Action` | action CTA |

### 9.3 Row drawer

When opening a queue row, show:

- source instruction
- holder / register account
- current register balance
- proposed delta
- cash status
- NAV status
- token status
- wallet whitelist status
- evidence checklist
- maker-checker timeline

Primary drawer CTA:

- `Prepare Register Delta`
- `Submit For Checker`
- `Post Register Update`
- `Resolve Break`

## 10. Holder Register Page

### 10.1 Purpose

This is the official working view of holder ownership records.

Tabs:

1. `Current Register`
2. `Register Versions`
3. `Holder Accounts`
4. `Wallet Links`
5. `Restrictions`
6. `Corrections`

### 10.2 Current Register table

Columns:

- Holder
- Register Account
- Fund
- Class
- Units / Shares
- Wallet
- Account Status
- Source
- Last Delta
- Last Reconciled

Important Hong Kong fields:

- legal holder name
- registered address
- holder type
- date entered in register
- date ceased, if applicable
- sub-fund / share class
- amount paid / considered paid, where OFC-style data is needed

### 10.3 Register Versions tab

Columns:

- Register Version
- Fund / Class
- Effective Time
- Released Time
- Total Holders
- Total Units
- Status
- Hash
- Released By

Actions:

- `View Delta Set`
- `Export Evidence`
- `Compare Previous`

### 10.4 Wallet Links tab

Columns:

- Holder
- Register Account
- Wallet
- Chain
- Proof Type
- Verification Status
- Whitelist Status
- Last Updated

Actions:

- `Verify Wallet Proof`
- `Suspend Wallet`
- `Replace Wallet`
- `Export Wallet Evidence`

## 11. Dealing Cycle Page

### 11.1 Purpose

Process primary subscription and redemption batches.

Tabs:

1. `Orders`
2. `Cash`
3. `NAV`
4. `Unit Calculation`
5. `Register Deltas`
6. `Reconciliation`

### 11.2 Subscription cycle logic

State flow:

1. `Order Received`
2. `Cash Pending`
3. `Cash Matched`
4. `NAV Pending`
5. `Units Calculated`
6. `Register Delta Pending`
7. `Token Mint Pending`
8. `Register Posted`
9. `Reconciled`

Blocking rules:

- no register issue delta without valid holder account
- no register issue delta without wallet binding, if token delivery is wallet-based
- no final unit amount before official NAV
- no posting if cash evidence is missing where pre-funding is required
- no release if minted token amount differs from register delta

### 11.3 Redemption cycle logic

State flow:

1. `Order Received`
2. `Units Reserved`
3. `NAV Pending`
4. `Cash Amount Calculated`
5. `Payment Instruction Ready`
6. `Token Burn Pending`
7. `Register Posted`
8. `Payment Reconciled`
9. `Closed`

Blocking rules:

- no redemption delta if holder balance is insufficient
- no payment list release before NAV and accepted units are final
- no close-out if burn / cancellation evidence is missing
- no close-out if payment status is not reconciled

## 12. Transfers Page

### 12.1 Purpose

Handle wallet changes, transfer restrictions, and primary-secondary market interoperability.

Tabs:

1. `Wallet Changes`
2. `Primary-Secondary Bridge`
3. `Restricted Transfers`
4. `Lost Key / Recovery`
5. `Suspensions`

### 12.2 Primary-secondary bridge

This tab is required if the fund supports secondary trading on an SFC-licensed VATP.

Key objects:

- VATP
- broker / connecting broker
- distributor
- market maker
- omnibus holder
- token movement
- register delta
- primary redemption eligibility

Three-way reconciliation:

| Source | Position |
| --- | --- |
| VATP / broker report | platform-side holdings |
| Token contract | on-chain balances |
| Official register | legal / operational holder record |

Common breaks:

- token moved but register not updated
- VATP omnibus balance differs from token balance
- holder attempts primary redemption from secondary channel without eligible register mapping
- transfer occurred while primary dealing or secondary trading is suspended

## 13. Reconciliation Page

### 13.1 Break types

| Break type | Example |
| --- | --- |
| `Register vs Token` | minted amount differs from posted issue delta |
| `Register vs Cash` | units posted but cash reference not matched |
| `Order vs Register` | accepted order not reflected in register |
| `Wallet Not Mapped` | token destination wallet not linked to holder |
| `Restricted Transfer` | transfer violates whitelist / restriction |
| `NAV Mismatch` | unit calculation uses stale NAV |
| `Duplicate Instruction` | same source instruction appears twice |

### 13.2 Break workflow

1. `Detected`
2. `Assigned`
3. `Evidence Attached`
4. `Resolution Proposed`
5. `Checker Approved`
6. `Resolved`
7. `Evidence Packed`

Primary actions:

- `Assign Owner`
- `Attach Evidence`
- `Prepare Correction Delta`
- `Waive With Reason`
- `Resolve Break`

## 14. Evidence Page

### 14.1 Purpose

Make the client useful for regulatory, audit, and provider review.

Filters:

- Fund
- Class
- Register Version
- Event Type
- Date Range
- Operator
- Evidence Type

Evidence pack contents:

- source instruction
- register before / after
- maker-checker approval trail
- token event hash
- cash reference
- NAV reference
- reconciliation result
- exception and waiver history
- export timestamp and pack hash

Primary CTA:

- `Export Evidence Pack`

## 15. Mock Demo Data

Minimum demo records:

### 15.1 Funds / classes

1. `Digital Liquidity Fund - HKD Class`
   - open-ended
   - tokenised
   - primary dealing only
   - official record source: hybrid register

2. `Institutional Treasury Plus - USDC Class`
   - open-ended
   - tokenised
   - paused subscription, redemption open
   - register servicing continues

3. `Asia Income Access Fund - HKD Token Class`
   - initial subscription
   - register version pending
   - wallet mapping exceptions

4. `Tokenised Money Market Fund - VATP Class`
   - secondary trading enabled
   - VATP omnibus holder
   - market maker linked

### 15.2 Work queue examples

| Task | Status | Blocking issue |
| --- | --- | --- |
| Harbor Family Office subscription | `Pending Register Delta` | cash matched, NAV pending |
| Granite Institutional redemption | `Blocked` | wallet proof expired |
| VATP omnibus transfer | `Critical Break` | token balance exceeds register balance |
| Record-date distribution | `Ready` | register close instruction approved |
| Lost wallet recovery | `High` | Product Provider approval required |

### 15.3 Register versions

Example IDs:

- `REG-DLF-HKD-20260416-018`
- `REG-ITP-USDC-20260416-011`
- `PRE-AIAF-HKD-20260412-001`
- `REG-MMF-VATP-20260416-022`

## 16. Backend Data and Synchronization

This UI requires a shared backend data contract.

Do not implement TA pages as a separate mock state tree that diverges from Issuer pages.
Issuer, Investor, and TA clients should read different projections of the same canonical backend objects.

Canonical backend objects:

- `Instruction`
- `RegisterAccount`
- `WalletLink`
- `RegisterDelta`
- `RegisterVersion`
- `CashMovement`
- `NavRecord`
- `TokenEvent`
- `ReconciliationBreak`
- `EvidenceRecord`

Synchronization rule:

> One instruction, one register delta lifecycle, multiple role-specific projections.

Role projections:

| Client | Projection |
| --- | --- |
| Issuer | product lifecycle, provider approvals, cash readiness, TA register status, open breaks |
| Transfer Agent | work queue, register deltas, register versions, reconciliation breaks, evidence |
| Investor | order status, payment status, booked holdings, settlement status |

Required backend behaviors:

- every write uses an idempotency key
- every mutable object has `version` for optimistic concurrency
- every write emits a domain event
- register-affecting changes go through maker-checker status
- posted register rows are corrected through reversal / correction deltas, not silent edits
- token events are reconciled against register deltas
- Issuer pages derive TA status from register projections, not local UI flags

Detailed contract:

- `05_Architecture/Specs/SPEC - Transfer Agency Data Contract and Synchronization.md`

## 17. Acceptance Criteria

### 17.1 Product behavior

- TA role exists independently from Issuer and Investor.
- TA navigation does not show issuer create pages or investor marketplace pages.
- Dashboard highlights register health, queue, exceptions, and latest register versions.
- Work queue supports at least subscription, redemption, wallet change, secondary transfer, and record-date tasks.
- Holder register page shows register versions, holder accounts, wallet links, restrictions, and corrections.
- Dealing cycle detail separates cash, NAV, unit calculation, register delta, and token reconciliation.
- Reconciliation page surfaces breaks and resolution status.
- Evidence page exposes exportable audit packs.

### 17.2 Hong Kong accuracy

- Copy uses `register`, `registrar`, `holder`, `shareholder`, `register delta`, and `Product Provider responsibility` accurately.
- TA is not described as sole accountable party for tokenised ownership record keeping.
- Cash confirmation owner is separate from TA register posting.
- Distributor / KYC / suitability evidence is shown as supplied by distributor or regulated intermediary.
- Secondary trading language references SFC-licensed VATP only if secondary trading is enabled.
- Token movements are reconciled against the official register, not assumed to be automatically legally final.

### 17.3 UI quality

- No text-heavy explainer page.
- No nested cards.
- Tables remain readable on desktop.
- Mobile/tablet views do not overflow.
- Empty, loading, error, permission, and blocked states are designed.
- Primary actions remain stable and do not shift table layout.

### 17.4 Data synchronization

- TA status displayed in Issuer pages comes from `RegisterDelta`, `RegisterVersion`, and `ReconciliationBreak`.
- Investor order status comes from the same `Instruction`, `CashMovement`, and register posting state used by TA.
- Posting a TA register delta updates Issuer and Investor projections without duplicated manual state edits.
- Duplicate submit / approve / post commands are idempotent.
- Version conflicts prevent stale TA and Issuer clients from overwriting each other.
- Reconciliation breaks block completion states until resolved or waived with evidence.

## 18. Suggested Implementation Order

1. Add `transferAgent` role and routing.
2. Add TA navigation in `Layout`.
3. Add canonical mock types: `Instruction`, `RegisterDelta`, `RegisterVersion`, `CashMovement`, `TokenEvent`, `ReconciliationBreak`.
4. Add projection builders for Issuer, Investor, and TA views.
5. Add `TransferAgentDashboard` with mocked metrics and queue.
6. Add `TransferAgentWorkQueue` with drawer review pattern.
7. Add `HolderRegister` page with register version tabs.
8. Add `Reconciliation` page.
9. Add `Evidence` page.
10. Connect existing fund issuance / redemption / distribution data into TA projections.
11. Add secondary transfer bridge only after primary register flows are stable.

## 19. Non-Goals for First Build

- real SFC filing
- real HKEX IFP integration
- real VATP API integration
- real smart contract signing
- complete PDPO data governance
- actual legal determination of on-chain finality
- production-grade document retention

## 20. Design Notes for Demo Story

The demo narrative should be:

1. Product Provider creates / operates the fund.
2. Investor or distributor submits orders.
3. Cash, NAV, KYC, and wallet evidence arrive from their owners.
4. TA reviews the register impact.
5. TA posts a controlled register delta.
6. Token events are reconciled against the register.
7. Exceptions are resolved before the register version is released.

This story is much more credible for Hong Kong than:

1. Issuer submits action.
2. TA approves.
3. Token operation completes.
