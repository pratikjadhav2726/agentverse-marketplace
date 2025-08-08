# Development Team Guide - Enterprise AI Agent Marketplace

## Overview

This guide provides comprehensive development standards, workflows, and best practices for the Enterprise AI Agent Marketplace project. It serves as the primary reference for all development team members working on the platform.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Development Environment Setup](#development-environment-setup)
3. [Coding Standards](#coding-standards)
4. [Git Workflow](#git-workflow)
5. [Testing Strategy](#testing-strategy)
6. [Code Review Process](#code-review-process)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Deployment Guidelines](#deployment-guidelines)
9. [Monitoring and Debugging](#monitoring-and-debugging)
10. [Security Guidelines](#security-guidelines)

## Project Structure

### Monorepo Architecture

```
ai-agent-marketplace/
├── apps/
│   ├── web-dashboard/          # Next.js frontend application
│   ├── api-gateway/            # Main API gateway service
│   ├── agent-registry/         # Agent registry microservice
│   ├── a2a-gateway/           # A2A protocol gateway
│   ├── mcp-server/            # MCP protocol server
│   ├── task-orchestrator/     # Task orchestration service
│   ├── payment-service/       # Payment processing service
│   └── notification-service/  # Notification handling service
├── packages/
│   ├── shared/                # Shared utilities and types
│   ├── a2a-sdk/              # A2A protocol SDK
│   ├── mcp-sdk/              # MCP protocol SDK
│   ├── ui-components/        # Reusable UI components
│   └── database/             # Database schemas and migrations
├── tools/
│   ├── scripts/              # Development and deployment scripts
│   ├── docker/               # Docker configurations
│   └── k8s/                  # Kubernetes manifests
├── docs/                     # Project documentation
├── tests/
│   ├── e2e/                  # End-to-end tests
│   ├── integration/          # Integration tests
│   └── load/                 # Load testing scripts
└── .github/                  # GitHub workflows and templates
```

### Technology Stack

#### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript 5.0+
- **Styling**: Tailwind CSS + Shadcn/ui
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Testing**: Jest + React Testing Library + Playwright

#### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: NestJS (microservices)
- **Language**: TypeScript 5.0+
- **Database**: PostgreSQL 15 + Redis 7
- **ORM**: TypeORM
- **Message Queue**: Apache Kafka
- **Testing**: Jest + Supertest

#### Infrastructure
- **Container**: Docker + Kubernetes
- **Cloud**: AWS/Azure (multi-cloud)
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack
- **CI/CD**: GitHub Actions

## Development Environment Setup

### Prerequisites

```bash
# Required versions
node >= 20.0.0
npm >= 10.0.0
docker >= 24.0.0
docker-compose >= 2.0.0
kubectl >= 1.28.0
```

### Initial Setup

```bash
# 1. Clone the repository
git clone https://github.com/company/ai-agent-marketplace.git
cd ai-agent-marketplace

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env.local
# Edit .env.local with your local configuration

# 4. Start development dependencies
docker-compose -f docker-compose.dev.yml up -d

# 5. Run database migrations
npm run db:migrate

# 6. Seed development data
npm run db:seed

# 7. Start development servers
npm run dev
```

### Environment Configuration

```bash
# .env.local example
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/marketplace_dev
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# External Services
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# A2A Configuration
A2A_SERVER_PORT=8080
A2A_DISCOVERY_TIMEOUT=30000

# MCP Configuration
MCP_SERVER_PORT=3001
MCP_MAX_CONNECTIONS=1000

# Monitoring
PROMETHEUS_PORT=9090
GRAFANA_PORT=3000
```

### Docker Development Setup

```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: marketplace_dev
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  kafka:
    image: confluentinc/cp-kafka:latest
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    ports:
      - "9092:9092"
    depends_on:
      - zookeeper

  zookeeper:
    image: confluentinc/cp-zookeeper:latest
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    ports:
      - "2181:2181"

volumes:
  postgres_data:
  redis_data:
```

## Coding Standards

### TypeScript Guidelines

#### File Naming Conventions

```
PascalCase:     ComponentName.tsx, ServiceClass.ts
camelCase:      utilityFunction.ts, helperMethod.ts
kebab-case:     api-routes.ts, config-files.ts
UPPER_CASE:     CONSTANTS.ts, ENV_VARIABLES.ts
```

#### Code Style

```typescript
// ✅ Good: Use explicit types
interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  preferences: UserPreferences;
}

// ✅ Good: Use readonly for immutable data
interface AgentCard {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly capabilities: readonly AgentCapability[];
}

// ✅ Good: Use proper error handling
async function createAgent(data: CreateAgentRequest): Promise<Agent> {
  try {
    const validation = await validateAgentData(data);
    if (!validation.valid) {
      throw new ValidationError('Invalid agent data', validation.errors);
    }
    
    return await agentRepository.save(data);
  } catch (error) {
    logger.error('Failed to create agent', { error, data });
    throw error;
  }
}

// ❌ Bad: Using any type
function processData(data: any): any {
  return data.map((item: any) => item.value);
}

// ✅ Good: Using proper generics
function processData<T, K extends keyof T>(
  data: T[], 
  key: K
): T[K][] {
  return data.map(item => item[key]);
}
```

#### Import/Export Standards

```typescript
// ✅ Good: Organized imports
import React from 'react';
import { NextPage } from 'next';

import { Button } from '@/components/ui/button';
import { AgentCard } from '@/components/agent/AgentCard';

import { AgentService } from '@/services/AgentService';
import { useAuth } from '@/hooks/useAuth';

import type { Agent, AgentCapability } from '@/types/agent';
import type { User } from '@/types/user';

// ✅ Good: Named exports for utilities
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
};

// ✅ Good: Default export for components
const AgentListPage: NextPage = () => {
  // Component implementation
};

export default AgentListPage;
```

### React/Next.js Guidelines

#### Component Structure

```typescript
// ✅ Good: Proper component structure
import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface AgentCardProps {
  agent: Agent;
  onSelect?: (agent: Agent) => void;
  className?: string;
}

export const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  onSelect,
  className
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSelect = useCallback(() => {
    if (onSelect && !isLoading) {
      onSelect(agent);
    }
  }, [agent, onSelect, isLoading]);

  return (
    <div 
      className={cn(
        'rounded-lg border p-4 hover:shadow-md transition-shadow',
        className
      )}
      onClick={handleSelect}
    >
      <h3 className="text-lg font-semibold">{agent.name}</h3>
      <p className="text-gray-600">{agent.description}</p>
    </div>
  );
};
```

#### Hooks Guidelines

```typescript
// ✅ Good: Custom hook with proper error handling
export function useAgent(agentId: string) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAgent() {
      try {
        setLoading(true);
        setError(null);
        
        const result = await AgentService.getAgent(agentId);
        
        if (!cancelled) {
          setAgent(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchAgent();

    return () => {
      cancelled = true;
    };
  }, [agentId]);

  return { agent, loading, error };
}
```

### Backend Guidelines

#### Service Layer Pattern

```typescript
// ✅ Good: Service with dependency injection
@Injectable()
export class AgentService {
  constructor(
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    private readonly validationService: ValidationService,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: Logger
  ) {}

  async createAgent(
    createAgentDto: CreateAgentDto,
    userId: string
  ): Promise<Agent> {
    this.logger.log(`Creating agent for user ${userId}`, { createAgentDto });

    // Validate input
    await this.validationService.validateCreateAgent(createAgentDto);

    // Create entity
    const agent = this.agentRepository.create({
      ...createAgentDto,
      ownerId: userId,
      status: AgentStatus.PENDING
    });

    // Save to database
    const savedAgent = await this.agentRepository.save(agent);

    // Emit event for other services
    this.eventEmitter.emit('agent.created', {
      agentId: savedAgent.id,
      userId,
      timestamp: new Date()
    });

    this.logger.log(`Agent created successfully`, { agentId: savedAgent.id });
    return savedAgent;
  }
}
```

#### Error Handling

```typescript
// ✅ Good: Custom error classes
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: ValidationIssue[]
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} with ID ${id} not found`);
    this.name = 'NotFoundError';
  }
}

// ✅ Good: Global exception filter
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof ValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.message;
    } else if (exception instanceof NotFoundError) {
      status = HttpStatus.NOT_FOUND;
      message = exception.message;
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message
    };

    this.logger.error('Exception occurred', {
      exception,
      request: {
        url: request.url,
        method: request.method,
        headers: request.headers
      }
    });

    response.status(status).json(errorResponse);
  }
}
```

## Git Workflow

### Branch Strategy

We use **Git Flow** with the following branch structure:

```
main (production)
├── develop (integration)
├── feature/TICKET-123-agent-registry
├── feature/TICKET-124-a2a-protocol
├── hotfix/TICKET-125-critical-bug
└── release/v1.2.0
```

### Branch Naming Convention

```bash
feature/TICKET-123-short-description
bugfix/TICKET-124-short-description
hotfix/TICKET-125-short-description
release/v1.2.0
chore/update-dependencies
docs/api-documentation
```

### Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(agent-registry): add agent discovery endpoint

Implement new endpoint for discovering agents based on capabilities
and performance metrics. Includes filtering, sorting, and pagination.

Closes #123

fix(a2a-gateway): handle connection timeouts properly

Add proper timeout handling for A2A agent connections to prevent
hanging requests.

Fixes #124

docs(api): update agent registry API documentation

Add examples and improve descriptions for agent discovery endpoints.
```

### Development Workflow

```bash
# 1. Start new feature
git checkout develop
git pull origin develop
git checkout -b feature/TICKET-123-agent-discovery

# 2. Make changes and commit
git add .
git commit -m "feat(agent-registry): add discovery endpoint"

# 3. Push and create PR
git push origin feature/TICKET-123-agent-discovery
# Create PR via GitHub UI

# 4. After PR approval and merge
git checkout develop
git pull origin develop
git branch -d feature/TICKET-123-agent-discovery
```

## Testing Strategy

### Testing Pyramid

```
        /\
       /  \
      / E2E \     <- Few, expensive, slow
     /______\
    /        \
   / INTEGR.  \   <- Some, moderate cost
  /____________\
 /              \
/ UNIT TESTS     \ <- Many, cheap, fast
/________________\
```

### Unit Testing

#### Test File Structure

```
src/
├── services/
│   ├── AgentService.ts
│   └── __tests__/
│       └── AgentService.test.ts
├── components/
│   ├── AgentCard.tsx
│   └── __tests__/
│       └── AgentCard.test.tsx
```

#### Unit Test Examples

```typescript
// services/__tests__/AgentService.test.ts
describe('AgentService', () => {
  let service: AgentService;
  let mockRepository: jest.Mocked<Repository<Agent>>;
  let mockValidationService: jest.Mocked<ValidationService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AgentService,
        {
          provide: getRepositoryToken(Agent),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn()
          }
        },
        {
          provide: ValidationService,
          useValue: {
            validateCreateAgent: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<AgentService>(AgentService);
    mockRepository = module.get(getRepositoryToken(Agent));
    mockValidationService = module.get(ValidationService);
  });

  describe('createAgent', () => {
    it('should create agent successfully', async () => {
      // Arrange
      const createAgentDto: CreateAgentDto = {
        name: 'Test Agent',
        description: 'Test description',
        capabilities: ['text-analysis']
      };
      const userId = 'user-123';
      const expectedAgent = { id: 'agent-123', ...createAgentDto };

      mockValidationService.validateCreateAgent.mockResolvedValue();
      mockRepository.create.mockReturnValue(expectedAgent as Agent);
      mockRepository.save.mockResolvedValue(expectedAgent as Agent);

      // Act
      const result = await service.createAgent(createAgentDto, userId);

      // Assert
      expect(result).toEqual(expectedAgent);
      expect(mockValidationService.validateCreateAgent).toHaveBeenCalledWith(createAgentDto);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createAgentDto,
        ownerId: userId,
        status: AgentStatus.PENDING
      });
      expect(mockRepository.save).toHaveBeenCalledWith(expectedAgent);
    });

    it('should throw ValidationError for invalid input', async () => {
      // Arrange
      const createAgentDto: CreateAgentDto = {
        name: '',
        description: '',
        capabilities: []
      };
      const userId = 'user-123';

      mockValidationService.validateCreateAgent.mockRejectedValue(
        new ValidationError('Invalid input', [])
      );

      // Act & Assert
      await expect(service.createAgent(createAgentDto, userId))
        .rejects
        .toThrow(ValidationError);
    });
  });
});
```

### Integration Testing

```typescript
// tests/integration/agent-registry.test.ts
describe('Agent Registry Integration', () => {
  let app: INestApplication;
  let agentService: AgentService;
  let dataSource: DataSource;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = module.createNestApplication();
    await app.init();

    agentService = module.get<AgentService>(AgentService);
    dataSource = module.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    // Clean database before each test
    await dataSource.synchronize(true);
  });

  it('should create and retrieve agent', async () => {
    // Create agent
    const createDto: CreateAgentDto = {
      name: 'Integration Test Agent',
      description: 'Test agent for integration testing',
      capabilities: ['text-analysis', 'data-processing']
    };

    const createdAgent = await agentService.createAgent(createDto, 'user-123');
    expect(createdAgent.id).toBeDefined();

    // Retrieve agent
    const retrievedAgent = await agentService.findById(createdAgent.id);
    expect(retrievedAgent).toEqual(createdAgent);
  });

  it('should discover agents by capabilities', async () => {
    // Create multiple agents
    await agentService.createAgent({
      name: 'Text Agent',
      description: 'Text processing agent',
      capabilities: ['text-analysis']
    }, 'user-123');

    await agentService.createAgent({
      name: 'Data Agent',
      description: 'Data processing agent',
      capabilities: ['data-processing']
    }, 'user-123');

    // Discover agents
    const textAgents = await agentService.discoverAgents({
      capabilities: ['text-analysis']
    });

    expect(textAgents).toHaveLength(1);
    expect(textAgents[0].name).toBe('Text Agent');
  });
});
```

### E2E Testing

```typescript
// tests/e2e/agent-marketplace.e2e.ts
import { test, expect } from '@playwright/test';

test.describe('Agent Marketplace', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await page.goto('/login');
    await page.fill('[data-testid=email]', 'test@example.com');
    await page.fill('[data-testid=password]', 'password');
    await page.click('[data-testid=login-button]');
    await page.waitForURL('/dashboard');
  });

  test('should create new agent', async ({ page }) => {
    // Navigate to create agent page
    await page.click('[data-testid=create-agent-button]');
    await page.waitForURL('/agents/create');

    // Fill agent form
    await page.fill('[data-testid=agent-name]', 'E2E Test Agent');
    await page.fill('[data-testid=agent-description]', 'Agent created by E2E test');
    await page.fill('[data-testid=service-endpoint]', 'https://api.example.com/agent');
    
    // Select capabilities
    await page.click('[data-testid=capability-text-analysis]');
    await page.click('[data-testid=capability-data-processing]');

    // Submit form
    await page.click('[data-testid=submit-button]');

    // Verify success
    await expect(page.locator('[data-testid=success-message]')).toBeVisible();
    await expect(page.locator('[data-testid=agent-id]')).toBeVisible();
  });

  test('should discover and select agent', async ({ page }) => {
    // Navigate to marketplace
    await page.goto('/marketplace');

    // Search for agents
    await page.fill('[data-testid=search-input]', 'text analysis');
    await page.click('[data-testid=search-button]');

    // Verify results
    await expect(page.locator('[data-testid=agent-card]')).toHaveCount.greaterThan(0);

    // Select first agent
    await page.click('[data-testid=agent-card]').first();
    await page.waitForURL(/\/agents\/[a-zA-Z0-9-]+/);

    // Verify agent details page
    await expect(page.locator('[data-testid=agent-name]')).toBeVisible();
    await expect(page.locator('[data-testid=agent-description]')).toBeVisible();
    await expect(page.locator('[data-testid=agent-capabilities]')).toBeVisible();
  });
});
```

### Test Configuration

```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts']
};

// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ],
  webServer: {
    command: 'npm run start:test',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
});
```

## Code Review Process

### PR Template

```markdown
## Description
Brief description of the changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] This change requires a documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Additional Notes
Any additional information that reviewers should know.
```

### Review Guidelines

#### For Authors
1. **Self-review first**: Review your own code before requesting review
2. **Small PRs**: Keep PRs focused and under 400 lines when possible
3. **Clear description**: Explain what, why, and how
4. **Tests included**: Every PR should include appropriate tests
5. **Documentation updated**: Update docs if needed

#### For Reviewers
1. **Timely reviews**: Review within 24 hours during business days
2. **Constructive feedback**: Be specific and helpful
3. **Security focus**: Look for potential security issues
4. **Performance considerations**: Consider impact on performance
5. **Maintainability**: Ensure code is readable and maintainable

### Review Checklist

```markdown
## Code Quality
- [ ] Code is readable and well-structured
- [ ] Functions are small and focused
- [ ] Variable and function names are descriptive
- [ ] No code duplication
- [ ] Error handling is appropriate

## Security
- [ ] Input validation is present
- [ ] No sensitive data in logs
- [ ] Authentication/authorization checks
- [ ] SQL injection prevention
- [ ] XSS prevention

## Performance
- [ ] No obvious performance bottlenecks
- [ ] Database queries are optimized
- [ ] Caching is used appropriately
- [ ] Memory usage is reasonable

## Testing
- [ ] Unit tests cover new functionality
- [ ] Edge cases are tested
- [ ] Error scenarios are tested
- [ ] Tests are maintainable
```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '20'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type checking
        run: npm run type-check
      
      - name: Run unit tests
        run: npm run test:unit
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379
      
      - name: Build application
        run: npm run build
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}

  deploy-staging:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: staging
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to staging
        run: |
          echo "Deploying to staging environment"
          # Add deployment commands here

  deploy-production:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to production
        run: |
          echo "Deploying to production environment"
          # Add deployment commands here
