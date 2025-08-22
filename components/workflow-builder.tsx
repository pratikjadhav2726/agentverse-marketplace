'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { 
  Play, 
  Save, 
  Plus, 
  Settings, 
  Loader2,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { workflowEngine } from '@/lib/microservices'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'

// Node types
const nodeTypes = {
  input: 'Input',
  agent: 'AI Agent',
  condition: 'Condition',
  tool: 'Tool',
  output: 'Output',
}

// Initial nodes
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    position: { x: 100, y: 100 },
    data: { 
      label: 'Start',
      type: 'input',
      inputs: {}
    },
  },
]

const initialEdges: Edge[] = []

interface WorkflowExecution {
  id: string
  status: string
  outputs: Record<string, any>
  start_time: string
  end_time?: string
  error_message?: string
}

export function WorkflowBuilder() {
  const { user } = useAuth()
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [workflowName, setWorkflowName] = useState('My Workflow')
  const [workflowDescription, setWorkflowDescription] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [execution, setExecution] = useState<WorkflowExecution | null>(null)
  const [selectedNodeType, setSelectedNodeType] = useState<string>('agent')
  const [workflowId, setWorkflowId] = useState<string>()

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const addNode = useCallback(() => {
    const newNode: Node = {
      id: `node_${Date.now()}`,
      type: selectedNodeType,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: {
        label: nodeTypes[selectedNodeType as keyof typeof nodeTypes],
        type: selectedNodeType,
        config: {},
      },
    }
    setNodes((nds) => [...nds, newNode])
  }, [selectedNodeType, setNodes])

  const saveWorkflow = async () => {
    if (!user) {
      toast.error('Please sign in to save workflows')
      return
    }

    try {
      const workflow = {
        id: workflowId || `workflow_${Date.now()}`,
        name: workflowName,
        description: workflowDescription,
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type || 'default',
          data: node.data,
          position: node.position
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle
        })),
        user_id: user.id,
      }

      const result = await workflowEngine.createWorkflow(workflow)
      setWorkflowId(result.workflow_id)
      
      toast.success('Workflow saved successfully!')
    } catch (error) {
      console.error('Save workflow error:', error)
      toast.error('Failed to save workflow')
    }
  }

  const executeWorkflow = async () => {
    if (!user || !workflowId) {
      toast.error('Please save the workflow first')
      return
    }

    setIsExecuting(true)
    setExecution(null)

    try {
      // Start execution
      const result = await workflowEngine.executeWorkflow(
        workflowId,
        { start_input: 'workflow execution' },
        user.id
      )

      toast.success('Workflow execution started!')

      // Poll for status updates
      const pollExecution = async () => {
        try {
          const executionStatus = await workflowEngine.getExecutionStatus(result.execution_id)
          setExecution(executionStatus)

          if (executionStatus.status === 'running' || executionStatus.status === 'pending') {
            setTimeout(pollExecution, 2000) // Poll every 2 seconds
          } else {
            setIsExecuting(false)
            if (executionStatus.status === 'completed') {
              toast.success('Workflow completed successfully!')
            } else if (executionStatus.status === 'failed') {
              toast.error(`Workflow failed: ${executionStatus.error_message}`)
            }
          }
        } catch (error) {
          console.error('Execution polling error:', error)
          setIsExecuting(false)
          toast.error('Failed to get execution status')
        }
      }

      setTimeout(pollExecution, 1000) // Start polling after 1 second
    } catch (error) {
      console.error('Execute workflow error:', error)
      toast.error('Failed to execute workflow')
      setIsExecuting(false)
    }
  }

  const getExecutionStatusIcon = () => {
    if (!execution) return null
    
    switch (execution.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'running':
      case 'pending':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <Card className="rounded-none border-x-0 border-t-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Workflow Builder</CardTitle>
              <p className="text-sm text-muted-foreground">
                Create AI-powered workflows with drag-and-drop simplicity
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {execution && (
                <div className="flex items-center gap-2 text-sm">
                  {getExecutionStatusIcon()}
                  <span className="capitalize">{execution.status}</span>
                  {execution.status === 'completed' && execution.end_time && (
                    <Badge variant="outline">
                      {Math.round(
                        (new Date(execution.end_time).getTime() - 
                         new Date(execution.start_time).getTime()) / 1000
                      )}s
                    </Badge>
                  )}
                </div>
              )}
              
              <Button
                onClick={executeWorkflow}
                disabled={isExecuting || !workflowId || !user}
                size="sm"
              >
                {isExecuting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Execute
              </Button>
              
              <Button onClick={saveWorkflow} disabled={!user} size="sm" variant="outline">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="workflow-name">Name:</Label>
              <Input
                id="workflow-name"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="w-48"
                placeholder="Workflow name"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Label htmlFor="workflow-description">Description:</Label>
              <Input
                id="workflow-description"
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                className="w-64"
                placeholder="Workflow description"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Toolbar */}
      <Card className="rounded-none border-x-0 border-t-0">
        <CardContent className="py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label>Add Node:</Label>
              <Select value={selectedNodeType} onValueChange={setSelectedNodeType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(nodeTypes).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={addNode} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
            
            <Separator orientation="vertical" className="h-6" />
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Nodes: {nodes.length}</span>
              <span>•</span>
              <span>Edges: {edges.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          className="bg-gray-50"
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {/* Execution Results */}
      {execution && (
        <Card className="rounded-none border-x-0 border-b-0">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              {getExecutionStatusIcon()}
              Execution Results
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-48 overflow-y-auto">
            <div className="space-y-2">
              <div className="flex items-center gap-4 text-sm">
                <span>Status: <Badge variant="outline">{execution.status}</Badge></span>
                <span>Started: {new Date(execution.start_time).toLocaleString()}</span>
                {execution.end_time && (
                  <span>Completed: {new Date(execution.end_time).toLocaleString()}</span>
                )}
              </div>
              
              {execution.error_message && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-sm text-red-700">{execution.error_message}</p>
                </div>
              )}
              
              {execution.outputs && Object.keys(execution.outputs).length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <h4 className="text-sm font-medium text-green-800 mb-2">Outputs:</h4>
                  <pre className="text-xs text-green-700 overflow-x-auto">
                    {JSON.stringify(execution.outputs, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}