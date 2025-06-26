"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot, CreditCard, DollarSign, Package } from "lucide-react"
import type { Transaction } from "@/lib/types"
import { db } from "@/lib/mock-db"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"

export default function SellerDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState({ totalAgents: 0, totalEarnings: 0 })
  const [payoutAmount, setPayoutAmount] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    if (!loading && (!user || user.role !== "seller")) {
      router.push("/dashboard")
    }

    if (user) {
      // Mock data fetching
      const userTransactions = db.transactions.findForUser(user.id)
      const userAgents = db.agents.getAll().filter((a) => a.sellerId === user.id)
      const totalEarnings = userTransactions
        .filter((t) => t.type === "earning")
        .reduce((sum, t) => sum + t.amount, 0)

      setTransactions(userTransactions.slice(0, 5)) // show latest 5
      setStats({
        totalAgents: userAgents.length,
        totalEarnings,
      })
    }
  }, [user, loading, router])

  const handlePayoutRequest = async () => {
    if (!user || !payoutAmount) return
    const amount = parseInt(payoutAmount, 10)

    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payout amount.",
        variant: "destructive",
      })
      return
    }

    if (amount > (user.credits ?? 0)) {
      toast({
        title: "Insufficient Balance",
        description: "You cannot request a payout greater than your available credit balance.",
        variant: "destructive",
      })
      return
    }

    // In a real application, this would trigger a backend process
    // to handle the payout via Stripe Connect or another service.
    // For this mock, we'll just show a success message.
    console.log(`Payout requested for ${amount} credits for user ${user.id}`)

    toast({
      title: "Payout Request Successful",
      description: `Your request to pay out ${amount} credits has been submitted.`,
    })

    // Optionally, clear the input and maybe disable the button
    setPayoutAmount("")
  }

  if (loading || !user || user.role !== "seller") {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Seller Dashboard</h1>
        <p className="text-muted-foreground">Manage your AI agents and track your earnings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEarnings} Credits</div>
            <p className="text-xs text-muted-foreground">Equivalent to ${(stats.totalEarnings * 0.1).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.credits} Credits</div>
            <p className="text-xs text-muted-foreground">Available for payout or use</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Listed Agents</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAgents}</div>
            <p className="text-xs text-muted-foreground">Active on the marketplace</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest credit earnings.</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((t) => (
                  <div key={t.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{t.description}</p>
                      <p className="text-sm text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</p>
                    </div>
                    <Badge variant={t.type === "earning" ? "default" : "destructive"}>
                      {t.amount > 0 ? `+${t.amount}` : t.amount} {t.currency}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No recent transactions.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payouts</CardTitle>
            <CardDescription>Withdraw your earnings.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="max-w-xs"
                />
                <Button onClick={handlePayoutRequest} disabled={!payoutAmount || !user || (user.credits ?? 0) === 0}>
                  Request Payout
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Payouts will be processed via Stripe Connect. Ensure your account is set up.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
