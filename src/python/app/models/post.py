from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Table, Text
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

# Association table for many-to-many relationship between posts and hashtags
post_hashtag = Table('post_hashtag', Base.metadata,
    Column('post_id', Integer, ForeignKey('posts.id')),
    Column('hashtag_id', Integer, ForeignKey('hashtags.id'))
)

class Post(Base):
    __tablename__ = 'posts'

    id = Column(Integer, primary_key=True)
    content = Column(Text)
    platform = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
    likes = Column(Integer, default=0)
    shares = Column(Integer, default=0)
    sentiment_score = Column(Float, nullable=True)
    source_url = Column(String(500), nullable=True)
    author = Column(String(200), nullable=True)
    engagement_score = Column(Float, nullable=True)

    # Relationships
    keywords = relationship("Keyword", back_populates="post")
    hashtags = relationship("Hashtag", secondary=post_hashtag, back_populates="posts")

    def to_dict(self):
        """Convert post to dictionary for API responses."""
        return {
            'id': self.id,
            'content': self.content,
            'platform': self.platform,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'likes': self.likes,
            'shares': self.shares,
            'sentiment_score': self.sentiment_score,
            'source_url': self.source_url,
            'author': self.author,
            'engagement_score': self.engagement_score
        }

class Keyword(Base):
    __tablename__ = 'keywords'

    id = Column(Integer, primary_key=True)
    post_id = Column(Integer, ForeignKey('posts.id'))
    text = Column(String)
    frequency = Column(Integer)

    # Relationship
    post = relationship("Post", back_populates="keywords")

class Hashtag(Base):
    __tablename__ = 'hashtags'

    id = Column(Integer, primary_key=True)
    text = Column(String, unique=True)

    # Relationship
    posts = relationship("Post", secondary=post_hashtag, back_populates="hashtags") 