# 十七、Mermaid 对齐图

> 本节用于产品、设计、前端、后端、合约侧对齐，不替代正文需求；如图与正文冲突，以正文为准。

### 17.1 总体参与方与系统架构图

```mermaid
flowchart LR
    Issuer[Issuer<br/>发行方]
    Investor[Investor<br/>投资人]
    UI[Fund Platform Web UI<br/>前台页面]
    API[Platform Backend / API<br/>业务编排与记录]
    Wallet[Self-custody Wallet<br/>自托管钱包]
    ST[(Settlement Token / Stablecoin)]
    FT[(Fund Token)]
    SC[Smart Contracts<br/>Issuance / Allocation / Redemption / Distribution]
    Ops[Admin / Operator<br/>审批与运营后台]

    Issuer --> UI
    Investor --> UI
    UI --> API
    UI --> Wallet
    API --> Ops
    API --> SC
    Wallet --> SC
    SC --> ST
    SC --> FT
```

### 17.2 Fund Issuance / Subscription 时序图

```mermaid
sequenceDiagram
    actor Issuer as Issuer
    actor Investor as Investor
    participant UI as Fund Platform UI
    participant API as Backend API
    participant Wallet as Wallet
    participant SC as Smart Contract
    participant Stable as Settlement Token
    participant User as User Center

    Note over Issuer,SC: 1. Listing - Prepare listing
    Issuer->>UI: Create Fund Issuance
    UI->>API: Submit issuance form
    API-->>UI: Draft issuance created

    Issuer->>UI: Submit For Approval
    UI->>API: Submit approval request
    API-->>UI: Status = Pending Listing

    Issuer->>UI: Click Listing
    UI->>Wallet: Personal Sign / Tx Sign
    Wallet->>SC: Listing transaction
    SC-->>API: Listing event
    API-->>UI: Status = Upcoming

    Note over Issuer,Investor: 2. Subscription - Open for subscription
    Issuer->>UI: Open For Subscription
    UI->>Wallet: Personal Sign
    Wallet->>SC: Open subscription
    SC-->>API: Open subscription event
    API-->>UI: Status = Open For Subscription

    Investor->>UI: Browse Marketplace and open fund detail
    Investor->>UI: Input subscription quantity
    UI-->>Investor: Calculate subscription amount
    Investor->>UI: Confirm Subscribe
    UI->>Wallet: Approve settlement token
    Wallet->>Stable: ERC20 approve
    UI->>Wallet: Sign subscribe tx
    Wallet->>SC: Subscribe
    SC-->>API: Subscription record created
    API-->>UI: Subscription List updated

    Note over Issuer,API: 3. Allocation - Allocation period
    API-->>UI: Subscription period ends
    Issuer->>UI: Pending Allocation
    UI->>Wallet: Personal Sign
    Wallet->>SC: Confirm allocation period
    SC-->>API: Allocation phase event

    Issuer->>UI: Allocate
    UI->>API: Trigger off-chain allocation
    API-->>UI: Allocation result generated

    Note over Issuer,SC: 4. On-chain Issuance - Issue allocations on-chain
    Issuer->>UI: Allocate On Chain
    UI->>Wallet: Personal Sign + Tx Sign
    Wallet->>SC: Write allocation on chain
    SC-->>API: Allocation records created

    Issuer->>UI: Allocation Completed
    UI->>Wallet: Personal Sign + Tx Sign
    Wallet->>SC: Confirm allocation completion
    SC-->>API: Allocation completed event

    Note over Issuer,User: 5. Completed - Issuance complete
    Issuer->>UI: Accept Fund
    UI->>Wallet: Personal Sign + Tx Sign
    Wallet->>SC: Transfer accepted fund / finalize issuance
    SC-->>API: Issuance active

    API-->>User: Allocation Record available
    Investor->>User: Click Accept Allocation
    User->>Wallet: Personal Sign + Tx Sign
    Wallet->>SC: Accept allocation
    SC-->>API: Investor accepted allocation
    API-->>User: Fund token credited
```

### 17.3 Fund Redemption 时序图

