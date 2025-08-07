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

---

## Retention & Privacy
- Default retention 180 days; per-tenant override
- GDPR delete: cascade remove artifacts and embeddings by `user_id`

## Chunking & Embeddings
- Chunk size ~1k tokens with overlap 10%
- Embedding model: `text-embedding-3-large` (configurable); store dims in metadata
- Index: IVF/IVFFlat depending on Postgres extension; HNSW alternative

## Graph Schema (Neo4j optional)
- Nodes: Artifact, Agent, Task, Tool
- Relations: PRODUCED_BY, USES_TOOL, DERIVES_FROM, BELONGS_TO_RUN

## Query Patterns
- Retrieve all artifacts DERIVES_FROM a given artifact within run
- Recommend related artifacts by combined vector + relation proximity