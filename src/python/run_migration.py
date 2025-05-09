import os
import sys
from pathlib import Path

# Add the parent directory to Python path
sys.path.append(str(Path(__file__).parent))

from database.migrations.add_post_columns import upgrade

if __name__ == '__main__':
    print("Running database migration...")
    upgrade()
    print("Migration completed!") 