"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, DollarSign, TrendingUp, Users, Bot, Activity, Plus, ExternalLink, CreditCard } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [creditAmount, setCreditAmount] = useState(100)
  const [isBuyingCredits, setIsBuyingCredits] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (searchParams.get("purchase_success")) {
      toast({
        title: "Credits Purchased!",
        description: `Successfully added ${searchParams.get("amount")} credits to your account.`,
        variant: "default",
      })
      // Clean up URL
      router.replace("/dashboard", undefined)
    }
  }, [searchParams, toast, router])

  const handleBuyCredits = async () => {
    const currentUser = user
    if (!currentUser) return

    setIsBuyingCredits(true)
    try {
      const response = await fetch("/api/credits/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          email: currentUser.email,
          amount: creditAmount,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create checkout session")
      }

      const { sessionId } = await response.json()
      const stripe = (await import("@stripe/stripe-js")).loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
      )

      if (stripe) {
        ;(await stripe).redirectToCheckout({ sessionId })
      }
    } catch (error) {
      console.error("Failed to buy credits:", error)
      toast({
        title: "Error",
        description: "Failed to initiate credit purchase. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsBuyingCredits(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const userRole = user.role

  // Mock data - replace with actual API calls
  const buyerStats = {
    purchasedAgents: 12,
    totalSpent: 1299.99,
    activeCollaborations: 3,
    successfulTasks: 847,
  }

  const sellerStats = {
    listedAgents: 5,
    totalEarnings: 2450.0,
    activePurchases: 23,
    avgRating: 4.7,
  }

  const adminStats = {
    totalUsers: 1247,
    totalAgents: 89,
    totalTransactions: 3421,
    platformRevenue: 45230.0,
  }

  const recentPurchases = [
    { id: "1", agentName: "Data Analyst Pro", amount: 49.99, date: "2024-01-15" },
    { id: "2", agentName: "Content Generator", amount: 99.99, date: "2024-01-14" },
    { id: "3", agentName: "Code Review Assistant", amount: 29.99, date: "2024-01-12" },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}!</h1>
        <p className="text-muted-foreground">Here's what's happening with your {userRole} account</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {userRole === "buyer" && (
          <>
            <StatsCard
              title="Your Credits"
              value={user.credits}
              icon={CreditCard}
              description="Available credits for agents"
            />
            <StatsCard
              title="Purchased Agents"
              value={buyerStats.purchasedAgents}
              icon={Bot}
              trend={{ value: 12, isPositive: true }}
            />
            <StatsCard
              title="Total Spent"
              value={`$${buyerStats.totalSpent.toFixed(2)}`}
              icon={DollarSign}
              trend={{ value: 8, isPositive: false }}
            />
            <StatsCard
              title="Active Collaborations"
              value={buyerStats.activeCollaborations}
              icon={Activity}
              description="Running A2A sessions"
            />
            <StatsCard
              title="Successful Tasks"
              value={buyerStats.successfulTasks}
              icon={TrendingUp}
              trend={{ value: 23, isPositive: true }}
            />
          </>
        )}

        {userRole === "seller" && (
          <>
            <StatsCard
              title="Your Credits"
              value={user.credits}
              icon={CreditCard}
              description="Available for use or payout"
            />
            <StatsCard
              title="Listed Agents"
              value={sellerStats.listedAgents}
              icon={Bot}
              trend={{ value: 25, isPositive: true }}
            />
            <StatsCard
              title="Total Earnings"
              value={`$${sellerStats.totalEarnings.toFixed(2)}`}
              icon={DollarSign}
              trend={{ value: 15, isPositive: true }}
            />
            <StatsCard
              title="Active Purchases"
              value={sellerStats.activePurchases}
              icon={ShoppingCart}
              description="Current subscribers"
            />
            <StatsCard
              title="Average Rating"
              value={sellerStats.avgRating}
              icon={TrendingUp}
              trend={{ value: 5, isPositive: true }}
            />
          </>
        )}

        {userRole === "admin" && (
          <>
            <StatsCard
              title="Total Users"
              value={adminStats.totalUsers}
              icon={Users}
              trend={{ value: 18, isPositive: true }}
            />
            <StatsCard
              title="Total Agents"
              value={adminStats.totalAgents}
              icon={Bot}
              trend={{ value: 12, isPositive: true }}
            />
            <StatsCard
              title="Transactions"
              value={adminStats.totalTransactions}
              icon={ShoppingCart}
              trend={{ value: 22, isPositive: true }}
            />
            <StatsCard
              title="Platform Revenue"
              value={`$${adminStats.platformRevenue.toFixed(2)}`}
              icon={DollarSign}
              trend={{ value: 28, isPositive: true }}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Buy Credits */}
        {userRole !== "admin" && (
          <Card>
            <CardHeader>
              <CardTitle>Buy Credits</CardTitle>
              <CardDescription>Add credits to your account to use agents.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <span className="font-bold text-2xl">{creditAmount}</span>
                <span className="text-muted-foreground">Credits</span>
              </div>
              <Input
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(Number(e.target.value))}
                min="10"
                step="10"
                className="mb-4"
              />
              <Button onClick={handleBuyCredits} className="w-full" disabled={isBuyingCredits}>
                {isBuyingCredits ? "Processing..." : `Buy for $${(creditAmount * 0.1).toFixed(2)}`}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">$0.10 per credit</p>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card className={userRole !== "admin" ? "lg:col-span-2" : "lg:col-span-3"}>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              {userRole === "buyer" && "Your recent agent purchases"}
              {userRole === "seller" && "Recent sales of your agents"}
              {userRole === "admin" && "Recent platform activity"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPurchases.map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{purchase.agentName}</p>
                    <p className="text-sm text-muted-foreground">{purchase.date}</p>
                  </div>
                  <Badge variant="outline">${purchase.amount}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userRole === "buyer" && (
                <>
                  <Button className="w-full justify-start" variant="outline" asChild>
                    <Link href="/marketplace">
                      <Plus className="mr-2 h-4 w-4" />
                      Browse Marketplace
                    </Link>
                  </Button>
                  <Button className="w-full justify-start" variant="outline" asChild>
                    <Link href="/workflows">
                      <Activity className="mr-2 h-4 w-4" />
                      Create A2A Collaboration
                    </Link>
                  </Button>
                  <Button className="w-full justify-start" variant="outline" asChild>
                    <Link href="/workflows?tab=agents">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View My Agents
                    </Link>
                  </Button>
                </>
              )}

              {userRole === "seller" && (
                <>
                  <Button className="w-full justify-start" variant="outline" asChild>
                    <Link href="/seller/agents/new">
                      <Plus className="mr-2 h-4 w-4" />
                      List New Agent
                    </Link>
                  </Button>
                  <Button className="w-full justify-start" variant="outline" asChild>
                    <Link href="/seller/analytics">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      View Analytics
                    </Link>
                  </Button>
                  <Button className="w-full justify-start" variant="outline" asChild>
                    <Link href="/seller/payouts">
                      <DollarSign className="mr-2 h-4 w-4" />
                      Manage Payouts
                    </Link>
                  </Button>
                </>
              )}

              {userRole === "admin" && (
                <>
                  <Button className="w-full justify-start" variant="outline" asChild>
                    <Link href="/admin/users">
                      <Users className="mr-2 h-4 w-4" />
                      Manage Users
                    </Link>
                  </Button>
                  <Button className="w-full justify-start" variant="outline" asChild>
                    <Link href="/admin/agents">
                      <Bot className="mr-2 h-4 w-4" />
                      Review Agents
                    </Link>
                  </Button>
                  <Button className="w-full justify-start" variant="outline" asChild>
                    <Link href="/admin/analytics">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Platform Analytics
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
