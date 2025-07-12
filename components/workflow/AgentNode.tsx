import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NodeData } from "./types";

export default function AgentNode({ data }: { data: NodeData }) {
  return (
    <Card className="p-2 min-w-[180px] cursor-pointer border-2 border-primary/60 hover:shadow-lg transition-shadow" onClick={data.onClick}>
      <div className="font-bold text-primary mb-1">{data.agentName}</div>
      <div className="flex gap-1 flex-wrap">
        {data.llms.map((llm: string) => (
          <Badge key={llm} variant="outline" className="text-xs">{llm}</Badge>
        ))}
        {data.tools.map((tool) => (
          <Badge key={tool.id} variant="secondary" className="text-xs">{tool.name}</Badge>
        ))}
      </div>
    </Card>
  );
} 