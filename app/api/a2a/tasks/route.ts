import { NextRequest, NextResponse } from 'next/server';
import { a2aService } from '@/lib/a2a-service';

// GET /api/a2a/tasks - Get tasks or specific task
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('task_id');
    const userId = searchParams.get('user_id');
    const agentId = searchParams.get('agent_id');
    const status = searchParams.get('status');

    if (taskId) {
      // Get specific task
      const task = await a2aService.getTaskStatus(taskId);
      if (!task) {
        return NextResponse.json(
          { error: 'Task not found' },
          { status: 404 }
        );
      }

      // Get task messages and artifacts
      const messages = await a2aService.getTaskMessages(taskId);
      const artifacts = await a2aService.getTaskArtifacts(taskId);

      return NextResponse.json({
        task,
        messages,
        artifacts,
        protocol_version: 'A2A-1.0'
      });
    }

    // Get multiple tasks with filters
    // For now, return empty array as we'd need to implement database filtering
    // In a full implementation, this would query the database with filters
    return NextResponse.json({
      tasks: [],
      total: 0,
      filters: { userId, agentId, status },
      protocol_version: 'A2A-1.0'
    });

  } catch (error) {
    console.error('Error fetching A2A tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// POST /api/a2a/tasks - Create new task (delegate to agent)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      target_agent_id,
      title,
      description,
      input_data,
      user_id,
      priority = 'medium',
      estimated_credits = 10
    } = body;

    if (!target_agent_id || !title) {
      return NextResponse.json(
        { error: 'target_agent_id and title are required' },
        { status: 400 }
      );
    }

    // Delegate task using A2A service
    const result = await a2aService.delegateTask(target_agent_id, {
      title,
      description,
      inputData: input_data,
      userId: user_id,
      priority,
      estimatedCredits: estimated_credits
    });

    return NextResponse.json({
      message: 'Task delegated successfully',
      task_id: result.taskId,
      status: result.status,
      target_agent_id,
      estimated_credits,
      protocol_version: 'A2A-1.0',
      created_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error creating A2A task:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create task' },
      { status: 500 }
    );
  }
}