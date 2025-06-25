"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Bot,
  Search,
  Calendar,
  DollarSign,
  Download,
  RefreshCw,
  ExternalLink,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import type { Purchase, Agent } from "@/lib/types"

interface PurchasedAgent extends Purchase {
  agent: Agent
}

export default function PurchasesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [purchases, setPurchases] = useState<PurchasedAgent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/auth/signin")
      } else {
        loadPurchases()
      }
    }
  }, [user, authLoading, router])

  const loadPurchases = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const response = await fetch(`/api/purchased-agents?userId=${user.id}`)

      if (response.ok) {
        const data = await response.json()
        setPurchases(data.purchasedAgents || [])
      } else {
        console.error("Failed to load purchased agents")
        setPurchases([])
      }
    } catch (error) {
      console.error("Error loading purchased agents:", error)
      setPurchases([])
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "refunded":
        return <RefreshCw className="h-4 w-4 text-gray-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default"
      case "refunded":
        return "outline"
      case "failed":
        return "destructive"
      case "pending":
        return "secondary"
      default:
        return "outline"
    }
  }

  const filteredPurchases = purchases.filter((purchase) => {
    const agentName = purchase.agent ? purchase.agent.name.toLowerCase() : ""
    const matchesSearch = agentName.includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || purchase.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Owned Agents</h1>
        <p className="text-muted-foreground">Manage your hired agents and active subscriptions</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search your agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Hires ({filteredPurchases.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredPurchases.length > 0 ? (
            filteredPurchases.map((purchasedAgent) =>
              purchasedAgent.agent ? (
                <Card key={purchasedAgent.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-start gap-6">
                      <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <Link href={`/agents/${purchasedAgent.agent.id}`}>
                            <h3 className="font-semibold text-lg hover:text-primary">
                              {purchasedAgent.agent.name}
                            </h3>
                          </Link>
                          <Badge variant={getStatusVariant(purchasedAgent.status)}>
                            {purchasedAgent.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {purchasedAgent.agent.description}
                        </p>
                        <div className="border-t my-4"></div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Hired On</p>
                            <p className="font-medium flex items-center gap-1 mt-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(purchasedAgent.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Price</p>
                            <p className="font-medium flex items-center gap-1 mt-1">
                              <DollarSign className="h-4 w-4" />
                              {formatPrice(purchasedAgent.amount, purchasedAgent.currency)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Rating</p>
                            <div className="flex items-center gap-1 mt-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < purchasedAgent.agent.ratings.average
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Invoice</p>
                            <Button variant="outline" size="sm" className="mt-1">
                              <Download className="h-3 w-3 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : null
            )
          ) : (
            <div className="text-center py-16">
              <Bot className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold">You haven't hired any agents yet</h3>
              <p className="text-muted-foreground mt-2 mb-6">
                Explore the marketplace to find agents that fit your needs.
              </p>
              <Button asChild>
                <Link href="/marketplace">
                  <Search className="h-4 w-4 mr-2" />
                  Explore Marketplace
                </Link>
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
