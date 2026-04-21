FROM python:3.11-slim

WORKDIR /app

# git is required for the membase SDK install from GitHub
RUN apt-get update \
    && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*

# Install core deps first (cached layer — only rebuilds if requirements.txt changes)
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Install membase SDK separately — non-fatal if GitHub is slow or unavailable.
# App degrades gracefully: local JSON remains primary storage.
RUN pip install --no-cache-dir \
    "git+https://github.com/unibaseio/membase-sdk-py.git" \
    || echo "[warn] membase SDK install failed — hub uploads will be disabled"

# Copy application code and static content data
COPY backend/ ./backend/
COPY content/ ./content/

# Railway injects PORT at runtime. Shell form of CMD expands env vars correctly.
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
