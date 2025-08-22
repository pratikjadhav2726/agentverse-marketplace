from fastapi import FastAPI, HTTPException, Depends, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any, Callable
import asyncio
import json
import uuid
import time
from datetime import datetime
import logging
import httpx
import redis
from cryptography.fernet import Fernet
import base64
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="MCP Server Service",
    description="Model Context Protocol server for tool and resource management",
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

# Security
security = HTTPBearer()

# Redis client for tool registry and user contexts
redis_client = redis.Redis(host='localhost', port=6379, db=3, decode_responses=True)

# Encryption for credentials
ENCRYPTION_KEY = os.getenv("MCP_ENCRYPTION_KEY", Fernet.generate_key())
fernet = Fernet(ENCRYPTION_KEY)

# Pydantic models
class ToolDefinition(BaseModel):
    name: str
    description: str
    input_schema: Dict[str, Any]
    category: str = "general"
    version: str = "1.0.0"
    auth_required: bool = False
    rate_limit: Dict[str, int] = Field(default_factory=lambda: {"requests": 100, "window": 3600})
    metadata: Dict[str, Any] = Field(default_factory=dict)

class ResourceDefinition(BaseModel):
    uri: str
    name: str
    description: str
    mime_type: str = "text/plain"
    permissions: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)

class UserCredential(BaseModel):
    user_id: str
    tool_name: str
    credential_type: str  # 'api_key', 'oauth_token', 'bearer', 'basic'
    credential_value: str
    expires_at: Optional[datetime] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

class ToolInvocationRequest(BaseModel):
    tool_name: str
    arguments: Dict[str, Any]
    user_id: str
    agent_id: Optional[str] = None

class ToolInvocationResponse(BaseModel):
    success: bool
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    execution_time: float
    timestamp: datetime = Field(default_factory=datetime.now)

class ResourceReadRequest(BaseModel):
    uri: str
    user_id: str
    agent_id: Optional[str] = None

# Tool handler type
ToolHandler = Callable[[Dict[str, Any], str], Any]

