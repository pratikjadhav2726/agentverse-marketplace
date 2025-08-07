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