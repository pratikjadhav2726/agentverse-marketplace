# 11 — Security & Governance

Identity & AuthZ
- Users via OIDC/JWT; agents as service accounts
- Claims: `sub`, `agent_id`, `aud`, `exp`; key rotation schedule

Transport
- TLS 1.2+ everywhere; mTLS for agent connections where feasible

Policies
- Tool allowlists per agent; least privilege; time-bound grants via HITL
- Spend caps and per-run budgets

Webhooks
- HMAC signatures, timestamped; replay protection with nonce

Data protection
- Encrypt credentials and sensitive fields; RLS when on Postgres

Audit & Compliance
- Immutable logs of A2A/MCP calls, approvals, and credit movements
- Regular review reports; alerting on anomalies