// Microservices client library for AgentVerse
import { z } from 'zod'

// Configuration
const MICROSERVICES_CONFIG = {
  workflowEngine: process.env.WORKFLOW_ENGINE_URL || 'http://localhost:8001',
  agentRuntime: process.env.AGENT_RUNTIME_URL || 'http://localhost:8002',
  mcpServer: process.env.MCP_SERVER_URL || 'http://localhost:8003',
  a2aService: process.env.A2A_SERVICE_URL || 'http://localhost:8004',
  aiOrchestrator: process.env.AI_ORCHESTRATOR_URL || 'http://localhost:8005',
}

// Types
export interface WorkflowNode {
  id: string
  type: string
  data: Record<string, any>
  position: { x: number; y: number }
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}

export interface Workflow {
  id: string
  name: string
  description: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  user_id: string
  created_at?: string
}

export interface WorkflowExecution {
  id: string
  workflow_id: string
  status: string
  inputs: Record<string, any>
  outputs: Record<string, any>
  start_time: string
  end_time?: string
  error_message?: string
  user_id: string
}

export interface AgentConfig {
  id: string
  name: string
  description: string
  agent_card: {
    name: string
    description: string
    version: string
    service_endpoint: string
    capabilities: Array<Record<string, any>>
    supported_modalities: string[]
    a2a_capabilities: Record<string, boolean>
    metadata: Record<string, any>
  }
  llm_config: Record<string, any>
  tools: string[]
  system_prompt?: string
  temperature: number
  max_tokens: number
}

export interface ToolDefinition {
  name: string
  description: string
  input_schema: Record<string, any>
  category: string
  version: string
  auth_required: boolean
  rate_limit: { requests: number; window: number }
  metadata: Record<string, any>
}

