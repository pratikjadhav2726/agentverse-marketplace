# 14 — Deployment & Operations

Environments
- Dev: SQLite + Redis; local SSE/webhooks
- Stage: Postgres + Redis; canary deployments
- Prod: Postgres + Kafka/Redis; multi-AZ

Secrets
- JWT keys, webhook secrets, credential encryption keys; managed via KMS/Secrets Manager

Scaling
- API autoscale on CPU/latency; separate worker autoscaling by queue depth
- Kafka partitions sized by tenant/run throughput

Observability
- Centralized logs, traces, metrics; SLOs for:
  - Run completion latency (P95)
  - Webhook delivery success rate
  - Queue time (P95)

Runbooks
- Webhook DLQ drain procedure
- Circuit breaker resets
- Rolling key rotation