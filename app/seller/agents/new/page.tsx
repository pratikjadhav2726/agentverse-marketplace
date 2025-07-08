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

type Example = {
  input: string
  output: string
  description: string
}

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
      amount: "",
    },
    documentation: {
      readme: "",
      examples: [] as Example[],
    },
  })

  const [newTag, setNewTag] = useState("")
  const [newCapability, setNewCapability] = useState("")

  useEffect(() => {
    if (!loading && !user) {
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

  const handleExampleChange = (index: number, field: keyof Example, value: string) => {
    setAgentData((prev) => {
      const newExamples = [...prev.documentation.examples]
      newExamples[index] = { ...newExamples[index], [field]: value }
      return {
        ...prev,
        documentation: {
          ...prev.documentation,
          examples: newExamples,
        },
      }
    })
  }

  const addExample = () => {
    setAgentData((prev) => ({
      ...prev,
      documentation: {
        ...prev.documentation,
        examples: [...prev.documentation.examples, { input: "{}", output: "{}", description: "" }],
      },
    }))
  }

  const removeExample = (index: number) => {
    setAgentData((prev) => ({
      ...prev,
      documentation: {
        ...prev.documentation,
        examples: prev.documentation.examples.filter((_, i) => i !== index),
      },
    }))
  }

  const handleSubmit = async (asDraft = false) => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/seller/agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(agentData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to submit agent")
      }

      // Redirect to agents list
      router.push("/seller/agents")
    } catch (error) {
      console.error("Failed to submit agent:", error)
      // Here you would show a toast notification to the user
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

  if (!user) return null

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
                Pricing
              </CardTitle>
              <CardDescription>Set the price for your agent in credits.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="price-amount">Price in Credits *</Label>
                <div className="relative">
                  <Input
                    id="price-amount"
                    type="number"
                    placeholder="e.g., 100"
                    value={agentData.pricing.amount}
                    onChange={(e) =>
                      setAgentData((prev) => ({
                        ...prev,
                        pricing: { ...prev.pricing, amount: e.target.value },
                      }))
                    }
                    className="pl-8"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    CRED
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  This is the one-time cost for a user to execute your agent.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Agent Documentation
              </CardTitle>
              <CardDescription>
                Provide detailed documentation and usage examples for your agent. Use Markdown for formatting.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="readme">README.md *</Label>
                <Textarea
                  id="readme"
                  placeholder="Detailed documentation about your agent, how to use it, etc."
                  value={agentData.documentation.readme}
                  onChange={(e) =>
                    setAgentData((prev) => ({
                      ...prev,
                      documentation: { ...prev.documentation, readme: e.target.value },
                    }))
                  }
                  className="min-h-[300px] font-mono"
                />
              </div>

              <div>
                <Label>Usage Examples</Label>
                <div className="space-y-4">
                  {agentData.documentation.examples.map((example, index) => (
                    <Card key={index} className="p-4 bg-muted/50">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold">Example {index + 1}</h4>
                        <Button variant="ghost" size="icon" onClick={() => removeExample(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <Label htmlFor={`example-desc-${index}`}>Description</Label>
                          <Input
                            id={`example-desc-${index}`}
                            placeholder="e.g., Summarize a short article"
                            value={example.description}
                            onChange={(e) => handleExampleChange(index, "description", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`example-input-${index}`}>Input (JSON)</Label>
                          <Textarea
                            id={`example-input-${index}`}
                            value={example.input}
                            onChange={(e) => handleExampleChange(index, "input", e.target.value)}
                            className="font-mono"
                            rows={5}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`example-output-${index}`}>Output (JSON)</Label>
                          <Textarea
                            id={`example-output-${index}`}
                            value={example.output}
                            onChange={(e) => handleExampleChange(index, "output", e.target.value)}
                            className="font-mono"
                            rows={5}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={addExample} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Example
                </Button>
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
