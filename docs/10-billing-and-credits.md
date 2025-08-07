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

---

## Pricing Rules
- Per-use base price from agent; add streaming surcharge if duration > threshold
- MCP tool pricing table: per-call or per-1k tokens; minimum bill 1 credit

## Rounding & Currency
- Credits as integer; round up partials
- Reconciliation job aggregates daily usage into statements

## Disputes & Refunds
- Buyer can dispute within 7 days; freeze payout; adjudicate via logs
- Partial refunds create negative credit transactions

## Payouts
- Weekly batch; minimum threshold; fees deducted
- Export statements CSV with tax fields (country, VAT ID)

## Tax
- Capture seller tax profiles; tax-exclusive credits; jurisdictional handling externalized