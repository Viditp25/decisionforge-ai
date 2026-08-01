from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenPayload(BaseModel):
    sub: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    first_name: str
    last_name: str
    organization_name: str


class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    first_name: str
    last_name: str
    organization_id: UUID
    is_active: bool
    role: Optional[str] = None

    class Config:
        from_attributes = True


class OAuthLoginRequest(BaseModel):
    provider: str
    credential_token: str


class OrganizationResponse(BaseModel):
    id: UUID
    name: str
    slug: str

    class Config:
        from_attributes = True
