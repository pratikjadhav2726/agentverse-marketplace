"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Agent } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle, XCircle, Clock, Users } from "lucide-react"
import Link from "next/link"

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAgents = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/agents")
      if (!res.ok) throw new Error("Failed to fetch agents")
      const data = await res.json()
      setAgents(data)
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "Could not load agents.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading) return
    if (!user || user.role !== "admin") {
      router.push("/dashboard")
      return
    }
    fetchAgents()
  }, [user, authLoading, router, toast])

  const handleUpdateStatus = async (agentId: string, status: "active" | "rejected") => {
    try {
      const response = await fetch(`/api/admin/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update agent status")
      }

      toast({
        title: "Success",
        description: `Agent status updated to ${status}.`,
      })
      fetchAgents() // Refresh the list
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      })
    }
  }

  if (authLoading || !user) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage agents submitted to the marketplace.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Agents</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents.filter((a) => a.status === "pending").length}</div>
            <p className="text-xs text-muted-foreground">Agents awaiting review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents.filter((a) => a.status === "active").length}</div>
            <p className="text-xs text-muted-foreground">Agents live on the marketplace</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/admin/users">
              <Button className="w-full">Manage All Users</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Submissions</CardTitle>
          <CardDescription>Review and approve, reject, or suspend agents.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading agents...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent Name</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell className="font-medium">{agent.name}</TableCell>
                    <TableCell>{agent.creator ?? '-'}</TableCell>
                    <TableCell>{agent.price_per_use_credits || 'N/A'} Credits</TableCell>
                    <TableCell>
                      <Badge>
                        {agent.status ?? 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>{agent.created_at ? new Date(agent.created_at).toLocaleDateString() : '-'}</TableCell>
                    {/* Remove moderation actions if status is not present */}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
