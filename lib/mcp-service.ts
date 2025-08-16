import { 
  Server, 
  StdioServerTransport, 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  Tool,
  Resource,
  Prompt,
  TextContent,
  ImageContent,
  EmbeddedResource
} from '@modelcontextprotocol/sdk/server.js';
import { db } from './database';
import { MCPTool, UserCredential, ToolUsageLog } from './schema';
import { decryptCredential } from './database';

export class AgentVerseMCPService {
  private server: Server;
  private tools: Map<string, MCPTool> = new Map();
  private contextSessions: Map<string, any> = new Map();

  constructor() {
    this.server = new Server(
      {
        name: 'agentverse-mcp-server',
        version: '1.0.0',
        description: 'AgentVerse MCP Server for AI agent tool integration'
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
          logging: {}
        }
      }
    );

    this.setupHandlers();
    this.loadTools();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const toolsArray = Array.from(this.tools.values());
      
      return {
        tools: toolsArray.map(tool => ({
          name: tool.id,
          description: tool.description || '',
          inputSchema: tool.context_schema ? JSON.parse(tool.context_schema) : {
            type: 'object',
            properties: {
              action: { type: 'string', description: 'Action to perform' },
              parameters: { type: 'object', description: 'Action parameters' }
            },
            required: ['action']
          }
        }))
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        const tool = this.tools.get(name);
        if (!tool) {
          throw new Error(`Tool ${name} not found`);
        }

        // Extract user context from arguments
        const userId = args.user_id;
        const agentId = args.agent_id;
        const sessionId = args.session_id || `${userId}-${name}-${Date.now()}`;

        if (!userId) {
          throw new Error('User ID is required for tool invocation');
        }

        // Get user credentials for this tool
        const credentials = await this.getUserCredentials(userId, name);
        
        // Create or update context session
        await this.manageContextSession(sessionId, userId, agentId, name, args);

        // Execute the tool
        const result = await this.executeTool(tool, args, credentials, sessionId);

        // Log usage
        await this.logToolUsage(userId, agentId, name, args, result, true);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };

      } catch (error) {
        // Log error
        await this.logToolUsage(args.user_id, args.agent_id, name, args, { error: error.message }, false);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: error.message }, null, 2)
            }
          ],
          isError: true
        };
      }
    });

    // List available resources (shared knowledge bases, configurations)
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const resourcesStmt = db.prepare(`
        SELECT sr.*, ac.name as company_name 
        FROM shared_resources sr
        LEFT JOIN agent_companies ac ON sr.company_id = ac.id
        WHERE sr.access_level = 'company' OR sr.access_level = 'team'
      `);
      
      const resources = resourcesStmt.all() as any[];

      return {
        resources: resources.map(resource => ({
          uri: `agentverse://resources/${resource.id}`,
          name: resource.name,
          description: `${resource.type} - ${resource.company_name || 'Global'}`,
          mimeType: resource.type === 'knowledge_base' ? 'text/markdown' : 'application/json'
        }))
      };
    });

    // Read resource content
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;
      const resourceId = uri.replace('agentverse://resources/', '');

      const resourceStmt = db.prepare('SELECT * FROM shared_resources WHERE id = ?');
      const resource = resourceStmt.get(resourceId) as any;

      if (!resource) {
        throw new Error(`Resource ${resourceId} not found`);
      }

      const content = JSON.parse(resource.content);

      return {
        contents: [
          {
            uri,
            mimeType: resource.type === 'knowledge_base' ? 'text/markdown' : 'application/json',
            text: typeof content === 'string' ? content : JSON.stringify(content, null, 2)
          }
        ]
      };
    });

    // List available prompts (workflow templates, agent instructions)
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      const promptsStmt = db.prepare(`
        SELECT w.*, ac.name as company_name
        FROM workflows w
        LEFT JOIN agent_companies ac ON w.company_id = ac.id
        WHERE w.is_template = 1 AND w.is_public = 1
      `);
      
      const workflows = promptsStmt.all() as any[];

      return {
        prompts: workflows.map(workflow => ({
          name: workflow.id,
          description: workflow.description || workflow.name,
          arguments: [
            {
              name: 'input_data',
              description: 'Input data for the workflow',
              required: false
            }
          ]
        }))
      };
    });

    // Handle prompt requests
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      const workflowStmt = db.prepare('SELECT * FROM workflows WHERE id = ? AND is_template = 1');
      const workflow = workflowStmt.get(name) as any;

      if (!workflow) {
        throw new Error(`Workflow template ${name} not found`);
      }

      const workflowDef = JSON.parse(workflow.workflow_definition);
      
      return {
        description: workflow.description || workflow.name,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Execute workflow: ${workflow.name}\n\nDescription: ${workflow.description}\n\nWorkflow Definition:\n${JSON.stringify(workflowDef, null, 2)}\n\nInput Data: ${JSON.stringify(args?.input_data || {}, null, 2)}`
            }
          }
        ]
      };
    });
  }

  private async loadTools() {
    const toolsStmt = db.prepare('SELECT * FROM mcp_tools WHERE is_public = 1');
    const tools = toolsStmt.all() as MCPTool[];
    
    for (const tool of tools) {
      this.tools.set(tool.id, tool);
    }
  }

  private async getUserCredentials(userId: string, toolId: string): Promise<Record<string, string>> {
    const credStmt = db.prepare(`
      SELECT * FROM user_credentials 
      WHERE user_id = ? AND tool_id = ? AND (expires_at IS NULL OR expires_at > datetime('now'))
    `);
    
    const credentials = credStmt.all(userId, toolId) as UserCredential[];
    const decryptedCreds: Record<string, string> = {};

    for (const cred of credentials) {
      try {
        decryptedCreds[cred.credential_name] = decryptCredential(cred.encrypted_value);
      } catch (error) {
        console.error(`Failed to decrypt credential ${cred.credential_name}:`, error);
      }
    }

    return decryptedCreds;
  }

  private async manageContextSession(sessionId: string, userId: string, agentId: string | undefined, toolId: string, args: any) {
    // Check if session exists
    const sessionStmt = db.prepare('SELECT * FROM mcp_context_sessions WHERE id = ?');
    let session = sessionStmt.get(sessionId) as any;

    const sessionData = {
      ...args,
      last_accessed: new Date().toISOString(),
      call_count: (session?.session_data ? JSON.parse(session.session_data).call_count || 0 : 0) + 1
    };

    if (session) {
      // Update existing session
      const updateStmt = db.prepare(`
        UPDATE mcp_context_sessions 
        SET session_data = ?, updated_at = datetime('now')
        WHERE id = ?
      `);
      updateStmt.run(JSON.stringify(sessionData), sessionId);
    } else {
      // Create new session
      const insertStmt = db.prepare(`
        INSERT INTO mcp_context_sessions (id, user_id, agent_id, tool_id, session_data, expires_at)
        VALUES (?, ?, ?, ?, ?, datetime('now', '+1 hour'))
      `);
      insertStmt.run(sessionId, userId, agentId, toolId, JSON.stringify(sessionData));
    }

    this.contextSessions.set(sessionId, sessionData);
  }

  private async executeTool(tool: MCPTool, args: any, credentials: Record<string, string>, sessionId: string): Promise<any> {
    // Get context from session
    const context = this.contextSessions.get(sessionId) || {};
    
    // Mock tool execution based on tool type
    // In a real implementation, this would make actual API calls
    switch (tool.id) {
      case 'tool-google-sheets':
        return this.executeGoogleSheetsAction(args, credentials, context);
      
      case 'tool-slack-messaging':
        return this.executeSlackAction(args, credentials, context);
      
      case 'tool-email-sender':
        return this.executeEmailAction(args, credentials, context);
      
      default:
        return this.executeGenericTool(tool, args, credentials, context);
    }
  }

  private async executeGoogleSheetsAction(args: any, credentials: Record<string, string>, context: any): Promise<any> {
    // Mock Google Sheets API call
    const { action, parameters } = args;
    
    switch (action) {
      case 'read':
        return {
          action: 'read',
          sheet: parameters.sheet || 'Sheet1',
          range: parameters.range || 'A1:Z100',
          data: [
            ['Name', 'Value', 'Status'],
            ['Item 1', '100', 'Active'],
            ['Item 2', '200', 'Inactive'],
            ['Item 3', '150', 'Active']
          ],
          metadata: {
            total_rows: 4,
            total_columns: 3,
            last_modified: new Date().toISOString()
          }
        };
      
      case 'write':
        return {
          action: 'write',
          sheet: parameters.sheet || 'Sheet1',
          range: parameters.range || 'A1',
          rows_updated: parameters.data ? parameters.data.length : 1,
          success: true
        };
      
      default:
        throw new Error(`Unsupported Google Sheets action: ${action}`);
    }
  }

  private async executeSlackAction(args: any, credentials: Record<string, string>, context: any): Promise<any> {
    const { action, parameters } = args;
    
    switch (action) {
      case 'send_message':
        return {
          action: 'send_message',
          channel: parameters.channel || '#general',
          message: parameters.message,
          timestamp: Date.now(),
          success: true
        };
      
      case 'list_channels':
        return {
          action: 'list_channels',
          channels: [
            { id: 'C1234', name: 'general', is_member: true },
            { id: 'C5678', name: 'random', is_member: true },
            { id: 'C9012', name: 'dev-team', is_member: false }
          ]
        };
      
      default:
        throw new Error(`Unsupported Slack action: ${action}`);
    }
  }

  private async executeEmailAction(args: any, credentials: Record<string, string>, context: any): Promise<any> {
    const { action, parameters } = args;
    
    switch (action) {
      case 'send':
        return {
          action: 'send',
          to: parameters.to,
          subject: parameters.subject,
          message_id: `msg_${Date.now()}`,
          success: true,
          sent_at: new Date().toISOString()
        };
      
      default:
        throw new Error(`Unsupported Email action: ${action}`);
    }
  }

  private async executeGenericTool(tool: MCPTool, args: any, credentials: Record<string, string>, context: any): Promise<any> {
    return {
      tool_id: tool.id,
      tool_name: tool.name,
      action: args.action || 'execute',
      parameters: args.parameters || {},
      result: 'Tool executed successfully',
      timestamp: new Date().toISOString(),
      context_preserved: Object.keys(context).length > 0
    };
  }

  private async logToolUsage(userId: string, agentId: string | undefined, toolId: string, request: any, response: any, success: boolean) {
    const logStmt = db.prepare(`
      INSERT INTO tool_usage_logs (
        user_id, agent_id, tool_id, usage_type, request_data, response_status, 
        response_data, credits_consumed, success, response_time_ms
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const tool = this.tools.get(toolId);
    const creditsConsumed = tool?.cost_per_invocation || 1;

    logStmt.run(
      userId,
      agentId,
      toolId,
      'api_call',
      JSON.stringify(request),
      success ? 200 : 500,
      JSON.stringify(response),
      creditsConsumed,
      success ? 1 : 0,
      Math.floor(Math.random() * 1000) + 100 // Mock response time
    );
  }

  public async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('AgentVerse MCP Server started');
  }

  public async stop() {
    await this.server.close();
    console.log('AgentVerse MCP Server stopped');
  }

  // Public methods for marketplace integration
  public async invokeTool(toolId: string, userId: string, agentId: string | undefined, args: any): Promise<any> {
    const tool = this.tools.get(toolId);
    if (!tool) {
      throw new Error(`Tool ${toolId} not found`);
    }

    const credentials = await this.getUserCredentials(userId, toolId);
    const sessionId = `${userId}-${toolId}-${Date.now()}`;
    
    await this.manageContextSession(sessionId, userId, agentId, toolId, args);
    
    return await this.executeTool(tool, args, credentials, sessionId);
  }

  public getAvailableTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  public async getContextSession(sessionId: string): Promise<any> {
    const sessionStmt = db.prepare('SELECT * FROM mcp_context_sessions WHERE id = ?');
    const session = sessionStmt.get(sessionId) as any;
    
    if (session) {
      return JSON.parse(session.session_data);
    }
    
    return null;
  }
}

// Singleton instance
export const mcpService = new AgentVerseMCPService();