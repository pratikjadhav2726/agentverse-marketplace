# 06 — Task Queue & Reliability

Queues (BullMQ + Redis)
- `a2a-exec`: create tasks, poll fallback, supervise streams
- `webhook-delivery`: signed delivery with backoff
- `billing-meter`: usage → credit transactions

Worker contracts
- Input: job data includes `runId`, `nodeId`, `agentId`, `taskId?`
- Idempotency: `jobId = runId:nodeId:step`
- Checkpoints: persist partial artifacts per job

Failure modes
- Timeouts, network errors: retry with jitter; cap retries
- Poison messages: DLQ after threshold; alert

Temporal migration
- Model orchestrations as workflows
- Activities wrap A2A calls and webhook sends
- Benefits: stateful timers, durable retries, visibility