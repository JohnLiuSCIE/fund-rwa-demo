# TICKET：Fund RWA 发行平台 — 全流程 UI

**类型：** Feature  
**优先级：** P0  
**版本：** v1.0  
**角色覆盖：** Issuer（发行方）+ Investor（投资人）  
**钱包方案：** 自托管钱包（无需实现内嵌钱包 UI，右侧钱包面板不在本 Ticket 范围内）

***

## 背景与目标

在现有 Bond RWA 发行平台基础上，**新建一套完整的 Fund（基金）RWA 发行平台**，供 Issuer 发行基金份额代币、供 Investor 认购及领取分配。  

整体流程阶段与 Bond 保持一致，页面布局（顶部导航 + 左侧 Manage 菜单 + 主内容区）复用现有框架：

```
Listing Fund  →  Subscription Period  →  Allocation Period  →  Issuance & Accept Fund  →  Accept Allocation
```

***

## 一、导航菜单

### 1.1 顶部导航

保持现有三个主菜单：`Create` | `Manage` | `Marketplace`

### 1.2 Create 下拉菜单 — 新增项

| 新增菜单项 |
|---|
| Create Fund Issuance |

### 1.3 Manage 下拉菜单 — 新增项

| 新增菜单项 |
|---|
| Manage Fund Issuance |
| Manage Fund Redemption |

***

## 二、Create Fund Issuance 表单页

**路由：** `/create/fund-issuance`  
**页面标题：** `Create Fund Issuance`  
**进度步骤条（顶部横向）：**

```
About Deal  |  About Token  |  Subscription & Rules  |  Fund Documents  |  Fee Charge
```

每个 Tab 填写完毕后点击 `Next` 进入下一步；任意步骤可点击 Tab 标题跳回。最后一步显示 `Create` 按钮。

***

### 2.1 Tab 1：About Deal

> 所有标 `*` 的字段为必填。

| 字段名 | 控件类型 | 必填 | 备注 |
|---|---|---|---|
| `* Fund name` | Text input | ✅ | 基金全称 |
| `* Fund description` | Textarea | ✅ | 基金简介 |
| `* Fund type` | Dropdown | ✅ | 选项：`Open-end`（开放式） / `Closed-end`（封闭式） |
| `* Deal size unit` | Dropdown | ✅ | 计价货币，如 `Bean` / `USDC` |
| `* Target fund size` | Number input + unit label | ✅ | 募集目标总金额，如 `1,000,000 Bean` |
| `* Minimum subscription amount` | Number input + unit label | ✅ | 单笔最低认购金额 |
| `* Maximum subscription amount per investor` | Number input + unit label | ✅ | 单个投资人上限 |
| `* Initial subscription price` | Number input + unit label | ✅ | 每份额初始认购价（即初始 NAV）|
| `* Management fee (% p.a.)` | Number input + `%` suffix | ✅ | 年化管理费率，如 `1.5` |
| `Performance fee (%)` | Number input + `%` suffix | ❌ 可选 | 超额收益提成比例 |
| `* Investment strategy` | Textarea | ✅ | 基金投资策略说明 |
| `* Fund manager` | Text input | ✅ | 基金管理人名称或机构名 |
| `* Redemption frequency` | Dropdown | ✅ | 选项：`Daily` / `Weekly` / `Monthly` / `Quarterly` / `None` |
| `Redemption notice period (days)` | Number input | ❌ 可选 | 赎回提前通知天数 |
| `Lock-up period` | Duration picker | ❌ 可选 | 封闭期，格式：`X Days / Months / Years`；当 Fund type = `Open-end` 时可留空 |
| `* Issue date` | Date + Time picker | ✅ | 基金成立日期，同 Bond 日期选择器样式 |
| `Maturity date` | Date + Time picker | ❌ 条件显示 | **仅当 Fund type = `Closed-end` 时展示此字段**；Open-end 隐藏 |
| `References` | 动态列表 | ❌ 可选 | 每条可选 `File`（上传，Max 1 file per item）或 `Link`（输入 URL）；可 `+ Add Reference`，每条有 `X` 删除按钮 |

**字段交互规则：**
- 当 `Fund type` 切换为 `Closed-end` 时，动态插入 `Maturity date` 字段（在 `Issue date` 下方）。
- 当 `Fund type` 切换为 `Open-end` 时，`Maturity date` 字段隐藏，已填写的值清空。

