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
- **🏗️ Microservices Architecture:** Complete Python-based AI backend with FastAPI, LangChain, and LangGraph integration. Five specialized microservices for workflow orchestration, agent runtime, MCP tools, A2A protocol, and AI coordination.
- **🤖 AI Agent Runtime:** LangChain-powered agent execution environment with dynamic tool loading, memory management, and performance monitoring.
- **🔄 Workflow Engine:** LangGraph-based visual workflow builder with state management, async processing via Celery, and real-time execution monitoring.
- **🛠️ MCP Protocol:** Full Model Context Protocol implementation with secure tool registry, encrypted credential storage, and multi-tenant resource management.
- **🔗 A2A Protocol:** Agent2Agent communication system with discovery, task delegation, message passing, and performance tracking.
- **💾 Vector Database:** ChromaDB integration for embeddings, similarity search, and AI agent memory with persistent storage.
- **🔐 Security Layer:** JWT authentication, encrypted credentials, rate limiting, audit logging, and role-based access control.
- **🐳 Container Support:** Complete Docker Compose setup with service orchestration, health checks, and development/production configurations.
- **📊 Admin Dashboard:** Comprehensive microservices monitoring with health checks, performance metrics, and system overview.
- **🔧 Developer Experience:** One-click setup script, comprehensive documentation, API documentation, and development tools.

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

For more details, see [MCP_TOOLS_GUIDE.md](./MCP_TOOLS_GUIDE.md), [MARKETPLACE_SETUP.md](./MARKETPLACE_SETUP.md), and [MVP_IMPLEMENTATION_SUMMARY.md](./MVP_IMPLEMENTATION_SUMMARY.md).

---

## 🚀 Quick Start

### Automated Setup (Recommended)
```bash
# One-command setup for the entire platform
./setup_agentverse.sh
```

### Manual Setup

#### Prerequisites
- Node.js 18+ 
- Python 3.11+
- Redis server
- OpenAI API key

#### Installation
```bash
# 1. Install frontend dependencies
npm install

# 2. Setup Python microservices
cd python_services
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..

# 3. Configure environment
cp .env.example .env
# Update .env with your API keys
```

#### Running the Platform

**Development Mode:**
```bash
# Terminal 1: Start Next.js frontend
npm run dev

# Terminal 2: Start Python microservices
cd python_services && ./start_services.sh
```

**Docker Mode:**
```bash
docker-compose up --build
```

#### Access Points
- **Frontend**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin/microservices
- **API Health**: http://localhost:3000/api/microservices/health

#### Microservice Endpoints
- **Workflow Engine**: http://localhost:8001/docs
- **Agent Runtime**: http://localhost:8002/docs  
- **MCP Server**: http://localhost:8003/docs
- **A2A Service**: http://localhost:8004/docs
- **AI Orchestrator**: http://localhost:8005/docs

---

AgentVerse transforms the traditional marketplace model into a unified platform for the entire AI agent lifecycle, fostering a collaborative and innovative ecosystem for agent developers, buyers, and enterprises.
