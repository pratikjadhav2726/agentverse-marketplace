"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Bot, ArrowRight, Download } from "lucide-react"
import Link from "next/link"

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)

  const agentId = searchParams.get("agentId")
  const sessionId = searchParams.get("session_id")

  useEffect(() => {
    // Verify payment success
    const verifyPayment = async () => {
      if (sessionId) {
        // Handle subscription success
        // You would verify the session and update the database
        console.log("Subscription payment successful:", sessionId)
      }
      setIsLoading(false)
    }

    verifyPayment()
  }, [sessionId])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="text-center mb-8">
        <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
        <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
        <p className="text-muted-foreground">Thank you for your purchase. You now have access to your new AI agent.</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            What's Next?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button asChild className="h-auto p-4">
              <Link href={`/agents/${agentId}`}>
                <div className="text-left">
                  <div className="font-semibold">Explore Your Agent</div>
                  <div className="text-sm opacity-90">Test features and capabilities</div>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Link>
            </Button>

            <Button variant="outline" asChild className="h-auto p-4">
              <Link href="/workflows">
                <div className="text-left">
                  <div className="font-semibold">Create Workflows</div>
                  <div className="text-sm opacity-90">Build agent collaborations</div>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Link>
            </Button>

            <Button variant="outline" asChild className="h-auto p-4">
              <Link href="/purchases">
                <div className="text-left">
                  <div className="font-semibold">View Purchases</div>
                  <div className="text-sm opacity-90">Manage your agents</div>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Link>
            </Button>

            <Button variant="outline" className="h-auto p-4">
              <div className="text-left">
                <div className="font-semibold">Download Receipt</div>
                <div className="text-sm opacity-90">Get your invoice</div>
              </div>
              <Download className="h-4 w-4 ml-auto" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Need help getting started? Check out our documentation or contact support.
        </p>
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/help">Documentation</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/contact">Contact Support</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
