import type React from "react"
import { Handle, Position } from "reactflow"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bot, GitBranch, Target, TestTube } from "lucide-react"
import type { WorkflowNode } from "@/lib/workflow-types"
import { Separator } from "@/components/ui/separator"

const HandleWrapper = ({ children, ...props }: { children: React.ReactNode;[key: string]: any }) => (
  <div className="relative p-2" {...props}>
    {children}
  </div>
)

const LabeledHandle = ({ id, label, position, type, ...props }: { id: string; label: string; position: Position; type: "source" | "target"; [key: string]: any }) => (
  <div className={`flex items-center gap-2 ${position === Position.Left ? "justify-start" : "justify-end"}`}>
    {position === Position.Right && <label className="text-xs">{label}</label>}
    <Handle id={id} position={position} type={type} {...props} />
    {position === Position.Left && <label className="text-xs">{label}</label>}
  </div>
)

export const AgentNode = ({ data }: { data: WorkflowNode["data"] }) => {
  const inputs = data.inputs ? Object.keys(data.inputs) : []
  const outputs = data.outputs ? Object.keys(data.outputs) : []

  return (
    <Card className="w-64 border-2 border-primary shadow-lg bg-background">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Bot className="h-4 w-4" />
          {data.label}
        </CardTitle>
      </CardHeader>
      <Separator />
      <div className="flex justify-between">
        <HandleWrapper>
          {inputs.map((inputKey, i) => (
            <LabeledHandle
              key={inputKey}
              type="target"
              id={inputKey}
              label={inputKey}
              position={Position.Left}
              style={{ top: `${(i + 1) * 30}px`, left: "-4px" }}
              className="!w-3 !h-3"
            />
          ))}
        </HandleWrapper>
        <HandleWrapper>
          {outputs.map((outputKey, i) => (
            <LabeledHandle
              key={outputKey}
              type="source"
              id={outputKey}
              label={outputKey}
              position={Position.Right}
              style={{ top: `${(i + 1) * 30}px`, right: "-4px" }}
              className="!w-3 !h-3"
            />
          ))}
        </HandleWrapper>
      </div>
    </Card>
  )
}

export const InputNode = ({ data }: { data: WorkflowNode["data"] }) => {
  return (
    <Card className="w-64 border-2 border-blue-500 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{data.label}</CardTitle>
        <TestTube className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-xs text-muted-foreground">Workflow Input</div>
      </CardContent>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
    </Card>
  )
}

export const OutputNode = ({ data }: { data: WorkflowNode["data"] }) => {
  return (
    <Card className="w-64 border-2 border-green-500 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{data.label}</CardTitle>
        <Target className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-xs text-muted-foreground">Workflow Output</div>
      </CardContent>
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
    </Card>
  )
}

export const ConditionNode = ({ data }: { data: WorkflowNode["data"] }) => {
  return (
    <Card className="w-64 border-2 border-yellow-500 shadow-lg bg-background">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <GitBranch className="h-4 w-4" />
          {data.label}
        </CardTitle>
      </CardHeader>
      <Separator />
      <Handle type="target" position={Position.Left} className="!w-3 !h-3" />
      <div className="p-3 text-center">
        <p className="text-xs text-muted-foreground">{data.config?.condition || "Condition"}</p>
      </div>
      <Separator />
      <LabeledHandle
        type="source"
        id="true"
        label="True"
        position={Position.Right}
        className="!w-3 !h-3"
        style={{ top: "auto", bottom: "40px", right: "-4px" }}
      />
      <LabeledHandle
        type="source"
        id="false"
        label="False"
        position={Position.Right}
        className="!w-3 !h-3"
        style={{ top: "auto", bottom: "10px", right: "-4px" }}
      />
    </Card>
  )
} 