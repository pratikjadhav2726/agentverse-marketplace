import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase, sqlite } from '../../../lib/database';
import { Agent } from '../../../lib/schema';

// Initialize database on first import
initializeDatabase();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const owner_id = searchParams.get('owner_id');

    let query = 'SELECT * FROM agents WHERE status = ?';
    const params: any[] = ['active'];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ? OR tags LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (owner_id) {
      query += ' AND owner_id = ?';
      params.push(owner_id);
    }

    query += ' ORDER BY created_at DESC';

    const agents = sqlite.prepare(query).all(...params) as Agent[];

    // Get owner information for each agent
    const agentsWithOwners = agents.map(agent => {
      const owner = sqlite.prepare('SELECT name, email FROM users WHERE id = ?').get(agent.owner_id) as { name: string; email: string };
      return {
        ...agent,
        owner: owner
      };
    });

    return NextResponse.json({ agents: agentsWithOwners });
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      owner_id,
      name,
      description,
      price_per_use_credits,
      price_subscription_credits,
      price_one_time_credits,
      category,
      tags,
      demo_url,
      documentation
    } = body;

    // Validate required fields
    if (!owner_id || !name || !price_per_use_credits) {
      return NextResponse.json(
        { error: 'Missing required fields: owner_id, name, price_per_use_credits' },
        { status: 400 }
      );
    }

    // Verify owner exists and is a seller
    const owner = sqlite.prepare('SELECT role FROM users WHERE id = ?').get(owner_id) as { role: string };
    if (!owner || owner.role !== 'seller') {
      return NextResponse.json(
        { error: 'Owner must be a seller' },
        { status: 403 }
      );
    }

    // Generate unique ID
    const agentId = 'agent-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

    // Insert new agent
    const stmt = sqlite.prepare(`
      INSERT INTO agents (
        id, owner_id, name, description, price_per_use_credits,
        price_subscription_credits, price_one_time_credits, category, tags, demo_url, documentation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      agentId,
      owner_id,
      name,
      description,
      price_per_use_credits,
      price_subscription_credits,
      price_one_time_credits,
      category,
      tags,
      demo_url,
      documentation
    );

    // Fetch the created agent
    const newAgent = sqlite.prepare('SELECT * FROM agents WHERE id = ?').get(agentId) as Agent;

    return NextResponse.json({ agent: newAgent }, { status: 201 });
  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
  }
} 