***

### 2.2 Tab 2：About Token

| 字段名 | 控件类型 | 必填 | 备注 |
|---|---|---|---|
| `* Name of fund token` | Text input | ✅ | 基金代币全称，如 `DEMO-FUND-2024` |
| `* Symbol of fund token (limit in 15 letters)` | Text input | ✅ | 代币 Ticker，最多 15 字符 |
| `* Is token tradable on secondary market` | Toggle: `Yes` / `No` | ✅ | 是否支持二级市场流通 |

***

### 2.3 Tab 3：Subscription & Rules

| 字段名 | 控件类型 | 必填 | 备注 |
|---|---|---|---|
| `* Subscription lot size` | Number input | ✅ | 认购单位份额数 |
| `* Subscription minimum quantity` | Number input | ✅ | 最小认购数量（单位：lot） |
| `* Subscription maximum quantity` | Number input | ✅ | 最大认购数量 |
| `* Subscription period` | Date range picker | ✅ | 认购开始时间 ~ 认购结束时间，同 Bond 的日期时间选择器样式（分钟/秒滚轮） |
| `* Allocation rule` | Dropdown | ✅ | 选项：`Pro-rata`（按比例，默认）/ `First-come-first-served`（先到先得）；**不含 Lottery 选项** |
| `Investor rules` | 动态规则列表 | ❌ 可选 | 每条规则包含：`* Investor rules type`（Dropdown：`Investor type` / `Investor jurisdiction`）+ `* Condition Type`（`Must be`）+ 对应值（`All investors` / `All Jurisdictions` 等）；可 `+ Add Rule` 添加，每条有删除按钮 |

***

### 2.4 Tab 4：Fund Documents

> 对应 Bond 的 `Asset Custody` Tab，更名并调整内容。

| 字段名 | 控件类型 | 必填 | 备注 |
|---|---|---|---|
| `* Fund administrator` | Text input | ✅ | 基金行政管理人名称 |
| `* Custodian of fund assets` | Text input | ✅ | 资产托管机构名称 |
| `Custodian contact number` | Text input | ❌ 可选 | 托管方联系方式 |
| `* Upload: Fund offering document / Prospectus` | File upload button | ✅ | 募集说明书，支持 PDF；单文件；必传 |
| `Upload: Fund fact sheet` | File upload button | ❌ 可选 | 基金概要说明书，支持 PDF |
| `Upload: Other supporting documents` | Multi-file upload | ❌ 可选 | 文件类型：JPG / PNG / GIF / PDF；单文件 max 500MB；可多个 |

***

### 2.5 Tab 5：Fee Charge

展示平台佣金说明文本（纯文本展示，不含输入字段），内容示例：

> We normally charge issuer the fund subscription amount(s) subject to listing, in [unit] as commission fee. If issuer terminates this fund issuance application after listing, the commission fee is not refundable.  
> The commission fee will be charged once upon listing the deal. For any query about the commission fee, you can contact us at [contact email].

***

### 2.6 表单提交

点击 `Create` 按钮后：
- 若成功：弹出全屏成功提示页
  - 标题：`Create fund issuance successfully`
  - 副文：`You can click to view fund deal detail page.`
  - 按钮：`View Detail`（跳转至 Fund Issuance Detail 页，初始状态 `Draft`）
- 若失败：Toast 错误提示

***

## 三、Manage Fund Issuance 列表页

**路由：** `/manage/fund-issuance`  
**页面标题：** `Fund Issuance List`

列表表格列定义：

| 列名 | 说明 |
|---|---|
| ID | 记录 ID（可点击 Copy） |
| Asset Type | 固定值 `Fund` |
| Status | 当前状态 Badge（见第六节状态机） |
| Allocation Status | `Upcoming` / `Ongoing` / `Put On Chain` / `Unknown` |
| Name | 基金名称 |
| Description | 基金描述 |
| Action | `Copy`（复制 ID）|
| Created Time | 创建时间，格式 `YYYY-MM-DD HH:mm:ss` |

***

## 四、Fund Issuance Detail 页（Issuer 视角）

**路由：** `/fund-issuance/{id}`  
**适用角色：** Issuer（Manage 路径）和 Investor（Marketplace 路径，只读）

***

### 4.1 页面头部

