"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { WorkflowBuilder } from "@/components/workflow/workflow-builder"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Play, Clock, CheckCircle, XCircle, Bot } from "lucide-react"
import type { PurchasedAgent, Workflow } from "@/lib/workflow-types"
import Link from "next/link"
import { ReactFlowProvider } from "reactflow"

export default function WorkflowsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [purchasedAgents, setPurchasedAgents] = useState<PurchasedAgent[]>([])
  const [activeTab, setActiveTab] = useState("builder")
  const [workflowToLoad, setWorkflowToLoad] = useState<Workflow | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadWorkflows()
      loadPurchasedAgents()
    }
  }, [user])

  const loadWorkflows = async () => {
    try {
      const response = await fetch(`/api/workflows?userId=${user?.id}`)
      if (response.ok) {
        const { workflows } = await response.json()
        setWorkflows(workflows)
      }
    } catch (error) {
      console.error("Failed to load workflows:", error)
    }
  }

  const loadPurchasedAgents = async () => {
    if (!user) return
    try {
      const response = await fetch(`/api/purchased-agents?userId=${user.id}`)
      if (response.ok) {
        const { purchasedAgents } = await response.json()
        setPurchasedAgents(purchasedAgents)
      }
    } catch (error) {
      console.error("Failed to load purchased agents:", error)
    }
  }

  const handleSaveWorkflow = (workflow: Workflow) => {
    setWorkflows((prev) => {
      const existing = prev.find((w) => w.id === workflow.id)
      if (existing) {
        return prev.map((w) => (w.id === workflow.id ? workflow : w))
      }
      return [...prev, workflow]
    })
  }

  const handleEditWorkflow = (workflow: Workflow) => {
    setWorkflowToLoad(workflow)
    setActiveTab("builder")
  }

  const handleRunWorkflow = async (workflow: Workflow) => {
    // Set the status to running immediately for better UX
    setWorkflows((prev) => prev.map((w) => (w.id === workflow.id ? { ...w, status: "running" } : w)))

    try {
      const response = await fetch(`/api/workflows/${workflow.id}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflow, inputs: {} }), // Passing empty inputs for now
      })

      if (!response.ok) {
        throw new Error("Failed to start workflow execution")
      }

      const { executionId } = await response.json()

      // Poll for results
      const poll = setInterval(async () => {
        const statusRes = await fetch(`/api/workflows/${workflow.id}/execute?executionId=${executionId}`)
        if (statusRes.ok) {
          const result = await statusRes.json()
          if (result.status === "completed" || result.status === "failed") {
            clearInterval(poll)
            setWorkflows((prev) => prev.map((w) => (w.id === workflow.id ? { ...w, status: result.status } : w)))
          }
        }
      }, 2000)
    } catch (error) {
      console.error("Error running workflow:", error)
      // Revert status on failure
      setWorkflows((prev) => prev.map((w) => (w.id === workflow.id ? { ...w, status: "idle" } : w)))
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "running":
        return <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "completed":
        return "secondary"
      case "failed":
        return "destructive"
      default:
        return "outline"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="container mx-auto px-4 py-8 h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Agent Workflows</h1>
        <p className="text-muted-foreground">
          Create and manage complex workflows by connecting your purchased AI agents
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="builder">Workflow Builder</TabsTrigger>
          <TabsTrigger value="workflows">My Workflows ({workflows.length})</TabsTrigger>
          <TabsTrigger value="agents">Owned Agents ({purchasedAgents.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="h-full mt-6">
          <div className="h-[calc(100vh-200px)] border rounded-lg overflow-hidden">
            <ReactFlowProvider>
              <WorkflowBuilder
                userId={user.id}
                purchasedAgents={purchasedAgents}
                onSave={handleSaveWorkflow}
                workflowToLoad={workflowToLoad}
                clearWorkflowToLoad={() => setWorkflowToLoad(null)}
              />
            </ReactFlowProvider>
          </div>
        </TabsContent>

        <TabsContent value="workflows" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflows.map((workflow) => (
              <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{workflow.name}</CardTitle>
                      <CardDescription className="mt-1">{workflow.description}</CardDescription>
                    </div>
                    <Badge variant={getStatusVariant(workflow.status)}>{workflow.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Nodes:</span>
                      <span>{workflow.nodes.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Connections:</span>
                      <span>{workflow.edges.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last Updated:</span>
                      <span>{new Date(workflow.updatedAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleRunWorkflow(workflow)}
                        disabled={workflow.status === "running"}
                      >
                        {workflow.status === "running" ? (
                          <div className="h-3 w-3 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Play className="h-3 w-3 mr-1" />
                        )}
                        Run
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleEditWorkflow(workflow)}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {workflows.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first workflow to start automating tasks with AI agents
                </p>
                <Button onClick={() => setActiveTab("builder")} asChild>
                  <Link href="/workflows?tab=builder">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Workflow
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="agents" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {purchasedAgents.map((purchasedAgent) => (
              <Card key={purchasedAgent.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center">
                        <Bot className="h-5 w-5 mr-2" />
                        {purchasedAgent.agent.name}
                      </CardTitle>
                      <CardDescription className="mt-1">{purchasedAgent.agent.description}</CardDescription>
                    </div>
                    <Badge variant={purchasedAgent.status === "active" ? "default" : "secondary"}>
                      {purchasedAgent.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Capabilities</h4>
                      <div className="flex flex-wrap gap-1">
                        {purchasedAgent.agent.capabilities.map((capability, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {capability}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      Purchased: {new Date(purchasedAgent.purchaseDate).toLocaleDateString()}
                    </div>

                    <Button size="sm" variant="outline" className="w-full">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {purchasedAgents.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold mb-2">No agents purchased</h3>
                <p className="text-muted-foreground mb-4">
                  Purchase agents from the marketplace to use in your workflows
                </p>
                <Button asChild>
                  <Link href="/marketplace">
                    <Plus className="h-4 w-4 mr-2" />
                    Browse Marketplace
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
