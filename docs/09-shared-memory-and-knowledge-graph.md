# 09 — Shared Memory & Knowledge Graph

Phase 1 (pgvector)
- Table `artifacts(..., content_json JSONB, embedding VECTOR)`
- Generate embeddings on artifact write; store and index
- Search API: hybrid vector + keyword; filter by user/run/agent

Phase 2 (Neo4j optional)
- `artifact_links` for relations; build task graphs
- Queries for dependency tracing and reuse suggestions

APIs
- `POST /api/memory/artifacts` (persist)
- `GET /api/memory/search?k=...&q=...` (return ranked artifacts with metadata)

Usage in orchestrator
- Fetch previous relevant artifacts before delegating to agents
- Store final artifacts with relations to inputs and agents