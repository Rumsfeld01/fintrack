from logging.config import fileConfig
from sqlalchemy import create_engine, pool
from alembic import context
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Import models for metadata — but avoid triggering engine creation at import
# by importing Base directly from the declarative layer, not from db.base
from sqlalchemy.orm import declarative_base
from app.models import *  # noqa: register all models

# Get Base metadata without creating the engine
# We re-use the same Base that app.db.base uses
from app.db.base import Base
from app.core.config import settings

config = context.config

# Always use the URL from settings (honours DATABASE_URL env var and .env)
db_url = settings.database_url
config.set_main_option("sqlalchemy.url", db_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=db_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = create_engine(db_url, poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
