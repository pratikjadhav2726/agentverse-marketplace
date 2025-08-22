'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Activity,
  Database,
  Cpu,
  Network,
  Bot
} from 'lucide-react'
import { toast } from 'sonner'

interface ServiceHealth {
  status: string
  error?: string
}

interface MicroservicesHealth {
  [key: string]: ServiceHealth
}

interface ServiceInfo {
  name: string
  description: string
  port: number
  icon: React.ReactNode
  url: string
}

const services: Record<string, ServiceInfo> = {
  workflowEngine: {
    name: 'Workflow Engine',
    description: 'LangGraph-powered workflow orchestration',
    port: 8001,
    icon: <Activity className="h-5 w-5" />,
    url: 'http://localhost:8001'
  },
  agentRuntime: {
    name: 'Agent Runtime',
    description: 'LangChain agent execution environment',
    port: 8002,
    icon: <Bot className="h-5 w-5" />,
    url: 'http://localhost:8002'
  },
  mcpServer: {
    name: 'MCP Server',
    description: 'Model Context Protocol tool management',
    port: 8003,
    icon: <Database className="h-5 w-5" />,
    url: 'http://localhost:8003'
  },
  a2aService: {
    name: 'A2A Service',
    description: 'Agent-to-Agent communication protocol',
    port: 8004,
    icon: <Network className="h-5 w-5" />,
    url: 'http://localhost:8004'
  },
  aiOrchestrator: {
    name: 'AI Orchestrator',
    description: 'Vector database and AI coordination',
    port: 8005,
    icon: <Cpu className="h-5 w-5" />,
    url: 'http://localhost:8005'
  }
}

export default function MicroservicesPage() {
  const [health, setHealth] = useState<MicroservicesHealth>({})
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>()

  const checkHealth = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/microservices/health')
      const data = await response.json()
      
      if (data.services) {
        setHealth(data.services)
        setLastUpdated(new Date())
        
        const healthyCount = Object.values(data.services).filter(
          (service: any) => service.status === 'healthy'
        ).length
        
        if (healthyCount === Object.keys(data.services).length) {
          toast.success('All microservices are healthy')
        } else {
          toast.warning(`${healthyCount}/${Object.keys(data.services).length} services healthy`)
        }
      }
    } catch (error) {
      console.error('Health check error:', error)
      toast.error('Failed to check microservices health')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkHealth()
    // Auto-refresh every 30 seconds
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Healthy</Badge>
      case 'unhealthy':
        return <Badge variant="destructive">Unhealthy</Badge>
      case 'degraded':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Degraded</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'unhealthy':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const healthyServices = Object.values(health).filter(service => service.status === 'healthy').length
  const totalServices = Object.keys(health).length

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Microservices Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor the health and status of all AgentVerse microservices
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <div className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
          <Button onClick={checkHealth} disabled={isLoading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{healthyServices}</div>
              <div className="text-sm text-muted-foreground">Healthy Services</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{totalServices}</div>
              <div className="text-sm text-muted-foreground">Total Services</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {totalServices > 0 ? Math.round((healthyServices / totalServices) * 100) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">System Health</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(services).map(([key, service]) => {
          const serviceHealth = health[key]
          const status = serviceHealth?.status || 'unknown'
          
          return (
            <Card key={key} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {service.icon}
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                  </div>
                  {getStatusIcon(status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {service.description}
                </p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  {getStatusBadge(status)}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Port:</span>
                  <Badge variant="outline">{service.port}</Badge>
                </div>
                
                {serviceHealth?.error && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-xs text-red-700">
                      Error: {serviceHealth.error}
                    </p>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`${service.url}/docs`, '_blank')}
                    className="flex-1"
                  >
                    API Docs
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`${service.url}/health`, '_blank')}
                    className="flex-1"
                  >
                    Health
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Architecture</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• FastAPI Python microservices</li>
                <li>• LangChain & LangGraph integration</li>
                <li>• Redis for caching and messaging</li>
                <li>• ChromaDB for vector storage</li>
                <li>• Celery for async task processing</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Protocols</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• A2A (Agent2Agent) communication</li>
                <li>• MCP (Model Context Protocol) tools</li>
                <li>• RESTful API interfaces</li>
                <li>• WebSocket for real-time updates</li>
                <li>• JSON-RPC for protocol compliance</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col">
              <Bot className="h-6 w-6 mb-2" />
              <span className="text-sm">Test AI Agent</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex-col">
              <Activity className="h-6 w-6 mb-2" />
              <span className="text-sm">Run Workflow</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex-col">
              <Database className="h-6 w-6 mb-2" />
              <span className="text-sm">Check Tools</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex-col">
              <Network className="h-6 w-6 mb-2" />
              <span className="text-sm">View Logs</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}