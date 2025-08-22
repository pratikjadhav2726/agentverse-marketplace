'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Loader2, Send, Bot, User, Clock } from 'lucide-react'
import { aiOrchestrator } from '@/lib/microservices'
import { useAuth } from '@/lib/auth-context'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  execution_time?: number
  intermediate_steps?: any[]
}

interface AIAgentChatProps {
  agentId: string
  agentName: string
  agentDescription: string
  className?: string
}

export function AIAgentChat({ 
  agentId, 
  agentName, 
  agentDescription, 
  className 
}: AIAgentChatProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string>()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || !user || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await aiOrchestrator.chatWithAgent(
        agentId,
        userMessage.content,
        user.id,
        sessionId,
        { agent_name: agentName }
      )

      if (!sessionId) {
        setSessionId(response.session_id)
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: response.timestamp,
        execution_time: response.execution_time,
        intermediate_steps: response.intermediate_steps
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatExecutionTime = (time?: number) => {
    if (!time) return ''
    return time < 1 ? `${Math.round(time * 1000)}ms` : `${time.toFixed(2)}s`
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Chat with {agentName}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{agentDescription}</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <ScrollArea className="h-96 w-full rounded-md border p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Start a conversation with {agentName}</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex gap-2 max-w-[80%] ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {message.role === 'user' ? (
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                        <Bot className="h-4 w-4 text-secondary-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <div
                      className={`rounded-lg px-3 py-2 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                      {message.execution_time && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatExecutionTime(message.execution_time)}</span>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {message.intermediate_steps && message.intermediate_steps.length > 0 && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          {message.intermediate_steps.length} steps
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-secondary-foreground" />
                </div>
                <div className="bg-muted rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Message ${agentName}...`}
            disabled={isLoading || !user}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !input.trim() || !user}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {!user && (
          <p className="text-sm text-muted-foreground text-center">
            Please sign in to chat with AI agents
          </p>
        )}
      </CardContent>
    </Card>
  )
}