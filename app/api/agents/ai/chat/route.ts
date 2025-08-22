import { NextRequest, NextResponse } from 'next/server'
import { aiOrchestrator } from '@/lib/microservices'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { agent_id, message, session_id, context } = body

    if (!agent_id || !message) {
      return NextResponse.json(
        { error: 'agent_id and message are required' },
        { status: 400 }
      )
    }

    // Chat with AI agent using Python microservice
    const result = await aiOrchestrator.chatWithAgent(
      agent_id,
      message,
      user.id,
      session_id,
      context
    )

    return NextResponse.json({
      success: true,
      response: result.response,
      session_id: result.session_id,
      execution_time: result.execution_time,
      intermediate_steps: result.intermediate_steps,
      timestamp: result.timestamp,
    })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json(
      {
        error: 'Failed to chat with AI agent',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}