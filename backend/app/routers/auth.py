from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    GitHubCallbackRequest,
    RefreshTokenRequest,
    FirebaseAuthRequest,
    AuthResponse,
    UserResponse,
    TokenResponse,
)
from app.services.auth_service import auth_service
from app.services.email_service import (
    send_welcome_email,
    send_login_alert_email,
    send_password_reset_email,
)

router = APIRouter()


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user with email and password."""
    existing = await auth_service.get_user_by_email(db, body.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = await auth_service.create_user(
        db,
        email=body.email,
        name=body.name,
        password=body.password,
        provider="credentials",
    )
    tokens = auth_service.create_tokens(user)

    # Send welcome email (fire-and-forget)
    try:
        await send_welcome_email(user.email, user.name or "there")
    except Exception:
        pass  # Don't block registration if email fails

    return AuthResponse(
        user=UserResponse.model_validate(user),
        tokens=TokenResponse(**tokens),
    )


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate with email and password."""
    user = await auth_service.authenticate_user(db, body.email, body.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    tokens = auth_service.create_tokens(user)

    # Send login alert email (fire-and-forget)
    try:
        await send_login_alert_email(user.email, user.name or "there")
    except Exception:
        pass

    return AuthResponse(
        user=UserResponse.model_validate(user),
        tokens=TokenResponse(**tokens),
    )


@router.get("/github/callback", response_model=AuthResponse)
async def github_callback(code: str, db: AsyncSession = Depends(get_db)):
    """Handle GitHub OAuth callback. The frontend passes the access_token as 'code'."""
    try:
        # Note: The NextAuth frontend passes the access token in the 'code' query parameter
        github_data = await auth_service.exchange_github_token(code)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"GitHub OAuth failed: {str(e)}",
        )

    user = await auth_service.get_or_create_github_user(db, github_data)
    tokens = auth_service.create_tokens(user)
    return AuthResponse(
        user=UserResponse.model_validate(user),
        tokens=TokenResponse(**tokens),
    )


@router.get("/google/callback", response_model=AuthResponse)
async def google_callback(token: str, db: AsyncSession = Depends(get_db)):
    """Handle Google OAuth callback — use access token to get profile and login."""
    try:
        google_data = await auth_service.exchange_google_token(token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Google OAuth failed: {str(e)}",
        )

    user = await auth_service.get_or_create_google_user(db, google_data)
    tokens = auth_service.create_tokens(user)
    return AuthResponse(
        user=UserResponse.model_validate(user),
        tokens=TokenResponse(**tokens),
    )




@router.post("/firebase", response_model=AuthResponse)
async def firebase_auth(body: FirebaseAuthRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate with Firebase ID token and return backend JWTs."""
    try:
        firebase_data = await auth_service.verify_firebase_id_token(body.id_token)
        user = await auth_service.get_or_create_firebase_user(db, firebase_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )

    tokens = auth_service.create_tokens(user)
    return AuthResponse(
        user=UserResponse.model_validate(user),
        tokens=TokenResponse(**tokens),
    )

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(body: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    """Refresh an expired access token."""
    payload = auth_service.decode_token(body.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    user = await auth_service.get_user_by_id(db, payload["sub"])
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    tokens = auth_service.create_tokens(user)
    return TokenResponse(**tokens)


@router.post("/password-reset-notify")
async def password_reset_notify(body: dict, db: AsyncSession = Depends(get_db)):
    """Send a branded password-reset notification after Firebase reset is triggered."""
    email = body.get("email", "")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    user = await auth_service.get_user_by_email(db, email)
    name = user.name if user else email.split("@")[0]

    try:
        await send_password_reset_email(email, name)
    except Exception:
        pass  # Best-effort

    return {"message": "Password reset notification sent"}


@router.delete("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(current_user: User = Depends(get_current_user)):
    """Logout — client should discard tokens. Server-side token blacklist is post-MVP."""
    return None


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get the currently authenticated user profile."""
    return UserResponse.model_validate(current_user)
