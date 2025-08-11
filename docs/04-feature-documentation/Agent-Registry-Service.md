# Agent Registry Service - Feature Documentation

## Overview

The Agent Registry Service is a core component of the Enterprise AI Agent Marketplace that manages the lifecycle of AI agents, provides dynamic discovery capabilities, and maintains metadata for all registered agents. It serves as the central directory for agent capabilities, performance metrics, and availability status.

## Core Functionality

### Key Features

1. **Agent Registration & Management**: Complete CRUD operations for agent lifecycle
2. **Dynamic Discovery**: Intelligent agent matching based on capabilities and requirements
3. **Performance Tracking**: Real-time monitoring of agent performance metrics
4. **Capability Indexing**: Efficient searching and filtering by agent capabilities
5. **Version Management**: Support for multiple versions of agents
6. **Health Monitoring**: Continuous monitoring of agent availability and status

## Technical Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────────┐
│                    Agent Registry Service                        │
├─────────────────────────────────────────────────────────────────┤
│  Registration API    │  Discovery Engine  │  Performance Monitor │
│  ┌─────────────────┐ │ ┌────────────────┐ │ ┌─────────────────┐  │
│  │ • Create Agent  │ │ │ • Capability   │ │ │ • Health Checks │  │
│  │ • Update Agent  │ │ │   Matching     │ │ │ • Metrics       │  │
│  │ • Delete Agent  │ │ │ • Performance  │ │ │   Collection    │  │
│  │ • Validate Card │ │ │   Ranking      │ │ │ • Status Update │  │
│  └─────────────────┘ │ │ • Filter Logic │ │ └─────────────────┘  │
│                      │ └────────────────┘ │                      │
├─────────────────────────────────────────────────────────────────┤
│                    Data Storage Layer                           │
│  ┌─────────────────┐ │ ┌────────────────┐ │ ┌─────────────────┐  │
│  │ Agent Metadata  │ │ │ Capability     │ │ │ Performance     │  │
│  │ Database        │ │ │ Index          │ │ │ Metrics         │  │
│  │ (PostgreSQL)    │ │ │ (Redis)        │ │ │ (TimeSeries)    │  │
│  └─────────────────┘ │ └────────────────┘ │ └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema

### Agent Table

```sql
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version VARCHAR(50) NOT NULL,
    owner_id UUID REFERENCES users(id),
    
    -- Agent Card Information
    agent_card JSONB NOT NULL,
    service_endpoint VARCHAR(500) NOT NULL,
    
    -- Status and Lifecycle
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'deprecated', 'suspended')),
    verification_status VARCHAR(50) DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'verified', 'rejected')),
    
    -- Capabilities
    capabilities JSONB NOT NULL,
    supported_modalities TEXT[] DEFAULT '{}',
    a2a_capabilities JSONB DEFAULT '{}',
    
    -- Performance Metrics
    performance_score DECIMAL(3,2) DEFAULT 0.00 CHECK (performance_score >= 0 AND performance_score <= 1),
    success_rate DECIMAL(5,4) DEFAULT 0.0000,
    avg_response_time_ms INTEGER DEFAULT 0,
    total_invocations BIGINT DEFAULT 0,
    
    -- Pricing and Business
    pricing_model VARCHAR(50) DEFAULT 'pay_per_use',
    base_price DECIMAL(10,4) DEFAULT 0.0000,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    category VARCHAR(100),
    license VARCHAR(100),
    documentation_url VARCHAR(500),
    source_code_url VARCHAR(500),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_active_at TIMESTAMP,
    verified_at TIMESTAMP,
    
    -- Indexes
    CONSTRAINT unique_agent_name_owner UNIQUE(name, owner_id, version)
);

-- Indexes for performance
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_capabilities ON agents USING GIN(capabilities);
CREATE INDEX idx_agents_modalities ON agents USING GIN(supported_modalities);
CREATE INDEX idx_agents_performance ON agents(performance_score DESC, success_rate DESC);
CREATE INDEX idx_agents_category ON agents(category);
CREATE INDEX idx_agents_owner ON agents(owner_id);
CREATE INDEX idx_agents_created_at ON agents(created_at DESC);
```

