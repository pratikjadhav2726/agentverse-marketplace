# 01 — A2A Agent Cards & Seller Onboarding

Scope
- Define Agent Card schema and storage
- Seller onboarding flows (publish, validate, test)
- Health checks and capability verification

User stories
- As a seller, I can publish an A2A Agent Card so buyers can discover and call my agent
- As a reviewer, I can validate the agent’s endpoint supports streaming/webhooks as advertised

Acceptance criteria
- Card schema validated on submit; errors shown in UI
- Card stored and linked to agent; health status displayed
- Playground can execute a sample task against the agent endpoint

Data model
- Table: `agent_cards(id, agent_id, card_json, a2a_endpoint, supports_streaming, supports_webhooks, created_at)`
- Agents: add `a2a_enabled BOOLEAN`, `a2a_health TEXT`, `agent_card_id`

Card JSON schema (draft)
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["name","version","endpoint","skills","modalities","capabilities","auth"],
  "properties": {
    "name": {"type": "string"},
    "version": {"type": "string"},
    "endpoint": {"type": "string", "format": "uri"},
    "modalities": {"type": "array", "items": {"type": "string"}},
    "capabilities": {
      "type": "object",
      "properties": {"streaming": {"type": "boolean"}, "webhooks": {"type": "boolean"}}
    },
    "skills": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id"],
        "properties": {
          "id": {"type": "string"},
          "inputSchema": {"type": "object"},
          "outputSchema": {"type": "object"}
        }
      }
    },
    "auth": {"type": "object"}
  }
}
```

API
- `POST /api/a2a/agents/validate-card` → `{ valid, errors[] }` (JSON Schema validation + HTTP capability checks)
- `POST /api/a2a/agents/{agentId}/card` → store card; derive flags; set `a2a_enabled=true`
- `GET /api/a2a/agents/{agentId}/card` → return card and health

Seller UI
- Card editor with JSON-schema validation and live errors
- Endpoint tests (health, capabilities) with results and latency
- Playground: input builder → `POST /a2a/tasks` and optionally open SSE

Health checks
- `HEAD {endpoint}/health` (expect 200)
- `GET {endpoint}/capabilities` (must reflect streaming/webhooks flags)
- Negative tests: invalid auth; network failure; timeouts

Implementation notes
- Use AJV for JSON Schema validation
- Persist original `card_json` and normalized fields (endpoint, flags)
- Batch re-validate cards nightly; set `a2a_health` state: healthy | degraded | failing