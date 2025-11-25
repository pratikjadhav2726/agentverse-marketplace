# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Open source project structure with LICENSE, CONTRIBUTING.md, and CODE_OF_CONDUCT.md
- Comprehensive security policy (SECURITY.md)
- Environment variable template (.env.example)
- Pull request and issue templates
- Improved .gitignore with comprehensive patterns
- Project metadata in package.json

## [0.1.0] - 2025-11-25

### Added

#### Core Features
- **Agent Marketplace**: Browse, purchase, and deploy AI agents
- **User Management**: Authentication with JWT-based sessions
- **Credit System**: Virtual wallet for purchasing and using agents
- **Payment Integration**: Stripe integration for payments and payouts
- **Agent Dashboard**: Sellers can manage their agents and view analytics
- **Buyer Dashboard**: Manage purchased agents and access API endpoints
- **Review System**: Users can rate and review agents
- **Payout System**: Sellers can request payouts of their earnings

#### Technical Implementation
- **Frontend**: Next.js 14 with React 18, TypeScript, and Tailwind CSS
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Database**: SQLite with Drizzle ORM
- **Authentication**: Cookie-based JWT authentication with secure session management
- **Encryption**: AES-256-CBC encryption for stored credentials
- **API Design**: RESTful API endpoints with proper error handling
- **State Management**: React hooks and context for client-side state

#### Agent Features
- Agent submission and management
- Multiple pricing models (per-use, subscription, one-time)
- Agent categorization and tagging
- Agent search and filtering
- Demo URLs and documentation
- Health checks and monitoring

#### MCP Tools Integration
- MCP (Model Context Protocol) tools registry
- Secure credential storage for external tools
- Tool-to-agent linking
- Usage tracking and logging
- Support for multiple authentication types (API key, OAuth, Bearer, Basic)

#### Workflow Features
- Visual workflow builder with drag-and-drop interface
- Multi-agent orchestration
- Custom node types (agent, condition, loop, parallel)
- Workflow execution engine
- Real-time workflow visualization

#### Developer Experience
- Comprehensive documentation in `/docs` folder
- Setup guides for marketplace, MCP tools, and Supabase
- Mock database for local development
- Development team guide
- Technology stack research documentation

### Security
- JWT token-based authentication with httpOnly cookies
- Encrypted credential storage
- SQL injection prevention with parameterized queries
- CSRF protection with sameSite cookies
- Environment variable configuration
- Audit logging for credit transactions and tool usage

### Documentation
- Executive overview and CTO implementation plan
- System architecture documentation
- Agent registry service documentation
- A2A and MCP protocol integration guides
- Technology stack research
- Development team guide

### Infrastructure
- Next.js middleware for authentication
- Database initialization and seeding
- Stripe webhook handling
- API route handlers for all major features
- Error handling and logging

## [0.0.1] - Initial Commit

### Added
- Project initialization
- Basic Next.js setup
- Initial project structure

---

## Release Notes Format

Each release should follow this format:

### Added
- New features

### Changed
- Changes to existing functionality

### Deprecated
- Features that will be removed in future releases

### Removed
- Features that have been removed

### Fixed
- Bug fixes

### Security
- Security-related changes

---

## Links

- [Compare releases](https://github.com/agentverse/marketplace/compare)
- [All releases](https://github.com/agentverse/marketplace/releases)
