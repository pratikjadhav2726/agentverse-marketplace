"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ExternalLink } from "lucide-react"
import type { Agent } from "@/lib/types"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"

// Extend Agent type for extra fields
export type AgentWithExtras = Agent & {
  avatar?: string;
  creator?: string;
};

interface AgentCardProps {
  agent: AgentWithExtras
}

export function AgentCard({ agent }: AgentCardProps) {
  const router = useRouter()
  const { user, refetchUser } = useAuth()
  const { toast } = useToast()

  const handleUseAgent = async () => {
    if (!user) {
      router.push("/auth/signin")
      return
    }
    try {
      const response = await fetch(`/api/agents/${agent.id}/consume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to use agent")
      }
      toast({
        title: "Success!",
        description: `You have successfully used the agent: ${agent.name}.`,
      })
      if (refetchUser) {
        await refetchUser()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow group">
      <CardHeader>
        <div className="flex items-center gap-4">
          {agent.avatar && (
            <img src={agent.avatar} alt={agent.name} className="w-12 h-12 rounded" />
          )}
          <div className="flex-1">
            <Link href={`/agents/${agent.id}`}>
              <CardTitle className="text-lg font-semibold line-clamp-1 hover:text-primary transition-colors cursor-pointer">
                {agent.name}
              </CardTitle>
            </Link>
            {agent.creator && (
              <div className="text-xs text-muted-foreground mt-1">By {agent.creator}</div>
            )}
            <CardDescription className="line-clamp-2 mt-1">{agent.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex items-end">
        <div className="flex items-center">
          <DollarSign className="h-4 w-4 text-green-600" />
          <span className="font-semibold text-lg ml-1">
            {agent.price_per_use_credits ?? "N/A"} Credits
          </span>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Link href={`/agents/${agent.id}`} className="flex-1">
          <Button variant="outline" className="w-full">
            <ExternalLink className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </Link>
        <Button className="flex-1" onClick={handleUseAgent}>
          Use for {agent.price_per_use_credits ?? "N/A"} Credits
        </Button>
      </CardFooter>
    </Card>
  )
}
