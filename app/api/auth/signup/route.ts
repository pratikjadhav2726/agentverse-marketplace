import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { email, name, role } = await request.json()

    if (!email || !name || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check for existing user
    const { data: existingUser, error: findError } = await supabase.from('users').select('*').eq('email', email).single();
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    // Insert new user
    const { data: newUser, error: insertError } = await supabase.from('users').insert([
      { email, name, role }
    ]).select().single();
    if (insertError || !newUser) {
      return NextResponse.json({ error: insertError?.message || "Failed to create user" }, { status: 500 })
    }

    return NextResponse.json({ user: newUser }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
} 