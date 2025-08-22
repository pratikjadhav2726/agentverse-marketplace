from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any, Union
import asyncio
import json
import uuid
import time
from datetime import datetime
import logging
import os
import numpy as np
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.tools import BaseTool, tool
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.tools import Tool
from langchain_core.vectorstores import VectorStore
import chromadb
from chromadb.config import Settings
import redis

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="AI Orchestrator Service",
    description="AI orchestration service with vector database and embedding support",
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

# Redis client for caching and session management
redis_client = redis.Redis(host='localhost', port=6379, db=5, decode_responses=True)

# ChromaDB client for vector storage
chroma_client = chromadb.Client(Settings(
    persist_directory="./vector_db",
    anonymized_telemetry=False
))

# Pydantic models
class EmbeddingRequest(BaseModel):
    text: str
    collection_name: str = "default"
    metadata: Dict[str, Any] = Field(default_factory=dict)

class SearchRequest(BaseModel):
    query: str
    collection_name: str = "default"
    n_results: int = 5
    filters: Dict[str, Any] = Field(default_factory=dict)

class AIAgentRequest(BaseModel):
    agent_type: str = "openai_functions"
    model: str = "gpt-3.5-turbo"
    temperature: float = 0.7
    max_tokens: int = 1000
    system_prompt: str
    tools: List[str] = Field(default_factory=list)
    use_memory: bool = True
    memory_collection: str = "agent_memory"

class ChatRequest(BaseModel):
    agent_id: str
    message: str
    session_id: Optional[str] = None
    context: Dict[str, Any] = Field(default_factory=dict)
    user_id: str

class VectorDocument(BaseModel):
    id: str
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    embedding: Optional[List[float]] = None

class AIAgent(BaseModel):
    id: str
    name: str
    agent_type: str
    config: AIAgentRequest
    created_at: datetime = Field(default_factory=datetime.now)
    last_used: datetime = Field(default_factory=datetime.now)

# In-memory storage
ai_agents: Dict[str, AIAgent] = {}
chat_sessions: Dict[str, List[Dict[str, Any]]] = {}

