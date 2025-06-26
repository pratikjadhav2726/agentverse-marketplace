import { NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { db } from "@/lib/mock-db"

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (user.role !== "seller") {
    return NextResponse.json({ error: "Forbidden: User is not a seller" }, { status: 403 })
  }

  const allAgents = db.agents.getAll()
  const sellerAgents = allAgents.filter((agent) => agent.sellerId === user.id)

  return NextResponse.json(sellerAgents)
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (user.role !== "seller") {
    return NextResponse.json({ error: "Forbidden: User is not a seller" }, { status: 403 })
  }

  try {
    const body = await req.json()

    // Basic validation
    if (!body.basic?.name || !body.pricing?.amount) {
      return NextResponse.json({ error: "Missing required fields: name and price" }, { status: 400 })
    }

    const newAgentData = {
      sellerId: user.id,
      creator: user.name,
      name: body.basic.name,
      description: body.basic.description,
      capabilities: body.technical.capabilities || [],
      a2aEndpoint: body.technical.a2aEndpoint,
      dockerImage: body.technical.dockerImage,
      metadata: {
        version: body.basic.version,
        category: body.basic.category,
        tags: body.basic.tags,
        inputSchema: body.technical.inputSchema,
        outputSchema: body.technical.outputSchema,
      },
      pricing: {
        amount: parseInt(body.pricing.amount, 10),
        currency: "credits" as const,
        type: "one-time" as const,
      },
      documentation: body.documentation.readme || "",
      examples: (body.documentation.examples || []).map((ex: any) => ({
        ...ex,
        input: JSON.parse(ex.input || "{}"),
        output: JSON.parse(ex.output || "{}"),
      })),
    }

    // A simple validation for example JSON might be needed here in a real app
    // For now, we trust the input format from the form

    const createdAgent = db.agents.create(newAgentData)

    return NextResponse.json(createdAgent, { status: 201 })
  } catch (error) {
    console.error("Failed to create agent:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
} 