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