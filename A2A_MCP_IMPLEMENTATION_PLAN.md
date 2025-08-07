# AgentVerse A2A + MCP Implementation Plan

This document provides a detailed, execution-ready plan to evolve AgentVerse into an enterprise-grade AI agent marketplace powered by the Agent2Agent (A2A) protocol for agent collaboration and the Model Context Protocol (MCP) for secure tool/data access.

Contents
- 1. Assumptions and Current State
- 2. Architecture Overview
- 3. A2A Core (Agent-to-Agent)
- 4. Seller Onboarding (A2A Compliance)
- 5. Buyer Experience & Orchestrator
- 6. Streaming, Webhooks, Long-running Tasks
- 7. Pub/Sub Collaboration Backbone
- 8. Task Queue and Reliability
- 9. MCP Multi-Tenant Service (Agent-to-Tool)
- 10. AI Gateway (Metering, Guardrails, Observability)
- 11. Shared Memory (Knowledge Graph / Vector Store)
- 12. Billing & Credits Mapping
- 13. Security & Governance
- 14. Data Model Changes
- 15. API Contracts
- 16. Testing Strategy
- 17. Deployment & Environments
- 18. Rollout Milestones

---

## 1. Assumptions and Current State

- Implemented: Marketplace UI, seller dashboards, workflows skeleton (`lib/workflow-engine.ts`), credit system, Stripe integration, JWT cookie auth, MCP tools and secure credential storage (AES-256-CBC), tool gateway.
- Database: SQLite (dev) with Drizzle; Supabase schema guide available for Postgres migration.
- Goal: Add A2A interoperability, orchestration, streaming, pub/sub, queues, multi-tenant MCP, shared memory, AI gateway, and enterprise-grade governance.

---

## 2. Architecture Overview

- A2A Client/Gateway: Marketplace-side library/service to communicate with remote A2A-compliant agents (servers).
- Agent Registry: Marketplace DB stores Agent Cards (capabilities, endpoints) for discovery and selection.
- Orchestrator: Breaks high-level goals into sub-tasks and delegates to agents via A2A; aggregates artifacts.
- Pub/Sub: Event backbone for decoupled collaboration and progress propagation.
- Task Queue: Durable job execution, retries, rate control.
- MCP Service: Multi-tenant tool layer that enforces per-user policies, credentials, HITL.
- Shared Memory: Knowledge graph/vector memory to persist artifacts and relationships across tasks.
- AI Gateway: Token metering, rate limits, content guardrails, audit and traces.

---

## 3. A2A Core (Agent-to-Agent)

### 3.1 Agent Card (stored per agent)
Add an Agent Card JSON blob to each agent. Fields:
```json
{
  "name": "Report Generator",
  "version": "1.0.0",
  "endpoint": "https://seller-agent.example.com/a2a",
  "modalities": ["text"],
  "capabilities": { "streaming": true, "webhooks": true },
  "skills": [
    { "id": "report.generate", "inputSchema": {"type":"object"}, "outputSchema": {"type":"object"} }
  ],
  "auth": { "type": "jwt", "audience": "agentverse" },
  "vendor": { "org": "Acme AI", "contact": "ops@acme.ai" }
}
```

### 3.2 Message/Task/Artifact model (client-side expectations)
- Message: `{ role: "user"|"agent", parts: Part[], messageId }`
- Part types: `TextPart`, `FilePart{ uri|base64, mime }`, `DataPart{ json }`
- Task lifecycle: `submitted → working → input_required? → completed|failed`
- Artifact: `{ parts: Part[] }`, can be streamed incrementally (parts appended)

### 3.3 A2A Client library (internal)
- `createTask(agentCard, message, options)`: POST to remote A2A endpoint
- `getTask(agentCard, taskId)`: Polling endpoint for status
- `openStream(agentCard, taskId)`: SSE for events: `TaskStatusUpdateEvent`, `TaskArtifactUpdateEvent`, `Message`
- `registerWebhook(agentCard, taskId, url, secret)`: For push notifications
- Auth: Sign JWT with marketplace/private key; include `sub=userId`, `azp=agentverse`, `agent_id` when delegating on behalf of a purchased agent.
- Telemetry: Wrap calls with OpenTelemetry spans.

---

## 4. Seller Onboarding (A2A Compliance)

### 4.1 Card publication and validation
- UI: Seller fills form or uploads JSON; we validate schema and required capabilities.
- Store: Save in `agent_cards` table linked to `agents`.
- Health checks:
  - `HEAD {endpoint}/health` → 200 OK
  - `GET {endpoint}/capabilities` → returns supported capabilities (streaming/webhooks)
- Playground: Test call using sample `Message` → display response, logs, latency.

### 4.2 Required Seller endpoints (guidance)
- `POST /a2a/tasks` → create task; returns `{ taskId, status }`
- `GET /a2a/tasks/{taskId}` → returns `{ status, messages?, artifacts? }`
- `GET /a2a/stream/{taskId}` → SSE stream of events
- `POST /a2a/webhooks/{taskId}` → optional webhook registration
- Auth support: JWT/OIDC (document claims); TLS required.

