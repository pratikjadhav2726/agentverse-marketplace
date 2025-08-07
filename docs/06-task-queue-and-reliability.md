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

---

## Backoff & Timeouts
- Exponential backoff: base=500ms, factor=2, jitter=50%, max=60s
- Timeouts: createTask 30s, getTask 10s, webhook 10s

## Job schema
```json
{
  "jobId": "runA:nodeB:step1",
  "runId": "runA",
  "nodeId": "nodeB",
  "agentId": "agentX",
  "taskId": null,
  "attempt": 1,
  "payload": {"message": {"parts": [...]}}
}
```

## Ops Runbooks
- DLQ drain: inspect reason → requeue or drop; notify owners
- Redis outage: fail-closed and surface user-friendly status; auto-recover when available
- Hotfix: scale down queue consumers before schema changes