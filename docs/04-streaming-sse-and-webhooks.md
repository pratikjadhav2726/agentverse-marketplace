# 04 — Streaming (SSE) & Webhooks

SSE
- Endpoint: `GET /api/a2a/runs/{runId}/stream`
- Server relays selected A2A events to run-level stream
- Event types forwarded: `task.status`, `artifact.append`, `message`, `task.completed`, `task.failed`
- Heartbeats every 15s; auto-reconnect supported

Webhook receiver
- Endpoint: `POST /api/a2a/webhooks/{taskId}`
- Headers: `X-AgentVerse-Signature: sha256=...` (HMAC of raw body)
- Verify signature using stored secret; reject if invalid or expired (timestamp claim)
- Enqueue `webhook-delivery` processing job; ack 202 quickly

Delivery to buyers/UI
- SSE bridge updates run state and node logs
- Store artifact parts incrementally; merge on completion

Retries
- For outbound webhooks (to buyers): exponential backoff (5 tries), DLQ after failures
- For inbound duplicates: detect by eventId; ignore duplicates

Security
- IP allowlisting (optional)
- Size limits; gzip support; reject dangerous content types

---

## SSE Formatting
- Content-Type: text/event-stream; charset=utf-8
- Events:
```
event: task.status
data: {"taskId":"t_1","status":"working","ts":1736293200}

event: artifact.append
data: {"taskId":"t_1","part":{"kind":"text","text":"partial..."}}
```
- Heartbeat: `:\n` every 15s

## Webhook Signing
- Compute: `sig = hex( HMAC_SHA256(secret, timestamp + "." + body) )`
- Headers: `X-AV-Signature: t=TIMESTAMP,v1=SIG`
- Verify: check |timestamp-now| <= 5m; recompute HMAC over raw body

## Examples
Request body (task.completed)
```json
{
  "eventId": "evt_123",
  "type": "task.completed",
  "taskId": "t_1",
  "artifact": {"parts":[{"kind":"text","text":"Done"}]}
}
```

## Errors
- 400 invalid_signature
- 408 receiver_timeout
- 5xx transient → retry with backoff

## Rate Limits
- Limit inbound webhooks per task to 5 QPS; burst 10
- Reject bodies > 2 MB; compress with gzip supported