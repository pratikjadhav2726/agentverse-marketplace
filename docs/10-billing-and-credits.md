# 10 — Billing & Credits

Mappings
- A2A run start → provisional `use` debit
- A2A run completion → adjust debit if over/under estimates
- MCP invoke → `tool_usage` debit per call or per unit

Transactions
- `credit_transactions`: write atomic entries for debits/credits
- Commission: 10% retained; 90% to seller earnings

Payouts
- Seller dashboard aggregates earnings; payout requests processed via existing flow
- Add filters by period, agent, tool usage

Auditing
- Link transactions to `runId`, `taskId`, `agentId`, `toolId`
- Export CSV for finance