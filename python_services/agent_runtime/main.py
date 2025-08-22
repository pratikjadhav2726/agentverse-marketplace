from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any, Union
import asyncio
import json
import uuid
import time
from datetime import datetime
import logging
import httpx
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.tools import BaseTool, tool
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.tools import Tool
import redis

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="Agent Runtime Service",
    description="AI agent execution runtime with LangChain integration",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redis client for agent state management
redis_client = redis.Redis(host='localhost', port=6379, db=2, decode_responses=True)

# Pydantic models
class AgentCard(BaseModel):
    name: str
    description: str
    version: str = "1.0.0"
    service_endpoint: str
    capabilities: List[Dict[str, Any]]
    supported_modalities: List[str] = Field(default_factory=lambda: ["text"])
    a2a_capabilities: Dict[str, bool] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)

class AgentConfig(BaseModel):
    id: str
    name: str
    description: str
    agent_card: AgentCard
    llm_config: Dict[str, Any] = Field(default_factory=dict)
    tools: List[str] = Field(default_factory=list)
    system_prompt: Optional[str] = None
    temperature: float = 0.7
    max_tokens: int = 1000

class TaskRequest(BaseModel):
    id: str
    agent_id: str
    input_data: Dict[str, Any]
    context: Dict[str, Any] = Field(default_factory=dict)
    user_id: str
    priority: str = "normal"
    timeout: int = 300  # 5 minutes default

class TaskResponse(BaseModel):
    task_id: str
    status: str
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    execution_time: Optional[float] = None
    timestamp: datetime = Field(default_factory=datetime.now)

class AgentExecutionRequest(BaseModel):
    agent_id: str
    query: str
    context: Dict[str, Any] = Field(default_factory=dict)
    user_id: str

# In-memory storage for registered agents and tasks
registered_agents: Dict[str, AgentConfig] = {}
agent_executors: Dict[str, AgentExecutor] = {}
active_tasks: Dict[str, TaskRequest] = {}

