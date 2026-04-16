# DEV TICKET - Fund Demo UI Issues from Review Round 1

## Purpose

本 Ticket 仅记录 **demo review 中识别出的具体可修问题**。  
目标是让设计 / 前端 / 产品能快速逐条修正，不讨论泛泛的生命周期问题。

来源：
- 当前 Fund demo review
- [2026-04-16 | 链上基金发行、赎回与分红流程讨论.md](/Users/xingjianliu/Library/Mobile%20Documents/com~apple~CloudDocs/WeBank/2604%20CCBA/既有Bond%20issue%20procedure/02_Meeting_Notes/Inbox/2026-04-16%20%7C%20链上基金发行、赎回与分红流程讨论.md)

## Scope

本轮仅覆盖：
- Fund Issuance
- Allocation
- Redemption

不覆盖：
- 生命周期策略讨论
- ETF / 开放式基金完整规则设计
- 高层架构讨论

## Issue List

### ISSUE-001 Fund Issuance 第一步缺少明确的 `Draft / Step 0` 概念

**模块：** Fund Issuance  
**位置：** 创建发行流程整体入口  
**优先级：** High  

**问题描述：**
- 当前演示里虽然流程实际从草稿开始，但 UI 上没有把 `Draft` 作为明确状态或步骤表达出来。
- 这会导致用户不清楚“当前是在创建草稿”还是“已经准备提交审核”。

**当前现象：**
- 用户进入创建页面后直接开始填写多步表单。
- 没有单独的 `Draft` 状态提示，也没有明显区分“保存草稿”和“正式进入审核前状态”。

**期望修复：**
- 在发行流程中明确体现 `Step 0: Draft`。
- 至少满足以下其一：
  - 页面或头部状态明确显示 `Draft`
  - 创建成功后先落为 `Draft`
  - 有清晰的 `Save Draft` / `Continue Editing` 语义

**修复建议：**
- 将创建成功后的默认状态统一定义为 `Draft`
- 在 detail 页头部和列表页都展示 `Draft` badge

***

### ISSUE-002 Fund Issuance 的 `About Token` 页面信息量过少，与五步表单结构不平衡

**模块：** Fund Issuance  
**位置：** `About Token`  
**优先级：** High  

**问题描述：**
- 当前 `About Token` 页内容明显过少，只有极少数字段，导致该步骤与其他步骤在信息量和页面占比上严重失衡。
- 在五步结构中，这一步显得“太空”，容易让评审认为漏字段或设计未完成。

**当前现象：**
- `About Deal`、`Subscription & Rules`、`Fund Documents` 都较完整
- `About Token` 只有少量 token 名称 / symbol / tradable 相关字段
- 页面观感上像是缺内容

**需要确认是否漏项：**
- Token total supply / issuance cap 是否应明确放在这里
- Token decimals 是否需要显式配置或显示
- Token standard / chain / contract deployment mode 是否需要表达
- Minting / burn / transfer restriction 是否需要在 token 步骤展示
- 是否需要把部分现在放在 `About Deal` 的 token 相关字段迁移过来

**期望修复：**
- 对 `About Token` 进行结构补强
- 避免出现明显的信息量失衡

**修复建议：**
- 方案 A：补字段，让这一页承担真正的 token 配置职责
- 方案 B：如果 token 字段本来就很少，则考虑把 `About Token` 与 `About Deal` 合并，减少空步骤

***

### ISSUE-003 Fund Issuance 的 `Fee Charge` 页面意义不明确，可考虑删除

**模块：** Fund Issuance  
**位置：** `Fee Charge`  
**优先级：** High  

**问题描述：**
- 当前 `Fee Charge` 页面更像一段说明文案，不像一个独立步骤。
- 从 demo 交互看，这一页对用户动作没有明显价值。
- 单独占一个步骤会稀释流程重点。

**当前现象：**
- 页面没有核心输入动作
- 仅展示说明性质内容
- 用户完成感较弱，评审时容易被问“为什么这要单独占一步”

**期望修复：**
- 如果没有强业务必要，删除整个 `Fee Charge` step
- 或改成：
  - 放到最终提交前的确认区
  - 放到页面底部说明
  - 放到 tooltip / expandable section

**修复建议：**
- 本轮 demo 优先建议直接删除 `Fee Charge` 独立页面

***

### ISSUE-004 Allocation 步骤粒度过粗，缺少对投资人名单的人工筛选能力

