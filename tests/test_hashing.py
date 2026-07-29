"""Tests for hashing utilities."""

import hashlib

from src.common.hashing import (
    compute_content_hash,
    compute_file_hash,
    compute_text_hash,
)


class TestComputeContentHash:
    """Tests for compute_content_hash function."""

    def test_computes_correct_hash(self, sample_content):
        """Verify the hash matches manually computed SHA-256."""
        expected = hashlib.sha256(sample_content).hexdigest()
        assert compute_content_hash(sample_content) == expected  # noqa

    def test_deterministic(self, sample_content):
        """Same content should produce same hash."""
        hash1 = compute_content_hash(sample_content)
        hash2 = compute_content_hash(sample_content)
        assert hash1 == hash2  # noqa

    def test_different_content_different_hash(self):
        """Different content should produce different hashes."""
        hash1 = compute_content_hash(b"content a")
        hash2 = compute_content_hash(b"content b")
        assert hash1 != hash2  # noqa

    def test_empty_content(self):
        """Empty content should produce known hash."""
        expected = hashlib.sha256(b"").hexdigest()
        assert compute_content_hash(b"") == expected  # noqa

    def test_unicode_content(self):
        """Unicode content should hash correctly."""
        content = "こんにちは世界".encode("utf-8")
        expected = hashlib.sha256(content).hexdigest()
        assert compute_content_hash(content) == expected  # noqa


class TestComputeTextHash:
    """Tests for compute_text_hash function."""

    def test_computes_correct_hash(self, sample_text):
        """Verify the hash matches manually computed SHA-256."""
        expected = hashlib.sha256(sample_text.encode("utf-8")).hexdigest()
        assert compute_text_hash(sample_text) == expected  # noqa

    def test_deterministic(self, sample_text):
        """Same text should produce same hash."""
        hash1 = compute_text_hash(sample_text)
        hash2 = compute_text_hash(sample_text)
        assert hash1 == hash2  # noqa

    def test_different_text_different_hash(self):
        """Different text should produce different hashes."""
        hash1 = compute_text_hash("text a")
        hash2 = compute_text_hash("text b")
        assert hash1 != hash2  # noqa

    def test_empty_text(self):
        """Empty text should produce known hash."""
        expected = hashlib.sha256(b"").hexdigest()
        assert compute_text_hash("") == expected  # noqa

    def test_unicode_text(self):
        """Unicode text should hash correctly."""
        text = "こんにちは世界"
        expected = hashlib.sha256(text.encode("utf-8")).hexdigest()
        assert compute_text_hash(text) == expected  # noqa


class TestComputeFileHash:
    """Tests for compute_file_hash function."""

    def test_computes_correct_hash(self, tmp_path):
        """Verify file hash matches expected SHA-256."""
        test_file = tmp_path / "test.txt"
        content = b"Test content"
        test_file.write_bytes(content)

        expected = hashlib.sha256(content).hexdigest()
        assert compute_file_hash(str(test_file)) == expected  # noqa

    def test_deterministic(self, tmp_path):
        """Same file should produce same hash."""
        test_file = tmp_path / "test.txt"
        test_file.write_bytes(b"Test content")

        hash1 = compute_file_hash(str(test_file))
        hash2 = compute_file_hash(str(test_file))
        assert hash1 == hash2  # noqa

    def test_large_file(self, tmp_path):
        """Large file should hash correctly using chunks."""
        test_file = tmp_path / "large.txt"
        # Write more than 64KB to test chunking
        content = b"A" * 100_000
        test_file.write_bytes(content)

        expected = hashlib.sha256(content).hexdigest()
        assert compute_file_hash(str(test_file)) == expected  # noqa

    def test_empty_file(self, tmp_path):
        """Empty file should produce known hash."""
        test_file = tmp_path / "empty.txt"
        test_file.write_bytes(b"")

        expected = hashlib.sha256(b"").hexdigest()
        assert compute_file_hash(str(test_file)) == expected  # noqa

    def test_pathlib_path(self, tmp_path):
        """Should accept Path objects."""
        test_file = tmp_path / "test.txt"
        test_file.write_bytes(b"Test content")

        # This should work without raising an error
        result = compute_file_hash(test_file)
        assert isinstance(result, str)  # noqa
        assert len(result) == 64  # SHA-256 hex length  # noqa
