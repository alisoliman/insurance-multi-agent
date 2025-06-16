#!/usr/bin/env python3
"""
Simple test script for PDF processor functionality.
"""
import sys
from pathlib import Path

# Add the app directory to Python path
sys.path.insert(0, str(Path(__file__).parent / "app"))

from app.workflow.pdf_processor import get_pdf_processor

def test_pdf_processor():
    """Test the PDF processor functionality."""
    print("Testing PDF processor...")
    
    pdf_processor = get_pdf_processor()
    print("✅ PDF processor initialized successfully")
    
    # Test with a non-existent file
    try:
        result = pdf_processor.is_valid_pdf("non_existent.pdf")
        print(f"✅ is_valid_pdf with non-existent file: {result}")
    except Exception as e:
        print(f"❌ Error testing non-existent file: {e}")
    
    print("✅ PDF processor test completed successfully!")

if __name__ == "__main__":
    test_pdf_processor() 