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