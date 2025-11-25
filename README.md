# AgentVerse Marketplace

<div align="center">

![AgentVerse Banner](https://github.com/user-attachments/assets/5e552f28-3b79-43ff-8bbc-bb5001fb9d2b)

**A next-generation platform for developing, deploying, discovering, and collaborating with AI agents**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Features](#-key-features) • [Getting Started](#-getting-started) • [Documentation](#-documentation) • [Contributing](#-contributing) • [License](#-license)

</div>

---

**AgentVerse Marketplace** empowers sellers, buyers, and collaborative teams by providing robust abstractions and tools over complex infrastructure, making AI agent marketplaces accessible and powerful for all users.

---

## 📋 Table of Contents

- [Key Features](#-key-features)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Running the Application](#running-the-application)
- [Project Structure](#-project-structure)
- [Documentation](#-documentation)
- [Technology Stack](#-technology-stack)
- [Contributing](#-contributing)
- [Security](#-security)
- [License](#-license)
- [Support](#-support)

---

## ✨ Key Features

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

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher) or **pnpm**
- **Git**
- A **Stripe** account (for payment processing)
- A **Supabase** account (optional, for production database)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/agentverse/marketplace.git
cd marketplace
```

2. **Install dependencies**

```bash
npm install
# or
pnpm install
```

### Configuration

1. **Set up environment variables**

Copy the example environment file and configure it with your credentials:

```bash
cp .env.example .env.local
```

2. **Configure required environment variables**

Edit `.env.local` and add your keys:

```bash
# Authentication & Security
JWT_SECRET=your-super-secret-jwt-key-change-me-in-production
CREDENTIAL_ENCRYPTION_KEY=your-32-character-encryption-key-change-me

# Supabase (optional for local development)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Security Tips:**
- Generate strong secrets: `openssl rand -base64 32`
- Never commit `.env.local` to version control
- Use test keys for development, production keys only in production

3. **Initialize the database**

The application uses SQLite for local development. The database will be automatically initialized on first run.

```bash
# Database will be created at ./agentverse.db
npm run dev
```

### Running the Application

1. **Development mode**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

2. **Production build**

```bash
npm run build
npm start
```

3. **Linting and type checking**

```bash
npm run lint
npm run type-check
```

### Default Test Accounts

The application comes with seeded test accounts:

- **Admin**: admin@agentverse.com / password
- **User 1**: user1@agentverse.com / password
- **User 2**: user2@agentverse.com / password

**⚠️ Important**: Change these credentials before deploying to production!

---

## 📁 Project Structure

```
agentverse-marketplace/
├── app/                    # Next.js app router pages and API routes
│   ├── api/               # API endpoints
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   └── marketplace/       # Marketplace pages
├── components/            # React components
│   ├── dashboard/         # Dashboard-specific components
│   ├── layout/            # Layout components
│   ├── marketplace/       # Marketplace components
│   ├── payment/           # Payment components
│   ├── ui/                # Reusable UI components (shadcn/ui)
│   └── workflow/          # Workflow builder components
├── docs/                  # Comprehensive documentation
│   ├── 01-executive-overview/
│   ├── 02-architecture/
│   ├── 04-feature-documentation/
│   ├── 05-protocol-integration/
│   ├── 06-technology-research/
│   └── 07-team-guides/
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and shared logic
│   ├── auth.ts           # Authentication utilities
│   ├── database.ts       # Database connection and utilities
│   ├── schema.ts         # Database schema
│   ├── stripe.ts         # Stripe integration
│   └── types.ts          # TypeScript type definitions
├── public/                # Static assets
├── styles/                # Global styles
├── .env.example           # Environment variables template
├── .gitignore            # Git ignore rules
├── CHANGELOG.md          # Version history
├── CODE_OF_CONDUCT.md    # Code of conduct
├── CONTRIBUTING.md       # Contribution guidelines
├── LICENSE               # MIT License
├── package.json          # Dependencies and scripts
├── README.md             # This file
├── SECURITY.md           # Security policy
└── tsconfig.json         # TypeScript configuration
```

---

## 📚 Documentation

Comprehensive documentation is available in the `/docs` folder:

- **[Executive Overview](docs/01-executive-overview/)** - High-level project overview and implementation plan
- **[Architecture](docs/02-architecture/)** - System architecture and design decisions
- **[Feature Documentation](docs/04-feature-documentation/)** - Detailed feature specifications
- **[Protocol Integration](docs/05-protocol-integration/)** - A2A and MCP protocol guides
- **[Technology Research](docs/06-technology-research/)** - Technology stack analysis
- **[Development Guide](docs/07-team-guides/)** - Developer onboarding and guidelines

### Key Guides

- [Marketplace Setup Guide](MARKETPLACE_SETUP.md) - Complete marketplace setup instructions
- [MCP Tools Guide](MCP_TOOLS_GUIDE.md) - Model Context Protocol integration
- [Sales Dashboard Guide](SALES_DASHBOARD_GUIDE.md) - Analytics and sales management
- [Supabase Tutorial](SUPABASE_TUTORIAL.md) - Database setup with Supabase

---

## 🛠 Technology Stack

### Frontend
- **Framework**: Next.js 14 (React 18)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: React Hooks & Context
- **Forms**: React Hook Form + Zod validation
- **Workflow**: ReactFlow for visual workflow builder

### Backend
- **Runtime**: Node.js
- **API**: Next.js API Routes (RESTful)
- **Authentication**: JWT with jose library
- **Database**: SQLite (development) / Supabase (production)
- **ORM**: Drizzle ORM
- **Payments**: Stripe
- **Encryption**: Native crypto module (AES-256-CBC)

### DevOps
- **Version Control**: Git & GitHub
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel (recommended)
- **Testing**: Jest + React Testing Library (setup ready)

---

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guide](CONTRIBUTING.md) to get started.

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`npm test && npm run lint`)
5. Commit your changes (`git commit -m 'feat: add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines

- Follow [SOLID principles](https://en.wikipedia.org/wiki/SOLID) and best practices
- Write clean, maintainable, and well-documented code
- Add tests for new features
- Update documentation as needed
- Follow our [Code of Conduct](CODE_OF_CONDUCT.md)

---

## 🛡️ Security

Security is a top priority. Please review our [Security Policy](SECURITY.md) for:

- Reporting vulnerabilities
- Security best practices
- Known security considerations

**To report a security vulnerability**: Please email security@agentverse.com instead of using public issues.

---

## 🔒 System Architecture & Security Details

AgentVerse Marketplace is designed with security, transparency, and extensibility in mind.

### Authentication
- **Cookie-Based JWT Auth**: Secure, HTTP-only cookies with 30-minute expiry
- **Role-Based Access Control**: Admin, seller, and buyer roles
- **Session Management**: Automatic token refresh and secure logout

### Credit System
- **Virtual Wallet**: 1 credit = $1 USD equivalent
- **Transaction Logging**: Full audit trail of all credit movements
- **Atomic Operations**: Prevent race conditions and ensure data integrity

### Credential Management
- **Encrypted Storage**: AES-256-CBC encryption for API keys and tokens
- **Secure Access**: Credentials decrypted only during authorized operations
- **No Exposure**: Encrypted values never exposed via API

### Security Best Practices
- Parameterized SQL queries prevent injection attacks
- CSRF protection with sameSite cookies
- Input validation on all endpoints
- Environment-based configuration
- Regular dependency updates

For more details, see [SECURITY.md](SECURITY.md).

---

## 📊 Project Updates & Roadmap

### Recent Highlights (v0.1.0)
- ✅ Modern, responsive UI with dashboard and marketplace
- ✅ Core database schema with Supabase support
- ✅ RESTful API for agents, purchases, and reviews
- ✅ Credit system with Stripe integration
- ✅ Secure authentication and session management
- ✅ Agent playground for testing
- ✅ Visual workflow builder
- ✅ MCP tools integration
- ✅ Open source project structure

### Upcoming Features
- [ ] Agent Docker runtime and SDK
- [ ] Automated Dockerfile generation
- [ ] Advanced agent search with semantic capabilities
- [ ] Workflow execution API
- [ ] Company collaboration features
- [ ] Enhanced analytics dashboard
- [ ] OAuth 2.0 support
- [ ] Rate limiting and API quotas

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 💬 Support

### Get Help

- 📖 **Documentation**: Check the [/docs](docs/) folder
- 💡 **Discussions**: [GitHub Discussions](https://github.com/agentverse/marketplace/discussions)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/agentverse/marketplace/issues)
- 💌 **Email**: support@agentverse.com

### Community

- 🌟 **Star** this repository if you find it useful!
- 🍴 **Fork** it to contribute or customize
- 📢 **Share** it with others who might benefit

---

<div align="center">

**Built with ❤️ by the AgentVerse Team**

AgentVerse transforms the traditional marketplace model into a unified platform for the entire AI agent lifecycle, fostering a collaborative and innovative ecosystem for agent developers, buyers, and enterprises.

[⬆ Back to Top](#agentverse-marketplace)

</div>
