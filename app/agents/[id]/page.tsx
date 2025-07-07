"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Agent } from "@/lib/types";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

// Extend Agent type for extra fields
export type AgentWithExtras = Agent & {
  avatar?: string;
  creator?: string;
  readme?: string;
  documentation?: string;
  a2a_endpoint?: string;
  metadata?: any;
};

export default function AgentPage({ params }: { params: { id: string } }) {
  const [agent, setAgent] = useState<AgentWithExtras | null>(null);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch agent on mount
  useEffect(() => {
    const fetchAgent = async () => {
      const res = await fetch(`/api/agents/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setAgent(data);
      } else {
        setAgent(null);
      }
    };
    fetchAgent();
  }, [params.id]);

  const handlePlayground = async () => {
    setLoading(true);
    setOutput("");
    const res = await fetch(`/api/agents/${params.id}/playground`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    });
    const data = await res.json();
    setOutput(data.output);
    setLoading(false);
  };

  if (!agent) return <div>Agent not found.</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-4">
            {agent.avatar && <img src={agent.avatar} alt={agent.name} className="w-16 h-16 rounded" />}
            <div>
              <CardTitle className="text-2xl">{agent.name}</CardTitle>
              <div className="text-muted-foreground">{agent.creator}</div>
              <div className="font-semibold">{agent.price_per_use_credits} Credits</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-lg">{agent.description}</div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="playground">Playground</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="prose dark:prose-invert">
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {agent.readme ?? ""}
            </ReactMarkdown>
          </div>
        </TabsContent>
        <TabsContent value="playground">
          <Card>
            <CardHeader>
              <CardTitle>Try the Agent</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full border rounded p-2 mb-2"
                rows={3}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type your input here..."
              />
              <Button onClick={handlePlayground} disabled={loading}>
                {loading ? "Running..." : "Run"}
              </Button>
              {output && (
                <div className="mt-4 p-2 bg-muted rounded">
                  <strong>Output:</strong>
                  <div>{output}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="documentation">
          <div className="prose dark:prose-invert">{agent.documentation}</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
