# Agent Runtime Service (Python)

Minimal FastAPI service to execute agents. Currently echoes input.

## Setup

```bash
cd python/agent_runtime
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001
```

## Configure Next.js to use it

Set environment variable before running Next.js:

```bash
export AGENT_RUNTIME_URL=http://localhost:8001
npm run dev
```