from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from contextlib import contextmanager
import os

# Create database directory if it doesn't exist
db_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'instance')
os.makedirs(db_dir, exist_ok=True)

# Database URL
DATABASE_URL = f'sqlite:///{os.path.join(db_dir, "app.db")}'

# Create engine
engine = create_engine(DATABASE_URL)

# Create session factory
Session = sessionmaker(bind=engine)

@contextmanager
def session_scope():
    """Provide a transactional scope around a series of operations."""
    session = Session()
    try:
        yield session
        session.commit()
    except:
        session.rollback()
        raise
    finally:
        session.close()

def init_db():
    """Initialize the database, creating all tables."""
    from app.models.post import Base
    Base.metadata.create_all(engine) 