```mermaid
sequenceDiagram
    actor Issuer as Issuer
    actor Investor as Investor
    participant UI as Fund Platform UI
    participant API as Backend API
    participant Wallet as Wallet
    participant SC as Smart Contract
    participant User as User Center

    Note over Issuer,API: 1. Setup - Create and approve event
    Issuer->>UI: Create Fund Redemption
    UI->>API: Submit redemption form
    API-->>UI: Draft redemption created

    Issuer->>UI: Submit For Approval
    UI->>API: Submit approval request
    API-->>UI: Status = Pending Listing

    Note over Issuer,Investor: 2. Notice - Announce or activate module
    Issuer->>UI: Listing Redemption
    UI->>Wallet: Personal Sign + Tx Sign
    Wallet->>SC: Listing redemption
    SC-->>API: Redemption listed
    API-->>UI: Status = Upcoming

    Issuer->>UI: Open For Redemption
    UI->>Wallet: Personal Sign + Tx Sign
    Wallet->>SC: Open redemption
    SC-->>API: Redemption opened
    API-->>UI: Status = Open For Redemption

    Note over Investor,UI: 3. Window - Operate participation window
    Investor->>UI: Open redemption detail in Marketplace
    Investor->>UI: Click Redeem
    UI->>Wallet: Sign redemption tx
    Wallet->>SC: Redeem request submitted
    SC-->>API: Redemption request recorded
    API-->>UI: Participation window updated

    Note over Issuer,SC: 4. Settlement - Snapshot, payment list, and burn
    API-->>UI: Redemption window closes
    API->>API: Lock snapshot and prepare payment list
    Issuer->>UI: Confirm settlement close-out
    UI->>Wallet: Personal Sign + Tx Sign
    Wallet->>SC: Burn redeemed units and settle cash leg
    SC-->>API: Settlement completed

    Note over API,User: 5. Completed - Close and reconcile event
    API-->>User: Redemption Record created
    API-->>UI: Event reconciled and received amount updated
```

### 17.4 Fund Distribution 时序图

```mermaid
sequenceDiagram
    actor Issuer as Issuer
    actor Investor as Investor
    participant UI as Fund Platform UI
    participant API as Backend API
    participant Wallet as Wallet
    participant SC as Smart Contract
    participant User as User Center

    Note over Issuer,API: 1. Draft & Approval - Create and authorize event
    Issuer->>UI: Create Fund Distribution
    UI->>API: Submit distribution form
    API-->>UI: Draft distribution created

    Issuer->>UI: Submit For Approval
    UI->>API: Submit approval request
    API-->>UI: Status = Pending Listing

    Note over Issuer,Investor: 2. Notice - Publish record-date notice
    Issuer->>UI: Listing Distribution
    UI->>Wallet: Personal Sign + Tx Sign
    Wallet->>SC: Listing distribution
    SC-->>API: Distribution listed
    API-->>UI: Status = Upcoming

    Note over Issuer,API: 3. Snapshot & Entitlement - Lock snapshot and prepare recipient file
    API-->>UI: Record date reached
    Issuer->>UI: Pending Allocation
    UI->>Wallet: Personal Sign
    Wallet->>SC: Confirm record-of-ownership snapshot
    SC-->>API: Snapshot confirmed

    API->>API: Calculate distribution amount per holder
    API-->>UI: Distribution List generated

    Note over Issuer,SC: 4. Release - Prepare and open payout
    Issuer->>UI: Allocation Completed
    UI->>Wallet: Personal Sign / Tx Sign if required
    Wallet->>SC: Confirm distribution allocation
    SC-->>API: Allocation completed

    Issuer->>UI: Open For Distribution
    UI->>Wallet: Sign Approve + Sign Open
    Wallet->>SC: Open distribution claim
    SC-->>API: Distribution opened
    API-->>User: Distribution Record visible with Accept action

    Note over API,User: 5. Completed - Reconcile and close event
    Investor->>User: Open Distribution Record
    Investor->>User: Click Accept
    User->>Wallet: Personal Sign + Tx Sign
    Wallet->>SC: Accept distribution
    SC-->>API: Distribution accepted
    API-->>User: Is Accepted = Yes
    API-->>UI: Event reconciled and closed
```

### 17.5 推荐使用方式

- 产品对齐时，优先先看 `17.1`，确认参与方和责任边界。
- 前后端联调时，优先看 `17.2`、`17.3`、`17.4`，确认事件顺序、状态切换和签名点。
- 如后续需要，我可以继续补 `stateDiagram-v2` 版本，把三个流程的状态机也画成 Mermaid 图，方便直接贴进开发任务系统。
