import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./data/a3.db")

# Ensure the data directory exists for sqlite file-based databases.
if DATABASE_URL.startswith("sqlite:///"):
    db_path = DATABASE_URL[len("sqlite:///"):]
    db_dir = os.path.dirname(db_path)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)

# SQLite WAL: allow a reader (GET /transactions) to proceed concurrently with
# the score-callback writer instead of serializing on a single global lock.
# WAL also survives a crash mid-write without corrupting the db file. No-op for
# in-memory / non-sqlite URLs.
if DATABASE_URL.startswith("sqlite") and ":memory:" not in DATABASE_URL:
    from sqlalchemy import event

    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, _connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA busy_timeout=5000")
        cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
