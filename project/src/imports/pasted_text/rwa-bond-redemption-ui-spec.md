# Ticket: RWA Bond Redemption 全流程 UI 实现

**Platform:** Dorayaki Dream Factory (`dev.openchopstick.com`)  
**角色:** Issuer（发行方）+ Investor（投资者）  
**功能范围:** Bond Redemption 的完整生命周期

---

## 整体流程概述

本 Ticket 描述 RWA 债券赎回（Bond Redemption）的三阶段流程：

1. **Listing Redemption**：Issuer 创建并发布一笔 Redemption Deal，经过链上签名后进入 Upcoming 状态
2. **Open for Redemption**：Issuer 手动将 Redemption 状态切换为 Open，允许投资者申请赎回
3. **Access Redemption**：Investor 在 Marketplace 发现并执行赎回操作，完成代币销毁与稳定币收款

---

## 前置条件

在进入 Redemption 流程之前，系统已存在一个处于 **Issuance Completed** 状态的债券，示例如下：

| 字段 | 值 |
|---|---|
| Issue Token | DEMO-2024-06 |
| Token Contract Address | `0x7Ed246D40431435B5Cd3652ea34b5983cb120Ec` |
| Asset Type | Bond |
| Min Amount | 1 Bean |
| Max Amount | 1000 Bean |
| Initial Price | 90 Bean |
| Redemption Price | 100 Bean |
| Tradable | Yes |
| Tenor | 1 Hour(s) 0 Minute(s) 0 Second(s) |
| Yield to Maturity | 11.11% |

该债券的 Overview 页显示 **"Issuance Completed"** 状态标签，右上角有 **"Accept Fund"** 按钮，并包含 Information 和 Timeline 两个 Section。

---

## 阶段一：Listing Redemption（发行方创建赎回）

### 1.1 入口导航

顶部导航栏有三个菜单：**Create**、**Manage**、**Marketplace**

可通过两种路径进入创建表单：

- **路径 A（Manage）：** `Manage → Manage Bond → Manage Bond Redemption`，进入管理列表页后，列表右上角有 Create 入口
- **路径 B（Create）：** `Create → Create Bond → Create Bond Redemption`，直接跳转创建表单

### 1.2 创建表单页：`/bond/redemption/create`

页面标题：**"Create Bond Redemption"**，右上角有蓝色 **"Create"** 按钮。

页面右侧有三个 Section 导航锚点：
- `About Deal`（当前激活）
- `Rules`
- `Fee Charge`

#### Section 1: About Deal

| 字段名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| Deal name | Text input | ✅ | 输入后右侧显示绿色 ✓ 状态图标 |
| Deal description | Text input | ✅ | 输入后右侧显示绿色 ✓ 状态图标 |
| Token contract address | Text input + 搜索图标 🔍 | ✅ | 输入合约地址后，系统自动填充 Token symbol |
| Token symbol | Text input（只读，自动填充） | — | 根据合约地址自动解析，例如 `DEMO-2024-06` |
| Redemption date | Date picker | — | 格式：`YYYY-MM-DD HH:MM:SS`，例如 `2024-06-19 16:45:00`，输入后显示绿色 ✓ |
| Payment date | Date picker | ✅ | 格式同上，例如 `2024-06-19 16:45:00`，输入后显示绿色 ✓ |
| Issue price | Number input（只读，自动填充） | — | 从合约自动读取，单位 Bean，例如 `90` |
| Par value | Number input（只读，自动填充） | — | 从合约自动读取，单位 Bean，例如 `100` |
| Redemption price | Number input | ✅ | 手动输入，单位 Bean，例如 `100`，输入后显示绿色 ✓ |
| Redemption quantity | Number input | — | 手动输入，例如 `11` |
| Total liability amount | Number input（只读，自动计算） | — | `Redemption price × Redemption quantity`，例如 `1,100 Bean` |

#### Section 2: Rules

该 Section 允许为 Investor 设定准入条件，支持动态新增多条规则。

**Investor rules（动态列表，支持 "+ Add Rule" 和 "×" 删除）：**