class AIOrchestrator:
    def __init__(self):
        self.embeddings = OpenAIEmbeddings()
        self.collections: Dict[str, Any] = {}
        self.agent_executors: Dict[str, AgentExecutor] = {}
        
        # Initialize default collection
        self._initialize_default_collection()
    
    def _initialize_default_collection(self):
        """Initialize default vector collection"""
        try:
            collection = chroma_client.get_or_create_collection(
                name="default",
                metadata={"description": "Default collection for general embeddings"}
            )
            self.collections["default"] = collection
            logger.info("Initialized default vector collection")
        except Exception as e:
            logger.error(f"Failed to initialize default collection: {str(e)}")
    
    async def create_embedding(self, request: EmbeddingRequest) -> Dict[str, Any]:
        """Create embeddings for text"""
        try:
            # Generate embedding
            embedding = await self.embeddings.aembed_query(request.text)
            
            # Store in vector database
            collection = self._get_or_create_collection(request.collection_name)
            
            doc_id = str(uuid.uuid4())
            collection.add(
                embeddings=[embedding],
                documents=[request.text],
                metadatas=[request.metadata],
                ids=[doc_id]
            )
            
            logger.info(f"Created embedding for document {doc_id} in collection {request.collection_name}")
            
            return {
                "document_id": doc_id,
                "embedding_dimension": len(embedding),
                "collection": request.collection_name,
                "status": "created"
            }
            
        except Exception as e:
            logger.error(f"Failed to create embedding: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def search_similar(self, request: SearchRequest) -> Dict[str, Any]:
        """Search for similar documents using vector similarity"""
        try:
            # Generate query embedding
            query_embedding = await self.embeddings.aembed_query(request.query)
            
            # Search in collection
            collection = self._get_collection(request.collection_name)
            if not collection:
                raise HTTPException(status_code=404, detail=f"Collection {request.collection_name} not found")
            
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=request.n_results,
                include=["documents", "metadatas", "distances"]
            )
            
            # Format results
            formatted_results = []
            for i in range(len(results["documents"][0])):
                formatted_results.append({
                    "document": results["documents"][0][i],
                    "metadata": results["metadatas"][0][i],
                    "similarity_score": 1 - results["distances"][0][i],  # Convert distance to similarity
                    "id": results["ids"][0][i] if "ids" in results else None
                })
            
            logger.info(f"Found {len(formatted_results)} similar documents for query")
            
            return {
                "query": request.query,
                "results": formatted_results,
                "collection": request.collection_name
            }
            
        except Exception as e:
            logger.error(f"Similarity search failed: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    def _get_or_create_collection(self, name: str):
        """Get or create a vector collection"""
        if name not in self.collections:
            try:
                collection = chroma_client.get_or_create_collection(
                    name=name,
                    metadata={"description": f"Collection {name}"}
                )
                self.collections[name] = collection
                logger.info(f"Created/retrieved collection {name}")
            except Exception as e:
                logger.error(f"Failed to create collection {name}: {str(e)}")
                raise
        
        return self.collections[name]
    
    def _get_collection(self, name: str):
        """Get an existing collection"""
        return self.collections.get(name)
    
    async def create_ai_agent(self, config: AIAgentRequest) -> str:
        """Create a new AI agent"""
        try:
            agent_id = str(uuid.uuid4())
            
            # Create agent instance
            agent = AIAgent(
                id=agent_id,
                name=f"AI Agent {agent_id[:8]}",
                agent_type=config.agent_type,
                config=config
            )
            
            # Create LangChain agent executor
            executor = await self._create_langchain_executor(config)
            
            # Store agent and executor
            ai_agents[agent_id] = agent
            self.agent_executors[agent_id] = executor
            
            # Store in Redis
            redis_client.set(f"ai_agent:{agent_id}", agent.json())
            
            logger.info(f"Created AI agent {agent_id}")
            return agent_id
            
        except Exception as e:
            logger.error(f"Failed to create AI agent: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def _create_langchain_executor(self, config: AIAgentRequest) -> AgentExecutor:
        """Create LangChain agent executor"""
        try:
            # Initialize LLM
            llm = ChatOpenAI(
                model=config.model,
                temperature=config.temperature,
                max_tokens=config.max_tokens
            )
            
            # Create tools
            tools = self._create_agent_tools(config.tools)
            
            # Create prompt
            prompt = ChatPromptTemplate.from_messages([
                ("system", config.system_prompt),
                MessagesPlaceholder(variable_name="chat_history"),
                ("user", "{input}"),
                MessagesPlaceholder(variable_name="agent_scratchpad"),
            ])
            
            # Create agent
            agent = create_openai_functions_agent(llm, tools, prompt)
            
            # Create executor
            executor = AgentExecutor(
                agent=agent,
                tools=tools,
                verbose=True,
                max_iterations=10,
                max_execution_time=300
            )
            
            return executor
            
        except Exception as e:
            logger.error(f"Failed to create LangChain executor: {str(e)}")
            raise
    
    def _create_agent_tools(self, tool_names: List[str]) -> List[Tool]:
        """Create tools for the agent"""
        tools = []
        
        # Default tools
        @tool
        def vector_search(query: str, collection: str = "default") -> str:
            """Search for similar documents in vector database"""
            try:
                # This would call the search_similar method
                # For now, return a placeholder
                return f"Vector search results for '{query}' in collection '{collection}'"
            except Exception as e:
                return f"Error in vector search: {str(e)}"
        
        @tool
        def store_memory(content: str, collection: str = "agent_memory") -> str:
            """Store information in agent memory"""
            try:
                # This would call the create_embedding method
                return f"Stored '{content[:50]}...' in memory collection '{collection}'"
            except Exception as e:
                return f"Error storing memory: {str(e)}"
        
        @tool
        def retrieve_memory(query: str, collection: str = "agent_memory") -> str:
            """Retrieve relevant information from agent memory"""
            try:
                # This would call the search_similar method
                return f"Retrieved memory for query '{query}' from collection '{collection}'"
            except Exception as e:
                return f"Error retrieving memory: {str(e)}"
        
        # Add default tools
        tools.extend([vector_search, store_memory, retrieve_memory])
        
        # Add custom tools based on tool_names
        for tool_name in tool_names:
            custom_tool = self._create_custom_tool(tool_name)
            if custom_tool:
                tools.append(custom_tool)
        
        return tools
    
    def _create_custom_tool(self, tool_name: str) -> Optional[Tool]:
        """Create custom tools (placeholder for future expansion)"""
        # This would integrate with the MCP service to create custom tools
        return None
    
    async def chat_with_agent(self, request: ChatRequest) -> Dict[str, Any]:
        """Chat with an AI agent"""
        try:
            # Get agent executor
            executor = self.agent_executors.get(request.agent_id)
            if not executor:
                raise HTTPException(status_code=404, detail="AI agent not found")
            
            # Get or create session
            session_id = request.session_id or str(uuid.uuid4())
            if session_id not in chat_sessions:
                chat_sessions[session_id] = []
            
            # Get chat history
            chat_history = chat_sessions[session_id]
            
            # Execute agent
            start_time = time.time()
            result = await executor.ainvoke({
                "input": request.message,
                "chat_history": chat_history[-10:],  # Last 10 messages
                "context": request.context
            })
            
            execution_time = time.time() - start_time
            
            # Update chat history
            chat_history.append({"role": "user", "content": request.message})
            chat_history.append({"role": "assistant", "content": result.get("output", "")})
            chat_sessions[session_id] = chat_history
            
            # Store session in Redis
            redis_client.setex(f"chat_session:{session_id}", 3600, json.dumps(chat_history))
            
            # Update agent last used time
            if request.agent_id in ai_agents:
                ai_agents[request.agent_id].last_used = datetime.now()
            
            logger.info(f"Chat completed for agent {request.agent_id} in {execution_time:.2f}s")
            
            return {
                "response": result.get("output", ""),
                "session_id": session_id,
                "execution_time": execution_time,
                "intermediate_steps": result.get("intermediate_steps", []),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Chat failed for agent {request.agent_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def get_agent_memory(self, agent_id: str, query: Optional[str] = None) -> Dict[str, Any]:
        """Get agent memory/context"""
        try:
            collection_name = f"agent_memory_{agent_id}"
            collection = self._get_collection(collection_name)
            
            if not collection:
                return {"memory": [], "count": 0}
            
            if query:
                # Search memory
                search_request = SearchRequest(
                    query=query,
                    collection_name=collection_name,
                    n_results=10
                )
                results = await self.search_similar(search_request)
                return {
                    "memory": results["results"],
                    "count": len(results["results"]),
                    "query": query
                }
            else:
                # Get all memory (limited)
                try:
                    all_docs = collection.get(limit=50)
                    memory_items = []
                    for i, doc in enumerate(all_docs["documents"]):
                        memory_items.append({
                            "content": doc,
                            "metadata": all_docs["metadatas"][i] if all_docs["metadatas"] else {},
                            "id": all_docs["ids"][i] if all_docs["ids"] else None
                        })
                    
                    return {"memory": memory_items, "count": len(memory_items)}
                except:
                    return {"memory": [], "count": 0}
                    
        except Exception as e:
            logger.error(f"Failed to get agent memory: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def store_agent_memory(self, agent_id: str, content: str, metadata: Dict[str, Any] = None) -> str:
        """Store information in agent memory"""
        try:
            collection_name = f"agent_memory_{agent_id}"
            
            embedding_request = EmbeddingRequest(
                text=content,
                collection_name=collection_name,
                metadata=metadata or {"agent_id": agent_id, "timestamp": datetime.now().isoformat()}
            )
            
            result = await self.create_embedding(embedding_request)
            logger.info(f"Stored memory for agent {agent_id}")
            return result["document_id"]
            
        except Exception as e:
            logger.error(f"Failed to store agent memory: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

# Global AI orchestrator instance
ai_orchestrator = AIOrchestrator()

# API Routes
@app.post("/embeddings")
async def create_embedding(request: EmbeddingRequest):
    """Create embeddings for text"""
    return await ai_orchestrator.create_embedding(request)

@app.post("/search")
async def search_similar(request: SearchRequest):
    """Search for similar documents"""
    return await ai_orchestrator.search_similar(request)

@app.post("/agents")
async def create_ai_agent(config: AIAgentRequest):
    """Create a new AI agent"""
    agent_id = await ai_orchestrator.create_ai_agent(config)
    return {"agent_id": agent_id, "status": "created"}

@app.post("/agents/{agent_id}/chat")
async def chat_with_agent(agent_id: str, request: ChatRequest):
    """Chat with an AI agent"""
    request.agent_id = agent_id
    return await ai_orchestrator.chat_with_agent(request)

@app.get("/agents/{agent_id}/memory")
async def get_agent_memory(agent_id: str, query: Optional[str] = None):
    """Get agent memory"""
    return await ai_orchestrator.get_agent_memory(agent_id, query)

@app.post("/agents/{agent_id}/memory")
async def store_agent_memory(agent_id: str, content: str, metadata: Optional[Dict[str, Any]] = None):
    """Store information in agent memory"""
    doc_id = await ai_orchestrator.store_agent_memory(agent_id, content, metadata)
    return {"document_id": doc_id, "status": "stored"}

@app.get("/agents")
async def list_ai_agents():
    """List all AI agents"""
    agents = []
    for agent_id, agent in ai_agents.items():
        agents.append({
            "id": agent.id,
            "name": agent.name,
            "agent_type": agent.agent_type,
            "model": agent.config.model,
            "created_at": agent.created_at.isoformat(),
            "last_used": agent.last_used.isoformat(),
            "status": "active" if agent_id in ai_orchestrator.agent_executors else "inactive"
        })
    
    return {"agents": agents, "count": len(agents)}

@app.get("/agents/{agent_id}")
async def get_ai_agent(agent_id: str):
    """Get AI agent information"""
    agent = ai_agents.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="AI agent not found")
    
    return agent

@app.delete("/agents/{agent_id}")
async def delete_ai_agent(agent_id: str):
    """Delete an AI agent"""
    if agent_id in ai_agents:
        del ai_agents[agent_id]
    
    if agent_id in ai_orchestrator.agent_executors:
        del ai_orchestrator.agent_executors[agent_id]
    
    # Remove from Redis
    redis_client.delete(f"ai_agent:{agent_id}")
    
    # Clean up memory collection
    try:
        collection_name = f"agent_memory_{agent_id}"
        if collection_name in ai_orchestrator.collections:
            chroma_client.delete_collection(collection_name)
            del ai_orchestrator.collections[collection_name]
    except:
        pass
    
    return {"status": "deleted", "agent_id": agent_id}

@app.get("/collections")
async def list_collections():
    """List all vector collections"""
    try:
        collections = chroma_client.list_collections()
        collection_info = []
        
        for collection in collections:
            try:
                count = collection.count()
                collection_info.append({
                    "name": collection.name,
                    "count": count,
                    "metadata": collection.metadata
                })
            except:
                collection_info.append({
                    "name": collection.name,
                    "count": 0,
                    "metadata": {}
                })
        
        return {"collections": collection_info}
    except Exception as e:
        logger.error(f"Failed to list collections: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/collections/{collection_name}")
async def create_collection(collection_name: str, metadata: Optional[Dict[str, Any]] = None):
    """Create a new vector collection"""
    try:
        collection = chroma_client.create_collection(
            name=collection_name,
            metadata=metadata or {}
        )
        ai_orchestrator.collections[collection_name] = collection
        
        return {"collection": collection_name, "status": "created"}
    except Exception as e:
        logger.error(f"Failed to create collection: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/collections/{collection_name}")
async def delete_collection(collection_name: str):
    """Delete a vector collection"""
    try:
        chroma_client.delete_collection(collection_name)
        if collection_name in ai_orchestrator.collections:
            del ai_orchestrator.collections[collection_name]
        
        return {"collection": collection_name, "status": "deleted"}
    except Exception as e:
        logger.error(f"Failed to delete collection: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check Redis connection
        redis_client.ping()
        
        # Check ChromaDB
        collections = chroma_client.list_collections()
        
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "services": {
                "redis": "connected",
                "chromadb": "connected",
                "collections_count": len(collections),
                "ai_agents": len(ai_agents),
                "active_executors": len(ai_orchestrator.agent_executors)
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=503, detail="Service unhealthy")

@app.on_event("startup")
async def startup_event():
    """Initialize the service on startup"""
    logger.info("AI Orchestrator Service starting up...")
    
    # Test connections
    try:
        redis_client.ping()
        logger.info("Redis connection established")
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {str(e)}")
    
    try:
        chroma_client.heartbeat()
        logger.info("ChromaDB connection established")
    except Exception as e:
        logger.error(f"Failed to connect to ChromaDB: {str(e)}")
    
    # Load existing agents from Redis
    try:
        agent_keys = redis_client.keys("ai_agent:*")
        for key in agent_keys:
            agent_data = redis_client.get(key)
            if agent_data:
                agent = AIAgent(**json.loads(agent_data))
                ai_agents[agent.id] = agent
                logger.info(f"Loaded AI agent {agent.id} from Redis")
    except Exception as e:
        logger.error(f"Failed to load agents from Redis: {str(e)}")
    
    logger.info("AI Orchestrator Service ready")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("AI Orchestrator Service shutting down...")
    redis_client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)