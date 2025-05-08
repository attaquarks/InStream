
import re
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from collections import Counter
import string

# Download NLTK resources if they don't exist
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

try:
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('wordnet')


def clean_text(text):
    """Clean and normalize text."""
    # Convert to lowercase
    text = text.lower()
    
    # Remove URLs
    text = re.sub(r'http\S+|www\S+|https\S+', '', text)
    
    # Remove mentions (@username)
    text = re.sub(r'@\w+', '', text)
    
    # Remove special characters and numbers but keep words in hashtags
    text = re.sub(r'#(\w+)', r'\1', text)
    
    # Remove punctuation
    text = text.translate(str.maketrans('', '', string.punctuation))
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text


def tokenize_text(text, remove_stopwords=True):
    """Tokenize text into words."""
    # Clean text
    text = clean_text(text)
    
    # Tokenize
    tokens = word_tokenize(text)
    
    if remove_stopwords:
        # Remove stopwords
        stop_words = set(stopwords.words('english'))
        tokens = [word for word in tokens if word not in stop_words and len(word) > 2]
    
    return tokens


def extract_keywords(text, top_n=10, min_length=3):
    """Extract keywords from text."""
    # Tokenize and clean
    tokens = tokenize_text(text)
    
    # Filter by minimum length
    tokens = [token for token in tokens if len(token) >= min_length]
    
    # Count frequencies
    freq_dist = Counter(tokens)
    
    # Get top keywords
    top_keywords = freq_dist.most_common(top_n)
    
    return top_keywords


def extract_hashtags(text):
    """Extract hashtags from text."""
    hashtags = re.findall(r'#(\w+)', text)
    return hashtags


def lemmatize_text(tokens):
    """Lemmatize tokens to get base forms."""
    lemmatizer = WordNetLemmatizer()
    lemmatized = [lemmatizer.lemmatize(token) for token in tokens]
    return lemmatized


def create_word_cloud_data(texts, top_n=100):
    """Create data for a word cloud from a list of texts."""
    # Combine all texts
    all_text = ' '.join(texts)
    
    # Tokenize and clean
    tokens = tokenize_text(all_text)
    
    # Count word frequencies
    freq_dist = Counter(tokens)
    
    # Get top words
    top_words = freq_dist.most_common(top_n)
    
    # Format for word cloud
    word_cloud_data = [{'text': word, 'value': count} for word, count in top_words]
    
    return word_cloud_data


def calculate_topic_similarity(topic1_keywords, topic2_keywords):
    """Calculate similarity between two topics based on their keywords."""
    # Convert keywords to sets
    set1 = set(topic1_keywords)
    set2 = set(topic2_keywords)
    
    # Calculate Jaccard similarity
    intersection = len(set1.intersection(set2))
    union = len(set1.union(set2))
    
    if union == 0:
        return 0
    
    return intersection / union