**模块：** Fund Issuance / Allocation  
**位置：** `Step 5 Allocation`  
**优先级：** Critical  

**问题描述：**
- 当前 Allocation 逻辑过于粗粒度，缺少一个明确的投资人列表供发行人审查。
- 发行人应当能看到哪些用户提交了 subscription，并决定是否剔除部分用户。

**当前现象：**
- Allocation 更像一个抽象的系统计算步骤
- 没有清晰的“订阅用户列表 -> 人工审查 -> 剔除 -> 再分配”操作感
- 不利于表现基金发行中的合规筛选过程

**期望修复：**
- 在 Allocation 步骤中增加可操作的 subscription list
- 发行人可查看所有申请参与认购的用户
- 发行人可手动取消部分用户资格

**最小可用修复方案：**
- 新增一个 `Allocate Users` 列表
- 字段至少包含：
  - Investor ID / Wallet / Name（若有）
  - Subscription amount / quantity
  - Current status
  - 是否保留参与资格
- 支持操作：
  - `Remove`
  - `Reject`
  - `Exclude from allocation`

**业务价值：**
- 更贴近真实基金发行的审查过程
- 能体现“不是所有 subscribe 的人最终都能参与 allocation”

***

### ISSUE-005 Redemption 缺少 `Draft / Step 0` 语义

**模块：** Redemption  
**位置：** Redemption 创建入口  
**优先级：** Medium  

**问题描述：**
- Redemption 与 Issuance 一样，当前也缺少清晰的草稿语义。
- 用户看不到“先建草稿，再进入审批 / listing”的明确节奏。

**期望修复：**
- Redemption 创建后默认进入 `Draft`
- 在列表页 / detail 页头部显示 `Draft`

***

### ISSUE-006 Redemption 创建时不应要求重新手输完整信息，应支持从现有基金列表直接选择

**模块：** Redemption  
**位置：** `Step 0 Draft` / 创建 Redemption 表单  
**优先级：** Critical  

**问题描述：**
- 当前 Redemption 创建方式仍然要求用户从头输入多项信息，不符合业务直觉。
- 赎回应建立在一个已存在的 Fund / Fund Token 基础上，发行人应直接从已有基金列表中选择。

**当前现象：**
- 创建 Redemption 时，存在大量重复输入
- 用户需要重新填写本应从原基金带出的信息

**期望修复：**
- 创建 Redemption 时支持从已有 Fund 列表中选择
- 选择后自动带出关联信息

**至少应自动带出的信息：**
- Fund name
- Fund token
- Token contract address
- Fund type
- Relevant issue / NAV reference data

**修复建议：**
- 使用 selector / searchable list
- 禁止用户从零重新录入本应继承的数据

***

### ISSUE-007 Redemption 的 `Fee Charge` 页面同样意义不明，应考虑移除

**模块：** Redemption  
**位置：** `Fee Charge`  
**优先级：** High  

**问题描述：**
- Redemption 中的 `Fee Charge` 与 Issuance 一样，独立成一步的价值不明确。
- 作为 demo，会削弱主要流程表达。

**期望修复：**
- 删除独立 step
- 或合并到提交前确认区

***

### ISSUE-008 `Listing Redemption` 中身份确认窗口的 `Sign Transaction` 步骤卡死，流程无法完成

**模块：** Redemption  
**位置：** `Listing Redemption` modal  
**优先级：** Critical  

**问题描述：**
- 在 `Listing Redemption` 的身份确认窗口中，流程会卡死在 `Sign Transaction`。
- 用户无法完成该步骤，导致整个 redemption listing 无法走通。

**当前现象：**
- 进入 `Listing Redemption`
- 完成前置步骤
- 卡在 `Sign Transaction`
- 无法进入完成态

**期望修复：**
- `Sign Transaction` 必须可正常完成
- 成功后进入 completed state
- 若签名失败，应有清晰错误提示，而不是卡死

**需要排查方向：**
- 钱包交互未正确返回
- modal 状态机未推进
- transaction callback 没有写回前端状态
- mock 环节缺失成功返回

***

## Suggested Next Pass

建议下一轮继续从 meeting notes 中补充同类型 issue，重点找：
- 明确指向某个页面 / modal / step 的问题
- 能直接形成前端修复任务的问题
- 能直接形成产品补字段任务的问题

不继续纳入：
- 纯战略讨论
- 生命周期层面的泛泛问题
- 暂时无落地动作的高层研究议题