```
{Fund Name}    [{Status Badge}]

[{操作按钮组，按状态显示}]
```

### 4.2 Tab 导航

```
Overview  |  Information  |  Subscription  |  Allocation
```

> Bond 的 `Coupon Data` Tab 不存在于 Fund 中。

***

### 4.3 Information Panel（左侧信息面板）

> 所有字段只读展示。上链前 Token Contract Address 显示 `–`；上链后显示完整地址 + `Copy` 按钮。

| 字段名 | 显示示例 |
|---|---|
| Fund Token | `DEMO-FUND-2024` |
| Token Contract Address | `0xa7E4...cb120`（含 Copy 按钮）/ `–` |
| Asset Type | `Fund` |
| Min Subscription Amount | `1 Bean` |
| Max Subscription Amount | `1,000 Bean` |
| Initial NAV / Issue Price | `90 Bean` |
| Fund Type | `Open-end` / `Closed-end` |
| Management Fee | `1.5% p.a.` |
| Performance Fee | `10%` / `N/A` |
| Redemption Frequency | `Monthly` |
| Lock-up Period | `90 Days` / `None` |
| Tradable | `Yes` / `No` |
| Fund Manager | `{管理人名称}` |
| Target Fund Size | `1,000,000 Bean` |

> 移除字段（相比 Bond）：~~Redemption Price~~、~~Yield to Maturity~~、~~Tenor~~

***

### 4.4 Timeline Panel（右侧时间轴）

| 时间节点 | 格式 |
|---|---|
| Subscription Start Date | `YYYY-MM-DD HH:mm:ss` + 倒计时 `X Hour(s) X Minute(s) X Second(s)` |
| Subscription End Date | 同上 |
| Issue Date | 同上 |
| Maturity Date | **仅 Closed-end Fund 显示**；Open-end 隐藏此行 |

***

### 4.5 Subscription Tab 内容

**Subscription Summary（汇总卡片）：**

| 字段 | 说明 |
|---|---|
| Target Fund Size | 募集目标总金额 |
| Subscribed Amount | 已认购金额 |
| Received Amount | 已收款金额（Bean） |
| Remaining Amount | 剩余可认购金额 |

**Subscription List（认购明细表）：**

| 列名 | 说明 |
|---|---|
| ID | 认购记录 ID |
| Status | `Live` / `Pending` / `Done` |
| Issue Price | 认购单价 |
| Quantity | 认购数量 |
| Total Amount | 认购总金额 |
| Subscribe Time | 认购时间 |
| Updated Time | 最后更新时间 |

***

### 4.6 Allocation Tab 内容

**Allocation Summary（汇总卡片）：**

| 字段 | 说明 |
|---|---|
| Allocated Total Amount | 已分配总份额数 |
| Allocated Investors | 已分配投资人数量 |
| Reserved Fund Amount | 预留资金总额（Bean） |

**Allocation List（分配明细表）：**

| 列名 | 说明 |
|---|---|
| ID | 分配记录 ID |
| Status | `Pending` / `Done` |
| Quantity | 分配份额数量 |
| Is Accepted | `Yes` / `No` |
| Allocate Time | 分配时间 |
| Updated Time | 最后更新时间 |

***

## 五、Issuer 操作 Modal 全集

所有 Modal 采用统一三步进度条设计：

```
① Start  →  ② Sign  →  ③ [操作名 Completed / Executed]
```

进度条每步含圆形步骤编号 + 步骤标签；当前步骤高亮，已完成步骤打勾。

***

### 5.1 Submit For Approval Modal

触发：Detail 页 `Submit For Approval` 按钮点击  
**弹窗内容：**
- 标题：`Submit For Approval`
- 正文：`Confirmation — Are you sure you want to submit this deal for approval?`
- 按钮：`Cancel`（关闭）| `Confirm`（确认提交）
- 成功提示页：`Submit fund issuance successfully. You can click to view fund deal page.` + `View Detail` 按钮

***

### 5.2 Listing Modal（三步）

触发：管理员审批通过后，Detail 页出现 `Listing` 按钮

**Step 1 — Start：**
- 展示 Fund 信息摘要（Fund name、Token address、Target fund size、Issue date、Subscription period 等）
- 提示文案：`You need to sign transaction for listing via your wallet.`
- 按钮：`Start`

