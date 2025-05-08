
import pandas as pd
# import numpy as np # Not explicitly used
from sqlalchemy import func, desc, or_ # Removed 'and_' as it's not used
from datetime import datetime, timedelta
from collections import Counter

from app.models.post import Post, Hashtag, Keyword # Keyword is not directly used here but good for context
from database.db import session_scope
from app.services.processor import DataProcessor


class DataAnalyzer:
    """Class for analyzing social media data and providing insights."""
    
    def __init__(self):
        """Initialize data analyzer."""
        self.processor = DataProcessor()
    
    def get_dashboard_summary(self, days=1):
        """Get summary statistics for the dashboard."""
        threshold_date = datetime.utcnow() - timedelta(days=days)
        
        with session_scope() as session:
            total_posts = session.query(func.count(Post.id)).filter(
                Post.created_at >= threshold_date
            ).scalar() or 0 # Ensure 0 if None
            
            platform_counts_query = session.query(
                Post.platform, 
                func.count(Post.id)
            ).filter(
                Post.created_at >= threshold_date
            ).group_by(
                Post.platform
            ).all()
            
            engagement_stats = session.query(
                func.sum(Post.likes).label('total_likes'),
                func.sum(Post.shares).label('total_shares'),
                func.sum(Post.comments).label('total_comments'),
                func.avg(Post.likes).label('avg_likes'),
                func.avg(Post.shares).label('avg_shares'),
                func.avg(Post.comments).label('avg_comments')
            ).filter(
                Post.created_at >= threshold_date
            ).first()
            
            sentiment_distribution = self.processor.get_sentiment_distribution(days)
            
            summary = {
                'time_period': f"{days} day(s)",
                'total_posts': total_posts,
                'platforms': {p: count for p, count in platform_counts_query},
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
        trending_hashtags = self.processor.get_trending_hashtags(days, limit)
        trending_keywords = self.processor.get_trending_keywords(days, limit)
        
        return {
            'hashtags': trending_hashtags,
            'keywords': trending_keywords
        }
    
    def get_top_posts(self, days=1, metric='engagement', limit=10):
        """Get top posts by specified metric."""
        threshold_date = datetime.utcnow() - timedelta(days=days)
        
        with session_scope() as session:
            order_clause = None
            if metric == 'likes':
                order_clause = desc(Post.likes)
            elif metric == 'shares':
                order_clause = desc(Post.shares)
            elif metric == 'comments':
                order_clause = desc(Post.comments)
            elif metric == 'engagement':
                order_clause = desc(Post.likes + Post.shares + Post.comments)
            elif metric == 'sentiment_positive':
                order_clause = desc(Post.sentiment_score)
            elif metric == 'sentiment_negative':
                order_clause = Post.sentiment_score # Ascending for most negative
            else: # Default to engagement
                order_clause = desc(Post.likes + Post.shares + Post.comments)
            
            posts_query = session.query(Post).filter(
                Post.created_at >= threshold_date
            )
            if order_clause is not None: # Apply order if defined
                posts_query = posts_query.order_by(order_clause)

            posts = posts_query.limit(limit).all()
            
            result = [post.to_dict() for post in posts]
            
            # Add calculated engagement score if metric is engagement or default
            if metric == 'engagement' or metric not in ['likes', 'shares', 'comments', 'sentiment_positive', 'sentiment_negative']:
                for post_dict in result:
                    post_dict['engagement_score'] = (
                        (post_dict.get('likes',0) or 0) + 
                        (post_dict.get('shares',0) or 0) + 
                        (post_dict.get('comments',0) or 0)
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
        threshold_date = datetime.utcnow() - timedelta(days=days)
        
        with session_scope() as session:
            # Using SQLAlchemy relationship to get posts and their hashtags
            posts_with_hashtags_query = session.query(Post).join(Post.hashtags).filter(
                Post.created_at >= threshold_date
            ).options(
                # from sqlalchemy.orm import selectinload # if needed for optimization
                # selectinload(Post.hashtags)
            ).distinct() # Ensure each post is processed once if multiple hashtags link it in join

            all_posts = posts_with_hashtags_query.all()

            co_occurrences = {}
            hashtag_counts = Counter()
            
            for post in all_posts:
                # Extract hashtag texts from the Hashtag objects associated with the post
                current_post_hashtags = [h.text for h in post.hashtags]
                if not current_post_hashtags:
                    continue

                hashtag_counts.update(current_post_hashtags)
                
                # Create unique pairs of hashtags for this post
                # Use a set to avoid duplicate pairs within the same post if a hashtag appears multiple times (though usually not the case)
                unique_hashtags_for_post = sorted(list(set(current_post_hashtags)))

                for i in range(len(unique_hashtags_for_post)):
                    for j in range(i + 1, len(unique_hashtags_for_post)):
                        # Ensure pair elements are sorted for consistent keying
                        pair = tuple(sorted([unique_hashtags_for_post[i], unique_hashtags_for_post[j]]))
                        co_occurrences[pair] = co_occurrences.get(pair, 0) + 1
            
            if not hashtag_counts:
                return {'nodes': [], 'links': []}

            top_hashtags_list = [h_text for h_text, _ in hashtag_counts.most_common(limit)]
            
            filtered_co_occurrences = {
                pair: count for pair, count in co_occurrences.items()
                if pair[0] in top_hashtags_list and pair[1] in top_hashtags_list and pair[0] != pair[1]
            }
            
            nodes = [{'id': h_text, 'count': hashtag_counts[h_text]} for h_text in top_hashtags_list]
            links = [{'source': p[0], 'target': p[1], 'value': c} 
                    for p, c in filtered_co_occurrences.items()]
            
            return {
                'nodes': nodes,
                'links': links
            }

    def search_posts(self, query_string, days=30, limit=50): # Renamed 'query' to 'query_string' for clarity
        """Search posts by content."""
        threshold_date = datetime.utcnow() - timedelta(days=days)
        
        with session_scope() as session:
            search_terms = query_string.split()
            conditions = []
            
            for term in search_terms:
                if term: # Ensure term is not empty
                    conditions.append(Post.content.ilike(f'%{term}%')) # Case-insensitive search
            
            posts_query = session.query(Post).filter(
                Post.created_at >= threshold_date
            )

            if conditions: # Apply search conditions if any
                posts_query = posts_query.filter(or_(*conditions))
            
            posts = posts_query.order_by(
                desc(Post.created_at) # Order by most recent
            ).limit(limit).all()
            
            result = [post.to_dict() for post in posts]
            
            return result
