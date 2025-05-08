
import os
from dotenv import load_dotenv

# Load environment variables from .env file
# Correct path for .env if it's in the root of the `social_media_analytics` directory
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env')
load_dotenv(dotenv_path)

class Config:
    """Base configuration."""
    # Application settings
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key-for-development')
    DEBUG = False
    TESTING = False
    
    # Database settings
    # Default to an in-memory SQLite DB for simplicity if not set
    DATABASE_URI = os.environ.get('DATABASE_URI', f"sqlite:///{os.path.join(os.path.dirname(os.path.dirname(__file__)), 'social_media_analytics.db')}")
    
    # API Keys
    TWITTER_API_KEY = os.environ.get('TWITTER_API_KEY')
    TWITTER_API_SECRET = os.environ.get('TWITTER_API_SECRET')
    TWITTER_ACCESS_TOKEN = os.environ.get('TWITTER_ACCESS_TOKEN')
    TWITTER_ACCESS_SECRET = os.environ.get('TWITTER_ACCESS_SECRET')
    
    # Data collection settings
    COLLECTION_INTERVAL = int(os.environ.get('COLLECTION_INTERVAL', 3600))  # seconds
    DEFAULT_KEYWORDS = ['tech', 'ai', 'machinelearning', 'data']
    POST_LIMIT = int(os.environ.get('POST_LIMIT', 100))
    PROCESSING_INTERVAL_MINUTES = int(os.environ.get('PROCESSING_INTERVAL_MINUTES', 10)) # New
    
    # NLP settings
    # Corrected path to be relative to the 'app' directory where config.py is assumed to be.
    # If config.py is in `app/`, and stopwords.txt is in `app/utils/`
    STOPWORDS_FILE = os.path.join(os.path.dirname(__file__), 'utils', 'stopwords.txt')
    
    # Misc settings
    TIMEZONE = os.environ.get('TIMEZONE', 'UTC')


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    # SQLALCHEMY_TRACK_MODIFICATIONS = True # This is a Flask-SQLAlchemy specific config, not base SQLAlchemy


class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    DATABASE_URI = f"sqlite:///{os.path.join(os.path.dirname(os.path.dirname(__file__)), 'test.db')}" # In-memory for tests
    WTF_CSRF_ENABLED = False # If using Flask-WTF
    COLLECTION_INTERVAL = 3600 * 24 # Don't run scheduler frequently during tests
    PROCESSING_INTERVAL_MINUTES = 60 * 24


class ProductionConfig(Config):
    """Production configuration."""
    # Production-specific settings
    # e.g. JWT_COOKIE_SECURE = True, SESSION_COOKIE_SECURE = True
    pass


# Configuration dictionary
config_by_name = { # Renamed for clarity
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}


def get_config():
    """Get the appropriate configuration based on environment."""
    environment = os.environ.get('FLASK_ENV', 'default').lower()
    return config_by_name.get(environment, config_by_name['default'])() # Instantiate the class