### Agent Capabilities Table

```sql
CREATE TABLE agent_capabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    capability_name VARCHAR(255) NOT NULL,
    capability_description TEXT,
    input_schema JSONB,
    output_schema JSONB,
    examples JSONB DEFAULT '[]',
    
    -- Performance metrics for this capability
    success_rate DECIMAL(5,4) DEFAULT 0.0000,
    avg_execution_time_ms INTEGER DEFAULT 0,
    total_uses BIGINT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_agent_capability UNIQUE(agent_id, capability_name)
);

CREATE INDEX idx_agent_capabilities_name ON agent_capabilities(capability_name);
CREATE INDEX idx_agent_capabilities_agent ON agent_capabilities(agent_id);
```

### Agent Reviews Table

```sql
CREATE TABLE agent_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    performance_rating INTEGER CHECK (performance_rating >= 1 AND performance_rating <= 5),
    reliability_rating INTEGER CHECK (reliability_rating >= 1 AND reliability_rating <= 5),
    ease_of_use_rating INTEGER CHECK (ease_of_use_rating >= 1 AND ease_of_use_rating <= 5),
    
    -- Metadata
    helpful_votes INTEGER DEFAULT 0,
    verified_purchase BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_user_agent_review UNIQUE(agent_id, user_id)
);

CREATE INDEX idx_agent_reviews_agent ON agent_reviews(agent_id);
CREATE INDEX idx_agent_reviews_rating ON agent_reviews(rating DESC);
CREATE INDEX idx_agent_reviews_created ON agent_reviews(created_at DESC);
```

## API Specification

### REST API Endpoints

#### Agent Management

```typescript
// POST /api/v1/agents - Register a new agent
interface CreateAgentRequest {
  name: string;
  description: string;
  version: string;
  agentCard: AgentCard;
  serviceEndpoint: string;
  capabilities: AgentCapability[];
  supportedModalities: string[];
  a2aCapabilities: A2ACapability;
  category?: string;
  tags?: string[];
  pricingModel?: 'free' | 'pay_per_use' | 'subscription';
  basePrice?: number;
  currency?: string;
  license?: string;
  documentationUrl?: string;
  sourceCodeUrl?: string;
}

interface CreateAgentResponse {
  id: string;
  status: 'pending' | 'active';
  verificationRequired: boolean;
  estimatedVerificationTime: string;
}

// GET /api/v1/agents/{id} - Get agent details
interface GetAgentResponse {
  id: string;
  name: string;
  description: string;
  version: string;
  owner: {
    id: string;
    name: string;
    verified: boolean;
  };
  agentCard: AgentCard;
  serviceEndpoint: string;
  status: AgentStatus;
  verificationStatus: VerificationStatus;
  capabilities: AgentCapability[];
  supportedModalities: string[];
  a2aCapabilities: A2ACapability;
  performanceMetrics: {
    score: number;
    successRate: number;
    avgResponseTime: number;
    totalInvocations: number;
  };
  pricing: {
    model: string;
    basePrice: number;
    currency: string;
  };
  reviews: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<string, number>;
  };
  metadata: {
    category: string;
    tags: string[];
    license: string;
    documentationUrl?: string;
    sourceCodeUrl?: string;
  };
  timestamps: {
    createdAt: string;
    updatedAt: string;
    lastActiveAt?: string;
    verifiedAt?: string;
  };
}

// PUT /api/v1/agents/{id} - Update agent
interface UpdateAgentRequest {
  description?: string;
  agentCard?: Partial<AgentCard>;
  capabilities?: AgentCapability[];
  supportedModalities?: string[];
  a2aCapabilities?: Partial<A2ACapability>;
  category?: string;
  tags?: string[];
  pricingModel?: string;
  basePrice?: number;
  documentationUrl?: string;
  sourceCodeUrl?: string;
}

// DELETE /api/v1/agents/{id} - Delete agent
interface DeleteAgentResponse {
  success: boolean;
  message: string;
  gracePeriod?: string; // Time before permanent deletion
}
```

