import { NextRequest, NextResponse } from 'next/server';
import { sqlite } from '../../../lib/database';
import { MCPTool, MCPToolWithUsage } from '../../../lib/schema';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const include_usage = searchParams.get('include_usage') === 'true';

    let query = 'SELECT * FROM mcp_tools WHERE is_public = ?';
    const params: any[] = [1];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY created_at DESC';

    const tools = sqlite.prepare(query).all(...params) as MCPTool[];

    // Add usage statistics if requested
    let toolsWithUsage: MCPToolWithUsage[] = tools;
    if (include_usage) {
      toolsWithUsage = tools.map(tool => {
        // Count agents using this tool
        const agentCount = sqlite.prepare('SELECT COUNT(*) as count FROM agent_tools WHERE tool_id = ?').get(tool.id) as { count: number };
        
        // Count recent usage (last 30 days)
        const recentUsage = sqlite.prepare(`
          SELECT COUNT(*) as count FROM tool_usage_logs 
          WHERE tool_id = ? AND created_at > datetime('now', '-30 days')
        `).get(tool.id) as { count: number };

        return {
          ...tool,
          agent_count: agentCount.count,
          recent_usage: recentUsage.count
        };
      });
    }

    return NextResponse.json({ tools: toolsWithUsage });
  } catch (error) {
    console.error('Error fetching tools:', error);
    return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      category,
      api_endpoint,
      auth_type = 'api_key',
      required_scopes,
      documentation_url,
      is_public = true
    } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    // Validate auth_type
    if (!['api_key', 'oauth', 'bearer', 'basic'].includes(auth_type)) {
      return NextResponse.json(
        { error: 'Invalid auth_type. Must be api_key, oauth, bearer, or basic' },
        { status: 400 }
      );
    }

    // Generate unique ID
    const toolId = 'tool-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

    // Insert new tool
    const stmt = sqlite.prepare(`
      INSERT INTO mcp_tools (
        id, name, description, category, api_endpoint, auth_type, required_scopes, documentation_url, is_public
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      toolId,
      name,
      description,
      category,
      api_endpoint,
      auth_type,
      required_scopes,
      documentation_url,
      is_public
    );

    // Fetch the created tool
    const newTool = sqlite.prepare('SELECT * FROM mcp_tools WHERE id = ?').get(toolId) as MCPTool;

    return NextResponse.json({ tool: newTool }, { status: 201 });
  } catch (error) {
    console.error('Error creating tool:', error);
    return NextResponse.json({ error: 'Failed to create tool' }, { status: 500 });
  }
}