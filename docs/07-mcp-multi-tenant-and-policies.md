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