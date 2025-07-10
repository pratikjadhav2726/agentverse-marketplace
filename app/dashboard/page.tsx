"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { 
  Wallet, 
  ShoppingCart, 
  TrendingUp, 
  Star, 
  Plus,
  CreditCard,
  History,
  Bot,
  DollarSign,
  Settings
} from "lucide-react"
import Link from "next/link"

interface WalletData {
  wallet: {
    id: string;
    user_id: string;
    balance: number;
    updated_at: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  recent_transactions: Array<{
    id: string;
    from_user_id?: string;
    to_user_id?: string;
    agent_id?: string;
    amount: number;
    type: string;
    metadata?: string;
    created_at: string;
    from_user_name?: string;
    to_user_name?: string;
    agent_name?: string;
  }>;
}

interface Purchase {
  id: string;
  user_id: string;
  agent_id: string;
  purchase_type: string;
  created_at: string;
  agent?: {
    id: string;
    name: string;
    description?: string;
    category?: string;
    price_per_use_credits: number;
  };
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [addCreditsAmount, setAddCreditsAmount] = useState("")
  const [creditsEarned, setCreditsEarned] = useState<number>(0);

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Fetch wallet data
      const walletResponse = await fetch(`/api/wallet/${user.id}`)
      if (walletResponse.ok) {
        const walletData = await walletResponse.json()
        setWalletData(walletData)
      }

      // Fetch user's purchases
      const purchasesResponse = await fetch(`/api/purchases?user_id=${user.id}`)
      if (purchasesResponse.ok) {
        const purchasesData = await purchasesResponse.json()
        setPurchases(purchasesData.purchases || [])
      }

      // Fetch credits earned as seller
      const earnedResponse = await fetch(`/api/credits/earned?user_id=${user.id}`)
      if (earnedResponse.ok) {
        const { credits_earned } = await earnedResponse.json()
        setCreditsEarned(credits_earned || 0)
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddCredits = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !addCreditsAmount) return

    const amount = parseInt(addCreditsAmount)
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a positive number",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/wallet/${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, type: 'purchase' }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add credits")
      }

      const result = await response.json()
      
      toast({
        title: "Credits Added!",
        description: `Successfully added ${amount} credits to your wallet.`,
      })

      setAddCreditsAmount("")
      fetchDashboardData() // Refresh data
      
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'purchase': return 'bg-blue-100 text-blue-800'
      case 'use': return 'bg-red-100 text-red-800'
      case 'commission': return 'bg-green-100 text-green-800'
      case 'payout': return 'bg-purple-100 text-purple-800'
      case 'promo': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
        <p className="text-muted-foreground mb-4">You need to be signed in to view your dashboard.</p>
        <Link href="/auth/signin">
          <Button>Sign In</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {(user as any).name || user.email}!</h1>
        <p className="text-muted-foreground">Manage your AI agents and marketplace activity</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{walletData?.wallet.balance || 0} Credits</div>
            <p className="text-xs text-muted-foreground">
              Available for purchases
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Purchased Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{purchases.length}</div>
            <p className="text-xs text-muted-foreground">
              Total agents owned
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Transactions</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{walletData?.recent_transactions.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Last 20 transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Earned</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creditsEarned}</div>
            <p className="text-xs text-muted-foreground">
              Earned from selling agents
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="wallet" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
          <TabsTrigger value="agents">My Agents</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="wallet" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add Credits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add Credits
                </CardTitle>
                <CardDescription>
                  Purchase credits to buy AI agents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddCredits} className="space-y-4">
                  <div>
                    <Label htmlFor="credits">Number of Credits</Label>
                    <Input
                      id="credits"
                      type="number"
                      placeholder="Enter amount"
                      value={addCreditsAmount}
                      onChange={(e) => setAddCreditsAmount(e.target.value)}
                      min="1"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Rate: $1 = 1 Credit
                  </div>
                  <Button type="submit" className="w-full">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Add Credits
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common actions for your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/marketplace">
                  <Button variant="outline" className="w-full justify-start">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Browse Marketplace
                  </Button>
                </Link>
                <Link href="/seller/agents/new">
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Sell Agents
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Account Settings
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Purchased Agents</CardTitle>
              <CardDescription>
                AI agents you own and can use
              </CardDescription>
            </CardHeader>
            <CardContent>
              {purchases.length === 0 ? (
                <div className="text-center py-8">
                  <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No agents purchased yet</p>
                  <Link href="/marketplace">
                    <Button className="mt-4">
                      Browse Marketplace
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {purchases.map((purchase) => (
                    <div key={purchase.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold">{purchase.agent?.name || 'Unknown Agent'}</h3>
                        <p className="text-sm text-muted-foreground">{purchase.agent?.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary">{purchase.purchase_type}</Badge>
                          {purchase.agent?.category && (
                            <Badge variant="outline">{purchase.agent.category}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          Purchased {formatDate(purchase.created_at)}
                        </div>
                        <Link href={`/agents/${purchase.agent_id}`}>
                          <Button size="sm" className="mt-2">
                            Use Agent
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                Recent credit transactions and purchases
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!walletData?.recent_transactions.length ? (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {walletData.recent_transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getTransactionTypeColor(transaction.type)}>
                            {transaction.type}
                          </Badge>
                          {transaction.agent_name && (
                            <span className="text-sm font-medium">{transaction.agent_name}</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(transaction.created_at)}
                        </div>
                        {transaction.from_user_name && transaction.to_user_name && (
                          <div className="text-sm text-muted-foreground">
                            From: {transaction.from_user_name} → To: {transaction.to_user_name}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${
                          transaction.to_user_id === user.id ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.to_user_id === user.id ? '+' : '-'}{transaction.amount} Credits
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          */}
        </div>
      </div>
    </div>
  )
}
