import uuid
from datetime import datetime, timezone
from sqlalchemy import String, ForeignKey, DateTime, Text, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base


class AIPrompt(Base):
    __tablename__ = "ai_prompts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    version: Mapped[str] = mapped_column(String(50), nullable=False)
    system_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    user_prompt_template: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class AIExplanation(Base):
    __tablename__ = "ai_explanations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    run_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, unique=True)
    run_type: Mapped[str] = mapped_column(String(50), nullable=False)  # OPTIMIZATION, SIMULATION
    prompt_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ai_prompts.id", ondelete="RESTRICT"), nullable=False
    )
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    tokens_used: Mapped[int] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    prompt = relationship("AIPrompt")
    # For back_populates, we define dynamic property resolving depending on run_type
    optimization_run = relationship("OptimizationRun", primaryjoin="foreign(AIExplanation.run_id) == OptimizationRun.id", back_populates="explanation", uselist=False)
    simulation_run = relationship("SimulationRun", primaryjoin="foreign(AIExplanation.run_id) == SimulationRun.id", back_populates="explanation", uselist=False)
