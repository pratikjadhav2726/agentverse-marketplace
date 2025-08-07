# 07 — MCP Multi-Tenant & Policies

Concepts
- Workspace per user (logical isolation)
- Agent identity inside user context (policy evaluated per call)

Policy model
- Allowlist tools per agent: `{ tools: ["sheets.read"], scopes: ["read"] }`
- Default deny; elevate via HITL review

Endpoints
- `GET /api/mcp/tools` (list tools)
- `POST /api/mcp/tools` (admin)
- `GET /api/mcp/credentials` (masked)
- `POST /api/mcp/credentials` (store encrypted)
- `DELETE /api/mcp/credentials/{id}`
- `POST /api/mcp/invoke` (proxy; policy + decrypt + call + log)

HITL approvals
- Table: `mcp_approvals(id, user_id, agent_id, tool_id, scope, status, created_at, decided_at)`
- UI queue for user/admin; approval creates short-lived grant token

Security
- Encrypt credentials at rest (AES-256-CBC already)
- Do not expose secrets to agents; proxy-only access
- Full audit logs for each invoke

---

## Policy Language (ABAC)
- Subject: `agent_id`, `user_id`
- Resource: `tool_id`, `scope`
- Context: `time`, `budget_remaining`, `run_id`
- Example rule:
```json
{
  "effect": "allow",
  "subject": {"agent_id": "agent_123"},
  "resource": {"tool_id": "sheets", "scope": "read"},
  "condition": {"time": {"before": "18:00"}}
}
```

## HITL Flow
1) Agent requests elevated scope (e.g., `write`)
2) MCP creates `mcp_approvals` item
3) User/Admin approves in UI → grant token (15m)
4) Invoke proceeds with grant; audit recorded

## Audit Format
```json
{
  "ts": 1736293200,
  "user_id": "u_1",
  "agent_id": "a_2",
  "tool_id": "sheets",
  "action": "invoke",
  "scopes": ["read"],
  "result": "success",
  "credits": 2,
  "run_id": "run_9"
}
```