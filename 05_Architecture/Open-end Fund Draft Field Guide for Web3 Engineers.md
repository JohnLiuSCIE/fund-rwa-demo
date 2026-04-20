# Open-end Fund Draft Field Guide for Web3 Engineers

This note explains the draft fields and workflow steps used in the current `Create Fund Issuance` flow for open-end funds.

Target reader:
- Web3 engineers who understand tokens, wallets, on-chain state, and settlement mechanics
- Engineers who do not yet have strong intuition for traditional fund issuance, dealing, redemption, and distribution operations

Code reference:
- Draft page: `project/src/app/pages/CreateFundIssuance.tsx`
- Workflow component: `project/src/app/components/FundIssuanceWorkflow.tsx`

## 1. Quick Mental Model

If you come from Web3, the easiest way to think about an open-end fund is:

| Traditional finance concept | Rough Web3 mental model |
| --- | --- |
| Fund | A managed pooled strategy or regulated vault |
| Subscription | Investor deposits cash and receives newly issued fund units |
| Redemption | Investor returns fund units and receives cash back |
| NAV | The fair price per fund unit for that dealing cycle |
| Transfer restriction | Token transfer is permissioned, not fully free-float |
| Whitelist | Address-level eligibility gating |
| Cut-off time | Batch boundary for orders |
| Settlement cycle `T+1` | State becomes economically final one business day later |

Important difference:
- In many Web3 systems, price discovery and transfer can be continuous.
- In traditional funds, subscriptions and redemptions are usually processed in operational batches, using an official NAV and explicit compliance checks.

So this product is not just "mint a token and let people trade it".
It is closer to:
- permissioned tokenized shares
- plus off-chain cash workflow
- plus NAV-based batch processing
- plus issuer / admin review and recordkeeping

## 2. What "Draft" Means

In this UI, `Draft` is not yet a live fund.

It means:
- the issuer is defining commercial terms
- the issuer is defining token rules
- the issuer is defining dealing and redemption operations
- supporting documents are being attached
- the setup is still editable before approval / launch

For engineers, `Draft` is the pre-activation config state.
Nothing investor-facing should rely on it as a live, executable product until it passes later workflow gates.

## 3. Open-end Issuance Workflow

The top process card on the draft page shows the primary business lifecycle:

1. `Draft`
2. `Initial Launch`
3. `Active Dealing`
4. `NAV Confirm`
5. `T+1 Settle`

The detail workflow component expands this further.

### Step 1. Launch

Sub-stages:
- `1.1 Draft`
- `1.2 Approval`
- `1.3 Launch Ready`

Meaning:
- The fund setup is created.
- Internal approval or operational approval happens.
- The fund is queued to open its initial subscription window.

Why it exists:
- In TradFi, you do not want investors subscribing into an unapproved product definition.
- Legal docs, commercial terms, compliance rules, and operational rules should be frozen enough before launch.

Web3 analogy:
- Similar to deploying a protocol config, getting governance / ops approval, then marking it ready for public use.

### Step 2. Initial Subscription

Sub-stages:
- `2.1 Open Window`
- `2.2 Accept Orders`

Meaning:
- The issuer opens the initial subscription period.
- Investors can place first-round subscription orders.

Why it exists:
- Even open-end funds often need a defined starting window before they move into normal daily dealing.

Web3 analogy:
- Similar to an initial deposit window for a new vault, except shares are not necessarily priced continuously on-chain.

### Step 3. Active Dealing

Sub-stages:
- `3.1 Active`
- `3.2 Pause Control`

Meaning:
- The fund is now in routine operating mode.
- Investors can subscribe and redeem according to the configured dealing rules.
- Operations can be paused if needed.

Why it exists:
- Open-end funds are ongoing products, not one-off issuance events.
- This is the steady-state operating phase.

Web3 analogy:
- Comparable to an active vault where deposits and withdrawals remain open, but only within policy and batch constraints.

### Step 4. NAV Confirmation

Sub-stages:
- `4.1 Queue NAV`
- `4.2 Review`
- `4.3 Confirmed`

Meaning:
- Orders for the cycle are grouped.
- NAV is determined or reviewed.
- Orders are confirmed using the official valuation.

Why it exists:
- Investors usually do not get an instantly final share amount at order submission time.
- Final share issuance or cash amount depends on the dealing cycle's official NAV.

Web3 analogy:
- Similar to submitting intents first, then settling them once an oracle-based or admin-approved reference price is finalized.

### Step 5. Settlement

Sub-stages:
- `5.1 Settle`
- `5.2 Completed`

Meaning:
- Cash and shares are booked after confirmation.
- The cycle is reconciled and closed.

