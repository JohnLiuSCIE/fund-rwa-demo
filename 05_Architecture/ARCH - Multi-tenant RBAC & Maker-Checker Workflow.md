# ARCH - Multi-tenant RBAC & Maker-Checker Workflow

## 1. 背景与目标

当前 Demo 将“超级管理员”视为单一角色，导致以下问题：

1. **平台管理职责与业务审批职责耦合**：平台侧需要管理租户与用户，但不应承担所有租户内部审批动作。
2. **租户侧缺少 Maker/Checker 分离**：项目上架流程（Step 1~5）无法体现“录入/提交”和“复核/批准”的职责隔离。
3. **无后端情况下，多角色数据难以同步**：平台管理员、租户 Maker、租户 Checker 切换登录后数据可能不一致。

本方案目标：

- 将权限体系拆分为 **Platform（平台端）** 与 **Tenant（租户端）** 两级。
- 在租户上架流程中引入 **Maker / Checker** 的审批分工。
- 在“纯前端 Demo、无后端 API”条件下，提供可落地的数据同步架构。
- 为后续接后端保留可迁移接口与事件模型。

---

## 2. 角色与权限模型（RBAC + Scope）

> 建议采用“角色（Role）+ 资源范围（Scope）+ 动作（Action）”模型，而不是仅用 `isAdmin` 布尔值。

### 2.1 平台端角色（Platform Scope）

- **Platform Super Admin**
  - 管理租户（创建/禁用/查看）
  - 管理租户用户（开通 Maker/Checker）
  - 穿透查看各租户产品与流程状态（只读）
  - 可执行平台级审计动作（导出日志、查看审批轨迹）

> 备注：平台端默认不参与租户内部 Maker/Checker 审批链，避免职责冲突。

### 2.2 租户端角色（Tenant Scope）

- **Tenant Admin**（可选，但推荐）
  - 管理本租户用户与角色分配（Maker/Checker）
  - 配置租户业务参数
- **Tenant Maker**
  - 创建产品/草稿
  - 编辑允许阶段的数据
  - 提交审核、撤回审核
- **Tenant Checker**
  - 对 Maker 提交内容进行审批（通过/驳回）
  - 可要求补充材料
  - 审批通过后推进到下一关键节点
- **Tenant Viewer**（可选）
  - 查看但不可编辑/审批

### 2.3 权限粒度建议

权限命名建议：`<scope>:<resource>:<action>`

示例：

- `platform:tenant:create`
- `platform:tenant_user:assign_role`
- `tenant:product:create`
- `tenant:listing_step:submit`
- `tenant:listing_step:approve`
- `tenant:listing_step:reject`
- `tenant:product:view_all`

通过“角色 -> 权限集合”的映射，前端可在路由守卫、按钮显隐、操作校验处统一调用。

---

## 3. 流程拆分：上架 Step 1~5 的 Maker / Checker 分工

> 你提到“第一步到第五步之间应该有分工”，下面先给一个可执行的简化版。

### 3.1 建议分工（简版）

- **Step 1（产品基础信息）**：Maker 编辑并提交
- **Step 2（发行参数）**：Maker 编辑并提交
- **Step 3（合规/材料上传）**：Maker 编辑并提交
- **Step 4（租户内部复核）**：Checker 审批（通过/驳回）
- **Step 5（上架确认）**：Checker 最终确认，状态变为 `Listed`

### 3.2 状态机（核心）

推荐将每个产品实例抽象为状态机，避免页面逻辑分散：

- `Draft`（草稿）
- `PendingReview`（待复核）
- `ChangesRequested`（已驳回待修改）
- `ApprovedInternal`（租户内部已通过）
- `Listed`（已上架）

状态迁移动作：

- Maker: `save_draft`, `submit_for_review`, `resubmit`
- Checker: `approve`, `reject`, `final_confirm`

限制规则示例：

- 仅 Maker 可在 `Draft` / `ChangesRequested` 编辑。
- 进入 `PendingReview` 后 Maker 只读（可撤回则由策略控制）。
- 仅 Checker 可执行 `approve/reject`。

---

## 4. 无后端情况下的数据同步架构（重点）

因为当前没有后端接口，建议采用 **本地事件溯源 + 存储快照 + 多标签同步** 的轻量架构。

### 4.1 数据分层

1. **Event Log（事实层）**
   - 记录不可变事件：谁在何时对哪个实体做了什么
   - 示例事件：`PRODUCT_CREATED`, `STEP_SUBMITTED`, `REVIEW_APPROVED`
2. **Read Model（查询层）**
   - 由 Event Log 聚合得到当前状态
   - 用于页面渲染（列表、详情、统计）
