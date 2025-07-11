"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Transaction } from "@/lib/types"
import { useRouter } from "next/navigation"
import { SalesAnalytics } from "@/components/dashboard/sales-analytics"
import { PayoutManager } from "@/components/dashboard/payout-manager"
import { AgentManager } from "@/components/dashboard/agent-manager"
import { 
  DollarSign, 
  TrendingUp, 
  Bot, 
  ShoppingCart, 
  Users, 
  Star,
  Plus,
  Settings,
  BarChart3,
  CreditCard,
  Calendar,
  Activity
} from "lucide-react"
import Link from "next/link"

interface SellerStats {
  totalEarnings: number
  periodEarnings: number
  totalAgents: number
  activeAgents: number
  totalSales: number
  periodSales: number
  availableBalance: number
}

export default function SellerDashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<SellerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "user")) {
      router.push("/dashboard")
      return
    }

    if (user) {
      fetchSellerData()
    }
  }, [user, authLoading, router])

  const fetchSellerData = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      // Fetch transactions
      const transactionsRes = await fetch("/api/seller/transactions")
      if (transactionsRes.ok) {
        const transactionsData: Transaction[] = await transactionsRes.json()
        setTransactions(transactionsData)
      }

      // Fetch analytics for stats
      const analyticsRes = await fetch("/api/seller/analytics?days=30")
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json()
        setStats({
          totalEarnings: analyticsData.totalEarnings,
          periodEarnings: analyticsData.periodEarnings,
          totalAgents: analyticsData.totalAgents,
          activeAgents: analyticsData.activeAgents,
          totalSales: analyticsData.totalSales,
          periodSales: analyticsData.periodSales,
          availableBalance: user.credits || 0
        })
      }
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Could not load your dashboard data.",
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

  if (authLoading || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Sales Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.email}!</p>
          </div>
          <div className="flex gap-2">
            <Link href="/seller/agents/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Agent
              </Button>
            </Link>
            <Link href="/seller/agents">
              <Button variant="outline">
                <Bot className="h-4 w-4 mr-2" />
                Manage Agents
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalEarnings)}</div>
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
              <div className="text-2xl font-bold">{formatCurrency(stats.periodEarnings)}</div>
              <p className="text-xs text-muted-foreground">
                Last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSales}</div>
              <p className="text-xs text-muted-foreground">
                {stats.periodSales} in last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeAgents}</div>
              <p className="text-xs text-muted-foreground">
                of {stats.totalAgents} total agents
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="payouts" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payouts
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            My Agents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          <SalesAnalytics userId={user.id} />
        </TabsContent>

        <TabsContent value="payouts" className="space-y-6">
          <PayoutManager 
            userId={user.id} 
            availableBalance={stats?.availableBalance || 0} 
          />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Transactions
              </CardTitle>
              <CardDescription>
                Your recent sales and commission earnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Loading transactions...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.length > 0 ? (
                      transactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell>{formatDate(tx.createdAt)}</TableCell>
                                                 <TableCell>
                         <Badge variant={tx.type === "purchase" ? "default" : "secondary"}>
                           {tx.type}
                         </Badge>
                       </TableCell>
                       <TableCell>{tx.description}</TableCell>
                       <TableCell className="text-right">
                         {tx.type === "purchase" ? "+" : "-"}
                         {tx.amount} Credits
                       </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">
                          No transactions found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <AgentManager userId={user.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
