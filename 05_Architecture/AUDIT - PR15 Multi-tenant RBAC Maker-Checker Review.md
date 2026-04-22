# Audit Report — PR #15 (Demo): Multi-tenant RBAC, Maker-Checker, Local Event Store, Workbench

## 1) 审计范围与基线
- 代码范围：`project/src/app/context/AppContext.tsx`、`project/src/app/data/fundDemoData.ts`。
- 业务范围：Open-end / Closed-end 基金发行、申赎、分红流程在 demo 中的访问控制与流程控制。
- 审计立场：以港交所场景的“控制点完整性 + 可追溯性 + 职责分离”作为评估优先级。

## 2) 主要发现（修复前）
### F1. 多租户隔离仅停留在概念层
- 原实现无 tenant 作用域约束；读写操作未进行租户边界检查。
- 风险：在真实运营中会触发跨业务实体数据越权风险。

### F2. Maker-Checker 缺少强制“不可自审”
- 存在 submit / approve 动作，但未强制 maker 与 checker 分离。
- 风险：关键审批动作可由同一钱包地址完成，违反四眼原则。

### F3. 本地事件存储缺少统一结构
- 现有状态字段可显示“最后动作”，但缺少统一事件记录结构。
- 风险：无法形成完整审计链路，难以回溯被拒绝动作。

## 3) 本次修复（已落地）
### R1. 租户隔离最小闭环
- 为核心对象补充 `tenantId` 字段（fund / order / redemption / distribution / batch）。
- Auth session 增加 `tenantId`，并在 context 层新增 `ensureTenantScope` 检查。
- 对外暴露数据统一按 `activeTenantId` 过滤，实现 demo 级 tenant scope。

### R2. Maker-Checker 基础约束
- 为核心对象补充 `lastActorWallet`。
- 新增 `ensureMakerChecker`：当 action 为 `approve` 时，拒绝与上次操作钱包一致的审批动作（禁止自审）。

### R3. 本地事件存储
- 新增 `LocalAuditEvent` 与 `localAuditEvents` 状态。
- 在权限拒绝与关键状态变更成功路径写入事件（allowed / denied），并记录 action、resource、target、tenant。

## 4) 对港交所流程适配性的结论
- **结论（demo 级）**：本次修复后，系统在“租户隔离、四眼审批、审计可追溯”三个控制面已形成可演示闭环，明显更贴近港交所场景下的控制要求。
- **仍非生产级**：
  1. 事件未签名、不可抵赖性不足；
  2. 缺少审批矩阵（岗位级/组织级）与 delegated authority；
  3. 缺少不可篡改日志介质（WORM/外部 SIEM）。

## 5) 后续建议（下一阶段）
1. 引入审批策略对象：按流程节点配置 checker 群组与最小签核人数。
2. 事件存储外置：本地事件流 -> append-only 后端日志。
3. 增加工作台审计视图：按 tenant / resource / outcome 过滤。