每条规则（Item）包含：

| 字段 | 类型 | 可选值 |
|---|---|---|
| Investor rules type | Dropdown | `Investor type` / `Investor jurisdiction` |
| Condition Type | Dropdown，必填 | 默认值 `Must be` |
| Investor type | Dropdown（当上方选 Investor type 时显示） | `All investors` |
| Investor jurisdiction | Dropdown（当上方选 Investor jurisdiction 时显示） | `All Jurisdictions` |

示例数据（两条规则）：
- Item1：Investor rules type = `Investor type`，Condition Type = `Must be`，Investor type = `All investors`
- Item2：Investor rules type = `Investor jurisdiction`，Condition Type = `Must be`，Investor jurisdiction = `All Jurisdictions`

#### Section 3: Fee Charge

以静态文字展示说明：

> "We normally charge issuer **the redemption amount (is subject to listing, in Bean)** as commission fee. If issuer terminates the redemption application after listing, the commission fee is not refundable.
> The commission fee will be charged when issuer listing the deal. For any query about the commission fee, you can contact via admin@???.com"

注：粗体文字为可点击链接样式。

### 1.3 提交创建 → 成功页

点击右上角 **"Create"** 按钮后跳转至成功页面：

- URL：`/result/bond-success?type=redemption&action=create_bond_redemption_success&id=...`
- 绿色 ✅ 勾选图标（圆形，绿底白钩）
- 文字：**"Create bond redemption successfully"**
- 副文字：`"You can click to view bond deal detail page."`
- 蓝色按钮：**"View Detail"**

### 1.4 Redemption 详情页（Draft 状态）

点击 "View Detail" 后，跳转至 `/bond/redemption/{id}`：

- **标题：** `Redemption` + 状态标签 `[Draft]`（灰色 Badge）
- **副标题：** `Redemption-Desc`（即 Deal description）
- **右上角按钮：** `Edit`（次要）+ `Submit For Approval`（蓝色主按钮）
- **Tab 导航：** `Overview`（当前激活）

**Overview Section — Information：**

| 字段 | 值（示例） |
|---|---|
| Issue Token | DEMO-2024-06 |
| Token Contract Address | `0x7Ed246D40431435B5Cd3652ea34b5983cb120Ec` + 复制图标 |
| Asset Type | Bond |
| Redemption Date | 2024-06-19 16:45:00 |
| Payment Date | 2024-06-19 16:45:00 |
| Initial Price | 90 Bean |
| Redemption Price | 100 Bean |
| Yield to maturity | 11.11% |

### 1.5 Submit For Approval → 确认弹窗

点击 **"Submit For Approval"** 后，弹出确认 Modal：

- **标题：** `Submit For Approval Confirmation`
- **内容：** `"Are you sure you want to submit this deal for approval?"`
- **右上角：** `×` 关闭按钮
- **操作按钮：** `Cancel`（灰色）+ `Confirm`（蓝色）

点击 **Confirm** 后，跳转至成功页：

- URL：`/result/bond-success?type=redemption&action=submit_bond_redemption_success&id=...`
- 绿色 ✅ 图标
- 文字：**"Submit bond redemption successfully"**
- 副文字：`"You can click to view bond deal detail page."`
- 蓝色按钮：**"View Detail"**

### 1.6 Redemption 详情页（Pending Listing 状态）

Submit 成功后状态变更为 `[Pending Listing]`（蓝色 Badge）：

- **右上角按钮：** `Cancel Deal`（红色边框）+ `Listing`（蓝色主按钮）

### 1.7 Listing 流程（链上多步签名）

点击 **"Listing"** 按钮，弹出 **"Listing Deal"** Modal，内含 4 步进度条：

```
① Start  →  ② Sign Approve  →  ③ Sign Subscribe  →  ④ Listing
```

**Step ①（Start）：**
- 内容：`"You need to sign transaction for listing via your wallet."`
- 按钮：`Start`（蓝色）

