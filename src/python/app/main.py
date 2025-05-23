from flask import Flask, render_template, jsonify, request # Removed send_from_directory
import os
# import json # Not used
from datetime import datetime
from flask_cors import CORS # Import CORS

from .config import get_config
from database.db import init_db
from .services.processor import DataProcessor
from .services.analyzer import DataAnalyzer
from scheduler.tasks import init_scheduler
from werkzeug.utils import secure_filename # For file uploads
import logging
from app.services.collector import DataCollector
from database.db import session_scope

# Initialize processor and analyzer
processor = DataProcessor()
analyzer = DataAnalyzer()
collector = DataCollector()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

UPLOAD_FOLDER = 'uploads' # Make sure this folder exists or is created
ALLOWED_EXTENSIONS = {'csv'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__,
                static_folder='../static', # Adjusted static folder path relative to main.py
                template_folder='../templates') # Adjusted template folder path

    # Load configuration
    current_config = get_config()
    app.config.from_object(current_config)
    app.config['UPLOAD_FOLDER'] = os.path.join(app.instance_path, UPLOAD_FOLDER) # Store uploads in instance folder
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True) # Create upload folder if it doesn't exist

    # Enable CORS - Explicitly allow the Next.js dev server origin
    # In production, restrict this to the actual frontend domain
    CORS(app, resources={r"/api/*": {"origins": ["http://localhost:9002", "http://127.0.0.1:9002"]}}) # Allows requests from Next.js dev server

    # Initialize database
    with app.app_context():
        init_db()
        logger.info("Database initialized successfully")

    # Register routes
    register_routes(app)

    @app.context_processor
    def inject_now():
        return {'now': datetime.utcnow}

    # Initialize scheduler for production or if not explicitly disabled
    if not app.config.get('TESTING', False) and os.environ.get('FLASK_ENV') != 'development_no_scheduler':
        # Avoid starting scheduler twice when Flask reloader is active
        if not os.environ.get("WERKZEUG_RUN_MAIN"):
           logger.info("Initializing scheduler...")
           init_scheduler()
        else:
           logger.info("Scheduler initialization skipped in Werkzeug reloader process.")
    else:
        logger.info("Scheduler initialization skipped (TESTING or development_no_scheduler environment).")


    return app