```

### Quality Gates

```yaml
# .github/workflows/quality-gates.yml
name: Quality Gates

on:
  pull_request:
    branches: [main, develop]

jobs:
  quality-check:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
      
      - name: Check test coverage
        run: |
          npm run test:coverage
          npx nyc check-coverage --lines 80 --functions 80 --branches 80
      
      - name: Security audit
        run: npm audit --audit-level high
      
      - name: Check bundle size
        run: |
          npm run build
          npx bundlesize
```

## Deployment Guidelines

### Environment Configuration

#### Staging Environment
- **Purpose**: Integration testing, stakeholder review
- **Data**: Anonymized production-like data
- **Access**: Internal team + stakeholders
- **Deployment**: Automatic on develop branch merge

#### Production Environment
- **Purpose**: Live user traffic
- **Data**: Real production data
- **Access**: Restricted to production team
- **Deployment**: Manual approval required

### Deployment Process

```bash
# 1. Pre-deployment checklist
- [ ] All tests passing
- [ ] Security scan completed
- [ ] Performance testing completed
- [ ] Database migrations tested
- [ ] Rollback plan prepared
- [ ] Monitoring alerts configured

# 2. Deployment steps
kubectl apply -f k8s/production/
kubectl rollout status deployment/api-gateway
kubectl rollout status deployment/agent-registry

