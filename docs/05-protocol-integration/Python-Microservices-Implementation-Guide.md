# Python Microservices Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing Python microservices for the AgentVerse marketplace using official MCP and A2A SDKs. The implementation follows the updated system architecture that separates AI-related tasks into Python microservices while maintaining the NextJS frontend.

## Prerequisites

### Required Software
- Python 3.10+
- Docker and Docker Compose
- Redis
- PostgreSQL
- Node.js 18+ (for NextJS frontend)

### Python Dependencies
```bash
# Core dependencies for all services
pip install fastapi uvicorn pydantic sqlalchemy psycopg2-binary redis celery

# MCP SDK
pip install mcp

# A2A SDK
pip install a2a-sdk

# AI/ML dependencies
pip install langchain openai chromadb sentence-transformers

# Monitoring and observability
pip install prometheus-client opentelemetry-api opentelemetry-sdk
```

## Service 1: Workflow Engine Service

### Project Structure
```
workflow_engine/
├── Dockerfile
├── requirements.txt
├── main.py
├── models/
│   ├── __init__.py
│   ├── workflow.py
│   └── execution.py
├── services/
│   ├── __init__.py
│   ├── workflow_service.py
│   └── a2a_service.py
├── tasks/
│   ├── __init__.py
│   └── workflow_tasks.py
└── config/
    ├── __init__.py
    └── settings.py
```

### Implementation

#### 1. Requirements (requirements.txt)
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
celery==5.3.4
redis==5.0.1
a2a-sdk==0.3.2
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
pydantic==2.5.0
pydantic-settings==2.1.0
prometheus-client==0.19.0
opentelemetry-api==1.21.0
opentelemetry-sdk==1.21.0
opentelemetry-instrumentation-fastapi==0.42b0
```

#### 2. Configuration (config/settings.py)
```python
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://user:pass@localhost:5432/agentverse"
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    
    # A2A Service
    a2a_service_url: str = "http://a2a-service:8000"
    
    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    
    # Security
    secret_key: str = "your-secret-key"
    algorithm: str = "HS256"
    
    class Config:
        env_file = ".env"

settings = Settings()
```

#### 3. Models (models/workflow.py)
```python
from sqlalchemy import Column, String, JSON, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from typing import Optional, Dict, Any

Base = declarative_base()

class Workflow(Base):
    __tablename__ = "workflows"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    definition = Column(JSON, nullable=False)
    user_id = Column(String, nullable=False)
    status = Column(String, default="draft")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class WorkflowExecution(Base):
    __tablename__ = "workflow_executions"
    
    id = Column(String, primary_key=True)
    workflow_id = Column(String, nullable=False)
    user_id = Column(String, nullable=False)
    status = Column(String, default="running")
    input_data = Column(JSON)
    output_data = Column(JSON)
    logs = Column(JSON, default=list)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
```

#### 4. A2A Service Integration (services/a2a_service.py)
```python
from a2a import A2AServer, Task, AgentCard
import httpx
from typing import Dict, Any, Optional
import json