Why it exists:
- Economic confirmation and operational settlement are often separate.
- This is especially true when fiat, stablecoin rails, custody, or transfer agent style records are involved.

Web3 analogy:
- Similar to having a confirmed trade and then a later asset movement or treasury transfer that completes the state transition.

## 4. Why Open-end and Closed-end Feel Different

Closed-end flow is more like:
- define product
- run one subscription campaign
- allocate
- issue once
- then the issuance phase is done

Open-end flow is more like:
- define product
- launch it
- keep running recurring dealing cycles
- repeat valuation and settlement operationally

For Web3 engineers:
- closed-end is closer to a one-time sale or capital raise
- open-end is closer to a continuously managed permissioned vault

## 5. Draft Tabs and What Each Field Means

The current draft screen has four tabs:

1. `About Deal`
2. `About Token`
3. `Subscription & Rules`
4. `Fund Documents`

Below, each field is explained from a business and engineering angle.

## 6. About Deal

### Fund name

Business meaning:
- The commercial name of the fund product.

Why engineers care:
- Used in UI, records, audit trails, notifications, and downstream setup references.

Web3 analogy:
- Human-readable asset or vault name.

### Fund type

Business meaning:
- Distinguishes `Open-end` from `Closed-end`.

Why engineers care:
- This changes the entire workflow model, editable stages, and operational fields.
- In the current product, many downstream behaviors branch on this value.

Web3 analogy:
- Similar to choosing between a continuous vault and a one-off sale contract.

### Fund description

Business meaning:
- Plain-language explanation of the product and investor promise.

Why engineers care:
- Important for operator clarity and user-facing disclosure.
- Often reused in detail pages and approval context.

### Deal size unit

Business meaning:
- The cash denomination for the fund, such as `HKD` or `USDC`.

Why engineers care:
- Determines how monetary fields are interpreted and formatted.
- Influences settlement rails and NAV denomination.

Web3 analogy:
- Quote currency for mint / burn accounting.

### Target fund size

Business meaning:
- The intended asset size the issuer wants to raise or operate at.

Why engineers care:
- Not always a hard on-chain cap, but often useful for monitoring, UI, and risk controls.

Web3 analogy:
- Target TVL, but from a product design perspective rather than a protocol metric only.

### Minimum subscription amount

Business meaning:
- Smallest cash amount an investor can subscribe in one order.

Why engineers care:
- Validation rule at order-entry time.
- Affects UX and request rejection behavior.

Web3 analogy:
- Minimum deposit threshold.

### Maximum subscription amount per investor

Business meaning:
- Largest amount an individual investor can subscribe.

Why engineers care:
- Risk and concentration control.
- Can be checked at application, batching, or approval stage.

Web3 analogy:
- Per-wallet deposit cap, except the identity layer may not equal wallet count.

### Initial subscription price / NAV

Business meaning:
- The starting per-unit value used at launch.

Why engineers care:
- Seed price for initial share issuance and NAV history.
- Important for first-cycle calculations.

Web3 analogy:
- Initial share price for a vault token before ongoing valuation cycles begin.

### Management fee (% p.a.)

Business meaning:
- Ongoing annual fee paid to the manager.

Why engineers care:
- Needed for product disclosure.
- May eventually affect periodic accrual logic, reporting, or off-chain bookkeeping.

Web3 analogy:
- Comparable to streaming management fees in a vault, but usually handled with stronger legal/accounting treatment.

### Performance fee (%)

Business meaning:
- Additional fee tied to fund performance.

Why engineers care:
- Mostly a commercial configuration now, but relevant if performance-fee accounting is later modeled.

Web3 analogy:
- Similar to a vault carry or success fee.

### Fund manager

Business meaning:
- The manager responsible for strategy execution.

Why engineers care:
- Core display and approval metadata.
- Useful in audit and operations context.

### Issuer entity

Business meaning:
- The legal entity issuing or operating the fund.

Why engineers care:
- Important for legal identity, permissions, documents, and compliance metadata.

Web3 analogy:
- The real-world legal actor behind the product, not just the deployer address.

### Fund jurisdiction

Business meaning:
- The legal / regulatory home of the fund.

Why engineers care:
- Affects compliance assumptions, investor restrictions, disclosure requirements, and operations.

### Share class

Business meaning:
- Which class of units this setup refers to, such as `Class A`.

Why engineers care:
- Different share classes can have different fees, investor rights, or distribution rules.

Web3 analogy:
- Similar to multiple token classes representing economically different claims under one umbrella product.

### Investment strategy

Business meaning:
- What the fund invests in and how it operates.

