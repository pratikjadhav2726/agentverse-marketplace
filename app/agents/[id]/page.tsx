"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { db } from "@/lib/mock-db"
import type { Agent, Review } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Star, Zap, Users, CreditCard, Play, CheckCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { ReviewForm } from "@/components/marketplace/review-form"

export default function AgentPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user, loading, refetchUser } = useAuth()
  const { toast } = useToast()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [isConsumingAgent, setIsConsumingAgent] = useState(false)
  const [playgroundInput, setPlaygroundInput] = useState("")
  const [playgroundOutput, setPlaygroundOutput] = useState("")
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    const fetchedAgent = db.agents.find((a) => a.id === params.id)
    setAgent(fetchedAgent || null)
    if (fetchedAgent && fetchedAgent.examples.length > 0) {
      setPlaygroundInput(JSON.stringify(fetchedAgent.examples[0].input, null, 2))
    }
  }, [params.id])

  const handleRunAgent = async () => {
    if (!agent) return
    setIsRunning(true)
    setPlaygroundOutput("Running agent...")

    // In a real app, this would be an API call to the agent's a2aEndpoint
    // For now, we simulate a delay and use the example output
    try {
      // Validate JSON input
      JSON.parse(playgroundInput)

      await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate network delay
      const output = agent.examples.length > 0 ? agent.examples[0].output : { message: "No example output available." }
      setPlaygroundOutput(JSON.stringify(output, null, 2))
    } catch (error) {
      if (error instanceof SyntaxError) {
        setPlaygroundOutput(`Error: Invalid JSON input.\n${error.message}`)
      } else {
        setPlaygroundOutput(`An unexpected error occurred: ${(error as Error).message}`)
      }
    } finally {
      setIsRunning(false)
    }
  }

  const handleUseAgent = async () => {
    if (!user) {
      router.push("/auth/signin")
      return
    }
    if (!agent) return

    setIsConsumingAgent(true)
    if ((user.credits ?? 0) < agent.pricing.amount) {
      toast({
        title: "Insufficient Credits",
        description: "You don't have enough credits for this agent. Please purchase more.",
        variant: "destructive",
      })
      router.push("/dashboard")
      setIsConsumingAgent(false)
      return
    }

    try {
      const response = await fetch(`/api/agents/${agent.id}/consume`, {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to use agent")
      }

      toast({
        title: "Success!",
        description: `You have successfully used the agent: ${agent.name}.`,
      })

      if (refetchUser) {
        await refetchUser()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setIsConsumingAgent(false)
    }
  }

  const handleReviewSubmit = async (review: { rating: number; comment: string }) => {
    if (!agent) return
    // In a real app, you'd post this to an API
    console.log("Submitted review for", agent.id, review)
    toast({
      title: "Review Submitted",
      description: "Thank you for your feedback!",
    })
    // Potentially refetch agent data to show the new review
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!agent) {
    return <div>Agent not found.</div>
  }

  const { pricing } = agent
  const priceString = `${pricing.amount} Credits`

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <main className="flex-1">
          {/* Agent Header */}
          <div className="mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold">{agent.name}</h1>
                <p className="text-muted-foreground mt-1">
                  Created by <span className="text-primary">{agent.creator}</span>
                </p>
              </div>
              <Badge variant={agent.status === "active" ? "default" : "secondary"}>{agent.status}</Badge>
            </div>
          </div>

          <p className="text-lg mb-6">{agent.description}</p>

          {/* Playground / Interaction Area */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Agent Playground</CardTitle>
              <CardDescription>
                Interact with the agent using the A2A protocol format. This is a simulated call.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="playground-input" className="text-sm font-medium">
                    Input (JSON)
                  </label>
                  <Textarea
                    id="playground-input"
                    placeholder="Enter your input for the agent..."
                    className="min-h-[200px] font-mono text-sm"
                    value={playgroundInput}
                    onChange={(e) => setPlaygroundInput(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="playground-output" className="text-sm font-medium">
                    Output
                  </label>
                  <Textarea
                    id="playground-output"
                    readOnly
                    placeholder="Agent output will appear here..."
                    className="min-h-[200px] font-mono text-sm bg-muted"
                    value={playgroundOutput}
                  />
                </div>
              </div>

              <Button onClick={handleRunAgent} disabled={isRunning}>
                {isRunning ? (
                  <>
                    <Zap className="mr-2 h-4 w-4 animate-pulse" /> Running...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" /> Run Agent
                  </>
                )}
              </Button>
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">
              Note: This is a simulated run and does not consume credits. Use the 'Purchase' button to execute the
              agent.
            </CardFooter>
          </Card>

          {/* Tabs for Details */}
          <Tabs defaultValue="documentation" className="w-full">
            <TabsList>
              <TabsTrigger value="documentation">Documentation</TabsTrigger>
              <TabsTrigger value="examples">Examples</TabsTrigger>
            </TabsList>
            <TabsContent value="documentation" className="mt-4 prose dark:prose-invert max-w-none">
              <pre>{agent.documentation}</pre>
            </TabsContent>
            <TabsContent value="examples" className="mt-4">
              {agent.examples.length > 0 ? (
                <div className="space-y-4">
                  {agent.examples.map((ex, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <CardTitle className="text-base">{ex.description}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <strong>Input:</strong>
                        <pre className="bg-muted p-2 rounded-md text-sm">{JSON.stringify(ex.input, null, 2)}</pre>
                        <strong>Output:</strong>
                        <pre className="bg-muted p-2 rounded-md text-sm">{JSON.stringify(ex.output, null, 2)}</pre>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p>No examples available.</p>
              )}
            </TabsContent>
          </Tabs>
        </main>

        {/* Sidebar */}
        <aside className="w-full lg:w-1/3 xl:w-1/4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Purchase</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold text-center">{priceString}</div>
              <Button onClick={handleUseAgent} className="w-full" disabled={isConsumingAgent}>
                <CreditCard className="h-4 w-4 mr-2" />
                {isConsumingAgent ? "Processing..." : `Use for ${priceString}`}
              </Button>
              <p className="text-xs text-muted-foreground text-center">This is a one-time use of the agent.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Capabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {agent.capabilities.map((capability, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{capability}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reviews</CardTitle>
              <CardDescription>What other users are saying about this agent.</CardDescription>
            </CardHeader>
            <CardContent>
              {agent.reviews.length > 0 ? (
                <div className="space-y-4">
                  {agent.reviews.map((review) => (
                    <div key={review.id} className="border-b pb-4 last:border-b-0">
                      <div className="flex items-center mb-1">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="ml-2 text-sm font-semibold">{review.user}</span>
                      </div>
                      <p className="text-muted-foreground text-sm">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No reviews yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Submit a Review</CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewForm agentId={agent.id} onSubmit={handleReviewSubmit} />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
