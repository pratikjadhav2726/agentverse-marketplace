import { NextRequest, NextResponse } from 'next/server'
import { workflowEngine } from '@/lib/microservices'
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
    const { workflow_id, inputs } = body

    if (!workflow_id || !inputs) {
      return NextResponse.json(
        { error: 'workflow_id and inputs are required' },
        { status: 400 }
      )
    }

    // Execute workflow using Python microservice
    const result = await workflowEngine.executeWorkflow(
      workflow_id,
      inputs,
      user.id
    )

    return NextResponse.json({
      success: true,
      execution_id: result.execution_id,
      status: result.status,
      message: 'Workflow execution started',
    })
  } catch (error) {
    console.error('Workflow execution error:', error)
    return NextResponse.json(
      {
        error: 'Failed to execute workflow',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}