
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from app.services.collector import collect_and_save_data # Assuming collector.py will be created
from app.services.processor import DataProcessor
from app.config import get_config
import atexit

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def data_collection_job():
    """Scheduled job to collect new data."""
    config = get_config()
    logger.info("Starting scheduled data collection...")
    
    try:
        # Collect data from Twitter
        # Placeholder for actual keywords and limit logic
        count = collect_and_save_data('twitter', config.DEFAULT_KEYWORDS, config.POST_LIMIT)
        logger.info(f"Collected {count} posts from Twitter")
    except Exception as e:
        logger.error(f"Error collecting data from Twitter: {e}", exc_info=True)


def data_processing_job():
    """Scheduled job to process and analyze collected data."""
    logger.info("Starting scheduled data processing...")
    
    try:
        # Initialize processor
        processor = DataProcessor()
        
        # Extract keywords
        keyword_count = processor.extract_keywords()
        logger.info(f"Extracted keywords from {keyword_count} posts")
        
        # Analyze sentiment
        sentiment_count = processor.analyze_sentiment()
        logger.info(f"Analyzed sentiment for {sentiment_count} posts")
    except Exception as e:
        logger.error(f"Error processing data: {e}", exc_info=True)


def init_scheduler():
    """Initialize the task scheduler."""
    config = get_config()
    
    # Create scheduler
    scheduler = BackgroundScheduler(timezone=config.TIMEZONE) # Use timezone from config
    
    # Data collection job - run every X seconds (from config)
    scheduler.add_job(
        func=data_collection_job,
        trigger=IntervalTrigger(seconds=config.COLLECTION_INTERVAL),
        id='data_collection_job',
        name='Collect new social media data',
        replace_existing=True
    )
    
    # Data processing job - run every 10 minutes (can be configurable too)
    processing_interval_minutes = getattr(config, 'PROCESSING_INTERVAL_MINUTES', 10)
    scheduler.add_job(
        func=data_processing_job,
        trigger=IntervalTrigger(minutes=processing_interval_minutes),
        id='data_processing_job',
        name='Process and analyze collected data',
        replace_existing=True
    )
    
    # Start the scheduler
    scheduler.start()
    logger.info(f"Scheduler started with collection interval: {config.COLLECTION_INTERVAL}s and processing interval: {processing_interval_minutes}min.")
    
    # Shut down the scheduler when exiting the app
    atexit.register(lambda: scheduler.shutdown())
    
    return scheduler
