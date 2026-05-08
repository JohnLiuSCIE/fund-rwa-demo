# Scope of Work - Fund RWA Tokenization Platform

> Draft for discussion. This scope is based on the current demo materials, meeting notes, and revised architecture notes as of 2026-04-27.

## 1. Scope Positioning

This project extends the existing Bond RWA issuance platform into a Fund RWA Tokenization Platform. The platform will support fund product management, issuance and subscription, redemption, dividend / distribution events, holder register operations, on-chain interaction, operational monitoring, audit, and reconciliation.

This phase is positioned as a demo-ready and extensible fund lifecycle MVP. The product is divided into three portals:

- Platform Portal: used by the platform operator to manage tenants, permissions, approvals, compliance configuration, on-chain integration, monitoring, audit, and reconciliation.
- Tenant Portal: used by fund issuers, fund managers, and Transfer Agents to manage fund setup, issuance, subscription, redemption, dividend / distribution, NAV, holder register, and operational processing.
- User Portal: used by investors. The User Portal is out of scope for the current phase, with only the necessary data structures and integration interfaces reserved.

ETF-style real-time trading, full secondary market trading, full regulatory reporting, production-grade banking settlement, and production-grade KYC / KYB are not included in the current phase and may be considered as future extensions.

## 2. Scope of Work Table

| System | Module | Function |
| --- | --- | --- |
| Platform Portal | Tenant and Institution Management | Manage tenants, issuers, fund managers, Transfer Agents, and platform operators; configure roles, permissions, wallet addresses, KYB / KYC status, and basic eligibility labels. |
| Platform Portal | Platform Approval and Publishing | Review fund products, issuance listing, redemption events, dividend / distribution events, document updates, and on-chain publishing; support rejection, supplementary material requests, approval, publishing, and status transition. |
| Platform Portal | Compliance Access and Whitelist Governance | Configure investor eligibility rules, qualified investor requirements, whitelist policies, jurisdiction / risk restrictions, and import placeholders; provide eligibility checking capabilities to the Tenant Portal. |
| Platform Portal | Blockchain and External System Integration | Integrate with fund unit token contracts, mint / burn / allocation, payout / claim, and transaction status monitoring; reserve interfaces for payment, NAV oracle, KYC / KYB, document storage, and other external systems. |
| Platform Portal | Monitoring, Audit, and Reconciliation | Provide platform-level dashboards, operation logs, signature logs, on-chain transaction records, cash and unit reconciliation, exception tracking, and report export. |
| Tenant Portal | Fund Product Setup and Issuance Management | Support open-end and closed-end fund creation; configure fund terms, token parameters, fees, offering documents, subscription rules, issuance workflow, and listing status. |
| Tenant Portal | Subscription, Allocation, and Confirmation | Manage subscription orders, cash confirmation, subscription close, automatic allocation or offline allocation result upload, and execute unit mint / allocation and final confirmation. |
| Tenant Portal | Open-end Fund Operation and NAV Management | Support daily subscription and redemption for open-end funds, cut-off processing, NAV confirmation, T+1 settlement, valuation history, trading pause / resume, and operating status management. |
| Tenant Portal | Redemption / Repurchase / Payout Management | Support redemption or issuer-led cash-out event setup, announcement period, redemption window, limit controls, request review, holder snapshot, and Redemption Payment List generation. |
| Tenant Portal | Dividend / Distribution Management | Support dividend / distribution event setup, record date, payment date, payout token / account, recipient list generation, payout or claim status tracking. |
| Tenant Portal | Transfer Agent Operations and Register Management | Support holder register maintenance, snapshot freeze, eligible holder validation, recipient / payment list generation, funding check, payment marking, and reconciliation close-out. |
| Tenant Portal | Tenant Operations Dashboard and Reporting | Display fund issuance, subscription, redemption, dividend / distribution, NAV, cash confirmation, Transfer Agent operations, and exception status; support tenant-level list and audit report export. |

## 3. Out of Scope for Current Phase

| Out-of-Scope Item | Description |
| --- | --- |
| User Portal / Investor Portal | The current phase does not deliver investor-facing pages or interactions, including marketplace browsing, wallet connection, investor subscription, redemption request, dividend claim, holding center, and user preference settings; only the necessary data structures and integration interfaces will be reserved. |
| ETF Real-time Trading | The current phase does not cover secondary-market-style real-time matching, market making, intraday execution, or real-time confirmation. |
| Full Secondary Market DVP / FOP | Secondary transfer fields and transfer restrictions may be reserved, but a full secondary trading marketplace will not be implemented. |
| Production-grade KYC / KYB | The current phase may include status display, whitelist control, and interface placeholders, but will not build a full identity verification system. |
| Production-grade Banking Settlement | The current phase focuses on simulated payment status, payment proof, and payment reference; real banking integration should be scoped separately. |
| Full Regulatory Reporting | Regulatory forms, automated reporting, and jurisdiction-specific legal document rule engines are not included. |
| Complex Tax and Withholding Calculation | Fee / withholding fields may be reserved in payment lists, while complex tax rules will be handled in a later phase. |
| Full Multilingual Localization | Internationalization structure may be reserved, while full Chinese / English copy review and localization are out of scope. |

## 4. Key Open Questions

| No. | Open Question | Impact Area |
| --- | --- | --- |
| Q1 | Which fund type is the primary target for CCB in this phase: closed-end fund, open-end fund, money market fund, or multiple types? | Demo storyline, fields, state machine |
| Q2 | Is on-chain subscription intended to represent a formal subscription, an expression of interest, or an on-chain registration after offline confirmation? | Subscription copy, order status, compliance flow |
| Q3 | Who maintains the whitelist, and does Excel import need to be fully implemented in this phase? | Admin, KYC, permission control |
| Q4 | Does allocation need to support both system-based automatic allocation and offline allocation result upload? | Issuance, allocation, Transfer Agent |
| Q5 | Should dividend / distribution use Direct Transfer, Claim, or both modes? | Distribution, smart contract, user experience |
| Q6 | For closed-end funds, should the cash-out event be named Redemption, Repurchase Offer, Tender Offer, Maturity Redemption, or Liquidation Payout? | UI naming, business explanation |
| Q7 | Should NAV be entered manually, provided by an oracle feed, or support both modes? | Open-end dealing, settlement, audit |