---

## 5. Buyer Experience & Orchestrator

### 5.1 Buyer run flow
1) Buyer selects agent (orchestrated multi-agent workflow optional).
2) Orchestrator resolves Agent Card, constructs `Message` or `Task` input.
3) Credits reserved; A2A task created; stream updates to UI.
4) On completion/failure, finalize credits and record artifacts.

### 5.2 Orchestrator design
- Extend `lib/workflow-engine.ts` to support an `agent` node that:
  - Calls A2A client to create task
  - Subscribes to SSE; writes progress logs and partial artifacts
  - Emits node outputs when task completes
- Add an `orchestrator` node that decomposes tasks and emits sub-tasks into the graph (fan-out to parallel agents; aggregate results).
- Support conditional nodes and joins already scaffolded.

---

## 6. Streaming, Webhooks, Long-running Tasks

### 6.1 SSE events (expected payloads)
```json
{ "type": "task.status", "taskId": "t_123", "status": "working", "ts": 1736293200 }
{ "type": "artifact.append", "taskId": "t_123", "part": { "kind": "text", "text": "partial..." } }
{ "type": "message", "role": "agent", "parts": [{"kind":"text","text":"Need clarification"}] }
{ "type": "task.completed", "taskId": "t_123", "artifact": {"parts": [...] } }
{ "type": "task.failed", "taskId": "t_123", "error": {"code":"E_TOOL","message":"..."} }
```

### 6.2 Webhooks
- Register per task: `{ url, secret, events: ["task.completed","task.failed"] }`
- Delivery: `POST` with `X-AgentVerse-Signature: sha256=...` (HMAC of body with secret)
- Retries: exponential backoff; dead-letter queue on repeated failure.

---

## 7. Pub/Sub Collaboration Backbone

### 7.1 Topics (namespaces)
- `agentverse.task.created`
- `agentverse.task.updated`
- `agentverse.artifact.created`
- `agentverse.alert`
- `agentverse.billing.usage`

### 7.2 Event envelope
```json
{
  "eventId": "evt_...",
  "type": "agentverse.task.updated",
  "ts": 1736293200,
  "correlationId": "run_abc",
  "taskId": "t_123",
  "agentId": "agent_456",
  "userId": "user_789",
  "payload": { "status": "working", "progress": 42 }
}
```

### 7.3 Technology
- Dev: Redis Streams or Dapr pub/sub for portability
- Prod: Kafka or EventBridge; keep a minimal event schema and a broker-agnostic wrapper.

---

## 8. Task Queue and Reliability

### 8.1 Queues
- `a2a-exec`: Creating tasks, polling fallbacks, SSE supervisors
- `webhook-delivery`: Signed delivery with retries
- `billing-meter`: Usage to credit transactions

### 8.2 Dev: BullMQ + Redis
- Workers per queue; backoff, max retries, idempotency keys `{runId}:{nodeId}`
- Checkpoint artifacts to DB to resume after restarts

### 8.3 Migration path: Temporal
- Model long-running orchestrations as workflows; activities wrap A2A calls and webhooks
- Gains: exactly-once semantics, durable timers, resumability

---

## 9. MCP Multi-Tenant Service (Agent-to-Tool)

### 9.1 Concepts
- Workspace per user: isolated namespace for tools and credentials
- Agent identity inside user context: policies decide which tools an agent may invoke

### 9.2 Policy model
- Allowlist per agent: `{ tools: ["sheets.read", "crm.query"], scopes: [...] }`
- Least privilege by default; HITL for sensitive scopes

### 9.3 Endpoints
- `GET /api/mcp/tools` (list public + user tools)
- `POST /api/mcp/tools` (register tool) [admin]
- `GET /api/mcp/credentials` (list user’s credentials; masked)
- `POST /api/mcp/credentials` (store encrypted credentials)
- `DELETE /api/mcp/credentials/{id}`
- `POST /api/mcp/invoke` (proxy tool calls; enforces policy, decrypts creds, logs usage)

### 9.4 HITL
- Queue approval items (`mcp_approvals` table): show in UI; approval creates short-lived grant tokens

---

## 10. AI Gateway (Metering, Guardrails, Observability)

- Meter tokens and calls: capture size estimates or model-reported usage; map to credits
- Rate limits: per-user, per-agent, burst + sustained
- Content filters: PII detection, prompt-injection heuristics, allow/deny lists
- Tracing: OpenTelemetry for A2A/MCP spans; log correlation IDs across services

---

## 11. Shared Memory (Knowledge Graph / Vector Store)

### 11.1 Storage
- Phase 1: Postgres with `pgvector` for embeddings; tables for artifacts and relationships
- Phase 2: Optional Neo4j for richer graph queries

### 11.2 Data model (high-level)
- `artifacts(id, task_id, agent_id, user_id, content_json, embedding, created_at)`
- `artifact_links(id, from_artifact_id, to_artifact_id, relation, created_at)`
- Queries: kNN over embeddings; relational joins by run/task/agent/topic

