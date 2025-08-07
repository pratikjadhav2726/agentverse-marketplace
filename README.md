# AgentVerse Marketplace

![Screen Recording 2025-07-11 at 2 09 00 AM (1)](https://github.com/user-attachments/assets/5e552f28-3b79-43ff-8bbc-bb5001fb9d2b)

**AgentVerse Marketplace** is a next-generation platform designed to simplify the development, deployment, discovery, and collaboration of AI agents. It empowers sellers, buyers, and collaborative teams (“AI agent companies”) by providing robust abstractions and tools over complex infrastructure, making AI agent marketplaces accessible and powerful for all users.

---

## Key Features

### For Sellers: Effortless Agent Submission & Management

- **Managed Agent Runtime & SDK:**  
  An official AgentVerse SDK (Python, Node.js, etc.) abstracts away A2A protocol messaging, health checks, logging, and secret management. Sellers focus on their AI logic, while the SDK handles endpoint and runtime setup.
- **Automated Dockerfile Generation:**  
  AgentVerse infers dependencies and language to auto-generate Dockerfiles, reducing manual configuration for sellers.
- **Code Upload Option:**  
  For simple agents, sellers can directly upload code (e.g., a Python script), and AgentVerse analyzes dependencies, generates Dockerfiles, builds images, and deploys them automatically.
- **Integrated Testing Environment:**  
  Sellers can run example usage and test cases from their dashboard, with real-time logs, payloads, and performance feedback.
- **Agent Templates & Starters:**  
  Pre-built agent templates and Dockerfiles for common use cases allow quick starts for sellers.


### For Buyers: Intuitive Agent Discovery & Orchestration

- **Semantic Agent Search:**  
  Discover agents by intent or required functionality, leveraging detailed capability metadata and knowledge graphs.
- **Agent Card Detail View:**  
  View comprehensive agent information, including methods, input/output schemas, usage examples, performance stats, and reviews.
- **My Agents Dashboard:**  
  Manage purchased agents, access unique endpoints, documentation, and usage examples.
- **Visual Workflow Builder:**  
  Drag-and-drop canvas to orchestrate multi-agent workflows, with connectors, parameter mapping, and control flow components (if/else, loops, human-in-the-loop). Includes workflow templates, real-time execution visualization, and configurable output dashboards.
- **Workflow Execution & API Access:**  
  Manual and scheduled workflow triggers, plus auto-generated API endpoints for integration.


### For AI Agent Companies: Collaboration & Shared Resources

- **Shared Context & Knowledge Bases:**  
  Persistent, centralized stores (vector DBs, knowledge graphs) accessible by multiple agents, with access control.
- **Shared Tool Access:**  
  Centralized, secure integrations (e.g., API keys) available to all company agents.
- **Company Dashboard:**  
  Manage all company agents, shared configurations, billing, usage, user roles, and shared workflow repositories.
- **Hierarchical Agent Management:**  
  Designate “manager” agents to orchestrate and allocate tasks to other agents dynamically.

### Platform-Wide Enhancements

- **Developer Experience:**  
  Comprehensive documentation, community forums, and clear submission guidelines.
- **Monetization & Billing:**  
  Transparent usage tracking, predictive costing tools, and detailed dashboards for both buyers and sellers.
- **AI-Powered Assistance:**  
  Intelligent agent and workflow recommendations, and an AI troubleshooting assistant for debugging and support.

---

## 🚀 Project Updates & Changelog

We believe in transparency and open communication with our community. Here you'll find regular updates on the progress of AgentVerse Marketplace, including UI improvements, backend features, database changes, and more. We welcome your feedback and contributions!

### Recent Highlights
- **UI:** Modern, responsive dashboard and marketplace pages implemented. Enhanced agent cards, review forms, and workflow builder for a seamless user experience.
- **Database:** Core schema established using Supabase. User, agent, purchase, and review tables are live. Mock DB available for local development.
- **Backend:** RESTful API endpoints for agent management, purchases, reviews, payments, and workflows. Modular structure for scalability and maintainability.
- **Credit System:** Initial credit purchase and consumption logic in place. Users can buy credits, spend on agents, and view transaction history.
- **Authentication:** Secure login/signup with session management. Seller and buyer roles supported.
- **Payments:** Stripe integration for agent and credit purchases. Webhooks and payout logic for sellers.
- **Testing & Playground:** Built-in agent playground for sellers to test agents before publishing.
- **Open Source:** Following best practices—clear code structure, documentation, and community guidelines. See [CONTRIBUTING.md](./CONTRIBUTING.md) (coming soon) for how to get involved!

_Stay tuned for more updates. We value your input—open an issue or join the discussion to help shape AgentVerse!_

---

## 🛡️ System Architecture & Security Details

AgentVerse Marketplace is designed with security, transparency, and extensibility in mind. Below are the core technical details of the system:

### Authentication
- **Cookie-Based JWT Auth:**
  - Users authenticate via email and password.
  - On login/signup, a JWT is issued and stored in a secure, HTTP-only cookie (`auth_token`).
  - The cookie is set with `httpOnly`, `secure` (in production), `sameSite=lax`, and a 30-minute expiry for session security.
  - All protected routes validate the JWT from the cookie; users are redirected to sign in if not authenticated.
  - Role-based access control is enforced (admin, seller, buyer).

### Credit System
- **Wallets & Transactions:**
  - Each user has a wallet with a credit balance (1 credit = $1 USD equivalent).
  - Credits are purchased via Stripe and credited to the user's wallet.
  - All credit changes (purchases, agent/tool usage, payouts, commissions) are logged in the `credit_transactions` table for full auditability.
  - Credits are debited for agent usage, tool invocations, and purchases; sellers and the platform receive commissions automatically.
  - Insufficient credits block transactions, ensuring no negative balances.

### Credential Management
- **Encrypted Storage:**
  - User credentials (API keys, OAuth tokens, etc.) for external tools are stored in the `user_credentials` table.
  - All credential values are encrypted at rest using AES-256-CBC with a random IV and a strong key (from environment variable in production).
  - Only the credential owner can access or modify their credentials; encrypted values are never exposed via API.
  - Credentials are decrypted only at the time of secure tool invocation.

### Security Best Practices
- **Session Security:** JWTs are signed with a strong secret and never exposed to client-side JS.
- **Database Security:** All queries use parameterized statements to prevent SQL injection. Foreign key constraints enforce data integrity.
- **Access Control:** Only authorized users can access or modify their data. Agents must be explicitly linked to tools to use them.
- **Audit Logging:** All credit and tool usage is logged for transparency and compliance.
- **Input Validation:** All API endpoints validate input and enforce required fields and types.
- **Future Enhancements:** Plans for OAuth 2.0, rate limiting, credential rotation, and advanced analytics are in the roadmap.

For more details, see [MCP_TOOLS_GUIDE.md](./MCP_TOOLS_GUIDE.md) and [MARKETPLACE_SETUP.md](./MARKETPLACE_SETUP.md).

---

AgentVerse transforms the traditional marketplace model into a unified platform for the entire AI agent lifecycle, fostering a collaborative and innovative ecosystem for agent developers, buyers, and enterprises.

## A2A + MCP Implementation Plan (Turning the marketplace into a "company of agents")

### Goals
- Interoperate agents from any vendor via A2A (agent-to-agent collaboration)
- Safely access user data/tools via MCP (agent-to-tool access)
- Support long-running tasks, streaming updates, shared memory, billing, and governance

### What’s already built (leveraged in the plan)
- UI/UX: Marketplace, seller dashboards, workflows, agent playground
- DB and credit system: Wallets, transactions, payouts, reviews (SQLite/Drizzle; Supabase schema provided)
- Payments: Stripe integration and credit purchase flows
- AuthZ/AuthN: Cookie-JWT sessions; roles (admin, seller, buyer)
- MCP tools + secure credentials: Tool registry, agent-tool linking, encrypted user credentials, gateway invoke API (see `MCP_TOOLS_GUIDE.md`)
- Workflow skeleton: Executions and logs (`lib/workflow-engine.ts`) to evolve into orchestrator

### End-to-end architecture (high level)
- A2A Gateway/Client: Standardizes agent-to-agent calls (HTTP+JSON, Tasks, SSE, webhooks)
- Agent Registry + Agent Cards: Capability discovery and selection at runtime
- Orchestrator: Decomposes goals, delegates sub-tasks to agents, aggregates results
- Pub/Sub backbone: Real-time collaboration and decoupled events (dev: Redis/Dapr; prod: Kafka/EventBridge)
- Task queue: Durable long-running jobs and retries (dev: BullMQ/Redis; prod: Temporal/queues)
- MCP multi-tenant service: Per-user private tool workspace with policies and HITL
- Shared memory: Knowledge graph/vector store for cross-agent context
- AI Gateway: Token metering, routing, rate limits, guardrails, audit

### Phased implementation
1) A2A Core (MVP)
- Agent Cards (stored per agent): endpoint, skills, modalities, auth, streaming/webhook support
- A2A Client library: request/response, `Task` lifecycle, polling via `tasks/get`, SSE stream, webhook handling
- Seller onboarding: Card validation + health check; playground “ping” and sample call
- Buyer usage: Resolve Agent Card, send message/task, show progress and result; debit credits per use

