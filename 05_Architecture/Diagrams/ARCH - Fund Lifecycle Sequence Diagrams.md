# ARCH - Fund Lifecycle Sequence Diagrams

## Purpose

This note gives developers one place to review the sequence diagrams for the three main lifecycle modules in the demo:

1. `Issuance`
2. `Redemption`
3. `Distribution / Dividend`

Each module is shown in both `Closed-end` and `Open-end` form where the product currently models both.

For `Open-end` products, the diagrams below should be read as `module + recurring cycle` flows rather than one-off event flows. The numbering still follows the current UI so developers can map the diagrams back to the product.

These diagrams follow three rules:

- actor names use `Maker` and `Checker`
- stage numbering follows the numbering already shown in the system UI
- stage annotations use Mermaid's yellow `note` banner only, not a full highlighted background block

Rendering convention:

- each numbered sub-stage should be shown as a compact top banner such as `note over Maker,UI: 4.1 Snapshot`
- do not wrap full message sections in colored `rect ... end` background blocks

## Shared Actor Model

- `Maker`: the operator who prepares, submits, and executes maker-side workflow actions
- `Checker`: the operator who reviews and approves gated actions
- `UI`: the workflow UI plus app-side orchestration layer
- `TA`: transfer agent operating role
- `Chain`: smart contract / on-chain state layer
- `Register`: holder register / TA posting layer
- `Treasury`: funding or payout source when cash movement matters
- `Investor`: external holder or subscriber

## 1. Issuance

### 1.1 Closed-end Issuance

```mermaid
sequenceDiagram
    autonumber
    actor Maker as Maker
    actor Checker as Checker
    actor Investor as Investor
    participant UI as Demo UI
    participant TA as Transfer Agent
    participant Chain as Smart Contract
    participant Register as Holder Register

    note over Maker,UI: 1.1 Listing Draft
    Maker->>UI: Create issuance draft\nterm sheet + token setup + subscription window
    UI-->>Maker: Draft saved

    note over Checker,UI: 1.2 Listing Approval
    Maker->>UI: Submit draft for approval
    UI-->>Checker: Pending Approval task created
    Checker->>UI: Approve issuance draft
    UI-->>Maker: Status -> Pending Listing

    note over Maker,Chain: 1.3 Prepare Listing
    Maker->>UI: Prepare listing package
    Maker->>Chain: Publish listing notice\nfund reference + token reference + subscription open time + notice period
    Chain-->>UI: Status -> Upcoming

    note over UI,Investor: 2.1 Subscription Notice
    UI-->>Investor: Public notice visible
    UI-->>Maker: Waiting for subscription opening time

    note over Maker,Chain: 2.2 Open Subscription
    Maker->>Chain: Open subscription gate\nsubscription state + eligibility window
    Chain-->>Investor: Subscription is open
    Investor->>UI: Submit subscription orders
    UI-->>Maker: Order book grows

    note over Maker,TA: 3.1 Close Book
    Maker->>Chain: Close subscription gate
    Chain-->>UI: Status -> Allocation Period
    UI->>TA: Send accepted subscription book\naccepted investor list + pre-allocation register draft
    TA-->>UI: Allocation intake confirmed

    note over TA,UI: 3.2 Calculate Allocation
    Maker->>TA: Submit allocation workbook\ncap table draft + register delta draft
    TA-->>UI: Allocation review in progress

    note over TA,UI: 3.3 Finalize Allocation
    TA-->>UI: Final allocation file approved\nregister delta approved
    UI-->>Maker: Allocation result ready

    note over Maker,Chain: 4.1 On-chain Issuance
    Maker->>TA: Send mint instruction package\nwallet allocation list + register baseline
    TA-->>Maker: Mint package approved
    Maker->>Chain: Execute allocation mint
    Chain-->>UI: Workflow step -> On-chain Issuance

    note over TA,Register: 4.2 Confirm On-chain Issuance
    Chain-->>UI: Mint execution result
    UI->>TA: Send post-mint register package
    TA->>Register: Publish initial holder register
    UI-->>Maker: Allocation record available for investors

    note over TA,UI: 5.1 Completed
    Maker->>Chain: Write completion flag\nbooked allocation reference + register baseline reference
    Chain-->>UI: Workflow step -> Completed
    Maker->>TA: Submit close-out memo\nregister baseline confirmation
    TA-->>UI: Issuance close-out confirmed

    note over Maker,Chain: 5.2 Fund Active
    Maker->>Chain: Activate fund state\nactive flag + post-issuance operating state
    Chain-->>UI: Fund moves into post-issuance operating state
```

