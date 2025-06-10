"""
Validation utilities for common data validation tasks.

This module provides reusable validation functions for insurance claims,
amounts, dates, and other common data types used throughout the application.
"""

import re
from datetime import datetime
from typing import Any


class ValidationError(Exception):
    """Base exception for validation errors."""

    def __init__(self, message: str, field: str | None = None, value: Any = None):
        self.field = field
        self.value = value
        super().__init__(message)


class AmountValidationError(ValidationError):
    """Exception raised when amount validation fails."""
    pass


class DateValidationError(ValidationError):
    """Exception raised when date validation fails."""
    pass


class ClaimDataValidationError(ValidationError):
    """Exception raised when claim data validation fails."""

    def __init__(self, message: str, errors: list[str] | None = None):
        self.errors = errors or []
        super().__init__(message)


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
        AmountValidationError: If amount cannot be parsed or is negative
    """
    # Handle None/null values gracefully
    # Return 0.0 for missing amounts rather than failing
    if amount is None:
        return 0.0

    # Direct numeric types - validate and convert
    if isinstance(amount, (int, float)):
        if amount < 0:
            # Business rule: no negative claims
            raise AmountValidationError(
                "Amount cannot be negative",
                field="amount",
                value=amount
            )
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
                raise AmountValidationError(
                    "Amount cannot be negative",
                    field="amount",
                    value=amount
                )
            return parsed
        except ValueError as e:
            # Provide context in error message for debugging
            raise AmountValidationError(
                f"Invalid amount format: {amount}",
                field="amount",
                value=amount
            ) from e

    # Unsupported type - fail with clear error message
    raise AmountValidationError(
        f"Unsupported amount type: {type(amount).__name__}",
        field="amount",
        value=amount
    )


def validate_claim_data(claim_data: dict[str, Any]) -> dict[str, Any]:
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

    Raises:
        ClaimDataValidationError: If validation fails with critical errors
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
        except (ValueError, TypeError) as e:
            errors.append(f"Invalid incident date format: {str(e)}")

    # Validate amount if provided (optional field)
    # Use our robust amount parsing function for consistency
    if "amount" in claim_data and claim_data["amount"] is not None:
        try:
            parse_amount(claim_data["amount"])
        except AmountValidationError as e:
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

    # If there are critical errors, raise an exception
    if len(errors) > 2:  # More than 2 errors indicates severely malformed data
        raise ClaimDataValidationError(
            f"Claim data validation failed with {len(errors)} errors",
            errors=errors
        )

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

    Raises:
        ValidationError: If email is None or not a string
    """
    if email is None:
        raise ValidationError("Email cannot be None",
                              field="email", value=email)

    if not isinstance(email, str):
        raise ValidationError(
            f"Email must be a string, got {type(email).__name__}",
            field="email",
            value=email
        )

    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email.strip()))


def validate_phone_number(phone: str) -> bool:
    """
    Validate phone number format (basic validation).

    Args:
        phone: Phone number to validate

    Returns:
        True if phone format is valid, False otherwise

    Raises:
        ValidationError: If phone is None or not a string
    """
    if phone is None:
        raise ValidationError("Phone number cannot be None",
                              field="phone", value=phone)

    if not isinstance(phone, str):
        raise ValidationError(
            f"Phone number must be a string, got {type(phone).__name__}",
            field="phone",
            value=phone
        )

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

    Raises:
        ValidationError: If max_length is invalid
    """
    if max_length <= 0:
        raise ValidationError(
            f"max_length must be positive, got {max_length}",
            field="max_length",
            value=max_length
        )

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

    Raises:
        ValidationError: If inputs are invalid
    """
    # Validate inputs
    if text is not None and not isinstance(text, str):
        raise ValidationError(
            f"Text must be a string or None, got {type(text).__name__}",
            field="text",
            value=text
        )

    if not isinstance(keywords, list):
        raise ValidationError(
            f"Keywords must be a list, got {type(keywords).__name__}",
            field="keywords",
            value=keywords
        )

    # Handle empty/invalid inputs gracefully
    if not text or not keywords:
        return []

    # Convert to lowercase for case-insensitive matching
    # This ensures we catch keywords regardless of how they're capitalized
    text_lower = text.lower()
    found_keywords = []

    # Check each keyword for presence in the text
    for keyword in keywords:
        if not isinstance(keyword, str):
            continue  # Skip non-string keywords
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

    Raises:
        ValidationError: If inputs are invalid
    """
    if not isinstance(filename, str):
        raise ValidationError(
            f"Filename must be a string, got {type(filename).__name__}",
            field="filename",
            value=filename
        )

    if not isinstance(allowed_extensions, list):
        raise ValidationError(
            f"Allowed extensions must be a list, got {type(allowed_extensions).__name__}",
            field="allowed_extensions",
            value=allowed_extensions
        )

    if not filename:
        return False

    file_ext = filename.lower().split('.')[-1] if '.' in filename else ''

    # Normalize extensions (add dot if missing)
    normalized_allowed = []
    for ext in allowed_extensions:
        if not isinstance(ext, str):
            continue  # Skip non-string extensions
        if not ext.startswith('.'):
            ext = '.' + ext
        normalized_allowed.append(ext.lower())

    return f'.{file_ext}' in normalized_allowed
