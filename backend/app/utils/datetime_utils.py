"""
Date and time utilities for common datetime operations.

This module provides reusable functions for date/time parsing, formatting,
and calculations used throughout the insurance claims application.
"""

from datetime import datetime, timedelta, timezone
import re

def parse_date_string(date_str: str | datetime) -> datetime | None:
    """
    Parse various date string formats into datetime objects.

    Args:
        date_str: Date string or datetime object

    Returns:
        Parsed datetime object or None if parsing fails
    """
    if isinstance(date_str, datetime):
        return date_str

    if not date_str or not isinstance(date_str, str):
        return None

    date_str = date_str.strip()

    # Common date formats to try
    formats = [
        "%Y-%m-%d",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%dT%H:%M:%S.%f",
        "%Y-%m-%dT%H:%M:%S.%fZ",
        "%Y-%m-%d %H:%M:%S",
        "%m/%d/%Y",
        "%d/%m/%Y",
        "%m-%d-%Y",
        "%d-%m-%Y",
    ]

    # Handle timezone suffixes
    if date_str.endswith('Z'):
        date_str = date_str[:-1] + '+00:00'

    for fmt in formats:
        try:
            return datetime.strptime(date_str.replace('+00:00', ''), fmt.replace('Z', ''))
        except ValueError:
            continue

    # Try ISO format parsing as fallback
    try:
        return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
    except ValueError:
        return None

def format_datetime_for_display(dt: datetime, include_time: bool = True) -> str:
    """
    Format datetime for user-friendly display.

    Args:
        dt: Datetime object to format
        include_time: Whether to include time in the output

    Returns:
        Formatted date string
    """
    if not dt:
        return "N/A"

    if include_time:
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    else:
        return dt.strftime("%Y-%m-%d")

def get_business_days_between(start_date: datetime, end_date: datetime) -> int:
    """
    Calculate the number of business days between two dates.

    Args:
        start_date: Start date
        end_date: End date

    Returns:
        Number of business days
    """
    if not start_date or not end_date:
        return 0

    if start_date > end_date:
        start_date, end_date = end_date, start_date

    business_days = 0
    current_date = start_date

    while current_date <= end_date:
        # Monday = 0, Sunday = 6
        if current_date.weekday() < 5:  # Monday to Friday
            business_days += 1
        current_date += timedelta(days=1)

    return business_days

def is_within_business_hours(dt: datetime, start_hour: int = 9, end_hour: int = 17) -> bool:
    """
    Check if a datetime falls within business hours.

    Args:
        dt: Datetime to check
        start_hour: Business day start hour (24-hour format)
        end_hour: Business day end hour (24-hour format)

    Returns:
        True if within business hours, False otherwise
    """
    if not dt:
        return False

    # Check if it's a weekday
    if dt.weekday() >= 5:  # Saturday = 5, Sunday = 6
        return False

    # Check if within business hours
    return start_hour <= dt.hour < end_hour

def get_age_in_days(date: datetime) -> int:
    """
    Get the age of a date in days from now.

    Args:
        date: Date to calculate age for

    Returns:
        Age in days
    """
    if not date:
        return 0

    now = datetime.now()
    if date.tzinfo and not now.tzinfo:
        now = now.replace(tzinfo=timezone.utc)
    elif not date.tzinfo and now.tzinfo:
        date = date.replace(tzinfo=timezone.utc)

    delta = now - date
    return delta.days

def add_business_days(start_date: datetime, business_days: int) -> datetime:
    """
    Add business days to a date (excluding weekends).

    Args:
        start_date: Starting date
        business_days: Number of business days to add

    Returns:
        New date after adding business days
    """
    if not start_date or business_days <= 0:
        return start_date

    current_date = start_date
    days_added = 0

    while days_added < business_days:
        current_date += timedelta(days=1)
        # If it's a weekday, count it
        if current_date.weekday() < 5:
            days_added += 1

    return current_date

def get_quarter_from_date(date: datetime) -> int:
    """
    Get the quarter (1-4) from a date.

    Args:
        date: Date to get quarter for

    Returns:
        Quarter number (1-4)
    """
    if not date:
        return 1

    return (date.month - 1) // 3 + 1

def is_date_in_future(date: datetime, buffer_minutes: int = 0) -> bool:
    """
    Check if a date is in the future (with optional buffer).

    Args:
        date: Date to check
        buffer_minutes: Buffer in minutes to allow for clock differences

    Returns:
        True if date is in the future, False otherwise
    """
    if not date:
        return False

    now = datetime.now()
    if date.tzinfo and not now.tzinfo:
        now = now.replace(tzinfo=timezone.utc)
    elif not date.tzinfo and now.tzinfo:
        date = date.replace(tzinfo=timezone.utc)

    buffer = timedelta(minutes=buffer_minutes)
    return date > (now + buffer)

def get_time_ago_string(date: datetime) -> str:
    """
    Get a human-readable "time ago" string.

    Args:
        date: Date to calculate time ago for

    Returns:
        Human-readable time ago string
    """
    if not date:
        return "Unknown"

    now = datetime.now()
    if date.tzinfo and not now.tzinfo:
        now = now.replace(tzinfo=timezone.utc)
    elif not date.tzinfo and now.tzinfo:
        date = date.replace(tzinfo=timezone.utc)

    delta = now - date

    if delta.days > 365:
        years = delta.days // 365
        return f"{years} year{'s' if years != 1 else ''} ago"
    elif delta.days > 30:
        months = delta.days // 30
        return f"{months} month{'s' if months != 1 else ''} ago"
    elif delta.days > 0:
        return f"{delta.days} day{'s' if delta.days != 1 else ''} ago"
    elif delta.seconds > 3600:
        hours = delta.seconds // 3600
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    elif delta.seconds > 60:
        minutes = delta.seconds // 60
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
    else:
        return "Just now"
