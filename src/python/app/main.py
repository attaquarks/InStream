
from flask import Flask, render_template, jsonify, request # Removed send_from_directory as it's not used
import os
# import json # Not used
# from datetime import datetime # Not used

from app.config import get_config
from database.db import init_db
from app.services.collector import collect_and_save_data # Assuming collector.py will be created
from app.services.processor import DataProcessor
from app.services.analyzer import DataAnalyzer
from scheduler.tasks import init_scheduler

# Initialize processor and analyzer
processor = DataProcessor()
analyzer = DataAnalyzer()

def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__, 
                static_folder='static', # Relative to app instance path or where main.py is
                template_folder='templates') # Relative to app instance path or where main.py is
    
    # Load configuration
    current_config = get_config() # Renamed to avoid conflict with app.config
    app.config.from_object(current_config)
    
    # Initialize database
    # Ensure this is called within app context if db setup needs it
    with app.app_context():
        init_db()
    
    # Register routes
    register_routes(app)
    
    # Initialize scheduler for production or if not explicitly disabled
    if not app.config.get('TESTING', False) and os.environ.get('FLASK_ENV') != 'development_no_scheduler':
        # Check if running in Werkzeug reloader to avoid starting scheduler twice in dev
        if not os.environ.get("WERKZEUG_RUN_MAIN"):
           init_scheduler()
    
    return app


def register_routes(app):
    """Register application routes."""
    
    @app.route('/')
    def index():
        """Render main dashboard page."""
        # This typically would render index.html which might be a landing page
        # or redirect to the dashboard.
        return render_template('index.html') # Assuming index.html exists
    
    @app.route('/dashboard')
    def dashboard():
        """Render dashboard page with filters."""
        return render_template('dashboard.html') # Assuming dashboard.html exists
    
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
    def get_top_posts_route(): # Renamed to avoid conflict with any potential 'get_top_posts' import
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
    def get_sentiment_distribution_route(): # Renamed for clarity
        """Get sentiment distribution."""
        days = request.args.get('days', default=7, type=int)
        platform = request.args.get('platform', default=None)
        return jsonify(processor.get_sentiment_distribution(days, platform))
    
    @app.route('/api/hashtag-network')
    def get_hashtag_network_route(): # Renamed for clarity
        """Get hashtag co-occurrence network."""
        days = request.args.get('days', default=7, type=int)
        limit = request.args.get('limit', default=20, type=int)
        return jsonify(analyzer.get_hashtag_network(days, limit))
    
    @app.route('/api/search')
    def search_posts_route(): # Renamed to avoid conflict
        """Search posts by content."""
        query_param = request.args.get('q', default='') # 'q' is conventional for query
        days = request.args.get('days', default=30, type=int)
        limit = request.args.get('limit', default=50, type=int)
        return jsonify(analyzer.search_posts(query_param, days, limit)) # Pass query_param
    
    @app.route('/api/collect', methods=['POST'])
    def collect_data_route(): # Renamed for clarity
        """Manually trigger data collection."""
        data = request.get_json()
        if not data:
            return jsonify({'status': 'error', 'message': 'Request body must be JSON.'}), 400

        source = data.get('source', 'twitter')
        keywords = data.get('keywords', get_config().DEFAULT_KEYWORDS) # Use default if not provided
        limit = data.get('limit', get_config().POST_LIMIT) # Use default if not provided
        
        try:
            count = collect_and_save_data(source, keywords, limit)
            return jsonify({'status': 'success', 'collected': count})
        except Exception as e:
            app.logger.error(f"Error in /api/collect: {e}", exc_info=True)
            return jsonify({'status': 'error', 'message': str(e)}), 500
    
    @app.route('/api/process', methods=['POST'])
    def process_data_route(): # Renamed for clarity
        """Manually trigger data processing."""
        try:
            keyword_count = processor.extract_keywords()
            sentiment_count = processor.analyze_sentiment()
            return jsonify({
                'status': 'success', 
                'keywords_processed': keyword_count,
                'sentiment_processed': sentiment_count
            })
        except Exception as e:
            app.logger.error(f"Error in /api/process: {e}", exc_info=True)
            return jsonify({'status': 'error', 'message': str(e)}), 500


# Create the Flask application instance
# This is typically done when running the app directly, e.g. `python app/main.py`
# For WSGI servers like Gunicorn, they will call create_app()
app = create_app()

if __name__ == '__main__':
    # The host and port can also be driven by environment variables or config
    app.run(debug=app.config.get('DEBUG', True), 
            host=os.environ.get('FLASK_RUN_HOST', '0.0.0.0'), 
            port=int(os.environ.get('FLASK_RUN_PORT', 5000)))
