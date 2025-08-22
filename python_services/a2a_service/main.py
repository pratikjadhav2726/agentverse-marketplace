from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any, Set
import asyncio
import json
import uuid
import time
from datetime import datetime, timedelta
from enum import Enum
import logging
import httpx
import redis
from dataclasses import dataclass

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="A2A Protocol Service",
    description="Agent2Agent protocol for inter-agent communication and task delegation",
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

# Redis client for agent registry and message passing
redis_client = redis.Redis(host='localhost', port=6379, db=4, decode_responses=True)

# Enums
class TaskStatus(str, Enum):
    SUBMITTED = "submitted"
    WORKING = "working"
    INPUT_REQUIRED = "input_required"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class MessageType(str, Enum):
    TASK_DELEGATION = "task_delegation"
    TASK_UPDATE = "task_update"
    TASK_RESULT = "task_result"
    AGENT_DISCOVERY = "agent_discovery"
    HEARTBEAT = "heartbeat"

# Pydantic models
class AgentCard(BaseModel):
    name: str
    description: str
    version: str = "1.0.0"
    service_endpoint: str
    capabilities: List[Dict[str, Any]]
    supported_modalities: List[str] = Field(default_factory=lambda: ["text"])
    a2a_capabilities: Dict[str, bool] = Field(default_factory=dict)
    authentication_required: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)

class Task(BaseModel):
    id: str
    name: str
    description: str
    agent_id: str
    status: TaskStatus = TaskStatus.SUBMITTED
    priority: str = "normal"  # low, normal, high, urgent
    input_data: Dict[str, Any]
    output_data: Optional[Dict[str, Any]] = None
    context: Dict[str, Any] = Field(default_factory=dict)
    timeout: int = 300  # 5 minutes default
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    user_id: str

class A2AMessage(BaseModel):
    id: str
    type: MessageType
    task_id: Optional[str] = None
    from_agent: str
    to_agent: str
    payload: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.now)
    correlation_id: Optional[str] = None

class AgentDiscoveryRequest(BaseModel):
    capabilities: Optional[List[str]] = None
    modalities: Optional[List[str]] = None
    performance_threshold: Optional[float] = None
    max_response_time: Optional[int] = None
    filters: Dict[str, Any] = Field(default_factory=dict)

class TaskCreationRequest(BaseModel):
    agent_id: str
    name: str
    description: str
    input_data: Dict[str, Any]
    context: Dict[str, Any] = Field(default_factory=dict)
    priority: str = "normal"
    timeout: int = 300
    user_id: str

class Agent(BaseModel):
    id: str
    agent_card: AgentCard
    status: str = "active"  # active, inactive, busy
    performance_metrics: Dict[str, float] = Field(default_factory=dict)
    last_heartbeat: datetime = Field(default_factory=datetime.now)
    registered_at: datetime = Field(default_factory=datetime.now)

# In-memory storage (in production, use Redis/database)
registered_agents: Dict[str, Agent] = {}
active_tasks: Dict[str, Task] = {}
message_queue: List[A2AMessage] = []

