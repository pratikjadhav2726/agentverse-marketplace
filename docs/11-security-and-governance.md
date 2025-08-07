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

---

## Threat Model (STRIDE)
- Spoofing: JWT forgery → mitigated by strong keys, kid rotation, short TTL
- Tampering: Webhook body → HMAC signatures and replay protection
- Repudiation: Immutable audit logs with hash chaining
- Information disclosure: TLS, scoped tool access, output redaction
- DoS: rate limits, circuit breakers, worker autoscaling
- Elevation of privilege: HITL gate, ABAC policies

## Controls Mapping
- SOC2 CC6/CC7, ISO 27001 A.9/A.12 coverage documented; evidence via CI logs and audit exports

## Incident Response
- Severity matrix; on-call rotation
- 30m triage, 4h mitigation, 72h RCA with action items
- Webhook compromise playbook; key revoke steps

## Key Rotation
- JWT `kid` monthly; webhook secrets quarterly; MCP creds per-tool policy