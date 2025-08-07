# 03 — Orchestrator & Workflows

Scope
- Extend `lib/workflow-engine.ts` to execute multi-agent workflows via A2A
- Orchestrator node for task decomposition and aggregation

Node types
- input: seeds workflow inputs
- agent: invokes remote agent via A2A client; streams progress; outputs artifact
- condition: routes based on boolean outputs
- output: collects `final_output`
- orchestrator: creates sub-tasks dynamically and links edges

Execution semantics
- Topological traversal as implemented; add async agent execution and waits
- For `agent` node:
  - Reserve credits → create task → stream SSE → emit artifact on completion
  - On failure: retry policy (configurable), else mark node failed
- For `orchestrator` node:
  - Analyze inputs; emit new nodes/edges (fan-out)
  - Wait for child nodes; aggregate artifacts

Persistence
- `runs` and `run_nodes` tables with status and timestamps
- Logs: append in `ExecutionLog`; expose via `/api/a2a/runs/{runId}`

UI
- Live run view with per-node status and logs
- Stream SSE from run-level endpoint to update UI

Testing
- Mock agent servers (Docker) with slow/fast and error behaviors
- E2E: ensure deterministic execution and correct aggregation

---

## Node schema
```json
{
  "id": "node-uuid",
  "type": "agent|orchestrator|condition|input|output",
  "data": {
    "label": "Research Agent",
    "agentId": "agent_123",
    "config": {"skill": "research.find", "concurrency": 3, "retry": {"max": 2}}
  }
}
```

## Persistence DDL
```sql
CREATE TABLE runs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  orchestrator_id TEXT,
  status TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME
);
CREATE TABLE run_nodes (
  id TEXT PRIMARY KEY,
  run_id TEXT REFERENCES runs(id) ON DELETE CASCADE,
  node_id TEXT,
  agent_id TEXT,
  status TEXT,
  started_at DATETIME,
  ended_at DATETIME,
  metadata_json TEXT
);
```

## Execution algorithm (pseudocode)
```ts
while (queue.notEmpty()) {
  const node = queue.pop();
  if (!depsSatisfied(node)) { queue.push(node); continue; }
  setCurrent(node); log("start");
  switch(node.type) {
    case 'agent': await runAgentNode(node); break;
    case 'orchestrator': await planSubtasks(node); break;
    case 'condition': evalCondition(node); break;
    case 'output': collect(node); break;
  }
  markDone(node); enqueueSuccessors(node);
}
```

## Cancellation & Pause
- Cancellation tokens per run and node; propagated to A2A client (if seller supports cancel)
- Pause run: stop scheduling successors; keep active agents running; resume continues queue

## Sequences
- Single agent run: input → agent → output → finalize
- Fan-out: orchestrator → N agent nodes in parallel → join → output

## Limits
- Max parallel nodes per run (configurable), per-tenant caps
- Max run duration; automatic fail and refund policy