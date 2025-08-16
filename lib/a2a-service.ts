import {
  A2AClient,
  A2AServer,
  AgentCard,
  Task,
  Message,
  Artifact,
  TaskStatus,
  MessageType,
  createA2AClient,
  createA2AServer
} from '@a2a-protocol/sdk';
import { db } from './database';
import { A2ATask, A2AMessage, A2AArtifact, Agent } from './schema';
import { mcpService } from './mcp-service';

export class AgentVerseA2AService {
  private clients: Map<string, A2AClient> = new Map();
  private servers: Map<string, A2AServer> = new Map();
  private agentCards: Map<string, AgentCard> = new Map();

  constructor() {
    this.initializeAgentCards();
  }

  private async initializeAgentCards() {
    const agentsStmt = db.prepare(`
      SELECT a.*, u.name as owner_name, u.email as owner_email
      FROM agents a
      LEFT JOIN users u ON a.owner_id = u.id
      WHERE a.status = 'active' AND a.collaboration_enabled = 1
    `);
    
    const agents = agentsStmt.all() as (Agent & { owner_name: string; owner_email: string })[];

    for (const agent of agents) {
      const agentCard: AgentCard = {
        id: agent.id,
        name: agent.name,
        description: agent.description || '',
        version: agent.version || '1.0.0',
        serviceEndpointUrl: agent.service_endpoint_url || `https://api.agentverse.com/agents/${agent.id}`,
        supportedModalities: JSON.parse(agent.supported_modalities || '["text"]'),
        capabilities: JSON.parse(agent.capabilities || '[]'),
        skills: JSON.parse(agent.skills || '[]'),
        authenticationRequirements: JSON.parse(agent.authentication_requirements || '{"type": "none"}'),
        inputSchema: agent.input_schema ? JSON.parse(agent.input_schema) : {
          type: 'object',
          properties: {
            task: { type: 'string', description: 'Task description' },
            parameters: { type: 'object', description: 'Task parameters' }
          },
          required: ['task']
        },
        outputSchema: agent.output_schema ? JSON.parse(agent.output_schema) : {
          type: 'object',
          properties: {
            result: { type: 'string', description: 'Task result' },
            artifacts: { type: 'array', items: { type: 'object' }, description: 'Generated artifacts' }
          }
        },
        metadata: {
          category: agent.category || 'General',
          tags: agent.tags ? agent.tags.split(',') : [],
          ownerId: agent.owner_id,
          createdAt: agent.created_at,
          maxConcurrentTasks: agent.max_concurrent_tasks || 1,
          averageResponseTime: agent.average_response_time || 5000
        }
      };

      this.agentCards.set(agent.id, agentCard);
      await this.createAgentServer(agent.id, agentCard);
    }
  }

  private async createAgentServer(agentId: string, agentCard: AgentCard) {
    const server = createA2AServer({
      agentCard,
      port: 8000 + parseInt(agentId.slice(-4), 16) % 1000, // Dynamic port based on agent ID
      
      // Handle incoming task requests
      onTaskReceived: async (task: Task) => {
        return await this.handleIncomingTask(agentId, task);
      },

      // Handle task status updates
      onTaskStatusUpdate: async (taskId: string, status: TaskStatus) => {
        return await this.updateTaskStatus(taskId, status);
      },

      // Handle incoming messages
      onMessageReceived: async (taskId: string, message: Message) => {
        return await this.handleIncomingMessage(agentId, taskId, message);
      },

      // Authentication handler
      authenticate: async (authToken: string) => {
        return await this.authenticateRequest(authToken);
      }
    });

    this.servers.set(agentId, server);
    
    try {
      await server.start();
      console.log(`A2A Server started for agent ${agentId} on port ${server.port}`);
    } catch (error) {
      console.error(`Failed to start A2A server for agent ${agentId}:`, error);
    }
  }

