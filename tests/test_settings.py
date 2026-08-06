"""Tests for settings configuration."""

from src.config.settings import Settings


class TestSettingsDefaults:
    """Tests for default settings values."""

    def test_database_url_default(self):
        """Verify default database URL is set."""
        settings = Settings()
        assert settings.db_url is not None
        assert "postgresql" in settings.db_url

    def test_ollama_host_default(self):
        """Verify default Ollama host is localhost."""
        settings = Settings()
        assert settings.ollama_host == "http://localhost:11434"

    def test_ollama_model_default(self):
        """Verify default Ollama model is set."""
        settings = Settings()
        assert settings.ollama_model == "llama3.1:8b-instruct-q4_K_M"

    def test_embed_model_default(self):
        """Verify default embedding model is set."""
        settings = Settings()
        assert settings.embed_model == "BAAI/bge-small-en-v1.5"

    def test_web_ui_defaults(self):
        """Verify default web UI settings."""
        settings = Settings()
        assert settings.start_web_ui is True
        assert settings.web_port == 8000
        assert settings.web_host == "127.0.0.1"  # B104 fix: bind to localhost by default

    def test_ocr_defaults(self):
        """Verify default OCR settings."""
        settings = Settings()
        assert settings.ocr_dpi == 300
        assert settings.ocr_confidence_threshold == 0.75
        assert settings.ocr_lang == "en"

    def test_chunking_defaults(self):
        """Verify default chunking configuration."""
        settings = Settings()
        assert settings.parent_chunk_size == 1024
        assert settings.parent_chunk_overlap == 128
        assert settings.child_chunk_size == 256
        assert settings.child_chunk_overlap == 32


class TestSettingsProperties:
    """Tests for settings computed properties."""

    def test_max_upload_size_bytes(self):
        """Verify max_upload_size_bytes conversion."""
        settings = Settings()
        assert settings.max_upload_size_bytes == settings.max_upload_size_mb * 1024 * 1024

    def test_max_upload_size_bytes_custom(self):
        """Verify custom max_upload_size_mb affects bytes conversion."""
        settings = Settings(max_upload_size_mb=50)
        assert settings.max_upload_size_bytes == 50 * 1024 * 1024


class TestSettingsOverrides:
    """Tests for settings environment overrides."""

    def test_can_override_db_url(self, monkeypatch):
        """Verify database URL can be overridden via env."""
        monkeypatch.setenv("DB_URL", "postgresql://user:pass@host:5432/db")
        settings = Settings()
        assert settings.db_url == "postgresql://user:pass@host:5432/db"

    def test_can_override_ollama_host(self, monkeypatch):
        """Verify Ollama host can be overridden via env."""
        monkeypatch.setenv("OLLAMA_HOST", "http://custom:11434")
        settings = Settings()
        assert settings.ollama_host == "http://custom:11434"

    def test_can_override_web_port(self, monkeypatch):
        """Verify web port can be overridden via env."""
        monkeypatch.setenv("WEB_PORT", "9000")
        settings = Settings()
        assert settings.web_port == 9000
