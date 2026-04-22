from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

# ── Detect if using SQLite (dev fallback) or PostgreSQL (production) ──
# Railway provides DATABASE_URL as postgres:// or postgresql:// —
# SQLAlchemy async requires postgresql+asyncpg://
_raw_url = settings.DATABASE_URL
if _raw_url.startswith("postgres://"):
    _raw_url = _raw_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif _raw_url.startswith("postgresql://"):
    _raw_url = _raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)

is_sqlite = _raw_url.startswith("sqlite")

engine_kwargs = {
    "echo": settings.DEBUG,
}

if not is_sqlite:
    # PostgreSQL-specific pool settings
    engine_kwargs.update({
        "pool_size": 20,
        "max_overflow": 10,
        "pool_pre_ping": True,
    })

# ── Async Engine ──
engine = create_async_engine(_raw_url, **engine_kwargs)

# ── Session Factory ──
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# ── Base Model ──
class Base(DeclarativeBase):
    pass


# ── Auto-create tables on startup (dev only) ──
async def init_db():
    """Create all tables if they don't exist. Used for dev/SQLite — in production use Alembic."""
    import app.models  # noqa: F401
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


# ── Dependency ──
async def get_db() -> AsyncSession:
    """FastAPI dependency that yields a DB session."""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
