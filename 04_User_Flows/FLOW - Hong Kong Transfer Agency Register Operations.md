# FLOW - Hong Kong Transfer Agency Register Operations

Date: 2026-05-08  
Scope: Transfer Agent / Registrar client for Hong Kong fund RWA platform  
Related:

- `05_Architecture/Specs/SPEC - Hong Kong Transfer Agent Client.md`
- `03_Tickets/Active/TICKET - Hong Kong Transfer Agent Client UI.md`

## 1. Core Flow

The Transfer Agent client should be designed around controlled register movement.

Important update:

> TA transaction work must be modeled as an approval workflow. A TA work queue row is only an entry point into a review task. It should not directly execute `Lock Snapshot`, `Generate Recipient List`, `Generate Payment List`, or `Submit Issuer Review`.

```mermaid
flowchart LR
    Investor["Investor"]
    Distributor["Distributor / RI / LC"]
    ProductProvider["Product Provider / Issuer"]
    Custodian["Trustee / Custodian / Cash Rail"]
    NAV["NAV / Fund Accounting"]
    TA["Transfer Agent / Registrar"]
    Register["Official Holder Register"]
    Token["Tokenisation Adapter"]
    Chain["Token Contract"]
    Audit["Evidence & Audit Store"]

    Investor --> Distributor
    Distributor -->|"order + KYC / suitability evidence"| TA
    ProductProvider -->|"approved fund / event instruction"| TA
    Custodian -->|"cash / custody confirmation"| TA
    NAV -->|"official NAV"| TA
    TA -->|"prepare + check register delta"| Register
    Register -->|"issue / redeem / transfer instruction"| Token
    Token --> Chain
    Chain -->|"mint / burn / transfer event"| TA
    TA -->|"reconcile token, cash, order, NAV"| Register
    TA --> Audit
    Register --> Audit
```

## 1.1 TA Workflow Intake Pattern

This is the required pattern for issuer-originated distribution and redemption requests.

```mermaid
flowchart LR
    Issuer["Issuer / Fund Manager"]
    Workflow["Workflow Service"]
    Instruction["Instruction"]
    TAInbox["TA Inbox / Work Queue"]
    Review["Dedicated TA Review Page"]
    Match["Match Result"]
    Approval["TA Maker / Checker Approval"]
    Register["Holder Register"]
    IssuerReview["Issuer Review"]
    Evidence["Evidence Pack"]

    Issuer -->|"submit approved business request"| Workflow
    Workflow -->|"create / update"| Instruction
    Workflow -->|"create TA intake task"| TAInbox
    TAInbox -->|"TA pulls and responds"| Review
    Review -->|"compare request, register, wallet, evidence"| Match
    Match -->|"matched"| Approval
    Match -->|"mismatch"| Issuer
    Approval -->|"lock snapshot / generate list"| Register
    Register -->|"snapshot + recipient/payment list"| IssuerReview
    IssuerReview -->|"acknowledge"| Workflow
    Workflow -->|"close-out reconcile"| Evidence
```

Review gate:

```mermaid
stateDiagram-v2
    [*] --> NewRequest
    NewRequest --> TAPulled: Pull Request
    TAPulled --> TAResponded: Respond / Accept
    TAResponded --> MatchPassed: checklist complete + Run Match
    TAResponded --> MatchException: checklist complete + exception
    MatchException --> ReturnedToIssuer: Return To Issuer
    ReturnedToIssuer --> NewRequest: issuer resubmits
    MatchPassed --> SnapshotLocked: Lock Snapshot
    SnapshotLocked --> ListGenerated: Generate Recipient / Payment List
    ListGenerated --> SubmittedToIssuer: Submit Issuer Review
    SubmittedToIssuer --> IssuerAcknowledged: issuer acknowledgement
    IssuerAcknowledged --> Reconciled: Reconcile Close-out
    Reconciled --> [*]
```

## 2. Primary Subscription

```mermaid
sequenceDiagram
    participant I as Investor
    participant D as Distributor / Platform
    participant C as Cash Rail / Custodian
    participant N as NAV / Fund Accounting
    participant TA as Transfer Agent
    participant R as Holder Register
    participant T as Token Adapter
    participant A as Audit Store

    I->>D: Submit subscription order
    D->>TA: Send order + onboarding evidence
    C->>TA: Send cash confirmation
    N->>TA: Send official NAV
    TA->>TA: Validate holder, wallet, cash, NAV
    TA->>R: Prepare issue register delta
    TA->>TA: Maker-checker approval
    TA->>T: Release mint / allocation instruction
    T-->>TA: Return token event hash
    TA->>R: Post register version
    TA->>A: Store evidence pack
```

