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
    if (authLoading) return

    if (!user || user.role !== "seller") {
      router.push("/dashboard")
      return
    }
    loadAgents()
  }, [user, authLoading, router])

  const loadAgents = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const response = await fetch("/api/seller/agents")
      if (response.ok) {
        const data = await response.json()
        setAgents(data)
      } else {
        console.error("Failed to load agents")
      }
    } catch (error) {
      console.error("Error loading agents:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusVariant = (status: "pending" | "active" | "rejected") => {
    switch (status) {
      case "active":
        return "default"
      case "pending":
        return "secondary"
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
    rejected: agents.filter((a) => a.status === "rejected").length,
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="mb-2 text-3xl font-bold">My Agents</h1>
          <p className="text-muted-foreground">Manage your AI agents and track their performance</p>
        </div>
        <Button asChild>
          <Link href="/seller/agents/new">
            <Plus className="w-4 h-4 mr-2" />
            Create Agent
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-muted-foreground" />
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
          <TabsTrigger value="rejected">Rejected ({agentCounts.rejected})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredAgents.length > 0 ? (
            filteredAgents.map((agent) => (
              <Card key={agent.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start flex-1 gap-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                        <Bot className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{agent.name}</h3>
                          <Badge variant={getStatusVariant(agent.status)}>{agent.status}</Badge>
                          {agent.metadata.version && (
                            <Badge variant="outline">v{agent.metadata.version}</Badge>
                          )}
                        </div>
                        <p className="mb-3 text-sm text-muted-foreground">{agent.description}</p>

                        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-5">
                          <div>
                            <p className="text-muted-foreground">Price</p>
                            <p className="font-medium">
                              {agent.pricing.amount} {agent.pricing.currency}
                            </p>
                          </div>
                          <div>
                            <p className="flex items-center gap-1 text-muted-foreground">
                              <DollarSign className="w-4 h-4" /> Revenue
                            </p>
                            <p className="font-medium">$--.--</p>
                          </div>
                          <div>
                            <p className="flex items-center gap-1 text-muted-foreground">
                              <TrendingUp className="w-4 h-4" /> Sales
                            </p>
                            <p className="font-medium">--</p>
                          </div>
                          <div>
                            <p className="flex items-center gap-1 text-muted-foreground">
                              <Star className="w-4 h-4" /> Rating
                            </p>
                            <p className="font-medium">{agent.ratings.average.toFixed(1)}</p>
                          </div>
                          <div>
                            <p className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="w-4 h-4" /> Updated
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
                        <Button variant="ghost" className="w-8 h-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Agent
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No agents found for this category.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
