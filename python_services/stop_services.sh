#!/bin/bash

# Stop all Python microservices
echo "Stopping AgentVerse Python Microservices..."

# Create pids directory if it doesn't exist
mkdir -p pids

# Stop services using stored PIDs
if [ -f "pids/workflow.pid" ]; then
    kill $(cat pids/workflow.pid) 2>/dev/null
    rm pids/workflow.pid
    echo "Stopped Workflow Engine"
fi

if [ -f "pids/runtime.pid" ]; then
    kill $(cat pids/runtime.pid) 2>/dev/null
    rm pids/runtime.pid
    echo "Stopped Agent Runtime"
fi

if [ -f "pids/mcp.pid" ]; then
    kill $(cat pids/mcp.pid) 2>/dev/null
    rm pids/mcp.pid
    echo "Stopped MCP Server"
fi

if [ -f "pids/a2a.pid" ]; then
    kill $(cat pids/a2a.pid) 2>/dev/null
    rm pids/a2a.pid
    echo "Stopped A2A Service"
fi

if [ -f "pids/orchestrator.pid" ]; then
    kill $(cat pids/orchestrator.pid) 2>/dev/null
    rm pids/orchestrator.pid
    echo "Stopped AI Orchestrator"
fi

if [ -f "pids/celery.pid" ]; then
    kill $(cat pids/celery.pid) 2>/dev/null
    rm pids/celery.pid
    echo "Stopped Celery Worker"
fi

# Also kill any remaining Python processes on the service ports
pkill -f "uvicorn.*:800[1-5]" 2>/dev/null
pkill -f "celery.*worker" 2>/dev/null

echo "All services stopped successfully!"