// Base microservice client
class MicroserviceClient {
  constructor(private baseUrl: string) {}

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Microservice request failed: ${response.status} ${error}`)
    }

    return response.json()
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

// Workflow Engine Client
export class WorkflowEngineClient extends MicroserviceClient {
  constructor() {
    super(MICROSERVICES_CONFIG.workflowEngine)
  }

  async createWorkflow(workflow: Workflow): Promise<{ workflow_id: string; status: string }> {
    return this.post('/workflows', workflow)
  }

  async executeWorkflow(
    workflowId: string,
    inputs: Record<string, any>,
    userId: string
  ): Promise<{ execution_id: string; status: string }> {
    return this.post(`/workflows/${workflowId}/execute`, {
      workflow_id: workflowId,
      inputs,
      user_id: userId,
    })
  }

  async getExecutionStatus(executionId: string): Promise<WorkflowExecution> {
    return this.get(`/executions/${executionId}`)
  }

  async getWorkflow(workflowId: string): Promise<Workflow> {
    return this.get(`/workflows/${workflowId}`)
  }

  async healthCheck(): Promise<any> {
    return this.get('/health')
  }
}

// Agent Runtime Client
export class AgentRuntimeClient extends MicroserviceClient {
  constructor() {
    super(MICROSERVICES_CONFIG.agentRuntime)
  }

  async registerAgent(agentConfig: AgentConfig): Promise<any> {
    return this.post('/agents/register', agentConfig)
  }

  async executeAgent(
    agentId: string,
    query: string,
    context: Record<string, any>,
    userId: string
  ): Promise<any> {
    return this.post(`/agents/${agentId}/execute`, {
      agent_id: agentId,
      query,
      context,
      user_id: userId,
    })
  }

  async getAgentInfo(agentId: string): Promise<any> {
    return this.get(`/agents/${agentId}`)
  }

  async listAgents(): Promise<any> {
    return this.get('/agents')
  }

  async unregisterAgent(agentId: string): Promise<any> {
    return this.delete(`/agents/${agentId}`)
  }
}

// MCP Server Client
export class MCPServerClient extends MicroserviceClient {
  constructor() {
    super(MICROSERVICES_CONFIG.mcpServer)
  }

  async listTools(userId: string): Promise<{ tools: ToolDefinition[] }> {
    return this.get(`/tools?user_id=${userId}`)
  }

  async registerTool(userId: string, toolDef: ToolDefinition): Promise<any> {
    return this.post(`/tools/register?user_id=${userId}`, toolDef)
  }

  async invokeTool(
    toolName: string,
    arguments_: Record<string, any>,
    userId: string,
    agentId?: string
  ): Promise<any> {
    return this.post(`/tools/${toolName}/invoke`, {
      tool_name: toolName,
      arguments: arguments_,
      user_id: userId,
      agent_id: agentId,
    })
  }

  async storeCredential(
    userId: string,
    toolName: string,
    credentialType: string,
    credentialValue: string
  ): Promise<any> {
    return this.post('/credentials', {
      user_id: userId,
      tool_name: toolName,
      credential_type: credentialType,
      credential_value: credentialValue,
    })
  }

  async listCredentials(userId: string): Promise<any> {
    return this.get(`/credentials?user_id=${userId}`)
  }

  async deleteCredential(userId: string, toolName: string): Promise<any> {
    return this.delete(`/credentials/${toolName}?user_id=${userId}`)
  }
}

// A2A Service Client
export class A2AServiceClient extends MicroserviceClient {
  constructor() {
    super(MICROSERVICES_CONFIG.a2aService)
  }

  async registerAgent(agentCard: any): Promise<{ agent_id: string; status: string }> {
    return this.post('/agents/register', agentCard)
  }

  async discoverAgents(
    capabilities?: string[],
    modalities?: string[],
    performanceThreshold?: number
  ): Promise<{ agents: any[]; count: number }> {
    const params = new URLSearchParams()
    if (capabilities?.length) params.set('capabilities', capabilities.join(','))
    if (modalities?.length) params.set('modalities', modalities.join(','))
    if (performanceThreshold) params.set('performance_threshold', performanceThreshold.toString())

    return this.get(`/agents/discover?${params.toString()}`)
  }

  async createTask(
    agentId: string,
    name: string,
    description: string,
    inputData: Record<string, any>,
    userId: string,
    context?: Record<string, any>
  ): Promise<{ task_id: string; status: string }> {
    return this.post('/tasks', {
      agent_id: agentId,
      name,
      description,
      input_data: inputData,
      user_id: userId,
      context: context || {},
    })
  }

  async getTaskStatus(taskId: string): Promise<any> {
    return this.get(`/tasks/${taskId}`)
  }

  async updateTaskStatus(
    taskId: string,
    status: string,
    outputData?: Record<string, any>,
    errorMessage?: string
  ): Promise<any> {
    return this.put(`/tasks/${taskId}/status`, {
      status,
      output_data: outputData,
      error_message: errorMessage,
    })
  }

  async listAgents(): Promise<{ agents: any[]; count: number }> {
    return this.get('/agents')
  }
}

// AI Orchestrator Client
export class AIOrchestrator extends MicroserviceClient {
  constructor() {
    super(MICROSERVICES_CONFIG.aiOrchestrator)
  }

  async createEmbedding(
    text: string,
    collectionName: string = 'default',
    metadata: Record<string, any> = {}
  ): Promise<any> {
    return this.post('/embeddings', {
      text,
      collection_name: collectionName,
      metadata,
    })
  }

  async searchSimilar(
    query: string,
    collectionName: string = 'default',
    nResults: number = 5
  ): Promise<any> {
    return this.post('/search', {
      query,
      collection_name: collectionName,
      n_results: nResults,
    })
  }

  async createAIAgent(config: {
    agent_type?: string
    model?: string
    temperature?: number
    max_tokens?: number
    system_prompt: string
    tools?: string[]
  }): Promise<{ agent_id: string; status: string }> {
    return this.post('/agents', config)
  }

  async chatWithAgent(
    agentId: string,
    message: string,
    userId: string,
    sessionId?: string,
    context?: Record<string, any>
  ): Promise<any> {
    return this.post(`/agents/${agentId}/chat`, {
      agent_id: agentId,
      message,
      user_id: userId,
      session_id: sessionId,
      context: context || {},
    })
  }

  async getAgentMemory(agentId: string, query?: string): Promise<any> {
    const params = query ? `?query=${encodeURIComponent(query)}` : ''
    return this.get(`/agents/${agentId}/memory${params}`)
  }

  async storeAgentMemory(
    agentId: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<any> {
    return this.post(`/agents/${agentId}/memory`, { content, metadata })
  }

  async listCollections(): Promise<any> {
    return this.get('/collections')
  }
}

// Singleton instances
export const workflowEngine = new WorkflowEngineClient()
export const agentRuntime = new AgentRuntimeClient()
export const mcpServer = new MCPServerClient()
export const a2aService = new A2AServiceClient()
export const aiOrchestrator = new AIOrchestrator()

// Health check for all services
export async function checkMicroservicesHealth(): Promise<{
  [key: string]: { status: string; error?: string }
}> {
  const services = {
    workflowEngine,
    agentRuntime,
    mcpServer,
    a2aService,
    aiOrchestrator,
  }

  const healthResults: { [key: string]: { status: string; error?: string } } = {}

  await Promise.allSettled(
    Object.entries(services).map(async ([name, client]) => {
      try {
        await client.healthCheck()
        healthResults[name] = { status: 'healthy' }
      } catch (error) {
        healthResults[name] = {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    })
  )

  return healthResults
}