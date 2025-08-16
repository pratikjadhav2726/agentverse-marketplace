import { NextRequest, NextResponse } from 'next/server';
import { mcpService } from '@/lib/mcp-service';

// POST /api/mcp/invoke - Invoke MCP tool
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tool_id,
      user_id,
      agent_id,
      action,
      parameters,
      session_id
    } = body;

    if (!tool_id || !user_id) {
      return NextResponse.json(
        { error: 'tool_id and user_id are required' },
        { status: 400 }
      );
    }

    // Invoke tool through MCP service
    const result = await mcpService.invokeTool(tool_id, user_id, agent_id, {
      action: action || 'execute',
      parameters: parameters || {},
      session_id
    });

    return NextResponse.json({
      success: true,
      result,
      tool_id,
      user_id,
      agent_id,
      protocol_version: 'MCP-1.0',
      invoked_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error invoking MCP tool:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to invoke tool',
        tool_id: body?.tool_id,
        protocol_version: 'MCP-1.0'
      },
      { status: 500 }
    );
  }
}

// GET /api/mcp/invoke - Get available MCP tools and their schemas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const toolId = searchParams.get('tool_id');

    if (toolId) {
      // Get specific tool information
      const tools = mcpService.getAvailableTools();
      const tool = tools.find(t => t.id === toolId);

      if (!tool) {
        return NextResponse.json(
          { error: 'Tool not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        tool,
        invocation_schema: {
          type: 'object',
          properties: {
            tool_id: { type: 'string', const: toolId },
            user_id: { type: 'string', description: 'User ID for authentication and billing' },
            agent_id: { type: 'string', description: 'Agent ID for context and logging' },
            action: { type: 'string', description: 'Action to perform with the tool' },
            parameters: { type: 'object', description: 'Tool-specific parameters' },
            session_id: { type: 'string', description: 'Optional session ID for context continuity' }
          },
          required: ['tool_id', 'user_id']
        },
        context_schema: tool.context_schema ? JSON.parse(tool.context_schema) : null,
        protocol_version: 'MCP-1.0'
      });
    }

    // Get all available tools with invocation information
    const tools = mcpService.getAvailableTools();
    
    const toolsWithInvocation = tools.map(tool => ({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      category: tool.category,
      auth_type: tool.auth_type,
      supports_streaming: tool.supports_streaming,
      supports_batching: tool.supports_batching,
      cost_per_invocation: tool.cost_per_invocation,
      rate_limit_per_minute: tool.rate_limit_per_minute,
      reliability_score: tool.reliability_score,
      context_management_enabled: Boolean(tool.context_schema),
      invocation_endpoint: `/api/mcp/invoke`,
      method: 'POST'
    }));

    return NextResponse.json({
      tools: toolsWithInvocation,
      total: toolsWithInvocation.length,
      mcp_enabled: true,
      protocol_version: 'MCP-1.0',
      context_sessions_supported: true,
      streaming_supported: tools.some(t => t.supports_streaming),
      batching_supported: tools.some(t => t.supports_batching)
    });

  } catch (error) {
    console.error('Error fetching MCP tools:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MCP tools' },
      { status: 500 }
    );
  }
}