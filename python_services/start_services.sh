#!/bin/bash

# Start all Python microservices for development
echo "Starting AgentVerse Python Microservices..."

# Check if Redis is running
if ! redis-cli ping > /dev/null 2>&1; then
    echo "Starting Redis..."
    redis-server --daemonize yes
    sleep 2
fi

# Install dependencies if not already installed
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Start services in background
echo "Starting Workflow Engine Service..."
cd workflow_engine && python main.py &
WORKFLOW_PID=$!

echo "Starting Agent Runtime Service..."
cd ../agent_runtime && python main.py &
RUNTIME_PID=$!

echo "Starting MCP Server Service..."
cd ../mcp_server && python main.py &
MCP_PID=$!

echo "Starting A2A Service..."
cd ../a2a_service && python main.py &
A2A_PID=$!

echo "Starting AI Orchestrator Service..."
cd ../ai_orchestrator && python main.py &
ORCHESTRATOR_PID=$!

echo "Starting Celery Worker..."
cd ../workflow_engine && celery -A main.celery_app worker --loglevel=info &
CELERY_PID=$!

# Store PIDs for cleanup
echo $WORKFLOW_PID > ../pids/workflow.pid
echo $RUNTIME_PID > ../pids/runtime.pid
echo $MCP_PID > ../pids/mcp.pid
echo $A2A_PID > ../pids/a2a.pid
echo $ORCHESTRATOR_PID > ../pids/orchestrator.pid
echo $CELERY_PID > ../pids/celery.pid

echo "All services started successfully!"
echo "Workflow Engine: http://localhost:8001"
echo "Agent Runtime: http://localhost:8002"
echo "MCP Server: http://localhost:8003"
echo "A2A Service: http://localhost:8004"
echo "AI Orchestrator: http://localhost:8005"
echo ""
echo "To stop services, run: ./stop_services.sh"

# Keep script running
wait