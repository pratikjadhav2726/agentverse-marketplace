import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectItem } from "@/components/ui/select";
import { Node } from "reactflow";
import { NodeData, Agent, Credential } from "./types";
import { Badge } from "@/components/ui/badge";

export type NodeDetailsPanelProps = {
  node: Node<NodeData> | undefined;
  agent: Agent | undefined;
  credentials: Credential[];
  onLLMSwap: (nodeId: string, llm: string) => void;
  onCredentialChange: (nodeId: string, toolId: string, credId: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function NodeDetailsPanel({
  node,
  agent,
  credentials,
  onLLMSwap,
  onCredentialChange,
  open,
  onOpenChange,
}: NodeDetailsPanelProps) {
  if (!node || !agent) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Agent Settings: {agent.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="mb-2">
              <TabsTrigger value="info">Info</TabsTrigger>
              <TabsTrigger value="tools">Tools/LLMs</TabsTrigger>
              <TabsTrigger value="credentials">Credentials</TabsTrigger>
            </TabsList>
            <TabsContent value="info">
              <div className="mb-2 font-semibold text-primary">{agent.name}</div>
              <div className="mb-2 text-sm text-muted-foreground">{agent.description}</div>
              <div className="mb-2">
                <span className="font-medium">Skills:</span>{" "}
                {agent.skills.map((s) => (
                  <Badge key={s} className="mr-1">{s}</Badge>
                ))}
              </div>
              <div className="mb-2">
                <span className="font-medium">Endpoint:</span> <span className="text-xs">{agent.endpoint}</span>
              </div>
              {agent.documentationUrl && (
                <a href={agent.documentationUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs">
                  Documentation
                </a>
              )}
            </TabsContent>
            <TabsContent value="tools">
              {agent.llms.length > 1 && (
                <div className="mb-2">
                  <span className="font-medium">LLM Provider</span>
                  <Select value={node.data.currentLLM} onValueChange={(v) => onLLMSwap(node.id, v)}>
                    {agent.llms.map((llm) => (
                      <SelectItem key={llm} value={llm}>{llm}</SelectItem>
                    ))}
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                {agent.tools.map((tool) => (
                  <div key={tool.id}>
                    <div className="font-medium mb-1">{tool.name}</div>
                    <Select
                      value={node.data.credentials[tool.id]}
                      onValueChange={(credId) => onCredentialChange(node.id, tool.id, credId)}
                    >
                      {credentials
                        .filter((c) => c.provider === tool.name)
                        .map((cred) => (
                          <SelectItem key={cred.id} value={cred.id}>{cred.label}</SelectItem>
                        ))}
                    </Select>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="credentials">
              <div className="text-xs text-muted-foreground">Manage credentials in the Credential Dashboard.</div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
} 