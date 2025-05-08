from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Table
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
    content = Column(String)
    platform = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    likes = Column(Integer, default=0)
    shares = Column(Integer, default=0)
    sentiment_score = Column(Float, nullable=True)

    # Relationships
    keywords = relationship("Keyword", back_populates="post")
    hashtags = relationship("Hashtag", secondary=post_hashtag, back_populates="posts")

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