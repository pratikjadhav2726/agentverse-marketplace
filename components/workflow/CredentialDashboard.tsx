import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Credential } from "./types";
import { useState } from "react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credentials: Credential[];
  addCredential: (cred: Credential) => void;
  editCredential: (id: string, update: Partial<Credential>) => void;
  deleteCredential: (id: string) => void;
};

export default function CredentialDashboard({
  open,
  onOpenChange,
  credentials,
  addCredential,
  editCredential,
  deleteCredential,
}: Props) {
  // Minimal add form for demo
  const [newCred, setNewCred] = useState({ label: "", provider: "", type: "" });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Credential Dashboard</DialogTitle>
        </DialogHeader>
        <div className="mb-4">
          <div className="font-medium mb-2">Add Credential</div>
          <div className="flex gap-2">
            <Input
              placeholder="Label"
              value={newCred.label}
              onChange={(e) => setNewCred((c) => ({ ...c, label: e.target.value }))}
            />
            <Input
              placeholder="Provider"
              value={newCred.provider}
              onChange={(e) => setNewCred((c) => ({ ...c, provider: e.target.value }))}
            />
            <Input
              placeholder="Type"
              value={newCred.type}
              onChange={(e) => setNewCred((c) => ({ ...c, type: e.target.value }))}
            />
            <Button
              onClick={() => {
                if (newCred.label && newCred.provider && newCred.type) {
                  addCredential({
                    id: Math.random().toString(36).slice(2),
                    ...newCred,
                  });
                  setNewCred({ label: "", provider: "", type: "" });
                }
              }}
            >
              Add
            </Button>
          </div>
        </div>
        <div>
          <div className="font-medium mb-2">Your Credentials</div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {credentials.map((cred) => (
              <div key={cred.id} className="flex items-center gap-2 border rounded p-2">
                <span className="font-mono text-xs">{cred.label}</span>
                <span className="text-xs text-muted-foreground">{cred.provider}</span>
                <span className="text-xs text-muted-foreground">{cred.type}</span>
                <Button size="sm" variant="destructive" onClick={() => deleteCredential(cred.id)}>
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 