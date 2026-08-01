from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


class ExplanationTrigger(BaseModel):
    run_id: UUID
    run_type: str  # OPTIMIZATION or SIMULATION


class ExplanationResponse(BaseModel):
    id: UUID
    run_id: UUID
    run_type: str
    prompt_id: UUID
    explanation: str
    tokens_used: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AIPromptCreate(BaseModel):
    name: str
    version: str
    system_prompt: str
    user_prompt_template: str
    is_active: bool = False


class AIPromptResponse(AIPromptCreate):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
