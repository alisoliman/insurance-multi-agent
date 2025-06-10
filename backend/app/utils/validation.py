"""
Validation utilities for common data validation tasks.

This module provides reusable validation functions for insurance claims,
amounts, dates, and other common data types used throughout the application.
"""

import re
from datetime import datetime


def parse_amount(amount: str | int | float) -> float:
    """
    Parse and validate monetary amounts from various input formats.

    This function handles the complexity of parsing monetary values from
    different sources (user input, APIs, databases) while ensuring
    data integrity and preventing negative amounts.

    Args:
        amount: Amount in string, int, or float format

    Returns:
        Parsed amount as float

    Raises:
        ValueError: If amount cannot be parsed or is negative
    """
    # Handle None/null values gracefully
    # Return 0.0 for missing amounts rather than failing
    if amount is None:
        return 0.0

    # Direct numeric types - validate and convert
    if isinstance(amount, (int, float)):
        if amount < 0:
            # Business rule: no negative claims
            raise ValueError("Amount cannot be negative")
        return float(amount)

    # String parsing with currency symbol handling
    if isinstance(amount, str):
        # Remove common currency symbols and whitespace
        # This handles formats like "$1,234.56", "1,234.56 USD", etc.
        cleaned = re.sub(r'[$,\s]', '', amount.strip())

        # Handle empty strings after cleaning
        if not cleaned:
            return 0.0

        try:
            parsed = float(cleaned)
            if parsed < 0:
                # Consistent validation
                raise ValueError("Amount cannot be negative")
            return parsed
        except ValueError:
            # Provide context in error message for debugging
            raise ValueError(f"Invalid amount format: {amount}")

    # Unsupported type - fail with clear error message
    raise ValueError(f"Unsupported amount type: {type(amount)}")


def validate_claim_data(claim_data: dict[str, any]) -> dict[str, any]:
    """
    Validate basic claim data structure and required fields.

    This comprehensive validation ensures claim data meets minimum
    requirements for processing and prevents downstream errors.
    The validation is designed to be strict enough to catch issues
    early while being flexible enough to handle various input formats.

    Args:
        claim_data: Dictionary containing claim information

    Returns:
        Dictionary with validation results: {"valid": bool, "errors": list[str]}
    """
    errors = []

    # Check required fields for presence and non-empty values
    # These fields are essential for any meaningful claim processing
    required_fields = ["policy_number", "incident_date", "description"]
    for field in required_fields:
        if field not in claim_data or not claim_data[field]:
            errors.append(f"Missing required field: {field}")

    # Validate policy number format (basic check)
    # Policy numbers should be meaningful identifiers, not just placeholders
    if "policy_number" in claim_data:
        policy_num = str(claim_data["policy_number"]).strip()
        if len(policy_num) < 5:
            errors.append("Policy number must be at least 5 characters")

    # Validate incident date format and logical constraints
    if "incident_date" in claim_data:
        try:
            # Parse date with timezone handling for ISO format compatibility
            incident_date = datetime.fromisoformat(
                str(claim_data["incident_date"]).replace('Z', '+00:00'))

            # Business rule: incidents cannot be in the future
            # This prevents data entry errors and potential fraud
            if incident_date > datetime.now():
                errors.append("Incident date cannot be in the future")
        except (ValueError, TypeError):
            errors.append("Invalid incident date format")

    # Validate amount if provided (optional field)
    # Use our robust amount parsing function for consistency
    if "amount" in claim_data and claim_data["amount"] is not None:
        try:
            parse_amount(claim_data["amount"])
        except ValueError as e:
            errors.append(f"Invalid amount: {str(e)}")

    # Validate description quality
    # Descriptions should be meaningful for assessment purposes
    if "description" in claim_data:
        description = str(claim_data["description"]).strip()
        if len(description) < 10:
            # Minimum meaningful content
            errors.append("Description must be at least 10 characters")
        elif len(description) > 5000:
            # Prevent abuse/errors
            errors.append("Description cannot exceed 5000 characters")

    return {
        "valid": len(errors) == 0,
        "errors": errors
    }


def validate_email(email: str) -> bool:
    """
    Validate email address format.

    Args:
        email: Email address to validate

    Returns:
        True if email format is valid, False otherwise
    """
    if not email or not isinstance(email, str):
        return False

    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email.strip()))


def validate_phone_number(phone: str) -> bool:
    """
    Validate phone number format (basic validation).

    Args:
        phone: Phone number to validate

    Returns:
        True if phone format is valid, False otherwise
    """
    if not phone or not isinstance(phone, str):
        return False

    # Remove all non-digit characters
    digits_only = re.sub(r'\D', '', phone)

    # Check if it's a valid length (10-15 digits)
    return 10 <= len(digits_only) <= 15


def sanitize_text_input(text: str, max_length: int = 1000) -> str:
    """
    Sanitize text input by removing potentially harmful characters.

    This function provides basic protection against control character injection
    and ensures text inputs are within reasonable length limits. It's designed
    to be permissive enough for normal use while preventing obvious issues.

    Args:
        text: Text to sanitize
        max_length: Maximum allowed length

    Returns:
        Sanitized text
    """
    # Handle None/empty input gracefully
    if not text or not isinstance(text, str):
        return ""

    # Remove control characters that could cause display/processing issues
    # Keep printable characters and common whitespace (space, tab, newline)
    # ASCII control chars (0x00-0x1f) and extended control chars (0x7f-0x9f)
    sanitized = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', text.strip())

    # Enforce length limit to prevent memory/processing issues
    return sanitized[:max_length]


def extract_keywords(text: str, keywords: list[str]) -> list[str]:
    """
    Extract matching keywords from text (case-insensitive).

    This function is used for identifying risk factors, complexity indicators,
    and other important terms in claim descriptions. Case-insensitive matching
    ensures we catch variations in capitalization.

    Args:
        text: Text to search in
        keywords: List of keywords to search for

    Returns:
        List of found keywords
    """
    # Handle empty/invalid inputs gracefully
    if not text or not keywords:
        return []

    # Convert to lowercase for case-insensitive matching
    # This ensures we catch keywords regardless of how they're capitalized
    text_lower = text.lower()
    found_keywords = []

    # Check each keyword for presence in the text
    for keyword in keywords:
        if keyword.lower() in text_lower:
            found_keywords.append(keyword)  # Return original keyword case

    return found_keywords


def validate_file_extension(filename: str, allowed_extensions: list[str]) -> bool:
    """
    Validate file extension against allowed extensions.

    Args:
        filename: Name of the file
        allowed_extensions: List of allowed extensions (e.g., ['.jpg', '.png'])

    Returns:
        True if extension is allowed, False otherwise
    """
    if not filename or not isinstance(filename, str):
        return False

    file_ext = filename.lower().split('.')[-1] if '.' in filename else ''

    # Normalize extensions (add dot if missing)
    normalized_allowed = []
    for ext in allowed_extensions:
        if not ext.startswith('.'):
            ext = '.' + ext
        normalized_allowed.append(ext.lower())

    return f'.{file_ext}' in normalized_allowed
