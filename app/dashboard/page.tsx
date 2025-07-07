"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Bot, DollarSign, Activity, TrendingUp, Users, ShoppingCart, Plus, ExternalLink } from "lucide-react"
import { Transaction } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { useWallet } from "@/hooks/use-wallet";

export default function DashboardPage() {
  const { user, loading, refetchUser } = useAuth()
  const { balance, loading: walletLoading, error: walletError, refetch: refetchWallet } = useWallet(user?.id)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [amount, setAmount] = useState(500)
  const [isBuying, setIsBuying] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(true)

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push("/auth/signin")
      return
    }

    const fetchTransactions = async () => {
      setLoadingTransactions(true)
      try {
        const res = await fetch("/api/dashboard/transactions")
        if (!res.ok) throw new Error("Failed to fetch transactions")
        const data = await res.json()
        setTransactions(data)
      } catch (error) {
        console.error(error)
        toast({ title: "Error", description: "Could not load transactions.", variant: "destructive" })
      } finally {
        setLoadingTransactions(false)
      }
    }

    fetchTransactions()
  }, [user, loading, router, toast])

  useEffect(() => {
    if (searchParams.get("purchase") === "success") {
      toast({
        title: "Purchase Successful!",
        description: "Your credits have been added to your account.",
      })
      if (refetchUser) refetchUser()
      if (refetchWallet) refetchWallet()
    }
  }, [searchParams, toast, refetchUser, refetchWallet])

  const handleBuyCredits = async () => {
    if (!user) return
    setIsBuying(true)
    try {
      const response = await fetch("/api/credits/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, userId: user.id }),
      })
      const { url } = await response.json()
      if (url) {
        window.location.href = url
      } else {
        throw new Error("Could not create Stripe checkout session")
      }
    } catch (error) {
      console.error("Failed to create checkout session:", error)
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" })
    } finally {
      setIsBuying(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user.email}!</p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Your Credits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {walletLoading ? "..." : walletError ? "-" : (balance ?? 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Available balance</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Agents Used</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {transactions.filter((t) => t.type === "usage").length}
                </div>
                <p className="text-xs text-muted-foreground">in the last 30 days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {transactions
                    .filter((t) => t.type === "usage")
                    .reduce((sum, t) => sum + t.amount, 0)}{" "}
                  <span className="text-lg text-muted-foreground">Credits</span>
                </div>
                <p className="text-xs text-muted-foreground">Lifetime spending</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>A log of your recent transactions.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTransactions ? (
                <p>Loading activity...</p>
              ) : transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-2 rounded-full ${
                            tx.type === "purchase" ? "bg-green-100 dark:bg-green-900/50" : "bg-blue-100 dark:bg-blue-900/50"
                          }`}
                        >
                          {tx.type === "purchase" ? (
                            <DollarSign className="h-5 w-5 text-green-600" />
                          ) : (
                            <Bot className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{tx.description}</p>
                          <p className="text-sm text-muted-foreground">{new Date(tx.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <Badge
                        variant={tx.type === "purchase" ? "default" : "secondary"}
                        className={`${
                          tx.type === "purchase" ? "text-green-700" : "text-blue-700"
                        } bg-opacity-20`}
                      >
                        {tx.type === "purchase" ? "+" : "-"} {tx.amount} Credits
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">You have no recent activity.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Buy More Credits</CardTitle>
              <CardDescription>1 USD = 10 Credits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min="100"
                step="100"
                placeholder="Enter amount"
              />
              <Button onClick={handleBuyCredits} disabled={isBuying || amount < 100} className="w-full">
                {isBuying ? "Processing..." : `Buy for $${(amount / 10).toFixed(2)}`}
              </Button>
            </CardContent>
          </Card>
          {/* Always show dashboard cards for now, since user.role is not available */}
          <Card className="bg-secondary/50">
            <CardHeader>
              <CardTitle>Become a Seller</CardTitle>
              <CardDescription>Start selling your own AI agents on the marketplace.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/seller">
                <Button className="w-full">Go to Seller Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
          <Card className="bg-secondary/50">
            <CardHeader>
              <CardTitle>Seller Dashboard</CardTitle>
              <CardDescription>Manage your agents and track your earnings.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/seller">
                <Button className="w-full">Go to Seller Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
