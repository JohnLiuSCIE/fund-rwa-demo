# TICKET：Open-end Fund（日常可申赎）Demo 改造

**类型：** Feature  
**优先级：** P0  
**阶段：** Demo  
**版本：** v0.1  
**适用范围：** 基于当前 Fund RWA Demo，对“开放式基金，且支持日常可申赎”的场景做产品与 UI 改造  

***

## 背景

当前项目虽然在创建基金时已经支持选择 `Open-end` / `Closed-end`，但从产品结构、状态机、页面语言和交互路径来看，整体仍然更接近“封闭式基金发行”逻辑：

- 发行主流程仍以一次性 `Subscription Period -> Allocation -> Issuance Active` 为核心
- `Open-end` 目前主要停留在字段层，而没有形成独立生命周期
- Redemption 目前被建模为“单次赎回事件”，不是开放式基金的持续申赎机制
- 当前页面没有体现 `T day order -> T+1 confirm -> NAV settlement -> cash/share booking` 这类开放式基金关键节奏
- 当前 demo 更容易演示“募集期内认购 + 截止后统一分配”，不适合演示“每日可申赎”

结合会议纪要，开放式基金的关键要求已经明确包括：

- 每日或周期性开放申购 / 赎回
- 每日收盘后进行 NAV 结算
- `T+1` 份额确权或回款确认
- 赎回前可能存在提前公示期
- 可能存在锁定期、赎回窗口、单用户最大赎回份额限制
- 链上动作与链下基金真实申购 / 赎回之间存在状态同步关系

因此需要新增一张独立 Ticket，将当前 demo 从“封闭式基金兼容 Open-end 字段”升级为“真正可演示开放式基金日常可申赎”的产品体验。

***

## 目标

本 Ticket 的目标不是把系统做成生产级 TA / Transfer Agent，而是让 demo 能清晰展示：

1. 开放式基金不是一次性发行后结束，而是进入持续运营期
2. 投资人可以在运营期内持续提交申购 / 赎回申请
3. 申请不会立刻成交，而是进入 `待确认 / 待结算 / 已确认` 的处理节奏
4. 每日 NAV、确认日、支付日、份额变动是 demo 中看得见的对象
5. 发行方 / 基金管理人可以配置开放规则、窗口规则、锁定期和赎回限制

***

## 本 Ticket 对现有 Demo 的核心判断

以下模块当前仍明显偏封闭式基金思路，需要改造：

- `Create Fund Issuance`
  - 更强调一次性募集和 allocation
  - 缺少开放式基金运营规则配置
- `Fund Issuance Detail`
  - 主要展示 `Subscription` 和 `Allocation`
  - 缺少持续申赎、NAV、确认队列视图
- `Create Fund Redemption`
  - 当前是手工创建一个 redemption event
  - 不像基于现有开放式基金创建“赎回机制”
- `Fund Redemption Detail`
  - 当前是单笔赎回窗口详情
  - 缺少申请列表、确认日、支付日、额度控制、状态流转
- App 状态 / mock 数据
  - 目前缺少 open-end 专属数据结构，如 `navFrequency`、`dealingCutoffTime`、`orderConfirmDate`、`settlementDate`、`pendingOrders`

***

## 产品假设

为了保证 demo scope 可控，本 Ticket 采用以下假设：

1. 本轮只覆盖开放式基金，不覆盖 ETF
2. 本轮优先支持 `Daily dealing` 语义，但数据结构允许扩展到 `Weekly` / `Monthly`
3. 本轮采用“申请提交后，按下一确认周期处理”的模式，不做实时成交
4. 本轮只做 demo 级 mock，不接真实 NAV 引擎、真实合约、真实链下 TA
5. 本轮允许把链下真实申购 / 赎回抽象成“Off-chain processing”状态

***

## 一、需要新增的核心产品能力

### 1. 持续申购 / 赎回机制

