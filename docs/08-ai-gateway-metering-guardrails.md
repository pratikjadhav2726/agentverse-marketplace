# 08 — AI Gateway (Metering, Guardrails, Observability)

Metering
- Token usage: model-reported or estimated by request/response sizes
- Count MCP invocations per tool; map to credits

Rate limits
- Per-user and per-agent; bursts and sustained windows
- Implement with Redis leaky-bucket or token-bucket

Guardrails
- Input validation: size caps, pattern filters, prompt-injection checks
- Output filtering: PII detection, content policy enforcement

Observability
- OpenTelemetry traces and metrics around A2A/MCP calls
- Dashboards: latency percentiles, error rates, spend per user/agent

Integration
- Gateway sits in front of orchestrator and MCP invoke path
- All calls tagged with `correlationId` and `runId`

---

## Metering Methods
- LLM usage header parsing (OpenAI-style, Bedrock-style); fallback estimate by tokens = tiktoken(model, input+output)
- MCP call unit pricing per tool; surge pricing flags per vendor

## Rate Limit Algorithms
- Token bucket: rate r, burst b; implemented in Redis with LUA scripts
- Sliding window log for enforcement and analytics

## Guardrail Rules
- Prompt injection patterns: deny lists, model-specific system prompts
- PII: regex + ML detector; mask outputs; configurable redaction policy
- Tool-specific guards: block domains, file types

## Metrics & Alerts
- Credits consumed per run/user/agent; error rate > 2% alert
- Rate limit hits; blocked guardrail events; top tool spend