**Step 2 — Personal Sign：**
- 弹出签名请求框
- 标题：`Personal Sign`
- 副文：`Please personal sign to proceed`
- 底部调用自托管钱包，等待签名响应

**Step 3 — 完成：**
- `!` 图标 + `Listing deal has been executed`
- 副文：`You can go to Inbox page to view your request.`
- 按钮：`Goto Inbox`

***

### 5.3 Open For Subscription Modal（三步）

触发：Detail 页状态到达 `Upcoming`，`Open For Subscription` 按钮出现

**Step 1 — Start：**
- 提示：`You need to sign transaction for open for subscription via your wallet.`
- 按钮：`Sign`

**Step 2 — Personal Sign：**
- 同 5.2 Step 2

**Step 3 — 完成：**
- `Open for subscription has been executed. You can go to Inbox page to view your request.` + `Goto Inbox`

***

### 5.4 Pending Allocation Modal（三步）

触发：订阅期结束后，Issuer 点击 `Pending Allocation`

**Step 1 — Start：**
- 展示当前认购汇总信息
- 提示：`You are going to proceed to pending allocation.`
- 按钮：`Start`

**Step 2 — Personal Sign：**
- 同 5.2 Step 2

**Step 3 — 完成：**
- `Pending allocation has been executed. You can go to Inbox page to view your request.` + `Goto Inbox`

***

### 5.5 Allocate Deal（链下计算，无 Modal）

触发：Pending Allocation 完成后，Issuer 点击 `Allocate` 按钮  
- 系统后台执行链下分配计算（Pro-rata 或 First-come-first-served）
- 完成后 Toast 提示：`Allocate deal has been executed. You can go to Inbox page to view your request.`
- Allocation List 出现各投资人的分配条目，状态为 `Pending`，`Is Accepted = No`

***

### 5.6 Allocate On Chain Modal（三步）

触发：链下计算完成后，Issuer 点击 `Allocate On Chain`

**Step 1 — Start：**
- 提示：`You need to sign transaction for on-chain allocation via your wallet.`
- 按钮：`Start`

**Step 2 — Sign（两步签名）：**
- 先：`Personal Sign — Please personal sign to proceed`（自托管钱包 Personal Sign）
- 后：`Sign Transaction — Please verify the smart contract call`（ERC-20 approve + 链上 allocate call）

**Step 3 — 完成：**
- `Allocation on chain has been executed. You can go to Inbox page to view your request.` + `Goto Inbox`

***

### 5.7 Allocation Completed Modal（三步）

触发：On Chain 成功后，Issuer 点击 `Allocation Completed`

**Step 1 — Start：**
- 提示文案 + `Start` 按钮

**Step 2 — Sign（两步签名）：**
- Personal Sign + Transaction Sign（同 5.6）

**Step 3 — 完成：**
- `Allocation completed has been executed. You can go to Inbox page to view your request.` + `Goto Inbox`

***

### 5.8 Accept Fund Modal（三步）

触发：状态达到 `Issuance Completed`，Issuer 点击 `Accept Fund`

**Step 1 — Start：**
- 提示：`You need to sign transaction for accepting fund via your wallet.`
- 按钮：`Start`

**Step 2 — Sign：**
- Personal Sign + Transaction Sign

**Step 3 — 完成：**
- `Accept fund has been executed. You can go to Inbox page to view your request.` + `Goto Inbox`
- 状态更新为 `Issuance Active`（基金运营中）

***

## 六、Issuer 侧状态机

```
Draft
  │ 点击 Submit For Approval → 弹 Confirm Modal
  ▼
Pending Listing
  │ Cancel Deal Listing（可取消）
  │ 审批通过 → Listing Modal（Personal Sign + Tx Sign）
  ▼
Upcoming
  │ 自动（到达 Subscription Start Date）或 Issuer 点击 Open For Subscription
  ▼
Open For Subscription
  │ 自动（到达 Subscription End Date）
  ▼
Allocation Period  [Pending Allocation]
  │ Issuer → Pending Allocation Modal（Personal Sign）
  ▼
Calculated  [Allocate Deal]
  │ Issuer → 点击 Allocate（链下计算，无 Modal）
  ▼
Allocate On Chain
  │ Issuer → Allocate On Chain Modal（Personal Sign + Tx Sign）
  ▼
Allocation Completed
  │ Issuer → Allocation Completed Modal（Personal Sign + Tx Sign）
  ▼
Issuance Completed
  │ Issuer → Accept Fund Modal（Personal Sign + Tx Sign）
  ▼
Issuance Active（基金运营中，Open-end 无终止；Closed-end 见待澄清 Q1）
```

