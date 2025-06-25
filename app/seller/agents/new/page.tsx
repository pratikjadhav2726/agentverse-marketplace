"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Save, Upload, Plus, X, Bot, Code, FileText, DollarSign, Info } from "lucide-react"

export default function NewAgentPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("basic")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [agentData, setAgentData] = useState({
    basic: {
      name: "",
      description: "",
      category: "",
      tags: [] as string[],
      version: "1.0.0",
    },
    technical: {
      dockerImage: "",
      a2aEndpoint: "",
      inputSchema: "",
      outputSchema: "",
      capabilities: [] as string[],
      requirements: "",
    },
    pricing: {
      type: "one-time" as "one-time" | "subscription",
      amount: "",
      currency: "usd",
      interval: "month" as "month" | "year",
      freeTrialDays: "",
    },
    documentation: {
      readme: "",
      examples: "",
      apiDocs: "",
      changelog: "",
    },
  })

  const [newTag, setNewTag] = useState("")
  const [newCapability, setNewCapability] = useState("")

  useEffect(() => {
    if (!loading && (!user || user.role !== "seller")) {
      router.push("/dashboard")
    }
  }, [user, loading, router])

  const addTag = () => {
    if (newTag.trim() && !agentData.basic.tags.includes(newTag.trim())) {
      setAgentData((prev) => ({
        ...prev,
        basic: {
          ...prev.basic,
          tags: [...prev.basic.tags, newTag.trim()],
        },
      }))
      setNewTag("")
    }
  }

  const removeTag = (tag: string) => {
    setAgentData((prev) => ({
      ...prev,
      basic: {
        ...prev.basic,
        tags: prev.basic.tags.filter((t) => t !== tag),
      },
    }))
  }

  const addCapability = () => {
    if (newCapability.trim() && !agentData.technical.capabilities.includes(newCapability.trim())) {
      setAgentData((prev) => ({
        ...prev,
        technical: {
          ...prev.technical,
          capabilities: [...prev.technical.capabilities, newCapability.trim()],
        },
      }))
      setNewCapability("")
    }
  }

  const removeCapability = (capability: string) => {
    setAgentData((prev) => ({
      ...prev,
      technical: {
        ...prev.technical,
        capabilities: prev.technical.capabilities.filter((c) => c !== capability),
      },
    }))
  }

  const handleSubmit = async (asDraft = false) => {
    setIsSubmitting(true)
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      console.log("Submitting agent:", { ...agentData, status: asDraft ? "draft" : "pending" })

      // Redirect to agents list
      router.push("/seller/agents")
    } catch (error) {
      console.error("Failed to submit agent:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || user.role !== "seller") return null

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Agents
        </Button>
        <h1 className="text-3xl font-bold mb-2">Create New Agent</h1>
        <p className="text-muted-foreground">Submit your AI agent to the AgentVerse marketplace</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>Provide basic details about your AI agent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Agent Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Data Analyst Pro"
                  value={agentData.basic.name}
                  onChange={(e) =>
                    setAgentData((prev) => ({
                      ...prev,
                      basic: { ...prev.basic, name: e.target.value },
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what your agent does and its key features..."
                  value={agentData.basic.description}
                  onChange={(e) =>
                    setAgentData((prev) => ({
                      ...prev,
                      basic: { ...prev.basic, description: e.target.value },
                    }))
                  }
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={agentData.basic.category}
                    onValueChange={(value) =>
                      setAgentData((prev) => ({
                        ...prev,
                        basic: { ...prev.basic, category: value },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="analytics">Analytics</SelectItem>
                      <SelectItem value="content">Content</SelectItem>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="automation">Automation</SelectItem>
                      <SelectItem value="communication">Communication</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    placeholder="1.0.0"
                    value={agentData.basic.version}
                    onChange={(e) =>
                      setAgentData((prev) => ({
                        ...prev,
                        basic: { ...prev.basic, version: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {agentData.basic.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addTag()}
                  />
                  <Button type="button" onClick={addTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technical" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Technical Configuration
              </CardTitle>
              <CardDescription>Configure the technical aspects of your agent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="dockerImage">Docker Image *</Label>
                <Input
                  id="dockerImage"
                  placeholder="your-registry/agent-name:latest"
                  value={agentData.technical.dockerImage}
                  onChange={(e) =>
                    setAgentData((prev) => ({
                      ...prev,
                      technical: { ...prev.technical, dockerImage: e.target.value },
                    }))
                  }
                />
                <p className="text-sm text-muted-foreground mt-1">Docker image containing your agent implementation</p>
              </div>

              <div>
                <Label htmlFor="a2aEndpoint">A2A Endpoint *</Label>
                <Input
                  id="a2aEndpoint"
                  placeholder="https://api.yourservice.com/agent"
                  value={agentData.technical.a2aEndpoint}
                  onChange={(e) =>
                    setAgentData((prev) => ({
                      ...prev,
                      technical: { ...prev.technical, a2aEndpoint: e.target.value },
                    }))
                  }
                />
                <p className="text-sm text-muted-foreground mt-1">Agent-to-Agent communication endpoint</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="inputSchema">Input Schema (JSON)</Label>
                  <Textarea
                    id="inputSchema"
                    placeholder='{"data": "string", "format": "string"}'
                    value={agentData.technical.inputSchema}
                    onChange={(e) =>
                      setAgentData((prev) => ({
                        ...prev,
                        technical: { ...prev.technical, inputSchema: e.target.value },
                      }))
                    }
                    className="font-mono text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="outputSchema">Output Schema (JSON)</Label>
                  <Textarea
                    id="outputSchema"
                    placeholder='{"result": "object", "metadata": "object"}'
                    value={agentData.technical.outputSchema}
                    onChange={(e) =>
                      setAgentData((prev) => ({
                        ...prev,
                        technical: { ...prev.technical, outputSchema: e.target.value },
                      }))
                    }
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <Label>Capabilities</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {agentData.technical.capabilities.map((capability) => (
                    <Badge key={capability} variant="secondary" className="flex items-center gap-1">
                      {capability}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeCapability(capability)} />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a capability..."
                    value={newCapability}
                    onChange={(e) => setNewCapability(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addCapability()}
                  />
                  <Button type="button" onClick={addCapability}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="requirements">System Requirements</Label>
                <Textarea
                  id="requirements"
                  placeholder="Describe any special requirements, dependencies, or constraints..."
                  value={agentData.technical.requirements}
                  onChange={(e) =>
                    setAgentData((prev) => ({
                      ...prev,
                      technical: { ...prev.technical, requirements: e.target.value },
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing Model
              </CardTitle>
              <CardDescription>Set your pricing strategy for the agent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Pricing Type *</Label>
                <Select
                  value={agentData.pricing.type}
                  onValueChange={(value: "one-time" | "subscription") =>
                    setAgentData((prev) => ({
                      ...prev,
                      pricing: { ...prev.pricing, type: value },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one-time">One-time Purchase</SelectItem>
                    <SelectItem value="subscription">Subscription</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="amount">Price *</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="99.99"
                    value={agentData.pricing.amount}
                    onChange={(e) =>
                      setAgentData((prev) => ({
                        ...prev,
                        pricing: { ...prev.pricing, amount: e.target.value },
                      }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={agentData.pricing.currency}
                    onValueChange={(value) =>
                      setAgentData((prev) => ({
                        ...prev,
                        pricing: { ...prev.pricing, currency: value },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD</SelectItem>
                      <SelectItem value="eur">EUR</SelectItem>
                      <SelectItem value="gbp">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {agentData.pricing.type === "subscription" && (
                  <div>
                    <Label htmlFor="interval">Billing Interval</Label>
                    <Select
                      value={agentData.pricing.interval}
                      onValueChange={(value: "month" | "year") =>
                        setAgentData((prev) => ({
                          ...prev,
                          pricing: { ...prev.pricing, interval: value },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="month">Monthly</SelectItem>
                        <SelectItem value="year">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {agentData.pricing.type === "subscription" && (
                <div>
                  <Label htmlFor="freeTrialDays">Free Trial Days (Optional)</Label>
                  <Input
                    id="freeTrialDays"
                    type="number"
                    placeholder="7"
                    value={agentData.pricing.freeTrialDays}
                    onChange={(e) =>
                      setAgentData((prev) => ({
                        ...prev,
                        pricing: { ...prev.pricing, freeTrialDays: e.target.value },
                      }))
                    }
                  />
                </div>
              )}

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  AgentVerse takes a 15% commission on all sales. You'll receive 85% of the listed price.
                </AlertDescription>
              </Alert>
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
              <CardDescription>Provide comprehensive documentation for your agent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="readme">README *</Label>
                <Textarea
                  id="readme"
                  placeholder="# Agent Name

## Overview
Describe what your agent does...

## Features
- Feature 1
- Feature 2

## Usage
How to use your agent..."
                  value={agentData.documentation.readme}
                  onChange={(e) =>
                    setAgentData((prev) => ({
                      ...prev,
                      documentation: { ...prev.documentation, readme: e.target.value },
                    }))
                  }
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>

              <div>
                <Label htmlFor="examples">Usage Examples</Label>
                <Textarea
                  id="examples"
                  placeholder="Provide code examples and use cases..."
                  value={agentData.documentation.examples}
                  onChange={(e) =>
                    setAgentData((prev) => ({
                      ...prev,
                      documentation: { ...prev.documentation, examples: e.target.value },
                    }))
                  }
                  className="min-h-[150px] font-mono text-sm"
                />
              </div>

              <div>
                <Label htmlFor="apiDocs">API Documentation</Label>
                <Textarea
                  id="apiDocs"
                  placeholder="Detailed API documentation..."
                  value={agentData.documentation.apiDocs}
                  onChange={(e) =>
                    setAgentData((prev) => ({
                      ...prev,
                      documentation: { ...prev.documentation, apiDocs: e.target.value },
                    }))
                  }
                  className="min-h-[150px] font-mono text-sm"
                />
              </div>

              <div>
                <Label htmlFor="changelog">Changelog</Label>
                <Textarea
                  id="changelog"
                  placeholder="## v1.0.0
- Initial release
- Feature A
- Feature B"
                  value={agentData.documentation.changelog}
                  onChange={(e) =>
                    setAgentData((prev) => ({
                      ...prev,
                      documentation: { ...prev.documentation, changelog: e.target.value },
                    }))
                  }
                  className="min-h-[100px] font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSubmit(true)} disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            Save as Draft
          </Button>
          <Button onClick={() => handleSubmit(false)} disabled={isSubmitting}>
            {isSubmitting ? (
              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Submit for Review
          </Button>
        </div>
      </div>
    </div>
  )
}