Blocking conditions:

- cash not confirmed
- NAV not final
- wallet not bound or not whitelisted
- KYC / suitability evidence missing
- token mint amount differs from register delta

## 3. Primary Redemption

```mermaid
sequenceDiagram
    participant I as Investor
    participant D as Distributor / Platform
    participant N as NAV / Fund Accounting
    participant TA as Transfer Agent
    participant R as Holder Register
    participant T as Token Adapter
    participant C as Cash Rail / Custodian
    participant A as Audit Store

    I->>D: Submit redemption order
    D->>TA: Send redemption instruction
    TA->>R: Check holder balance and restrictions
    TA->>R: Reserve units
    N->>TA: Send official NAV
    TA->>TA: Calculate accepted units and cash amount
    TA->>T: Release burn / cancellation instruction
    T-->>TA: Return burn event hash
    TA->>R: Post redemption register delta
    TA->>C: Send payment list / payment reference
    C-->>TA: Confirm payment status
    TA->>A: Store reconciliation evidence
```

Blocking conditions:

- insufficient register balance
- dealing cut-off missed
- redemption gate / suspension active
- payment owner not ready
- burn / cancellation event missing

## 4. Secondary Transfer Bridge

Only applies where secondary trading has been approved and enabled.

```mermaid
flowchart TB
    VATP["SFC-licensed VATP"]
    Broker["Connecting Broker / Distributor"]
    MM["Market Maker"]
    Token["Token Contract"]
    TA["Transfer Agent / Registrar"]
    Register["Official Register"]
    Breaks["Reconciliation Breaks"]

    VATP -->|"trade report / omnibus position"| TA
    Broker -->|"client routing / eligibility evidence"| TA
    MM -->|"market making activity reference"| TA
    Token -->|"on-chain transfer events"| TA
    TA -->|"validate transferability"| Register
    TA -->|"post transfer delta"| Register
    TA -->|"compare VATP vs token vs register"| Breaks
    Breaks -->|"resolve or escalate"| TA
```

Common breaks:

- VATP report shows more units than the register.
- Token balance changed but no valid register instruction exists.
- Omnibus holder changed without approved transfer arrangement.
- Secondary holder requests primary redemption without a valid register mapping.
- Primary dealing is suspended but secondary trading remains open without contingency assessment.

## 5. Record Date / Distribution

```mermaid
sequenceDiagram
    participant P as Product Provider
    participant TA as Transfer Agent
    participant R as Holder Register
    participant C as Cash Rail / Paying Party
    participant A as Audit Store

    P->>TA: Send approved distribution / record-date instruction
    TA->>R: Close register or freeze record-date version
    TA->>R: Derive eligible holders and units
    TA->>TA: Generate entitlement list
    C->>TA: Confirm funding / payment status
    TA->>TA: Reconcile paid, failed, unpaid records
    TA->>A: Release event evidence pack
```

Important rule:

> The entitlement list is derived from the official register and event terms. It is not a separate investor-rule filter controlled by the issuer at payment time.

## 6. Responsibility Boundary

| Step | Accountable | Operating owner | Evidence source |
| --- | --- | --- | --- |
| Product approval | Product Provider | Product Provider | product approval record |
| KYC / suitability | Distributor / regulated intermediary | Distributor | onboarding evidence |
| Cash confirmation | Custodian / cash rail / operations | cash owner | payment reference |
| NAV confirmation | Fund accounting / valuation party | NAV owner | official NAV record |
| Register posting | Product Provider ultimately responsible | Transfer Agent | register delta and checker approval |
| Token mint / burn | Product Provider ultimately responsible | Tokenisation adapter / authorised operator | chain event hash |
| Reconciliation | Product Provider ultimately responsible | Transfer Agent | break log and evidence pack |

## 7. Client Screens Implied by Flow

Minimum implementation:

- `TA Dashboard`
- `Work Queue`
- `Register Delta Drawer`
- `Holder Register`
- `Dealing Cycle Detail`
- `Reconciliation Breaks`
- `Evidence Pack`

Secondary-trading implementation:

- `Primary-Secondary Bridge`
- `VATP Position Reconciliation`
- `Market Maker / Trading Channel Reference`
- `Suspension and Contingency Controls`
