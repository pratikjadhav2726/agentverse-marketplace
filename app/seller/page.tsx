"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Transaction } from "@/lib/types"
import { useRouter } from "next/navigation"

export default function SellerDashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [payoutAmount, setPayoutAmount] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "seller")) {
      router.push("/dashboard")
      return
    }

    if (user) {
      const fetchSellerData = async () => {
        setLoading(true)
        try {
          const res = await fetch("/api/seller/transactions")
          if (!res.ok) {
            throw new Error("Failed to fetch transactions")
          }
          const data: Transaction[] = await res.json()
          setTransactions(data)

          const earnings = data
            .filter((tx) => tx.type === "earning")
            .reduce((acc, tx) => acc + tx.amount, 0)
          setTotalEarnings(earnings)
        } catch (error) {
          console.error(error)
          toast({
            title: "Error",
            description: "Could not load your transactions.",
            variant: "destructive",
          })
        } finally {
          setLoading(false)
        }
      }
      fetchSellerData()
    }
  }, [user, authLoading, router, toast])

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

  if (authLoading || !user) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Seller Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user.name}!</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Credit Balance</CardTitle>
            <CardDescription>Your current available credits for payout.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.credits?.toLocaleString() ?? 0} Credits</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Earnings</CardTitle>
            <CardDescription>Total credits earned from agent sales.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEarnings.toLocaleString()} Credits</div>
          </CardContent>
        </Card>
        {/* Other stats cards can go here */}
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Request Payout</CardTitle>
          <CardDescription>Request a payout of your available credits.</CardDescription>
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

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your recent sales and payouts.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading transactions...</p>
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
                      <TableCell>{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={tx.type === "earning" ? "default" : "secondary"}>{tx.type}</Badge>
                      </TableCell>
                      <TableCell>{tx.description}</TableCell>
                      <TableCell className="text-right">
                        {tx.type === "earning" ? "+" : "-"}
                        {tx.amount} {tx.currency}
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
    </div>
  )
}