### 11.3 APIs
- `POST /api/memory/artifacts` (persist)
- `GET /api/memory/search?k=...&q=...` (vector + keyword)

---

## 12. Billing & Credits Mapping

- A2A usage: debit `use` transactions when task starts; adjust at completion if overage/underrun
- MCP tool invocations: add `tool_usage` transactions per call
- Payouts: Aggregate seller earnings from usage; subtract commission; expose in seller dashboard

---

## 13. Security & Governance

- Identity: OIDC for users; service accounts for agents; JWT audience checks; rotate keys
- Transport: TLS everywhere; mTLS between marketplace and hosted agents where feasible
- Webhooks: HMAC signatures, IP allowlists, replay protection (nonce + expiry)
- Data: Encrypt credentials at rest (already implemented), encrypt sensitive fields; per-user isolation
- Guardrails: HITL approvals, tool allowlists, output filtering, timeouts and budget caps
- Audit: Immutable logs for A2A/MCP calls, approvals, credit movements

---

## 14. Data Model Changes

Add/extend tables (SQLite dev; Postgres in prod):
- `agent_cards(id, agent_id, card_json, supports_streaming, supports_webhooks, a2a_endpoint, created_at)`
- `runs(id, user_id, orchestrator_id, status, created_at, updated_at)`
- `run_nodes(id, run_id, node_id, agent_id, status, started_at, ended_at, metadata_json)`
- `artifacts(id, run_id, task_id, agent_id, user_id, content_json, created_at)`
- `webhook_subscriptions(id, task_id, url, secret, events_json, created_at)`
- `events(id, type, correlation_id, payload_json, created_at)`

Add columns to `agents`:
- `a2a_enabled BOOLEAN`, `a2a_health TEXT`, `agent_card_id TEXT`

---

## 15. API Contracts

### 15.1 A2A management
- `POST /api/a2a/agents/validate-card` → { valid, errors[] }
- `POST /api/a2a/runs` → start orchestrated or single-agent run; returns `{ runId }`
- `GET /api/a2a/runs/{runId}` → status, logs, artifacts
- `GET /api/a2a/runs/{runId}/stream` → SSE for run-level events

### 15.2 Tasks
- `POST /api/a2a/tasks` → proxy to selected agent; returns `{ taskId }`
- `GET /api/a2a/tasks/{taskId}` → proxy polling

### 15.3 Webhooks (receiver)
- `POST /api/a2a/webhooks/{taskId}` → verify signature; enqueue event; update run state

### 15.4 MCP
- `GET /api/mcp/tools`
- `POST /api/mcp/tools`
- `GET /api/mcp/credentials`
- `POST /api/mcp/credentials`
- `DELETE /api/mcp/credentials/{id}`
- `POST /api/mcp/invoke`

### 15.5 Memory
- `POST /api/memory/artifacts`
- `GET /api/memory/search`

---

## 16. Testing Strategy

- Unit: Agent Card schema validation, A2A client (mock server), webhook signature verification, policy checks
- Integration: Orchestrator runs with simulated agents (Dockerized test agents), SSE streaming, queue workers
- E2E: Purchase → run agent → stream progress → complete → debit credits → payout updates
- Chaos/resilience: Kill workers mid-run; verify resumption; webhook retry behavior

---

## 17. Deployment & Environments

- Envs: dev (SQLite+Redis), stage (Postgres+Redis), prod (Postgres+Kafka/Redis)
- Secrets: JWT signing keys, webhook secrets, encryption keys (KMS managed)
- Scaling: Horizontally scale API, queue workers; partition Kafka topics by tenant or run
- Observability: Centralized logs, traces, metrics; SLOs for run latency and webhook delivery

---

## 18. Rollout Milestones

- M1 (Weeks 1–2): A2A MVP (Card schema, client, seller onboarding, single-agent runs, SSE)
- M2 (Weeks 3–4): Orchestrator in workflows, run tracking, UI live streaming, credit debits
- M3 (Weeks 5–6): Pub/Sub events + BullMQ queues; webhook delivery with retries; artifact persistence
- M4 (Weeks 7–8): MCP multi-tenant policies + HITL; `mcp/invoke` proxy; billing for tool usage
- M5 (Week 9+): AI Gateway (metering/guardrails), shared memory search, enterprise hardening and SLOs

---

## Cross-reference to deep docs
See `docs/` for per-feature deep dives. Recommended build order: 01 → 02+04 → 03 → 06 → 05 → 07 → 08 → 10 → 09 → 11 → 12 → 13 → 14.

## MVP Checklist
- [ ] Agent Card schema + validation + probes
- [ ] A2A client with JWT auth, SSE, webhooks
- [ ] Orchestrator `agent` node invoking A2A
- [ ] Streaming UI for run progress
- [ ] Credit debits for runs; basic payouts update
- [ ] Logging/metrics for A2A calls