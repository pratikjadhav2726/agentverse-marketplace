"use client"

import { useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Bot } from "lucide-react"

export default function SellerDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || user.role !== "seller")) {
      router.push("/dashboard")
    }
  }, [user, loading, router])

  if (loading) return <div>Loading...</div>
  if (!user || user.role !== "seller") return null

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Seller Dashboard</h1>
        <p className="text-muted-foreground">Manage your AI agents and track your earnings</p>
      </div>

      <div className="text-center py-12">
        <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="text-lg font-semibold mb-2">Seller Dashboard Coming Soon</h3>
        <p className="text-muted-foreground mb-4">
          Full seller features are being developed. You can still access basic functions from your main dashboard.
        </p>
        <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
      </div>
    </div>
  )
}