开放式基金的核心不是一次性 subscription，而是“基金 Active 后仍可继续接受新的申购和赎回申请”。

需要新增能力：

- 持续开放申购申请
- 持续开放赎回申请
- 支持按 `daily dealing cutoff time` 截止收单
- 申请进入处理队列，而不是立刻完成

Demo 中的表达应为：

- Investor 看到 `Subscribe` / `Redeem` 两个常驻动作入口
- Issuer 看到当日申请队列和待处理批次
- 系统显示“今天提交，下一确认日处理”

### 2. NAV 与确认机制

开放式基金必须把 NAV 和确认节奏做出来，否则会看起来像普通代币转账。

需要新增能力：

- 配置 NAV 更新频率
- 展示最新 NAV、上次更新时间、下次确认日
- 申购单显示“预估份额”与“最终确认份额”
- 赎回单显示“预估回款”与“最终确认金额”

Demo 中的表达应为：

- `Latest NAV`
- `Last NAV Update`
- `Next Dealing Cut-off`
- `Estimated Shares`
- `Confirmed Shares`
- `Estimated Redemption Amount`
- `Confirmed Cash Amount`

### 3. T+1 / 延迟确认状态机

开放式基金和封闭式基金最不一样的地方之一，是订单提交与最终确权之间有时间差。

需要新增能力：

- 申购订单状态：
  - `Submitted`
  - `Pending NAV`
  - `Pending Confirmation`
  - `Confirmed`
  - `Rejected`
- 赎回订单状态：
  - `Submitted`
  - `Pending Review`
  - `Pending NAV`
  - `Pending Cash Settlement`
  - `Completed`
  - `Rejected`

### 4. 开放规则与限制

开放式基金不是简单地“永远可赎回”，需要把规则配置做成显式界面。

需要新增能力：

- dealing frequency
- cut-off time
- notice period
- lock-up period
- redemption gate / 单用户最大赎回比例
- 暂停申购 / 暂停赎回

Demo 中建议至少支持：

- `Daily / Weekly / Monthly dealing`
- `Cut-off time`
- `Settlement cycle: T+1 / T+2`
- `Lock-up period`
- `Notice period`
- `Max redemption quantity per investor`
- `Subscription status: Open / Paused`
- `Redemption status: Open / Paused`

### 5. 运营期视角

当前 demo 里 `Issuance Active` 之后缺少真正的运营期管理界面。

需要新增能力：

- 运营看板
- 今日 NAV
- 今日待确认申购数
- 今日待确认赎回数
- 下一批结算时间
- 最近处理记录

***

## 二、Create Fund Issuance 需要如何修改

### 2.1 `Fund type = Open-end` 时，表单结构需要显式切换为“开放式运营规则”

当前问题：

- 现在即使选了 `Open-end`，下面仍主要是“募集期 + allocation”模型
- 对日常申赎所需参数覆盖不够

改造要求：

- 当选择 `Open-end` 时，页面出现一个明显的 `Open-end Rules` 区块
- 将部分一次性发行字段降级为“初始发行信息”
- 将持续运营相关字段提升为主配置

### 2.2 建议新增字段

放在 `About Deal` 或拆成新 step `Dealing & Settlement`：

| 字段名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `* Dealing frequency` | Dropdown | ✅ | `Daily` / `Weekly` / `Monthly` |
| `* Dealing cut-off time` | Time picker | ✅ | 当日收单截止时间 |
| `* NAV valuation time` | Time picker | ✅ | 当日估值时间 |
| `* Settlement cycle` | Dropdown | ✅ | `T+0` / `T+1` / `T+2`，默认 `T+1` |
| `Initial subscription window` | Date range | ❌ | 初始募集期，可选保留 |
| `Subscription status after launch` | Toggle | ✅ | `Open automatically` / `Pause manually` |
| `Redemption status after launch` | Toggle | ✅ | `Open automatically` / `Pause manually` |
| `Redemption gate per investor` | Number input | ❌ | 单用户单周期最大赎回份额 / 比例 |
| `Fund-level redemption gate` | Number input | ❌ | 单周期全基金最大赎回比例 |
| `Notice period for redemption` | Number input | ❌ | 提前通知天数 |
| `Order confirmation method` | Dropdown | ✅ | `Auto at cut-off` / `Issuer review then confirm` |

