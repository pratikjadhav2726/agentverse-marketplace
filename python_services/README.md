# AgentVerse Python Microservices

This directory contains the Python-based microservices that power the AI backend of the AgentVerse marketplace. These services implement the A2A (Agent2Agent) and MCP (Model Context Protocol) standards using FastAPI, LangChain, and LangGraph.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     AgentVerse Architecture                     │
├─────────────────────────────────────────────────────────────────┤
│  Next.js Frontend (Port 3000)                                  │
│  ├── API Gateway & Routing                                     │
│  ├── User Interface & Authentication                           │
│  └── Database (SQLite) & Business Logic                       │
├─────────────────────────────────────────────────────────────────┤
│  Python AI Microservices                                       │
│  ├── Workflow Engine (Port 8001) - LangGraph orchestration    │
│  ├── Agent Runtime (Port 8002) - LangChain execution          │
│  ├── MCP Server (Port 8003) - Tool & resource management      │
│  ├── A2A Service (Port 8004) - Agent communication            │
│  └── AI Orchestrator (Port 8005) - Vector DB & embeddings    │
├─────────────────────────────────────────────────────────────────┤
│  Infrastructure                                                │
│  ├── Redis - Caching, messaging, session management           │
│  ├── ChromaDB - Vector database for embeddings               │
│  └── Celery - Async task processing                           │
└─────────────────────────────────────────────────────────────────┘
```

## Services Overview

### 1. Workflow Engine (Port 8001)
**Technology**: FastAPI + LangGraph + Celery + Redis

**Purpose**: Orchestrates complex AI workflows using LangGraph's state machine capabilities.

**Key Features**:
- Visual workflow creation and execution
- State-based workflow management
- Async task processing with Celery
- Real-time execution monitoring
- Integration with A2A protocol for agent coordination

**Endpoints**:
- `POST /workflows` - Create workflow
- `POST /workflows/{id}/execute` - Execute workflow
- `GET /executions/{id}` - Get execution status
- `GET /health` - Health check

### 2. Agent Runtime (Port 8002)
**Technology**: FastAPI + LangChain + OpenAI + Redis

**Purpose**: Executes AI agents using LangChain framework with tool integration.

**Key Features**:
- Dynamic agent registration and management
- LangChain agent executor integration
- Tool loading and execution
- A2A protocol task handling
- Performance monitoring

**Endpoints**:
- `POST /agents/register` - Register new agent
- `POST /agents/{id}/execute` - Execute agent
- `GET /agents` - List agents
- `POST /tasks` - Handle A2A tasks
- `GET /health` - Health check

### 3. MCP Server (Port 8003)
**Technology**: FastAPI + Cryptography + Redis

**Purpose**: Implements Model Context Protocol for secure tool and resource management.

**Key Features**:
- Multi-tenant tool registry
- Encrypted credential storage
- Rate limiting and access control
- Built-in tools (database, HTTP, filesystem)
- Usage logging and monitoring

**Endpoints**:
- `GET /tools` - List user tools
- `POST /tools/{name}/invoke` - Invoke tool
- `POST /credentials` - Store credentials
- `GET /resources` - List resources
- `GET /health` - Health check

### 4. A2A Service (Port 8004)
**Technology**: FastAPI + Redis + HTTPX

**Purpose**: Implements Agent2Agent protocol for inter-agent communication and task delegation.

**Key Features**:
- Agent discovery and registration
- Task creation and delegation
- Message passing between agents
- Performance tracking
- Capability-based matching

**Endpoints**:
- `POST /agents/register` - Register agent
- `GET /agents/discover` - Discover agents
- `POST /tasks` - Create tasks
- `GET /tasks/{id}` - Get task status
- `POST /messages` - Send messages
- `GET /health` - Health check

### 5. AI Orchestrator (Port 8005)
**Technology**: FastAPI + LangChain + ChromaDB + OpenAI

**Purpose**: Provides vector database capabilities, embeddings, and AI agent coordination.

**Key Features**:
- Vector embeddings with OpenAI
- Similarity search with ChromaDB
- AI agent memory management
- Chat session handling
- Collection management

**Endpoints**:
- `POST /embeddings` - Create embeddings
- `POST /search` - Similarity search
- `POST /agents` - Create AI agent
- `POST /agents/{id}/chat` - Chat with agent
- `GET /collections` - List collections
- `GET /health` - Health check

## Quick Start

### Prerequisites
- Python 3.11+
- Redis server
- OpenAI API key (for AI features)

### Development Setup

1. **Install Dependencies**:
```bash
cd python_services
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Set Environment Variables**:
```bash
export OPENAI_API_KEY=your_openai_api_key
export MCP_ENCRYPTION_KEY=your_32_char_encryption_key
```

3. **Start Redis** (if not already running):
```bash
redis-server
```

4. **Start All Services**:
```bash
./start_services.sh
```

Or start individual services:
```bash
# Workflow Engine
cd workflow_engine && python main.py

# Agent Runtime
cd agent_runtime && python main.py

# MCP Server
cd mcp_server && python main.py

# A2A Service
cd a2a_service && python main.py

# AI Orchestrator
cd ai_orchestrator && python main.py

# Celery Worker (for workflow engine)
cd workflow_engine && celery -A main.celery_app worker --loglevel=info
```

### Docker Setup

1. **Build and Start with Docker Compose**:
```bash
# From project root
docker-compose up --build
```

2. **Start Individual Services**:
```bash
docker-compose up workflow-engine agent-runtime mcp-server a2a-service ai-orchestrator
```

## API Documentation

