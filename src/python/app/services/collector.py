import requests
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import os
import logging
import time
import random
from contextlib import contextmanager
from bs4 import BeautifulSoup
import json
import re
from urllib.parse import quote_plus

# Selenium imports
from selenium import webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.edge.options import Options as EdgeOptions
from selenium.webdriver.edge.service import Service as EdgeService
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import (
    TimeoutException, 
    NoSuchElementException, 
    WebDriverException,
    StaleElementReferenceException
)

# Try to import webdriver-manager packages
try:
    from webdriver_manager.chrome import ChromeDriverManager
    from webdriver_manager.microsoft import EdgeChromiumDriverManager
    WEBDRIVER_MANAGER_AVAILABLE = True
except ImportError:
    WEBDRIVER_MANAGER_AVAILABLE = False
    print("webdriver-manager not installed. Will use system drivers if available.")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Rate limiting and general configuration
RATE_LIMIT_DELAY = 2  # seconds between requests
MAX_RETRIES = 3  # maximum number of retries for failed requests
SCROLL_PAUSE_TIME = 2  # seconds to wait between scrolls
DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
DEFAULT_HEADERS = {
    'User-Agent': DEFAULT_USER_AGENT,
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'DNT': '1',  # Do Not Track Request Header
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
}

class RateLimiter:
    """Simple rate limiter to avoid being blocked."""
    def __init__(self, delay: float = RATE_LIMIT_DELAY):
        self.delay = delay
        self.last_request = 0

    def wait(self):
        """Wait if necessary to respect rate limits."""
        current_time = time.time()
        time_since_last = current_time - self.last_request
        if time_since_last < self.delay:
            time.sleep(self.delay - time_since_last)
        self.last_request = time.time()