class A2AProtocolService:
    def __init__(self):
        self.capability_index: Dict[str, Set[str]] = {}  # capability -> set of agent IDs
        self.modality_index: Dict[str, Set[str]] = {}   # modality -> set of agent IDs
        self.performance_metrics: Dict[str, Dict[str, float]] = {}
    
    async def register_agent(self, agent_card: AgentCard) -> str:
        """Register an agent with the A2A protocol"""
        try:
            agent_id = str(uuid.uuid4())
            
            # Validate agent card
            if not agent_card.name or not agent_card.service_endpoint:
                raise ValueError("Agent name and service endpoint are required")
            
            # Check endpoint availability
            endpoint_available = await self._check_endpoint_health(agent_card.service_endpoint)
            if not endpoint_available:
                raise ValueError(f"Agent endpoint {agent_card.service_endpoint} is not accessible")
            
            # Create agent
            agent = Agent(
                id=agent_id,
                agent_card=agent_card,
                performance_metrics={
                    "success_rate": 1.0,
                    "avg_response_time": 0.0,
                    "throughput": 0.0
                }
            )
            
            # Store agent
            registered_agents[agent_id] = agent
            
            # Index agent capabilities
            await self._index_agent(agent)
            
            # Store in Redis
            redis_client.set(f"a2a_agent:{agent_id}", agent.json())
            
            logger.info(f"Registered agent {agent_id}: {agent_card.name}")
            return agent_id
            
        except Exception as e:
            logger.error(f"Failed to register agent: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def _check_endpoint_health(self, endpoint: str) -> bool:
        """Check if agent endpoint is healthy"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{endpoint}/health", timeout=5.0)
                return response.status_code == 200
        except Exception:
            return False
    
    async def _index_agent(self, agent: Agent):
        """Index agent for discovery"""
        # Index capabilities
        for capability in agent.agent_card.capabilities:
            cap_name = capability.get("name", "")
            if cap_name:
                if cap_name not in self.capability_index:
                    self.capability_index[cap_name] = set()
                self.capability_index[cap_name].add(agent.id)
        
        # Index modalities
        for modality in agent.agent_card.supported_modalities:
            if modality not in self.modality_index:
                self.modality_index[modality] = set()
            self.modality_index[modality].add(agent.id)
        
        # Initialize performance metrics
        self.performance_metrics[agent.id] = agent.performance_metrics.copy()
    
    async def discover_agents(self, request: AgentDiscoveryRequest) -> List[Dict[str, Any]]:
        """Discover agents based on criteria"""
        try:
            candidate_ids: Set[str] = set()
            
            # Filter by capabilities
            if request.capabilities:
                capability_sets = []
                for capability in request.capabilities:
                    if capability in self.capability_index:
                        capability_sets.append(self.capability_index[capability])
                
                if capability_sets:
                    candidate_ids = set.intersection(*capability_sets)
            
            # Filter by modalities
            if request.modalities:
                modality_sets = []
                for modality in request.modalities:
                    if modality in self.modality_index:
                        modality_sets.append(self.modality_index[modality])
                
                if modality_sets:
                    modality_candidates = set.intersection(*modality_sets)
                    if candidate_ids:
                        candidate_ids = candidate_ids.intersection(modality_candidates)
                    else:
                        candidate_ids = modality_candidates
            
            # If no specific filters, return all active agents
            if not candidate_ids and not request.capabilities and not request.modalities:
                candidate_ids = set(registered_agents.keys())
            
            # Filter by performance threshold
            if request.performance_threshold:
                candidate_ids = {
                    agent_id for agent_id in candidate_ids
                    if self.performance_metrics.get(agent_id, {}).get("success_rate", 0) >= request.performance_threshold
                }
            
            # Filter by response time
            if request.max_response_time:
                candidate_ids = {
                    agent_id for agent_id in candidate_ids
                    if self.performance_metrics.get(agent_id, {}).get("avg_response_time", float('inf')) <= request.max_response_time
                }
            
            # Get agent details
            discovered_agents = []
            for agent_id in candidate_ids:
                agent = registered_agents.get(agent_id)
                if agent and agent.status == "active":
                    discovered_agents.append({
                        "id": agent.id,
                        "name": agent.agent_card.name,
                        "description": agent.agent_card.description,
                        "capabilities": [cap.get("name") for cap in agent.agent_card.capabilities],
                        "modalities": agent.agent_card.supported_modalities,
                        "performance": self.performance_metrics.get(agent_id, {}),
                        "endpoint": agent.agent_card.service_endpoint,
                        "last_active": agent.last_heartbeat.isoformat()
                    })
            
            # Sort by performance score
            discovered_agents.sort(
                key=lambda x: x["performance"].get("success_rate", 0),
                reverse=True
            )
            
            logger.info(f"Discovered {len(discovered_agents)} agents matching criteria")
            return discovered_agents
            
        except Exception as e:
            logger.error(f"Agent discovery failed: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def create_task(self, request: TaskCreationRequest) -> str:
        """Create a new A2A task"""
        try:
            # Validate agent exists
            agent = registered_agents.get(request.agent_id)
            if not agent:
                raise HTTPException(status_code=404, detail="Agent not found")
            
            if agent.status != "active":
                raise HTTPException(status_code=400, detail="Agent is not active")
            
            # Create task
            task = Task(
                id=str(uuid.uuid4()),
                name=request.name,
                description=request.description,
                agent_id=request.agent_id,
                input_data=request.input_data,
                context=request.context,
                priority=request.priority,
                timeout=request.timeout,
                user_id=request.user_id
            )
            
            # Store task
            active_tasks[task.id] = task
            
            # Store in Redis
            redis_client.set(f"a2a_task:{task.id}", task.json())
            
            # Delegate task to agent
            await self._delegate_task(task, agent)
            
            logger.info(f"Created and delegated task {task.id} to agent {request.agent_id}")
            return task.id
            
        except Exception as e:
            logger.error(f"Task creation failed: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def _delegate_task(self, task: Task, agent: Agent):
        """Delegate a task to an agent"""
        try:
            # Create delegation message
            message = A2AMessage(
                id=str(uuid.uuid4()),
                type=MessageType.TASK_DELEGATION,
                task_id=task.id,
                from_agent="a2a_gateway",
                to_agent=agent.id,
                payload={
                    "task": {
                        "id": task.id,
                        "name": task.name,
                        "description": task.description,
                        "input_data": task.input_data,
                        "context": task.context,
                        "timeout": task.timeout
                    }
                }
            )
            
            # Send message to agent endpoint
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{agent.agent_card.service_endpoint}/a2a/tasks",
                    json=message.dict(),
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    # Update task status
                    task.status = TaskStatus.WORKING
                    task.started_at = datetime.now()
                    task.updated_at = datetime.now()
                    
                    # Update in storage
                    active_tasks[task.id] = task
                    redis_client.set(f"a2a_task:{task.id}", task.json())
                    
                    logger.info(f"Successfully delegated task {task.id} to agent {agent.id}")
                else:
                    raise Exception(f"Agent rejected task: {response.text}")
                    
        except Exception as e:
            # Update task status to failed
            task.status = TaskStatus.FAILED
            task.error_message = str(e)
            task.updated_at = datetime.now()
            
            active_tasks[task.id] = task
            redis_client.set(f"a2a_task:{task.id}", task.json())
            
            logger.error(f"Task delegation failed for {task.id}: {str(e)}")
            raise
    
    async def get_task_status(self, task_id: str) -> Task:
        """Get the status of a task"""
        task = active_tasks.get(task_id)
        if not task:
            # Try to load from Redis
            task_data = redis_client.get(f"a2a_task:{task_id}")
            if task_data:
                task = Task(**json.loads(task_data))
            else:
                raise HTTPException(status_code=404, detail="Task not found")
        
        return task
    
    async def update_task_status(self, task_id: str, status: TaskStatus, output_data: Optional[Dict[str, Any]] = None, error_message: Optional[str] = None) -> Task:
        """Update task status"""
        task = await self.get_task_status(task_id)
        
        # Validate status transition
        if not self._is_valid_transition(task.status, status):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status transition from {task.status} to {status}"
            )
        
        # Update task
        task.status = status
        task.updated_at = datetime.now()
        
        if output_data:
            task.output_data = output_data
        
        if error_message:
            task.error_message = error_message
        
        if status == TaskStatus.COMPLETED:
            task.completed_at = datetime.now()
        
        # Store updated task
        active_tasks[task_id] = task
        redis_client.set(f"a2a_task:{task_id}", task.json())
        
        # Update agent performance metrics
        await self._update_agent_metrics(task.agent_id, status == TaskStatus.COMPLETED)
        
        logger.info(f"Updated task {task_id} status to {status}")
        return task
    
    def _is_valid_transition(self, current: TaskStatus, new: TaskStatus) -> bool:
        """Check if status transition is valid"""
        valid_transitions = {
            TaskStatus.SUBMITTED: [TaskStatus.WORKING, TaskStatus.FAILED, TaskStatus.CANCELLED],
            TaskStatus.WORKING: [TaskStatus.INPUT_REQUIRED, TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED],
            TaskStatus.INPUT_REQUIRED: [TaskStatus.WORKING, TaskStatus.FAILED, TaskStatus.CANCELLED],
            TaskStatus.COMPLETED: [],
            TaskStatus.FAILED: [],
            TaskStatus.CANCELLED: []
        }
        
        return new in valid_transitions.get(current, [])
    
    async def _update_agent_metrics(self, agent_id: str, success: bool):
        """Update agent performance metrics"""
        if agent_id not in self.performance_metrics:
            self.performance_metrics[agent_id] = {
                "success_rate": 1.0,
                "avg_response_time": 0.0,
                "total_tasks": 0
            }
        
        metrics = self.performance_metrics[agent_id]
        metrics["total_tasks"] += 1
        
        # Update success rate (exponential moving average)
        alpha = 0.1  # Learning rate
        if success:
            metrics["success_rate"] = (1 - alpha) * metrics["success_rate"] + alpha * 1.0
        else:
            metrics["success_rate"] = (1 - alpha) * metrics["success_rate"] + alpha * 0.0
        
        # Store updated metrics
        redis_client.set(f"agent_metrics:{agent_id}", json.dumps(metrics))
    
    async def send_message(self, message: A2AMessage) -> bool:
        """Send a message between agents"""
        try:
            # Validate recipient agent
            recipient_agent = registered_agents.get(message.to_agent)
            if not recipient_agent:
                raise HTTPException(status_code=404, detail="Recipient agent not found")
            
            # Store message
            message_queue.append(message)
            redis_client.lpush("a2a_messages", message.json())
            
            # Send to agent endpoint
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{recipient_agent.agent_card.service_endpoint}/a2a/messages",
                    json=message.dict(),
                    timeout=30.0
                )
                
                success = response.status_code == 200
                logger.info(f"Message {message.id} sent to agent {message.to_agent}: {success}")
                return success
                
        except Exception as e:
            logger.error(f"Failed to send message: {str(e)}")
            return False
    
    async def get_agent_info(self, agent_id: str) -> Agent:
        """Get information about a registered agent"""
        agent = registered_agents.get(agent_id)
        if not agent:
            # Try to load from Redis
            agent_data = redis_client.get(f"a2a_agent:{agent_id}")
            if agent_data:
                agent = Agent(**json.loads(agent_data))
                registered_agents[agent_id] = agent
            else:
                raise HTTPException(status_code=404, detail="Agent not found")
        
        return agent
    
    async def update_agent_heartbeat(self, agent_id: str) -> bool:
        """Update agent heartbeat"""
        agent = registered_agents.get(agent_id)
        if not agent:
            return False
        
        agent.last_heartbeat = datetime.now()
        registered_agents[agent_id] = agent
        redis_client.set(f"a2a_agent:{agent_id}", agent.json())
        
        return True
    
    async def list_active_agents(self) -> List[Dict[str, Any]]:
        """List all active agents"""
        active_agents = []
        cutoff_time = datetime.now() - timedelta(minutes=5)  # 5-minute heartbeat timeout
        
        for agent_id, agent in registered_agents.items():
            if agent.status == "active" and agent.last_heartbeat > cutoff_time:
                active_agents.append({
                    "id": agent.id,
                    "name": agent.agent_card.name,
                    "description": agent.agent_card.description,
                    "capabilities": [cap.get("name") for cap in agent.agent_card.capabilities],
                    "modalities": agent.agent_card.supported_modalities,
                    "performance": self.performance_metrics.get(agent_id, {}),
                    "last_heartbeat": agent.last_heartbeat.isoformat()
                })
        
        return active_agents

# Global A2A service instance
a2a_service = A2AProtocolService()

# API Routes
@app.post("/agents/register")
async def register_agent(agent_card: AgentCard):
    """Register an agent with A2A protocol"""
    agent_id = await a2a_service.register_agent(agent_card)
    return {"agent_id": agent_id, "status": "registered"}

@app.get("/agents/discover")
async def discover_agents(
    capabilities: Optional[str] = None,
    modalities: Optional[str] = None,
    performance_threshold: Optional[float] = None,
    max_response_time: Optional[int] = None
):
    """Discover agents based on criteria"""
    request = AgentDiscoveryRequest(
        capabilities=capabilities.split(",") if capabilities else None,
        modalities=modalities.split(",") if modalities else None,
        performance_threshold=performance_threshold,
        max_response_time=max_response_time
    )
    
    agents = await a2a_service.discover_agents(request)
    return {"agents": agents, "count": len(agents)}

@app.get("/agents")
async def list_agents():
    """List all active agents"""
    agents = await a2a_service.list_active_agents()
    return {"agents": agents, "count": len(agents)}

@app.get("/agents/{agent_id}")
async def get_agent_info(agent_id: str):
    """Get agent information"""
    agent = await a2a_service.get_agent_info(agent_id)
    return agent

@app.post("/tasks")
async def create_task(request: TaskCreationRequest):
    """Create a new A2A task"""
    task_id = await a2a_service.create_task(request)
    return {"task_id": task_id, "status": "created"}

@app.get("/tasks/{task_id}")
async def get_task_status(task_id: str):
    """Get task status"""
    task = await a2a_service.get_task_status(task_id)
    return task

@app.put("/tasks/{task_id}/status")
async def update_task_status(
    task_id: str,
    status: TaskStatus,
    output_data: Optional[Dict[str, Any]] = None,
    error_message: Optional[str] = None
):
    """Update task status"""
    task = await a2a_service.update_task_status(task_id, status, output_data, error_message)
    return task

@app.post("/messages")
async def send_message(message: A2AMessage):
    """Send a message between agents"""
    success = await a2a_service.send_message(message)
    return {"success": success, "message_id": message.id}

@app.post("/agents/{agent_id}/heartbeat")
async def agent_heartbeat(agent_id: str):
    """Update agent heartbeat"""
    success = await a2a_service.update_agent_heartbeat(agent_id)
    if not success:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    return {"status": "updated", "timestamp": datetime.now().isoformat()}

@app.delete("/agents/{agent_id}")
async def unregister_agent(agent_id: str):
    """Unregister an agent"""
    if agent_id in registered_agents:
        del registered_agents[agent_id]
    
    # Remove from indices
    for capability_set in a2a_service.capability_index.values():
        capability_set.discard(agent_id)
    
    for modality_set in a2a_service.modality_index.values():
        modality_set.discard(agent_id)
    
    # Remove from Redis
    redis_client.delete(f"a2a_agent:{agent_id}")
    redis_client.delete(f"agent_metrics:{agent_id}")
    
    return {"status": "unregistered", "agent_id": agent_id}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check Redis connection
        redis_client.ping()
        
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "services": {
                "redis": "connected",
                "registered_agents": len(registered_agents),
                "active_tasks": len(active_tasks),
                "message_queue_size": len(message_queue)
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=503, detail="Service unhealthy")

@app.on_event("startup")
async def startup_event():
    """Initialize the service on startup"""
    logger.info("A2A Protocol Service starting up...")
    
    # Test Redis connection
    try:
        redis_client.ping()
        logger.info("Redis connection established")
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {str(e)}")
    
    # Load agents from Redis
    try:
        agent_keys = redis_client.keys("a2a_agent:*")
        for key in agent_keys:
            agent_data = redis_client.get(key)
            if agent_data:
                agent = Agent(**json.loads(agent_data))
                registered_agents[agent.id] = agent
                await a2a_service._index_agent(agent)
                logger.info(f"Loaded agent {agent.id} from Redis")
    except Exception as e:
        logger.error(f"Failed to load agents from Redis: {str(e)}")
    
    logger.info("A2A Protocol Service ready")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("A2A Protocol Service shutting down...")
    redis_client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)