"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Star, Zap, DollarSign, Users, ExternalLink } from "lucide-react"
import type { Agent } from "@/lib/types"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

interface AgentCardProps {
  agent: Agent
  onPurchase?: (agentId: string) => void
  isPurchased?: boolean
}

export function AgentCard({ agent, onPurchase, isPurchased = false }: AgentCardProps) {
  const router = useRouter()
  const { user } = useAuth()

  const formatPrice = (amount: number, currency: string, type: string, interval?: string) => {
    const price = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100)

    if (type === "subscription" && interval) {
      return `${price}/${interval}`
    }
    return price
  }

  const handlePurchase = () => {
    if (!user) {
      router.push("/auth/signin")
      return
    }

    // Redirect to Stripe checkout
    const checkoutUrl = `/payment/checkout?agentId=${agent.id}&agentName=${encodeURIComponent(agent.name)}&amount=${agent.pricing.amount}&currency=${agent.pricing.currency}&type=${agent.pricing.type}`
    router.push(checkoutUrl)
  }

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow group">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Link href={`/agents/${agent.id}`}>
              <CardTitle className="text-lg font-semibold line-clamp-1 hover:text-primary transition-colors cursor-pointer">
                {agent.name}
              </CardTitle>
            </Link>
            <CardDescription className="line-clamp-2 mt-1">{agent.description}</CardDescription>
          </div>
          <Badge variant={agent.status === "active" ? "default" : "secondary"} className="ml-2">
            {agent.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="space-y-4">
          {/* Capabilities */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center">
              <Zap className="h-4 w-4 mr-1" />
              Capabilities
            </h4>
            <div className="flex flex-wrap gap-1">
              {agent.capabilities.slice(0, 3).map((capability, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {capability}
                </Badge>
              ))}
              {agent.capabilities.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{agent.capabilities.length - 3} more
                </Badge>
              )}
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium ml-1">{agent.ratings.average.toFixed(1)}</span>
            </div>
            <span className="text-sm text-muted-foreground flex items-center">
              <Users className="h-3 w-3 mr-1" />
              {agent.ratings.count} reviews
            </span>
          </div>

          {/* Pricing */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="font-semibold text-lg">
                {formatPrice(agent.pricing.amount, agent.pricing.currency, agent.pricing.type, agent.pricing.interval)}
              </span>
            </div>
            <Badge variant="outline">{agent.pricing.type}</Badge>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Link href={`/agents/${agent.id}`} className="flex-1">
          <Button variant="outline" className="w-full">
            <ExternalLink className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </Link>
        {isPurchased ? (
          <Button className="flex-1" variant="secondary" disabled>
            Hired
          </Button>
        ) : (
          <Button className="flex-1" onClick={handlePurchase} disabled={agent.status !== "active"}>
            {agent.pricing.type === "subscription"
              ? "Hire (Subscription)"
              : "Hire (One-Time)"}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
