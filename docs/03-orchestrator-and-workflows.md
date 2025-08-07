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