# Model Context Protocol (MCP) Integration Guide

## Overview

This document provides comprehensive guidance for integrating the Model Context Protocol (MCP) into the Enterprise AI Agent Marketplace. MCP standardizes how AI models and agents connect with external tools and data sources, enabling secure, private, and personalized tool access for each user in our multi-tenant environment.

## MCP Protocol Fundamentals

### Core Concepts

The MCP protocol is built on several key architectural components:

1. **MCP Server**: Provides tools and resources to AI applications
2. **MCP Client**: AI applications that connect to MCP servers to access tools
3. **Tools**: Functions that can be called by AI models to perform specific tasks
4. **Resources**: Data sources that can be read by AI models
5. **Prompts**: Reusable prompt templates that can be invoked by name

### Communication Architecture

```
┌─────────────────┐    JSON-RPC    ┌─────────────────┐
│   MCP Client    │◄──────────────►│   MCP Server    │
│   (AI Agent)    │   over stdio    │   (Tools)       │
│                 │   or transport  │                 │
│ • Tool Calls    │                 │ • Tool Registry │
│ • Resource Req. │                 │ • Resource Mgmt │
│ • Prompt Invoc. │                 │ • Prompt Store  │
└─────────────────┘                 └─────────────────┘
```

## Multi-Tenant MCP Architecture

### High-Level Design

Our implementation uses a multi-tenant architecture where each user has their own logical MCP server instance while sharing underlying infrastructure for efficiency.

```
┌─────────────────────────────────────────────────────────────────┐
│                    MCP Gateway Service                          │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│ │   User A    │ │   User B    │ │   User C    │ │   User D    │ │
│ │ MCP Context │ │ MCP Context │ │ MCP Context │ │ MCP Context │ │
│ │             │ │             │ │             │ │             │ │
│ │ • Tools     │ │ • Tools     │ │ • Tools     │ │ • Tools     │ │
│ │ • Resources │ │ • Resources │ │ • Resources │ │ • Resources │ │
│ │ • Prompts   │ │ • Prompts   │ │ • Prompts   │ │ • Prompts   │ │
│ │ • Auth      │ │ • Auth      │ │ • Auth      │ │ • Auth      │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │   Shared Resources    │
                    │                       │
                    │ • Database Pool       │
                    │ • File System         │
                    │ • External APIs       │
                    │ • Caching Layer       │
                    │ • Monitoring          │
                    └───────────────────────┘
```

## Core Implementation

### 1. MCP Server Manager

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

class MCPServerManager {
  private userContexts: Map<string, UserMCPContext> = new Map();
  private toolRegistry: ToolRegistry;
  private resourceManager: ResourceManager;
  
  constructor() {
    this.toolRegistry = new ToolRegistry();
    this.resourceManager = new ResourceManager();
  }
  
  async createUserMCPServer(userId: string): Promise<UserMCPContext> {
    if (this.userContexts.has(userId)) {
      return this.userContexts.get(userId)!;
    }
    
    const context = new UserMCPContext(userId, this.toolRegistry, this.resourceManager);
    await context.initialize();
    
    this.userContexts.set(userId, context);
    return context;
  }
  
  async getUserMCPServer(userId: string): Promise<UserMCPContext | null> {
    return this.userContexts.get(userId) || null;
  }
  
  async removeUserMCPServer(userId: string): Promise<void> {
    const context = this.userContexts.get(userId);
    if (context) {
      await context.cleanup();
      this.userContexts.delete(userId);
    }
  }
}

class UserMCPContext {
  private server: Server;
  private transport: StdioServerTransport;
  private userTools: Map<string, Tool> = new Map();
  private userResources: Map<string, Resource> = new Map();
  private userPrompts: Map<string, Prompt> = new Map();
  
  constructor(
    private userId: string,
    private toolRegistry: ToolRegistry,
    private resourceManager: ResourceManager
  ) {
    this.server = new Server({
      name: `marketplace-mcp-server-${userId}`,
      version: '1.0.0',
    }, {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
        logging: {}
      }
    });
    