class DataCollector:
    """Class for collecting social media data from various platforms using web scraping."""
    
    def __init__(self):
        """Initialize data collector."""
        self.driver = None
        self.rate_limiter = RateLimiter()
        self.session = requests.Session()
        self.session.headers.update(DEFAULT_HEADERS)
        
        try:
            self._initialize_webdriver()
            logger.info("Successfully initialized DataCollector")
        except Exception as e:
            logger.error(f"Failed to initialize DataCollector: {str(e)}")
            self.cleanup()
            raise

    def _initialize_webdriver(self):
        """Initialize the WebDriver, trying Edge first, then Chrome as fallback."""
        # Try Edge first
        try:
            logger.info("Attempting to initialize Edge WebDriver...")
            
            edge_options = EdgeOptions()
            edge_options.add_argument("--headless=new")
            edge_options.add_argument("--no-sandbox")
            edge_options.add_argument("--disable-dev-shm-usage")
            edge_options.add_argument("--disable-gpu")
            edge_options.add_argument("--window-size=1920,1080")
            edge_options.add_argument(f"user-agent={DEFAULT_USER_AGENT}")
            edge_options.add_experimental_option("excludeSwitches", ["enable-automation"])
            edge_options.add_experimental_option('useAutomationExtension', False)
            edge_options.add_argument("--disable-blink-features=AutomationControlled")
            
            if WEBDRIVER_MANAGER_AVAILABLE:
                try:
                    # Initialize Edge WebDriver using webdriver-manager
                    service = EdgeService(EdgeChromiumDriverManager().install())
                    self.driver = webdriver.Edge(service=service, options=edge_options)
                except Exception as e:
                    logger.warning(f"Failed to use webdriver-manager for Edge: {str(e)}")
                    # Fallback to system Edge driver
                    self.driver = webdriver.Edge(options=edge_options)
            else:
                # Try to use system Edge driver
                self.driver = webdriver.Edge(options=edge_options)
                
            logger.info("Successfully initialized Edge WebDriver")
            return
            
        except Exception as e:
            logger.error(f"Failed to initialize Edge WebDriver: {str(e)}")
            
            # Try Chrome as fallback
            try:
                logger.info("Attempting to use Chrome as fallback...")
                
                chrome_options = ChromeOptions()
                chrome_options.add_argument("--headless=new")
                chrome_options.add_argument("--no-sandbox")
                chrome_options.add_argument("--disable-dev-shm-usage")
                chrome_options.add_argument("--disable-gpu")
                chrome_options.add_argument("--window-size=1920,1080")
                chrome_options.add_argument(f"user-agent={DEFAULT_USER_AGENT}")
                chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
                chrome_options.add_experimental_option('useAutomationExtension', False)
                chrome_options.add_argument("--disable-blink-features=AutomationControlled")
                
                if WEBDRIVER_MANAGER_AVAILABLE:
                    try:
                        # Initialize Chrome WebDriver using webdriver-manager
                        service = ChromeService(ChromeDriverManager().install())
                        self.driver = webdriver.Chrome(service=service, options=chrome_options)
                    except Exception as e:
                        logger.warning(f"Failed to use webdriver-manager for Chrome: {str(e)}")
                        # Fallback to system Chrome driver
                        self.driver = webdriver.Chrome(options=chrome_options)
                else:
                    # Try to use system Chrome driver
                    self.driver = webdriver.Chrome(options=chrome_options)
                    
                logger.info("Successfully initialized Chrome WebDriver")
                return
                
            except Exception as chrome_error:
                logger.error(f"Failed to initialize Chrome WebDriver: {str(chrome_error)}")
                raise Exception("Failed to initialize any WebDriver. Please ensure Edge or Chrome is installed and up to date.")

    @contextmanager
    def safe_web_session(self):
        """Context manager for safe web scraping sessions."""
        try:
            yield
        except WebDriverException as e:
            logger.error(f"WebDriver error: {str(e)}")
            self.cleanup()
            self._initialize_webdriver()
        except Exception as e:
            logger.error(f"Unexpected error during web session: {str(e)}")
            raise

    def safe_web_request(self, url: str, max_retries: int = MAX_RETRIES) -> bool:
        """Safely make a web request with retries and rate limiting."""
        for attempt in range(max_retries):
            try:
                self.rate_limiter.wait()
                self.driver.get(url)
                # Add random wait to make behavior more human-like
                time.sleep(random.uniform(1.5, 3.5))
                return True
            except WebDriverException as e:
                logger.warning(f"Web request failed (attempt {attempt + 1}/{max_retries}): {str(e)}")
                if attempt == max_retries - 1:
                    logger.error(f"Failed to access {url} after {max_retries} attempts")
                    return False
                time.sleep(random.uniform(1, 3))
        return False

    def safe_scroll(self, scroll_count: int = 3):
        """Safely scroll the page with error handling."""
        for i in range(scroll_count):
            try:
                # Random scroll amount to mimic human behavior
                scroll_amount = random.randint(300, 700)
                self.driver.execute_script(f"window.scrollBy(0, {scroll_amount});")
                time.sleep(random.uniform(0.5, 1.5))
                
                # Every few scrolls, do a larger scroll
                if i % 3 == 2:
                    self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight * 0.7);")
                    time.sleep(SCROLL_PAUSE_TIME)
            except WebDriverException as e:
                logger.warning(f"Scroll failed: {str(e)}")
                break

    def safe_find_element(self, element, selector: str, timeout: int = 10) -> Optional[Any]:
        """Safely find an element with timeout and error handling."""
        try:
            return WebDriverWait(element, timeout).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, selector))
            )
        except (TimeoutException, NoSuchElementException) as e:
            logger.warning(f"Element not found with selector {selector}: {str(e)}")
            return None

    def safe_find_elements(self, element, selector: str, timeout: int = 10) -> List[Any]:
        """Safely find multiple elements with timeout and error handling."""
        try:
            WebDriverWait(element, timeout).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, selector))
            )
            return element.find_elements(By.CSS_SELECTOR, selector)
        except (TimeoutException, NoSuchElementException) as e:
            logger.warning(f"Elements not found with selector {selector}: {str(e)}")
            return []

    def cleanup(self):
        """Clean up resources."""
        if self.driver:
            try:
                self.driver.quit()
            except Exception as e:
                logger.error(f"Error closing WebDriver: {str(e)}")
            finally:
                self.driver = None

    def __del__(self):
        """Cleanup when the object is destroyed."""
        self.cleanup()
        
    def _convert_metric(self, value: str) -> int:
        """Convert social media metric string to integer."""
        if not value or value.strip() == '':
            return 0
            
        # Handle various formats like "1.2K", "5M", etc.
        value = value.lower().strip()
        multiplier = 1
        
        if 'k' in value:
            multiplier = 1000
            value = value.replace('k', '')
        elif 'm' in value:
            multiplier = 1000000
            value = value.replace('m', '')
            
        try:
            # Clean up and convert to float first, then to int
            clean_value = re.sub(r'[^\d.]', '', value)
            if clean_value:
                return int(float(clean_value) * multiplier)
            return 0
        except ValueError:
            return 0
            
    def _extract_date(self, date_str: str) -> datetime:
        """Extract date from various format strings."""
        try:
            # Handle common formats
            now = datetime.now()
            date_str = date_str.lower().strip()
            
            # Handle relative time formats
            if 'just now' in date_str or 'seconds ago' in date_str:
                return now
            elif 'minute ago' in date_str or 'minutes ago' in date_str:
                minutes = int(re.search(r'(\d+)', date_str).group(1)) if re.search(r'(\d+)', date_str) else 1
                return now - timedelta(minutes=minutes)
            elif 'hour ago' in date_str or 'hours ago' in date_str:
                hours = int(re.search(r'(\d+)', date_str).group(1)) if re.search(r'(\d+)', date_str) else 1
                return now - timedelta(hours=hours)
            elif 'day ago' in date_str or 'days ago' in date_str:
                days = int(re.search(r'(\d+)', date_str).group(1)) if re.search(r'(\d+)', date_str) else 1
                return now - timedelta(days=days)
            elif 'yesterday' in date_str:
                return now - timedelta(days=1)
            
            # Try to parse standard date formats
            for fmt in [
                '%b %d, %Y',     # Jan 01, 2025
                '%d %b %Y',      # 01 Jan 2025
                '%Y-%m-%d',      # 2025-01-01
                '%d/%m/%Y',      # 01/01/2025
                '%m/%d/%Y',      # 01/01/2025
                '%d-%m-%Y',      # 01-01-2025
                '%Y/%m/%d',      # 2025/01/01
            ]:
                try:
                    return datetime.strptime(date_str, fmt)
                except ValueError:
                    continue
                    
            # Default: use current time
            return now
        except Exception as e:
            logger.warning(f"Failed to parse date '{date_str}': {str(e)}")
            return datetime.now()

    def collect_twitter_data(self, keyword: str, days: int = 7, max_posts: int = 20) -> List[Dict[str, Any]]:
        """Collect tweets using Nitter, a Twitter frontend that's easier to scrape."""
        if not self.driver:
            logger.error("WebDriver not initialized. Skipping Twitter data collection.")
            return []

        with self.safe_web_session():
            tweets = []
            instances = [
                "https://nitter.net", 
                "https://nitter.cz",
                "https://nitter.hu",
                "https://nitter.1d4.us"
            ]
            
            # Try different Nitter instances
            for instance in instances:
                try:
                    search_url = f"{instance}/search?f=tweets&q={quote_plus(keyword)}&since={days}d"
                    logger.info(f"Trying to access Twitter data via {instance}")
                    
                    if not self.safe_web_request(search_url):
                        continue
                        
                    # Let the page load
                    time.sleep(3)
                    
                    # Check if page loaded correctly
                    if "nitter" not in self.driver.title.lower() and "twitter" not in self.driver.title.lower():
                        logger.warning(f"Failed to load proper page from {instance}")
                        continue
                        
                    # Scroll to load more tweets
                    self.safe_scroll(scroll_count=5)
                    
                    # Try to find tweet elements with different selectors
                    tweet_selectors = [
                        ".timeline-item", 
                        ".tweet-card",
                        ".tweet"
                    ]
                    
                    elements = []
                    for selector in tweet_selectors:
                        elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                        if elements:
                            logger.info(f"Found {len(elements)} tweets with selector {selector}")
                            break
                    
                    if not elements:
                        logger.warning(f"No tweets found on {instance}")
                        continue
                        
                    collected = 0
                    for element in elements[:max_posts]:
                        try:
                            # Extract tweet content
                            content_element = None
                            for content_selector in [".tweet-content", ".timeline-content", ".content"]:
                                try:
                                    content_element = element.find_element(By.CSS_SELECTOR, content_selector)
                                    break
                                except NoSuchElementException:
                                    continue
                                    
                            if not content_element:
                                continue
                                
                            content = content_element.text
                            if not content or keyword.lower() not in content.lower():
                                continue
                                
                            # Extract metrics
                            stats = {}
                            try:
                                # Look for likes/retweets
                                stats_elements = element.find_elements(By.CSS_SELECTOR, ".tweet-stats .icon-container")
                                if stats_elements and len(stats_elements) >= 3:
                                    stats = {
                                        'replies': self._convert_metric(stats_elements[0].text),
                                        'retweets': self._convert_metric(stats_elements[1].text),
                                        'likes': self._convert_metric(stats_elements[2].text)
                                    }
                            except Exception as e:
                                stats = {'replies': 0, 'retweets': 0, 'likes': 0}
                                logger.debug(f"Error extracting tweet stats: {str(e)}")
                                
                            # Extract date if available
                            date = datetime.now()
                            try:
                                date_element = element.find_element(By.CSS_SELECTOR, ".tweet-date a")
                                date_text = date_element.get_attribute("title") or date_element.text
                                if date_text:
                                    date = self._extract_date(date_text)
                            except:
                                pass
                                
                            tweets.append({
                                'content': content,
                                'platform': 'Twitter',
                                'created_at': date,
                                'likes': stats.get('likes', 0),
                                'shares': stats.get('retweets', 0),
                                'sentiment_score': 0.0
                            })
                            collected += 1
                            
                        except Exception as e:
                            logger.debug(f"Error processing tweet: {str(e)}")
                            continue
                            
                    logger.info(f"Successfully collected {collected} tweets from {instance}")
                    if tweets:
                        return tweets  # If we got tweets, no need to try other instances
                        
                except Exception as e:
                    logger.warning(f"Error collecting Twitter data from {instance}: {str(e)}")
                    continue
                    
            # If we get here, we didn't succeed with any Nitter instance
            if not tweets:
                logger.warning("Failed to collect Twitter data from all instances")
                
            return tweets

    def collect_reddit_data(self, keyword: str, days: int = 7, max_posts: int = 20) -> List[Dict[str, Any]]:
        """Collect Reddit posts using web scraping via the Teddit frontend."""
        if not self.driver:
            logger.error("WebDriver not initialized. Skipping Reddit data collection.")
            return []

        with self.safe_web_session():
            posts = []
            
            # Try different instances
            instances = [
                "https://teddit.net",
                "https://teddit.ggc-project.de",
                "https://teddit.zaggy.nl"
            ]
            
            # Subreddits to search in
            subreddits = ['technology', 'programming', 'artificial', 'MachineLearning', 'all']
            
            for instance in instances:
                if len(posts) >= max_posts:
                    break
                    
                for subreddit in subreddits:
                    if len(posts) >= max_posts:
                        break
                        
                    try:
                        search_url = f"{instance}/r/{subreddit}/search?q={quote_plus(keyword)}"
                        logger.info(f"Trying to access Reddit data via {instance} for r/{subreddit}")
                        
                        if not self.safe_web_request(search_url):
                            continue
                            
                        # Check if page loaded correctly
                        if "teddit" not in self.driver.title.lower() and "reddit" not in self.driver.title.lower():
                            logger.warning(f"Failed to load proper page from {instance}")
                            continue
                            
                        # Scroll to load more content
                        self.safe_scroll(scroll_count=3)
                        
                        # Find post elements
                        elements = self.driver.find_elements(By.CSS_SELECTOR, ".post")
                        
                        if not elements:
                            logger.warning(f"No Reddit posts found on {instance} for r/{subreddit}")
                            continue
                            
                        for element in elements:
                            try:
                                # Extract post title
                                title_element = element.find_element(By.CSS_SELECTOR, ".post-title")
                                title = title_element.text
                                
                                # Extract post info if available
                                content = ""
                                try:
                                    content_link = title_element.get_attribute('href')
                                    if content_link:
                                        # We could visit the link to get the full content, but this would slow down scraping.
                                        # For now, just use the title.
                                        pass
                                except:
                                    pass
                                    
                                # Extract upvotes
                                upvotes = 0
                                try:
                                    upvotes_element = element.find_element(By.CSS_SELECTOR, ".score")
                                    upvotes = self._convert_metric(upvotes_element.text)
                                except:
                                    pass
                                    
                                # Extract comments count
                                comments = 0
                                try:
                                    comments_element = element.find_element(By.CSS_SELECTOR, ".comments-link")
                                    comments_text = comments_element.text
                                    if "comment" in comments_text.lower():
                                        comments = self._convert_metric(re.sub(r'[^\d]', '', comments_text))
                                except:
                                    pass
                                    
                                # Extract date
                                date = datetime.now() - timedelta(days=random.randint(0, days))
                                try:
                                    date_element = element.find_element(By.CSS_SELECTOR, ".date")
                                    date = self._extract_date(date_element.text)
                                except:
                                    pass
                                    
                                # Check if the keyword is in the title or content
                                if keyword.lower() in title.lower() or keyword.lower() in content.lower():
                                    posts.append({
                                        'content': f"{title}\n{content}",
                                        'platform': 'Reddit',
                                        'created_at': date,
                                        'likes': upvotes,
                                        'shares': comments,
                                        'sentiment_score': 0.0
                                    })
                                    
                                    if len(posts) >= max_posts:
                                        break
                                        
                            except Exception as e:
                                logger.debug(f"Error processing Reddit post: {str(e)}")
                                continue
                                
                    except Exception as e:
                        logger.warning(f"Error collecting Reddit data from {instance} for r/{subreddit}: {str(e)}")
                        continue
                        
            return posts

    def collect_news_data(self, keyword: str, days: int = 7, max_articles: int = 20) -> List[Dict[str, Any]]:
        """Collect news articles using web scraping from multiple news aggregators."""
        if not self.driver:
            logger.error("WebDriver not initialized. Skipping news data collection.")
            return []

        articles = []
        
        # List of news aggregators to try
        sources = [
            {
                'name': 'Google News',
                'url': f'https://news.google.com/search?q={quote_plus(keyword)}&hl=en-US',
                'article_selector': '.IBr9hb',
                'title_selector': '.gPFEn',
                'source_selector': '.vr1PYe',
                'time_selector': '.hvbAAd'
            },
            {
                'name': 'AllSides',
                'url': f'https://www.allsides.com/story/{quote_plus(keyword)}',
                'article_selector': '.story-item',
                'title_selector': '.story-title',
                'source_selector': '.source-name',
                'time_selector': '.story-date'
            },
            {
                'name': 'NewsNow',
                'url': f'https://www.newsnow.co.uk/h/{quote_plus(keyword)}',
                'article_selector': '.newsnow-article',
                'title_selector': '.newsnow-title',
                'source_selector': '.newsnow-source',
                'time_selector': '.newsnow-time'
            }
        ]
        
        with self.safe_web_session():
            for source in sources:
                if len(articles) >= max_articles:
                    break
                    
                try:
                    logger.info(f"Trying to access news from {source['name']}")
                    if not self.safe_web_request(source['url']):
                        continue
                        
                    # Scroll to load more content
                    self.safe_scroll(scroll_count=3)
                    
                    # Find article elements
                    elements = self.driver.find_elements(By.CSS_SELECTOR, source['article_selector'])
                    
                    if not elements:
                        logger.warning(f"No articles found on {source['name']}")
                        continue
                        
                    for element in elements:
                        try:
                            # Extract title
                            title = ""
                            try:
                                title_element = element.find_element(By.CSS_SELECTOR, source['title_selector'])
                                title = title_element.text
                            except:
                                continue  # Skip if no title
                                
                            # Skip if keyword not in title
                            if keyword.lower() not in title.lower():
                                continue
                                
                            # Extract source if available
                            source_name = source['name']
                            try:
                                source_element = element.find_element(By.CSS_SELECTOR, source['source_selector'])
                                source_name = source_element.text
                            except:
                                pass
                                
                            # Extract date if available
                            date = datetime.now() - timedelta(days=random.randint(0, days))
                            try:
                                date_element = element.find_element(By.CSS_SELECTOR, source['time_selector'])
                                date = self._extract_date(date_element.text)
                            except:
                                pass
                                
                            articles.append({
                                'content': title,
                                'platform': f"News ({source_name})",
                                'created_at': date,
                                'likes': 0,
                                'shares': 0,
                                'sentiment_score': 0.0
                            })
                            
                            if len(articles) >= max_articles:
                                break
                                
                        except Exception as e:
                            logger.debug(f"Error processing article from {source['name']}: {str(e)}")
                            continue
                            
                except Exception as e:
                    logger.warning(f"Error collecting news data from {source['name']}: {str(e)}")
                    continue
                    
        return articles

    def collect_all_data(self, keyword: str, sources: List[str], days: int = 7, max_per_source: int = 20) -> List[Dict[str, Any]]:
        """Collect data from all specified sources."""
        all_data = []
        
        # Collect Twitter data
        if 'twitter' in sources or 'all' in sources:
            try:
                logger.info(f"Starting Twitter data collection for keyword: {keyword}")
                twitter_data = self.collect_twitter_data(keyword, days, max_per_source)
                all_data.extend(twitter_data)
                logger.info(f"Collected {len(twitter_data)} Twitter posts")
            except Exception as e:
                logger.error(f"Twitter collection failed: {str(e)}", exc_info=True)
        
        # Collect Reddit data
        if 'reddit' in sources or 'all' in sources:
            try:
                logger.info(f"Starting Reddit data collection for keyword: {keyword}")
                reddit_data = self.collect_reddit_data(keyword, days, max_per_source)
                all_data.extend(reddit_data)
                logger.info(f"Collected {len(reddit_data)} Reddit posts")
            except Exception as e:
                logger.error(f"Reddit collection failed: {str(e)}", exc_info=True)
        
        # Collect News data
        if 'news' in sources or 'all' in sources:
            try:
                logger.info(f"Starting News data collection for keyword: {keyword}")
                news_data = self.collect_news_data(keyword, days, max_per_source)
                all_data.extend(news_data)
                logger.info(f"Collected {len(news_data)} News articles")
            except Exception as e:
                logger.error(f"News collection failed: {str(e)}", exc_info=True)
        
        logger.info(f"Total data collected: {len(all_data)} items")
        return all_data
    
    def save_to_database(self, data: List[Dict[str, Any]], db_session) -> None:
        """Save collected data to the database."""
        from app.models.post import Post  # Import here to avoid circular imports
        
        if not data:
            logger.warning("No data to save to database")
            return
            
        try:
            saved_count = 0
            for item in data:
                try:
                    # Check if post already exists (by content and platform)
                    existing_post = db_session.query(Post).filter(
                        Post.content == item['content'],
                        Post.platform == item['platform']
                    ).first()
                    
                    if existing_post:
                        logger.debug(f"Post already exists: {item['platform']} - {item['content'][:50]}...")
                        continue
                        
                    post = Post(
                        content=item['content'],
                        platform=item['platform'],
                        created_at=item['created_at'],
                        likes=item['likes'],
                        shares=item['shares'],
                        sentiment_score=item['sentiment_score'],
                        source_url=item.get('source_url'),
                        author=item.get('author'),
                        engagement_score=item.get('engagement_score', 0.0)
                    )
                    db_session.add(post)
                    saved_count += 1
                    
                except Exception as e:
                    logger.error(f"Error saving individual post: {str(e)}", exc_info=True)
                    continue
                    
            db_session.commit()
            logger.info(f"Successfully saved {saved_count} new items to database")
            
        except Exception as e:
            db_session.rollback()
            logger.error(f"Error saving to database: {str(e)}", exc_info=True)
            raise

def collect_and_save_data(source: str, keywords: List[str], session_scope, limit: int = 20, days: int = 7) -> int:
    """
    Collect and save data from specified source for given keywords.
    
    Args:
        source (str): The data source to collect from ('twitter', 'reddit', 'news', or 'all')
        keywords (List[str]): List of keywords to search for
        session_scope: Database session scope context manager
        limit (int): Maximum number of posts to collect per keyword per source
        days (int): Number of days to look back for data
        
    Returns:
        int: Total number of posts collected and saved
    """
    collector = None
    total_posts = 0
    
    try:
        collector = DataCollector()
        
        for keyword in keywords:
            # Collect data based on source
            if source.lower() == 'all':
                sources = ['twitter', 'reddit', 'news']
            else:
                sources = [source.lower()]
                
            data = collector.collect_all_data(keyword, sources, days, limit)
            
            # Save to database
            with session_scope() as session:
                collector.save_to_database(data, session)
                
            total_posts += len(data)
            
    except Exception as e:
        logger.error(f"Error in collect_and_save_data: {str(e)}")
    finally:
        if collector:
            collector.cleanup()
    
    return total_posts