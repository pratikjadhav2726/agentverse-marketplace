from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="Agent Runtime Service", version="0.1.0")

class RunRequest(BaseModel):
	agent_id: str
	input: str
	user_id: Optional[str] = None

class RunResponse(BaseModel):
	output: str
	agent_id: str

@app.get("/health")
async def health():
	return {"status": "ok"}

@app.post("/run", response_model=RunResponse)
async def run(req: RunRequest):
	# Minimal placeholder. Could integrate LangChain/LangGraph here later.
	return RunResponse(output=f"[agent:{req.agent_id}] {req.input}", agent_id=req.agent_id)