class AgentRuntimeService:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-3.5-turbo",
            temperature=0.7,
            max_tokens=1000
        )
        self.default_tools = self._create_default_tools()
    
    def _create_default_tools(self) -> List[Tool]:
        """Create default tools available to all agents"""
        
        @tool
        def calculator(expression: str) -> str:
            """Calculate mathematical expressions safely"""
            try:
                # Simple calculator - in production, use a proper math parser
                result = eval(expression.replace("^", "**"))
                return str(result)
            except Exception as e:
                return f"Error: {str(e)}"
        
        @tool
        def text_analyzer(text: str) -> str:
            """Analyze text for sentiment, length, and basic statistics"""
            words = text.split()
            return json.dumps({
                "word_count": len(words),
                "character_count": len(text),
                "sentence_count": text.count('.') + text.count('!') + text.count('?'),
                "avg_word_length": sum(len(word) for word in words) / len(words) if words else 0
            })
        
        @tool
        def web_search_simulator(query: str) -> str:
            """Simulate web search results (placeholder for actual search integration)"""
            return json.dumps({
                "query": query,
                "results": [
                    {"title": f"Result for {query}", "url": "https://example.com", "snippet": f"Information about {query}"}
                ],
                "timestamp": datetime.now().isoformat()
            })
        
        return [calculator, text_analyzer, web_search_simulator]
    
    async def register_agent(self, agent_config: AgentConfig) -> Dict[str, Any]:
        """Register a new AI agent"""
        try:
            # Validate agent configuration
            if not agent_config.id or not agent_config.name:
                raise ValueError("Agent ID and name are required")
            
            # Store agent configuration
            registered_agents[agent_config.id] = agent_config
            
            # Create LangChain agent executor
            executor = await self._create_agent_executor(agent_config)
            agent_executors[agent_config.id] = executor
            
            # Store in Redis for persistence
            redis_client.set(f"agent:{agent_config.id}", agent_config.json())
            
            logger.info(f"Registered agent {agent_config.id}: {agent_config.name}")
            
            return {
                "status": "registered",
                "agent_id": agent_config.id,
                "capabilities": agent_config.agent_card.capabilities,
                "tools_count": len(agent_config.tools)
            }
            
        except Exception as e:
            logger.error(f"Failed to register agent {agent_config.id}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def _create_agent_executor(self, agent_config: AgentConfig) -> AgentExecutor:
        """Create a LangChain agent executor"""
        try:
            # Prepare tools
            tools = self.default_tools.copy()
            
            # Add custom tools based on agent configuration
            for tool_name in agent_config.tools:
                custom_tool = await self._load_custom_tool(tool_name)
                if custom_tool:
                    tools.append(custom_tool)
            
            # Create prompt template
            system_prompt = agent_config.system_prompt or f"""
            You are {agent_config.name}, an AI agent with the following capabilities:
            {agent_config.description}
            
            You have access to the following tools: {[tool.name for tool in tools]}
            
            Always provide helpful, accurate responses and use tools when appropriate.
            """
            
            prompt = ChatPromptTemplate.from_messages([
                ("system", system_prompt),
                MessagesPlaceholder(variable_name="chat_history"),
                ("user", "{input}"),
                MessagesPlaceholder(variable_name="agent_scratchpad"),
            ])
            
            # Configure LLM with agent-specific settings
            llm = ChatOpenAI(
                model=agent_config.llm_config.get("model", "gpt-3.5-turbo"),
                temperature=agent_config.temperature,
                max_tokens=agent_config.max_tokens
            )
            
            # Create agent
            agent = create_openai_functions_agent(llm, tools, prompt)
            
            # Create executor
            agent_executor = AgentExecutor(
                agent=agent,
                tools=tools,
                verbose=True,
                max_iterations=10,
                max_execution_time=300,  # 5 minutes
                handle_parsing_errors=True
            )
            
            return agent_executor
            
        except Exception as e:
            logger.error(f"Failed to create agent executor: {str(e)}")
            raise
    
    async def _load_custom_tool(self, tool_name: str) -> Optional[Tool]:
        """Load custom tools (placeholder for MCP integration)"""
        # This would integrate with the MCP service to load custom tools
        # For now, return None as placeholder
        return None
    
    async def execute_agent(self, request: AgentExecutionRequest) -> TaskResponse:
        """Execute an AI agent with the given query"""
        start_time = time.time()
        
        try:
            # Get agent executor
            executor = agent_executors.get(request.agent_id)
            if not executor:
                # Try to load agent from Redis
                agent_data = redis_client.get(f"agent:{request.agent_id}")
                if agent_data:
                    agent_config = AgentConfig(**json.loads(agent_data))
                    executor = await self._create_agent_executor(agent_config)
                    agent_executors[request.agent_id] = executor
                else:
                    raise HTTPException(status_code=404, detail="Agent not found")
            
            # Prepare execution context
            execution_context = {
                "user_id": request.user_id,
                "agent_id": request.agent_id,
                "context": request.context,
                "timestamp": datetime.now().isoformat()
            }
            
            # Execute the agent
            result = await executor.ainvoke({
                "input": request.query,
                "chat_history": [],
                "context": execution_context
            })
            
            execution_time = time.time() - start_time
            
            # Create response
            response = TaskResponse(
                task_id=str(uuid.uuid4()),
                status="completed",
                result={
                    "output": result.get("output", ""),
                    "intermediate_steps": result.get("intermediate_steps", []),
                    "context": execution_context
                },
                execution_time=execution_time
            )
            
            logger.info(f"Agent {request.agent_id} executed successfully in {execution_time:.2f}s")
            return response
            
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"Agent execution failed for {request.agent_id}: {str(e)}")
            
            return TaskResponse(
                task_id=str(uuid.uuid4()),
                status="failed",
                error=str(e),
                execution_time=execution_time
            )
    
    async def handle_a2a_task(self, task: TaskRequest) -> TaskResponse:
        """Handle A2A protocol task delegation"""
        try:
            # Store task
            active_tasks[task.id] = task
            
            # Convert A2A task to agent execution request
            execution_request = AgentExecutionRequest(
                agent_id=task.agent_id,
                query=json.dumps(task.input_data),
                context=task.context,
                user_id=task.user_id
            )
            
            # Execute the task
            result = await self.execute_agent(execution_request)
            
            # Update task status
            if task.id in active_tasks:
                del active_tasks[task.id]
            
            return result
            
        except Exception as e:
            logger.error(f"A2A task handling failed for {task.id}: {str(e)}")
            return TaskResponse(
                task_id=task.id,
                status="failed",
                error=str(e)
            )
    
    async def get_agent_info(self, agent_id: str) -> Dict[str, Any]:
        """Get information about a registered agent"""
        agent_config = registered_agents.get(agent_id)
        if not agent_config:
            # Try to load from Redis
            agent_data = redis_client.get(f"agent:{agent_id}")
            if agent_data:
                agent_config = AgentConfig(**json.loads(agent_data))
            else:
                raise HTTPException(status_code=404, detail="Agent not found")
        
        return {
            "id": agent_config.id,
            "name": agent_config.name,
            "description": agent_config.description,
            "capabilities": agent_config.agent_card.capabilities,
            "supported_modalities": agent_config.agent_card.supported_modalities,
            "tools": agent_config.tools,
            "status": "active" if agent_id in agent_executors else "inactive"
        }
    
    async def list_agents(self) -> List[Dict[str, Any]]:
        """List all registered agents"""
        agents = []
        for agent_id, agent_config in registered_agents.items():
            agents.append({
                "id": agent_config.id,
                "name": agent_config.name,
                "description": agent_config.description,
                "status": "active" if agent_id in agent_executors else "inactive",
                "capabilities_count": len(agent_config.agent_card.capabilities),
                "tools_count": len(agent_config.tools)
            })
        return agents

