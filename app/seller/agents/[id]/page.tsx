"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Eye, 
  TrendingUp,
  DollarSign,
  Star,
  Calendar,
  Settings,
  Activity
} from "lucide-react"
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

export default function AgentDetailPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const agentId = params.id as string
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "user")) {
      router.push("/dashboard")
      return
    }

    if (agentId) {
      fetchAgentDetails()
    }
  }, [user, authLoading, router, agentId])

  const fetchAgentDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/seller/agents`)
      if (response.ok) {
        const agents = await response.json()
        const foundAgent = agents.find((a: Agent) => a.id === agentId)
        if (foundAgent) {
          setAgent(foundAgent)
        } else {
          router.push("/seller/agents")
        }
      } else {
        router.push("/seller/agents")
      }
    } catch (error) {
      console.error("Error fetching agent details:", error)
      router.push("/seller/agents")
    } finally {
      setLoading(false)
    }
  }

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

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading agent details...</p>
        </div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Agent Not Found</h1>
          <p className="text-muted-foreground mb-4">The agent you're looking for doesn't exist or you don't have permission to view it.</p>
          <Link href="/seller/agents">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Agents
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/seller/agents">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Agents
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{agent.name}</h1>
              <p className="text-muted-foreground">Agent Details & Performance</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Agent
            </Button>
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              View Public Page
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agent.purchase_count}</div>
            <p className="text-xs text-muted-foreground">
              Total purchases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(agent.total_earnings)}</div>
            <p className="text-xs text-muted-foreground">
              Commission earned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reviews</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agent.review_count}</div>
            <p className="text-xs text-muted-foreground">
              {agent.average_rating > 0 ? `${agent.average_rating.toFixed(1)} avg rating` : 'No ratings yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(agent.status)}>
              {agent.status}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              Created {formatDate(agent.created_at)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Agent Information</CardTitle>
                <CardDescription>
                  Basic details about your agent
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-lg font-semibold">{agent.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-sm">{agent.description || "No description available"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <p className="text-sm">{agent.category || "Uncategorized"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tags</label>
                  <p className="text-sm">{agent.tags || "No tags"}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
                <CardDescription>
                  Current pricing configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Pricing Model</label>
                  <p className="text-sm">{getPricingDisplay(agent)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Per-Use Price</label>
                  <p className="text-lg font-semibold">{agent.price_per_use_credits} Credits</p>
                </div>
                {agent.price_subscription_credits && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Subscription Price</label>
                    <p className="text-lg font-semibold">{agent.price_subscription_credits} Credits/month</p>
                  </div>
                )}
                {agent.price_one_time_credits && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">One-Time Price</label>
                    <p className="text-lg font-semibold">{agent.price_one_time_credits} Credits</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>
                Detailed performance metrics for this agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Performance analytics coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agent Settings</CardTitle>
              <CardDescription>
                Configure your agent's behavior and appearance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Settings configuration coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest purchases, reviews, and interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Activity feed coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 