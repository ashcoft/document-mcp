"""Pytest configuration and fixtures."""
import pytest


@pytest.fixture
def sample_content():
    """Sample byte content for testing."""
    return b"Hello, World!"


@pytest.fixture
def sample_text():
    """Sample text content for testing."""
    return "Hello, World!"
