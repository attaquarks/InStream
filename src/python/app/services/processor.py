
import re
import logging
import nltk
import pandas as pd
# import numpy as np # Not explicitly used in the new version of this file
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.sentiment import SentimentIntensityAnalyzer
from collections import Counter
from datetime import datetime, timedelta
from sqlalchemy import func, desc

from app.models.post import Post, Keyword, Hashtag
from database.db import session_scope # Removed get_session as it's not used here
from app.config import get_config

# Initialize NLTK
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords', quiet=True)

try:
    nltk.data.find('sentiment/vader_lexicon.zip')
except LookupError:
    nltk.download('vader_lexicon', quiet=True)


class DataProcessor:
    """Class for processing social media data."""
    
    def __init__(self):
        """Initialize the data processor."""
        self.config = get_config()
        self.stop_words = set(stopwords.words('english'))
        
        # Add custom stopwords
        try:
            # Ensure STOPWORDS_FILE path is correct and accessible
            with open(self.config.STOPWORDS_FILE, 'r', encoding='utf-8') as f:
                custom_stopwords = set(line.strip() for line in f if line.strip())
                self.stop_words.update(custom_stopwords)
        except FileNotFoundError:
            logging.warning(f"Custom stopwords file not found: {self.config.STOPWORDS_FILE}")
        except Exception as e:
            logging.error(f"Error loading custom stopwords: {e}")
        
        # Initialize sentiment analyzer
        self.sentiment_analyzer = SentimentIntensityAnalyzer()
    
    def preprocess_text(self, text):
        """Preprocess text for analysis."""
        if not isinstance(text, str):
            return [] # Or handle as an error
            
        # Convert to lowercase
        text = text.lower()
        
        # Remove URLs
        text = re.sub(r'http\S+|www\S+|https\S+', '', text)
        
        # Remove mentions (@username)
        text = re.sub(r'@\w+', '', text)
        
        # Remove hashtags but keep the text (e.g. #topic becomes topic)
        text = re.sub(r'#(\w+)', r'\1', text)
        
        # Remove special characters and numbers, keeping only letters and spaces
        text = re.sub(r'[^a-zA-Z\s]', '', text)
        
        # Tokenize
        tokens = word_tokenize(text)
        
        # Remove stopwords and short words (e.g. length > 2)
        tokens = [word for word in tokens if word not in self.stop_words and len(word) > 2]
        
        return tokens
    
    def extract_keywords(self, post_id=None, limit=None):
        """Extract keywords from posts and store them in the database."""
        processed_count = 0
        with session_scope() as session:
            # Query posts that need keyword extraction
            query = session.query(Post).outerjoin(Post.keywords)
            
            if post_id:
                query = query.filter(Post.id == post_id)
            else:
                # Filter posts that don't have keywords yet (more robustly)
                query = query.filter(~Post.keywords.any())
            
            if limit:
                query = query.limit(limit)
            
            posts_to_process = query.all()
            
            for post in posts_to_process:
                tokens = self.preprocess_text(post.content)
                token_counts = Counter(tokens)
                
                for token, frequency in token_counts.most_common(10):  # Store top 10 keywords
                    keyword_obj = Keyword(
                        post_id=post.id,
                        text=token,
                        frequency=frequency
                    )
                    session.add(keyword_obj)
                processed_count += 1
        
        return processed_count
    
    def analyze_sentiment(self, post_id=None, limit=None):
        """Analyze sentiment of posts."""
        processed_count = 0
        with session_scope() as session:
            # Query posts that need sentiment analysis
            query = session.query(Post).filter(Post.sentiment_score.is_(None)) # Use is_ for None checks
            
            if post_id:
                query = query.filter(Post.id == post_id)
            
            if limit:
                query = query.limit(limit)
            
            posts_to_process = query.all()
            
            for post in posts_to_process:
                sentiment = self.sentiment_analyzer.polarity_scores(post.content)
                post.sentiment_score = sentiment['compound']
                processed_count += 1
        
        return processed_count
    
    def get_trending_keywords(self, days=1, limit=10):
        """Get trending keywords from the last N days."""
        with session_scope() as session:
            threshold_date = datetime.utcnow() - timedelta(days=days)
            
            keyword_counts = session.query(
                Keyword.text,
                func.sum(Keyword.frequency).label('total_frequency')
            ).join(Post, Keyword.post_id == Post.id).filter( # Explicit join condition
                Post.created_at >= threshold_date
            ).group_by(
                Keyword.text
            ).order_by(
                desc('total_frequency')
            ).limit(limit).all()
            
            return [{'text': k.text, 'frequency': int(k.total_frequency)} for k in keyword_counts]
    
    def get_trending_hashtags(self, days=1, limit=10):
        """Get trending hashtags from the last N days."""
        with session_scope() as session:
            threshold_date = datetime.utcnow() - timedelta(days=days)
            
            hashtag_counts = session.query(
                Hashtag.text,
                func.count(Post.id).label('post_count')
            ).join(
                Hashtag.posts # Relationship-based join
            ).filter(
                Post.created_at >= threshold_date
            ).group_by(
                Hashtag.text
            ).order_by(
                desc('post_count')
            ).limit(limit).all()
            
            return [{'text': h.text, 'count': int(h.post_count)} for h in hashtag_counts]
    
    def get_post_activity(self, days=7, interval='day'):
        """Get post activity over time."""
        with session_scope() as session:
            end_date = datetime.utcnow()
            threshold_date = end_date - timedelta(days=days)
            
            posts_data = session.query(
                Post.created_at,
                Post.platform
            ).filter(
                Post.created_at >= threshold_date,
                Post.created_at <= end_date
            ).all()

            if not posts_data:
                return []

            df = pd.DataFrame([(p.created_at, p.platform) for p in posts_data], 
                             columns=['created_at', 'platform'])
            df['created_at'] = pd.to_datetime(df['created_at'])

            # Determine frequency for date_range and resampling
            freq_map = {'hour': 'H', 'day': 'D', 'week': 'W-MON'}
            pandas_freq = freq_map.get(interval.lower(), 'D') # Ensure interval is lowercase

            df = df.set_index('created_at')
            
            # Group by platform then resample and count
            activity_list = []
            if not df.empty:
                 for platform_name, group_df in df.groupby('platform'):
                    # Ensure group_df is not empty before resampling
                    if not group_df.empty:
                        resampled = group_df.resample(pandas_freq).size().rename(platform_name)
                        activity_list.append(resampled)
            
            if not activity_list:
                # Create an empty DataFrame with the expected date range if no activity or no posts
                # Adjust start date to be at the beginning of its period for alignment
                if pandas_freq == 'H':
                    start_dt_aligned = threshold_date.replace(minute=0, second=0, microsecond=0)
                elif pandas_freq == 'D':
                    start_dt_aligned = threshold_date.replace(hour=0, minute=0, second=0, microsecond=0)
                elif pandas_freq == 'W-MON':
                    start_dt_aligned = (threshold_date - timedelta(days=threshold_date.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
                else: # Default to day
                    start_dt_aligned = threshold_date.replace(hour=0, minute=0, second=0, microsecond=0)
                
                idx = pd.date_range(start=start_dt_aligned, end=end_date, freq=pandas_freq)
                activity_df = pd.DataFrame(index=idx) # Renamed to activity_df
            else:
                activity_df = pd.concat(activity_list, axis=1).fillna(0)

            all_platforms_db = session.query(Post.platform).distinct().all()
            platform_names = [p[0] for p in all_platforms_db]

            for p_name in platform_names:
                if p_name not in activity_df.columns:
                    activity_df[p_name] = 0
            
            activity_df = activity_df.sort_index()
            
            result = []
            for date_idx, row in activity_df.iterrows():
                data_point = {'date': date_idx.isoformat()}
                # Ensure to iterate over actual columns present in activity_df
                for platform_col in activity_df.columns: 
                    data_point[platform_col] = int(row[platform_col]) if pd.notna(row[platform_col]) else 0
                result.append(data_point)
            
            return result
    
    def get_engagement_metrics(self, days=7, platform=None):
        """Get engagement metrics over time."""
        with session_scope() as session:
            threshold_date = datetime.utcnow() - timedelta(days=days)
            
            query = session.query(
                func.date(Post.created_at).label('date'), # Group by date part only
                func.avg(Post.likes).label('avg_likes'),
                func.avg(Post.shares).label('avg_shares'),
                func.avg(Post.comments).label('avg_comments'),
                func.count(Post.id).label('post_count')
            ).filter(
                Post.created_at >= threshold_date
            )
            
            if platform:
                query = query.filter(Post.platform == platform)
            
            metrics = query.group_by(
                func.date(Post.created_at) # Ensure grouping by the same date expression
            ).order_by(
                func.date(Post.created_at)
            ).all()
            
            result = []
            for m in metrics:
                result.append({
                    'date': m.date.isoformat() if m.date else None,
                    'avg_likes': float(m.avg_likes or 0),
                    'avg_shares': float(m.avg_shares or 0),
                    'avg_comments': float(m.avg_comments or 0),
                    'post_count': int(m.post_count or 0)
                })
            
            return result
    
    def get_sentiment_distribution(self, days=7, platform=None):
        """Get sentiment distribution."""
        with session_scope() as session:
            threshold_date = datetime.utcnow() - timedelta(days=days)
            
            query = session.query(Post.sentiment_score).filter(
                Post.created_at >= threshold_date,
                Post.sentiment_score.isnot(None) # Use isnot for not None checks
            )
            
            if platform:
                query = query.filter(Post.platform == platform)
            
            sentiments_tuples = query.all() # List of tuples like [(0.5,), (-0.2,)]
            
            if not sentiments_tuples:
                return {'positive': 0, 'neutral': 0, 'negative': 0}
            
            scores = [s[0] for s in sentiments_tuples] # Extract scores

            positive = sum(1 for score in scores if score > 0.05)
            negative = sum(1 for score in scores if score < -0.05)
            neutral = len(scores) - positive - negative
            
            return {
                'positive': positive,
                'neutral': neutral,
                'negative': negative
            }