Why engineers care:
- Useful for operator review and for contextualizing other settings.
- Not pure decoration; it helps explain why dealing rules and liquidity promises look the way they do.

### Issue date

Business meaning:
- The date the fund is intended to become issued / effective.

Why engineers care:
- Used in timeline logic and display.
- Can affect workflow readiness and disclosure.

### Maturity date

Business meaning:
- End date of the product.

Why engineers care:
- Relevant mainly for closed-end products.
- Usually absent for open-end funds.

### References

Business meaning:
- Links or files that support the fund setup.

Why engineers care:
- Helpful for approval review, legal cross-checking, and later auditability.

Web3 analogy:
- Supporting spec or off-chain config references attached to a deployment proposal.

## 7. About Token

### Name of fund token

Business meaning:
- Human-readable tokenized unit name.

Why engineers care:
- Display name for minted units and records.

### Token symbol

Business meaning:
- Short code for the tokenized fund unit.

Why engineers care:
- Used in UI, ledgers, exports, and possibly contract metadata.

### Token standard

Business meaning:
- Standard used for the tokenized fund units.

Why engineers care:
- Directly affects transfer logic, compliance hooks, and integration design.

Practical reading:
- `ERC-20`: simple fungible token model
- `ERC-3643`: security-token style permissioning and compliance support
- `ERC-1400`: another security-token oriented standard family

### Token decimals

Business meaning:
- Decimal precision of the unit.

Why engineers care:
- Required for contract math, formatting, and reconciliation.

### ISIN / security code

Business meaning:
- Traditional security identifier.

Why engineers care:
- Bridges on-chain asset representation with traditional operations, reporting, and compliance systems.

### 1 token represents

Business meaning:
- Economic meaning of each token unit, such as `1 fund unit`.

Why engineers care:
- Makes explicit what is being tokenized.
- Reduces confusion between token quantity and cash value.

### Minting rule

Business meaning:
- Whether units are minted and burned as dealing occurs, or whether inventory is pre-minted.

Why engineers care:
- This is a major implementation choice.

Web3 reading:
- `Mint / burn on dealing`: token supply follows subscriptions and redemptions directly
- `Pre-minted inventory`: operational treasury inventory is moved instead of minting every time

### Transfer restricted

Business meaning:
- Whether token transfers are permission-controlled.

Why engineers care:
- Signals that this is not a free-transfer retail token.
- Usually implies policy checks before transfer.

### Whitelist required

Business meaning:
- Wallets must be approved before holding or receiving the token.

Why engineers care:
- This is core compliance logic.
- It affects issuance, transfers, redemptions, and marketplace behavior.

Web3 analogy:
- Address gating, but for regulatory eligibility rather than simple allowlisting only.

### Is token tradable on secondary market

Business meaning:
- Whether the token is intended to circulate in a secondary venue.

Why engineers care:
- Open-end funds in this demo are intentionally centered on subscription / redemption, not secondary market trading.

## 8. Subscription & Rules

### Subscription lot size

Business meaning:
- Standard order increment.

Why engineers care:
- Validation and quantity rounding.

### Subscription minimum quantity

Business meaning:
- Smallest number of units that can be subscribed.

Why engineers care:
- Quantity-side validation in addition to cash-side validation.

### Subscription maximum quantity

Business meaning:
- Largest quantity that can be subscribed.

Why engineers care:
- Another concentration / operational control.

### Initial subscription window

Business meaning:
- Start and end time of the launch-phase subscription period.

Why engineers care:
- Drives order acceptance rules and workflow transitions.

Web3 analogy:
- A time-bounded deposit window.

### Dealing frequency

Business meaning:
- How often the fund processes subscriptions and redemptions.

Why engineers care:
- Determines batching cadence.
- Strongly affects NAV and settlement scheduling.

Common meaning:
- `Daily`: process every dealing day
- `Weekly`: process on a weekly cycle
- `Monthly`: process less frequently

### Settlement cycle

Business meaning:
- How long after dealing confirmation assets settle.

Why engineers care:
- Defines operational expectations and queue timing.

Web3 analogy:
- Settlement latency after price confirmation.

### Dealing cut-off time

Business meaning:
- Deadline for orders to join the current cycle.

Why engineers care:
- Critical batch boundary.
- Orders after cut-off should typically fall into the next cycle.

### NAV valuation time

Business meaning:
- When the official valuation is produced or finalized.

Why engineers care:
- Downstream order confirmation depends on this.

### Notice period for redemption (days)

Business meaning:
- How much advance notice is required before a redemption is effective.