#### Agent Discovery

```typescript
// GET /api/v1/agents/discover - Discover agents
interface DiscoverAgentsRequest {
  capabilities?: string[];
  modalities?: string[];
  category?: string;
  tags?: string[];
  minPerformanceScore?: number;
  minSuccessRate?: number;
  maxResponseTime?: number;
  pricingModel?: string[];
  maxPrice?: number;
  verified?: boolean;
  sortBy?: 'performance' | 'rating' | 'popularity' | 'price' | 'newest';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

interface DiscoverAgentsResponse {
  agents: AgentSummary[];
  totalCount: number;
  filters: {
    availableCapabilities: string[];
    availableModalities: string[];
    availableCategories: string[];
    priceRange: { min: number; max: number };
    performanceRange: { min: number; max: number };
  };
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface AgentSummary {
  id: string;
  name: string;
  description: string;
  version: string;
  owner: {
    id: string;
    name: string;
    verified: boolean;
  };
  capabilities: string[];
  supportedModalities: string[];
  performanceMetrics: {
    score: number;
    successRate: number;
    avgResponseTime: number;
  };
  pricing: {
    model: string;
    basePrice: number;
    currency: string;
  };
  reviews: {
    averageRating: number;
    totalReviews: number;
  };
  metadata: {
    category: string;
    tags: string[];
    verified: boolean;
  };
}

// POST /api/v1/agents/search - Advanced search
interface SearchAgentsRequest {
  query?: string; // Full-text search
  filters: {
    capabilities?: string[];
    modalities?: string[];
    category?: string[];
    tags?: string[];
    performanceScore?: { min?: number; max?: number };
    successRate?: { min?: number; max?: number };
    responseTime?: { min?: number; max?: number };
    price?: { min?: number; max?: number };
    rating?: { min?: number; max?: number };
    verified?: boolean;
    status?: string[];
  };
  sort: {
    field: string;
    order: 'asc' | 'desc';
  }[];
  pagination: {
    limit: number;
    offset: number;
  };
}
```

#### Performance Monitoring

```typescript
// GET /api/v1/agents/{id}/metrics - Get agent performance metrics
interface GetAgentMetricsResponse {
  agentId: string;
  timeRange: {
    start: string;
    end: string;
  };
  metrics: {
    invocations: {
      total: number;
      successful: number;
      failed: number;
      successRate: number;
    };
    performance: {
      avgResponseTime: number;
      p50ResponseTime: number;
      p95ResponseTime: number;
      p99ResponseTime: number;
    };
    availability: {
      uptime: number;
      downtime: number;
      uptimePercentage: number;
    };
    errors: {
      total: number;
      byType: Record<string, number>;
      errorRate: number;
    };
  };
  timeSeries: {
    timestamp: string;
    invocations: number;
    successRate: number;
    responseTime: number;
    errorCount: number;
  }[];
}

// POST /api/v1/agents/{id}/health-check - Trigger health check
interface HealthCheckResponse {
  agentId: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  timestamp: string;
  details: {
    endpoint: string;
    httpStatus: number;
    errorMessage?: string;
  };
}
```

## Core Service Implementation

### Agent Registry Service

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Agent, AgentCapability, AgentReview } from './entities';

@Injectable()
export class AgentRegistryService {
  constructor(
    @InjectRepository(Agent)
    private agentRepository: Repository<Agent>,
    @InjectRepository(AgentCapability)
    private capabilityRepository: Repository<AgentCapability>,
    @InjectRepository(AgentReview)
    private reviewRepository: Repository<AgentReview>,
    private performanceService: PerformanceMonitoringService,
    private discoveryService: AgentDiscoveryService,
    private validationService: AgentValidationService
  ) {}

