FROM python:3.12-slim

WORKDIR /app

# Install system dependencies and uv in one layer
# Note: Packages sorted alphabetically for maintainability
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        ca-certificates \
        curl \
        gnupg \
    && rm -rf /var/lib/apt/lists/* \
    && curl -LsSf https://astral.sh/uv/0.12.1/install.sh | sh \
    && mv /root/.local/bin/uv /usr/local/bin/ \
    && mv /root/.local/bin/uvx /usr/local/bin/ \
    && rm -rf /root/.local/bin

ENV PATH="/usr/local/bin:$PATH"

# Copy requirements first for caching
COPY requirements.txt .

# Install Python dependencies using uv (faster resolution)
RUN UV_NO_PROMPT=1 uv pip install --system -r requirements.txt

# Create non-root user for security
RUN useradd -m app && chown -R app:app /app
USER app

# Copy application code
COPY --chown=app:app src/ ./src/
COPY --chown=app:app alembic/ ./alembic/
COPY --chown=app:app alembic.ini .
COPY --chown=app:app pyproject.toml .

# Set Python path
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Expose port
EXPOSE 8000

# Health check - using HTTPS with CA certs
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl --cacert /etc/ssl/certs/ca-certificates.crt -f https://localhost:8000/health 2>/dev/null || curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["python", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
