import { NextRequest, NextResponse } from 'next/server';
import { sqlite } from '../../../../lib/database';
import { Agent } from '../../../../lib/schema';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get agent details
    const agent = sqlite.prepare('SELECT * FROM agents WHERE id = ?').get(id) as Agent;
    
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Get owner information
    const owner = sqlite.prepare('SELECT name, email FROM users WHERE id = ?').get(agent.owner_id) as { name: string; email: string };

    // Get tools used by this agent
    const tools = sqlite.prepare(`
      SELECT mt.*, at.required_permissions, at.usage_description
      FROM mcp_tools mt
      JOIN agent_tools at ON mt.id = at.tool_id
      WHERE at.agent_id = ?
    `).all(id);

    // Get reviews for this agent
    const reviews = sqlite.prepare(`
      SELECT r.*, u.name as user_name 
      FROM reviews r 
      JOIN users u ON r.user_id = u.id 
      WHERE r.agent_id = ? 
      ORDER BY r.created_at DESC
    `).all(id);

    // Get examples for this agent
    let examples: any[] = [];
    try {
      examples = sqlite.prepare(`SELECT description, input, output FROM agent_examples WHERE agent_id = ?`).all(id).map((ex: any) => ({
        description: ex.description,
        input: JSON.parse(ex.input),
        output: JSON.parse(ex.output)
      }));
    } catch (e) {
      examples = [];
    }

    // Calculate average rating
    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length 
      : 0;

    return NextResponse.json({
      agent: {
        ...agent,
        owner,
        tools,
        tool_count: tools.length,
        reviews,
        averageRating: avgRating,
        reviewCount: reviews.length,
        examples // <-- add examples to response
      }
    });
  } catch (error) {
    console.error('Error fetching agent:', error);
    return NextResponse.json({ error: 'Failed to fetch agent' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      name,
      description,
      price_per_use_credits,
      price_subscription_credits,
      price_one_time_credits,
      category,
      tags,
      demo_url,
      documentation,
      status
    } = body;

    // Check if agent exists
    const existingAgent = sqlite.prepare('SELECT owner_id FROM agents WHERE id = ?').get(id) as { owner_id: string };
    
    if (!existingAgent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Update agent
    const stmt = sqlite.prepare(`
      UPDATE agents SET 
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        price_per_use_credits = COALESCE(?, price_per_use_credits),
        price_subscription_credits = COALESCE(?, price_subscription_credits),
        price_one_time_credits = COALESCE(?, price_one_time_credits),
        category = COALESCE(?, category),
        tags = COALESCE(?, tags),
        demo_url = COALESCE(?, demo_url),
        documentation = COALESCE(?, documentation),
        status = COALESCE(?, status)
      WHERE id = ?
    `);

    stmt.run(
      name,
      description,
      price_per_use_credits,
      price_subscription_credits,
      price_one_time_credits,
      category,
      tags,
      demo_url,
      documentation,
      status,
      id
    );

    // Fetch updated agent
    const updatedAgent = sqlite.prepare('SELECT * FROM agents WHERE id = ?').get(id) as Agent;

    return NextResponse.json({ agent: updatedAgent });
  } catch (error) {
    console.error('Error updating agent:', error);
    return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if agent exists
    const existingAgent = sqlite.prepare('SELECT owner_id FROM agents WHERE id = ?').get(id) as { owner_id: string };
    
    if (!existingAgent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Soft delete by updating status
    sqlite.prepare('UPDATE agents SET status = ? WHERE id = ?').run('deleted', id);

    return NextResponse.json({ message: 'Agent deleted successfully' });
  } catch (error) {
    console.error('Error deleting agent:', error);
    return NextResponse.json({ error: 'Failed to delete agent' }, { status: 500 });
  }
} 