    this.setupHandlers();
  }
  
  private setupHandlers(): void {
    // Tool handling
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: Array.from(this.userTools.values()).map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema
        }))
      };
    });
    
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const tool = this.userTools.get(name);
      
      if (!tool) {
        throw new Error(`Tool '${name}' not found`);
      }
      
      // Check permissions
      const hasPermission = await this.checkToolPermission(tool.name);
      if (!hasPermission) {
        throw new Error(`Access denied to tool '${name}'`);
      }
      
      // Execute tool with user context
      return await this.executeTool(tool, args);
    });
    
    // Resource handling
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: Array.from(this.userResources.values()).map(resource => ({
          uri: resource.uri,
          name: resource.name,
          description: resource.description,
          mimeType: resource.mimeType
        }))
      };
    });
    
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      const resource = this.userResources.get(uri);
      
      if (!resource) {
        throw new Error(`Resource '${uri}' not found`);
      }
      
      // Check permissions
      const hasPermission = await this.checkResourcePermission(resource.uri);
      if (!hasPermission) {
        throw new Error(`Access denied to resource '${uri}'`);
      }
      
      return await this.readResource(resource);
    });
  }
  
  async initialize(): Promise<void> {
    // Load user-specific tools, resources, and prompts
    await this.loadUserTools();
    await this.loadUserResources();
    await this.loadUserPrompts();
    
    // Start the MCP server
    this.transport = new StdioServerTransport();
    await this.server.connect(this.transport);
  }
  
  private async loadUserTools(): Promise<void> {
    const userToolConfigs = await this.toolRegistry.getUserTools(this.userId);
    
    for (const config of userToolConfigs) {
      const tool = await this.createTool(config);
      this.userTools.set(tool.name, tool);
    }
  }
  
  private async executeTool(tool: Tool, args: any): Promise<any> {
    try {
      // Add user context to tool execution
      const context = {
        userId: this.userId,
        timestamp: new Date().toISOString(),
        sessionId: this.generateSessionId()
      };
      
      const result = await tool.execute(args, context);
      
      // Log tool usage for monitoring
      await this.logToolUsage(tool.name, args, result, true);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      // Log error for monitoring
      await this.logToolUsage(tool.name, args, error, false);
      throw error;
    }
  }
}
```

### 2. Tool Registry Implementation

```typescript
interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  handler: ToolHandler;
  permissions: ToolPermission[];
  category: string;
  version: string;
  metadata: Record<string, any>;
}

interface ToolPermission {
  action: string;
  resource: string;
  conditions?: Record<string, any>;
}

