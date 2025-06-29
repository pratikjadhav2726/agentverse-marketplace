"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Agent } from "@/lib/types"
import { AgentCard } from "@/components/marketplace/agent-card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function PurchasesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [purchasedAgents, setPurchasedAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push("/auth/signin")
      return
    }

    const fetchPurchasedAgents = async () => {
      setLoading(true)
      try {
        const response = await fetch("/api/purchased-agents")
        if (!response.ok) {
          throw new Error("Failed to fetch purchased agents")
        }
        const data = await response.json()
        setPurchasedAgents(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchPurchasedAgents()
  }, [user, authLoading, router])

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Agents</h1>
        <p>Loading your hired agents...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Agents</h1>
        <Button asChild variant="outline">
          <Link href="/marketplace">Explore Marketplace</Link>
        </Button>
      </div>

      {purchasedAgents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {purchasedAgents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border rounded-lg">
          <h2 className="text-2xl font-semibold mb-2">No Agents Hired Yet</h2>
          <p className="text-muted-foreground mb-4">
            You haven&apos;t used any agents yet. Explore the marketplace to find agents to hire.
          </p>
          <Button asChild>
            <Link href="/marketplace">Go to Marketplace</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
