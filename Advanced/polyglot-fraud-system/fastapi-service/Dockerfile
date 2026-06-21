# A3 FastAPI ingestion service — pinned to the verified Python 3.12.7.
FROM python:3.12.7-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    QUEUE_DIR=/queue \
    DATABASE_URL=sqlite:////data/a3.db

WORKDIR /app

# Install deps first for layer caching.
COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -r requirements.txt

COPY app ./app

# Writable data + queue dirs; run as non-root.
RUN mkdir -p /queue /data && \
    adduser --disabled-password --gecos "" appuser && \
    chown -R appuser:appuser /app /queue /data
USER appuser

EXPOSE 8000

# Readiness-based container healthcheck (DB + queue writable).
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=5 \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://localhost:8000/health/ready').status==200 else 1)" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
