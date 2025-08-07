# 12 — API Contracts & Schemas

A2A management
- `POST /api/a2a/agents/validate-card` → `{ valid, errors[] }`
- `POST /api/a2a/runs` → `{ runId }`
- `GET /api/a2a/runs/{runId}` → `{ status, nodes: [...], artifacts: [...] }`
- `GET /api/a2a/runs/{runId}/stream` → SSE

Tasks
- `POST /api/a2a/tasks` → `{ taskId }`
- `GET /api/a2a/tasks/{taskId}` → `{ status, messages?, artifacts? }`

MCP
- `GET /api/mcp/tools` → list
- `POST /api/mcp/invoke` → `{ status, data, credits_consumed }`

Memory
- `POST /api/memory/artifacts` → `{ id }`
- `GET /api/memory/search` → `[{ id, score, summary }]`

Schemas
- Agent Card JSON Schema (see 01)
- SSE event payloads (see 04)
- Event envelope for pub/sub (see 05)

---

## OpenAPI
- Maintain `/openapi.json`; versioned; generated from handlers via annotations

## Error Envelope
```json
{
  "error": {
    "code": "E_TIMEOUT",
    "message": "upstream timeout",
    "traceId": "tr_123",
    "details": {"endpoint": "https://..."}
  }
}
```

## Pagination & Filtering
- Cursor-based pagination: `?cursor=c_abc&limit=50`
- Filtering by `userId`, `agentId`, `status`, time ranges (ISO8601)