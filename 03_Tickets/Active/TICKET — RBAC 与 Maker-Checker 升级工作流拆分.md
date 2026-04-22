# TICKET：RBAC 与 Maker-Checker 升级 — 工作流拆分（可逐一启动）

**类型：** Program / Multi-Feature
**优先级：** P0
**版本：** v1.0
**适用范围：** `project/src/app/*`
**关联架构文档：** `05_Architecture/ARCH - Multi-tenant RBAC & Maker-Checker Workflow.md`

---

## 0. 目标与启动方式

你希望“按工作流逐一启动”，本单将升级计划拆成 **8 个可独立执行的 Workflow**。

- 每个 Workflow 都有：范围、输入、产出、验收标准（DoD）、依赖关系。
- 执行顺序建议：`WF-01 -> WF-02 -> WF-03 -> WF-04 -> WF-05 -> WF-06 -> WF-07 -> WF-08`
- 若你要逐个启动，可以直接发送：
  - `启动 WF-01`
  - `启动 WF-02`
  - ...

---

## WF-01：身份域与角色体系重构（Platform / Tenant）

### 目标
把当前“单超级管理员”改造成双域权限基础：平台域 + 租户域。

### 范围
- 定义统一 Role 枚举、Scope 枚举、UserIdentity 模型。
- 建立用户上下文：当前用户、当前租户、可切换角色（若多角色）。

### 输入
- 现有登录/角色切换逻辑（如 `RoleSwitcher`、`AppContext`）。

### 输出
- `roles.ts`（角色与域模型）
- `identity.ts`（身份结构与类型）
- 兼容旧角色映射（迁移层）

### DoD
- 可在页面中区分三类用户：`platform_super_admin`、`tenant_maker`、`tenant_checker`。
- 角色切换后页面上下文（租户、菜单）不串角色。

### 依赖
- 无（首个基础流）

---

## WF-02：权限点与访问控制引擎（RBAC Guard）

### 目标
将页面/按钮权限判断从硬编码改为统一 `can()` 判定。

### 范围
- 定义权限点命名规范：`<scope>:<resource>:<action>`。
- 角色 -> 权限集合映射。
- 提供 `can(user, action, resource, context)` API。

### 输入
- WF-01 的身份域与角色模型。

### 输出
- `permissions.ts`（权限点常量）
- `accessControl.ts`（判定函数）
- 路由 Guard 与按钮 Guard 的最小接入

### DoD
- 路由级：平台用户无法执行租户审批动作。
- 按钮级：Maker 看不到审批按钮；Checker 看不到编辑提交按钮（审批态下）。

### 依赖
- WF-01

---

## WF-03：上架 Step1~5 状态机落地（Maker / Checker 分工）

### 目标
把 Step1~5 流程改为状态机驱动，而不是页面分散判断。

### 范围
- 实现 `ListingStatus` 与 `Action`。
- 实现状态跃迁函数 `transition(state, action, actorRole)`。
- 给出非法动作拦截与错误提示。

### 输入
- 已确认的状态集合：`Draft / PendingReview / ChangesRequested / ApprovedInternal / Listed`。

### 输出
- `listingStateMachine.ts`
- `listingPolicy.ts`（各状态可编辑字段策略，可先简版）

### DoD
- Maker 能：保存草稿、提交审核、驳回后重提。
- Checker 能：通过/驳回/最终确认。
- 非法动作会被统一拦截（含 UI 层提示）。

### 依赖
- WF-01、WF-02

---

## WF-04：租户侧审批 UI（待办、审批意见、动作面板）

### 目标
为 Maker 与 Checker 分别提供“我发起 / 待我审批”视图。

### 范围
- Manage 列表页增加“我的待办”过滤。
- 详情页增加审批动作区：通过/驳回、审批意见输入。
- 显示审批轨迹（时间、操作者、动作）。

### 输入
- WF-03 状态机与动作定义。

### 输出
- 列表筛选与 badge 文案更新
- 详情审批组件（可复用）
- 审批轨迹 timeline（先本地数据）

