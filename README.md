# AgentVerse Marketplace

**AgentVerse Marketplace** is a next-generation platform designed to simplify the development, deployment, discovery, and collaboration of AI agents. It empowers sellers, buyers, and collaborative teams (“AI agent companies”) by providing robust abstractions and tools over complex infrastructure, making AI agent marketplaces accessible and powerful for all users.

---

## ⚡️ Database & Environment Setup

**Staging & Local Development:**
- The project now uses **SQLite** for staging and local development environments. No external database setup is required to get started locally.
- Supabase integration is currently paused and not required for running or testing the platform in development/staging.
- All data is stored in a local SQLite file or in-memory mock database for rapid prototyping and testing.

> **Note:** If you are looking for the previous Supabase setup, see `SUPABASE_TUTORIAL.md`. This is not required for local development or staging at this time.

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
<img width="1464" alt="image" src="https://github.com/user-attachments/assets/e09faa34-f633-4520-a7a6-96154f3c178b" />

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
<img width="1460" alt="image" src="https://github.com/user-attachments/assets/03d902d1-aa9d-4f39-82da-d3ef6dab2648" />

### For AI Agent Companies: Collaboration & Shared Resources

- **Shared Context & Knowledge Bases:**  
  Persistent, centralized stores (vector DBs, knowledge graphs) accessible by multiple agents, with access control.
- **Shared Tool Access:**  
  Centralized, secure integrations (e.g., API keys) available to all company agents.
- **Company Dashboard:**  
  Manage all company agents, shared configurations, billing, usage, user roles, and shared workflow repositories.
- **Hierarchical Agent Management:**  
  Designate “manager” agents to orchestrate and allocate tasks to other agents dynamically.
  <img width="1082" alt="image" src="https://github.com/user-attachments/assets/228b2a06-2fc2-4186-9565-fb791e36431c" />


### Platform-Wide Enhancements

- **Developer Experience:**  
  Comprehensive documentation, community forums, and clear submission guidelines.
- **Monetization & Billing:**  
  Transparent usage tracking, predictive costing tools, and detailed dashboards for both buyers and sellers.
- **AI-Powered Assistance:**  
  Intelligent agent and workflow recommendations, and an AI troubleshooting assistant for debugging and support.

---

AgentVerse transforms the traditional marketplace model into a unified platform for the entire AI agent lifecycle, fostering a collaborative and innovative ecosystem for agent developers, buyers, and enterprises.