### 2.3 现有字段的行为调整

- `Maturity date`
  - 对 open-end 默认隐藏，保持现状
- `Subscription period`
  - 对 open-end 不应作为唯一认购入口
  - 建议改名为 `Initial subscription window`
- `Allocation rule`
  - 对 open-end 不应作为主逻辑
  - 建议只在“初始发行阶段”保留
- `Redemption frequency`
  - 应与 `Dealing frequency` 合并或重构，避免重复表达

### 2.4 创建成功后的结果页

当前成功语义偏“一次性发行项目创建”。

建议改为：

- 标题：`Create open-end fund successfully`
- 副文：`You can now configure daily dealing rules and manage ongoing subscriptions and redemptions.`

***

## 三、Fund Issuance Detail 需要如何修改

### 3.1 顶层定位从 `Issuance Detail` 升级为 `Fund Operation Detail`

对于 open-end fund，详情页不应只聚焦发行，而应在基金 Active 后切换成运营视角。

建议新增顶部状态区：

- `Fund Type`
- `Current NAV`
- `Next Cut-off`
- `Settlement Cycle`
- `Subscription Status`
- `Redemption Status`

### 3.2 Tab 结构建议调整

当前：

```text
Overview | Information | Subscription | Allocation
```

建议 open-end fund 改为：

```text
Overview | Information | Dealing | Orders | NAV History
```

其中：

- `Dealing`
  - 展示 dealing rules、cut-off、settlement cycle、lock-up、notice period
- `Orders`
  - 展示 subscription / redemption 两类订单列表
- `NAV History`
  - 展示最近若干次 NAV 和更新时间

### 3.3 Overview 页新增模块

- KPI 卡片
  - `Current NAV`
  - `Pending Subscription Orders`
  - `Pending Redemption Orders`
  - `Today Estimated Net Flow`
- Operational timeline
  - `Last NAV update`
  - `Next cut-off`
  - `Next confirmation batch`
  - `Next payment date`

### 3.4 Orders 页新增模块

建议提供两个子 tab：

- `Subscription Orders`
- `Redemption Orders`

每个列表至少包含：

- Order ID
- Investor
- Submit Time
- Order Type
- Requested Amount / Quantity
- Estimated Shares / Cash
- Final Confirmed Result
- Status
- Action

Issuer 侧允许的最小操作：

- `Review`
- `Reject`
- `Confirm Batch`

Investor 侧允许看到：

- 自己订单的状态进度
- 最终确认结果

***

## 四、Create Fund Redemption 需要如何修改

### 4.1 从“创建单次赎回事件”改成“创建 / 配置赎回机制”

当前问题：

- 页面要求手输 `Deal name`、`Token contract address`、`Redemption date`
- 这更像是临时活动，不像开放式基金的长期规则

改造要求：

- 创建 redemption 时必须先从已有 open-end fund 列表选择基金
- 不允许重新手填基金核心基础信息
- 页面定位改为 `Configure Redemption Rules` 或 `Create Redemption Window`

### 4.2 拆分两种模式

建议 UI 明确区分：

1. `Always Open (Daily Dealing)`
   - 每天可提交赎回申请
   - 每日 cut-off 后处理

2. `Window-based Redemption`
   - 仅在特定窗口开放
   - 适用于“每年开放一次 / 每季度开放一次”

这样既能覆盖“每天可以赎回”的理想开放式基金，也兼容会议里提到的周期性窗口型基金。

### 4.3 建议新增字段

