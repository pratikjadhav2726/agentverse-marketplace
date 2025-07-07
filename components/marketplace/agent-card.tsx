"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ExternalLink, Star } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"

// Updated interface to match our SQLite schema
interface AgentCardProps {
  agent: {
    id: string;
    owner_id: string;
    name: string;
    description: string;
    price_per_use_credits: number;
    price_subscription_credits?: number;
    price_one_time_credits?: number;
    status: string;
    created_at: string;
    category?: string;
    tags?: string;
    demo_url?: string;
    documentation?: string;
    creator?: string;
    avatar?: string;
    averageRating?: number;
    reviewCount?: number;
  }
}

export function AgentCard({ agent }: AgentCardProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  const handlePurchase = async (purchaseType: 'per_use' | 'subscription' | 'one_time') => {
    if (!user) {
      router.push("/auth/signin")
      return
    }

    try {
      const response = await fetch(`/api/agents/${agent.id}/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          user_id: user.id,
          purchase_type: purchaseType
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to purchase agent")
      }

      const result = await response.json()
      
      toast({
        title: "Purchase Successful!",
        description: `You have successfully purchased ${agent.name} for ${result.purchase.amount_paid} credits.`,
      })

      // Optionally redirect to the agent details page or user's purchased agents
      router.push(`/agents/${agent.id}`)
      
    } catch (error) {
      toast({
        title: "Purchase Failed",
        description: (error as Error).message,
        variant: "destructive",
      })
    }
  }

  const formatTags = (tags?: string) => {
    if (!tags) return []
    return tags.split(',').map(tag => tag.trim()).slice(0, 3)
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
            {agent.category && (
              <Badge variant="secondary" className="text-xs mt-1">
                {agent.category}
              </Badge>
            )}
          </div>
        </div>
        <CardDescription className="line-clamp-2 mt-2">{agent.description}</CardDescription>
        
        {/* Tags */}
        {agent.tags && (
          <div className="flex flex-wrap gap-1 mt-2">
            {formatTags(agent.tags).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Rating */}
        {agent.averageRating && agent.reviewCount && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>{agent.averageRating.toFixed(1)}</span>
            <span>({agent.reviewCount} reviews)</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1">
        <div className="space-y-2">
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="font-semibold text-lg ml-1">
              {agent.price_per_use_credits} Credits
            </span>
            <span className="text-sm text-muted-foreground ml-1">per use</span>
          </div>
          
          {/* Additional pricing options */}
          {agent.price_subscription_credits && (
            <div className="text-sm text-muted-foreground">
              Subscription: {agent.price_subscription_credits} credits/month
            </div>
          )}
          
          {agent.price_one_time_credits && (
            <div className="text-sm text-muted-foreground">
              One-time: {agent.price_one_time_credits} credits
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        <div className="flex gap-2 w-full">
          <Link href={`/agents/${agent.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </Link>
          <Button 
            className="flex-1" 
            onClick={() => handlePurchase('per_use')}
            disabled={agent.status !== 'active'}
          >
            Buy ({agent.price_per_use_credits} Credits)
          </Button>
        </div>
        
        {/* Additional purchase options */}
        {(agent.price_subscription_credits || agent.price_one_time_credits) && (
          <div className="flex gap-2 w-full">
            {agent.price_subscription_credits && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => handlePurchase('subscription')}
                disabled={agent.status !== 'active'}
              >
                Subscribe ({agent.price_subscription_credits})
              </Button>
            )}
            {agent.price_one_time_credits && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => handlePurchase('one_time')}
                disabled={agent.status !== 'active'}
              >
                One-time ({agent.price_one_time_credits})
              </Button>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
