from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
import asyncio
import json
import uuid
import time
from datetime import datetime
from celery import Celery
import redis
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.messages import HumanMessage, AIMessage
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="Workflow Engine Service",
    description="AI-powered workflow orchestration using LangGraph",
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

# Celery configuration
celery_app = Celery(
    'workflow_engine',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/0'
)

# Redis client for state management
redis_client = redis.Redis(host='localhost', port=6379, db=1, decode_responses=True)

# Pydantic models
class WorkflowNode(BaseModel):
    id: str
    type: str  # 'agent', 'condition', 'input', 'output', 'tool'
    data: Dict[str, Any]
    position: Dict[str, float] = Field(default_factory=dict)

class WorkflowEdge(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None

class Workflow(BaseModel):
    id: str
    name: str
    description: str
    nodes: List[WorkflowNode]
    edges: List[WorkflowEdge]
    user_id: str
    created_at: datetime = Field(default_factory=datetime.now)

class WorkflowExecution(BaseModel):
    id: str
    workflow_id: str
    status: str  # 'pending', 'running', 'completed', 'failed', 'cancelled'
    inputs: Dict[str, Any]
    outputs: Dict[str, Any] = Field(default_factory=dict)
    start_time: datetime = Field(default_factory=datetime.now)
    end_time: Optional[datetime] = None
    error_message: Optional[str] = None
    user_id: str

class ExecuteWorkflowRequest(BaseModel):
    workflow_id: str
    inputs: Dict[str, Any]
    user_id: str

class WorkflowState(BaseModel):
    """State object for LangGraph workflow execution"""
    messages: List[Dict[str, Any]] = Field(default_factory=list)
    current_node: Optional[str] = None
    node_outputs: Dict[str, Any] = Field(default_factory=dict)
    workflow_inputs: Dict[str, Any] = Field(default_factory=dict)
    execution_id: str
    user_id: str

# In-memory storage for active executions (in production, use Redis/database)
active_executions: Dict[str, WorkflowExecution] = {}
workflows_store: Dict[str, Workflow] = {}

class WorkflowEngine:
    def __init__(self):
        self.memory_saver = MemorySaver()
    
    async def create_workflow(self, workflow: Workflow) -> str:
        """Create and store a new workflow"""
        workflows_store[workflow.id] = workflow
        
        # Store in Redis for persistence
        await self._store_workflow_in_redis(workflow)
        
        logger.info(f"Created workflow {workflow.id} with {len(workflow.nodes)} nodes")
        return workflow.id
    
    async def execute_workflow(self, request: ExecuteWorkflowRequest) -> str:
        """Execute a workflow using LangGraph"""
        workflow = workflows_store.get(request.workflow_id)
        if not workflow:
            # Try to load from Redis
            workflow = await self._load_workflow_from_redis(request.workflow_id)
            if not workflow:
                raise HTTPException(status_code=404, detail="Workflow not found")
        
        execution_id = f"exec_{int(time.time())}_{str(uuid.uuid4())[:8]}"
        
        execution = WorkflowExecution(
            id=execution_id,
            workflow_id=request.workflow_id,
            status="pending",
            inputs=request.inputs,
            user_id=request.user_id
        )
        
        active_executions[execution_id] = execution
        
        # Start async execution using Celery
        celery_app.send_task(
            'workflow_engine.execute_workflow_task',
            args=[execution_id, workflow.dict(), request.inputs, request.user_id]
        )
        
        logger.info(f"Started workflow execution {execution_id}")
        return execution_id
    
    async def get_execution_status(self, execution_id: str) -> WorkflowExecution:
        """Get the status of a workflow execution"""
        execution = active_executions.get(execution_id)
        if not execution:
            # Try to load from Redis
            execution_data = redis_client.get(f"execution:{execution_id}")
            if execution_data:
                execution = WorkflowExecution(**json.loads(execution_data))
            else:
                raise HTTPException(status_code=404, detail="Execution not found")
        
        return execution
    
    def create_langgraph_workflow(self, workflow: Workflow) -> StateGraph:
        """Create a LangGraph workflow from workflow definition"""
        graph = StateGraph(WorkflowState)
        
        # Add nodes to the graph
        for node in workflow.nodes:
            if node.type == "input":
                graph.add_node(node.id, self._input_node_handler)
            elif node.type == "agent":
                graph.add_node(node.id, self._agent_node_handler)
            elif node.type == "condition":
                graph.add_node(node.id, self._condition_node_handler)
            elif node.type == "tool":
                graph.add_node(node.id, self._tool_node_handler)
            elif node.type == "output":
                graph.add_node(node.id, self._output_node_handler)
        
        # Add edges to the graph
        for edge in workflow.edges:
            if edge.source and edge.target:
                graph.add_edge(edge.source, edge.target)
        
        # Set entry point (find nodes with no incoming edges)
        start_nodes = [node.id for node in workflow.nodes 
                      if not any(edge.target == node.id for edge in workflow.edges)]
        
        if start_nodes:
            graph.set_entry_point(start_nodes[0])
        
        # Compile the graph
        return graph.compile(checkpointer=self.memory_saver)
    
    async def _input_node_handler(self, state: WorkflowState) -> WorkflowState:
        """Handle input nodes"""
        logger.info(f"Processing input node for execution {state.execution_id}")
        state.messages.append({
            "type": "input",
            "content": "Input node processed",
            "timestamp": datetime.now().isoformat()
        })
        return state
    
    async def _agent_node_handler(self, state: WorkflowState) -> WorkflowState:
        """Handle agent execution nodes"""
        logger.info(f"Processing agent node for execution {state.execution_id}")
        
        # Simulate agent execution (replace with actual A2A protocol call)
        await asyncio.sleep(1)  # Simulate processing time
        
        result = {
            "status": "completed",
            "result": f"Agent processed request at {datetime.now().isoformat()}",
            "confidence": 0.95
        }
        
        state.node_outputs[state.current_node] = result
        state.messages.append({
            "type": "agent_result",
            "content": result,
            "timestamp": datetime.now().isoformat()
        })
        
        return state
    
    async def _condition_node_handler(self, state: WorkflowState) -> WorkflowState:
        """Handle condition/decision nodes"""
        logger.info(f"Processing condition node for execution {state.execution_id}")
        
        # Simple condition evaluation (enhance with actual logic)
        condition_result = True  # Placeholder
        
        state.node_outputs[state.current_node] = {"condition_met": condition_result}
        state.messages.append({
            "type": "condition",
            "content": f"Condition evaluated to {condition_result}",
            "timestamp": datetime.now().isoformat()
        })
        
        return state
    
    async def _tool_node_handler(self, state: WorkflowState) -> WorkflowState:
        """Handle tool execution nodes"""
        logger.info(f"Processing tool node for execution {state.execution_id}")
        
        # Simulate tool execution (replace with actual MCP protocol call)
        await asyncio.sleep(0.5)
        
        result = {
            "status": "completed",
            "result": f"Tool executed at {datetime.now().isoformat()}",
            "data": {"processed": True}
        }
        
        state.node_outputs[state.current_node] = result
        state.messages.append({
            "type": "tool_result",
            "content": result,
            "timestamp": datetime.now().isoformat()
        })
        
        return state
    
    async def _output_node_handler(self, state: WorkflowState) -> WorkflowState:
        """Handle output nodes"""
        logger.info(f"Processing output node for execution {state.execution_id}")
        
        # Collect final outputs
        final_output = {
            "execution_id": state.execution_id,
            "completed_at": datetime.now().isoformat(),
            "node_outputs": state.node_outputs,
            "messages": state.messages
        }
        
        state.node_outputs["final"] = final_output
        state.messages.append({
            "type": "workflow_completed",
            "content": "Workflow execution completed successfully",
            "timestamp": datetime.now().isoformat()
        })
        
        return state
    
    async def _store_workflow_in_redis(self, workflow: Workflow):
        """Store workflow definition in Redis"""
        redis_client.set(f"workflow:{workflow.id}", workflow.json())
    
    async def _load_workflow_from_redis(self, workflow_id: str) -> Optional[Workflow]:
        """Load workflow definition from Redis"""
        workflow_data = redis_client.get(f"workflow:{workflow_id}")
        if workflow_data:
            return Workflow(**json.loads(workflow_data))
        return None

# Global workflow engine instance
workflow_engine = WorkflowEngine()

# Celery task for async workflow execution
@celery_app.task(name='workflow_engine.execute_workflow_task')
def execute_workflow_task(execution_id: str, workflow_data: dict, inputs: dict, user_id: str):
    """Celery task for executing workflows asynchronously"""
    try:
        logger.info(f"Starting Celery task for execution {execution_id}")
        
        # Update execution status
        if execution_id in active_executions:
            active_executions[execution_id].status = "running"
            active_executions[execution_id].start_time = datetime.now()
        
        # Create workflow from data
        workflow = Workflow(**workflow_data)
        
        # Create LangGraph workflow
        graph = workflow_engine.create_langgraph_workflow(workflow)
        
        # Create initial state
        initial_state = WorkflowState(
            execution_id=execution_id,
            user_id=user_id,
            workflow_inputs=inputs,
            messages=[{
                "type": "workflow_started",
                "content": f"Workflow {workflow.name} execution started",
                "timestamp": datetime.now().isoformat()
            }]
        )
        
        # Execute the workflow
        final_state = graph.invoke(initial_state)
        
        # Update execution with results
        if execution_id in active_executions:
            active_executions[execution_id].status = "completed"
            active_executions[execution_id].outputs = final_state.node_outputs
            active_executions[execution_id].end_time = datetime.now()
        
        logger.info(f"Completed workflow execution {execution_id}")
        return {"status": "completed", "execution_id": execution_id}
        
    except Exception as e:
        logger.error(f"Workflow execution failed for {execution_id}: {str(e)}")
        
        # Update execution with error
        if execution_id in active_executions:
            active_executions[execution_id].status = "failed"
            active_executions[execution_id].error_message = str(e)
            active_executions[execution_id].end_time = datetime.now()
        
        return {"status": "failed", "error": str(e)}

# API Routes
@app.post("/workflows")
async def create_workflow(workflow: Workflow):
    """Create a new workflow"""
    try:
        workflow_id = await workflow_engine.create_workflow(workflow)
        return {"workflow_id": workflow_id, "status": "created"}
    except Exception as e:
        logger.error(f"Failed to create workflow: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/workflows/{workflow_id}/execute")
async def execute_workflow(workflow_id: str, request: ExecuteWorkflowRequest):
    """Execute a workflow"""
    try:
        execution_id = await workflow_engine.execute_workflow(request)
        return {"execution_id": execution_id, "status": "started"}
    except Exception as e:
        logger.error(f"Failed to execute workflow: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/executions/{execution_id}")
async def get_execution_status(execution_id: str):
    """Get workflow execution status"""
    try:
        execution = await workflow_engine.get_execution_status(execution_id)
        return execution
    except Exception as e:
        logger.error(f"Failed to get execution status: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/workflows/{workflow_id}")
async def get_workflow(workflow_id: str):
    """Get workflow definition"""
    workflow = workflows_store.get(workflow_id)
    if not workflow:
        workflow = await workflow_engine._load_workflow_from_redis(workflow_id)
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    return workflow

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
                "celery": "running",
                "langgraph": "loaded"
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=503, detail="Service unhealthy")

@app.on_event("startup")
async def startup_event():
    """Initialize the service on startup"""
    logger.info("Workflow Engine Service starting up...")
    
    # Test Redis connection
    try:
        redis_client.ping()
        logger.info("Redis connection established")
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {str(e)}")
    
    logger.info("Workflow Engine Service ready")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Workflow Engine Service shutting down...")
    redis_client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)