| 字段名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `* Select Fund` | Searchable selector | ✅ | 只能选择 `Open-end` fund |
| `* Redemption mode` | Radio | ✅ | `Daily dealing` / `Window-based` |
| `* Effective date` | Date | ✅ | 规则生效日期 |
| `Window start / end` | DateTime | 条件必填 | 仅窗口模式显示 |
| `Announcement date` | DateTime | ❌ | 提前公示时间 |
| `Latest NAV source` | Read-only / selector | ✅ | 来源于 fund / mock |
| `Settlement cycle` | Read-only / dropdown | ✅ | 通常继承 fund |
| `Notice period` | Number | ❌ | 提前通知天数 |
| `Max redemption quantity per investor` | Number | ❌ | 限制单用户赎回 |
| `Manual approval required` | Toggle | ✅ | 是否需要人工审核 |
| `Pause redemption after listing` | Toggle | ❌ | 是否先挂起 |

### 4.4 页面文案需要修改

避免使用过强的一次性事件文案，建议改为：

- `Configure redemption rules`
- `Redemption dealing setup`
- `Open for redemption` 改成 `Activate redemption dealing`

***

## 五、Fund Redemption Detail 需要如何修改

### 5.1 详情页要从“单笔活动详情”改成“赎回运营页”

当前问题：

- 现在页面信息面板只展示固定价格、数量、总 liability
- 缺少申请列表和日常处理视图

建议结构：

- 左侧信息面板：
  - Fund
  - Fund token
  - Redemption mode
  - Current NAV
  - Cut-off time
  - Settlement cycle
  - Lock-up period
  - Max redemption quantity per investor
  - Status
- 右侧主内容：
  - `Overview`
  - `Requests`
  - `Batch History`

### 5.2 `Requests` 页新增申请列表

字段建议：

- Request ID
- Investor
- Holdings Available
- Requested Shares
- Request Time
- Effective NAV Date
- Estimated Cash Amount
- Status
- Action

状态建议：

- `Submitted`
- `Pending Review`
- `Pending NAV`
- `Pending Cash Settlement`
- `Completed`
- `Rejected`

### 5.3 `Batch History` 页新增批次记录

开放式基金通常需要体现按批次处理。

字段建议：

- Batch ID
- Cut-off date
- NAV used
- Total redemption requests
- Total shares redeemed
- Total cash amount
- Settlement date
- Batch status

### 5.4 Action 逻辑调整

当前 action 是：

- Draft
- Pending Listing
- Upcoming
- Open For Redemption

对于 open-end daily dealing，建议变成：

- `Draft`
- `Pending Approval`
- `Active`
- `Paused`

如果采用窗口模式，可附加：

- `Announced`
- `Window Open`
- `Window Closed`

***

## 六、Investor 侧需要新增的界面与交互

### 6.1 Fund Detail 页面新增常驻 CTA

对于 open-end fund，Investor 在 Marketplace 详情页应长期看到：

- `Subscribe`
- `Redeem`

但要根据规则显示禁用态：

- `Lock-up active`
- `Redemption paused`
- `Outside redemption window`
- `KYC required`

### 6.2 新增 Subscription Order Modal

字段建议：

- Subscription amount
- Estimated shares at latest NAV
- Next cut-off time
- Expected confirmation date
- Risk / compliance notice

提交成功后显示：

- `Order submitted`
- `This order will be processed at the next dealing cut-off.`

### 6.3 新增 Redemption Order Modal

字段建议：

- Available holdings
- Redeem quantity
- Estimated cash amount
- Latest NAV reference
- Expected payment date
- Notice on final amount being subject to confirmed NAV

### 6.4 User Center 新增订单追踪

建议用户中心增加：

- `My Subscription Orders`
- `My Redemption Orders`

每条显示：

- Order status
- Estimated / confirmed result
- NAV date
- Confirmation date
- Settlement date

***