# Global agent runtime instance
agent_runtime = AgentRuntimeService()

# API Routes
@app.post("/agents/register")
async def register_agent(agent_config: AgentConfig):
    """Register a new AI agent"""
    return await agent_runtime.register_agent(agent_config)

@app.post("/agents/{agent_id}/execute")
async def execute_agent(agent_id: str, request: AgentExecutionRequest):
    """Execute an AI agent"""
    request.agent_id = agent_id
    return await agent_runtime.execute_agent(request)

@app.post("/tasks")
async def handle_task(task: TaskRequest):
    """Handle A2A protocol task"""
    return await agent_runtime.handle_a2a_task(task)

@app.get("/agents/{agent_id}")
async def get_agent_info(agent_id: str):
    """Get agent information"""
    return await agent_runtime.get_agent_info(agent_id)

@app.get("/agents")
async def list_agents():
    """List all registered agents"""
    return await agent_runtime.list_agents()

@app.get("/tasks/{task_id}/status")
async def get_task_status(task_id: str):
    """Get task execution status"""
    task = active_tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return {
        "task_id": task_id,
        "status": "running" if task_id in active_tasks else "completed",
        "agent_id": task.agent_id,
        "created_at": task.context.get("created_at", datetime.now().isoformat())
    }

@app.delete("/agents/{agent_id}")
async def unregister_agent(agent_id: str):
    """Unregister an agent"""
    if agent_id in registered_agents:
        del registered_agents[agent_id]
    
    if agent_id in agent_executors:
        del agent_executors[agent_id]
    
    # Remove from Redis
    redis_client.delete(f"agent:{agent_id}")
    
    return {"status": "unregistered", "agent_id": agent_id}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check Redis connection
        redis_client.ping()
        
        # Check LangChain availability
        test_llm = ChatOpenAI(model="gpt-3.5-turbo")
        
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "services": {
                "redis": "connected",
                "langchain": "available",
                "registered_agents": len(registered_agents),
                "active_executors": len(agent_executors)
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=503, detail="Service unhealthy")

@app.on_event("startup")
async def startup_event():
    """Initialize the service on startup"""
    logger.info("Agent Runtime Service starting up...")
    
    # Test connections
    try:
        redis_client.ping()
        logger.info("Redis connection established")
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {str(e)}")
    
    # Load existing agents from Redis
    try:
        agent_keys = redis_client.keys("agent:*")
        for key in agent_keys:
            agent_data = redis_client.get(key)
            if agent_data:
                agent_config = AgentConfig(**json.loads(agent_data))
                registered_agents[agent_config.id] = agent_config
                logger.info(f"Loaded agent {agent_config.id} from Redis")
    except Exception as e:
        logger.error(f"Failed to load agents from Redis: {str(e)}")
    
    logger.info("Agent Runtime Service ready")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Agent Runtime Service shutting down...")
    redis_client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)