### 1.2 Open-end Issuance

```mermaid
sequenceDiagram
    autonumber
    actor Maker as Maker
    actor Checker as Checker
    actor Investor as Investor
    participant UI as Demo UI
    participant TA as Transfer Agent
    participant Chain as Smart Contract
    participant Register as Holder Register

    note over Maker,UI: 1.1 Draft
    Maker->>UI: Create issuance module draft\nfund terms + token setup + dealing rules
    UI-->>Maker: Module draft saved

    note over Checker,UI: 1.2 Approval
    Maker->>UI: Submit issuance module for approval
    UI-->>Checker: Pending Approval task created
    Checker->>UI: Approve module activation
    UI-->>Maker: Module ready for launch calendar setup

    note over Maker,UI: 1.3 Launch Ready
    Maker->>UI: Configure launch cycle\nlaunch calendar + investor access rules
    UI-->>Maker: Status -> Upcoming Launch

    note over Maker,Chain: 2.1 Open Window
    Maker->>Chain: Open first dealing window
    Chain-->>UI: Initial Subscription cycle enabled

    note over Investor,TA: 2.2 Accept Orders
    Investor->>UI: Submit initial-cycle subscriptions
    UI->>TA: Forward cycle order book\nonboarding pack + initial register draft
    TA-->>UI: Cycle intake acknowledged

    note over TA,Register: 3.1 Active
    TA->>Register: Post first-cycle allocation and register baseline
    UI-->>Maker: Module enters Active Dealing
    UI-->>Investor: Future dealing cycles can recur under the same module

    note over Maker,UI: 3.2 Pause Control
    Maker->>UI: Pause or resume the standing issuance module
    UI-->>TA: Operating control updated
```

## 2. Redemption

### 2.1 Closed-end Redemption

```mermaid
sequenceDiagram
    autonumber
    actor Maker as Maker
    actor Checker as Checker
    actor Investor as Investor
    participant UI as Demo UI
    participant TA as Transfer Agent
    participant Chain as Smart Contract
    participant Register as Holder Register
    participant Treasury as Settlement Treasury

    note over Maker,UI: 1.1 Setup Draft
    Maker->>UI: Create redemption setup\nredemption terms + participation limits
    UI-->>Maker: Draft saved

    note over Checker,UI: 1.2 Setup Approval
    Maker->>UI: Submit redemption event
    UI-->>Checker: Pending Approval task created
    Checker->>UI: Approve event
    UI-->>Maker: Event approved

    note over Maker,UI: 2.1 Notice
    Maker->>UI: Publish redemption notice
    UI-->>Investor: Investor notice published
    UI-->>Maker: Notice period running

    note over Maker,UI: 2.2 Activate
    Maker->>UI: Announce or activate module\nwindow activation record + settlement account setup
    UI-->>Maker: Event activated for participation window

    note over Investor,UI: 3.1 Window Open
    Investor->>UI: Submit redemption requests
    UI-->>Maker: Participation order book grows

    note over Maker,UI: 3.2 Window Control
    Maker->>UI: Pause or resume redemption window
    UI-->>Investor: Window status updated

    note over Maker,TA: 4.1 Snapshot Locked
    Maker->>TA: Send accepted request roster\nsnapshot lock instruction + accepted unit list
    TA->>Register: Lock holder snapshot
    TA-->>UI: Status -> Snapshot Locked

    note over TA,Treasury: 4.2 Payment List
    Maker->>TA: Confirm final acceptance set
    TA-->>UI: Payment list ready\nnet cash rows + destination accounts + funding request
    UI-->>Treasury: Funding package ready

    note over Maker,Chain: 4.3 Burn
    Treasury-->>Maker: Settlement account funded
    Maker->>TA: Confirm funded burn package
    TA-->>Maker: Burn package approved
    Maker->>Chain: Burn redeemed units
    Chain-->>UI: Status -> Burn On Chain

    note over TA,UI: 5.1 Reconcile
    UI->>TA: Submit burn confirmation + payment evidence
    TA-->>UI: Settlement reconciliation completed

    note over TA,Register: 5.2 Completed
    TA->>Register: Close event and reconcile units against cash movement
    TA-->>UI: Status -> Window Closed
```

