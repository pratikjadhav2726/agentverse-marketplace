"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Elements } from "@stripe/react-stripe-js"
import { getStripe } from "@/lib/stripe"
import { CheckoutForm } from "@/components/payment/checkout-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const agentId = searchParams.get("agentId")
  const agentName = searchParams.get("agentName")
  const amount = Number.parseInt(searchParams.get("amount") || "0")
  const currency = searchParams.get("currency") || "usd"
  const type = searchParams.get("type") || "one-time"

  useEffect(() => {
    if (!user || !agentId || !agentName || !amount) {
      router.push("/marketplace")
      return
    }

    createPaymentIntent()
  }, [user, agentId, agentName, amount])

  const createPaymentIntent = async () => {
    try {
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          agentName,
          amount,
          currency,
          userId: user?.id,
          type,
        }),
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
        return
      }

      if (data.type === "subscription" && data.sessionId) {
        // Redirect to Stripe Checkout for subscriptions
        const stripe = await getStripe()
        if (stripe) {
          await stripe.redirectToCheckout({ sessionId: data.sessionId })
        }
      } else if (data.clientSecret) {
        setClientSecret(data.clientSecret)
      }
    } catch (err) {
      setError("Failed to initialize payment")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaymentSuccess = () => {
    router.push(`/payment/success?agentId=${agentId}`)
  }

  const handlePaymentError = (error: string) => {
    setError(error)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Setting up payment...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Payment Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!clientSecret) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Payment Setup</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Unable to set up payment. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Complete Your Purchase</CardTitle>
        </CardHeader>
        <CardContent>
          <Elements
            stripe={getStripe()}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
              },
            }}
          >
            <CheckoutForm
              clientSecret={clientSecret}
              agentName={agentName || ""}
              amount={amount}
              currency={currency}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </Elements>
        </CardContent>
      </Card>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  )
}
