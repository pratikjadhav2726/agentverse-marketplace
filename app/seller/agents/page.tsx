"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
  Users,
  Star,
  Calendar,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import type { Agent } from "@/lib/types"

export default function SellerAgentsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== "seller") {
        router.push("/dashboard")
      } else {
        loadAgents()
      }
    }
  }, [user, authLoading, router])

  const loadAgents = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const response = await fetch("/api/seller/agents", {
        headers: {
          "user-id": user.id,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setAgents(data)
      } else {
        // Handle error, maybe show a toast
        console.error("Failed to load agents")
      }
    } catch (error) {
      console.error("Error loading agents:", error)
    } finally {
      setIsLoading(false)
    }
  }

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

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "pending":
        return "secondary"
      case "approved":
        return "outline"
      case "draft":
        return "outline"
      case "suspended":
      case "rejected":
        return "destructive"
      default:
        return "outline"
    }
  }

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab = activeTab === "all" || agent.status === activeTab
    return matchesSearch && matchesTab
  })

  const agentCounts = {
    all: agents.length,
    active: agents.filter((a) => a.status === "active").length,
    pending: agents.filter((a) => a.status === "pending").length,
    draft: agents.filter((a) => a.status === "draft").length,
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    )
  }

  if (!user || user.role !== "seller") return null

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Agents</h1>
          <p className="text-muted-foreground">Manage your AI agents and track their performance</p>
        </div>
        <Button asChild>
          <Link href="/seller/agents/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Agent
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search your agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All ({agentCounts.all})</TabsTrigger>
          <TabsTrigger value="active">Active ({agentCounts.active})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({agentCounts.pending})</TabsTrigger>
          <TabsTrigger value="draft">Draft ({agentCounts.draft})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredAgents.length > 0 ? (
            filteredAgents.map((agent) => (
              <Card key={agent.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Bot className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{agent.name}</h3>
                          <Badge variant={getStatusVariant(agent.status)}>{agent.status}</Badge>
                          {agent.metadata.version && <Badge variant="outline">v{agent.metadata.version}</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{agent.description}</p>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Price</p>
                            <p className="font-medium">
                              {formatPrice(
                                agent.pricing.amount,
                                agent.pricing.currency,
                                agent.pricing.type,
                                agent.pricing.interval
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground flex items-center gap-1">
                              <DollarSign className="h-4 w-4" /> Revenue
                            </p>
                            {/* Mocking revenue for now */}
                            <p className="font-medium">$--.--</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground flex items-center gap-1">
                              <TrendingUp className="h-4 w-4" /> Sales
                            </p>
                             {/* Mocking sales for now */}
                            <p className="font-medium">--</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground flex items-center gap-1">
                              <Star className="h-4 w-4" /> Rating
                            </p>
                            <p className="font-medium">{agent.ratings.average.toFixed(1)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-4 w-4" /> Updated
                            </p>
                            <p className="font-medium">
                              {new Date(agent.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Agent
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No agents found for this category.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