2) Orchestrator & Workflows
- Extend `workflow-engine` to support agent nodes that call via A2A
- Add “orchestrator” agent type to plan, parallelize, and aggregate outputs
- Persist “run” entities with status, logs, artifacts; show in UI with step-by-step traces

3) Async + Streaming
- SSE for incremental updates (agent messages/artifact parts)
- Webhooks for very long runs; retry and dead-letter policies
- UI live run view (streams) and resume on reconnect

4) Pub/Sub Collaboration
- Introduce event topics: task.created, task.progress, task.completed, artifact.ready, alert.*
- Agents publish/subscribe for decoupled handoffs (blackboard pattern)
- Use Redis Streams/Dapr in dev; abstract for Kafka/EventBridge in prod

5) Task Queue & Reliability
- Add BullMQ (dev) for job queuing and worker pools; idempotency keys and checkpoints
- Progressive enhancement to Temporal for durable executions and retries

6) MCP Multi-tenant
- Logical per-user workspaces; per-agent identities within user context
- Policy layer (least-privilege, allowlists, scoped credentials), HITL approvals for sensitive tools
- Route agent tool calls through MCP gateway; log usage and charge credits

7) AI Gateway, Billing, and Guardrails
- Token metering and per-agent/per-user rate limits
- Output filters and prompt-injection defenses
- OpenTelemetry traces for A2A/MCP calls; map usage to credits and seller payouts

