# ARCH - Closed-end Fund Dividend, Redemption, and Transfer Agent

## 1. Purpose

This note aligns the closed-end fund demo around four review findings:

1. `Fund distribution` should not be the default English label for `分红`
2. Dividend flow should not carry `Rules`
3. Redemption should include a cash payment list
4. The demo should explicitly introduce a `Transfer Agent` operating role

This document is intentionally product-facing and UI-facing.
It is meant to guide the next round of ticket edits and page changes before implementation.

## 2. Core Judgment

### 2.1 For closed-end funds, `Dividend` is the better UI word than `Fund Distribution`

For the current demo meaning of `分红`, the recommended UI term is:

- `Dividend`

Recommended page labels:

- `Create Dividend`
- `Manage Dividend`
- `Dividend Detail`
- button: `Open Dividend`
- success copy: `Create dividend successfully`

Why:

- In user-facing fund workflows, `dividend` is the clearest and most natural word for `分红`
- `distribution` is a broader umbrella term and can include dividend, capital gain distribution, or return of capital
- The current demo is not modeling those payout types separately, so `Dividend` is the cleanest closed-end default

Recommended engineering compromise:

- UI copy uses `Dividend`
- internal data model may still keep a generic event type such as `distributionEventType`
- if the team later needs more realism, add:
  - `Dividend`
  - `Capital Gain Distribution`
  - `Return of Capital`

### 2.2 Closed-end redemption should not look like open-end daily redemption

For a normal closed-end fund, investors do not expect an always-open redemption window from the fund itself.
So if the demo keeps a closed-end cash-out module, it should be framed as one of these:

- `Repurchase Offer`
- `Tender Offer`
- `Maturity Redemption`
- `Liquidation Payout`

If the team wants minimum change for this round, the page may temporarily keep the word `Redemption`, but its business meaning should be changed to:

- issuer-initiated holder cash-out event
- not an always-open dealing function

That change is important because it explains why a payment list is required.

### 2.3 Transfer Agent should be a visible operating role, not a hidden system function

For this demo, `Transfer Agent` should be modeled as:

- the operator of the holder register
- the maker of the holder snapshot
- the generator of the pay list
- the checker of payment completion
- the reconciler of unit movement and cash movement

In other words, the Transfer Agent is the bridge between:

- issuer decision
- shareholder register
- cash payment execution
- final reconciliation

This role is especially useful in the demo because it makes the workflow feel operationally correct even when part of the process is mocked.

## 3. Proposed Product Rewrite for the Four Review Points

### 3.1 Change `Fund Distribution` to `Dividend`

Closed-end scope recommendation:

- rename all closed-end `distribution` user-facing pages to `dividend`
- keep `distribution` only if the page is meant to be a future umbrella object

Recommended wording map:

| Current | Recommended |
| --- | --- |
| `Fund Distribution` | `Dividend` |
| `Create Fund Distribution` | `Create Dividend` |
| `Manage Fund Distribution` | `Manage Dividend` |
| `Fund Distribution Detail` | `Dividend Detail` |
| `Open For Distribution` | `Open Dividend` |
| `Accept Distribution` | `Receive Dividend` or `Dividend Paid` |

### 3.2 Remove `Rules` from dividend flow

Dividend should be driven by holder-of-record logic, not by manual investor-rule filtering.

So the dividend event should not have a `Rules` tab.

Recommended closed-end dividend tabs:

1. `About Dividend`
2. `Record & Payment`
3. `Recipient List`
4. `Audit Trail`

Recommended minimum fields:

| Field | Notes |
| --- | --- |
| `* Dividend name` | Event name |
| `* Linked fund` | Closed-end fund selector |
| `* Record date` | Holder snapshot date |
| `* Payment date` | Cash payment date |
| `* Dividend method` | `Per Share` / `Fixed Total Amount` |
| `* Dividend amount` | Amount input |
| `Dividend currency` | Usually fund currency |
| `Source of cash` | Treasury / settlement account |
| `Payout mode` | `Direct Transfer` first; `Claim` is optional and less natural for this use case |
| `Notes` | Optional issuer remarks |

What replaces `Rules`:

