"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Bot,
  Star,
  Users,
  Play,
  ShoppingCart,
  Zap,
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react"
import type { Agent } from "@/lib/types"
import { ReviewForm } from "@/components/marketplace/review-form"

// Mock agent data - replace with actual API call
const mockAgents: Record<
  string,
  Agent & {
    documentation: string
    examples: Array<{ input: any; output: any; description: string }>
    reviews: Array<{ id: string; user: string; rating: number; comment: string; date: string }>
  }
> = {
  "1": {
    id: "1",
    name: "Data Analyst Pro",
    creator: "Analytics Corp",
    description:
      "Advanced data analysis and visualization agent with machine learning capabilities. Perfect for business intelligence, statistical analysis, and data-driven decision making.",
    capabilities: [
      "Data Analysis",
      "Machine Learning",
      "Visualization",
      "Statistical Modeling",
      "Predictive Analytics",
      "Data Cleaning",
    ],
    pricing: {
      type: "subscription",
      amount: 4999,
      currency: "usd",
      interval: "month",
    },
    sellerId: "seller1",
    status: "active",
    a2aEndpoint: "https://api.example.com/agents/data-analyst",
    ratings: {
      average: 4.8,
      count: 127,
    },
    metadata: {
      version: "2.1.0",
      lastUpdated: "2024-01-15",
      category: "Analytics",
      tags: ["data", "analytics", "ml", "visualization"],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    documentation: `# Data Analyst Pro

## Overview
Data Analyst Pro is a comprehensive AI agent designed for advanced data analysis and visualization. It combines statistical analysis, machine learning, and data visualization capabilities to provide actionable insights from your data.

## Features
- **Statistical Analysis**: Descriptive and inferential statistics
- **Machine Learning**: Classification, regression, clustering
- **Data Visualization**: Interactive charts and graphs
- **Data Cleaning**: Automated data preprocessing
- **Predictive Analytics**: Forecasting and trend analysis

## Input Schema
\`\`\`json
{
  "data": "array|string", // CSV data or array of objects
  "analysis_type": "string", // "descriptive", "predictive", "classification"
  "target_column": "string", // For supervised learning
  "visualization": "boolean" // Whether to generate charts
}
\`\`\`

## Output Schema
\`\`\`json
{
  "analysis": {
    "summary": "object",
    "insights": "array",
    "recommendations": "array"
  },
  "visualizations": "array",
  "model_performance": "object"
}
\`\`\``,
    examples: [
      {
        input: {
          data: "sales_data.csv",
          analysis_type: "descriptive",
          visualization: true,
        },
        output: {
          analysis: {
            summary: { total_sales: 125000, avg_order: 85.5, growth_rate: 0.15 },
            insights: ["Sales increased 15% compared to last quarter", "Peak sales occur on weekends"],
            recommendations: ["Focus marketing on weekend campaigns", "Expand high-performing product lines"],
          },
          visualizations: ["sales_trend_chart.png", "product_performance_bar.png"],
        },
        description: "Analyze sales data to identify trends and opportunities",
      },
      {
        input: {
          data: "customer_data.csv",
          analysis_type: "classification",
          target_column: "churn_risk",
        },
        output: {
          analysis: {
            summary: { accuracy: 0.89, precision: 0.85, recall: 0.92 },
            insights: ["High-value customers have 23% lower churn risk", "Support tickets correlate with churn"],
            recommendations: [
              "Implement proactive support for at-risk customers",
              "Create loyalty program for high-value segments",
            ],
          },
          model_performance: {
            auc: 0.91,
            confusion_matrix: [
              [850, 45],
              [32, 173],
            ],
          },
        },
        description: "Predict customer churn risk using machine learning",
      },
    ],
    reviews: [],
  },
  "2": {
    id: "2",
    name: "Content Generator",
    creator: "Contentify",
    description:
      "AI-powered content creation agent for blogs, social media, and marketing materials with SEO optimization.",
    capabilities: [
      "Content Writing",
      "SEO Optimization",
      "Social Media",
      "Copywriting",
      "Blog Posts",
      "Marketing Copy",
    ],
    pricing: {
      type: "one-time",
      amount: 9999,
      currency: "usd",
    },
    sellerId: "seller2",
    status: "active",
    a2aEndpoint: "https://api.example.com/agents/content-gen",
    ratings: {
      average: 4.6,
      count: 89,
    },
    metadata: {
      version: "1.8.2",
      lastUpdated: "2024-01-12",
      category: "Content",
      tags: ["writing", "seo", "marketing", "social-media"],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    documentation: `# Content Generator

## Overview
Content Generator is an AI-powered writing assistant that creates high-quality content for various purposes including blog posts, social media, marketing copy, and more.

## Features
- **Multi-format Content**: Blog posts, social media, emails, ads
- **SEO Optimization**: Keyword integration and optimization
- **Brand Voice**: Maintains consistent tone and style
- **Bulk Generation**: Create multiple variations
- **Content Planning**: Editorial calendar suggestions

## Input Schema
\`\`\`json
{
  "topic": "string",
  "content_type": "string", // "blog", "social", "email", "ad"
  "tone": "string", // "professional", "casual", "friendly"
  "length": "number", // Word count
  "keywords": "array", // SEO keywords
  "target_audience": "string"
}
\`\`\``,
    examples: [
      {
        input: {
          topic: "Benefits of Remote Work",
          content_type: "blog",
          tone: "professional",
          length: 800,
          keywords: ["remote work", "productivity", "work-life balance"],
        },
        output: {
          content: "# The Transformative Benefits of Remote Work...",
          seo_score: 85,
          readability: "Grade 8",
          word_count: 847,
        },
        description: "Generate SEO-optimized blog post about remote work",
      },
    ],
    reviews: [
      {
        id: "1",
        user: "David Park",
        rating: 5,
        comment:
          "Amazing content quality! The SEO optimization features have improved our search rankings significantly.",
        date: "2024-01-09",
      },
    ],
  },
}

export default function AgentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [agent, setAgent] = useState<(typeof mockAgents)[string] | null>(null)
  const [isPurchased, setIsPurchased] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [playgroundInput, setPlaygroundInput] = useState("")
  const [playgroundOutput, setPlaygroundOutput] = useState("")
  const [isTestingAgent, setIsTestingAgent] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; data?: any; error?: string } | null>(null)

  useEffect(() => {
    if (params.id) {
      loadAgent(params.id as string)
    }
  }, [params.id])

  const loadAgent = async (agentId: string) => {
    setIsLoading(true)
    try {
      // Mock API call - replace with actual API
      await new Promise((resolve) => setTimeout(resolve, 500))
      const agentData = mockAgents[agentId]
      if (agentData) {
        setAgent(agentData)
        // Mock check if user has purchased this agent
        setIsPurchased(Math.random() > 0.5) // Random for demo
      }
    } catch (error) {
      console.error("Failed to load agent:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReviewSubmit = async (review: { rating: number; comment: string }) => {
    if (!agent || !user) return

    try {
      // API call to submit the review
      const response = await fetch(`/api/agents/${agent.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Pass user ID in header for mock auth
          'user-id': user.id,
        },
        body: JSON.stringify(review),
      });

      if (!response.ok) {
        // Here you might want to show an error toast
        // and revert the optimistic update.
        console.error("Failed to submit review");
        // For now, we'll just log it. A real app needs error handling.
        return;
      }

      const newReviewFromServer = await response.json();

      // Optimistic update: Replace the temporary review with the one from the server
      // which has the real ID and date.
      setAgent((prevAgent) => {
        if (!prevAgent) return null;
        const optimisticReviews = prevAgent.reviews.filter(
          (r) => r.id !== `${prevAgent.reviews.length}-${user.id}` // A temporary ID
        );

        return {
          ...prevAgent,
          reviews: [newReviewFromServer, ...optimisticReviews],
          ratings: {
            ...prevAgent.ratings,
            count: prevAgent.ratings.count + 1,
            // Average is recalculated on the backend
          },
        };
      });
    } catch (error) {
      console.error("Error submitting review:", error);
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      router.push("/auth/signin")
      return
    }

    // Redirect to Stripe checkout
    const checkoutUrl = `/payment/checkout?agentId=${agent.id}&agentName=${encodeURIComponent(
      agent.name,
    )}&amount=${agent.pricing.amount}&currency=${agent.pricing.currency}&type=${agent.pricing.type}`
    router.push(checkoutUrl)
  }

  const handleTestAgent = async () => {
    if (!playgroundInput.trim()) return

    setIsTestingAgent(true)
    setTestResult(null)

    try {
      // Mock agent testing
      await new Promise((resolve) => setTimeout(resolve, 2000))

      let mockResult
      try {
        const input = JSON.parse(playgroundInput)
        mockResult = {
          success: true,
          data: {
            processed_input: input,
            result: `Agent ${agent?.name} successfully processed your request`,
            timestamp: new Date().toISOString(),
            processing_time: Math.random() * 1000 + 500,
            confidence: 0.85 + Math.random() * 0.15,
          },
        }
      } catch {
        mockResult = {
          success: false,
          error: "Invalid JSON input. Please provide valid JSON format.",
        }
      }

      setTestResult(mockResult)
      if (mockResult.success) {
        setPlaygroundOutput(JSON.stringify(mockResult.data, null, 2))
      }
    } catch (error) {
      setTestResult({
        success: false,
        error: "Failed to test agent. Please try again.",
      })
    } finally {
      setIsTestingAgent(false)
    }
  }

  const formatPrice = (amount: number, currency: string, type: string, interval?: string) => {
    const price = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100)

    if (type === "subscription" && interval) {
      return `${price}/${interval}`
    }
    return price
  }

  if (isLoading || !agent) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const { pricing } = agent
  const priceString = formatPrice(pricing.amount, pricing.currency, pricing.type, pricing.interval)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              {isPurchased ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Purchased
                </Badge>
              ) : (
                <Button onClick={handlePurchase}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {agent.pricing.type === "subscription" ? "Subscribe" : "Purchase"} -{" "}
                  {formatPrice(
                    agent.pricing.amount,
                    agent.pricing.currency,
                    agent.pricing.type,
                    agent.pricing.interval,
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Agent Header */}
        <div className="mb-8">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bot className="h-10 w-10 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{agent.name}</h1>
                <Badge variant={agent.status === "active" ? "default" : "secondary"}>{agent.status}</Badge>
              </div>
              <p className="text-lg text-muted-foreground mb-4">{agent.description}</p>

              <div className="flex items-center gap-6 mb-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{agent.ratings.average}</span>
                  <span className="text-muted-foreground">({agent.ratings.count} reviews)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span className="text-muted-foreground">{agent.ratings.count} users</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-muted-foreground" />
                  <span className="text-muted-foreground">v{agent.metadata.version}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {agent.capabilities.map((capability, index) => (
                  <Badge key={index} variant="outline">
                    {capability}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="playground">Playground</TabsTrigger>
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About This Agent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{agent.description}</p>
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
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Hire Agent</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-3xl font-bold text-center">{priceString}</div>
                    <Button onClick={handlePurchase} className="w-full" disabled={isPurchased}>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {isPurchased
                        ? "Hired"
                        : pricing.type === "subscription"
                          ? "Hire (Subscription)"
                          : "Hire (One-Time)"}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Secure transaction powered by Stripe.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Agent Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Version</span>
                      <span>{agent.metadata.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category</span>
                      <span>{agent.metadata.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Updated</span>
                      <span>{agent.metadata.lastUpdated}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant={agent.status === "active" ? "default" : "secondary"}>{agent.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="playground" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Agent Playground
                </CardTitle>
                <CardDescription>
                  Test the agent with your own inputs.{" "}
                  {!isPurchased && "Purchase the agent to unlock full playground features."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="input">Input (JSON format)</Label>
                      <Textarea
                        id="input"
                        placeholder={`{
  "data": "your_data_here",
  "analysis_type": "descriptive",
  "visualization": true
}`}
                        value={playgroundInput}
                        onChange={(e) => setPlaygroundInput(e.target.value)}
                        className="min-h-[200px] font-mono"
                        disabled={!isPurchased}
                      />
                    </div>
                    <Button
                      onClick={handleTestAgent}
                      disabled={isTestingAgent || !playgroundInput.trim() || !isPurchased}
                      className="w-full"
                    >
                      {isTestingAgent ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Testing Agent...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Run Test
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="output">Output</Label>
                      <Textarea
                        id="output"
                        value={playgroundOutput}
                        readOnly
                        placeholder="Agent output will appear here..."
                        className="min-h-[200px] font-mono"
                      />
                    </div>

                    {testResult && (
                      <Alert variant={testResult.success ? "default" : "destructive"}>
                        <AlertDescription>
                          {testResult.success ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4" />
                              Agent executed successfully!
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <XCircle className="h-4 w-4" />
                              {testResult.error}
                            </div>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>

                {!isPurchased && (
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-muted-foreground mb-3">
                      Purchase this agent to unlock the full playground experience
                    </p>
                    <Button onClick={handlePurchase}>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Purchase Agent
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documentation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documentation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm">{agent.documentation}</pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="examples" className="space-y-6">
            <div className="grid gap-6">
              {agent.examples.map((example, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">Example {index + 1}</CardTitle>
                    <CardDescription>{example.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Input</Label>
                        <pre className="mt-2 p-3 bg-muted rounded-md text-sm overflow-x-auto">
                          {JSON.stringify(example.input, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Output</Label>
                        <pre className="mt-2 p-3 bg-muted rounded-md text-sm overflow-x-auto">
                          {JSON.stringify(example.output, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            {isPurchased && agent ? (
              <Card>
                <CardHeader>
                  <CardTitle>Write a Review</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReviewForm agentId={agent.id} onSubmit={handleReviewSubmit} />
                </CardContent>
              </Card>
            ) : null}

            {agent ? (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">
                  All Reviews ({agent.ratings.count})
                </h3>
                {agent.reviews.length > 0 ? (
                  <div className="grid gap-4">
                    {agent.reviews.map((review) => (
                      <Card key={review.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="font-medium">{review.user}</div>
                              <div className="flex items-center gap-1 mt-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {review.date}
                            </div>
                          </div>
                          <p className="text-muted-foreground">{review.comment}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    This agent has no reviews yet.
                  </p>
                )}
              </div>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