Why engineers care:
- Changes when redemption orders can be accepted or executed.
- Important for liquidity planning.

### Order confirmation method

Business meaning:
- Whether orders confirm automatically at cut-off or only after issuer review.

Why engineers care:
- Determines whether the pipeline is automated or includes a manual approval gate.

Web3 analogy:
- Auto execution versus operator-signed finalization.

### Lock-up period

Business meaning:
- Minimum holding period before redemption is allowed.

Why engineers care:
- Redemption eligibility rule.

### Redemption gate per investor

Business meaning:
- Maximum amount one investor may redeem in a cycle.

Why engineers care:
- Prevents one investor from overwhelming liquidity.

### Fund-level redemption gate (%)

Business meaning:
- Maximum percentage of the whole fund that can be redeemed in one cycle.

Why engineers care:
- System-level liquidity protection.
- This is a product risk guardrail, not just a per-user validation.

### Subscription status after launch

Business meaning:
- Whether subscriptions become open automatically once the fund is live.

Why engineers care:
- Affects initial post-launch operational state.

### Redemption status after launch

Business meaning:
- Whether redemptions become open automatically once the fund is live.

Why engineers care:
- Another live-state initialization choice.

### Allocation rule

Business meaning:
- Relevant mainly for closed-end products.

Why engineers care:
- For open-end funds, ongoing dealing typically makes this less central because units are not allocated from a one-time oversubscribed pool in the same way.

### Investor rules

Business meaning:
- Eligibility filters such as investor type or jurisdiction.

Why engineers care:
- This is where business rules become access-control rules.
- They should influence who can subscribe, hold, or interact with the product.

Web3 analogy:
- Allowlist logic backed by investor identity attributes instead of only wallet addresses.

## 9. Fund Documents

### Fund administrator

Business meaning:
- Party handling administration and records.

Why engineers care:
- Important operational actor in many fund setups.

### Custodian of fund assets

Business meaning:
- Party holding or safeguarding underlying assets.

Why engineers care:
- Important for trust model, reconciliation, and legal setup.

### Offering document / prospectus

Business meaning:
- Primary formal disclosure document.

Why engineers care:
- This is the human and legal source of truth for many product promises.

### Other supporting documents

Business meaning:
- Ancillary legal, operational, or compliance documentation.

Why engineers care:
- Useful for approvals and audit trails.

## 10. How Redemption and Distribution Fit After Launch

An engineer who only sees the issuance draft can still miss the full fund lifecycle.

After the open-end fund goes live:

### Redemption

Purpose:
- lets investors return fund units and receive cash

Key concepts:
- effective date
- announcement date
- window start / end
- notice period
- max redemption per investor
- settlement cycle

Why this exists:
- even when the fund is open-end, redemptions are usually controlled by windows, gates, review steps, and liquidity policy

### Distribution

Purpose:
- pays income or distributions to holders

Key concepts:
- record date
- payment date
- payout mode
- payout token
- rate type and rate

Why this exists:
- distribution is not the same thing as redemption
- redemption returns capital by burning or surrendering units
- distribution pays income while the investor may continue holding the units

## 11. Engineering Takeaways

If you are implementing this system, do not model it as "ERC-20 plus a form".

The product really has four interacting layers:

1. Product configuration layer
   - fund terms
   - token model
   - dealing and redemption policy

2. Identity and compliance layer
   - issuer role
   - investor type
   - jurisdiction
   - whitelist / transfer restrictions

3. Operational batch layer
   - cut-off times
   - NAV determination
   - confirmation
   - settlement

4. Asset movement layer
   - mint / burn or inventory movement
   - cash settlement
   - distribution payout

A large portion of the complexity is not contract complexity alone.
It is the coordination between:
- regulated identity
- legal docs
- off-chain valuation
- operations workflow
- final asset state changes

## 12. Suggested Reading Order for New Engineers

If onboarding a Web3 engineer to this repo, start in this order:

1. `CreateFundIssuance.tsx`
   - understand what the issuer configures
2. `FundIssuanceWorkflow.tsx`
   - understand the lifecycle states
3. `FundIssuanceDetail.tsx`
   - understand what becomes editable or locked later
4. `CreateFundRedemption.tsx` and `FundRedemptionDetail.tsx`
   - understand post-launch liquidity operations
5. `FundDistributionDetail.tsx`
   - understand post-launch payout operations

## 13. One-sentence Summary

For a Web3 engineer, this open-end fund draft is best understood as the configuration layer for a permissioned, NAV-based, batch-processed tokenized fund whose units are issued, redeemed, and sometimes distributed under operational and compliance controls rather than continuous free-market mechanics.