### 2.2 Open-end Redemption Module

```mermaid
sequenceDiagram
    autonumber
    actor Maker as Maker
    actor Checker as Checker
    actor Investor as Investor
    participant UI as Demo UI
    participant TA as Transfer Agent
    participant Chain as Smart Contract
    participant Register as Holder Register
    participant Treasury as Settlement Treasury

    note right of UI: 1.1 Module Setup
    Maker->>UI: Create redemption module\nmodule rules + dealing cut-off + gate configuration
    UI-->>Maker: Module draft saved

    note right of UI: 2.1 Approval
    Maker->>UI: Submit module launch
    UI-->>Checker: Approval task created
    Checker->>UI: Authorize module launch
    UI-->>Maker: Module approved

    note right of UI: 3.1 Operating
    Maker->>UI: Enable redemption module
    UI-->>Maker: Standing redemption capability is active

    Investor->>UI: Submit redemption orders for current cycle
    UI->>TA: Forward current-cycle dealing batch\nholdings validation + request roster
    TA-->>UI: Cycle processing in progress

    note right of UI: 4.1 Close-out Start
    Maker->>UI: Close current dealing cut-off
    UI-->>TA: Current cycle close-out requested

    TA->>Register: Lock accepted cycle snapshot
    TA-->>UI: Current-cycle register cut-off complete

    note right of UI: 4.2 Settlement Prep
    TA-->>UI: Payment file + burn instruction for current cycle ready
    UI-->>Treasury: Current-cycle settlement funding request created

    note right of UI: 4.3 Close Cycle
    Treasury-->>Maker: Funding confirmed
    Maker->>Chain: Execute current-cycle burn or settlement-close transaction
    TA-->>UI: Reconciliation memo posted for current cycle
    UI-->>Maker: Cycle closed and module stays active
```

## 3. Distribution / Dividend

### 3.1 Closed-end Distribution / Dividend

