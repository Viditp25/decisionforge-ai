from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.auth import RegisterRequest, LoginRequest, Token, UserResponse, OAuthLoginRequest
from app.services.auth import AuthService
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    auth_service = AuthService(db)
    try:
        user = await auth_service.register_user_org(req)
        user.role = "Owner"
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/login", response_model=Token)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    auth_service = AuthService(db)
    try:
        token = await auth_service.login_user(req)
        return token
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.post("/oauth/google", response_model=Token)
async def oauth_google(req: OAuthLoginRequest, db: AsyncSession = Depends(get_db)):
    auth_service = AuthService(db)
    try:
        token = await auth_service.oauth_google_login(req)
        return token
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy import select
    from app.models.org import TeamMembership
    
    result = await db.execute(
        select(TeamMembership.role)
        .filter(TeamMembership.user_id == current_user.id)
        .limit(1)
    )
    role = result.scalar_one_or_none()
    current_user.role = role or "Viewer"
    return current_user