- a read-only `Eligibility logic` note:
  - `All holders on record date are eligible`
- a generated `Recipient List`

### 3.3 Add a payment list to redemption

For closed-end redemption-like events, the key operational object is not a rule set.
It is the payment list.

Recommended object name:

- `Redemption Payment List`

Recommended detail page tabs:

1. `Overview`
2. `Holder Snapshot`
3. `Payment List`
4. `TA Checklist`
5. `Audit Trail`

Recommended payment-list columns:

| Column | Notes |
| --- | --- |
| `Investor` | Holder name |
| `Wallet / Account` | Destination or settlement account |
| `Units accepted` | Final accepted quantity |
| `Price per unit` | Redemption or repurchase price |
| `Gross amount` | Before deduction |
| `Withholding / Fee` | Optional |
| `Net amount` | Final cash to pay |
| `Payment status` | `Pending` / `Ready` / `Paid` / `Failed` |
| `Payment reference` | Bank ref or tx hash |

Recommended workflow meaning:

- holder snapshot freezes entitlement
- TA validates accepted units
- system generates payment list
- issuer funds payment
- TA marks payment completion
- reconciliation closes event

### 3.4 Add Transfer Agent capability points

The demo should not treat Transfer Agent as just one label on the page.
It should have concrete function points.

Recommended Transfer Agent functions:

1. `Maintain Holder Register`
2. `Freeze Record Date Snapshot`
3. `Validate Eligible Holders`
4. `Generate Dividend Recipient List`
5. `Generate Redemption Payment List`
6. `Confirm Funding Received`
7. `Mark Payments Executed`
8. `Reconcile Units and Cash`
9. `Publish TA Audit Log`

## 4. Recommended UI Positioning of Transfer Agent

## 4.1 Role design

For the demo, use three clear roles:

- `Issuer / Fund Manager`
- `Transfer Agent`
- `Investor`

Do not merge `Transfer Agent` into `Issuer` actions.
If they are merged, the workflow will look too much like a direct token operation and will lose the traditional fund-ops feeling.

## 4.2 How TA should appear on screen

Recommended visible UI elements:

### A. Workflow swimlane or responsibility badges

Each major step shows an owner:

- `Issuer`
- `Transfer Agent`
- `Investor`
- `System`

Example for dividend:

1. Issuer drafts dividend event
2. Transfer Agent locks record-date snapshot
3. Transfer Agent generates recipient list
4. Issuer confirms funding
5. Transfer Agent releases payout and reconciles

Example for redemption:

1. Issuer opens repurchase or redemption event
2. Investor submits participation
3. Transfer Agent validates holdings
4. Transfer Agent generates payment list
5. Issuer funds settlement
6. Transfer Agent marks payments complete

### B. `TA Operations` card on detail pages

Add one prominent card in both Dividend Detail and Redemption Detail:

Card title:

- `Transfer Agent Operations`

Recommended fields:

| Field | Example |
| --- | --- |
| `TA status` | `Pending Snapshot` |
| `Register date` | `2026-04-30 18:00` |
| `Snapshot ID` | `SNAP-20260430-001` |
| `Recipient list status` | `Generated` |
| `Funding check` | `Confirmed` |
| `Reconciliation status` | `Pending` |
| `Last operator action` | `Snapshot locked by TA Ops` |

### C. Dedicated `Payment List` / `Recipient List` tab

This is where TA becomes tangible.

Without this tab, the workflow still looks too abstract.

### D. `TA Checklist` drawer or panel

Recommended checklist items:

- `Holder register verified`
- `Record date snapshot frozen`
- `Recipient list reviewed`
- `Cash funding confirmed`
- `Payment execution completed`
- `Reconciliation completed`

This gives the demo a strong operations feel even if the backend is mocked.

## 5. Proposed Workflow Design

### 5.1 Closed-end dividend workflow

Recommended state flow:

1. `Draft`
2. `Pending Approval`
3. `Record Date Locked`
4. `Recipient List Ready`
5. `Funding Confirmed`
6. `Dividend Paid`
7. `Reconciled`

Role ownership:

