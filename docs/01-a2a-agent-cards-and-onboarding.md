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

---

## Deep Dive: Architecture & Lifecycle

Architecture
- Seller Dashboard → Card Editor (JSONSchema + UI form)
- Validation Service → AJV validation + HTTP capability probes
- Storage → `agent_cards` table (normalized fields + raw JSON)
- Health Monitor → scheduled probes; update `a2a_health`
- Playground → invokes A2A test endpoints using platform JWT

Lifecycle states
- draft → submitted → validated → listed → suspended → retired
- Transitions:
  - submitted → validated (schema+probes pass)
  - validated → listed (admin review or auto if policy allows)
  - listed → suspended (health failing or policy violation)

## SQL DDL (Dev SQLite; Prod Postgres)
```sql
CREATE TABLE agent_cards (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  card_json TEXT NOT NULL,
  a2a_endpoint TEXT NOT NULL,
  supports_streaming BOOLEAN DEFAULT 0,
  supports_webhooks BOOLEAN DEFAULT 0,
  version TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_agent_cards_agent ON agent_cards(agent_id);
ALTER TABLE agents ADD COLUMN a2a_enabled BOOLEAN DEFAULT 0;
ALTER TABLE agents ADD COLUMN a2a_health TEXT;
ALTER TABLE agents ADD COLUMN agent_card_id TEXT REFERENCES agent_cards(id);
```

## API Contracts (detailed)
- POST `/api/a2a/agents/validate-card`
  - Request: `{ agentId, card }`
  - Validations: JSON Schema; endpoint HTTPS; capabilities match probes
  - Response: `{ valid: boolean, errors: [{path,msg}], probes: {health,capabilities} }`
  - Errors: 400 schema_error; 422 probe_failed; 401 unauthorized
- POST `/api/a2a/agents/{agentId}/card`
  - Upsert card; derive flags; set `a2a_enabled`
- GET `/api/a2a/agents/{agentId}/card`
  - Returns: `{ card, endpoint, flags, health }`

## Validation Rules
- endpoint must be https and resolvable (DNS)
- max sizes: card_json <= 128 KB; skills <= 200 entries
- skills input/output schemas must be valid JSON Schema (draft 2020-12)
- capabilities.streaming => endpoint exposes `/stream/{taskId}`
- capabilities.webhooks => endpoint documents webhook receiver

## Examples
Minimal Card
```json
{
  "name": "Doc Summarizer",
  "version": "1.2.3",
  "endpoint": "https://agents.acme.ai/a2a",
  "modalities": ["text"],
  "capabilities": {"streaming": true, "webhooks": false},
  "skills": [
    {"id":"summarize","inputSchema":{"type":"object","properties":{"text":{"type":"string"}},"required":["text"]},
     "outputSchema":{"type":"object","properties":{"summary":{"type":"string"}}}}
  ],
  "auth": {"type":"jwt","audience":"agentverse"}
}
```

## Sequence (Onboarding)
1) Seller drafts card → client-side schema validation
2) Submit → server validates JSON + probes endpoint
3) On success, store card, set `a2a_enabled=true`, health=healthy
4) Publish listing → appears in marketplace search with A2A tag
5) Nightly health monitor updates `a2a_health`

## Security
- Require domain ownership proof (TXT DNS or HTTP file) for `endpoint`
- JWT audience check = `agentverse`; issuer = marketplace; 15 min expiry
- mTLS optional allowlist per seller org

## Observability
- Metrics: card.validate.count, card.validate.fail, probe.latency, health.state
- Logs: validation errors with paths, probe HTTP status and TLS info

## Testing
- Unit: schema validator, probe client
- Integration: mock agent endpoint returns capabilities; simulate TLS failures
- E2E: submit-invalid → errors; submit-valid → listed; health flip → suspended

## Rollout
- Phase 1: Manual admin approval
- Phase 2: Auto-approve for trusted sellers with passing probes