  async createAgent(createAgentDto: CreateAgentRequest, ownerId: string): Promise<CreateAgentResponse> {
    // Validate agent card
    const validation = await this.validationService.validateAgentCard(createAgentDto.agentCard);
    if (!validation.valid) {
      throw new BadRequestException(`Invalid agent card: ${validation.errors.join(', ')}`);
    }

    // Check endpoint availability
    const endpointCheck = await this.validationService.checkEndpoint(createAgentDto.serviceEndpoint);
    if (!endpointCheck.available) {
      throw new BadRequestException(`Service endpoint is not accessible: ${endpointCheck.error}`);
    }

    // Create agent entity
    const agent = this.agentRepository.create({
      ...createAgentDto,
      ownerId,
      status: 'pending',
      verificationStatus: 'unverified',
      performanceScore: 0,
      successRate: 0,
      avgResponseTimeMs: 0,
      totalInvocations: 0
    });

    const savedAgent = await this.agentRepository.save(agent);

    // Create capability entries
    for (const capability of createAgentDto.capabilities) {
      const capabilityEntity = this.capabilityRepository.create({
        agentId: savedAgent.id,
        capabilityName: capability.name,
        capabilityDescription: capability.description,
        inputSchema: capability.inputSchema,
        outputSchema: capability.outputSchema,
        examples: capability.examples || []
      });
      await this.capabilityRepository.save(capabilityEntity);
    }

    // Index for discovery
    await this.discoveryService.indexAgent(savedAgent);

    // Schedule verification if required
    const verificationRequired = await this.shouldRequireVerification(savedAgent);
    if (verificationRequired) {
      await this.scheduleVerification(savedAgent.id);
    } else {
      await this.activateAgent(savedAgent.id);
    }

    return {
      id: savedAgent.id,
      status: savedAgent.status,
      verificationRequired,
      estimatedVerificationTime: verificationRequired ? '24-48 hours' : '0 minutes'
    };
  }

  async getAgent(id: string): Promise<GetAgentResponse> {
    const agent = await this.agentRepository.findOne({
      where: { id },
      relations: ['owner', 'capabilities', 'reviews']
    });

    if (!agent) {
      throw new NotFoundException(`Agent with ID ${id} not found`);
    }

    // Get performance metrics
    const performanceMetrics = await this.performanceService.getAgentMetrics(id);

    // Get review statistics
    const reviewStats = await this.getReviewStatistics(id);

    return {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      version: agent.version,
      owner: {
        id: agent.owner.id,
        name: agent.owner.name,
        verified: agent.owner.verified
      },
      agentCard: agent.agentCard,
      serviceEndpoint: agent.serviceEndpoint,
      status: agent.status,
      verificationStatus: agent.verificationStatus,
      capabilities: agent.capabilities.map(cap => ({
        name: cap.capabilityName,
        description: cap.capabilityDescription,
        inputSchema: cap.inputSchema,
        outputSchema: cap.outputSchema,
        examples: cap.examples
      })),
      supportedModalities: agent.supportedModalities,
      a2aCapabilities: agent.a2aCapabilities,
      performanceMetrics: {
        score: agent.performanceScore,
        successRate: agent.successRate,
        avgResponseTime: agent.avgResponseTimeMs,
        totalInvocations: agent.totalInvocations
      },
      pricing: {
        model: agent.pricingModel,
        basePrice: agent.basePrice,
        currency: agent.currency
      },
      reviews: reviewStats,
      metadata: {
        category: agent.category,
        tags: agent.tags,
        license: agent.license,
        documentationUrl: agent.documentationUrl,
        sourceCodeUrl: agent.sourceCodeUrl
      },
      timestamps: {
        createdAt: agent.createdAt.toISOString(),
        updatedAt: agent.updatedAt.toISOString(),
        lastActiveAt: agent.lastActiveAt?.toISOString(),
        verifiedAt: agent.verifiedAt?.toISOString()
      }
    };
  }

