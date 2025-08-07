# 05 — Pub/Sub Collaboration

Topics
- `agentverse.task.created`
- `agentverse.task.updated`
- `agentverse.artifact.created`
- `agentverse.alert`
- `agentverse.billing.usage`

Envelope
```json
{
  "eventId": "evt_...",
  "type": "agentverse.task.updated",
  "ts": 1736293200,
  "correlationId": "run_abc",
  "taskId": "t_123",
  "agentId": "agent_456",
  "userId": "user_789",
  "payload": {"status":"working","progress":42}
}
```

Integration
- Agent node publishes updates on progress and completion
- Orchestrator subscribes to artifacts; triggers dependent nodes
- Billing worker subscribes to usage events and writes credit transactions

Tech
- Dev: Redis Streams (via ioredis), Dapr Pub/Sub abstraction
- Prod: Kafka; partitions by tenant or `correlationId`

Operations
- Retention policies by topic
- Dead-letter topics; consumer lag dashboards

---

## Versioning
- Envelope `type` uses semantic version suffix: `agentverse.task.updated.v1`
- Payload changes are backward-compatible; add fields only; use defaults

## Partitioning & Keys
- Kafka: key by `correlationId` to keep run ordering
- Retention: 7 days for task.*; 30 days for billing.*; compaction for billing totals

## Consumer patterns
- Orchestrator: subscribe `artifact.created.*` → schedule dependent nodes
- Billing: subscribe `billing.usage.*` → write transactions
- Alerting: subscribe `alert.*` → page on error thresholds

## Error Handling
- Poison events → DLQ topic with original payload and error metadata
- Replay by correlationId for incident investigations