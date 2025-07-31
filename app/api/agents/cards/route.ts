import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { Agent, AgentCard } from '@/lib/schema';

// GET /api/agents/cards - Get all agent cards or specific agent card
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent_id');
    const capabilities = searchParams.get('capabilities')?.split(',');
    const skills = searchParams.get('skills')?.split(',');
    const categories = searchParams.get('categories')?.split(',');
    const collaborationEnabled = searchParams.get('collaboration_enabled') === 'true';
    const supportedModalities = searchParams.get('supported_modalities')?.split(',');

    let query = `
      SELECT 
        a.*,
        u.name as owner_name,
        u.email as owner_email,
        COUNT(DISTINCT at.tool_id) as tool_count,
        COUNT(DISTINCT ca.company_id) as company_count
      FROM agents a
      LEFT JOIN users u ON a.owner_id = u.id
      LEFT JOIN agent_tools at ON a.id = at.agent_id
      LEFT JOIN company_agents ca ON a.id = ca.agent_id
      WHERE a.status = 'active'
    `;

    const params: any[] = [];

    if (agentId) {
      query += ' AND a.id = ?';
      params.push(agentId);
    }

    if (collaborationEnabled) {
      query += ' AND a.collaboration_enabled = 1';
    }

    if (categories && categories.length > 0) {
      query += ' AND a.category IN (' + categories.map(() => '?').join(',') + ')';
      params.push(...categories);
    }

    query += ' GROUP BY a.id ORDER BY a.created_at DESC';

    const stmt = db.prepare(query);
    const agents = stmt.all(...params) as (Agent & { 
      owner_name: string; 
      owner_email: string; 
      tool_count: number;
      company_count: number;
    })[];

    // Filter by capabilities and skills if specified
    let filteredAgents = agents;
    if (capabilities && capabilities.length > 0) {
      filteredAgents = filteredAgents.filter(agent => {
        const agentCapabilities = JSON.parse(agent.capabilities || '[]');
        return capabilities.some(cap => agentCapabilities.includes(cap));
      });
    }

    if (skills && skills.length > 0) {
      filteredAgents = filteredAgents.filter(agent => {
        const agentSkills = JSON.parse(agent.skills || '[]');
        return skills.some(skill => agentSkills.includes(skill));
      });
    }

    if (supportedModalities && supportedModalities.length > 0) {
      filteredAgents = filteredAgents.filter(agent => {
        const agentModalities = JSON.parse(agent.supported_modalities || '["text"]');
        return supportedModalities.some(modality => agentModalities.includes(modality));
      });
    }

    // Convert to A2A Agent Cards format
    const agentCards: AgentCard[] = filteredAgents.map(agent => ({
      id: `card-${agent.id}`,
      agent_id: agent.id,
      name: agent.name,
      description: agent.description || '',
      version: agent.version || '1.0.0',
      service_endpoint_url: agent.service_endpoint_url || `https://api.agentverse.com/agents/${agent.id}`,
      supported_modalities: JSON.parse(agent.supported_modalities || '["text"]'),
      capabilities: JSON.parse(agent.capabilities || '[]'),
      skills: JSON.parse(agent.skills || '[]'),
      authentication_requirements: JSON.parse(agent.authentication_requirements || '{"type": "none"}'),
      input_schema: agent.input_schema ? JSON.parse(agent.input_schema) : {
        type: 'object',
        properties: {
          task: { type: 'string', description: 'Task description' },
          parameters: { type: 'object', description: 'Task parameters' }
        },
        required: ['task']
      },
      output_schema: agent.output_schema ? JSON.parse(agent.output_schema) : {
        type: 'object',
        properties: {
          result: { type: 'string', description: 'Task result' },
          artifacts: { type: 'array', items: { type: 'object' }, description: 'Generated artifacts' }
        }
      },
      pricing: {
        per_use_credits: agent.price_per_use_credits,
        subscription_credits: agent.price_subscription_credits,
        one_time_credits: agent.price_one_time_credits,
        tool_credits_per_use: agent.tool_credits_per_use
      },
      metadata: {
        category: agent.category || 'General',
        tags: agent.tags ? agent.tags.split(',') : [],
        owner_id: agent.owner_id,
        created_at: agent.created_at,
        updated_at: agent.created_at // Using created_at as fallback
      }
    }));

    if (agentId && agentCards.length === 0) {
      return NextResponse.json(
        { error: 'Agent card not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      agent_cards: agentCards,
      total: agentCards.length,
      protocol_version: 'A2A-1.0',
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching agent cards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent cards' },
      { status: 500 }
    );
  }
}

// POST /api/agents/cards - Create or update agent card
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agent_id, ...cardData } = body;

    if (!agent_id) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }

    // Verify agent exists
    const agentStmt = db.prepare('SELECT id FROM agents WHERE id = ?');
    const agent = agentStmt.get(agent_id);

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Update agent with A2A card data
    const updateStmt = db.prepare(`
      UPDATE agents SET
        version = ?,
        service_endpoint_url = ?,
        supported_modalities = ?,
        capabilities = ?,
        skills = ?,
        authentication_requirements = ?,
        input_schema = ?,
        output_schema = ?,
        collaboration_enabled = ?,
        max_concurrent_tasks = ?,
        average_response_time = ?
      WHERE id = ?
    `);

    updateStmt.run(
      cardData.version || '1.0.0',
      cardData.service_endpoint_url,
      JSON.stringify(cardData.supported_modalities || ['text']),
      JSON.stringify(cardData.capabilities || []),
      JSON.stringify(cardData.skills || []),
      JSON.stringify(cardData.authentication_requirements || { type: 'none' }),
      JSON.stringify(cardData.input_schema),
      JSON.stringify(cardData.output_schema),
      cardData.collaboration_enabled ? 1 : 0,
      cardData.max_concurrent_tasks || 1,
      cardData.average_response_time || 5000,
      agent_id
    );

    return NextResponse.json({
      message: 'Agent card updated successfully',
      agent_id,
      updated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating agent card:', error);
    return NextResponse.json(
      { error: 'Failed to update agent card' },
      { status: 500 }
    );
  }
}