  private async handleIncomingTask(serverAgentId: string, task: Task): Promise<{ taskId: string; status: TaskStatus }> {
    // Store task in database
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const insertStmt = db.prepare(`
      INSERT INTO a2a_tasks (
        id, client_agent_id, server_agent_id, user_id, title, description, 
        status, priority, input_data, estimated_credits
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      taskId,
      task.clientAgentId,
      serverAgentId,
      task.userId || 'system',
      task.title || 'A2A Task',
      task.description || '',
      'submitted',
      task.priority || 'medium',
      JSON.stringify(task.inputData || {}),
      task.estimatedCredits || 10
    );

    // Process task asynchronously
    this.processTaskAsync(taskId, serverAgentId, task);

    return { taskId, status: 'submitted' };
  }

  private async processTaskAsync(taskId: string, agentId: string, task: Task) {
    try {
      // Update status to working
      await this.updateTaskStatus(taskId, 'working');

      // Get agent capabilities
      const agentCard = this.agentCards.get(agentId);
      if (!agentCard) {
        throw new Error(`Agent card not found for ${agentId}`);
      }

      // Simulate task processing based on agent capabilities
      const result = await this.executeAgentTask(agentId, task);

      // Create artifacts from result
      if (result.artifacts && result.artifacts.length > 0) {
        for (const artifact of result.artifacts) {
          await this.createArtifact(taskId, artifact);
        }
      }

      // Update task with results
      const updateStmt = db.prepare(`
        UPDATE a2a_tasks 
        SET status = ?, output_data = ?, completed_at = datetime('now'), actual_credits_consumed = ?
        WHERE id = ?
      `);
      
      updateStmt.run('completed', JSON.stringify(result), result.creditsConsumed || 10, taskId);

      // Send completion message
      await this.sendTaskMessage(taskId, 'agent', agentId, {
        type: 'text',
        content: `Task completed successfully. ${result.summary || 'Results available in artifacts.'}`
      }, 'response');

    } catch (error) {
      console.error(`Task processing failed for ${taskId}:`, error);
      
      // Update task status to failed
      const updateStmt = db.prepare(`
        UPDATE a2a_tasks 
        SET status = ?, error_message = ?, completed_at = datetime('now')
        WHERE id = ?
      `);
      
      updateStmt.run('failed', error.message, taskId);

      // Send error message
      await this.sendTaskMessage(taskId, 'agent', agentId, {
        type: 'text',
        content: `Task failed: ${error.message}`
      }, 'error');
    }
  }

  private async executeAgentTask(agentId: string, task: Task): Promise<any> {
    const agentCard = this.agentCards.get(agentId);
    if (!agentCard) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Simulate different types of agent processing based on capabilities
    const capabilities = agentCard.capabilities;
    const inputData = task.inputData || {};

    if (capabilities.includes('data_analysis')) {
      return await this.executeDataAnalysisTask(agentId, inputData);
    } else if (capabilities.includes('spreadsheet_manipulation')) {
      return await this.executeSpreadsheetTask(agentId, inputData);
    } else if (capabilities.includes('message_scheduling')) {
      return await this.executeCommunicationTask(agentId, inputData);
    } else if (capabilities.includes('workflow_management')) {
      return await this.executeWorkflowTask(agentId, inputData);
    } else {
      return await this.executeGenericTask(agentId, inputData);
    }
  }

  private async executeDataAnalysisTask(agentId: string, inputData: any): Promise<any> {
    // Simulate data analysis
    const analysisResult = {
      summary: 'Data analysis completed',
      insights: [
        'Trend analysis shows 15% growth',
        'Peak usage occurs at 2 PM',
        'Anomaly detected in dataset'
      ],
      metrics: {
        totalRecords: Math.floor(Math.random() * 10000) + 1000,
        anomalies: Math.floor(Math.random() * 10),
        confidence: Math.random() * 0.3 + 0.7
      },
      creditsConsumed: 25,
      artifacts: [{
        name: 'analysis_report.json',
        description: 'Detailed analysis report',
        contentType: 'application/json',
        content: JSON.stringify({
          analysis: 'detailed results here',
          timestamp: new Date().toISOString()
        })
      }]
    };

    return analysisResult;
  }

  private async executeSpreadsheetTask(agentId: string, inputData: any): Promise<any> {
    // Use MCP service for tool integration
    try {
      const result = await mcpService.invokeTool('tool-google-sheets', inputData.userId, agentId, {
        action: inputData.action || 'read',
        parameters: inputData.parameters || {}
      });

      return {
        summary: 'Spreadsheet operation completed',
        result,
        creditsConsumed: 15,
        artifacts: [{
          name: 'spreadsheet_result.json',
          description: 'Spreadsheet operation result',
          contentType: 'application/json',
          content: JSON.stringify(result)
        }]
      };
    } catch (error) {
      throw new Error(`Spreadsheet task failed: ${error.message}`);
    }
  }

  private async executeCommunicationTask(agentId: string, inputData: any): Promise<any> {
    // Use MCP service for communication tools
    const tasks = [];
    
    if (inputData.slack) {
      tasks.push(mcpService.invokeTool('tool-slack-messaging', inputData.userId, agentId, {
        action: 'send_message',
        parameters: inputData.slack
      }));
    }

    if (inputData.email) {
      tasks.push(mcpService.invokeTool('tool-email-sender', inputData.userId, agentId, {
        action: 'send',
        parameters: inputData.email
      }));
    }

    const results = await Promise.all(tasks);

    return {
      summary: 'Communication tasks completed',
      results,
      creditsConsumed: 20,
      artifacts: [{
        name: 'communication_log.json',
        description: 'Communication activity log',
        contentType: 'application/json',
        content: JSON.stringify({ results, timestamp: new Date().toISOString() })
      }]
    };
  }

  private async executeWorkflowTask(agentId: string, inputData: any): Promise<any> {
    // Workflow orchestration logic
    const workflowId = inputData.workflowId;
    if (!workflowId) {
      throw new Error('Workflow ID is required for workflow tasks');
    }

    // Get workflow definition
    const workflowStmt = db.prepare('SELECT * FROM workflows WHERE id = ?');
    const workflow = workflowStmt.get(workflowId) as any;

    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const workflowDef = JSON.parse(workflow.workflow_definition);
    
    // Create workflow execution
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const execStmt = db.prepare(`
      INSERT INTO workflow_executions (id, workflow_id, user_id, status, input_data)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    execStmt.run(executionId, workflowId, inputData.userId || 'system', 'running', JSON.stringify(inputData));

    // Process workflow steps (simplified)
    const results = await this.processWorkflowSteps(executionId, workflowDef, inputData);

    return {
      summary: 'Workflow execution completed',
      executionId,
      results,
      creditsConsumed: 35,
      artifacts: [{
        name: 'workflow_execution_report.json',
        description: 'Workflow execution report',
        contentType: 'application/json',
        content: JSON.stringify({ executionId, results, timestamp: new Date().toISOString() })
      }]
    };
  }

  private async executeGenericTask(agentId: string, inputData: any): Promise<any> {
    return {
      summary: 'Generic task completed',
      result: `Task processed by agent ${agentId}`,
      inputProcessed: inputData,
      creditsConsumed: 10,
      artifacts: [{
        name: 'task_result.json',
        description: 'Generic task result',
        contentType: 'application/json',
        content: JSON.stringify({ result: 'success', timestamp: new Date().toISOString() })
      }]
    };
  }

  private async processWorkflowSteps(executionId: string, workflowDef: any, inputData: any): Promise<any[]> {
    const results = [];
    
    // Simple sequential processing (in real implementation, handle dependencies)
    for (const node of workflowDef.nodes) {
      if (node.type === 'agent' && node.data.agent_id) {
        try {
          // Delegate to another agent
          const result = await this.delegateTask(node.data.agent_id, {
            title: node.data.task || 'Workflow Step',
            description: `Step in workflow execution ${executionId}`,
            inputData: inputData,
            userId: inputData.userId,
            priority: 'medium'
          });
          
          results.push({ step: node.id, result, success: true });
        } catch (error) {
          results.push({ step: node.id, error: error.message, success: false });
        }
      }
    }

    return results;
  }

  private async updateTaskStatus(taskId: string, status: TaskStatus) {
    const updateStmt = db.prepare(`
      UPDATE a2a_tasks 
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    
    updateStmt.run(status, taskId);
  }

  private async handleIncomingMessage(agentId: string, taskId: string, message: Message): Promise<void> {
    // Store message in database
    const messageStmt = db.prepare(`
      INSERT INTO a2a_messages (task_id, sender_type, sender_id, content, message_type)
      VALUES (?, ?, ?, ?, ?)
    `);

    messageStmt.run(
      taskId,
      message.senderType || 'agent',
      message.senderId || agentId,
      JSON.stringify(message.content),
      message.messageType || 'response'
    );
  }

  private async sendTaskMessage(taskId: string, senderType: 'user' | 'agent', senderId: string, content: any, messageType: MessageType) {
    const messageStmt = db.prepare(`
      INSERT INTO a2a_messages (task_id, sender_type, sender_id, content, message_type)
      VALUES (?, ?, ?, ?, ?)
    `);

    messageStmt.run(
      taskId,
      senderType,
      senderId,
      JSON.stringify({ parts: [content] }),
      messageType
    );
  }

  private async createArtifact(taskId: string, artifactData: any) {
    const artifactStmt = db.prepare(`
      INSERT INTO a2a_artifacts (task_id, name, description, content_type, content, file_size)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const content = typeof artifactData.content === 'string' 
      ? artifactData.content 
      : JSON.stringify(artifactData.content);

    artifactStmt.run(
      taskId,
      artifactData.name,
      artifactData.description || '',
      artifactData.contentType || 'application/json',
      content,
      content.length
    );
  }

  private async authenticateRequest(authToken: string): Promise<boolean> {
    // Simple authentication - in production, validate JWT or API key
    return authToken && authToken.length > 10;
  }

  // Public API methods
  public async delegateTask(targetAgentId: string, taskRequest: {
    title: string;
    description?: string;
    inputData?: any;
    userId?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    estimatedCredits?: number;
  }): Promise<any> {
    const agentCard = this.agentCards.get(targetAgentId);
    if (!agentCard) {
      throw new Error(`Target agent ${targetAgentId} not found`);
    }

    // Create A2A client if not exists
    if (!this.clients.has(targetAgentId)) {
      const client = createA2AClient({
        serviceEndpointUrl: agentCard.serviceEndpointUrl,
        authentication: agentCard.authenticationRequirements
      });
      this.clients.set(targetAgentId, client);
    }

    const client = this.clients.get(targetAgentId)!;

    // Create task
    const task: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: taskRequest.title,
      description: taskRequest.description,
      inputData: taskRequest.inputData,
      userId: taskRequest.userId,
      priority: taskRequest.priority || 'medium',
      estimatedCredits: taskRequest.estimatedCredits || 10,
      status: 'submitted',
      createdAt: new Date().toISOString()
    };

    // Send task to target agent
    const result = await client.submitTask(task);
    
    return result;
  }

  public async getTaskStatus(taskId: string): Promise<A2ATask | null> {
    const taskStmt = db.prepare('SELECT * FROM a2a_tasks WHERE id = ?');
    return taskStmt.get(taskId) as A2ATask | null;
  }

  public async getTaskMessages(taskId: string): Promise<A2AMessage[]> {
    const messagesStmt = db.prepare('SELECT * FROM a2a_messages WHERE task_id = ? ORDER BY created_at');
    return messagesStmt.all(taskId) as A2AMessage[];
  }

  public async getTaskArtifacts(taskId: string): Promise<A2AArtifact[]> {
    const artifactsStmt = db.prepare('SELECT * FROM a2a_artifacts WHERE task_id = ? ORDER BY created_at');
    return artifactsStmt.all(taskId) as A2AArtifact[];
  }

  public getAvailableAgents(): AgentCard[] {
    return Array.from(this.agentCards.values());
  }

  public async discoverAgents(query: {
    capabilities?: string[];
    skills?: string[];
    categories?: string[];
    collaborationEnabled?: boolean;
    supportedModalities?: string[];
  }): Promise<AgentCard[]> {
    let agents = Array.from(this.agentCards.values());

    if (query.capabilities) {
      agents = agents.filter(agent => 
        query.capabilities!.some(cap => agent.capabilities.includes(cap))
      );
    }

    if (query.skills) {
      agents = agents.filter(agent => 
        query.skills!.some(skill => agent.skills.includes(skill))
      );
    }

    if (query.categories) {
      agents = agents.filter(agent => 
        query.categories!.includes(agent.metadata.category)
      );
    }

    if (query.supportedModalities) {
      agents = agents.filter(agent => 
        query.supportedModalities!.some(modality => agent.supportedModalities.includes(modality))
      );
    }

    return agents;
  }

  public async shutdown() {
    // Stop all servers
    for (const [agentId, server] of this.servers) {
      try {
        await server.stop();
        console.log(`A2A Server stopped for agent ${agentId}`);
      } catch (error) {
        console.error(`Error stopping server for agent ${agentId}:`, error);
      }
    }

    // Close all clients
    for (const [agentId, client] of this.clients) {
      try {
        await client.disconnect();
        console.log(`A2A Client disconnected for agent ${agentId}`);
      } catch (error) {
        console.error(`Error disconnecting client for agent ${agentId}:`, error);
      }
    }
  }
}

// Singleton instance
export const a2aService = new AgentVerseA2AService();