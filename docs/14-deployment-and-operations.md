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

---

## Infrastructure as Code
- Terraform modules for API, workers, Redis, Kafka, Postgres
- Secrets via SSM/KMS; per-environment workspaces

## Blue/Green & Rollback
- Deploy green; shift 10% traffic; observe; then 100%
- Rollback by route switch; DB migrations backward-compatible

## Backups & DR
- Postgres PITR; daily snapshots; restore drills quarterly
- Redis RDB every 5m; Kafka multi-AZ; object storage for artifacts

## Capacity Planning
- Runs/day forecast; events/run; throughput targets → size partitions and worker pools

## SLOs
- Run completion success >= 99.5%
- Webhook delivery success >= 99.9%
- Mean time to recovery < 15m