```mermaid
sequenceDiagram
    autonumber
    actor Maker as Maker
    actor Checker as Checker
    actor Investor as Investor
    participant UI as Demo UI
    participant TA as Transfer Agent
    participant Chain as Smart Contract
    participant Register as Holder Register
    participant Treasury as Payout Source

    note over Maker,UI: 1.1 Draft
    Maker->>UI: Create dividend draft\nrecord date + payment date + dividend economics
    UI-->>Maker: Draft saved

    note over Checker,UI: 1.2 Approval
    Maker->>UI: Submit dividend event
    UI-->>Checker: Approval task created
    Checker->>UI: Approve distribution event
    UI-->>Maker: Status -> Pending Listing

    note over Maker,UI: 2.1 Publish Notice
    Maker->>UI: Prepare and publish record-date notice
    UI-->>Investor: Payment timetable visible

    note over UI,Investor: 2.2 Notice Running
    UI-->>Maker: Waiting for record date
    UI-->>Investor: Event remains upcoming

    note over Maker,TA: 3.1 Snapshot Locked
    Maker->>TA: Send record-date lock instruction
    TA->>Register: Freeze holder snapshot
    TA-->>UI: Snapshot locked

    note over TA,UI: 3.2 Entitlement File
    Maker->>TA: Confirm dividend economics
    TA-->>UI: Recipient list ready\neligible holders + payout destinations + funding request
    UI-->>Maker: Status -> Pending Allocation

    note over Maker,TA: 4.1 Prepare Release
    Treasury-->>Maker: Payout funding ready
    Maker->>TA: Submit final payout package
    TA-->>Maker: Release package approved

    note over Maker,Chain: 4.2 Release
    Maker->>Chain: Post payout instruction\nrecipient batch reference + payout route
    Chain-->>UI: Status -> Open For Distribution
    alt Claim mode
        Chain-->>Investor: Claim window opened
    else Direct transfer mode
        Chain-->>Investor: Automated payout started
    end

    note over TA,Register: 5.1 Reconcile
    UI->>TA: Submit payout completion evidence
    TA->>Register: Reconcile payout against recipient list
    TA-->>UI: Status -> Reconciled

    note over TA,UI: 5.2 Completed
    Maker->>UI: Close event
    UI-->>Maker: Status -> Done
```

### 3.2 Open-end Distribution Module

```mermaid
sequenceDiagram
    autonumber
    actor Maker as Maker
    actor Checker as Checker
    actor Investor as Investor
    participant UI as Demo UI
    participant TA as Transfer Agent
    participant Chain as Smart Contract
    participant Register as Holder Register
    participant Treasury as Payout Source

    note right of UI: 1.1 Module Draft
    Maker->>UI: Create distribution module draft\npayout policy + cycle timing
    UI-->>Maker: Module draft saved

    note right of UI: 1.2 Module Approval
    Maker->>UI: Submit distribution module
    UI-->>Checker: Approval task created
    Checker->>UI: Approve module
    UI-->>Maker: Module approved for recurring record-date cycles

    note right of UI: 2.1 Cycle Setup
    Maker->>UI: Configure current payout cycle\nrecord-date notice + distribution calendar
    UI-->>Investor: Current cycle calendar visible

    note right of UI: 2.2 Record Date
    TA->>Register: Reach current-cycle holder cut-off
    TA-->>UI: Record date for current cycle confirmed

    note right of UI: 3.1 Snapshot Locked
    TA->>Register: Freeze current-cycle payout base
    TA-->>UI: Locked cycle snapshot available

    note right of UI: 3.2 Entitlement File
    TA-->>UI: Current-cycle recipient payout file\nrecipient list + funding request
    UI-->>Maker: Current cycle pending allocation

    note right of UI: 4.1 Prepare Release
    Treasury-->>Maker: Funding confirmed
    Maker->>TA: Confirm current-cycle payout package
    TA-->>Maker: Current-cycle release package approved

    note right of UI: 4.2 Release
    Maker->>Chain: Open claim or auto-transfer flow for current cycle
    alt Claim mode
        Chain-->>Investor: Current-cycle claimable distribution available
    else Direct transfer mode
        Chain-->>Investor: Current-cycle automated transfer starts
    end
    Chain-->>UI: Status -> Open For Distribution

    note right of UI: 5.1 Reconcile
    UI->>TA: Submit current-cycle payout completion evidence
    TA->>Register: Reconcile current-cycle payout
    TA-->>UI: Status -> Reconciled

    note right of UI: 5.2 Cycle Closed
    Maker->>UI: Archive current cycle
    UI-->>Maker: Cycle closed and module remains available
```

## Developer Notes

- These diagrams are intended as developer-facing target semantics, not as exact backend implementation traces
- the stage numbering is intentionally aligned with the numbered sub-stages already shown in the product UI
- stage annotations use Mermaid note banners only; do not convert them into full-width colored background blocks
- open-end diagrams should be read as `module + cycle` flows, even when the current UI still uses event-like labels
- where the current UI and the target semantics still diverge, this file should be treated as the intended workflow reference
