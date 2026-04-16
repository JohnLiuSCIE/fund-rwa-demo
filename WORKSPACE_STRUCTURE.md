# Workspace Structure

本目录将逐步从“单次资料堆放区”演进为“正式 Fund 项目工作区”。

当前策略：
- 不移动你正在使用的核心工作文件，避免打断当前讨论和打开路径。
- 先建立稳定目录骨架与命名规则。
- 后续新资料优先进入新目录。
- 当你确认合适时，再做第二轮迁移，把根目录旧文件归档到对应目录。

## Recommended Layout

```text
.
├── 00_Project_Admin/
├── 01_Source_Materials/
│   ├── 01_PPT_PDF/
│   ├── 02_Demo_Videos/
│   └── 03_Frame_Captures/
├── 02_Meeting_Notes/
│   ├── Inbox/
│   └── Processed/
├── 03_Tickets/
│   ├── Active/
│   └── Archive/
├── 04_User_Flows/
├── 05_Architecture/
│   ├── Diagrams/
│   └── Specs/
├── 06_Product_Decisions/
├── 07_Delivery_Packages/
├── 08_References/
└── 90_Codebase/
```

## What Goes Where

`00_Project_Admin/`
- 项目级说明、里程碑、任务分工、索引文档。

`01_Source_Materials/`
- 原始输入材料。
- 例如 `PPT`、原始 `PDF`、demo 视频、按秒导出的截图。
- 这个目录尽量只存“原材料”，避免混入加工后的需求文档。

`02_Meeting_Notes/`
- 每次会议记录先放 `Inbox/`。
- 会后整理过的纪要、结论版纪要移到 `Processed/`。

`03_Tickets/`
- 所有需求单、开发单、PRD 子单统一放这里。
- `Active/` 放当前有效版本。
- `Archive/` 放废弃版本、历史版本、已替代版本。

`04_User_Flows/`
- 用户流程、页面流、角色流、Mermaid 流程图。

`05_Architecture/`
- `Diagrams/` 放系统图、时序图、状态机图。
- `Specs/` 放接口草案、事件流、领域模型、状态机文字说明。

`06_Product_Decisions/`
- 产品决策记录，类似 ADR / decision log。
- 适合记录“为什么选择这样做”。

`07_Delivery_Packages/`
- 面向汇报、评审、交付的打包材料。
- 比如某次评审用的文档汇总、对外分享版。

`08_References/`
- 法律、监管、竞品、术语表、外部参考文档。

`90_Codebase/`
- 未来代码库放这里。
- 建议代码仓库单独作为一个子目录，不与需求材料混放。

## Naming Conventions

推荐文件命名：

`Meeting note`
- `YYYY-MM-DD Meeting - Topic.md`

`Ticket`
- `TICKET - Feature Name - v1.md`
- `TICKET - Feature Name - v2.md`

`User flow`
- `FLOW - Investor Subscription.md`
- `FLOW - Issuer Distribution Lifecycle.md`

`Architecture`
- `ARCH - Fund Distribution Sequence.md`
- `ARCH - Platform Context Diagram.md`

`Decision`
- `DECISION - 2026-04-16 - Distribution Claim Model.md`

## Current Working Rule

当前根目录还有一些历史文件，暂时保留在原位置：
- 便于你继续从现有路径打开文件
- 便于我持续引用和扩展已有内容

后续建议的第二步迁移：
- 将原始 `PPT/PDF/视频/截图` 迁入 `01_Source_Materials/`
- 将当前 Ticket 迁入 `03_Tickets/Active/`
- 将废弃版本或替代版本迁入 `03_Tickets/Archive/`

## Suggested Next Files

接下来最值得补的文件：
- `02_Meeting_Notes/Processed/2026-04-16 Meeting - Fund Scope Alignment.md`
- `04_User_Flows/FLOW - Fund Full Lifecycle Overview.md`
- `05_Architecture/Diagrams/ARCH - Fund Platform Sequence Diagrams.md`
- `06_Product_Decisions/DECISION - Lifecycle Scope Boundary.md`
