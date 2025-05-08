
from datetime import datetime, timezone

def get_current_utc_time():
    """Returns the current time in UTC."""
    return datetime.now(timezone.utc)

def format_datetime(dt_object, fmt="%Y-%m-%d %H:%M:%S %Z%z"):
    """Formats a datetime object into a string."""
    if dt_object:
        return dt_object.strftime(fmt)
    return None

# Add other time-related utility functions as needed.
# For example, parsing date strings, converting timezones, etc.
