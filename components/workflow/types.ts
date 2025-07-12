export type Tool = {
  id: string;
  name: string;
  type: string;
  credentialType: string;
};

export type Agent = {
  id: string;
  name: string;
  description: string;
  skills: string[];
  endpoint: string;
  documentationUrl?: string;
  llms: string[];
  tools: Tool[];
};

export type Credential = {
  id: string;
  type: string;
  provider: string;
  label: string;
  shared?: boolean;
};

export type NodeData = {
  agentId: string;
  agentName: string;
  llms: string[];
  tools: Tool[];
  currentLLM: string;
  credentials: Record<string, string>;
  onClick: () => void;
}; 