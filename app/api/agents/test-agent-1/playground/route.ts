import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { input } = await req.json();
  // For the test agent, just echo the input
  return NextResponse.json({ output: `Echo: ${input}` });
} 