**Step ②（Sign Approve）：**
- 内容：`Personal Sign — Please personal sign to proceed`
- 显示旋转加载动画（spinner）
- **自托管钱包集成点：** 系统向钱包发起 `approve` 合约调用
  - `DApp: Tokenization Platform`
  - `Asset: 0x2067bffbd3...e57dc9f91264`
  - `From: 0x9E8d927043...`
- 用户在钱包端确认后，Step ② 标记为 ✅，进入 Step ③

**Step ③（Sign Subscribe）：**
- 内容：`Personal Sign — Please personal sign to proceed`
- 再次向钱包发起合约调用，Asset 地址不同（`0x98650bc77f...647dab3b5497`）
- 用户确认后，Step ③ 标记为 ✅，进入 Step ④

**Step ④（Listing 完成）：**
- 蓝色 ℹ️ 图标
- 文字：**"Listing deal has been executed"**
- 副文字：`"You can goto Inbox page to view your request."`
- 按钮：**"Goto Inbox"**

### 1.8 Redemption 详情页（Upcoming 状态）

Listing 完成后状态变更为 `[Upcoming]`（蓝绿色 Badge）：

- **右上角按钮：** `Open For Redemption`（蓝色主按钮）+ 刷新图标 🔄

---

## 阶段二：Open for Redemption（开放赎回）

### 2.1 Bond Redemption List 页面（`/bond/redemption/list`）

路径：`Manage → Manage Bond → Manage Bond Redemption`

列表包含以下列：

| 列名 | 说明 |
|---|---|
| ID | 可点击链接，截断显示 |
| Asset Type | 例如 `Bond` |
| Status | Badge：`Upcoming`（蓝绿）/ `Open For Redemption`（绿色）/ `Draft`（灰色） |
| Name | Deal 名称 |
| Description | Deal 描述 |
| Action | `Copy` 按钮 |
| Created Time | 创建时间戳 |
| Updated Time | 更新时间戳（截断） |

### 2.2 Open For Redemption 流程

进入 Upcoming 状态的 Redemption 详情页后，点击右上角 **"Open For Redemption"** 按钮：

弹出 **"Open For Redemption"** Modal，内含 3 步进度条：

```
① Start  →  ② Sign  →  ③ Open For Redemption
```

**Step ①（Start）：**
- 内容：`"You need to sign transaction for open for redemption via your wallet."`
- 按钮：`Start`（蓝色）

**Step ②（Sign）：**
- 内容：`Personal Sign — Please personal sign to proceed`
- 显示旋转加载动画
- **自托管钱包集成点：** 向钱包发起合约调用
  - `DApp: Tokenization Platform`
  - `Asset: 0xfa6464ba43...f29e75d7109a`
  - `From: 0x9E8d927043...`
- 用户确认后，Step ② 标记为 ✅，进入 Step ③

**Step ③（Open For Redemption 完成）：**
- 蓝色 ℹ️ 图标
- 文字：**"Open for redemption has been executed"**
- 副文字：`"You can goto Inbox page to view your request."`
- 按钮：**"Goto Inbox"**

### 2.3 状态变更

完成后，Redemption 状态变为 `[Open For Redemption]`（绿色 Badge），**"Open For Redemption"** 按钮消失，右上角只剩刷新图标。

---

## 阶段三：Access Redemption（投资者执行赎回）

### 3.1 入口（Investor 视角）

Investor 角色通过以下路径找到开放赎回的 Redemption：

- **路径 A：** `Marketplace → Bond（下拉菜单）`，在 Marketplace 债券详情页下方的 **"Bond Redemption List"** Section 中找到
- **路径 B：** 直接通过 URL `/marketplace/bond/redemption/{id}` 访问

**Bond Redemption List（Marketplace 内）** 的列：

| 列名 | 说明 |
|---|---|
| ID | 可点击链接 |
| Name | Deal 名称 |
| Description | Deal 描述 |
| Asset Type | 例如 `Bond` |
| Status | 例如 `Open For Redemption`（绿色 Badge） |

### 3.2 Redemption 详情页（Investor 视角）

