import type { Workflow, WorkflowExecution, ExecutionLog, WorkflowNode } from "./workflow-types"
// import { db } from "./mock-db"

// In-memory store for active executions. In production, this would be a distributed cache like Redis.
const activeExecutions = new Map<string, WorkflowExecution>()

class WorkflowEngine {
  async executeWorkflow(workflowId: string, inputs: Record<string, any>): Promise<string> {
    // TODO: Replace db usage with SQLite integration if workflows are stored in DB
    // const workflow = db.workflows.find((w) => w.id === workflowId)
    // if (!workflow) {
    //   throw new Error("Workflow not found")
    // }
    // ...
    // For now, just simulate
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      status: "running",
      startTime: new Date(),
      results: inputs,
      logs: [],
    }
    activeExecutions.set(executionId, execution)
    this.runWorkflowExecution(execution, { id: workflowId } as any).catch((error) => {
      execution.status = "failed"
      execution.endTime = new Date()
      this.addLog(execution, "error", "root", `Workflow execution failed: ${error.message}`)
    })
    return executionId
  }

  private async runWorkflowExecution(execution: WorkflowExecution, workflow: Workflow) {
    try {
      // Find start nodes (nodes with no incoming edges)
      const startNodes = workflow.nodes.filter((node) => !workflow.edges.some((edge) => edge.target === node.id))

      this.addLog(execution, "info", "root", `Starting workflow execution with ${startNodes.length} start nodes`)

      // Execute nodes in topological order
      const executedNodes = new Set<string>()
      const queue = [...startNodes]

      while (queue.length > 0) {
        const node = queue.shift()!

        if (executedNodes.has(node.id)) continue

        // Check if all dependencies are satisfied
        const incomingEdges = workflow.edges.filter((edge) => edge.target === node.id)
        const dependenciesSatisfied = incomingEdges.every((edge) => executedNodes.has(edge.source))

        if (dependenciesSatisfied) {
          // Gather inputs from all incoming edges
          incomingEdges.forEach(edge => {
            const sourceNodeResult = execution.results[edge.source];
            if (sourceNodeResult) {
              const outputValue = edge.sourceHandle ? sourceNodeResult[edge.sourceHandle] : sourceNodeResult;
              if (edge.targetHandle) {
                if (!execution.results[node.id]) execution.results[node.id] = {};
                execution.results[node.id][edge.targetHandle] = outputValue;
              }
            }
          });
        } else {
          queue.push(node); // Re-queue for later
          continue;
        }

        execution.currentNode = node.id
        await this.executeNode(execution, node, workflow)
        executedNodes.add(node.id)

        // Add next nodes to queue
        let outgoingEdges = workflow.edges.filter((edge) => edge.source === node.id)

        // For condition nodes, filter edges based on the result
        if (node.type === 'condition') {
          const conditionResult = execution.results[node.id]?.conditionMet;
          outgoingEdges = outgoingEdges.filter(edge => edge.sourceHandle === String(conditionResult));
        }

        outgoingEdges.forEach((edge) => {
          const targetNode = workflow.nodes.find((n) => n.id === edge.target)
          if (targetNode && !executedNodes.has(targetNode.id)) {
            queue.push(targetNode)
          }
        })
      }

      execution.status = "completed"
      execution.endTime = new Date()
      this.addLog(execution, "info", "root", "Workflow execution completed successfully")
    } catch (error) {
      execution.status = "failed"
      execution.endTime = new Date()
      this.addLog(execution, "error", "root", `Execution failed: ${error}`)
    }
  }

  private async executeNode(execution: WorkflowExecution, node: WorkflowNode, workflow: Workflow) {
    this.addLog(execution, "info", node.id, `Executing node: ${node.data.label}`)

    try {
      switch (node.type) {
        case "input":
          // Input nodes just pass through their data
          execution.results[node.id] = node.data.inputs || {}
          break

        case "agent":
          // Simulate agent execution
          await this.executeAgent(execution, node)
          break

        case "condition":
          // Evaluate condition
          await this.executeCondition(execution, node)
          break

        case "output":
          // Collect final outputs
          execution.results["final_output"] = execution.results[node.id] || {}
          break
      }

      this.addLog(execution, "info", node.id, `Node executed successfully`)
    } catch (error) {
      this.addLog(execution, "error", node.id, `Node execution failed: ${error}`)
      throw error
    }
  }

  private async executeAgent(execution: WorkflowExecution, node: WorkflowNode) {
    // Simulate agent API call
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

    // Mock agent response
    const mockResponse = {
      success: true,
      data: {
        result: `Agent ${node.data.agentName} processed the request`,
        timestamp: new Date().toISOString(),
        processingTime: Math.random() * 1000,
        confidence: 0.85 + Math.random() * 0.15,
      },
    }

    execution.results[node.id] = mockResponse
  }

  private async executeCondition(execution: WorkflowExecution, node: WorkflowNode) {
    // Simple condition evaluation
    const condition = node.data.config?.condition || "true"

    // In a real scenario, you'd evaluate the condition based on inputs.
    // Here, we'll just mock it.
    const result = Math.random() > 0.5

    this.addLog(execution, "info", node.id, `Condition evaluated to ${result}`)
    execution.results[node.id] = { conditionMet: result }
  }

  private addLog(
    execution: WorkflowExecution,
    level: "info" | "warning" | "error",
    nodeId: string,
    message: string,
    data?: any,
  ) {
    const log: ExecutionLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      nodeId,
      level,
      message,
      data,
    }
    execution.logs.push(log)
  }

  getExecution(executionId: string): WorkflowExecution | undefined {
    return activeExecutions.get(executionId)
  }

  saveWorkflow(workflow: Workflow) {
    // TODO: Replace db usage with SQLite integration if workflows are stored in DB
    // if (db.workflows.find((w) => w.id === workflow.id)) {
    //   db.workflows.update(workflow.id, workflow)
    // } else {
    //   // This is a simplified create. The db create function has a different signature.
    //   // In a real app, you'd have a proper "create" or "upsert" method.
    //   db.workflows.update(workflow.id, workflow) // Mocking upsert
    // }
  }

  getWorkflow(workflowId: string): Workflow | undefined {
    // TODO: Replace db usage with SQLite integration if workflows are stored in DB
    // return db.workflows.find((w) => w.id === workflowId)
    return undefined // Mocking
  }

  getUserWorkflows(userId: string): Workflow[] {
    // TODO: Replace db usage with SQLite integration if workflows are stored in DB
    // return db.workflows.findForUser(userId)
    return [] // Mocking
  }
}

export const workflowEngine = new WorkflowEngine()