def register_routes(app):
    """Register application routes."""

    # Route for serving static images (if needed, otherwise let Flask handle /static)
    # @app.route('/static/images/<path:filename>')
    # def serve_image(filename):
    #     return send_from_directory(os.path.join(app.static_folder, 'images'), filename)

    @app.route('/')
    def index():
        """Render main home page."""
        return render_template('index.html')

    @app.route('/dashboard')
    def dashboard():
        """Render dashboard page with filters."""
        return render_template('dashboard.html')

    @app.route('/reports')
    def reports():
        """Render reports page."""
        # Placeholder for reports page
        return render_template('index.html', title="Reports (Coming Soon)") # Or a dedicated reports.html

    @app.route('/settings')
    def settings():
        """Render settings page."""
        # Placeholder for settings page
        return render_template('index.html', title="Settings (Coming Soon)") # Or a dedicated settings.html

    @app.route('/api/summary')
    def get_summary():
        """Get dashboard summary statistics."""
        days = request.args.get('days', default=1, type=int)
        return jsonify(analyzer.get_dashboard_summary(days))

    @app.route('/api/trending')
    def get_trending():
        """Get trending topics."""
        days = request.args.get('days', default=1, type=int)
        limit = request.args.get('limit', default=10, type=int)
        return jsonify(analyzer.get_trending_topics(days, limit))

    @app.route('/api/posts/top')
    def get_top_posts_route():
        """Get top posts by specified metric."""
        days = request.args.get('days', default=1, type=int)
        metric = request.args.get('metric', default='engagement')
        limit = request.args.get('limit', default=10, type=int)
        return jsonify(analyzer.get_top_posts(days, metric, limit))

    @app.route('/api/activity')
    def get_activity():
        """Get post activity time series."""
        days = request.args.get('days', default=7, type=int)
        interval = request.args.get('interval', default='day')
        return jsonify(analyzer.get_time_series_activity(days, interval))

    @app.route('/api/engagement')
    def get_engagement():
        """Get engagement metrics time series."""
        days = request.args.get('days', default=7, type=int)
        platform = request.args.get('platform', default=None)
        return jsonify(analyzer.get_time_series_engagement(days, platform))

    @app.route('/api/sentiment')
    def get_sentiment_distribution_route():
        """Get sentiment distribution."""
        days = request.args.get('days', default=7, type=int)
        platform = request.args.get('platform', default=None)
        return jsonify(processor.get_sentiment_distribution(days, platform))

    @app.route('/api/hashtag-network')
    def get_hashtag_network_route():
        """Get hashtag co-occurrence network."""
        days = request.args.get('days', default=7, type=int)
        limit = request.args.get('limit', default=20, type=int)
        return jsonify(analyzer.get_hashtag_network(days, limit))

    @app.route('/api/search')
    def search_posts_route():
        """Search posts by content."""
        query_param = request.args.get('q', default='')
        days = request.args.get('days', default=30, type=int)
        limit = request.args.get('limit', default=50, type=int)
        return jsonify(analyzer.search_posts(query_param, days, limit))

    @app.route('/api/system-stats')
    def system_stats_api():
        # This is a placeholder. You'll need to implement logic to get these stats.
        # For example, count total posts, average sentiment from your DB.
        # Number of data sources could be hardcoded or from config.
        # Trend data needs to be generated/queried based on historical data.
        summary_30d = analyzer.get_dashboard_summary(days=30)
        summary_365d = analyzer.get_dashboard_summary(days=365)
        total_posts_30d = summary_30d.get('total_posts', 0)
        sentiment_30d = summary_30d.get('sentiment', {})
        avg_sentiment_score = (sentiment_30d.get('positive',0) - sentiment_30d.get('negative',0)) / (total_posts_30d or 1) * 5 + 5 if total_posts_30d > 0 else 5.0

        return jsonify({
            "postsAnalyzed": summary_365d.get('total_posts',0), # Example: total posts ever
            "avgSentiment": avg_sentiment_score, # Scaled to 0-10
            "trendingTopics": len(analyzer.get_trending_topics(days=7).get('keywords', [])),
            "dataSources": len(get_config().DEFAULT_KEYWORDS) > 0, # Example: count active data sources
            "trendLabels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"], # Placeholder
            "mentionsData": [120, 190, 300, 500, 280, 450, 600], # Placeholder
            "sentimentData": [6.5, 7.2, 6.8, 7.5, 8.1, 7.6, 8.4] # Placeholder
        })

    @app.route('/api/dashboard-data')
    def dashboard_data_api():
        source = request.args.get('source', 'all')
        keyword_filter = request.args.get('keyword', '') # Empty string default instead of 'all'
        time_range_days = int(request.args.get('timeRange', 7))

        logger.info(f"Received dashboard data request: source='{source}', keyword='{keyword_filter}', timeRange='{time_range_days}'")

        # Placeholder data - replace with actual data fetching and processing logic
        summary = analyzer.get_dashboard_summary(days=time_range_days)
        metrics = {
            "totalPosts": summary.get('total_posts', 0),
            "postsChange": 5, # Placeholder
            "engagementRate": ((summary.get('engagement',{}).get('total_likes',0) or 0) + (summary.get('engagement',{}).get('total_shares',0) or 0)) / (summary.get('total_posts',1) or 1) * 100, # Calculate as percentage
            "engagementChange": 2, # Placeholder
            "sentimentScore": (summary.get('sentiment', {}).get('positive',0) - summary.get('sentiment', {}).get('negative',0)) / (summary.get('total_posts',1) or 1) * 5 + 5 if summary.get('total_posts',0) > 0 else 5.0, # Example calculation (0-10 scale)
            "sentimentChange": 1, # Placeholder
            "reach": summary.get('total_posts', 0) * 10, # Placeholder
            "reachChange": 3, # Placeholder
        }

        activity_data_raw = analyzer.get_time_series_activity(days=time_range_days, interval='day') # Assume daily for now

        # Aggregate activity data if source is 'all' or transform for specific source
        activity_labels = sorted(list(set(item['date'] for item in activity_data_raw)))
        activity_datasets = []

        platforms_in_data = set()
        for item in activity_data_raw:
            for key in item:
                if key != 'date':
                    platforms_in_data.add(key)

        platform_colors = { # Define some colors for platforms
            'twitter': 'rgba(29, 161, 242, 1)',
            'facebook': 'rgba(59, 89, 152, 1)',
            # Add more as needed
        }
        default_color = 'rgba(108, 117, 125, 1)' # Grey for unknown


        if source == 'all':
            for p_name in sorted(list(platforms_in_data)):
                platform_data = []
                for label_date in activity_labels:
                    found_item = next((item for item in activity_data_raw if item['date'] == label_date), None)
                    platform_data.append(found_item.get(p_name, 0) if found_item else 0)
                activity_datasets.append({
                    'label': p_name.capitalize(),
                    'data': platform_data,
                    'borderColor': platform_colors.get(p_name.lower(), default_color),
                    'tension': 0.1,
                    'fill': False
                })
        elif source in platforms_in_data:
            platform_data = []
            for label_date in activity_labels:
                 found_item = next((item for item in activity_data_raw if item['date'] == label_date), None)
                 platform_data.append(found_item.get(source, 0) if found_item else 0)
            activity_datasets.append({
                'label': source.capitalize(),
                'data': platform_data,
                'borderColor': platform_colors.get(source.lower(), default_color),
                'tension': 0.1,
                'fill': False
            })


        activityData = {
            'labels': activity_labels,
            'datasets': activity_datasets
        }

        sentimentDistribution = processor.get_sentiment_distribution(days=time_range_days, platform=source if source != 'all' else None)

        trending_keywords_raw = processor.get_trending_keywords(days=time_range_days, limit=50) # Fetch more for word cloud
        wordCloudData = [{"text": kw['text'], "value": kw['frequency']} for kw in trending_keywords_raw]


        trending_hashtags_raw = processor.get_trending_hashtags(days=time_range_days, limit=10)
        topTopics = [{"name": ht['text'], "posts": ht['count'], "engagement": ht['count']*5, "sentiment": 6.5 + (hash(ht['text']) % 30)/10.0 , "trend": "up" if hash(ht['text']) % 2 == 0 else "down"} for ht in trending_hashtags_raw] # Placeholder for engagement/sentiment


        platform_dist_raw = summary.get('platforms', {})
        platformDistribution = {
            'labels': list(platform_dist_raw.keys()),
            'data': list(platform_dist_raw.values())
        }

        engagement_metrics_raw = analyzer.get_time_series_engagement(days=time_range_days, platform=source if source != 'all' else None)
        engagementMetrics = { # Assuming daily for now
            'labels': [em['date'] for em in engagement_metrics_raw],
            'datasets': [
                {'label': 'Avg Likes', 'data': [em['avg_likes'] for em in engagement_metrics_raw], 'borderColor': 'rgba(255, 99, 132, 1)', 'tension': 0.1, 'fill': False},
                {'label': 'Avg Shares', 'data': [em['avg_shares'] for em in engagement_metrics_raw], 'borderColor': 'rgba(54, 162, 235, 1)', 'tension': 0.1, 'fill': False},
            ]
        }

        # Fetch recent posts, apply keyword filter if present
        if keyword_filter: # Check if keyword_filter is not empty
            logger.info(f"Searching posts with keyword: {keyword_filter}")
            recent_posts_raw = analyzer.search_posts(query_string=keyword_filter, days=time_range_days, limit=50) # Increased limit for filtering
        else:
             logger.info("Fetching recent posts (no keyword filter)")
             # Get latest posts regardless of keyword
             recent_posts_raw = analyzer.get_top_posts(days=time_range_days, limit=50, metric='created_at_desc') # Assuming a metric for recency exists or implemented

        recentPosts = []
        for p in recent_posts_raw:
             try:
                # Determine sentiment string
                score = p.get('sentiment_score', 0)
                sentiment_str = "Positive" if score > 0.05 else "Negative" if score < -0.05 else "Neutral"

                # Ensure created_at is valid before formatting
                created_at_str = p.get('created_at')
                formatted_date = ""
                if created_at_str:
                     try:
                        # Handle potential 'Z' for UTC timezone
                        dt_obj = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
                        # Convert to local time if needed or format directly
                        formatted_date = dt_obj.strftime('%Y-%m-%d %H:%M')
                     except ValueError:
                         logger.warning(f"Could not parse date: {created_at_str}")
                         formatted_date = created_at_str # Keep original if parsing fails

                recentPosts.append({
                    "platform": p.get('platform', 'Unknown'),
                    "author": p.get('author', 'N/A'),
                    "content": (p.get('content') or '')[:100] + ("..." if len(p.get('content') or '') > 100 else ""), # Truncate safely
                    "sentiment": sentiment_str,
                    "sentimentScore": score,
                    "likes": p.get('likes', 0),
                    "shares": p.get('shares', 0),
                    "date": formatted_date
                })
             except Exception as e_inner:
                logger.error(f"Error processing recent post: {p.get('id', 'N/A')}. Error: {e_inner}", exc_info=True)


        response_data = {
            "metrics": metrics,
            "activityData": activityData,
            "sentimentDistribution": sentimentDistribution,
            "wordCloudData": wordCloudData,
            "topTopics": topTopics, # Actually top hashtags in this impl
            "platformDistribution": platformDistribution,
            "engagementMetrics": engagementMetrics,
            "recentPosts": recentPosts
        }
        logger.info(f"Returning {len(recentPosts)} recent posts.")
        return jsonify(response_data)

    @app.route('/api/collect-data', methods=['POST'])
    def collect_data():
        """Collect data from specified sources."""
        try:
            data = request.get_json()
            source = data.get('source', 'all')
            keywords = data.get('keywords', [])
            days = data.get('days', 7)
            
            if not keywords:
                return jsonify({'error': 'No keywords provided'}), 400
                
            # Collect data using the collector
            collected_data = collector.collect_all_data(keywords[0], [source], days)
            
            # Save to database
            collector.save_to_database(collected_data)
            
            return jsonify({
                'message': 'Data collection completed',
                'count': len(collected_data)
            })
            
        except Exception as e:
            logger.error(f"Error in collect_data: {str(e)}")
            return jsonify({'error': str(e)}), 500

    @app.route('/api/process', methods=['POST'])
    def process_data_route():
        """Process collected data."""
        try:
            data = request.get_json()
            days = data.get('days', 7)
            platform = data.get('platform', None)
            
            # Process data using the processor
            processed_data = processor.process_data(days, platform)
            
            return jsonify(processed_data)
            
        except Exception as e:
            logger.error(f"Error in process_data: {str(e)}")
            return jsonify({'error': str(e)}), 500

    @app.route('/api/test-collect', methods=['POST'])
    def test_collect():
        """Test endpoint to trigger data collection."""
        try:
            data = request.get_json()
            keyword = data.get('keyword', 'AI')
            source = data.get('source', 'all')
            days = data.get('days', 7)
            
            logger.info(f"Starting test collection for keyword: {keyword}, source: {source}")
            
            # Collect data
            collected_data = collector.collect_all_data(keyword, [source], days)
            logger.info(f"Collected {len(collected_data)} items")
            
            # Save to database
            with session_scope() as session:
                collector.save_to_database(collected_data, session)
            
            return jsonify({
                'message': 'Test collection completed',
                'count': len(collected_data)
            })
            
        except Exception as e:
            logger.error(f"Error in test collection: {str(e)}", exc_info=True)
            return jsonify({'error': str(e)}), 500


# Create the Flask application instance
app = create_app()

if __name__ == '__main__':
    # Use environment variables for host and port, falling back to defaults
    host = os.environ.get('FLASK_RUN_HOST', '0.0.0.0')
    port = int(os.environ.get('FLASK_RUN_PORT', 5000))
    debug_mode = app.config.get('DEBUG', True)

    logger.info(f"Starting Flask server on {host}:{port} with debug={debug_mode}")
    # Run the app using Flask's development server
    app.run(debug=debug_mode, host=host, port=port)