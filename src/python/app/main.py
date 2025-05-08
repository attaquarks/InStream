
from flask import Flask, render_template, jsonify, request # Removed send_from_directory
import os
# import json # Not used
from datetime import datetime
from flask_cors import CORS # Import CORS

from app.config import get_config
from database.db import init_db
from app.services.collector import collect_and_save_data
from app.services.processor import DataProcessor
from app.services.analyzer import DataAnalyzer
from scheduler.tasks import init_scheduler
from werkzeug.utils import secure_filename # For file uploads
import logging

# Initialize processor and analyzer
processor = DataProcessor()
analyzer = DataAnalyzer()

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
    
    # Enable CORS
    CORS(app) # Allows all origins by default, refine in production if needed
    
    # Load configuration
    current_config = get_config() 
    app.config.from_object(current_config)
    app.config['UPLOAD_FOLDER'] = os.path.join(app.instance_path, UPLOAD_FOLDER) # Store uploads in instance folder
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True) # Create upload folder if it doesn't exist
    
    # Initialize database
    with app.app_context():
        init_db()
    
    # Register routes
    register_routes(app)

    @app.context_processor
    def inject_now():
        return {'now': datetime.utcnow}
    
    # Initialize scheduler for production or if not explicitly disabled
    if not app.config.get('TESTING', False) and os.environ.get('FLASK_ENV') != 'development_no_scheduler':
        if not os.environ.get("WERKZEUG_RUN_MAIN"):
           init_scheduler()
    
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
                        formatted_date = datetime.fromisoformat(created_at_str.replace('Z', '+00:00')).strftime('%Y-%m-%d %H:%M')
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

    @app.route('/api/collect-data', methods=['POST']) # Renamed endpoint
    def collect_data_api(): # Renamed function
        """Manually trigger data collection."""
        source = request.form.get('source', 'twitter')
        keywords_str = request.form.get('keywords', '')
        keywords = [k.strip() for k in keywords_str.split(',') if k.strip()] if keywords_str else get_config().DEFAULT_KEYWORDS
        
        limit_str = request.form.get('limit', str(get_config().POST_LIMIT))
        try:
            limit = int(limit_str)
        except ValueError:
            limit = get_config().POST_LIMIT
        
        # dateRange = request.form.get('dateRange')
        # startDate = request.form.get('startDate') # Handle if 'custom'
        # endDate = request.form.get('endDate') # Handle if 'custom'

        if source == 'csv':
            if 'file' not in request.files:
                return jsonify({'status': 'error', 'message': 'No file part in CSV upload'}), 400
            file = request.files['file']
            if file.filename == '':
                return jsonify({'status': 'error', 'message': 'No selected file for CSV upload'}), 400
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)
                # TODO: Implement CSV processing logic by calling a new function in collector.py
                # For example: count = process_csv_data(filepath, keywords, limit)
                # For now, just acknowledge upload
                logger.info(f"CSV file {filename} uploaded. Processing not yet implemented.")
                return jsonify({'status': 'success', 'message': f'CSV file {filename} uploaded. Processing to be implemented.'})
            else:
                return jsonify({'status': 'error', 'message': 'File type not allowed for CSV upload'}), 400
        
        try:
            count = collect_and_save_data(source, keywords, limit)
            # After successful collection, trigger processing
            processor.extract_keywords(limit=count) # Process newly added posts
            processor.analyze_sentiment(limit=count) # Process newly added posts
            return jsonify({'status': 'success', 'collected': count})
        except Exception as e:
            logger.error(f"Error in /api/collect-data: {e}", exc_info=True)
            return jsonify({'status': 'error', 'message': str(e)}), 500
    
    @app.route('/api/process', methods=['POST'])
    def process_data_route(): 
        """Manually trigger data processing for all unprocessed data."""
        try:
            keyword_count = processor.extract_keywords() # Process all unprocessed
            sentiment_count = processor.analyze_sentiment() # Process all unprocessed
            return jsonify({
                'status': 'success', 
                'keywords_processed': keyword_count,
                'sentiment_processed': sentiment_count
            })
        except Exception as e:
            logger.error(f"Error in /api/process: {e}", exc_info=True)
            return jsonify({'status': 'error', 'message': str(e)}), 500


# Create the Flask application instance
app = create_app()

if __name__ == '__main__':
    app.run(debug=app.config.get('DEBUG', True), 
            host=os.environ.get('FLASK_RUN_HOST', '0.0.0.0'), 
            port=int(os.environ.get('FLASK_RUN_PORT', 5000)))

    
