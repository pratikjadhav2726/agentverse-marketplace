"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Agent } from "@/lib/types";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot, Code, DollarSign, FileText, Info } from "lucide-react";

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
  const [agent, setAgent] = useState<any>(null);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAgent = async () => {
      const res = await fetch(`/api/agents/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setAgent(data.agent);
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

  // Helper for tags/capabilities
  const renderBadges = (items?: string[] | string) => {
    if (!items) return null;
    const arr = Array.isArray(items) ? items : items.split(",").map((t) => t.trim());
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {arr.map((item, idx) => (
          <Badge key={idx} variant="outline" className="text-xs">{item}</Badge>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-4">
            {agent.avatar && <img src={agent.avatar} alt={agent.name} className="w-16 h-16 rounded" />}
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" /> {agent.name}
              </CardTitle>
              <div className="text-muted-foreground">{agent.creator}</div>
              {agent.category && <Badge variant="secondary" className="text-xs mt-1">{agent.category}</Badge>}
              {agent.version && <span className="ml-2 text-xs text-muted-foreground">v{agent.version}</span>}
              {renderBadges(agent.tags)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-lg mb-2">{agent.description}</div>
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="font-semibold">{agent.price_per_use_credits} Credits</span>
              <span className="text-xs text-muted-foreground ml-1">per use</span>
            </div>
            {agent.price_subscription_credits && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <span className="font-semibold">{agent.price_subscription_credits} Credits</span>
                <span className="text-xs text-muted-foreground ml-1">/ month</span>
              </div>
            )}
            {agent.price_one_time_credits && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-yellow-600" />
                <span className="font-semibold">{agent.price_one_time_credits} Credits</span>
                <span className="text-xs text-muted-foreground ml-1">one-time</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
          <TabsTrigger value="playground">Playground</TabsTrigger>
        </TabsList>
        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5" /> Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2">{agent.description}</div>
              <div>
                <Label>Tags</Label>
                {renderBadges(agent.tags)}
              </div>
              <div className="mt-2">
                <Label>Capabilities</Label>
                {renderBadges(agent.capabilities)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Technical Tab */}
        <TabsContent value="technical">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Code className="h-5 w-5" /> Technical Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2">
                <Label>Docker Image</Label>
                <div className="font-mono text-xs bg-muted rounded p-2">{agent.dockerImage || agent.docker_image || "-"}</div>
              </div>
              <div className="mb-2">
                <Label>A2A Endpoint</Label>
                <div className="font-mono text-xs bg-muted rounded p-2">{agent.a2aEndpoint || agent.a2a_endpoint || "-"}</div>
              </div>
              <div className="mb-2">
                <Label>Input Schema</Label>
                <div className="font-mono text-xs bg-muted rounded p-2 whitespace-pre-wrap">{agent.inputSchema || agent.input_schema || "-"}</div>
              </div>
              <div className="mb-2">
                <Label>Output Schema</Label>
                <div className="font-mono text-xs bg-muted rounded p-2 whitespace-pre-wrap">{agent.outputSchema || agent.output_schema || "-"}</div>
              </div>
              <div className="mb-2">
                <Label>System Requirements</Label>
                <div className="text-xs bg-muted rounded p-2">{agent.requirements || "-"}</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Pricing Tab */}
        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" /> Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2">
                <Label>Per Use</Label>
                <div>{agent.price_per_use_credits} Credits</div>
              </div>
              {agent.price_subscription_credits && (
                <div className="mb-2">
                  <Label>Subscription</Label>
                  <div>{agent.price_subscription_credits} Credits / month</div>
                </div>
              )}
              {agent.price_one_time_credits && (
                <div className="mb-2">
                  <Label>One-Time</Label>
                  <div>{agent.price_one_time_credits} Credits</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* Documentation Tab */}
        <TabsContent value="documentation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Documentation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert">
                <ReactMarkdown
                  components={{
                    code({ node, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
                      return match ? (
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
                  {agent.documentation || agent.readme || "No documentation provided."}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Examples Tab */}
        <TabsContent value="examples">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5" /> Usage Examples</CardTitle>
            </CardHeader>
            <CardContent>
              {agent.examples && agent.examples.length > 0 ? (
                <div className="space-y-4">
                  {agent.examples.map((ex: any, idx: number) => (
                    <Card key={idx} className="p-4 bg-muted/50">
                      <div className="mb-2 font-semibold">{ex.description}</div>
                      <div className="mb-2">
                        <Label>Input</Label>
                        <pre className="bg-muted rounded p-2 text-xs whitespace-pre-wrap">{typeof ex.input === 'string' ? ex.input : JSON.stringify(ex.input, null, 2)}</pre>
                      </div>
                      <div>
                        <Label>Output</Label>
                        <pre className="bg-muted rounded p-2 text-xs whitespace-pre-wrap">{typeof ex.output === 'string' ? ex.output : JSON.stringify(ex.output, null, 2)}</pre>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground">No examples provided.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* Playground Tab */}
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
      </Tabs>
    </div>
  );
}
