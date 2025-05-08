
import pandas as pd
import numpy as np
from sqlalchemy import func, desc, and_, or_
from datetime import datetime, timedelta
from collections import Counter

from app.models.post import Post, Hashtag, Keyword # Assuming models are in app.models
from database.db import session_scope # Assuming db utils are in database.db
from app.services.processor import DataProcessor


class DataAnalyzer:
    """Class for analyzing social media data and providing insights."""
    
    def __init__(self):
        """Initialize data analyzer."""
        self.processor = DataProcessor()
    
    def get_dashboard_summary(self, days=1):
        """Get summary statistics for the dashboard."""
        # Calculate date threshold
        threshold_date = datetime.utcnow() - timedelta(days=days)
        
        with session_scope() as session:
            # Get total post count
            total_posts_query = session.query(func.count(Post.id)).filter(
                Post.created_at >= threshold_date
            )
            total_posts = total_posts_query.scalar() or 0
            
            # Get platform distribution
            platform_counts_query = session.query(
                Post.platform, 
                func.count(Post.id)
            ).filter(
                Post.created_at >= threshold_date
            ).group_by(
                Post.platform
            )
            platform_counts = platform_counts_query.all()
            
            # Get total engagement
            engagement_stats_query = session.query(
                func.sum(Post.likes).label('total_likes'),
                func.sum(Post.shares).label('total_shares'),
                func.sum(Post.comments).label('total_comments'),
                func.avg(Post.likes).label('avg_likes'),
                func.avg(Post.shares).label('avg_shares'),
                func.avg(Post.comments).label('avg_comments')
            ).filter(
                Post.created_at >= threshold_date
            )
            engagement_stats = engagement_stats_query.first()
            
            # Get sentiment distribution
            sentiment_distribution = self.processor.get_sentiment_distribution(days)
            
            # Prepare summary
            summary = {
                'time_period': f"{days} day(s)",
                'total_posts': total_posts,
                'platforms': {p: count for p, count in platform_counts},
                'engagement': {
                    'total_likes': int(engagement_stats.total_likes or 0) if engagement_stats else 0,
                    'total_shares': int(engagement_stats.total_shares or 0) if engagement_stats else 0,
                    'total_comments': int(engagement_stats.total_comments or 0) if engagement_stats else 0,
                    'avg_likes': float(engagement_stats.avg_likes or 0) if engagement_stats else 0.0,
                    'avg_shares': float(engagement_stats.avg_shares or 0) if engagement_stats else 0.0,
                    'avg_comments': float(engagement_stats.avg_comments or 0) if engagement_stats else 0.0
                },
                'sentiment': sentiment_distribution
            }
            
            return summary
    
    def get_trending_topics(self, days=1, limit=10):
        """Get trending topics based on hashtags and keywords."""
        # Get trending hashtags
        trending_hashtags = self.processor.get_trending_hashtags(days, limit)
        
        # Get trending keywords
        trending_keywords = self.processor.get_trending_keywords(days, limit)
        
        # Combine results
        return {
            'hashtags': trending_hashtags,
            'keywords': trending_keywords
        }
    
    def get_top_posts(self, days=1, metric='engagement', limit=10):
        """Get top posts by specified metric."""
        # Calculate date threshold
        threshold_date = datetime.utcnow() - timedelta(days=days)
        
        with session_scope() as session:
            # Define ordering based on metric
            if metric == 'likes':
                order_clause = desc(Post.likes)
            elif metric == 'shares':
                order_clause = desc(Post.shares)
            elif metric == 'comments':
                order_clause = desc(Post.comments)
            elif metric == 'engagement':
                # Engagement is the sum of likes, shares, and comments
                order_clause = desc(Post.likes + Post.shares + Post.comments)
            elif metric == 'sentiment_positive':
                order_clause = desc(Post.sentiment_score)
            elif metric == 'sentiment_negative':
                order_clause = Post.sentiment_score # Ascending for most negative
            else: # Default to engagement
                order_clause = desc(Post.likes + Post.shares + Post.comments)
            
            # Query top posts
            posts_query = session.query(Post).filter(
                Post.created_at >= threshold_date
            ).order_by(
                order_clause
            ).limit(limit)
            
            posts = posts_query.all()
            
            # Convert to dictionaries
            result = [post.to_dict() for post in posts]
            
            # Add calculated engagement score if metric is engagement or default
            if metric == 'engagement' or metric not in ['likes', 'shares', 'comments', 'sentiment_positive', 'sentiment_negative']:
                for post_dict in result:
                    post_dict['engagement_score'] = (
                        (post_dict['likes'] or 0) + 
                        (post_dict['shares'] or 0) + 
                        (post_dict['comments'] or 0)
                    )
            
            return result
    
    def get_time_series_activity(self, days=7, interval='day'):
        """Get time series of post activity."""
        return self.processor.get_post_activity(days, interval)
    
    def get_time_series_engagement(self, days=7, platform=None):
        """Get time series of engagement metrics."""
        return self.processor.get_engagement_metrics(days, platform)
    
    def get_hashtag_network(self, days=7, limit=20):
        """Get hashtag co-occurrence network."""
        # Calculate date threshold
        threshold_date = datetime.utcnow() - timedelta(days=days)
        
        with session_scope() as session:
            # Get all posts with their hashtags
            # Using array_agg might be PostgreSQL specific.
            # For a more general solution, one might fetch posts and their related hashtags separately
            # or use a subquery if the ORM supports it easily.
            # For now, assuming array_agg works or the DB supports it.
            # If not, this part needs to be refactored to iterate through posts and collect hashtags.
            
            # Alternative way to get posts and their hashtags to avoid DB specific functions
            posts_with_hashtags_query = session.query(Post).join(Post.hashtags).filter(
                Post.created_at >= threshold_date
            ).options(
                # Eager load hashtags to avoid N+1 queries if iterating later
                # For SQLAlchemy 1.4+, use selectinload
                # from sqlalchemy.orm import selectinload
                # .options(selectinload(Post.hashtags))
            )
            
            all_posts = posts_with_hashtags_query.all()

            co_occurrences = {}
            hashtag_counts = Counter()
            
            for post in all_posts:
                hashtags_for_post = [h.text for h in post.hashtags]
                if not hashtags_for_post:
                    continue

                hashtag_counts.update(hashtags_for_post)
                
                # Create pairs of hashtags
                for i in range(len(hashtags_for_post)):
                    for j in range(i + 1, len(hashtags_for_post)):
                        pair = tuple(sorted([hashtags_for_post[i], hashtags_for_post[j]]))
                        co_occurrences[pair] = co_occurrences.get(pair, 0) + 1
            
            if not hashtag_counts: # No hashtags found
                return {'nodes': [], 'links': []}

            # Get top hashtags
            top_hashtags = [h for h, _ in hashtag_counts.most_common(limit)]
            
            # Filter co-occurrences to include only top hashtags
            filtered_co_occurrences = {
                pair: count for pair, count in co_occurrences.items()
                if pair[0] in top_hashtags and pair[1] in top_hashtags and pair[0] != pair[1]
            }
            
            # Prepare nodes and links for network visualization
            nodes = [{'id': h, 'count': hashtag_counts[h]} for h in top_hashtags]
            links = [{'source': p[0], 'target': p[1], 'value': c} 
                    for p, c in filtered_co_occurrences.items()]
            
            return {
                'nodes': nodes,
                'links': links
            }

    def search_posts(self, query_string, days=30, limit=50): # Renamed query to query_string
        """Search posts by content."""
        # Calculate date threshold
        threshold_date = datetime.utcnow() - timedelta(days=days)
        
        with session_scope() as session:
            # Prepare search terms
            search_terms = query_string.split()
            conditions = []
            
            for term in search_terms:
                conditions.append(Post.content.ilike(f'%{term}%')) # Use ilike for case-insensitive
            
            if not conditions: # If query_string is empty or only spaces
                posts_query = session.query(Post).filter(
                    Post.created_at >= threshold_date
                )
            else:
                posts_query = session.query(Post).filter(
                    Post.created_at >= threshold_date,
                    or_(*conditions) # Use or_ for multiple terms, or and_ if all terms must match
                )
            
            # Execute search query
            posts = posts_query.order_by(
                desc(Post.created_at)
            ).limit(limit).all()
            
            # Convert to list of dictionaries
            result = [post.to_dict() for post in posts]
            
            return result