**各状态对应操作按钮（仅列出该状态下可点击项）：**

| 状态 | 显示按钮 |
|---|---|
| Draft | `Edit` + `Submit For Approval` |
| Pending Listing | `Cancel Deal Listing` + `Listing`（Admin 操作） |
| Upcoming | `Open in Explorer` |
| Open For Subscription | — |
| Allocation Period | `Pending Allocation` |
| Calculated | `Allocate` |
| Allocate On Chain | `Allocate On Chain` |
| Allocation Completed | `Allocation Completed` |
| Issuance Completed | `Accept Fund` |
| Issuance Active | — |

***

## 七、Marketplace — 基金列表页（Investor 视角）

**路由：** `/marketplace/fund-issuance`

页面包含一个列表区块 `Fund Issuance List`，表格列：

| 列名 | 说明 |
|---|---|
| ID | 记录 ID |
| Name | 基金名称 |
| Description | 基金描述 |
| Asset Type | `Fund` |
| Status | 当前状态 Badge |

点击任意行进入 Fund Issuance Detail 页（Investor 只读视角，同第四节，无操作按钮）。  
当状态为 `Open For Subscription` 时，Detail 页右上角出现 `Subscribe` 按钮。

***

## 八、Subscribe Modal（Investor 认购，四步）

触发：Investor 在 Marketplace Detail 页点击 `Subscribe`

```
① Start  →  ② Sign Approve  →  ③ Sign Subscribe  →  ④ Subscribe（完成）
```

**Modal 内信息展示区（只读）：**

| 字段名 | 说明 |
|---|---|
| Fund Name | 基金名称 |
| Token Contract Address | `–` / `0x...` |
| Asset Type | `Fund` |
| Initial NAV / Issue Price | 当前认购单价 |
| Subscription lot size | 认购单位 |
| Subscription minimum quantity | 最小数量 |
| Subscription maximum quantity | 最大数量 |

**Investor 输入区：**

| 字段名 | 控件 | 说明 |
|---|---|---|
| `Subscription quantity` | Number input | Investor 手动输入认购数量 |
| `Subscription amount` | 只读，自动计算 | = quantity × Issue Price，实时更新显示 |

**`Subscribe` 按钮** → 进入步骤流：

**Step 2 — Sign Approve（ERC-20 Approve）：**
- 提示：`Please personal sign to proceed`（Personal Sign）

**Step 3 — Sign Subscribe（链上认购）：**
- 提示：`Please verify the smart contract call`（Transaction Sign）
- DApp 标识：`Tokenization Platform Asset`

**Step 4 — 完成：**
- 关闭 Modal，页面刷新，Subscription List 出现该条认购记录，Status = `Live`

***

## 九、User 个人中心（`/user`）

### 9.1 Tab 列表

| Tab 名称 | 与 Bond 对比 | 说明 |
|---|---|---|
| Info | 无变化 | 个人信息 |
| Issued Token Record | 无变化 | 已发行代币记录 |
| Subscribed Deal Record | 无变化 | 已认购产品汇总 |
| Subscription Record | 无变化 | 逐条认购记录 |
| Allocation Record | 无变化 | 分配记录（含 Accept 入口） |
| Refund Record | 无变化 | 退款记录 |
| Redemption Record | 无变化 | 赎回记录 |
| Distribution Record | **新增**（原 Bond 无此 Tab） | 基金分红领取记录（本版本可先展示空状态 No data） |

***

### 9.2 Allocation Record Tab 详细设计

**表格列：**

| 列名 | 说明 |
|---|---|
| ID | 分配记录 UUID |
| Deal ID | 对应基金发行 ID |
| Status | `Success` / `Pending` / `Failed` |
| Quantity | 分配份额数量 |
| Is Accepted | `Yes` / `No` |
| Action | 当 `Is Accepted = No` 且 `Status = Success` 时，显示 **`Accept`** 按钮；否则为空 |
| Allocate Time | 分配时间，格式 `YYYY-MM-DD HH:mm:ss` |

***

### 9.3 Accept Allocation Modal（三步）