8) Shared Memory
- Start with Postgres + pgvector for embeddings; optional Neo4j for relations
- Store artifacts, links, and task graphs for retrieval-augmented collaboration

### Milestones (indicative)
- Week 1–2: A2A MVP (cards, client, seller onboarding, basic runs)
- Week 3–4: Orchestrator in workflows; SSE streaming; credits for runs
- Week 5–6: Pub/Sub + queue; long-running reliability; UI live runs
- Week 7–8: MCP multi-tenant + policies + HITL; gateway usage metering
- Week 9+: AI gateway, observability, shared memory, enterprise hardening

### Security & governance checklist
- OIDC/JWT identities for users and agents; mTLS between marketplace and hosted agents
- Fine-grained RBAC for tools; per-user data isolation in MCP
- Full audit logs (A2A messages, MCP invokes, credit charges); export for compliance
- Abuse and cost controls: quotas, spend limits, and anomaly detection

---

## Alternative architecture plans

### Plan A — Lean A2A-first (fastest path to value)
- Focus: Interop and monetization now; defer event backbone and advanced memory
- Build: Agent Cards + A2A client + seller onboarding + SSE + polling; simple orchestrator
- Queue: Minimal (BullMQ) for long tasks; no external broker initially
- Pros: Quick to ship; low ops complexity. Cons: Less decoupling; limited scale-up story

### Plan B — Event-driven “team of agents”
- Focus: Pub/Sub collaboration + orchestrator-worker pattern from the start
- Build: Dapr/Kafka topics, typed events, orchestrator that reacts to events; queue + SSE/webhooks
- Memory: Introduce knowledge graph sooner for cross-agent context
- Pros: Scales and composes well; resilient. Cons: Higher infra and operational load

### Plan C — Enterprise governance first
- Focus: Multi-tenant MCP gateway, policy engine, HITL, AI gateway metering and guardrails
- Build: Strong identity, authorization, audit, and billing before broad interop
- Pros: Enterprise-ready (regulated industries). Cons: Longer time-to-first-utility

---

## Clear next steps (recommended)
- Adopt Plan A for a 4–6 week MVP; keep interfaces broker-agnostic and queue-agnostic
- Define Agent Card JSON schema and validation in seller flow; seed 2–3 reference agents
- Implement A2A client with SSE + webhook support and run it through the workflow engine
- Add minimal BullMQ for long tasks; stream progress to UI; debit credits and log usage
- Draft MCP workspace boundary and per-agent identity; enforce allowlists on tool usage

If you need deeper specs (schemas, APIs, or sequence diagrams), open an issue and we’ll add them to the docs and roadmap.
