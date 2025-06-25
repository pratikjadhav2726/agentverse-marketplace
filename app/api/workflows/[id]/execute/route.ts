import { NextResponse } from "next/server"
import { workflowEngine } from "@/lib/workflow-engine"

// This is a mock database for storing execution results.
// In a real application, you would use a proper database like Redis or PostgreSQL.
const executionResults = new Map<string, any>()

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const workflowId = params.id
  try {
    const body = await request.json()
    const { workflow, inputs } = body

    if (!workflow) {
      return NextResponse.json({ error: "Workflow data is required" }, { status: 400 })
    }

    // Save the workflow definition to the engine first
    workflowEngine.saveWorkflow(workflow)

    const executionId = await workflowEngine.executeWorkflow(workflow.id, inputs)

    return NextResponse.json({
      message: "Workflow execution started",
      executionId,
      status: "running",
    })
  } catch (error: any) {
    console.error(`Error executing workflow ${workflowId}:`, error)
    return NextResponse.json({ error: "Failed to start workflow execution", details: error.message }, { status: 500 })
  }
}

export async function GET(
    request: Request,
    { params }: { params: { id: string, executionId: string } }
) {
    const { executionId } = params
    const result = workflowEngine.getExecution(executionId)

    if (!result) {
        return NextResponse.json({ error: "Execution not found" }, { status: 404 });
    }

    return NextResponse.json(result);
}
