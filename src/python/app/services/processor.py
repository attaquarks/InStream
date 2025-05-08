
import re
import logging
import nltk
import pandas as pd
import numpy as np
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.sentiment import SentimentIntensityAnalyzer
from collections import Counter
from datetime import datetime, timedelta
from sqlalchemy import func, desc

from app.models.post import Post, Keyword, Hashtag
from database.db import session_scope
from app.config import get_config

# Initialize NLTK
try:
    nltk.data.find('tokenizers/punkt.zip') # Corrected path for punkt
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/stopwords.zip') # Corrected path for stopwords
except LookupError:
    nltk.download('stopwords')

try:
    nltk.data.find('sentiment/vader_lexicon.zip')
except LookupError:
    nltk.download('vader_lexicon')


class DataProcessor:
    """Class for processing social media data."""
    
    def __init__(self):
        """Initialize the data processor."""
        self.config = get_config()
        self.stop_words = set(stopwords.words('english'))
        
        # Add custom stopwords
        try:
            with open(self.config.STOPWORDS_FILE, 'r', encoding='utf-8') as f:
                custom_stopwords = set(line.strip() for line in f)
                self.stop_words.update(custom_stopwords)
        except FileNotFoundError:
            logging.warning(f"Custom stopwords file not found: {self.config.STOPWORDS_FILE}")
        
        # Initialize sentiment analyzer
        self.sentiment_analyzer = SentimentIntensityAnalyzer()
    
    def preprocess_text(self, text):
        """Preprocess text for analysis."""
        # Convert to lowercase
        text = text.lower()
        
        # Remove URLs
        text = re.sub(r'http\S+|www\S+|https\S+', '', text)
        
        # Remove mentions (@username)
        text = re.sub(r'@\w+', '', text)
        
        # Remove hashtags but keep the text (extract actual word)
        text = re.sub(r'#(\w+)', r'\1', text)
        
        # Remove special characters and numbers
        text = re.sub(r'[^a-zA-Z\s]', '', text)
        
        # Tokenize
        tokens = word_tokenize(text)
        
        # Remove stopwords and short words
        tokens = [word for word in tokens if word not in self.stop_words and len(word) > 2]
        
        return tokens
    
    def extract_keywords(self, post_id=None, limit=None):
        """Extract keywords from posts and store them in the database."""
        processed_count = 0
        with session_scope() as session:
            # Query posts that need keyword extraction
            query = session.query(Post).outerjoin(Post.keywords) # Use relationship for outerjoin
            
            if post_id:
                query = query.filter(Post.id == post_id)
            else:
                # Filter posts that don't have keywords yet
                query = query.filter(~Post.keywords.any())
            
            if limit:
                query = query.limit(limit)
            
            posts_to_process = query.all()
            
            for post in posts_to_process:
                # Preprocess text
                tokens = self.preprocess_text(post.content)
                
                # Count token frequencies
                token_counts = Counter(tokens)
                
                # Store keywords
                for token, frequency in token_counts.most_common(10):  # Store top 10 keywords
                    keyword_obj = Keyword( # Renamed variable to avoid conflict
                        post_id=post.id,
                        text=token,
                        frequency=frequency
                    )
                    session.add(keyword_obj)
                processed_count +=1
        
        return processed_count
    
    def analyze_sentiment(self, post_id=None, limit=None):
        """Analyze sentiment of posts."""
        processed_count = 0
        with session_scope() as session:
            # Query posts that need sentiment analysis
            query = session.query(Post).filter(Post.sentiment_score == None)
            
            if post_id:
                query = query.filter(Post.id == post_id)
            
            if limit:
                query = query.limit(limit)
            
            posts_to_process = query.all()
            
            for post in posts_to_process:
                # Get sentiment scores
                sentiment = self.sentiment_analyzer.polarity_scores(post.content)
                
                # Store compound score
                post.sentiment_score = sentiment['compound']
                processed_count += 1
        
        return processed_count
    
    def get_trending_keywords(self, days=1, limit=10):
        """Get trending keywords from the last N days."""
        with session_scope() as session:
            # Calculate date threshold
            threshold_date = datetime.utcnow() - timedelta(days=days)
            
            # Query for top keywords
            keyword_counts = session.query(
                Keyword.text,
                func.sum(Keyword.frequency).label('total_frequency')
            ).join(Post).filter(
                Post.created_at >= threshold_date
            ).group_by(
                Keyword.text
            ).order_by(
                desc('total_frequency')
            ).limit(limit).all()
            
            return [{'text': k.text, 'frequency': int(k.total_frequency)} for k in keyword_counts] # Access by attribute
    
    def get_trending_hashtags(self, days=1, limit=10):
        """Get trending hashtags from the last N days."""
        with session_scope() as session:
            # Calculate date threshold
            threshold_date = datetime.utcnow() - timedelta(days=days)
            
            # Query for top hashtags
            hashtag_counts = session.query(
                Hashtag.text,
                func.count(Post.id).label('post_count')
            ).join(
                Hashtag.posts # Use relationship for join
            ).filter(
                Post.created_at >= threshold_date
            ).group_by(
                Hashtag.text
            ).order_by(
                desc('post_count')
            ).limit(limit).all()
            
            return [{'text': h.text, 'count': int(h.post_count)} for h in hashtag_counts] # Access by attribute

    def get_post_activity(self, days=7, interval='day'):
        """Get post activity over time."""
        with session_scope() as session:
            # Calculate date threshold
            end_date = datetime.utcnow()
            threshold_date = end_date - timedelta(days=days)
            
            # Query posts within the time range
            posts_data = session.query(
                Post.created_at,
                Post.platform
            ).filter(
                Post.created_at >= threshold_date,
                Post.created_at <= end_date # Ensure we don't go into future if system clock is off
            ).all()
            
            if not posts_data:
                return []

            # Convert to DataFrame
            df = pd.DataFrame([(p.created_at, p.platform) for p in posts_data], 
                             columns=['created_at', 'platform'])
            
            df['created_at'] = pd.to_datetime(df['created_at'])

            # Determine frequency for date_range and resampling
            freq_map = {'hour': 'H', 'day': 'D', 'week': 'W-MON'} # W-MON for start of week
            pandas_freq = freq_map.get(interval, 'D')

            # Resample and count
            # Set created_at as index for resampling
            df = df.set_index('created_at')
            
            # Group by platform then resample and count
            activity_list = []
            for platform_name, group_df in df.groupby('platform'):
                resampled = group_df.resample(pandas_freq).size().rename(platform_name)
                activity_list.append(resampled)
            
            if not activity_list: # No posts after grouping
                # Create an empty DataFrame with the expected date range
                idx = pd.date_range(start=threshold_date.replace(hour=0, minute=0, second=0, microsecond=0), 
                                    end=end_date.replace(hour=0, minute=0, second=0, microsecond=0), 
                                    freq=pandas_freq)
                activity = pd.DataFrame(index=idx)
            else:
                activity = pd.concat(activity_list, axis=1).fillna(0)

            # Ensure all platforms are columns, even if they have no activity
            all_platforms = session.query(Post.platform).distinct().all()
            for p_tuple in all_platforms:
                p = p_tuple[0]
                if p not in activity.columns:
                    activity[p] = 0
            
            activity = activity.sort_index()
            
            # Convert to dictionary format
            result = []
            for date_idx, row in activity.iterrows():
                data_point = {'date': date_idx.isoformat()}
                for platform_col in activity.columns: # Use activity.columns to iterate
                    data_point[platform_col] = int(row[platform_col])
                result.append(data_point)
            
            return result
    
    def get_engagement_metrics(self, days=7, platform=None):
        """Get engagement metrics over time."""
        with session_scope() as session:
            # Calculate date threshold
            threshold_date = datetime.utcnow() - timedelta(days=days)
            
            # Query posts within the time range
            query = session.query(
                func.date(Post.created_at).label('date'),
                func.avg(Post.likes).label('avg_likes'),
                func.avg(Post.shares).label('avg_shares'),
                func.avg(Post.comments).label('avg_comments'),
                func.count(Post.id).label('post_count')
            ).filter(
                Post.created_at >= threshold_date
            )
            
            if platform:
                query = query.filter(Post.platform == platform)
            
            # Group by date
            metrics = query.group_by(
                func.date(Post.created_at)
            ).order_by(
                func.date(Post.created_at)
            ).all()
            
            # Convert to list of dictionaries
            result = []
            for m in metrics:
                result.append({
                    'date': m.date.isoformat() if m.date else None, # Handle if date is None
                    'avg_likes': float(m.avg_likes or 0),
                    'avg_shares': float(m.avg_shares or 0),
                    'avg_comments': float(m.avg_comments or 0),
                    'post_count': int(m.post_count or 0) # Handle if post_count is None
                })
            
            return result
    
    def get_sentiment_distribution(self, days=7, platform=None):
        """Get sentiment distribution."""
        with session_scope() as session:
            # Calculate date threshold
            threshold_date = datetime.utcnow() - timedelta(days=days)
            
            # Query posts with sentiment scores
            query = session.query(Post.sentiment_score).filter( # Query only sentiment_score
                Post.created_at >= threshold_date,
                Post.sentiment_score != None # SQLAlchemy uses '==' for None checks
            )
            
            if platform:
                query = query.filter(Post.platform == platform)
            
            sentiments = query.all() # This will be a list of tuples like [(0.5,), (-0.2,)]
            
            # Calculate sentiment distribution
            if not sentiments:
                return {
                    'positive': 0,
                    'neutral': 0,
                    'negative': 0
                }
            
            # Extract scores from tuples
            scores = [s[0] for s in sentiments]

            positive = sum(1 for score in scores if score > 0.05)
            negative = sum(1 for score in scores if score < -0.05)
            neutral = len(scores) - positive - negative
            
            return {
                'positive': positive,
                'neutral': neutral,
                'negative': negative
            }
