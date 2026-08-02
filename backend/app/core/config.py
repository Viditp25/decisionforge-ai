import os
from typing import List, Union
from pydantic import AnyHttpUrl, BeforeValidator, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing_extensions import Annotated


import json

def parse_cors(v: Union[str, List[str]]) -> List[str]:
    if isinstance(v, str):
        if v.startswith("["):
            try:
                return json.loads(v)
            except Exception:
                pass
        return [i.strip() for i in v.split(",")]
    elif isinstance(v, list):
        return v
    raise ValueError(v)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_ignore_empty=True, extra="ignore"
    )

    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "DecisionForge AI"
    ENVIRONMENT: str = "development"

    # Database Settings
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgrespassword@localhost:5432/decisionforge"
    )

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_url(cls, v: str) -> str:
        if isinstance(v, str):
            if v.startswith("postgres://"):
                return v.replace("postgres://", "postgresql+asyncpg://", 1)
            elif v.startswith("postgresql://"):
                return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    # Redis Settings
    REDIS_URL: str = Field(default="redis://localhost:6379/0")

    # JWT Settings
    JWT_SECRET: str = Field(default="super-secret-key-decision-forge-ai-2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 1 week

    # CORS Origins
    BACKEND_CORS_ORIGINS: Annotated[
        Union[List[str], str], BeforeValidator(parse_cors)
    ] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # OpenAI API Key
    OPENAI_API_KEY: str = Field(default="mock-key")


settings = Settings()
