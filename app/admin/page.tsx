"use client"

import { useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Shield } from "lucide-react"

export default function AdminPanel() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/dashboard")
    }
  }, [user, loading, router])

  if (loading) return <div>Loading...</div>
  if (!user || user.role !== "admin") return null

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
        <p className="text-muted-foreground">Manage users, agents, and platform settings</p>
      </div>

      <div className="text-center py-12">
        <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="text-lg font-semibold mb-2">Admin Panel Coming Soon</h3>
        <p className="text-muted-foreground mb-4">
          Full admin features are being developed. You can still access basic functions from your main dashboard.
        </p>
        <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
      </div>
    </div>
  )
}
