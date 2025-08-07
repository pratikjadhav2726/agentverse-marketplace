# 02 — A2A Client & Gateway

Scope
- Marketplace-side A2A client library and thin gateway service
- Authentication (JWT), retries, telemetry

Responsibilities
- Create tasks, poll status, stream SSE, register webhooks
- Normalize errors, enrich with correlation IDs, record metrics

API (internal client)
```ts
createTask(card: AgentCard, message: Message, opts: { webhookUrl?: string }): Promise<{ taskId: string }>
getTask(card: AgentCard, taskId: string): Promise<TaskState>
openStream(card: AgentCard, taskId: string): EventSource
registerWebhook(card: AgentCard, taskId: string, url: string, secret: string): Promise<void>
```

Auth
- Sign marketplace JWT: `sub=userId`, `agent_id` (purchased agent acting), `azp=agentverse`, expiry <= 15m
- mTLS (where possible) between gateway and agent endpoint

Resilience
- Timeouts (connect/read)
- Retries (idempotent GETs, safe POSTs with idempotency key `x-idempotency-key: runId:nodeId`)
- Circuit breaker on per-endpoint basis

Telemetry
- OpenTelemetry spans: a2a.create_task, a2a.get_task, a2a.stream, a2a.register_webhook
- Attributes: `agent_id`, `endpoint_host`, `task_id`, `run_id`

Errors
- Map remote errors to standard codes: `E_AUTH`, `E_RATE_LIMIT`, `E_TIMEOUT`, `E_REMOTE` (with `remote_code`)

Security
- Validate Agent Card host against allowlist or DNS pinning
- Enforce HTTPS
- Inject minimum claims; never forward user secrets

Implementation
- Node fetch client with AbortController for timeouts
- EventSource polyfill for SSE in Node
- Shared signer util for JWT; key from secrets manager