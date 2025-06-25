import { type NextRequest, NextResponse } from "next/server"
import { workflowEngine } from "@/lib/workflow-engine"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const execution = workflowEngine.getExecution(params.id)

  if (!execution) {
    return NextResponse.json({ error: "Execution not found" }, { status: 404 })
  }

  return NextResponse.json({ execution })
}
