from typing import AsyncGenerator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User
from app.models.org import TeamMembership
from app.repositories.user import UserRepository
from sqlalchemy import select

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"/api/v1/auth/login")


async def get_current_user(
    db: AsyncSession = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    user_id_str = decode_access_token(token)
    if not user_id_str:
        raise credentials_exception

    try:
        user_uuid = get_uuid_from_str(user_id_str)
    except ValueError:
        raise credentials_exception

    user_repo = UserRepository(db)
    user = await user_repo.get(user_uuid)
    if not user:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return user


def get_uuid_from_str(val: str) -> str:
    import uuid
    return uuid.UUID(val)


def require_role(allowed_roles: list[str]):
    """
    FastAPI dependency factory enforcing Role-Based Access Control (RBAC).
    Checks that the current user has one of the allowed roles in the relevant team memberships.
    """
    async def role_checker(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
    ):
        # Fetch memberships for this user
        result = await db.execute(
            select(TeamMembership).filter(TeamMembership.user_id == current_user.id)
        )
        memberships = result.scalars().all()
        
        # Check if user has any role in allowed_roles
        if not memberships or not any(m.role in allowed_roles for m in memberships):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions to perform this action"
            )
        return current_user
    
    return role_checker