| State / Step | Owner |
| --- | --- |
| Draft dividend | Issuer |
| Approve dividend | Issuer / internal approver |
| Lock record date | Transfer Agent |
| Generate recipient list | Transfer Agent |
| Confirm treasury funding | Issuer |
| Mark payments executed | Transfer Agent |
| Reconcile and close | Transfer Agent |

### 5.2 Closed-end redemption workflow

Recommended state flow:

1. `Draft`
2. `Pending Approval`
3. `Open for Participation`
4. `Holder Snapshot Locked`
5. `Payment List Ready`
6. `Funding Confirmed`
7. `Paid`
8. `Reconciled`

If the business event is not investor opt-in but maturity payoff, then step 3 can be replaced by:

- `Maturity Processing`

Role ownership:

| State / Step | Owner |
| --- | --- |
| Draft event | Issuer |
| Approve event | Issuer / internal approver |
| Receive or confirm holder participation | Investor / System |
| Lock holder snapshot | Transfer Agent |
| Generate payment list | Transfer Agent |
| Confirm funding | Issuer |
| Execute payment | Transfer Agent |
| Reconcile close-out | Transfer Agent |

## 6. Suggested Page-Level Changes

### 6.1 Create Dividend

Current issue:

- too close to a generic distribution event
- contains `Rules`, which is conceptually wrong for a record-date payout

Recommended structure:

1. `About Dividend`
2. `Record & Payment`
3. `Review`

Remove:

- `Rules`

Add:

- `Eligibility logic: Holders on record date`
- `Recipient list will be generated by Transfer Agent after record date`

### 6.2 Dividend Detail

Recommended layout:

- top summary
- workflow with owner badges
- `Transfer Agent Operations` card
- `Recipient List` tab
- `Audit Trail` tab

### 6.3 Redemption Detail

Recommended layout:

- top summary
- workflow with owner badges
- `Transfer Agent Operations` card
- `Holder Snapshot` tab
- `Payment List` tab
- `Audit Trail` tab

The most important new visible object is:

- `Payment List`

## 7. Suggested Data Objects for the Next Implementation Round

Recommended additions:

```ts
type TransferAgentStatus =
  | "Pending Snapshot"
  | "Snapshot Locked"
  | "Recipient List Ready"
  | "Funding Confirmed"
  | "Payment In Progress"
  | "Reconciled";

type PaymentLineItem = {
  investorId: string;
  investorName: string;
  destinationAccount: string;
  unitsAccepted: string;
  pricePerUnit: string;
  grossAmount: string;
  withholdingAmount?: string;
  netAmount: string;
  paymentStatus: "Pending" | "Ready" | "Paid" | "Failed";
  paymentReference?: string;
};

type HolderSnapshot = {
  snapshotId: string;
  recordDate: string;
  totalHolders: number;
  totalEligibleUnits: string;
  generatedBy: "Transfer Agent";
};
```

Recommended event-level fields:

- `transferAgentStatus`
- `transferAgentName`
- `holderSnapshotId`
- `recipientListGeneratedAt`
- `paymentListGeneratedAt`
- `fundingConfirmedAt`
- `reconciledAt`

## 8. Implementation Priority

Recommended order:

1. Copy and naming correction
2. Remove dividend `Rules`
3. Add payment-list object to redemption
4. Add `Transfer Agent Operations` card and owner badges
5. Add detailed TA checklist and audit log

## 9. Final Recommendation

For this demo round, the cleanest closed-end story is:

- `Distribution` becomes `Dividend`
- dividend no longer uses investor rules
- redemption becomes a one-off payout event with a mandatory payment list
- `Transfer Agent` becomes the operator of snapshot, pay-list generation, and reconciliation

If we follow this model, the workflow will look much more like traditional fund operations and much less like a generic on-chain token event.

## 10. External References

These references support the terminology and operating-role recommendations:

- Investor.gov on transfer agents: https://www.investor.gov/introduction-investing/investing-basics/glossary/transfer-agents
- Investor.gov on publicly traded closed-end funds: https://www.investor.gov/introduction-investing/investing-basics/investment-products/closed-end-funds/publicly-traded-closed-end-funds
- Investor.gov on fund distributions: https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/investor-6
