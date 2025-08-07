# 13 — Testing & Quality

Unit
- Card schema validation; signer; webhook verifier; policy evaluator; metering calc

Integration
- Orchestrator with mock agents (Docker): success, partial, failure, timeouts
- SSE end-to-end: stream continuity, reconnection
- Queue workers: retries, checkpoints, DLQ flows

E2E
- Purchase → run → stream → complete → debit credits → payout eligible
- HITL approval flows for MCP; denied/approved paths

Chaos & reliability
- Kill workers mid-run → verify resume
- Drop webhook deliveries → verify retries and DLQ

Tooling
- Vitest/Jest for unit; Playwright for E2E; Testcontainers for Dockerized agents

---

## Test Matrix
- Browsers: Chrome/Firefox/Safari (latest-1)
- Mobile viewports for run UI streaming
- DBs: SQLite (dev), Postgres (stage/prod)

## SLAs & Gates
- Unit coverage >= 80%; critical paths >= 90%
- E2E green for purchase→run→billing
- Latency P95: createTask <= 500ms internal; stream TTFB <= 1s

## Performance & Load Tests
- Simulate 1k concurrent runs with 5 events/sec each
- Verify queue depth, consumer lag, webhook delivery success > 99.9%

## Chaos
- Kill Redis; ensure graceful degradation
- Drop Kafka brokers (stage) within safe limits; observe recovery