Each service provides interactive API documentation at `/docs` endpoint:

- Workflow Engine: http://localhost:8001/docs
- Agent Runtime: http://localhost:8002/docs
- MCP Server: http://localhost:8003/docs
- A2A Service: http://localhost:8004/docs
- AI Orchestrator: http://localhost:8005/docs

## Testing the Services

### 1. Health Checks
```bash
# Check all services
curl http://localhost:8001/health
curl http://localhost:8002/health
curl http://localhost:8003/health
curl http://localhost:8004/health
curl http://localhost:8005/health
```

### 2. Test Workflow Execution
```bash
# Create a simple workflow
curl -X POST http://localhost:8001/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-workflow",
    "name": "Test Workflow",
    "description": "Simple test workflow",
    "nodes": [
      {
        "id": "start",
        "type": "input",
        "data": {"label": "Start"},
        "position": {"x": 100, "y": 100}
      }
    ],
    "edges": [],
    "user_id": "test-user"
  }'

# Execute the workflow
curl -X POST http://localhost:8001/workflows/test-workflow/execute \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_id": "test-workflow",
    "inputs": {"message": "Hello World"},
    "user_id": "test-user"
  }'
```

### 3. Test AI Agent
```bash
# Register an agent
curl -X POST http://localhost:8002/agents/register \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-agent",
    "name": "Test Agent",
    "description": "A simple test agent",
    "agent_card": {
      "name": "Test Agent",
      "description": "Test agent for demo",
      "version": "1.0.0",
      "service_endpoint": "http://localhost:8002",
      "capabilities": [{"name": "text_processing"}],
      "supported_modalities": ["text"]
    },
    "system_prompt": "You are a helpful AI assistant.",
    "temperature": 0.7,
    "max_tokens": 1000
  }'

# Execute the agent
curl -X POST http://localhost:8002/agents/test-agent/execute \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Hello, how are you?",
    "user_id": "test-user",
    "context": {}
  }'
```

### 4. Test MCP Tools
```bash
# List available tools
curl "http://localhost:8003/tools?user_id=test-user"

# Invoke a tool
curl -X POST http://localhost:8003/tools/calculator/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "calculator",
    "arguments": {"expression": "2 + 2"},
    "user_id": "test-user"
  }'
```

### 5. Test A2A Protocol
```bash
# Discover agents
curl "http://localhost:8004/agents/discover?capabilities=text_processing"

# Create a task
curl -X POST http://localhost:8004/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "test-agent",
    "name": "Test Task",
    "description": "Simple test task",
    "input_data": {"message": "Process this text"},
    "user_id": "test-user"
  }'
```

## Security Features

### 1. Credential Encryption
- All user credentials are encrypted using Fernet (AES 128)
- Credentials are stored securely in Redis
- Automatic credential rotation support

### 2. Rate Limiting
- Per-user, per-tool rate limiting
- Configurable limits for each tool
- Redis-based rate limit tracking

### 3. Access Control
- User-based tool access control
- Agent permission validation
- Secure tool invocation gateway

### 4. Audit Logging
- Comprehensive usage logging
- Performance metrics collection
- Error tracking and monitoring

## Monitoring and Observability

### Health Checks
All services provide comprehensive health checks that verify:
- Service availability
- Database connectivity
- External service dependencies
- Resource utilization

### Metrics Collection
Services collect metrics for:
- Request rates and latencies
- Success/failure rates
- Resource utilization
- Tool usage patterns

### Logging
Structured logging includes:
- Request/response logging
- Error tracking
- Performance metrics
- Security events

## Development Guidelines

### Code Structure
```
service_name/
├── main.py              # FastAPI application
├── models.py           # Pydantic models (if separate)
├── services.py         # Business logic (if separate)
├── Dockerfile          # Container definition
└── requirements.txt    # Python dependencies (shared)
```

### Best Practices
1. **Error Handling**: Comprehensive try-catch blocks with proper logging
2. **Input Validation**: Use Pydantic models for all inputs
3. **Async/Await**: Use async patterns for I/O operations
4. **Type Hints**: Full type annotations for better code quality
5. **Documentation**: Docstrings for all public functions
6. **Testing**: Unit tests for critical functionality

### Adding New Services
1. Create service directory under `python_services/`
2. Implement FastAPI application with health check
3. Add Dockerfile and update docker-compose.yml
4. Update nginx.conf for routing (if using)
5. Add client library methods in `lib/microservices.ts`

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**:
   - Ensure Redis is running: `redis-cli ping`
   - Check Redis URL in environment variables

2. **OpenAI API Errors**:
   - Verify API key is set: `echo $OPENAI_API_KEY`
   - Check API key validity and rate limits

3. **Service Not Responding**:
   - Check service logs: `docker-compose logs [service-name]`
   - Verify port availability: `netstat -an | grep 800[1-5]`

4. **Import Errors**:
   - Ensure all dependencies are installed: `pip install -r requirements.txt`
   - Check Python path: `echo $PYTHONPATH`

### Debugging

1. **Enable Debug Logging**:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

2. **Check Service Health**:
```bash
curl http://localhost:800[1-5]/health
```

3. **Monitor Redis**:
```bash
redis-cli monitor
```

4. **View Service Logs**:
```bash
docker-compose logs -f [service-name]
```

## Contributing

1. Follow Python PEP 8 style guidelines
2. Add type hints to all functions
3. Write comprehensive docstrings
4. Include error handling and logging
5. Add health checks to new services
6. Update this README with new services

## License

This project is for educational and demonstration purposes as part of the AgentVerse marketplace platform.