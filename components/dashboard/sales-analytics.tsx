"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Bot, 
  Users, 
  Star,
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface AnalyticsData {
  totalEarnings: number
  periodEarnings: number
  totalAgents: number
  activeAgents: number
  totalSales: number
  periodSales: number
  topAgents: Array<{
    id: string
    name: string
    price_per_use_credits: number
    sales_count: number
    earnings: number
    avg_rating: number
    review_count: number
  }>
  monthlyTrend: Array<{
    month: string
    earnings: number
  }>
  recentTransactions: Array<{
    id: string
    amount: number
    agent_name: string
    buyer_name: string
    created_at: string
  }>
  payoutRequests: Array<{
    id: string
    amount: number
    status: string
    created_at: string
  }>
  period: {
    days: number
    startDate: string
    endDate: string
  }
}

interface SalesAnalyticsProps {
  userId: string
}

export function SalesAnalytics({ userId }: SalesAnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("30")
  const { toast } = useToast()

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/seller/analytics?days=${period}`)
      if (response.ok) {
        const analyticsData = await response.json()
        setData(analyticsData)
      } else {
        throw new Error("Failed to fetch analytics")
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      })
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
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-blue-100 text-blue-800'
      case 'paid': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Sales Analytics</h2>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
                <p className="text-xs text-muted-foreground">Loading...</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    )
  }

  const earningsChange = data.periodEarnings > 0 ? "up" : "down"
  const salesChange = data.periodSales > 0 ? "up" : "down"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sales Analytics</h2>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalEarnings)}</div>
            <p className="text-xs text-muted-foreground">
              All time earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Period Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.periodEarnings)}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <span className={`mr-1 ${earningsChange === "up" ? "text-green-600" : "text-red-600"}`}>
                {earningsChange === "up" ? "↗" : "↘"}
              </span>
              Last {data.period.days} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalSales}</div>
            <p className="text-xs text-muted-foreground">
              {data.periodSales} in last {data.period.days} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeAgents}</div>
            <p className="text-xs text-muted-foreground">
              of {data.totalAgents} total agents
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Agents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Top Performing Agents
          </CardTitle>
          <CardDescription>
            Your best-selling agents by earnings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.topAgents.map((agent, index) => (
              <div key={agent.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold">{agent.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{agent.sales_count} sales</span>
                      <span>•</span>
                      <span>{agent.price_per_use_credits} credits per use</span>
                      {agent.avg_rating > 0 && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{agent.avg_rating.toFixed(1)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">
                    {formatCurrency(agent.earnings)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {agent.review_count} reviews
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Transactions
          </CardTitle>
          <CardDescription>
            Latest commission earnings from agent sales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{transaction.agent_name}</div>
                  <div className="text-sm text-muted-foreground">
                    Sold to {transaction.buyer_name || 'Unknown'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(transaction.created_at)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">
                    +{formatCurrency(transaction.amount)}
                  </div>
                  <Badge variant="secondary">Commission</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payout Requests */}
      {data.payoutRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Payout Requests
            </CardTitle>
            <CardDescription>
              Your recent payout requests and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.payoutRequests.map((payout) => (
                <div key={payout.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{formatCurrency(payout.amount)}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(payout.created_at)}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(payout.status)}>
                      {payout.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 