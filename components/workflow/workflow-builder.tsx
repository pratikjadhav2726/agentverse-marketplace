"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Play, Save, Plus, Trash2, Bot, ArrowRight, Zap, GitBranch, Target, PlayCircle } from "lucide-react"
import type { WorkflowNode, WorkflowEdge, PurchasedAgent, Workflow } from "@/lib/workflow-types"
import Link from "next/link"
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  useReactFlow,
} from "reactflow"
import "reactflow/dist/style.css"
import { AgentNode, InputNode, OutputNode, ConditionNode } from "./custom-nodes"

const nodeTypes = {
  agent: AgentNode,
  input: InputNode,
  output: OutputNode,
  condition: ConditionNode,
}

interface WorkflowBuilderProps {
  userId: string
  purchasedAgents: PurchasedAgent[]
  onSave?: (workflow: any) => void
  onExecute?: (workflowId: string, inputs: any) => void
  workflowToLoad?: Workflow | null
  clearWorkflowToLoad?: () => void
}

export function WorkflowBuilder({
  userId,
  purchasedAgents,
  onSave,
  onExecute,
  workflowToLoad,
  clearWorkflowToLoad,
}: WorkflowBuilderProps) {
  const [nodes, setNodes] = useState<WorkflowNode[]>([])
  const [edges, setEdges] = useState<WorkflowEdge[]>([])
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null)
  const [workflowName, setWorkflowName] = useState("New Workflow")
  const [workflowDescription, setWorkflowDescription] = useState("")
  const [draggedAgent, setDraggedAgent] = useState<PurchasedAgent | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const reactFlowInstance = useReactFlow()

  useEffect(() => {
    if (workflowToLoad) {
      setNodes(workflowToLoad.nodes)
      setEdges(workflowToLoad.edges)
      setWorkflowName(workflowToLoad.name)
      setWorkflowDescription(workflowToLoad.description)
      // We need to clear it so it doesn't get re-loaded on every render
      clearWorkflowToLoad?.()
    }
  }, [workflowToLoad, clearWorkflowToLoad])

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds) as WorkflowNode[]),
    [setNodes],
  )
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds) as WorkflowEdge[]),
    [setEdges],
  )
  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds) as WorkflowEdge[]),
    [setEdges],
  )

  const addNode = useCallback(
    (type: WorkflowNode["type"], position: { x: number; y: number }, agentData?: PurchasedAgent) => {
      const nodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      let nodeData: WorkflowNode["data"]

      switch (type) {
        case "agent":
          nodeData = {
            agentId: agentData?.agentId,
            agentName: agentData?.agent.name || "Unknown Agent",
            label: agentData?.agent.name || "Agent Node",
            inputs: {},
            outputs: {},
            config: {},
          }
          break
        case "input":
          nodeData = { label: "Input", inputs: {}, outputs: {} }
          break
        case "output":
          nodeData = { label: "Output", inputs: {}, outputs: {} }
          break
        case "condition":
          nodeData = { label: "Condition", config: { condition: "true" } }
          break
        default:
          nodeData = { label: "Node" }
      }

      const newNode: WorkflowNode = {
        id: nodeId,
        type,
        position,
        data: nodeData,
      }

      setNodes((prev) => [...prev, newNode])
      setIsExecuting(false)
    },
    [],
  )

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((prev) => prev.filter((n) => n.id !== nodeId))
      setEdges((prev) => prev.filter((e) => e.source !== nodeId && e.target !== nodeId))
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null)
      }
    },
    [selectedNode],
  )

  const connectNodes = useCallback((sourceId: string, targetId: string) => {
    const edgeId = `edge_${sourceId}_${targetId}`
    const newEdge: WorkflowEdge = {
      id: edgeId,
      source: sourceId,
      target: targetId,
    }
    setEdges((prev) => [...prev.filter((e) => e.id !== edgeId), newEdge])
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (!draggedAgent) return

      const position = reactFlowInstance.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      })

      addNode("agent", position, draggedAgent)
      setDraggedAgent(null)
    },
    [draggedAgent, addNode, reactFlowInstance],
  )

  const handleSave = async () => {
    const workflow = {
      name: workflowName,
      description: workflowDescription,
      userId,
      nodes,
      edges,
    }

    try {
      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workflow),
      })

      if (response.ok) {
        const { workflow: savedWorkflow } = await response.json()
        onSave?.(savedWorkflow)
      }
    } catch (error) {
      console.error("Failed to save workflow:", error)
    }
  }

  const handleExecute = async () => {
    if (nodes.length === 0) return

    setIsExecuting(true)
    try {
      // First save the workflow
      await handleSave()

      // Then execute it
      const inputs = { message: "Hello from workflow execution!" }
      // onExecute would be implemented to handle execution

      setTimeout(() => setIsExecuting(false), 3000) // Mock execution time
    } catch (error) {
      console.error("Failed to execute workflow:", error)
      setIsExecuting(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-4 bg-background">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 max-w-md">
            <Input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="text-lg font-semibold border-none p-0 h-auto focus-visible:ring-0"
              placeholder="Workflow Name"
            />
            <Textarea
              value={workflowDescription}
              onChange={(e) => setWorkflowDescription(e.target.value)}
              placeholder="Describe your workflow..."
              className="mt-2 min-h-[60px] resize-none border-none p-0 focus-visible:ring-0"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} variant="outline">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button onClick={handleExecute} disabled={isExecuting || nodes.length === 0}>
              {isExecuting ? (
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Execute
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => addNode("input", { x: 100, y: 100 })}>
            <Plus className="h-3 w-3 mr-1" />
            Input
          </Button>
          <Button size="sm" variant="outline" onClick={() => addNode("condition", { x: 300, y: 100 })}>
            <GitBranch className="h-3 w-3 mr-1" />
            Condition
          </Button>
          <Button size="sm" variant="outline" onClick={() => addNode("output", { x: 500, y: 100 })}>
            <Target className="h-3 w-3 mr-1" />
            Output
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar - Available Agents */}
        <div className="w-80 border-r bg-muted/30">
          <div className="p-4">
            <h3 className="font-semibold mb-4 flex items-center">
              <Bot className="h-4 w-4 mr-2" />
              Your Agents ({purchasedAgents.length})
            </h3>
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-2">
                {purchasedAgents.map((purchasedAgent) => (
                  <Card
                    key={purchasedAgent.id}
                    className="cursor-grab hover:shadow-md transition-shadow"
                    draggable
                    onDragStart={() => setDraggedAgent(purchasedAgent)}
                    onDragEnd={() => setDraggedAgent(null)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{purchasedAgent.agent.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {purchasedAgent.agent.description}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {purchasedAgent.agent.capabilities.slice(0, 2).map((cap, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {cap}
                              </Badge>
                            ))}
                            {purchasedAgent.agent.capabilities.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{purchasedAgent.agent.capabilities.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Zap className="h-4 w-4 text-primary flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {purchasedAgents.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No agents purchased yet</p>
                    <Button size="sm" variant="outline" className="mt-2" asChild>
                      <Link href="/marketplace">Browse Marketplace</Link>
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Main Canvas */}
        <div
          className="flex-1"
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault()
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
          >
            <Controls />
            <Background />
          </ReactFlow>
        </div>

        {/* Properties Panel */}
        {selectedNode && (
          <div className="w-80 border-l bg-background">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Node Properties</h3>
                <Button size="sm" variant="ghost" onClick={() => setSelectedNode(null)}>
                  ×
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Label</Label>
                  <Input
                    value={selectedNode.data.label}
                    onChange={(e) => {
                      setSelectedNode({
                        ...selectedNode,
                        data: { ...selectedNode.data, label: e.target.value },
                      })
                      setNodes((prev) =>
                        prev.map((n) =>
                          n.id === selectedNode.id ? { ...n, data: { ...n.data, label: e.target.value } } : n,
                        ),
                      )
                    }}
                  />
                </div>

                {selectedNode.type === "condition" && (
                  <div>
                    <Label>Condition</Label>
                    <Select
                      value={selectedNode.data.config?.condition || "true"}
                      onValueChange={(value) => {
                        const updatedNode = {
                          ...selectedNode,
                          data: {
                            ...selectedNode.data,
                            config: { ...selectedNode.data.config, condition: value },
                          },
                        }
                        setSelectedNode(updatedNode)
                        setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? updatedNode : n)))
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Always True</SelectItem>
                        <SelectItem value="false">Always False</SelectItem>
                        <SelectItem value="random">Random</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedNode.type === "agent" && (
                  <div>
                    <Label>Agent</Label>
                    <div className="p-3 border rounded-md bg-muted/50">
                      <p className="font-medium">{selectedNode.data.agentName}</p>
                      <p className="text-sm text-muted-foreground">Agent ID: {selectedNode.data.agentId}</p>
                    </div>
                  </div>
                )}

                <Separator />

                <div>
                  <Label>Connections</Label>
                  <div className="space-y-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        // Simple connection logic - connect to next available node
                        const availableNodes = nodes.filter(
                          (n) =>
                            n.id !== selectedNode.id &&
                            !edges.some((e) => e.source === selectedNode.id && e.target === n.id),
                        )
                        if (availableNodes.length > 0) {
                          connectNodes(selectedNode.id, availableNodes[0].id)
                        }
                      }}
                    >
                      <ArrowRight className="h-3 w-3 mr-2" />
                      Connect to Next Node
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