## 七、状态机调整建议

### 7.1 Fund 级状态

当前 open-end fund 不应在 `Issuance Active` 后无事发生。

建议状态：

```text
Draft
-> Pending Approval
-> Upcoming Launch
-> Initial Subscription
-> Active Dealing
-> Paused
```

说明：

- `Initial Subscription` 用于首次募集阶段
- `Active Dealing` 才是开放式基金的长期主状态
- `Paused` 用于暂停申购或暂停赎回

### 7.2 Order 级状态

申购单：

```text
Submitted
-> Pending NAV
-> Pending Confirmation
-> Confirmed
-> Rejected
```

赎回单：

```text
Submitted
-> Pending Review
-> Pending NAV
-> Pending Cash Settlement
-> Completed
-> Rejected
```

### 7.3 Batch 级状态

```text
Scheduled
-> Processing
-> Confirmed
-> Settled
```

***

## 八、数据结构建议

当前 context / mock 数据需要新增 open-end 专属字段。

建议 Fund 对象增加：

- `dealingFrequency`
- `dealingCutoffTime`
- `navValuationTime`
- `settlementCycle`
- `subscriptionStatus`
- `redemptionStatus`
- `redemptionMode`
- `noticePeriodDays`
- `lockupPeriodDays`
- `maxRedemptionPerInvestor`
- `currentNav`
- `lastNavUpdateTime`
- `nextCutoffTime`

建议新增 Order 对象：

- `id`
- `fundId`
- `investorId`
- `type`
- `requestAmount`
- `requestQuantity`
- `estimatedNav`
- `confirmedNav`
- `estimatedSharesOrCash`
- `confirmedSharesOrCash`
- `submitTime`
- `confirmTime`
- `settlementTime`
- `status`

建议新增 Batch 对象：

- `id`
- `fundId`
- `type`
- `cutoffTime`
- `nav`
- `orderCount`
- `totalAmount`
- `status`

***

## 九、建议的 UI 改造优先级

### Phase 1：必须先做，才能像 open-end fund

- Create Fund Issuance 增加 `Dealing & Settlement` 规则
- Fund Detail 新增 `Current NAV`、`Next Cut-off`、`Orders`
- Create Redemption 改成选择已有基金 + 配置赎回模式
- Redemption Detail 新增请求列表
- Investor 侧新增 `Subscribe` / `Redeem` modal
- User Center 新增订单追踪

### Phase 2：增强 demo 说服力

- NAV History 页面
- Batch History 页面
- Pause / Resume dealing
- Window-based redemption 模式
- 发行方手动审核订单

### Phase 3：可留到后续讨论

- Distribution 与 open-end fund 的联动规则
- 链上 / 链下状态同步细节
- 真实 NAV engine / settlement integration
- 真实 whitelist / KYC 流程

***

## 十、开放问题

以下问题当前仍建议保留为待确认项，但不阻塞 demo 改造：

1. 本轮 demo 是否只做 `Daily dealing`，还是同时做 `Window-based redemption`
2. `T+1` 是否作为默认且唯一方案，还是允许 `T+0 / T+2`
3. Investor 下单后是否需要发行方人工审核
4. 当前 demo 中的“链上动作”要表达为真正成交，还是表达为“链上记录 + 链下确认”
5. Redemption 是否一定要求提前 `Announcement` 页面

***

## 十一、建议结论

如果我们决定把当前 demo 从封闭式基金扩展为“开放式基金，且支持日常可申赎”，那么最关键的不是简单增加几个字段，而是要把产品中心从：

```text
一次性发行 + 截止后分配
```

改成：

```text
基金上线后持续运营 + 订单按日确认与结算
```

这会直接影响：

- 信息架构
- 状态机
- 详情页布局
- Investor 入口
- Redemption 模块定位
- mock 数据结构

本 Ticket 建议作为下一轮 demo 改造的主 Ticket 使用。
