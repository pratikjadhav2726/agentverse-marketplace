"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { 
  DollarSign, 
  CreditCard, 
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface PayoutRequest {
  id: string
  amount: number
  status: 'pending' | 'approved' | 'rejected' | 'paid'
  created_at: string
  processed_at?: string
}

interface PayoutManagerProps {
  userId: string
  availableBalance: number
}

export function PayoutManager({ userId, availableBalance }: PayoutManagerProps) {
  const [payoutAmount, setPayoutAmount] = useState("")
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchPayoutRequests()
  }, [])

  const fetchPayoutRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/seller/payout")
      if (response.ok) {
        const data = await response.json()
        setPayoutRequests(data)
      } else {
        throw new Error("Failed to fetch payout requests")
      }
    } catch (error) {
      console.error("Error fetching payout requests:", error)
      toast({
        title: "Error",
        description: "Failed to load payout requests",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePayoutRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!payoutAmount) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a payout amount",
        variant: "destructive",
      })
      return
    }

    const amount = parseInt(payoutAmount, 10)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive number",
        variant: "destructive",
      })
      return
    }

    if (amount > availableBalance) {
      toast({
        title: "Insufficient Balance",
        description: "You cannot request more than your available balance",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch("/api/seller/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Payout Request Submitted",
          description: `Your request for ${amount.toLocaleString()} credits has been submitted successfully.`,
        })
        setPayoutAmount("")
        fetchPayoutRequests() // Refresh the list
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to submit payout request")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'approved': return <CheckCircle className="h-4 w-4 text-blue-500" />
      case 'paid': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const hasPendingRequest = payoutRequests.some(req => req.status === 'pending')

  return (
    <div className="space-y-6">
      {/* Available Balance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Available Balance
          </CardTitle>
          <CardDescription>
            Credits available for payout
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            {availableBalance.toLocaleString()} Credits
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            You can request a payout of up to this amount
          </p>
        </CardContent>
      </Card>

      {/* Request Payout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Request Payout
          </CardTitle>
          <CardDescription>
            Submit a payout request to withdraw your earnings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePayoutRequest} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payout-amount">Payout Amount (Credits)</Label>
              <Input
                id="payout-amount"
                type="number"
                placeholder="Enter amount"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                min="1"
                max={availableBalance}
                disabled={submitting || hasPendingRequest}
              />
              <p className="text-xs text-muted-foreground">
                Maximum: {availableBalance.toLocaleString()} credits
              </p>
            </div>
            
            <Button 
              type="submit" 
              disabled={submitting || hasPendingRequest || !payoutAmount || availableBalance === 0}
              className="w-full"
            >
              {submitting ? "Submitting..." : "Request Payout"}
            </Button>

            {hasPendingRequest && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  You have a pending payout request. Please wait for it to be processed before submitting a new one.
                </p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Payout History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Payout History
          </CardTitle>
          <CardDescription>
            Your recent payout requests and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading...</p>
            </div>
          ) : payoutRequests.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No payout requests yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payoutRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(request.status)}
                    <div>
                      <div className="font-semibold">
                        {request.amount.toLocaleString()} Credits
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Requested {formatDate(request.created_at)}
                      </div>
                      {request.processed_at && (
                        <div className="text-xs text-muted-foreground">
                          Processed {formatDate(request.processed_at)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 