class A2AService:
    def __init__(self, a2a_service_url: str):
        self.a2a_service_url = a2a_service_url
        self.client = httpx.AsyncClient()
    
    async def create_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new A2A task"""
        response = await self.client.post(
            f"{self.a2a_service_url}/a2a/tasks",
            json=task_data
        )
        response.raise_for_status()
        return response.json()
    
    async def delegate_task(self, task_id: str, agent_id: str) -> Dict[str, Any]:
        """Delegate task to specific agent"""
        response = await self.client.post(
            f"{self.a2a_service_url}/a2a/tasks/{task_id}/delegate",
            json={"agent_id": agent_id}
        )
        response.raise_for_status()
        return response.json()
    
    async def get_task_status(self, task_id: str) -> Dict[str, Any]:
        """Get task status"""
        response = await self.client.get(
            f"{self.a2a_service_url}/a2a/tasks/{task_id}/status"
        )
        response.raise_for_status()
        return response.json()
    
    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()
```

#### 5. Workflow Service (services/workflow_service.py)
```python
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from models.workflow import Workflow, WorkflowExecution
from services.a2a_service import A2AService
from celery import Celery
import uuid
from datetime import datetime
from typing import Dict, Any, Optional

class WorkflowService:
    def __init__(self, database_url: str, a2a_service: A2AService):
        self.engine = create_engine(database_url)
        self.a2a_service = a2a_service
        self.celery_app = Celery('workflow_engine', broker='redis://localhost:6379/0')
    
    def get_session(self) -> Session:
        return Session(self.engine)
    
    async def create_workflow(self, workflow_data: Dict[str, Any], user_id: str) -> Workflow:
        """Create a new workflow"""
        with self.get_session() as session:
            workflow = Workflow(
                id=str(uuid.uuid4()),
                name=workflow_data['name'],
                description=workflow_data.get('description', ''),
                definition=workflow_data['definition'],
                user_id=user_id
            )
            session.add(workflow)
            session.commit()
            session.refresh(workflow)
            return workflow
    
    async def execute_workflow(self, workflow_id: str, inputs: Dict[str, Any], user_id: str) -> str:
        """Execute a workflow"""
        with self.get_session() as session:
            workflow = session.query(Workflow).filter(Workflow.id == workflow_id).first()
            if not workflow:
                raise ValueError("Workflow not found")
            
            # Create execution record
            execution_id = str(uuid.uuid4())
            execution = WorkflowExecution(
                id=execution_id,
                workflow_id=workflow_id,
                user_id=user_id,
                input_data=inputs,
                status="running"
            )
            session.add(execution)
            session.commit()
            
            # Create A2A task
            task_data = {
                "id": execution_id,
                "name": f"Workflow Execution: {workflow.name}",
                "description": workflow.description,
                "input_data": inputs,
                "metadata": {
                    "workflow_id": workflow_id,
                    "user_id": user_id
                }
            }
            
            await self.a2a_service.create_task(task_data)
            
            # Start Celery task for async execution
            self.celery_app.send_task(
                'workflow_engine.execute_workflow_task',
                args=[execution_id, workflow.definition, inputs, user_id]
            )
            
            return execution_id
    
    async def get_execution_status(self, execution_id: str) -> Optional[Dict[str, Any]]:
        """Get workflow execution status"""
        with self.get_session() as session:
            execution = session.query(WorkflowExecution).filter(
                WorkflowExecution.id == execution_id
            ).first()
            
            if not execution:
                return None
            
            return {
                "id": execution.id,
                "status": execution.status,
                "input_data": execution.input_data,
                "output_data": execution.output_data,
                "logs": execution.logs,
                "started_at": execution.started_at.isoformat() if execution.started_at else None,
                "completed_at": execution.completed_at.isoformat() if execution.completed_at else None
            }
```

#### 6. Celery Tasks (tasks/workflow_tasks.py)
```python
from celery import Celery
from services.a2a_service import A2AService
from services.workflow_service import WorkflowService
import asyncio
from typing import Dict, Any

celery_app = Celery('workflow_engine', broker='redis://localhost:6379/0')

@celery_app.task
def execute_workflow_task(execution_id: str, workflow_definition: Dict[str, Any], inputs: Dict[str, Any], user_id: str):
    """Execute workflow as Celery task"""
    async def _execute():
        a2a_service = A2AService("http://a2a-service:8000")
        workflow_service = WorkflowService("postgresql://user:pass@localhost:5432/agentverse", a2a_service)
        
        try:
            # Execute workflow nodes
            for node in workflow_definition['nodes']:
                if node['type'] == 'agent':
                    # Create A2A task for agent execution
                    agent_task_data = {
                        "id": f"{execution_id}_{node['id']}",
                        "name": f"Agent: {node['data']['agent_name']}",
                        "input_data": node['data']['inputs'],
                        "metadata": {
                            "node_id": node['id'],
                            "execution_id": execution_id
                        }
                    }
                    
                    # Delegate to agent
                    await a2a_service.delegate_task(
                        agent_task_data["id"],
                        node['data']['agent_id']
                    )
            
            # Update execution status
            with workflow_service.get_session() as session:
                execution = session.query(WorkflowExecution).filter(
                    WorkflowExecution.id == execution_id
                ).first()
                if execution:
                    execution.status = "completed"
                    execution.completed_at = datetime.utcnow()
                    session.commit()
        
        except Exception as e:
            # Update execution status to failed
            with workflow_service.get_session() as session:
                execution = session.query(WorkflowExecution).filter(
                    WorkflowExecution.id == execution_id
                ).first()
                if execution:
                    execution.status = "failed"
                    execution.completed_at = datetime.utcnow()
                    execution.logs.append({
                        "timestamp": datetime.utcnow().isoformat(),
                        "level": "error",
                        "message": str(e)
                    })
                    session.commit()
        
        finally:
            await a2a_service.close()
    
    # Run async function in sync context
    asyncio.run(_execute())
```

#### 7. Main Application (main.py)
```python
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from services.workflow_service import WorkflowService
from services.a2a_service import A2AService
from config.settings import settings
from models.workflow import Base
from sqlalchemy import create_engine
import uvicorn

# Create database tables
engine = create_engine(settings.database_url)
Base.metadata.create_all(bind=engine)

# Initialize services
a2a_service = A2AService(settings.a2a_service_url)
workflow_service = WorkflowService(settings.database_url, a2a_service)

app = FastAPI(title="Workflow Engine Service")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/workflows")
async def create_workflow(workflow_data: dict, user_id: str):
    """Create a new workflow"""
    try {
        workflow = await workflow_service.create_workflow(workflow_data, user_id)
        return {"workflow": workflow}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/workflows/{workflow_id}/execute")
async def execute_workflow(workflow_id: str, request: dict):
    """Execute a workflow"""
    try {
        execution_id = await workflow_service.execute_workflow(
            workflow_id,
            request['inputs'],
            request['user_id']
        )
        return {"execution_id": execution_id, "status": "started"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/executions/{execution_id}")
async def get_execution_status(execution_id: str):
    """Get workflow execution status"""
    status = await workflow_service.get_execution_status(execution_id)
    if not status:
        raise HTTPException(status_code=404, detail="Execution not found")
    return status

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "workflow-engine"}

if __name__ == "__main__":
    uvicorn.run(app, host=settings.api_host, port=settings.api_port)
```

#### 8. Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Service 2: MCP Server Service

### Project Structure
```
mcp_server/
├── Dockerfile
├── requirements.txt
├── main.py
├── models/
│   ├── __init__.py
│   └── tool.py
├── services/
│   ├── __init__.py
│   ├── mcp_service.py
│   └── tool_service.py
└── config/
    ├── __init__.py
    └── settings.py
```

### Implementation

#### 1. Requirements (requirements.txt)
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
mcp==0.1.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
pydantic==2.5.0
pydantic-settings==2.1.0
httpx==0.25.2
```

#### 2. MCP Service (services/mcp_service.py)
```python
from mcp import Server, StdioServerTransport
from mcp.types import (
    CallToolRequest, 
    ListToolsRequest, 
    ListResourcesRequest,
    ReadResourceRequest,
    Tool,
    Resource
)
from services.tool_service import ToolService
from typing import List, Dict, Any
import json

class MCPService:
    def __init__(self, tool_service: ToolService):
        self.tool_service = tool_service
        self.server = Server("agentverse-mcp-server")
        self.setup_handlers()
    
    def setup_handlers(self):
        """Setup MCP server handlers"""
        self.server.list_tools = self.list_tools
        self.server.call_tool = self.call_tool
        self.server.list_resources = self.list_resources
        self.server.read_resource = self.read_resource
    
    async def list_tools(self, request: ListToolsRequest) -> List[Tool]:
        """List available tools for user"""
        user_id = request.metadata.get('user_id') if request.metadata else None
        tools = await self.tool_service.get_user_tools(user_id)
        
        mcp_tools = []
        for tool in tools:
            mcp_tool = Tool(
                name=tool.name,
                description=tool.description,
                inputSchema=tool.input_schema
            )
            mcp_tools.append(mcp_tool)
        
        return mcp_tools
    
    async def call_tool(self, request: CallToolRequest) -> Dict[str, Any]:
        """Execute a tool"""
        tool_name = request.name
        arguments = request.arguments
        user_id = request.metadata.get('user_id') if request.metadata else None
        
        # Validate tool access
        if not await self.tool_service.can_access_tool(user_id, tool_name):
            raise Exception("Tool access denied")
        
        # Execute tool
        result = await self.tool_service.execute_tool(tool_name, arguments, user_id)
        
        return {
            "content": [
                {
                    "type": "text",
                    "text": json.dumps(result)
                }
            ]
        }
    
    async def list_resources(self, request: ListResourcesRequest) -> List[Resource]:
        """List available resources"""
        # Implementation for resource listing
        return []
    
    async def read_resource(self, request: ReadResourceRequest) -> Dict[str, Any]:
        """Read a resource"""
        # Implementation for resource reading
        return {"content": []}
    
    async def start(self):
        """Start MCP server"""
        transport = StdioServerTransport()
        await self.server.run(transport)
```

#### 3. Tool Service (services/tool_service.py)
```python
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from models.tool import Tool
import httpx
from typing import List, Dict, Any, Optional
import json

class ToolService:
    def __init__(self, database_url: str):
        self.engine = create_engine(database_url)
        self.client = httpx.AsyncClient()
    
    def get_session(self) -> Session:
        return Session(self.engine)
    
    async def get_user_tools(self, user_id: Optional[str]) -> List[Tool]:
        """Get tools available to specific user"""
        with self.get_session() as session:
            if user_id:
                # Get user-specific tools
                tools = session.query(Tool).filter(
                    Tool.user_id == user_id,
                    Tool.is_active == True
                ).all()
            else:
                # Get public tools
                tools = session.query(Tool).filter(
                    Tool.is_public == True,
                    Tool.is_active == True
                ).all()
            
            return tools
    
    async def can_access_tool(self, user_id: Optional[str], tool_name: str) -> bool:
        """Check if user can access tool"""
        with self.get_session() as session:
            tool = session.query(Tool).filter(Tool.name == tool_name).first()
            if not tool:
                return False
            
            # Public tools are accessible to everyone
            if tool.is_public:
                return True
            
            # Private tools require user authentication
            if not user_id:
                return False
            
            # Check if user owns the tool
            return tool.user_id == user_id
    
    async def execute_tool(self, tool_name: str, arguments: Dict[str, Any], user_id: Optional[str]) -> Dict[str, Any]:
        """Execute a tool"""
        with self.get_session() as session:
            tool = session.query(Tool).filter(Tool.name == tool_name).first()
            if not tool:
                raise Exception("Tool not found")
            
            # Make HTTP request to tool endpoint
            try:
                response = await self.client.post(
                    tool.api_endpoint,
                    json=arguments,
                    headers={
                        "Authorization": f"Bearer {tool.api_key}",
                        "Content-Type": "application/json"
                    }
                )
                response.raise_for_status()
                return response.json()
            except Exception as e:
                raise Exception(f"Tool execution failed: {str(e)}")
```

#### 4. Main Application (main.py)
```python
from fastapi import FastAPI, HTTPException
from services.mcp_service import MCPService
from services.tool_service import ToolService
from config.settings import settings
import asyncio
import uvicorn

# Initialize services
tool_service = ToolService(settings.database_url)
mcp_service = MCPService(tool_service)

app = FastAPI(title="MCP Server Service")

@app.post("/mcp/tools")
async def register_tool(tool_data: dict):
    """Register a new tool with MCP server"""
    try {
        # Implementation for tool registration
        return {"status": "registered", "tool_name": tool_data['name']}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/mcp/tools/{tool_name}/invoke")
async def invoke_tool(tool_name: str, request: dict):
    """Invoke a tool via MCP"""
    try {
        result = await tool_service.execute_tool(
            tool_name,
            request['arguments'],
            request.get('metadata', {}).get('user_id')
        )
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "mcp-server"}

# Start MCP server in background
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(mcp_service.start())

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

## Service 3: A2A Protocol Service

### Project Structure
```
a2a_service/
├── Dockerfile
├── requirements.txt
├── main.py
├── models/
│   ├── __init__.py
│   ├── agent.py
│   └── task.py
├── services/
│   ├── __init__.py
│   ├── a2a_service.py
│   └── agent_service.py
└── config/
    ├── __init__.py
    └── settings.py
```

### Implementation

#### 1. Requirements (requirements.txt)
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
a2a-sdk==0.3.2
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
pydantic==2.5.0
pydantic-settings==2.1.0
```

#### 2. A2A Service (services/a2a_service.py)
```python
from a2a import A2AServer, AgentCard, Task, Message, Artifact
from services.agent_service import AgentService
from typing import Dict, Any, List
import json

class A2AProtocolService:
    def __init__(self, agent_service: AgentService):
        self.agent_service = agent_service
        self.a2a_server = A2AServer()
        self.active_tasks = {}
        self.setup_handlers()
    
    def setup_handlers(self):
        """Setup A2A server handlers"""
        # Register handlers for A2A protocol methods
        pass
    
    async def register_agent(self, agent_data: Dict[str, Any]) -> Dict[str, Any]:
        """Register an agent with A2A protocol"""
        # Create agent card
        card = AgentCard(
            name=agent_data['name'],
            description=agent_data['description'],
            service_endpoint=agent_data['service_endpoint'],
            capabilities=agent_data['capabilities']
        )
        
        # Register with A2A server
        await self.a2a_server.register_agent(card)
        
        # Save to database
        agent = await self.agent_service.create_agent(agent_data)
        
        return {"status": "registered", "agent_id": agent.id}
    
    async def create_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new A2A task"""
        task = Task(
            id=task_data['id'],
            name=task_data['name'],
            description=task_data.get('description', ''),
            input_data=task_data.get('input_data', {})
        )
        
        # Register task with A2A server
        await self.a2a_server.create_task(task)
        
        # Save to database
        saved_task = await self.agent_service.create_task(task_data)
        self.active_tasks[task.id] = task
        
        return {"task_id": task.id, "status": "created"}
    
    async def delegate_task(self, task_id: str, agent_id: str) -> Dict[str, Any]:
        """Delegate task to specific agent"""
        if task_id not in self.active_tasks:
            raise Exception("Task not found")
        
        agent = await self.agent_service.get_agent(agent_id)
        if not agent:
            raise Exception("Agent not found")
        
        task = self.active_tasks[task_id]
        
        # Delegate task via A2A protocol
        result = await self.a2a_server.delegate_task(task, agent)
        
        return {"status": "delegated", "result": result}
    
    async def get_task_status(self, task_id: str) -> Dict[str, Any]:
        """Get status of a task"""
        if task_id not in self.active_tasks:
            raise Exception("Task not found")
        
        task = self.active_tasks[task_id]
        return {"task_id": task_id, "status": task.status}
