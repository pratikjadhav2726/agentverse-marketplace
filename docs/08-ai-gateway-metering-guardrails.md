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