3. **UI View State（视图层）**
   - 临时筛选、分页、弹窗状态，不入业务事件

### 4.2 本地持久化方案

- **IndexedDB**：主存储（容量更大、结构化更好）
- **localStorage**：少量配置（当前用户、租户上下文、feature flag）

建议 key 设计：

- `fund_demo.events.v1`
- `fund_demo.snapshot.v1`
- `fund_demo.session.currentUser`
- `fund_demo.session.currentTenant`

### 4.3 三角色数据同步机制

在同浏览器多 Tab、多用户切换场景下：

- 使用 **BroadcastChannel**（优先）广播事件变更
- 兼容回退：监听 `window.storage` 事件
- 每次写入事件后触发 `rehydrateReadModel()`，各端重建查询态

同步流程：

1. Maker 提交 Step -> 写入事件 log
2. 触发 BroadcastChannel 通知
3. Checker 页面收到通知 -> 重建 read model
4. 列表即时出现“待复核”
5. Checker 审批后同理回推给 Maker 与 Platform 视图

### 4.4 冲突与一致性（Demo 级别）

- 采用 **乐观并发版本号**：实体带 `version` 字段
- 写入事件时校验 `expectedVersion`
- 冲突则提示“数据已更新，请刷新后重试”

这能在无后端情况下，模拟真实系统里最关键的一致性问题。

---

## 5. 前端实现结构建议（可直接落地）

### 5.1 目录建议

```text
project/src/app/
  auth/
    roles.ts
    permissions.ts
    accessControl.ts
  workflow/
    listingStateMachine.ts
    listingPolicy.ts
  store/
    eventStore.ts
    snapshotStore.ts
    syncBus.ts
  modules/
    platform/
      pages/
    tenant/
      pages/
```

### 5.2 核心模块职责

- `accessControl.ts`
  - 输入：`user`, `tenantId`, `action`, `resource`
  - 输出：`boolean`（是否允许）
- `listingStateMachine.ts`
  - 统一管理状态跃迁与可执行动作
- `eventStore.ts`
  - append-only 事件写入
  - 版本校验
- `syncBus.ts`
  - 封装 BroadcastChannel / storage 监听

### 5.3 路由隔离建议

- `/platform/*`：平台管理页面
- `/tenant/:tenantId/*`：租户业务页面

并在路由层做 Scope Guard，避免“平台角色访问租户审批动作”或反向越权。

---

## 6. 最小可用版本（MVP）分期

### Phase 1（先做）

- 角色拆分：Platform Super Admin / Tenant Maker / Tenant Checker
- Step 1~5 的简化 Maker-Checker 流程
- 本地事件存储 + BroadcastChannel 同步
- 平台穿透只读查看租户产品列表

### Phase 2（增强）

- Tenant Admin 与用户管理页面
- 审批意见、驳回原因、审计日志
- 更细粒度权限点与按钮级校验

### Phase 3（为后端准备）

- 事件模型映射 API contract
- 将 event store 从本地替换为服务端
- 引入服务端并发控制与审批流引擎

---

## 7. 示例数据模型（前端可先 Mock）

```ts
type Scope = 'platform' | 'tenant'

type Role =
  | 'platform_super_admin'
  | 'tenant_admin'
  | 'tenant_maker'
  | 'tenant_checker'
  | 'tenant_viewer'

interface UserIdentity {
  userId: string
  tenantId?: string
  roles: Role[]
}

interface ListingEntity {
  listingId: string
  tenantId: string
  step: 1 | 2 | 3 | 4 | 5
  status: 'Draft' | 'PendingReview' | 'ChangesRequested' | 'ApprovedInternal' | 'Listed'
  version: number
  updatedAt: string
  updatedBy: string
}

interface DomainEvent {
  eventId: string
  aggregateId: string // listingId
  aggregateType: 'Listing'
  eventType: string
  payload: Record<string, unknown>
  actor: { userId: string; role: Role; tenantId?: string }
  ts: string
  expectedVersion: number
}
```

---

## 8. 你这个场景下的关键收益

- **职责边界清晰**：平台治理与租户审批解耦。
- **满足 Maker/Checker 内控要求**：降低单人全流程风险。
- **即使无后端也可演示“多角色联动”**：便于对外演示和需求澄清。
- **未来可平滑迁移**：事件与状态机模型可直接映射后端实现。

---

## 9. 下一步建议（可立即执行）

1. 先在现有 Demo 中落地 `Role + Permission` 基础设施。
2. 将“上架 Step 1~5”收敛到一个显式状态机文件。
3. 引入本地 `eventStore + syncBus`，打通 Maker/Checker/Platform 三视角。
4. 以 2~3 个典型审批场景做端到端演示脚本。