class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();
  private userToolMappings: Map<string, Set<string>> = new Map();
  
  async registerTool(userId: string, toolDef: ToolDefinition): Promise<void> {
    // Validate tool definition
    const validation = await this.validateToolDefinition(toolDef);
    if (!validation.valid) {
      throw new Error(`Invalid tool definition: ${validation.errors.join(', ')}`);
    }
    
    // Create unique tool key for user
    const toolKey = `${userId}:${toolDef.name}`;
    this.tools.set(toolKey, toolDef);
    
    // Update user mappings
    if (!this.userToolMappings.has(userId)) {
      this.userToolMappings.set(userId, new Set());
    }
    this.userToolMappings.get(userId)!.add(toolKey);
    
    // Persist to database
    await this.persistToolDefinition(userId, toolDef);
  }
  
  async getUserTools(userId: string): Promise<ToolDefinition[]> {
    const userToolKeys = this.userToolMappings.get(userId) || new Set();
    const tools: ToolDefinition[] = [];
    
    for (const toolKey of userToolKeys) {
      const tool = this.tools.get(toolKey);
      if (tool) {
        tools.push(tool);
      }
    }
    
    return tools;
  }
  
  async updateTool(userId: string, toolName: string, updates: Partial<ToolDefinition>): Promise<void> {
    const toolKey = `${userId}:${toolName}`;
    const existingTool = this.tools.get(toolKey);
    
    if (!existingTool) {
      throw new Error(`Tool '${toolName}' not found for user '${userId}'`);
    }
    
    const updatedTool = { ...existingTool, ...updates };
    
    // Validate updated tool
    const validation = await this.validateToolDefinition(updatedTool);
    if (!validation.valid) {
      throw new Error(`Invalid tool update: ${validation.errors.join(', ')}`);
    }
    
    this.tools.set(toolKey, updatedTool);
    await this.persistToolDefinition(userId, updatedTool);
  }
  
  async removeTool(userId: string, toolName: string): Promise<void> {
    const toolKey = `${userId}:${toolName}`;
    this.tools.delete(toolKey);
    
    const userTools = this.userToolMappings.get(userId);
    if (userTools) {
      userTools.delete(toolKey);
    }
    
    await this.removePersistedTool(userId, toolName);
  }
  
  private async validateToolDefinition(toolDef: ToolDefinition): Promise<ValidationResult> {
    const errors: string[] = [];
    
    // Basic validation
    if (!toolDef.name || toolDef.name.trim() === '') {
      errors.push('Tool name is required');
    }
    
    if (!toolDef.description || toolDef.description.trim() === '') {
      errors.push('Tool description is required');
    }
    
    if (!toolDef.handler || typeof toolDef.handler !== 'function') {
      errors.push('Tool handler is required and must be a function');
    }
    
    // Schema validation
    if (toolDef.inputSchema) {
      try {
        const ajv = new Ajv();
        ajv.compile(toolDef.inputSchema);
      } catch (error) {
        errors.push(`Invalid input schema: ${error.message}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}
```

### 3. Built-in Tools Implementation

```typescript
class BuiltInTools {
  static getDatabaseTool(): ToolDefinition {
    return {
      name: 'database_query',
      description: 'Execute SQL queries against user databases',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          database: { type: 'string' },
          parameters: { type: 'array', items: { type: 'string' } }
        },
        required: ['query', 'database']
      },
      handler: async (args: any, context: ExecutionContext) => {
        const { query, database, parameters = [] } = args;
        
        // Get user's database connection
        const db = await DatabaseManager.getUserDatabase(context.userId, database);
        if (!db) {
          throw new Error(`Database '${database}' not found or not accessible`);
        }
        
        // Execute query with parameters
        const result = await db.query(query, parameters);
        return {
          rows: result.rows,
          rowCount: result.rowCount,
          fields: result.fields?.map(f => ({ name: f.name, type: f.dataTypeID }))
        };
      },
      permissions: [
        { action: 'read', resource: 'database' },
        { action: 'write', resource: 'database', conditions: { queryType: 'SELECT' } }
      ],
      category: 'data',
      version: '1.0.0',
      metadata: {
        rateLimit: { requests: 100, window: 3600 },
        timeout: 30000
      }
    };
  }
  
  static getFileSystemTool(): ToolDefinition {
    return {
      name: 'file_operations',
      description: 'Read, write, and manage files in user workspace',
      inputSchema: {
        type: 'object',
        properties: {
          operation: { type: 'string', enum: ['read', 'write', 'list', 'delete'] },
          path: { type: 'string' },
          content: { type: 'string' },
          encoding: { type: 'string', default: 'utf8' }
        },
        required: ['operation', 'path']
      },
      handler: async (args: any, context: ExecutionContext) => {
        const { operation, path, content, encoding = 'utf8' } = args;
        
        // Validate path is within user's workspace
        const userWorkspace = await WorkspaceManager.getUserWorkspace(context.userId);
        const fullPath = path.resolve(userWorkspace, path);
        
        if (!fullPath.startsWith(userWorkspace)) {
          throw new Error('Access denied: Path outside user workspace');
        }
        
        switch (operation) {
          case 'read':
            return { content: await fs.readFile(fullPath, encoding) };
          case 'write':
            await fs.writeFile(fullPath, content, encoding);
            return { success: true };
          case 'list':
            const files = await fs.readdir(fullPath, { withFileTypes: true });
            return {
              files: files.map(f => ({
                name: f.name,
                type: f.isDirectory() ? 'directory' : 'file',
                size: f.isFile() ? (await fs.stat(path.join(fullPath, f.name))).size : undefined
              }))
            };
          case 'delete':
            await fs.unlink(fullPath);
            return { success: true };
          default:
            throw new Error(`Unsupported operation: ${operation}`);
        }
      },
      permissions: [
        { action: 'read', resource: 'filesystem' },
        { action: 'write', resource: 'filesystem' }
      ],
      category: 'filesystem',
      version: '1.0.0',
      metadata: {
        rateLimit: { requests: 1000, window: 3600 },
        maxFileSize: 10 * 1024 * 1024 // 10MB
      }
    };
  }
  
  static getHttpTool(): ToolDefinition {
    return {
      name: 'http_request',
      description: 'Make HTTP requests to external APIs',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', format: 'uri' },
          method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
          headers: { type: 'object' },
          body: { type: 'string' },
          timeout: { type: 'number', default: 30000 }
        },
        required: ['url', 'method']
      },
      handler: async (args: any, context: ExecutionContext) => {
        const { url, method, headers = {}, body, timeout = 30000 } = args;
        
        // Check if URL is allowed for this user
        const isAllowed = await URLWhitelist.isAllowed(context.userId, url);
        if (!isAllowed) {
          throw new Error(`Access denied: URL '${url}' not in whitelist`);
        }
        
        // Add user agent and rate limiting headers
        const requestHeaders = {
          ...headers,
          'User-Agent': `AI-Marketplace-Agent/${context.userId}`,
          'X-Request-ID': context.sessionId
        };
        
        const response = await fetch(url, {
          method,
          headers: requestHeaders,
          body: body ? JSON.stringify(body) : undefined,
          signal: AbortSignal.timeout(timeout)
        });
        
        return {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: await response.text()
        };
      },
      permissions: [
        { action: 'request', resource: 'http' }
      ],
      category: 'network',
      version: '1.0.0',
      metadata: {
        rateLimit: { requests: 500, window: 3600 },
        timeout: 30000
      }
    };
  }
}
```

### 4. Resource Management

```typescript
interface ResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  handler: ResourceHandler;
  permissions: ResourcePermission[];
  metadata: Record<string, any>;
}

class ResourceManager {
  private resources: Map<string, ResourceDefinition> = new Map();
  private userResourceMappings: Map<string, Set<string>> = new Map();
  
  async registerResource(userId: string, resourceDef: ResourceDefinition): Promise<void> {
    const resourceKey = `${userId}:${resourceDef.uri}`;
    this.resources.set(resourceKey, resourceDef);
    
    if (!this.userResourceMappings.has(userId)) {
      this.userResourceMappings.set(userId, new Set());
    }
    this.userResourceMappings.get(userId)!.add(resourceKey);
    
    await this.persistResourceDefinition(userId, resourceDef);
  }
  
  async getUserResources(userId: string): Promise<ResourceDefinition[]> {
    const userResourceKeys = this.userResourceMappings.get(userId) || new Set();
    const resources: ResourceDefinition[] = [];
    
    for (const resourceKey of userResourceKeys) {
      const resource = this.resources.get(resourceKey);
      if (resource) {
        resources.push(resource);
      }
    }
    
    return resources;
  }
  
  async readResource(userId: string, uri: string, context: ExecutionContext): Promise<any> {
    const resourceKey = `${userId}:${uri}`;
    const resource = this.resources.get(resourceKey);
    
    if (!resource) {
      throw new Error(`Resource '${uri}' not found`);
    }
    
    // Check permissions
    const hasPermission = await this.checkResourcePermission(userId, resource, 'read');
    if (!hasPermission) {
      throw new Error(`Access denied to resource '${uri}'`);
    }
    
    return await resource.handler(context);
  }
  
  private async checkResourcePermission(
    userId: string, 
    resource: ResourceDefinition, 
    action: string
  ): Promise<boolean> {
    for (const permission of resource.permissions) {
      if (permission.action === action || permission.action === '*') {
        // Check conditions if any
        if (permission.conditions) {
          const conditionsMet = await this.evaluateConditions(userId, permission.conditions);
          if (!conditionsMet) continue;
        }
        return true;
      }
    }
    return false;
  }
}

// Built-in resource types
class BuiltInResources {
  static getUserDatabaseResource(userId: string, databaseName: string): ResourceDefinition {
    return {
      uri: `database://${databaseName}`,
      name: `Database: ${databaseName}`,
      description: `Access to user database ${databaseName}`,
      mimeType: 'application/x-sql',
      handler: async (context: ExecutionContext) => {
        const db = await DatabaseManager.getUserDatabase(context.userId, databaseName);
        const tables = await db.query('SELECT table_name FROM information_schema.tables WHERE table_schema = $1', ['public']);
        
        return {
          content: [{
            type: 'text',
            text: `Available tables: ${tables.rows.map(r => r.table_name).join(', ')}`
          }]
        };
      },
      permissions: [
        { action: 'read', resource: 'database' }
      ],
      metadata: {
        category: 'database',
        refreshInterval: 300000 // 5 minutes
      }
    };
  }
  
  static getUserFileSystemResource(userId: string, path: string): ResourceDefinition {
    return {
      uri: `file://${path}`,
      name: `File: ${path}`,
      description: `Access to file at ${path}`,
      mimeType: 'text/plain',
      handler: async (context: ExecutionContext) => {
        const userWorkspace = await WorkspaceManager.getUserWorkspace(context.userId);
        const fullPath = path.resolve(userWorkspace, path);
        
        if (!fullPath.startsWith(userWorkspace)) {
          throw new Error('Access denied: Path outside user workspace');
        }
        
        const content = await fs.readFile(fullPath, 'utf8');
        return {
          content: [{
            type: 'text',
            text: content
          }]
        };
      },
      permissions: [
        { action: 'read', resource: 'filesystem' }
      ],
      metadata: {
        category: 'filesystem'
      }
    };
  }
}
```

### 5. Security and Access Control

```typescript
class MCPSecurityManager {
  async checkToolPermission(
    userId: string, 
    agentId: string, 
    toolName: string, 
    args: any
  ): Promise<boolean> {
    // Get user's tool permissions
    const userPermissions = await this.getUserPermissions(userId);
    const toolPermissions = userPermissions.tools[toolName];
    
    if (!toolPermissions) {
      return false; // Tool not allowed for this user
    }
    
    // Check agent permissions
    const agentPermissions = await this.getAgentPermissions(agentId);
    if (!agentPermissions.tools.includes(toolName)) {
      return false; // Agent not authorized to use this tool
    }
    
    // Check argument-based permissions
    if (toolPermissions.conditions) {
      const conditionsMet = await this.evaluateConditions(args, toolPermissions.conditions);
      if (!conditionsMet) {
        return false;
      }
    }
    
    return true;
  }
  
  async logToolUsage(
    userId: string, 
    agentId: string, 
    toolName: string, 
    args: any, 
    result: any, 
    success: boolean
  ): Promise<void> {
    const logEntry = {
      timestamp: new Date(),
      userId,
      agentId,
      toolName,
      args: this.sanitizeArgs(args),
      success,
      duration: result?.duration || 0,
      error: success ? null : result?.error?.message
    };
    
    await this.auditLogger.log('tool_usage', logEntry);
    
    // Update usage metrics
    await this.metricsCollector.recordToolUsage(userId, toolName, success);
  }
  
  private sanitizeArgs(args: any): any {
    // Remove sensitive information from args before logging
    const sensitiveKeys = ['password', 'token', 'apiKey', 'secret'];
    const sanitized = { ...args };
    
    for (const key of sensitiveKeys) {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
  
  async rateLimit(userId: string, toolName: string): Promise<boolean> {
    const key = `rate_limit:${userId}:${toolName}`;
    const current = await this.redis.get(key) || 0;
    const limit = await this.getToolRateLimit(toolName);
    
    if (parseInt(current) >= limit.requests) {
      return false; // Rate limit exceeded
    }
    
    // Increment counter
    await this.redis.multi()
      .incr(key)
      .expire(key, limit.window)
      .exec();
    
    return true;
  }
}
```

### 6. MCP Gateway Service

```typescript
class MCPGatewayService {
  private serverManager: MCPServerManager;
  private securityManager: MCPSecurityManager;
  private connectionPool: Map<string, MCPConnection> = new Map();
  
  constructor() {
    this.serverManager = new MCPServerManager();
    this.securityManager = new MCPSecurityManager();
  }
  
  async handleToolInvocation(
    userId: string, 
    agentId: string, 
    toolName: string, 
    args: any
  ): Promise<any> {
    // Security checks
    const hasPermission = await this.securityManager.checkToolPermission(
      userId, agentId, toolName, args
    );
    if (!hasPermission) {
      throw new Error(`Access denied to tool '${toolName}'`);
    }
    
    // Rate limiting
    const withinLimit = await this.securityManager.rateLimit(userId, toolName);
    if (!withinLimit) {
      throw new Error(`Rate limit exceeded for tool '${toolName}'`);
    }
    
    // Get or create user MCP context
    let mcpContext = await this.serverManager.getUserMCPServer(userId);
    if (!mcpContext) {
      mcpContext = await this.serverManager.createUserMCPServer(userId);
    }
    
    // Execute tool
    const startTime = Date.now();
    try {
      const result = await mcpContext.invokeTool(toolName, args);
      const duration = Date.now() - startTime;
      
      // Log successful usage
      await this.securityManager.logToolUsage(
        userId, agentId, toolName, args, { ...result, duration }, true
      );
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log failed usage
      await this.securityManager.logToolUsage(
        userId, agentId, toolName, args, { error, duration }, false
      );
      
      throw error;
    }
  }
  
  async handleResourceRead(
    userId: string, 
    agentId: string, 
    resourceUri: string
  ): Promise<any> {
    // Similar security and rate limiting checks
    const hasPermission = await this.securityManager.checkResourcePermission(
      userId, agentId, resourceUri
    );
    if (!hasPermission) {
      throw new Error(`Access denied to resource '${resourceUri}'`);
    }
    
    let mcpContext = await this.serverManager.getUserMCPServer(userId);
    if (!mcpContext) {
      mcpContext = await this.serverManager.createUserMCPServer(userId);
    }
    
    return await mcpContext.readResource(resourceUri);
  }
  
  async setupUserTools(userId: string, toolConfigs: ToolConfig[]): Promise<void> {
    let mcpContext = await this.serverManager.getUserMCPServer(userId);
    if (!mcpContext) {
      mcpContext = await this.serverManager.createUserMCPServer(userId);
    }
    
    for (const config of toolConfigs) {
      await mcpContext.registerTool(config);
    }
  }
}
```

### 7. Integration with A2A Protocol

```typescript
class A2AMCPBridge {
  private mcpGateway: MCPGatewayService;
  
  constructor(mcpGateway: MCPGatewayService) {
    this.mcpGateway = mcpGateway;
  }
  
  async translateA2AToMCP(
    a2aMessage: A2AMessage, 
    userId: string, 
    agentId: string
  ): Promise<MCPRequest> {
    switch (a2aMessage.type) {
      case 'tool_call':
        return {
          method: 'tools/call',
          params: {
            name: a2aMessage.payload.toolName,
            arguments: a2aMessage.payload.arguments
          }
        };
      
      case 'resource_read':
        return {
          method: 'resources/read',
          params: {
            uri: a2aMessage.payload.resourceUri
          }
        };
      
      case 'prompt_get':
        return {
          method: 'prompts/get',
          params: {
            name: a2aMessage.payload.promptName,
            arguments: a2aMessage.payload.arguments
          }
        };
      
      default:
        throw new Error(`Unsupported A2A message type: ${a2aMessage.type}`);
    }
  }
  
  async translateMCPToA2A(mcpResponse: MCPResponse): Promise<A2AMessage> {
    if (mcpResponse.error) {
      return {
        id: generateUUID(),
        type: 'error',
        payload: {
          code: mcpResponse.error.code,
          message: mcpResponse.error.message,
          data: mcpResponse.error.data
        },
        timestamp: new Date().toISOString()
      };
    }
    
    return {
      id: generateUUID(),
      type: 'tool_result',
      payload: {
        result: mcpResponse.result,
        success: true
      },
      timestamp: new Date().toISOString()
    };
  }
  
  async processA2AMessage(
    message: A2AMessage, 
    userId: string, 
    agentId: string
  ): Promise<A2AMessage> {
    try {
      const mcpRequest = await this.translateA2AToMCP(message, userId, agentId);
      
      let result: any;
      switch (mcpRequest.method) {
        case 'tools/call':
          result = await this.mcpGateway.handleToolInvocation(
            userId, agentId, mcpRequest.params.name, mcpRequest.params.arguments
          );
          break;
        
        case 'resources/read':
          result = await this.mcpGateway.handleResourceRead(
            userId, agentId, mcpRequest.params.uri
          );
          break;
        
        default:
          throw new Error(`Unsupported MCP method: ${mcpRequest.method}`);
      }
      
      return await this.translateMCPToA2A({ result });
    } catch (error) {
      return await this.translateMCPToA2A({ 
        error: { 
          code: -1, 
          message: error.message 
        } 
      });
    }
  }
}
```

## Configuration and Deployment

### 1. Docker Configuration

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install MCP SDK and dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY dist ./dist

# Create user workspaces directory
RUN mkdir -p /app/workspaces
RUN chown -R node:node /app/workspaces

# Expose MCP service port
EXPOSE 3001

USER node

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["node", "dist/mcp-gateway.js"]
```

### 2. Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mcp-gateway
  labels:
    app: mcp-gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mcp-gateway
  template:
    metadata:
      labels:
        app: mcp-gateway
    spec:
      containers:
      - name: mcp-gateway
        image: marketplace/mcp-gateway:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: MCP_PORT
          value: "3001"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: url
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        volumeMounts:
        - name: user-workspaces
          mountPath: /app/workspaces
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
      volumes:
      - name: user-workspaces
        persistentVolumeClaim:
          claimName: user-workspaces-pvc

---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: user-workspaces-pvc
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 100Gi
```

## Monitoring and Observability

### 1. Metrics Collection

```typescript
class MCPMetrics {
  private static registry = new prometheus.Registry();
  
  // Counters
  private static toolInvocationsCounter = new prometheus.Counter({
    name: 'mcp_tool_invocations_total',
    help: 'Total number of tool invocations',
    labelNames: ['user_id', 'tool_name', 'status']
  });
  
  private static resourceReadsCounter = new prometheus.Counter({
    name: 'mcp_resource_reads_total',
    help: 'Total number of resource reads',
    labelNames: ['user_id', 'resource_type', 'status']
  });
  
  // Histograms
  private static toolExecutionDuration = new prometheus.Histogram({
    name: 'mcp_tool_execution_duration_seconds',
    help: 'Tool execution duration in seconds',
    labelNames: ['tool_name'],
    buckets: [0.01, 0.1, 0.5, 1, 2, 5, 10, 30]
  });
  
  // Gauges
  private static activeConnections = new prometheus.Gauge({
    name: 'mcp_active_connections',
    help: 'Number of active MCP connections',
    labelNames: ['user_id']
  });
  
  static recordToolInvocation(userId: string, toolName: string, status: string, duration: number): void {
    this.toolInvocationsCounter.inc({ user_id: userId, tool_name: toolName, status });
    this.toolExecutionDuration.observe({ tool_name: toolName }, duration);
  }
  
  static recordResourceRead(userId: string, resourceType: string, status: string): void {
    this.resourceReadsCounter.inc({ user_id: userId, resource_type: resourceType, status });
  }
  
  static setActiveConnections(userId: string, count: number): void {
    this.activeConnections.set({ user_id: userId }, count);
  }
}
```

### 2. Logging Configuration

```typescript
class MCPLogger {
  private logger: winston.Logger;
  
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ filename: 'logs/mcp-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/mcp-combined.log' }),
        new winston.transports.Console({
          format: winston.format.simple()
        })
      ]
    });
  }
  
  logToolInvocation(userId: string, toolName: string, args: any, result: any, success: boolean): void {
    this.logger.info('Tool invocation', {
      userId,
      toolName,
      args: this.sanitizeArgs(args),
      success,
      duration: result?.duration,
      error: success ? null : result?.error?.message,
      timestamp: new Date().toISOString()
    });
  }
  
  logSecurityEvent(event: string, userId: string, details: any): void {
    this.logger.warn('Security event', {
      event,
      userId,
      details,
      timestamp: new Date().toISOString()
    });
  }
  
  logError(error: Error, context: any): void {
    this.logger.error('MCP Error', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  }
}
```

## Testing Strategy

### 1. Unit Tests

```typescript
describe('MCPServerManager', () => {
  let serverManager: MCPServerManager;
  let mockToolRegistry: jest.Mocked<ToolRegistry>;
  let mockResourceManager: jest.Mocked<ResourceManager>;
  
  beforeEach(() => {
    mockToolRegistry = createMockToolRegistry();
    mockResourceManager = createMockResourceManager();
    serverManager = new MCPServerManager();
  });
  
  describe('createUserMCPServer', () => {
    it('should create a new MCP context for user', async () => {
      const userId = 'test-user-123';
      const context = await serverManager.createUserMCPServer(userId);
      
      expect(context).toBeInstanceOf(UserMCPContext);
      expect(context.userId).toBe(userId);
    });
    
    it('should return existing context if already created', async () => {
      const userId = 'test-user-123';
      const context1 = await serverManager.createUserMCPServer(userId);
      const context2 = await serverManager.createUserMCPServer(userId);
      
      expect(context1).toBe(context2);
    });
  });
  
  describe('removeUserMCPServer', () => {
    it('should cleanup user context', async () => {
      const userId = 'test-user-123';
      await serverManager.createUserMCPServer(userId);
      await serverManager.removeUserMCPServer(userId);
      
      const context = await serverManager.getUserMCPServer(userId);
      expect(context).toBeNull();
    });
  });
});

