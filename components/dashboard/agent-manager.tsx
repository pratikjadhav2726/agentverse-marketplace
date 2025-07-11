"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Bot, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  TrendingUp,
  DollarSign,
  Star,
  Calendar,
  Loader2,
  Settings
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

interface Agent {
  id: string
  name: string
  description?: string
  price_per_use_credits: number
  price_subscription_credits?: number
  price_one_time_credits?: number
  status: string
  category?: string
  tags?: string
  created_at: string
  purchase_count: number
  review_count: number
  average_rating: number
  total_earnings: number
}

interface AgentManagerProps {
  userId: string
}

export function AgentManager({ userId }: AgentManagerProps) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/seller/agents")
      if (response.ok) {
        const data = await response.json()
        setAgents(data)
      } else {
        throw new Error("Failed to fetch agents")
      }
    } catch (error) {
      console.error("Error fetching agents:", error)
      toast({
        title: "Error",
        description: "Failed to load your agents",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredAgents = agents.filter((agent) =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.category?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} Credits`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPricingDisplay = (agent: Agent) => {
    const prices = []
    if (agent.price_per_use_credits) {
      prices.push(`${agent.price_per_use_credits}/use`)
    }
    if (agent.price_subscription_credits) {
      prices.push(`${agent.price_subscription_credits}/month`)
    }
    if (agent.price_one_time_credits) {
      prices.push(`${agent.price_one_time_credits} one-time`)
    }
    return prices.join(", ")
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">My Agents</h2>
          <Link href="/seller/agents/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Agent
            </Button>
          </Link>
        </div>
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your agents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Agents</h2>
        <Link href="/seller/agents/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Agent
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="outline">
          {filteredAgents.length} of {agents.length} agents
        </Badge>
      </div>

      {/* Agents Grid */}
      {filteredAgents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? "No agents found" : "No agents yet"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? "Try adjusting your search terms"
                : "Create your first AI agent to start earning"
              }
            </p>
            <Link href="/seller/agents/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Agent
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAgents.map((agent) => (
            <Card key={agent.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <CardDescription className="mt-2 line-clamp-2">
                      {agent.description || "No description available"}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(agent.status)}>
                    {agent.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Pricing */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pricing</p>
                  <p className="text-sm">{getPricingDisplay(agent)}</p>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Sales</p>
                    <p className="font-semibold">{agent.purchase_count}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Earnings</p>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(agent.total_earnings)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Reviews</p>
                    <p className="font-semibold">{agent.review_count}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Rating</p>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">
                        {agent.average_rating > 0 ? agent.average_rating.toFixed(1) : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Category and Tags */}
                {agent.category && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Category</p>
                    <Badge variant="outline">{agent.category}</Badge>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Link href={`/seller/agents/${agent.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                  <Link href={`/seller/agents/${agent.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                {/* Created Date */}
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  Created {formatDate(agent.created_at)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      {agents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Agent Performance Overview</CardTitle>
            <CardDescription>
              Summary of your agents' performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{agents.length}</div>
                <div className="text-sm text-muted-foreground">Total Agents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {agents.filter(a => a.status === 'active').length}
                </div>
                <div className="text-sm text-muted-foreground">Active Agents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {agents.reduce((sum, agent) => sum + agent.purchase_count, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Sales</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(agents.reduce((sum, agent) => sum + agent.total_earnings, 0))}
                </div>
                <div className="text-sm text-muted-foreground">Total Earnings</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 