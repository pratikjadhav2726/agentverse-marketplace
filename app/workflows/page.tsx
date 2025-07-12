// If you haven't already, install react-icons: npm install react-icons

"use client";

import React, { useCallback, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel,
  Node,
  Edge,
  Connection,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { FiSave, FiPlay, FiDownload, FiUpload, FiMaximize2, FiRefreshCw, FiKey } from "react-icons/fi";
import AgentNode from "@/components/workflow/AgentNode";
import NodeDetailsPanel from "@/components/workflow/NodeDetailsPanel";
import CredentialDashboard from "@/components/workflow/CredentialDashboard";
import CredentialMappingWizard from "@/components/workflow/CredentialMappingWizard";
import { Agent, Credential, NodeData } from "@/components/workflow/types";

// --- Mock Data ---
const AGENT_LIBRARY: Agent[] = [
  {
    id: "agent-1",
    name: "Data Collector",
    description: "Collects data from APIs",
    skills: ["fetch", "parse", "schedule"],
    endpoint: "https://api.example.com/agent-1",
    documentationUrl: "https://docs.example.com/agent-1",
    llms: ["OpenAI", "Anthropic", "Gemini"],
    tools: [
      { id: "openai", name: "OpenAI", type: "llm", credentialType: "api_key" },
      { id: "google_sheets", name: "Google Sheets", type: "tool", credentialType: "oauth" },
    ],
  },
  {
    id: "agent-2",
    name: "Analyzer",
    description: "Analyzes data using LLMs",
    skills: ["analyze", "summarize"],
    endpoint: "https://api.example.com/agent-2",
    documentationUrl: "https://docs.example.com/agent-2",
    llms: ["OpenAI", "Gemini"],
    tools: [
      { id: "openai", name: "OpenAI", type: "llm", credentialType: "api_key" },
    ],
  },
];

const MOCK_CREDENTIALS: Credential[] = [
  { id: "cred-1", type: "api_key", provider: "OpenAI", label: "My OpenAI Key" },
  { id: "cred-2", type: "api_key", provider: "Anthropic", label: "Anthropic Key" },
  { id: "cred-3", type: "oauth", provider: "Google Sheets", label: "Google Sheets OAuth" },
];

export default function WorkflowBuilderPage() {
  // Workflow state
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>([
    {
      id: "1",
      type: "agent",
      position: { x: 250, y: 100 },
      data: {
        agentId: "agent-1",
        agentName: "Data Collector",
        llms: ["OpenAI", "Anthropic", "Gemini"],
        tools: AGENT_LIBRARY[0].tools,
        currentLLM: "OpenAI",
        credentials: { openai: "cred-1", google_sheets: "cred-3" },
        onClick: () => handleNodeClick("1"),
      },
    },
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [agentSearch, setAgentSearch] = useState<string>("");
  const [workflowName, setWorkflowName] = useState<string>("Untitled Workflow");

  // Credential state
  const [credentials, setCredentials] = useState<Credential[]>(MOCK_CREDENTIALS);
  const addCredential = (cred: Credential) => setCredentials((prev) => [...prev, cred]);
  const editCredential = (id: string, update: Partial<Credential>) =>
    setCredentials((prev) => prev.map((c) => (c.id === id ? { ...c, ...update } : c)));
  const deleteCredential = (id: string) => setCredentials((prev) => prev.filter((c) => c.id !== id));

  // Modals
  const [credDashboardOpen, setCredDashboardOpen] = useState(false);
  const [credMappingOpen, setCredMappingOpen] = useState(false);

  // Add agent node from library
  const handleAddAgent = (agent: Agent) => {
    const id = (nodes.length + 1).toString();
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: "agent",
        position: { x: 100 + nds.length * 60, y: 200 },
        data: {
          agentId: agent.id,
          agentName: agent.name,
          llms: agent.llms,
          tools: agent.tools,
          currentLLM: agent.llms[0],
          credentials: Object.fromEntries(agent.tools.map((t) => [t.id, ""])),
          onClick: () => handleNodeClick(id),
        },
      },
    ]);
    toast.success(`Added agent: ${agent.name}`);
  };

  // Node click handler
  function handleNodeClick(id: string) {
    setSelectedNodeId(id);
    setSettingsOpen(true);
  }

  // LLM swap handler
  function handleLLMSwap(nodeId: string, llm: string) {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, currentLLM: llm } } : n
      )
    );
    toast.success(`LLM swapped to ${llm}`);
  }

  // Credential change handler
  function handleCredentialChange(nodeId: string, toolId: string, credId: string) {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, credentials: { ...n.data.credentials, [toolId]: credId } } }
          : n
      )
    );
    toast.success(`Credential updated.`);
  }

  // Add edge handler
  const onConnect = useCallback((params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  // NodeTypes for ReactFlow
  const nodeTypes = { agent: AgentNode };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedAgent = selectedNode ? AGENT_LIBRARY.find((a) => a.id === selectedNode.data.agentId) : undefined;

  // Filtered agent library
  const filteredAgents = agentSearch
    ? AGENT_LIBRARY.filter((a) =>
        a.name.toLowerCase().includes(agentSearch.toLowerCase()) ||
        a.description.toLowerCase().includes(agentSearch.toLowerCase())
      )
    : AGENT_LIBRARY;

  // Canvas fit/center
  const handleFitView = () => {
    const rf = document.querySelector(".react-flow__viewport") as HTMLElement;
    if (rf) rf.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // Workflow actions (mock)
  const handleSave = () => toast.success("Workflow saved (mock)");
  const handleRun = () => toast("Workflow run (mock)");
  const handleExport = () => toast("Exported workflow (mock)");
  const handleImport = () => setCredMappingOpen(true);
  const handleReset = () => window.location.reload();

  // Credential mapping wizard callback
  function handleCredentialMap(mapping: Record<string, string>) {
    // For demo, just show a toast and update all node credentials
    setNodes((nds) =>
      nds.map((n) => {
        const newCreds = { ...n.data.credentials };
        Object.entries(mapping).forEach(([k, v]) => {
          // k = agentId+toolId
          const toolId = k.replace(n.data.agentId, "");
          if (toolId in newCreds) newCreds[toolId] = v;
        });
        return { ...n, data: { ...n.data, credentials: newCreds } };
      })
    );
    toast.success("Credential mapping applied");
  }

  return (
    <TooltipProvider>
      <Toaster position="top-right" richColors />
      <div className="flex flex-col h-screen w-full">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-3 border-b bg-background/80 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <Input
              className="text-xl font-bold w-64"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              aria-label="Workflow name"
            />
            <span className="text-muted-foreground text-xs ml-2">Visual Workflow Builder</span>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" aria-label="Save" onClick={handleSave}><FiSave /></Button>
              </TooltipTrigger>
              <TooltipContent>Save</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" aria-label="Run" onClick={handleRun}><FiPlay /></Button>
              </TooltipTrigger>
              <TooltipContent>Run</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" aria-label="Export" onClick={handleExport}><FiDownload /></Button>
              </TooltipTrigger>
              <TooltipContent>Export</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" aria-label="Import" onClick={handleImport}><FiUpload /></Button>
              </TooltipTrigger>
              <TooltipContent>Import</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" aria-label="Credentials" onClick={() => setCredDashboardOpen(true)}><FiKey /></Button>
              </TooltipTrigger>
              <TooltipContent>Credential Dashboard</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" aria-label="Center Canvas" onClick={handleFitView}><FiMaximize2 /></Button>
              </TooltipTrigger>
              <TooltipContent>Center Canvas</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" aria-label="Reset" onClick={handleReset}><FiRefreshCw /></Button>
              </TooltipTrigger>
              <TooltipContent>Reset</TooltipContent>
            </Tooltip>
          </div>
        </header>
        <div className="flex flex-1 min-h-0">
          {/* Sidebar: Agent Library */}
          <aside className="w-72 border-r p-4 bg-muted/50 flex flex-col gap-4">
            <div>
              <Input
                placeholder="Search agents..."
                value={agentSearch}
                onChange={(e) => setAgentSearch(e.target.value)}
                aria-label="Search agents"
                className="mb-3"
              />
              <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-180px)] pr-1">
                {filteredAgents.length === 0 && (
                  <div className="text-xs text-muted-foreground">No agents found.</div>
                )}
                {filteredAgents.map((agent) => (
                  <div key={agent.id} className="p-3 flex flex-col gap-1 border border-primary/30 rounded bg-background">
                    <div className="font-semibold text-primary mb-1">{agent.name}</div>
                    <div className="text-xs text-muted-foreground mb-1">{agent.description}</div>
                    <Button size="sm" variant="secondary" onClick={() => handleAddAgent(agent)}>
                      Add to Canvas
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </aside>
          {/* Main: Workflow Canvas */}
          <main className="flex-1 relative bg-background">
            <ReactFlowProvider>
              <ReactFlow
                nodes={nodes.map((n) => ({ ...n, data: { ...n.data, onClick: () => handleNodeClick(n.id) } }))}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                className="h-full"
              >
                <Background />
                <MiniMap />
                <Controls />
                <Panel position="top-right"><div /></Panel>
              </ReactFlow>
            </ReactFlowProvider>
            <NodeDetailsPanel
              node={selectedNode}
              agent={selectedAgent}
              credentials={credentials}
              open={settingsOpen}
              onOpenChange={setSettingsOpen}
              onLLMSwap={handleLLMSwap}
              onCredentialChange={handleCredentialChange}
            />
            <CredentialDashboard
              open={credDashboardOpen}
              onOpenChange={setCredDashboardOpen}
              credentials={credentials}
              addCredential={addCredential}
              editCredential={editCredential}
              deleteCredential={deleteCredential}
            />
            <CredentialMappingWizard
              open={credMappingOpen}
              onOpenChange={setCredMappingOpen}
              nodes={nodes.map((n) => n.data)}
              credentials={credentials}
              onMap={handleCredentialMap}
            />
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
} 