# 3. Post-deployment verification
curl -f https://api.marketplace.ai/health
kubectl get pods
kubectl logs deployment/api-gateway

# 4. Rollback if needed
kubectl rollout undo deployment/api-gateway
```

### Database Migrations

```typescript
// migrations/001_create_agents_table.ts
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateAgentsTable1234567890 implements MigrationInterface {
  name = 'CreateAgentsTable1234567890';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'agents',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()'
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()'
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()'
          }
        ],
        indices: [
          {
            name: 'IDX_AGENTS_NAME',
            columnNames: ['name']
          }
        ]
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('agents');
  }
}
```

## Monitoring and Debugging

### Application Monitoring

```typescript
// monitoring/metrics.ts
import { register, Counter, Histogram, Gauge } from 'prom-client';

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

export const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  labelNames: ['type']
});

// Middleware for metrics collection
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    
    httpRequestsTotal
      .labels(req.method, req.route?.path || req.path, res.statusCode.toString())
      .inc();
    
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path)
      .observe(duration);
  });
  
  next();
}
```

### Logging Standards

```typescript
// logging/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: process.env.SERVICE_NAME || 'marketplace-api'
  },
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default logger;

// Usage example
logger.info('Agent created', {
  agentId: 'agent-123',
  userId: 'user-456',
  duration: 150
});