  async updateAgent(id: string, updateDto: UpdateAgentRequest, ownerId: string): Promise<void> {
    const agent = await this.agentRepository.findOne({
      where: { id, ownerId }
    });

    if (!agent) {
      throw new NotFoundException(`Agent with ID ${id} not found or not owned by user`);
    }

    // Validate updates
    if (updateDto.agentCard) {
      const validation = await this.validationService.validateAgentCard({
        ...agent.agentCard,
        ...updateDto.agentCard
      });
      if (!validation.valid) {
        throw new BadRequestException(`Invalid agent card update: ${validation.errors.join(', ')}`);
      }
    }

    // Update agent
    await this.agentRepository.update(id, {
      ...updateDto,
      updatedAt: new Date()
    });

    // Update capabilities if provided
    if (updateDto.capabilities) {
      await this.capabilityRepository.delete({ agentId: id });
      
      for (const capability of updateDto.capabilities) {
        const capabilityEntity = this.capabilityRepository.create({
          agentId: id,
          capabilityName: capability.name,
          capabilityDescription: capability.description,
          inputSchema: capability.inputSchema,
          outputSchema: capability.outputSchema,
          examples: capability.examples || []
        });
        await this.capabilityRepository.save(capabilityEntity);
      }
    }

    // Re-index for discovery
    const updatedAgent = await this.agentRepository.findOne({ where: { id } });
    await this.discoveryService.reindexAgent(updatedAgent);
  }

  async deleteAgent(id: string, ownerId: string): Promise<DeleteAgentResponse> {
    const agent = await this.agentRepository.findOne({
      where: { id, ownerId }
    });

    if (!agent) {
      throw new NotFoundException(`Agent with ID ${id} not found or not owned by user`);
    }

    // Check if agent has active tasks
    const activeTasks = await this.performanceService.getActiveTaskCount(id);
    if (activeTasks > 0) {
      // Soft delete with grace period
      await this.agentRepository.update(id, {
        status: 'deprecated',
        updatedAt: new Date()
      });

      return {
        success: true,
        message: 'Agent marked for deletion. Will be permanently deleted after all active tasks complete.',
        gracePeriod: '7 days'
      };
    }

    // Hard delete
    await this.discoveryService.removeFromIndex(id);
    await this.agentRepository.delete(id);

    return {
      success: true,
      message: 'Agent permanently deleted'
    };
  }

  private async shouldRequireVerification(agent: Agent): Promise<boolean> {
    // Verification required for:
    // - Agents with network access capabilities
    // - Agents with file system access
    // - Agents with database access
    // - Commercial agents (non-free pricing)
    
    const networkCapabilities = ['http_request', 'api_call', 'web_scraping'];
    const fileCapabilities = ['file_read', 'file_write', 'file_operations'];
    const dbCapabilities = ['database_query', 'sql_execution'];
    
    const hasNetworkAccess = agent.capabilities.some(cap => 
      networkCapabilities.includes(cap.capabilityName)
    );
    
    const hasFileAccess = agent.capabilities.some(cap => 
      fileCapabilities.includes(cap.capabilityName)
    );
    
    const hasDbAccess = agent.capabilities.some(cap => 
      dbCapabilities.includes(cap.capabilityName)
    );
    
    const isCommercial = agent.pricingModel !== 'free';
    
    return hasNetworkAccess || hasFileAccess || hasDbAccess || isCommercial;
  }

  private async getReviewStatistics(agentId: string): Promise<any> {
    const reviews = await this.reviewRepository.find({ where: { agentId } });
    
    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
      };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    
    const ratingDistribution = reviews.reduce((dist, review) => {
      dist[review.rating.toString()] = (dist[review.rating.toString()] || 0) + 1;
      return dist;
    }, {} as Record<string, number>);

    return {
      averageRating: Math.round(averageRating * 100) / 100,
      totalReviews: reviews.length,
      ratingDistribution
    };
  }
}
```

### Agent Discovery Service

```typescript
@Injectable()
export class AgentDiscoveryService {
  constructor(
    @InjectRepository(Agent)
    private agentRepository: Repository<Agent>,
    @InjectRedis() private redis: Redis,
    private performanceService: PerformanceMonitoringService
  ) {}

