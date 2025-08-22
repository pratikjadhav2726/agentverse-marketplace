import { NextRequest, NextResponse } from 'next/server'
import { mcpServer } from '@/lib/microservices'
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
    const { tool_name, arguments: toolArguments, agent_id } = body

    if (!tool_name || !toolArguments) {
      return NextResponse.json(
        { error: 'tool_name and arguments are required' },
        { status: 400 }
      )
    }

    // Invoke tool using MCP server
    const result = await mcpServer.invokeTool(
      tool_name,
      toolArguments,
      user.id,
      agent_id
    )

    return NextResponse.json({
      success: result.success,
      result: result.result,
      error: result.error,
      execution_time: result.execution_time,
      timestamp: result.timestamp,
    })
  } catch (error) {
    console.error('Tool invocation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to invoke tool',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}