### DoD
- Maker 提交后可在 Checker 视角看到待办。
- Checker 操作后 Maker 视角状态实时更新（可先同页面刷新）。

### 依赖
- WF-03

---

## WF-05：平台端租户管理与穿透只读

### 目标
让 Platform Super Admin 能管理租户并穿透查看其产品。

### 范围
- 平台页面：租户列表、租户状态、租户用户（简版）。
- 穿透视图：选择租户后查看该租户产品列表与状态（只读）。

### 输入
- WF-01/WF-02 的域与权限能力。

### 输出
- `platform/tenants` 页面（简版）
- `platform/tenant/:id/products` 页面（只读）

### DoD
- 平台端可查看所有租户与租户产品。
- 平台端不能对租户审批流执行 approve/reject。

### 依赖
- WF-02、WF-03

---

## WF-06：本地事件存储与三角色数据同步

### 目标
在无后端条件下，确保 Platform / Maker / Checker 视角数据一致。

### 范围
- Append-only event log（IndexedDB 优先）。
- read model 重建（hydrate/rehydrate）。
- BroadcastChannel 同步 + storage 回退。

### 输入
- WF-03 的业务事件（提交/通过/驳回等）。

### 输出
- `eventStore.ts`
- `snapshotStore.ts`
- `syncBus.ts`

### DoD
- A 角色操作后，B 角色页面可自动或低成本刷新获得最新状态。
- 跨 Tab 同步生效。

### 依赖
- WF-03

---

## WF-07：并发控制与冲突处理（Demo 级）

### 目标
避免多角色同时操作导致“后写覆盖前写”无提示。

### 范围
- 在 Listing 实体引入 `version`。
- 事件写入时校验 `expectedVersion`。
- 冲突提示与“重新加载后重试”。

### 输入
- WF-06 事件存储能力。

### 输出
- `conflictError` 处理链路
- 用户可见冲突提示

### DoD
- 可稳定复现并拦截冲突写入。
- 冲突后不出现脏状态（至少可回到最新快照）。

### 依赖
- WF-06

---

## WF-08：验收脚本、演示脚本、迁移后端预留

### 目标
形成“可演示、可验收、可迁移”的闭环。

### 范围
- 编写 E2E 验收清单（手测脚本即可）。
- 形成三角色演示脚本（Platform/Maker/Checker）。
- 输出事件模型到 API 草案映射（后端接入预留）。

### 输入
- WF-01~WF-07 产物。

### 输出
- `UAT_CHECKLIST.md`
- `DEMO_SCRIPT.md`
- `API_MAPPING_DRAFT.md`

### DoD
- 新同事按脚本可完整跑通“创建 -> 提交 -> 审批 -> 上架 -> 穿透查看”。
- 后端团队可根据映射文档快速定义接口。

### 依赖
- WF-01~WF-07

---

## 1. 推荐迭代节奏（两周版）

### Sprint A（先达成可用）
- WF-01 / WF-02 / WF-03 / WF-04

### Sprint B（达成可演示）
- WF-05 / WF-06

### Sprint C（达成可交付）
- WF-07 / WF-08

---

## 2. 风险清单（需提前确认）

1. **角色与租户关系是否一人可多租户**（影响身份模型复杂度）。
2. **Maker 提交后是否允许撤回**（影响状态机规则）。
3. **平台端是否可触发强制冻结**（影响平台权限边界）。
4. **无后端场景下是否需要“伪登录”切换器**（影响演示体验）。

---

## 3. 你可以如何逐一启动

建议从下面命令开始（每次只启动一个）：

1. `启动 WF-01（身份域与角色体系重构）`
2. `启动 WF-02（权限点与访问控制引擎）`
3. `启动 WF-03（Step1~5 状态机）`
4. `启动 WF-04（租户审批 UI）`
5. `启动 WF-05（平台租户管理与穿透）`
6. `启动 WF-06（本地事件存储与同步）`
7. `启动 WF-07（并发冲突处理）`
8. `启动 WF-08（验收与迁移预留）`