  async discoverAgents(criteria: DiscoverAgentsRequest): Promise<DiscoverAgentsResponse> {
    let query = this.agentRepository.createQueryBuilder('agent')
      .leftJoinAndSelect('agent.owner', 'owner')
      .leftJoinAndSelect('agent.capabilities', 'capabilities')
      .where('agent.status = :status', { status: 'active' });

    // Apply filters
    query = this.applyFilters(query, criteria);

    // Apply sorting
    query = this.applySorting(query, criteria);

    // Apply pagination
    const limit = Math.min(criteria.limit || 20, 100);
    const offset = criteria.offset || 0;
    query = query.skip(offset).take(limit);

    const [agents, totalCount] = await query.getManyAndCount();

    // Get additional metadata
    const filters = await this.getAvailableFilters();

    return {
      agents: agents.map(agent => this.mapToAgentSummary(agent)),
      totalCount,
      filters,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    };
  }

  async searchAgents(searchRequest: SearchAgentsRequest): Promise<DiscoverAgentsResponse> {
    let query = this.agentRepository.createQueryBuilder('agent')
      .leftJoinAndSelect('agent.owner', 'owner')
      .leftJoinAndSelect('agent.capabilities', 'capabilities')
      .where('agent.status = :status', { status: 'active' });

    // Full-text search
    if (searchRequest.query) {
      query = query.andWhere(
        '(agent.name ILIKE :query OR agent.description ILIKE :query OR EXISTS (SELECT 1 FROM agent_capabilities ac WHERE ac.agent_id = agent.id AND ac.capability_name ILIKE :query))',
        { query: `%${searchRequest.query}%` }
      );
    }

    // Apply filters
    query = this.applyAdvancedFilters(query, searchRequest.filters);

    // Apply sorting
    for (const sort of searchRequest.sort) {
      query = query.addOrderBy(`agent.${sort.field}`, sort.order.toUpperCase() as 'ASC' | 'DESC');
    }

    // Apply pagination
    const { limit, offset } = searchRequest.pagination;
    query = query.skip(offset).take(Math.min(limit, 100));

    const [agents, totalCount] = await query.getManyAndCount();

    return {
      agents: agents.map(agent => this.mapToAgentSummary(agent)),
      totalCount,
      filters: await this.getAvailableFilters(),
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    };
  }

  async indexAgent(agent: Agent): Promise<void> {
    // Index capabilities for fast lookup
    for (const capability of agent.capabilities) {
      await this.redis.sadd(`capability:${capability.capabilityName}`, agent.id);
    }

    // Index modalities
    for (const modality of agent.supportedModalities) {
      await this.redis.sadd(`modality:${modality}`, agent.id);
    }

    // Index category
    if (agent.category) {
      await this.redis.sadd(`category:${agent.category}`, agent.id);
    }

    // Index tags
    for (const tag of agent.tags) {
      await this.redis.sadd(`tag:${tag}`, agent.id);
    }

    // Cache agent summary
    const summary = this.mapToAgentSummary(agent);
    await this.redis.setex(`agent:${agent.id}`, 3600, JSON.stringify(summary));
  }

