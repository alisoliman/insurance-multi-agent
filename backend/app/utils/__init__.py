"""
Utilities module for shared helper functions and common utilities.

This module contains utility functions, helper classes, and common
functionality that can be reused across the application.
"""

from .validation import (
    # Functions
    parse_amount,
    validate_claim_data,
    validate_email,
    validate_phone_number,
    sanitize_text_input,
    extract_keywords,
    validate_file_extension,
    # Exceptions
    ValidationError,
    AmountValidationError,
    DateValidationError,
    ClaimDataValidationError,
)

from .datetime_utils import (
    parse_date_string,
    format_datetime_for_display,
    get_business_days_between,
    is_within_business_hours,
    get_age_in_days,
    add_business_days,
    get_quarter_from_date,
    is_date_in_future,
    get_time_ago_string,
)

__all__ = [
    # Validation utilities
    "parse_amount",
    "validate_claim_data",
    "validate_email",
    "validate_phone_number",
    "sanitize_text_input",
    "extract_keywords",
    "validate_file_extension",
    # Validation exceptions
    "ValidationError",
    "AmountValidationError",
    "DateValidationError",
    "ClaimDataValidationError",
    # DateTime utilities
    "parse_date_string",
    "format_datetime_for_display",
    "get_business_days_between",
    "is_within_business_hours",
    "get_age_in_days",
    "add_business_days",
    "get_quarter_from_date",
    "is_date_in_future",
    "get_time_ago_string",
]