class MCPServerService:
    def __init__(self):
        self.tools: Dict[str, ToolDefinition] = {}
        self.tool_handlers: Dict[str, ToolHandler] = {}
        self.resources: Dict[str, ResourceDefinition] = {}
        self.user_tool_mappings: Dict[str, List[str]] = {}
        self.user_credentials: Dict[str, Dict[str, str]] = {}  # user_id -> tool_name -> encrypted_credential
        
        # Initialize built-in tools
        self._register_builtin_tools()
    
    def _register_builtin_tools(self):
        """Register built-in tools available to all users"""
        
        # Database query tool
        database_tool = ToolDefinition(
            name="database_query",
            description="Execute SQL queries against user databases",
            input_schema={
                "type": "object",
                "properties": {
                    "query": {"type": "string"},
                    "database": {"type": "string"},
                    "parameters": {"type": "array", "items": {"type": "string"}}
                },
                "required": ["query", "database"]
            },
            category="data",
            auth_required=True
        )
        
        async def database_handler(args: Dict[str, Any], user_id: str) -> Dict[str, Any]:
            """Handle database queries"""
            # Simulate database query execution
            await asyncio.sleep(0.5)
            return {
                "rows": [{"id": 1, "name": "Sample Data"}],
                "row_count": 1,
                "query_time": 0.5
            }
        
        self.tools["database_query"] = database_tool
        self.tool_handlers["database_query"] = database_handler
        
        # HTTP request tool
        http_tool = ToolDefinition(
            name="http_request",
            description="Make HTTP requests to external APIs",
            input_schema={
                "type": "object",
                "properties": {
                    "url": {"type": "string", "format": "uri"},
                    "method": {"type": "string", "enum": ["GET", "POST", "PUT", "DELETE"]},
                    "headers": {"type": "object"},
                    "body": {"type": "string"},
                    "timeout": {"type": "number", "default": 30}
                },
                "required": ["url", "method"]
            },
            category="network",
            rate_limit={"requests": 50, "window": 3600}
        )
        
        async def http_handler(args: Dict[str, Any], user_id: str) -> Dict[str, Any]:
            """Handle HTTP requests"""
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.request(
                        method=args["method"],
                        url=args["url"],
                        headers=args.get("headers", {}),
                        content=args.get("body"),
                        timeout=args.get("timeout", 30)
                    )
                    
                    return {
                        "status_code": response.status_code,
                        "headers": dict(response.headers),
                        "body": response.text,
                        "success": response.is_success
                    }
            except Exception as e:
                return {"error": str(e), "success": False}
        
        self.tools["http_request"] = http_tool
        self.tool_handlers["http_request"] = http_handler
        
        # File operations tool
        file_tool = ToolDefinition(
            name="file_operations",
            description="Read, write, and manage files",
            input_schema={
                "type": "object",
                "properties": {
                    "operation": {"type": "string", "enum": ["read", "write", "list", "delete"]},
                    "path": {"type": "string"},
                    "content": {"type": "string"},
                    "encoding": {"type": "string", "default": "utf-8"}
                },
                "required": ["operation", "path"]
            },
            category="filesystem",
            auth_required=False
        )
        
        async def file_handler(args: Dict[str, Any], user_id: str) -> Dict[str, Any]:
            """Handle file operations (simulated for security)"""
            operation = args["operation"]
            path = args["path"]
            
            # Simulate file operations
            if operation == "read":
                return {"content": f"Simulated content of {path}", "size": 100}
            elif operation == "write":
                return {"success": True, "bytes_written": len(args.get("content", ""))}
            elif operation == "list":
                return {"files": [{"name": "example.txt", "type": "file", "size": 100}]}
            elif operation == "delete":
                return {"success": True}
            
            return {"error": f"Unknown operation: {operation}"}
        
        self.tools["file_operations"] = file_tool
        self.tool_handlers["file_operations"] = file_handler
        
        logger.info("Built-in tools registered successfully")
    
    async def register_tool(self, user_id: str, tool_def: ToolDefinition, handler: ToolHandler) -> str:
        """Register a new tool for a user"""
        tool_key = f"{user_id}:{tool_def.name}"
        
        # Validate tool definition
        if not tool_def.name or not tool_def.description:
            raise ValueError("Tool name and description are required")
        
        # Store tool definition
        self.tools[tool_key] = tool_def
        self.tool_handlers[tool_key] = handler
        
        # Update user mappings
        if user_id not in self.user_tool_mappings:
            self.user_tool_mappings[user_id] = []
        
        if tool_def.name not in self.user_tool_mappings[user_id]:
            self.user_tool_mappings[user_id].append(tool_def.name)
        
        # Store in Redis
        redis_client.set(f"tool:{tool_key}", tool_def.json())
        redis_client.sadd(f"user_tools:{user_id}", tool_def.name)
        
        logger.info(f"Registered tool {tool_def.name} for user {user_id}")
        return tool_key
    
    async def list_user_tools(self, user_id: str) -> List[ToolDefinition]:
        """List all tools available to a user"""
        tools = []
        
        # Add built-in tools
        for tool_name, tool_def in self.tools.items():
            if ":" not in tool_name:  # Built-in tools don't have user prefix
                tools.append(tool_def)
        
        # Add user-specific tools
        user_tools = self.user_tool_mappings.get(user_id, [])
        for tool_name in user_tools:
            tool_key = f"{user_id}:{tool_name}"
            if tool_key in self.tools:
                tools.append(self.tools[tool_key])
        
        return tools
    
    async def invoke_tool(self, request: ToolInvocationRequest) -> ToolInvocationResponse:
        """Invoke a tool for a user"""
        start_time = time.time()
        
        try:
            # Find tool (check built-in first, then user-specific)
            tool_def = self.tools.get(request.tool_name)
            handler = self.tool_handlers.get(request.tool_name)
            
            if not tool_def:
                # Try user-specific tool
                tool_key = f"{request.user_id}:{request.tool_name}"
                tool_def = self.tools.get(tool_key)
                handler = self.tool_handlers.get(tool_key)
            
            if not tool_def or not handler:
                raise HTTPException(status_code=404, detail=f"Tool '{request.tool_name}' not found")
            
            # Check rate limiting
            if not await self._check_rate_limit(request.user_id, request.tool_name, tool_def.rate_limit):
                raise HTTPException(status_code=429, detail="Rate limit exceeded")
            
            # Validate arguments against schema
            # In production, use jsonschema for validation
            
            # Execute tool
            result = await handler(request.arguments, request.user_id)
            
            execution_time = time.time() - start_time
            
            # Log usage
            await self._log_tool_usage(
                request.user_id,
                request.agent_id,
                request.tool_name,
                request.arguments,
                result,
                True,
                execution_time
            )
            
            return ToolInvocationResponse(
                success=True,
                result=result,
                execution_time=execution_time
            )
            
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"Tool invocation failed: {str(e)}")
            
            # Log failed usage
            await self._log_tool_usage(
                request.user_id,
                request.agent_id,
                request.tool_name,
                request.arguments,
                {"error": str(e)},
                False,
                execution_time
            )
            
            return ToolInvocationResponse(
                success=False,
                error=str(e),
                execution_time=execution_time
            )
    
    async def store_user_credential(self, credential: UserCredential) -> str:
        """Store encrypted user credential"""
        try:
            # Encrypt credential value
            encrypted_value = fernet.encrypt(credential.credential_value.encode()).decode()
            
            # Store in memory
            if credential.user_id not in self.user_credentials:
                self.user_credentials[credential.user_id] = {}
            
            self.user_credentials[credential.user_id][credential.tool_name] = encrypted_value
            
            # Store in Redis
            credential_key = f"credential:{credential.user_id}:{credential.tool_name}"
            credential_data = {
                "encrypted_value": encrypted_value,
                "credential_type": credential.credential_type,
                "expires_at": credential.expires_at.isoformat() if credential.expires_at else None,
                "metadata": credential.metadata
            }
            redis_client.set(credential_key, json.dumps(credential_data))
            
            logger.info(f"Stored credential for user {credential.user_id}, tool {credential.tool_name}")
            return "stored"
            
        except Exception as e:
            logger.error(f"Failed to store credential: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def get_user_credential(self, user_id: str, tool_name: str) -> Optional[str]:
        """Get decrypted user credential"""
        try:
            # Try memory first
            encrypted_value = self.user_credentials.get(user_id, {}).get(tool_name)
            
            if not encrypted_value:
                # Try Redis
                credential_key = f"credential:{user_id}:{tool_name}"
                credential_data = redis_client.get(credential_key)
                if credential_data:
                    data = json.loads(credential_data)
                    encrypted_value = data["encrypted_value"]
            
            if encrypted_value:
                # Decrypt and return
                decrypted_value = fernet.decrypt(encrypted_value.encode()).decode()
                return decrypted_value
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get credential: {str(e)}")
            return None
    
    async def _check_rate_limit(self, user_id: str, tool_name: str, rate_limit: Dict[str, int]) -> bool:
        """Check if user is within rate limit for tool"""
        try:
            key = f"rate_limit:{user_id}:{tool_name}"
            current_count = redis_client.get(key)
            
            if current_count is None:
                # First request
                redis_client.setex(key, rate_limit["window"], 1)
                return True
            
            if int(current_count) >= rate_limit["requests"]:
                return False
            
            # Increment counter
            redis_client.incr(key)
            return True
            
        except Exception as e:
            logger.error(f"Rate limit check failed: {str(e)}")
            return False
    
    async def _log_tool_usage(
        self,
        user_id: str,
        agent_id: Optional[str],
        tool_name: str,
        arguments: Dict[str, Any],
        result: Dict[str, Any],
        success: bool,
        execution_time: float
    ):
        """Log tool usage for monitoring and billing"""
        log_entry = {
            "user_id": user_id,
            "agent_id": agent_id,
            "tool_name": tool_name,
            "arguments": self._sanitize_args(arguments),
            "success": success,
            "execution_time": execution_time,
            "timestamp": datetime.now().isoformat()
        }
        
        # Store in Redis for processing
        redis_client.lpush("tool_usage_logs", json.dumps(log_entry))
        
        logger.info(f"Logged tool usage: {tool_name} for user {user_id}")
    
    def _sanitize_args(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Remove sensitive information from arguments before logging"""
        sensitive_keys = ['password', 'token', 'api_key', 'secret', 'credential']
        sanitized = args.copy()
        
        for key in sensitive_keys:
            if key in sanitized:
                sanitized[key] = "[REDACTED]"
        
        return sanitized
    
    async def register_resource(self, user_id: str, resource_def: ResourceDefinition) -> str:
        """Register a resource for a user"""
        resource_key = f"{user_id}:{resource_def.uri}"
        
        # Store resource definition
        self.resources[resource_key] = resource_def
        
        # Store in Redis
        redis_client.set(f"resource:{resource_key}", resource_def.json())
        redis_client.sadd(f"user_resources:{user_id}", resource_def.uri)
        
        logger.info(f"Registered resource {resource_def.uri} for user {user_id}")
        return resource_key
    
    async def read_resource(self, request: ResourceReadRequest) -> Dict[str, Any]:
        """Read a resource for a user"""
        try:
            # Find resource
            resource_key = f"{request.user_id}:{request.uri}"
            resource_def = self.resources.get(resource_key)
            
            if not resource_def:
                raise HTTPException(status_code=404, detail=f"Resource '{request.uri}' not found")
            
            # Simulate resource reading
            if request.uri.startswith("file://"):
                path = request.uri[7:]  # Remove file:// prefix
                return {
                    "content": f"Simulated content of {path}",
                    "mime_type": resource_def.mime_type,
                    "size": 100
                }
            elif request.uri.startswith("database://"):
                db_name = request.uri[11:]  # Remove database:// prefix
                return {
                    "content": f"Database schema for {db_name}",
                    "tables": ["users", "agents", "tasks"],
                    "mime_type": "application/x-sql"
                }
            else:
                return {
                    "content": f"Resource content for {request.uri}",
                    "mime_type": resource_def.mime_type
                }
                
        except Exception as e:
            logger.error(f"Resource read failed: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

# Global MCP service instance
mcp_service = MCPServerService()

# API Routes
@app.get("/tools")
async def list_tools(user_id: str):
    """List available tools for a user"""
    tools = await mcp_service.list_user_tools(user_id)
    return {"tools": [tool.dict() for tool in tools]}

@app.post("/tools/register")
async def register_tool(user_id: str, tool_def: ToolDefinition):
    """Register a new tool for a user"""
    # For now, we'll use a placeholder handler
    async def placeholder_handler(args: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        return {"result": f"Tool {tool_def.name} executed with args: {args}"}
    
    tool_key = await mcp_service.register_tool(user_id, tool_def, placeholder_handler)
    return {"status": "registered", "tool_key": tool_key}

@app.post("/tools/{tool_name}/invoke")
async def invoke_tool(tool_name: str, request: ToolInvocationRequest):
    """Invoke a tool"""
    request.tool_name = tool_name
    return await mcp_service.invoke_tool(request)

@app.post("/credentials")
async def store_credential(credential: UserCredential):
    """Store user credential for a tool"""
    result = await mcp_service.store_user_credential(credential)
    return {"status": result}

@app.get("/credentials")
async def list_credentials(user_id: str):
    """List user's stored credentials (without values)"""
    credentials = []
    user_creds = mcp_service.user_credentials.get(user_id, {})
    
    for tool_name in user_creds.keys():
        credentials.append({
            "tool_name": tool_name,
            "has_credential": True,
            "created_at": datetime.now().isoformat()  # Placeholder
        })
    
    return {"credentials": credentials}

@app.delete("/credentials/{tool_name}")
async def delete_credential(tool_name: str, user_id: str):
    """Delete a user's credential for a tool"""
    if user_id in mcp_service.user_credentials:
        if tool_name in mcp_service.user_credentials[user_id]:
            del mcp_service.user_credentials[user_id][tool_name]
    
    # Remove from Redis
    credential_key = f"credential:{user_id}:{tool_name}"
    redis_client.delete(credential_key)
    
    return {"status": "deleted", "tool_name": tool_name}

@app.get("/resources")
async def list_resources(user_id: str):
    """List available resources for a user"""
    user_resource_uris = redis_client.smembers(f"user_resources:{user_id}")
    resources = []
    
    for uri in user_resource_uris:
        resource_key = f"{user_id}:{uri}"
        if resource_key in mcp_service.resources:
            resources.append(mcp_service.resources[resource_key].dict())
    
    return {"resources": resources}

@app.post("/resources/register")
async def register_resource(user_id: str, resource_def: ResourceDefinition):
    """Register a new resource for a user"""
    resource_key = await mcp_service.register_resource(user_id, resource_def)
    return {"status": "registered", "resource_key": resource_key}

@app.post("/resources/read")
async def read_resource(request: ResourceReadRequest):
    """Read a resource"""
    return await mcp_service.read_resource(request)

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
                "encryption": "available",
                "registered_tools": len(mcp_service.tools),
                "registered_resources": len(mcp_service.resources)
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=503, detail="Service unhealthy")

@app.on_event("startup")
async def startup_event():
    """Initialize the service on startup"""
    logger.info("MCP Server Service starting up...")
    
    # Test Redis connection
    try:
        redis_client.ping()
        logger.info("Redis connection established")
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {str(e)}")
    
    # Load tools and resources from Redis
    try:
        # Load tools
        tool_keys = redis_client.keys("tool:*")
        for key in tool_keys:
            tool_data = redis_client.get(key)
            if tool_data:
                tool_def = ToolDefinition(**json.loads(tool_data))
                tool_key = key.replace("tool:", "")
                mcp_service.tools[tool_key] = tool_def
                logger.info(f"Loaded tool {tool_key} from Redis")
        
        # Load resources
        resource_keys = redis_client.keys("resource:*")
        for key in resource_keys:
            resource_data = redis_client.get(key)
            if resource_data:
                resource_def = ResourceDefinition(**json.loads(resource_data))
                resource_key = key.replace("resource:", "")
                mcp_service.resources[resource_key] = resource_def
                logger.info(f"Loaded resource {resource_key} from Redis")
                
    except Exception as e:
        logger.error(f"Failed to load data from Redis: {str(e)}")
    
    logger.info("MCP Server Service ready")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("MCP Server Service shutting down...")
    redis_client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)