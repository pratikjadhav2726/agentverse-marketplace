import { NextRequest, NextResponse } from 'next/server';
import { a2aService } from '@/lib/a2a-service';
import { AgentDiscoveryQuery } from '@/lib/schema';

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

    let agentCards;

    if (agentId) {
      // Get specific agent card
      const allCards = a2aService.getAvailableAgents();
      agentCards = allCards.filter(card => card.id === agentId);
      
      if (agentCards.length === 0) {
        return NextResponse.json(
          { error: 'Agent card not found' },
          { status: 404 }
        );
      }
    } else {
      // Discover agents based on query parameters
      const discoveryQuery: AgentDiscoveryQuery = {
        capabilities,
        skills,
        categories,
        collaborationEnabled,
        supportedModalities
      };

      agentCards = await a2aService.discoverAgents(discoveryQuery);
    }

    return NextResponse.json({
      agent_cards: agentCards,
      total: agentCards.length,
      protocol_version: 'A2A-1.0',
      generated_at: new Date().toISOString(),
      discovery_enabled: true,
      collaboration_supported: true
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