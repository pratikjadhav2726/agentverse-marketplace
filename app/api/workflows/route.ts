import { type NextRequest, NextResponse } from "next/server"
import { workflowEngine } from "@/lib/workflow-engine"
import type { Workflow } from "@/lib/workflow-types"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 })
  }

  const workflows = workflowEngine.getUserWorkflows(userId)
  return NextResponse.json({ workflows })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, userId, nodes, edges } = body

    const workflow: Workflow = {
      id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      userId,
      nodes: nodes || [],
      edges: edges || [],
      status: "draft",
      createdAt: new Date(),
      updatedAt: new Date(),
      executionHistory: [],
    }

    workflowEngine.saveWorkflow(workflow)

    return NextResponse.json({ workflow })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create workflow" }, { status: 500 })
  }
}