  private applyFilters(query: SelectQueryBuilder<Agent>, criteria: DiscoverAgentsRequest): SelectQueryBuilder<Agent> {
    if (criteria.capabilities?.length) {
      query = query.andWhere(
        'EXISTS (SELECT 1 FROM agent_capabilities ac WHERE ac.agent_id = agent.id AND ac.capability_name IN (:...capabilities))',
        { capabilities: criteria.capabilities }
      );
    }

    if (criteria.modalities?.length) {
      query = query.andWhere('agent.supported_modalities && :modalities', { modalities: criteria.modalities });
    }

    if (criteria.category) {
      query = query.andWhere('agent.category = :category', { category: criteria.category });
    }

    if (criteria.tags?.length) {
      query = query.andWhere('agent.tags && :tags', { tags: criteria.tags });
    }

    if (criteria.minPerformanceScore !== undefined) {
      query = query.andWhere('agent.performance_score >= :minScore', { minScore: criteria.minPerformanceScore });
    }

    if (criteria.minSuccessRate !== undefined) {
      query = query.andWhere('agent.success_rate >= :minSuccessRate', { minSuccessRate: criteria.minSuccessRate });
    }

    if (criteria.maxResponseTime !== undefined) {
      query = query.andWhere('agent.avg_response_time_ms <= :maxResponseTime', { maxResponseTime: criteria.maxResponseTime });
    }

    if (criteria.pricingModel?.length) {
      query = query.andWhere('agent.pricing_model IN (:...pricingModels)', { pricingModels: criteria.pricingModel });
    }

    if (criteria.maxPrice !== undefined) {
      query = query.andWhere('agent.base_price <= :maxPrice', { maxPrice: criteria.maxPrice });
    }

    if (criteria.verified !== undefined) {
      query = query.andWhere('agent.verification_status = :verificationStatus', {
        verificationStatus: criteria.verified ? 'verified' : 'unverified'
      });
    }

    return query;
  }

  private applySorting(query: SelectQueryBuilder<Agent>, criteria: DiscoverAgentsRequest): SelectQueryBuilder<Agent> {
    const sortBy = criteria.sortBy || 'performance';
    const sortOrder = criteria.sortOrder || 'desc';

    switch (sortBy) {
      case 'performance':
        query = query.orderBy('agent.performance_score', sortOrder.toUpperCase() as 'ASC' | 'DESC');
        break;
      case 'rating':
        // This would require a subquery to calculate average rating
        query = query.orderBy('(SELECT AVG(rating) FROM agent_reviews WHERE agent_id = agent.id)', sortOrder.toUpperCase() as 'ASC' | 'DESC');
        break;
      case 'popularity':
        query = query.orderBy('agent.total_invocations', sortOrder.toUpperCase() as 'ASC' | 'DESC');
        break;
      case 'price':
        query = query.orderBy('agent.base_price', sortOrder.toUpperCase() as 'ASC' | 'DESC');
        break;
      case 'newest':
        query = query.orderBy('agent.created_at', sortOrder.toUpperCase() as 'ASC' | 'DESC');
        break;
      default:
        query = query.orderBy('agent.performance_score', 'DESC');
    }

    return query;
  }

