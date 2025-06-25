import { type NextRequest, NextResponse } from "next/server"
import { workflowEngine } from "@/lib/workflow-engine"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const workflow = workflowEngine.getWorkflow(params.id)

  if (!workflow) {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 })
  }

  return NextResponse.json({ workflow })
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const workflow = workflowEngine.getWorkflow(params.id)

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 })
    }

    const updatedWorkflow = {
      ...workflow,
      ...body,
      updatedAt: new Date(),
    }

    workflowEngine.saveWorkflow(updatedWorkflow)

    return NextResponse.json({ workflow: updatedWorkflow })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update workflow" }, { status: 500 })
  }
}