logger.error('Failed to create agent', {
  error: error.message,
  stack: error.stack,
  agentData: sanitizedData
});
```

### Debug Configuration

```typescript
// debug/debug-config.ts
import debug from 'debug';

export const dbg = {
  app: debug('marketplace:app'),
  api: debug('marketplace:api'),
  db: debug('marketplace:db'),
  a2a: debug('marketplace:a2a'),
  mcp: debug('marketplace:mcp'),
  auth: debug('marketplace:auth'),
  cache: debug('marketplace:cache')
};

// Usage
dbg.api('Processing agent creation request', { userId, agentData });
dbg.db('Executing query', { query, params });
dbg.a2a('Delegating task to agent', { taskId, agentId });
```

## Security Guidelines

### Authentication & Authorization

```typescript
// auth/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.userService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid user');
    }
    return user;
  }
}

// auth/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some(role => user.roles?.includes(role));
  }
}
```

### Input Validation

```typescript
// validation/dto/create-agent.dto.ts
import { IsString, IsArray, IsUrl, IsOptional, Length, ArrayNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAgentDto {
  @IsString()
  @Length(1, 255)
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsString()
  @Length(10, 2000)
  @Transform(({ value }) => value?.trim())
  description: string;

  @IsUrl()
  serviceEndpoint: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  capabilities: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

// validation/validation.pipe.ts
@Injectable()
export class ValidationPipe implements PipeTransform {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      const messages = errors.map(error => 
        Object.values(error.constraints || {}).join(', ')
      );
      throw new BadRequestException(`Validation failed: ${messages.join('; ')}`);
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
```

### Security Headers

```typescript
// security/security.middleware.ts
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

export function setupSecurity(app: INestApplication) {
  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    }
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
  });

  app.use('/api/', limiter);

  // Stricter rate limiting for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many authentication attempts, please try again later.'
  });

  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
}
```

---

**Document Version**: 1.0  
**Last Updated**: [Current Date]  
**Next Review**: Monthly  
**Stakeholders**: Engineering Team, DevOps Team, QA Team