  private mapToAgentSummary(agent: Agent): AgentSummary {
    return {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      version: agent.version,
      owner: {
        id: agent.owner.id,
        name: agent.owner.name,
        verified: agent.owner.verified
      },
      capabilities: agent.capabilities.map(cap => cap.capabilityName),
      supportedModalities: agent.supportedModalities,
      performanceMetrics: {
        score: agent.performanceScore,
        successRate: agent.successRate,
        avgResponseTime: agent.avgResponseTimeMs
      },
      pricing: {
        model: agent.pricingModel,
        basePrice: agent.basePrice,
        currency: agent.currency
      },
      reviews: {
        averageRating: 0, // Would be calculated from reviews
        totalReviews: 0
      },
      metadata: {
        category: agent.category,
        tags: agent.tags,
        verified: agent.verificationStatus === 'verified'
      }
    };
  }
}
```

## Testing Strategy

### Unit Tests

```typescript
describe('AgentRegistryService', () => {
  let service: AgentRegistryService;
  let agentRepository: Repository<Agent>;
  let validationService: AgentValidationService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AgentRegistryService,
        {
          provide: getRepositoryToken(Agent),
          useClass: Repository
        },
        {
          provide: AgentValidationService,
          useValue: {
            validateAgentCard: jest.fn(),
            checkEndpoint: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<AgentRegistryService>(AgentRegistryService);
    agentRepository = module.get<Repository<Agent>>(getRepositoryToken(Agent));
    validationService = module.get<AgentValidationService>(AgentValidationService);
  });

  describe('createAgent', () => {
    it('should create a valid agent', async () => {
      const createAgentDto = {
        name: 'Test Agent',
        description: 'A test agent',
        version: '1.0.0',
        agentCard: mockAgentCard,
        serviceEndpoint: 'https://api.example.com/agent',
        capabilities: [mockCapability],
        supportedModalities: ['text'],
        a2aCapabilities: mockA2ACapabilities
      };

      jest.spyOn(validationService, 'validateAgentCard').mockResolvedValue({ valid: true, errors: [] });
      jest.spyOn(validationService, 'checkEndpoint').mockResolvedValue({ available: true });
      jest.spyOn(agentRepository, 'create').mockReturnValue(mockAgent);
      jest.spyOn(agentRepository, 'save').mockResolvedValue(mockAgent);

      const result = await service.createAgent(createAgentDto, 'owner-123');

      expect(result.id).toBe(mockAgent.id);
      expect(result.status).toBe('pending');
      expect(validationService.validateAgentCard).toHaveBeenCalledWith(createAgentDto.agentCard);
      expect(validationService.checkEndpoint).toHaveBeenCalledWith(createAgentDto.serviceEndpoint);
    });

    it('should reject invalid agent card', async () => {
      const createAgentDto = { /* invalid data */ };

      jest.spyOn(validationService, 'validateAgentCard').mockResolvedValue({ 
        valid: false, 
        errors: ['Missing required field: name'] 
      });

      await expect(service.createAgent(createAgentDto, 'owner-123')).rejects.toThrow('Invalid agent card');
    });
  });
});
```

### Integration Tests

```typescript
describe('Agent Registry Integration', () => {
  let app: INestApplication;
  let agentService: AgentRegistryService;
  let testAgent: Agent;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = module.createNestApplication();
    await app.init();

    agentService = module.get<AgentRegistryService>(AgentRegistryService);
  });

  afterEach(async () => {
    await app.close();
  });

  it('should complete agent lifecycle', async () => {
    // Create agent
    const createResponse = await agentService.createAgent(mockCreateRequest, 'test-owner');
    expect(createResponse.id).toBeDefined();

    // Get agent
    const agent = await agentService.getAgent(createResponse.id);
    expect(agent.name).toBe(mockCreateRequest.name);

    // Update agent
    await agentService.updateAgent(createResponse.id, { description: 'Updated description' }, 'test-owner');
    
    const updatedAgent = await agentService.getAgent(createResponse.id);
    expect(updatedAgent.description).toBe('Updated description');

    // Delete agent
    const deleteResponse = await agentService.deleteAgent(createResponse.id, 'test-owner');
    expect(deleteResponse.success).toBe(true);
  });

  it('should discover agents by capabilities', async () => {
    // Create test agents
    await createTestAgents();

    const discoveryResult = await agentService.discoverAgents({
      capabilities: ['text-analysis'],
      limit: 10
    });

    expect(discoveryResult.agents.length).toBeGreaterThan(0);
    expect(discoveryResult.agents.every(agent => 
      agent.capabilities.includes('text-analysis')
    )).toBe(true);
  });
});
```

## Performance Considerations

### Indexing Strategy

1. **Database Indexes**: Optimize for common query patterns
2. **Redis Caching**: Cache frequently accessed agent data
3. **Search Indexing**: Use Elasticsearch for full-text search
4. **Performance Metrics**: Time-series database for metrics

### Scalability

1. **Horizontal Scaling**: Stateless service design
2. **Database Sharding**: Partition by agent category or owner
3. **Caching Layers**: Multi-level caching strategy
4. **Async Processing**: Background tasks for indexing and metrics

## Security Considerations

1. **Input Validation**: Strict validation of all inputs
2. **Authorization**: Owner-based access control
3. **Rate Limiting**: Prevent abuse of discovery APIs
4. **Audit Logging**: Track all agent lifecycle events

---

**Document Version**: 1.0  
**Last Updated**: [Current Date]  
**Next Review**: Monthly  
**Stakeholders**: Engineering Team, Product Team, QA Team