URL：`/marketplace/bond/redemption/{id}`

页面结构与 Issuer 视角基本相同，区别：
- 状态标签：`[Open For Redemption]`（绿色）
- **右上角按钮：** `Redeem`（蓝色主按钮）

### 3.3 执行赎回（Redeem Token 弹窗）

点击 **"Redeem"** 按钮，弹出 **"Redeem Token"** Modal，包含 4 步进度条：

```
① Start  →  ② Sign Approve  →  ③ Sign Redeem  →  ④ Redeem
```

**Step ①（Start）— 填写赎回数量：**

Modal 展示以下只读信息：

| 字段 | 值（示例） |
|---|---|
| Issue Token | DEMO-2024-06 |
| Redemption Price | 100 Bean |
| Redemption maximum quantity | 3（Investor 最多可赎回数量） |

以及可编辑字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| Redemption quantity | Number input（带 + / − 步进按钮） | 默认值 `0`，最大值 = Redemption maximum quantity |
| Redemption amount | 只读，自动计算 | `= Redemption quantity × Redemption Price`，例如输入 1 → `100 Bean`，输入 3 → `300 Bean` |

底部蓝色按钮：**"Redeem"**（点击后进入 Step ②）

**Step ②（Sign Approve）：**
- 内容：`Personal Sign — Please personal sign to proceed`
- 显示旋转加载动画
- **自托管钱包集成点：** 向钱包发起 `approve` 调用（Security Token approve）
  - `DApp: Tokenization Platform`
  - `Asset: 0xaTed246d40...b5983cb120ec`
  - `From: 0x9E79cae0bc6...`
- 用户确认后，Step ② 标记为 ✅

**Step ③（Sign Redeem）：**
- 内容：`Personal Sign — Please personal sign to proceed`
- 再次向钱包发起合约调用（执行实际赎回逻辑）
- 用户确认后，Step ③ 标记为 ✅

**Step ④（Redeem 完成）：**
- 蓝色 ℹ️ 图标
- 文字：**"Redeem token has been executed"**
- 副文字：`"You can goto Inbox page to view your request."`
- 按钮：**"Goto Inbox"**

### 3.4 赎回完成后的状态变化

赎回执行成功后：
- 稳定币（Bean）余额增加（例如 +300 Bean）
- DEMO Security Token 余额减少（代币销毁）
- 可在用户 Profile 页的 **"Redemption Record"** Tab 查看历史记录

**Redemption Record 表格列：**

| 列名 | 说明 |
|---|---|
| ID | 记录 ID（可点击链接） |
| Deal ID | 关联的 Redemption Deal ID（可点击链接） |
| Status | `Done`（绿色 Badge） |
| Redemption Amount | 赎回金额，例如 `300 Bean` |
| Commission Amount | 手续费，例如 `0 Bean` |
| Received Amount | 实际到账，例如 `300 Bean` |
| Redemption Time | 时间戳，例如 `2024-06-19 17:07:27` |

---

## 自托管钱包集成要点

原流程使用内嵌的 Dorayaki 钱包 App（右侧面板），需替换为自托管钱包（如 MetaMask / WalletConnect）。关键集成点汇总：

| 步骤 | 所在流程 | 合约操作 | 说明 |
|---|---|---|---|
| Listing Step ② | Sign Approve | ERC-20 `approve` | 授权平台合约花费 Stablecoin |
| Listing Step ③ | Sign Subscribe | `subscribe` 或等效方法 | 调用平台 Redemption 合约 |
| Open For Redemption Step ② | Sign | 状态切换方法 | 将 Redemption 状态切换为 Open |
| Redeem Step ② | Sign Approve | Security Token `approve` | 授权平台销毁代币 |
| Redeem Step ③ | Sign Redeem | 赎回执行方法 | token burn + stablecoin transfer |

每次钱包弹窗均需展示：
- `DApp`：Tokenization Platform
- `Asset`：合约地址（截断显示，例如 `0x2067bffbd3...e57dc9f91264`）
- `From`：用户地址（截断显示）
