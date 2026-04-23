from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """NexusOps backend configuration — loaded from environment variables."""

    # ── Core ──
    APP_NAME: str = "NexusOps"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False
    SECRET_KEY: str = "change-me-in-production"
    ALLOWED_ORIGINS: str = "http://localhost:3000,https://nexusops.dev"

    # ── Database ──
    DATABASE_URL: str = "sqlite+aiosqlite:///./nexusops.db"

    # ── Redis ──
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── JWT ──
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24       # 24 hours
    JWT_REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # ── AI: Groq ──
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # ── AI: OpenAI (embeddings + Whisper) ──
    OPENAI_API_KEY: Optional[str] = None
    EMBEDDING_MODEL: str = "text-embedding-3-small"

    # ── GitHub OAuth ──
    GITHUB_CLIENT_ID: Optional[str] = None
    GITHUB_CLIENT_SECRET: Optional[str] = None
    GITHUB_WEBHOOK_SECRET: Optional[str] = None

    # ── Telegram ──
    TELEGRAM_BOT_TOKEN: Optional[str] = None

    # ── Sentry ──
    SENTRY_WEBHOOK_SECRET: Optional[str] = None

    # ── Jira ──
    JIRA_BASE_URL: Optional[str] = None
    JIRA_API_TOKEN: Optional[str] = None
    JIRA_USER_EMAIL: Optional[str] = None
    JIRA_PROJECT_KEY: str = "NEX"

    # ── Deploy Platforms (auto-revert) ──
    VERCEL_TOKEN: Optional[str] = None
    RAILWAY_TOKEN: Optional[str] = None

    # ── Cloudflare R2 Storage ──
    CLOUDFLARE_R2_ACCESS_KEY: Optional[str] = None
    CLOUDFLARE_R2_SECRET_KEY: Optional[str] = None
    CLOUDFLARE_R2_BUCKET: str = "nexusops"
    CLOUDFLARE_R2_ENDPOINT: Optional[str] = None

    # ── Firebase ──
    FIREBASE_WEB_API_KEY: Optional[str] = None

    # ── SMTP (Transactional Emails) ──
    ENABLE_EMAILS: bool = False
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 465
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: str = "noreply@nexusops.io"
    SMTP_FROM_NAME: str = "NexusOps"

    # ── Frontend ──
    FRONTEND_URL: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()
