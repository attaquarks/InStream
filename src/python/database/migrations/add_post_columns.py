from sqlalchemy import create_engine, Column, String, Float, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database URL from environment
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///instance/app.db')

# Create engine and session
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()

def upgrade():
    """Add new columns to posts table."""
    try:
        # Add new columns using text() for raw SQL
        with engine.connect() as conn:
            conn.execute(text('ALTER TABLE posts ADD COLUMN source_url VARCHAR(500)'))
            conn.execute(text('ALTER TABLE posts ADD COLUMN author VARCHAR(200)'))
            conn.execute(text('ALTER TABLE posts ADD COLUMN engagement_score FLOAT'))
            conn.commit()
        print("Successfully added new columns to posts table")
    except Exception as e:
        print(f"Error adding columns: {str(e)}")
        session.rollback()
        raise

def downgrade():
    """Remove new columns from posts table."""
    try:
        # Note: SQLite doesn't support dropping columns directly
        # We would need to create a new table without these columns
        # and copy the data over
        print("SQLite doesn't support dropping columns directly")
        print("To remove these columns, you would need to recreate the table")
    except Exception as e:
        print(f"Error in downgrade: {str(e)}")
        session.rollback()
        raise

if __name__ == '__main__':
    upgrade() 