describe('ToolRegistry', () => {
  let toolRegistry: ToolRegistry;
  
  beforeEach(() => {
    toolRegistry = new ToolRegistry();
  });
  
  describe('registerTool', () => {
    it('should register a valid tool', async () => {
      const userId = 'test-user';
      const toolDef = createValidToolDefinition();
      
      await expect(toolRegistry.registerTool(userId, toolDef)).resolves.not.toThrow();
      
      const userTools = await toolRegistry.getUserTools(userId);
      expect(userTools).toHaveLength(1);
      expect(userTools[0].name).toBe(toolDef.name);
    });
    
    it('should reject invalid tool definition', async () => {
      const userId = 'test-user';
      const invalidTool = { name: '', description: 'Invalid' };
      
      await expect(toolRegistry.registerTool(userId, invalidTool)).rejects.toThrow('Invalid tool definition');
    });
  });
});
```

### 2. Integration Tests

```typescript
describe('MCP Integration', () => {
  let mcpGateway: MCPGatewayService;
  let testUser: string;
  
  beforeEach(async () => {
    mcpGateway = new MCPGatewayService();
    testUser = 'integration-test-user';
    
    // Setup test tools
    await mcpGateway.setupUserTools(testUser, [
      {
        name: 'test_tool',
        description: 'Test tool for integration tests',
        handler: async (args) => ({ result: `Hello ${args.name}` })
      }
    ]);
  });
  
  it('should handle tool invocation successfully', async () => {
    const result = await mcpGateway.handleToolInvocation(
      testUser,
      'test-agent',
      'test_tool',
      { name: 'World' }
    );
    
    expect(result.content[0].text).toContain('Hello World');
  });
  
  it('should enforce rate limiting', async () => {
    // Configure low rate limit for testing
    await setTestRateLimit('test_tool', { requests: 2, window: 60 });
    
    // First two calls should succeed
    await mcpGateway.handleToolInvocation(testUser, 'test-agent', 'test_tool', { name: 'Test1' });
    await mcpGateway.handleToolInvocation(testUser, 'test-agent', 'test_tool', { name: 'Test2' });
    
    // Third call should fail
    await expect(
      mcpGateway.handleToolInvocation(testUser, 'test-agent', 'test_tool', { name: 'Test3' })
    ).rejects.toThrow('Rate limit exceeded');
  });
});
```

## Best Practices and Recommendations

### 1. Security Best Practices

- **Principle of Least Privilege**: Grant minimal necessary permissions to tools and resources
- **Input Validation**: Always validate tool arguments and resource URIs
- **Rate Limiting**: Implement appropriate rate limits for all tools
- **Audit Logging**: Log all tool invocations and resource accesses
- **Sandboxing**: Isolate tool execution environments

### 2. Performance Optimization

- **Connection Pooling**: Reuse database and external API connections
- **Caching**: Cache frequently accessed resources and tool results
- **Async Processing**: Use asynchronous patterns for I/O operations
- **Resource Limits**: Set appropriate memory and CPU limits for tool execution

### 3. Monitoring and Alerting

- **Tool Usage Metrics**: Monitor tool invocation patterns and success rates
- **Performance Metrics**: Track tool execution times and resource usage
- **Security Alerts**: Alert on suspicious activity or permission violations
- **Health Checks**: Implement comprehensive health checks for all components

### 4. Error Handling

- **Graceful Degradation**: Handle tool failures gracefully without affecting other operations
- **Retry Logic**: Implement appropriate retry logic for transient failures
- **Error Classification**: Classify errors appropriately (user error vs system error)
- **Detailed Error Messages**: Provide helpful error messages without exposing sensitive information

---

**Document Version**: 1.0  
**Last Updated**: [Current Date]  
**Next Review**: Monthly  
**Stakeholders**: Engineering Team, Architecture Team, Security Team