```

## Docker Compose Configuration

### Complete docker-compose.yml
```yaml
version: '3.8'

services:
  # Python AI Services
  workflow-engine:
    build: ./workflow_engine
    ports:
      - "8001:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/agentverse
      - REDIS_URL=redis://redis:6379/0
      - A2A_SERVICE_URL=http://a2a-service:8000
    depends_on:
      - postgres
      - redis
    networks:
      - agentverse-network

  mcp-server:
    build: ./mcp_server
    ports:
      - "8003:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/agentverse
    depends_on:
      - postgres
    networks:
      - agentverse-network

  a2a-service:
    build: ./a2a_service
    ports:
      - "8004:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/agentverse
    depends_on:
      - postgres
    networks:
      - agentverse-network

  agent-runtime:
    build: ./agent_runtime
    ports:
      - "8002:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/agentverse
      - A2A_SERVICE_URL=http://a2a-service:8000
      - MCP_SERVER_URL=http://mcp-server:8000
    depends_on:
      - postgres
      - a2a-service
      - mcp-server
    networks:
      - agentverse-network

  ai-orchestrator:
    build: ./ai_orchestrator
    ports:
      - "8005:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/agentverse
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - VECTOR_DB_PATH=./vector_db
    depends_on:
      - postgres
    networks:
      - agentverse-network

  # Infrastructure
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - agentverse-network

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=agentverse
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - agentverse-network

  # Celery Worker for Workflow Engine
  workflow-worker:
    build: ./workflow_engine
    command: celery -A tasks.workflow_tasks worker --loglevel=info
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/agentverse
      - REDIS_URL=redis://redis:6379/0
      - A2A_SERVICE_URL=http://a2a-service:8000
    depends_on:
      - postgres
      - redis
      - a2a-service
    networks:
      - agentverse-network

  # NextJS Frontend (existing)
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - WORKFLOW_ENGINE_URL=http://workflow-engine:8000
      - AGENT_RUNTIME_URL=http://agent-runtime:8000
      - MCP_SERVER_URL=http://mcp-server:8000
      - A2A_SERVICE_URL=http://a2a-service:8000
      - AI_ORCHESTRATOR_URL=http://ai-orchestrator:8000
    depends_on:
      - workflow-engine
      - agent-runtime
      - mcp-server
      - a2a-service
      - ai-orchestrator
    networks:
      - agentverse-network

