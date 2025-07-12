import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectItem } from "@/components/ui/select";
import { NodeData, Credential, Tool } from "./types";
import { useState } from "react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodes: NodeData[];
  credentials: Credential[];
  onMap: (mapping: Record<string, string>) => void;
};

export default function CredentialMappingWizard({
  open,
  onOpenChange,
  nodes,
  credentials,
  onMap,
}: Props) {
  // For each node/tool, map to a credential
  const [mapping, setMapping] = useState<Record<string, string>>({});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Credential Mapping</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {nodes.map((node) =>
            node.tools.map((tool) => (
              <div key={node.agentId + tool.id} className="flex items-center gap-2">
                <span className="font-medium">{node.agentName}</span>
                <span className="text-xs text-muted-foreground">{tool.name}</span>
                <Select
                  value={mapping[node.agentId + tool.id] || ""}
                  onValueChange={(credId) =>
                    setMapping((m) => ({ ...m, [node.agentId + tool.id]: credId }))
                  }
                >
                  {credentials
                    .filter((c) => c.provider === tool.name)
                    .map((cred) => (
                      <SelectItem key={cred.id} value={cred.id}>
                        {cred.label}
                      </SelectItem>
                    ))}
                </Select>
              </div>
            ))
          )}
        </div>
        <Button
          className="mt-4"
          onClick={() => {
            onMap(mapping);
            onOpenChange(false);
          }}
        >
          Save Mapping
        </Button>
      </DialogContent>
    </Dialog>
  );
} 