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

---

## Configuration
- A2A_TIMEOUT_CONNECT_MS=2000
- A2A_TIMEOUT_READ_MS=30000
- A2A_MAX_RETRIES=2 (GET), 1 (POST idempotent)
- A2A_CIRCUIT_FAIL_THRESHOLD=5 within 60s; HALF_OPEN after 30s
- JWT_ISSUER, JWT_AUDIENCE=agentverse, JWT_KEY_ID, JWT_PRIVATE_KEY

## Circuit Breaker
- CLOSED → record failures; on threshold trip to OPEN
- OPEN → short-circuit with 503; schedule HALF_OPEN probe
- HALF_OPEN → allow 1 call; if success → CLOSED else OPEN

## Error Mapping
| Remote | HTTP | Mapped Code | Action |
|-------|------|-------------|--------|
| 401/403 | 401/403 | E_AUTH | stop; alert |
| 408/504 | 504 | E_TIMEOUT | retry within budget |
| 429 | 429 | E_RATE_LIMIT | backoff; respect Retry-After |
| 5xx | 502 | E_REMOTE | retry with jitter |

## Pseudocode
```ts
async function createTask(card, message, opts) {
  const jwt = signJwt({sub: userId, agent_id: purchasedAgentId});
  const res = await fetch(card.endpoint + "/tasks", {
    method: "POST",
    headers: {"Authorization": `Bearer ${jwt}`, "Content-Type": "application/json", "X-Idempotency-Key": opts.idemKey},
    body: JSON.stringify({message, webhook: opts.webhookUrl})
  });
  return handleResponse(res);
}
```

## Metrics
- a2a.request.count{op}
- a2a.request.latency_ms{op, endpoint}
- a2a.request.errors{code}
- a2a.stream.duration_ms
- a2a.webhook.register.count

## Logging
- Correlation IDs: `runId`, `taskId`
- Redact tokens; include endpoint host and TLS version

## Security Hardening
- Pin endpoint host → IP drift alert
- Enforce TLS min version; reject weak ciphers
- JWT `kid` rotation; JWKS endpoint optional for sellers