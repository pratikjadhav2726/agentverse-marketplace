export interface WorkflowNode {
  id: string
  type: "agent" | "input" | "output" | "condition"
  position: { x: number; y: number }
  data: {
    agentId?: string
    agentName?: string
    label: string
    inputs?: Record<string, any>
    outputs?: Record<string, any>
    config?: Record<string, any>
  }
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  data?: {
    condition?: string
    mapping?: Record<string, string>
  }
}

export interface Workflow {
  id: string
  name: string
  description: string
  userId: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  status: "active" | "draft" | "paused" | "completed" | "failed" | "running" | "idle"
  createdAt: Date
  updatedAt: Date
  executionHistory: WorkflowExecution[]
}

export interface WorkflowExecution {
  id: string
  workflowId: string
  status: "running" | "completed" | "failed" | "paused"
  startTime: Date
  endTime?: Date
  currentNode?: string
  results: Record<string, any>
  logs: ExecutionLog[]
}

export interface ExecutionLog {
  id: string
  timestamp: Date
  nodeId: string
  level: "info" | "warning" | "error"
  message: string
  data?: any
}

export interface PurchasedAgent {
  id: string
  agentId: string
  userId: string
  agent: {
    id: string
    name: string
    description: string
    capabilities: string[]
    inputSchema: Record<string, any>
    outputSchema: Record<string, any>
  }
  purchaseDate: Date
  status: "active" | "expired"
}