触发：Investor 在 Allocation Record 中点击 `Accept` 按钮

```
① Start  →  ② Personal Sign  →  ③ Transaction Sign  →  完成
```

**Step 1 — Start：**
- 展示该条分配信息：Deal ID、分配数量、分配时间
- 按钮：`Start`

**Step 2 — Personal Sign：**
- 标题：`Personal Sign`
- 副文：`Please personal sign to proceed`
- 调用自托管钱包，等待签名

**Step 3 — Transaction Sign：**
- 标题：`Sign Transaction`
- 副文：`Please verify the smart contract call`
- DApp 标识：`Tokenization Platform Asset`
- 合约地址：`0x...`（链上分配合约）

**完成后：**
- `Accept allocation has been executed.`
- 该条记录的 `Is Accepted` 更新为 `Yes`，`Action` 列按钮消失
- 投资人钱包中出现对应份额代币

***

### 9.4 Distribution Record Tab（本版本 v1.0）

展示状态：空表格 + `No data` 提示  
预留列定义（供后续版本实现分红功能使用）：

| 列名 | 说明 |
|---|---|
| ID | 分红记录 UUID |
| Deal ID | 对应基金 ID |
| Status | `Done` / `Pending` |
| Distribution Amount | 本次分红总金额 |
| Commission Amount | 平台佣金 |
| Received Amount | 投资人实际到账 |
| Is Accepted | `Yes` / `No` |
| Action | `Accept`（未领取时显示） |
| Distribution Time | 分红时间 |

***

## 十、Investor 侧状态流（用户可感知）

```
[Marketplace] 看到 Fund — Status: Upcoming
      ↓（时间到达 Subscription Start Date）
Status: Open For Subscription  →  出现 Subscribe 按钮
      ↓ 投资人认购（Subscribe Modal 四步）
认购记录出现在 User → Subscription Record Tab（Status: Live）
      ↓（Subscription End Date 到达，系统/Issuer 进入 Allocation Period）
等待 Issuer 分配（无 Investor 操作）
      ↓（Issuer 完成 Allocate On Chain + Allocation Completed）
User → Allocation Record Tab 出现条目（Is Accepted: No，显示 Accept 按钮）
      ↓ 投资人点击 Accept（Accept Allocation Modal 三步）
Is Accepted: Yes → 份额代币到账钱包
```

***

## 十一、自托管钱包集成点汇总

| 触发操作 | 签名类型 | 触发方 | 步骤说明 |
|---|---|---|---|
| Listing | Personal Sign | Issuer | Step 2 |
| Open For Subscription | Personal Sign | Issuer | Step 2 |
| Pending Allocation | Personal Sign | Issuer | Step 2 |
| Allocate On Chain | Personal Sign + Transaction Sign | Issuer | Step 2（两次签名） |
| Allocation Completed | Personal Sign + Transaction Sign | Issuer | Step 2（两次签名） |
| Accept Fund | Personal Sign + Transaction Sign | Issuer | Step 2（两次签名） |
| Subscribe — ERC-20 Approve | Transaction Sign | Investor | Step 2 |
| Subscribe — 链上认购 | Transaction Sign | Investor | Step 3 |
| Accept Allocation — Personal Sign | Personal Sign | Investor | Step 2 |
| Accept Allocation — 链上 Accept | Transaction Sign | Investor | Step 3 |

***

## 十二、待澄清问题

| # | 问题 | 影响范围 | 优先级 |
|---|---|---|---|
| Q1 | Closed-end Fund 到期后是否有单独的清算（Liquidation）流程？还是复用 Redemption？ | 状态机 / 后续模块 | 高 |
| Q2 | Edit 功能在 `Pending Listing` 状态下哪些字段可编辑？是否全字段可编辑？ | Create Form / Detail Page | 高 |
| Q3 | Subscription Summary 中是否对所有 Marketplace 访客可见（包括未认购用户）？还是只有认购过的投资人才可见？ | Marketplace Detail Page | 中 |
| Q4 | `Allocation rule = First-come-first-served` 时，超额认购如何处理退款？是否自动退款还是需要 Issuer 手动操作？ | Allocation 逻辑 | 中 |
| Q5 | Distribution Record（分红）功能是否计划在 v1.1 实现？是否需要在本版本预埋后端接口？ | User Tab / 后端 | 低 |