volumes:
  postgres_data:

networks:
  agentverse-network:
    driver: bridge
```

## NextJS API Gateway Updates

### Updated API Routes

#### 1. Workflow API Proxy (app/api/workflows/route.ts)
```typescript
import { type NextRequest, NextResponse } from "next/server"

const WORKFLOW_ENGINE_URL = process.env.WORKFLOW_ENGINE_URL || "http://workflow-engine:8000"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 })
  }

  try {
    const response = await fetch(`${WORKFLOW_ENGINE_URL}/workflows?user_id=${userId}`)
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching workflows:", error)
    return NextResponse.json({ error: "Failed to fetch workflows" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const response = await fetch(`${WORKFLOW_ENGINE_URL}/workflows`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error creating workflow:", error)
    return NextResponse.json({ error: "Failed to create workflow" }, { status: 500 })
  }
}
```

#### 2. Workflow Execution API Proxy (app/api/workflows/[id]/execute/route.ts)
```typescript
import { NextResponse } from "next/server"

const WORKFLOW_ENGINE_URL = process.env.WORKFLOW_ENGINE_URL || "http://workflow-engine:8000"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const workflowId = params.id
  try {
    const body = await request.json()
    const response = await fetch(`${WORKFLOW_ENGINE_URL}/workflows/${workflowId}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error(`Error executing workflow ${workflowId}:`, error)
    return NextResponse.json({ error: "Failed to execute workflow" }, { status: 500 })
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string, executionId: string } }
) {
  const { executionId } = params
  try {
    const response = await fetch(`${WORKFLOW_ENGINE_URL}/executions/${executionId}`)
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error(`Error fetching execution ${executionId}:`, error)
    return NextResponse.json({ error: "Failed to fetch execution" }, { status: 500 })
  }
}
```

## Deployment and Testing

### 1. Local Development Setup
```bash
# Clone the repository
git clone <repository-url>
cd agentverse-marketplace

# Create Python service directories
mkdir -p workflow_engine mcp_server a2a_service agent_runtime ai_orchestrator

# Copy implementation files to respective directories
# (Copy the files from the sections above)

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start services
docker-compose up -d

# Check service health
curl http://localhost:8001/health  # Workflow Engine
curl http://localhost:8003/health  # MCP Server
curl http://localhost:8004/health  # A2A Service
```

### 2. Testing the Services
```bash
# Test workflow creation
curl -X POST http://localhost:8001/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Workflow",
    "description": "A test workflow",
    "definition": {
      "nodes": [
        {
          "id": "node1",
          "type": "agent",
          "data": {
            "agent_name": "Test Agent",
            "agent_id": "agent-123"
          }
        }
      ]
    },
    "user_id": "user-123"
  }'

# Test workflow execution
curl -X POST http://localhost:8001/workflows/{workflow_id}/execute \
  -H "Content-Type: application/json" \
  -d '{
    "inputs": {"test": "data"},
    "user_id": "user-123"
  }'
```

### 3. Monitoring and Observability
```bash
# Check service logs
docker-compose logs workflow-engine
docker-compose logs mcp-server
docker-compose logs a2a-service

# Monitor Celery tasks
docker-compose logs workflow-worker

# Check database
docker-compose exec postgres psql -U user -d agentverse -c "SELECT * FROM workflows;"
```

## Conclusion

This implementation guide provides a complete foundation for building Python microservices for the AgentVerse marketplace using official MCP and A2A SDKs. The architecture:

1. **Separates concerns** between frontend (NextJS) and AI services (Python)
2. **Uses official SDKs** for protocol compliance
3. **Provides scalability** through microservices architecture
4. **Maintains interoperability** through standardized APIs
5. **Ensures observability** through comprehensive monitoring

The next steps would be to:
1. Implement the remaining services (Agent Runtime, AI Orchestrator)
2. Add comprehensive error handling and retry logic
3. Implement security features (authentication, authorization)
4. Add comprehensive testing suites
5. Set up CI/CD pipelines for automated deployment

---

**Document Version**: 1.0  
**Last Updated**: [Current Date]  
**Next Review**: Monthly  
**Stakeholders**: Development Team, DevOps Team, Architecture Team
