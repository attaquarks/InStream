import pandas as pd
# import numpy as np # Not explicitly used
from sqlalchemy import func, desc, or_ # Removed 'and_' as it's not used
from datetime import datetime, timedelta
from collections import Counter
from sqlalchemy import case

from app.models.post import Post, Hashtag, Keyword # Keyword is not directly used here but good for context
from database.db import session_scope
from app.services.processor import DataProcessor


class DataAnalyzer:
    """Class for analyzing social media data and providing insights."""
    
    def __init__(self):
        """Initialize data analyzer."""
        self.processor = DataProcessor()
    
    def get_dashboard_summary(self, days=7):
        """Get summary statistics for the dashboard."""
        with session_scope() as session:
            threshold_date = datetime.utcnow() - timedelta(days=days)
            
            # Get total posts
            total_posts = session.query(func.count(Post.id)).filter(
                Post.created_at >= threshold_date
            ).scalar() or 0
            
            # Get engagement metrics
            engagement = session.query(
                func.sum(Post.likes).label('total_likes'),
                func.sum(Post.shares).label('total_shares')
            ).filter(
                Post.created_at >= threshold_date
            ).first()
            
            # Sentiment distribution
            sentiment_distribution = session.query(
                func.sum(case((Post.sentiment_score < -0.05, 1), else_=0)).label('negative'),
                func.sum(case((Post.sentiment_score >= -0.05, 1), else_=0)).label('neutral'),
                func.sum(case((Post.sentiment_score > 0.05, 1), else_=0)).label('positive')
            ).filter(
                Post.created_at >= threshold_date
            ).first()
            
            # Get platform distribution
            platform_dist = session.query(
                Post.platform,
                func.count(Post.id)
            ).filter(
                Post.created_at >= threshold_date
            ).group_by(
                Post.platform
            ).all()
            
            return {
                'total_posts': total_posts,
                'engagement': {
                    'total_likes': engagement.total_likes or 0,
                    'total_shares': engagement.total_shares or 0
                },
                'sentiment': {
                    'positive': sentiment_distribution.positive or 0,
                    'negative': sentiment_distribution.negative or 0,
                    'neutral': sentiment_distribution.neutral or 0
                },
                'platforms': dict(platform_dist)
            }
    
    def get_trending_topics(self, days=7, limit=10):
        """Get trending topics based on keyword frequency."""
        with session_scope() as session:
            threshold_date = datetime.utcnow() - timedelta(days=days)
            
            keywords = session.query(
                Keyword.text,
                func.sum(Keyword.frequency).label('total_frequency')
            ).join(
                Post, Keyword.post_id == Post.id
            ).filter(
                Post.created_at >= threshold_date
            ).group_by(
                Keyword.text
            ).order_by(
                desc('total_frequency')
            ).limit(limit).all()
            
            return {
                'keywords': [{'text': k.text, 'frequency': int(k.total_frequency)} for k in keywords]
            }
    
    def get_top_posts(self, days=7, metric='engagement', limit=10):
        """Get top posts by specified metric."""
        with session_scope() as session:
            threshold_date = datetime.utcnow() - timedelta(days=days)
            
            query = session.query(Post).filter(
                Post.created_at >= threshold_date
            )
            
            if metric == 'engagement':
                query = query.order_by(desc(Post.likes + Post.shares))
            elif metric == 'sentiment':
                query = query.order_by(desc(Post.sentiment_score))
            elif metric == 'created_at_desc':
                query = query.order_by(desc(Post.created_at))
            
            posts = query.limit(limit).all()
            
            return [{
                'id': post.id,
                'content': post.content,
                'platform': post.platform,
                'created_at': post.created_at.isoformat(),
                'likes': post.likes,
                'shares': post.shares,
                'sentiment_score': post.sentiment_score
            } for post in posts]
    
    def get_time_series_activity(self, days=7, interval='day'):
        """Get post activity over time."""
        with session_scope() as session:
            end_date = datetime.utcnow()
            threshold_date = end_date - timedelta(days=days)
            
            posts = session.query(
                Post.created_at,
                Post.platform
            ).filter(
                Post.created_at >= threshold_date,
                Post.created_at <= end_date
            ).all()
            
            # Group by platform and time interval
            activity_data = {}
            for post in posts:
                platform = post.platform
                if platform not in activity_data:
                    activity_data[platform] = {}
                
                # Format date based on interval
                if interval == 'hour':
                    date_key = post.created_at.strftime('%Y-%m-%d %H:00')
                elif interval == 'day':
                    date_key = post.created_at.strftime('%Y-%m-%d')
                else:  # week
                    date_key = post.created_at.strftime('%Y-%W')
                
                activity_data[platform][date_key] = activity_data[platform].get(date_key, 0) + 1
            
            # Convert to list format
            result = []
            all_dates = sorted(set(
                date for platform_data in activity_data.values()
                for date in platform_data.keys()
            ))
            
            for date in all_dates:
                entry = {'date': date}
                for platform in activity_data:
                    entry[platform] = activity_data[platform].get(date, 0)
                result.append(entry)
            
            return result
    
    def get_time_series_engagement(self, days=7, platform=None):
        """Get engagement metrics over time."""
        with session_scope() as session:
            end_date = datetime.utcnow()
            threshold_date = end_date - timedelta(days=days)
            
            query = session.query(
                Post.created_at,
                func.avg(Post.likes).label('avg_likes'),
                func.avg(Post.shares).label('avg_shares')
            ).filter(
                Post.created_at >= threshold_date,
                Post.created_at <= end_date
            )
            
            if platform:
                query = query.filter(Post.platform == platform)
            
            query = query.group_by(
                func.date(Post.created_at)
            ).order_by(
                func.date(Post.created_at)
            )
            
            results = query.all()
            
            return [{
                'date': result.created_at.strftime('%Y-%m-%d'),
                'avg_likes': float(result.avg_likes or 0),
                'avg_shares': float(result.avg_shares or 0)
            } for result in results]
    
    def get_hashtag_network(self, days=7, limit=20):
        """Get hashtag co-occurrence network."""
        with session_scope() as session:
            threshold_date = datetime.utcnow() - timedelta(days=days)
            
            # Get all hashtags and their posts within the time range
            hashtags = session.query(Hashtag).join(
                Hashtag.posts
            ).filter(
                Post.created_at >= threshold_date
            ).all()
            
            # Build co-occurrence matrix
            co_occurrence = {}
            for hashtag in hashtags:
                for post in hashtag.posts:
                    if post.created_at >= threshold_date:
                        for other_hashtag in post.hashtags:
                            if other_hashtag.id != hashtag.id:
                                key = tuple(sorted([hashtag.text, other_hashtag.text]))
                                co_occurrence[key] = co_occurrence.get(key, 0) + 1
            
            # Convert to list format
            edges = [
                {
                    'source': pair[0],
                    'target': pair[1],
                    'weight': count
                }
                for pair, count in sorted(
                    co_occurrence.items(),
                    key=lambda x: x[1],
                    reverse=True
                )[:limit]
            ]
            
            # Get unique nodes
            nodes = set()
            for edge in edges:
                nodes.add(edge['source'])
                nodes.add(edge['target'])
            
            return {
                'nodes': [{'id': node} for node in nodes],
                'edges': edges
            }

    def search_posts(self, query_string, days=30, limit=50):
        """Search posts by content."""
        with session_scope() as session:
            threshold_date = datetime.utcnow() - timedelta(days=days)
            
            posts = session.query(Post).filter(
                Post.created_at >= threshold_date,
                Post.content.ilike(f'%{query_string}%')
            ).order_by(
                desc(Post.created_at)
            ).limit(limit).all()
            
            return [{
                'id': post.id,
                'content': post.content,
                'platform': post.platform,
                'created_at': post.created_at.isoformat(),
                'likes': post.likes,
                'shares': post.shares,
                'sentiment_score': post.sentiment_score
            } for post in posts]
