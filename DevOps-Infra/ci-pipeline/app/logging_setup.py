"""Structured JSON logging for the D3 service.

Emits one machine-readable JSON object per log record on stdout (12-factor:
logs are an event stream). Every request log carries:
  timestamp, level, logger, message, request_id, method, path,
  status_code, duration_ms, client — and, on failure, an `error` stack trace.

Pattern reused from the sibling ``DevOps-Infra/observability-bolt-on`` service so
the whole DevOps-Infra estate shares one log schema.
"""

import json
import logging
import sys
from datetime import UTC, datetime

# Extra fields promoted from the record (set via ``logger.info(..., extra={...})``).
_CONTEXT_FIELDS = ("request_id", "method", "path", "status_code", "duration_ms", "client")


class JsonFormatter(logging.Formatter):
    """Render each log record as a single-line JSON document."""

    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": datetime.fromtimestamp(record.created, tz=UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        for field in _CONTEXT_FIELDS:
            value = getattr(record, field, None)
            if value is not None:
                payload[field] = value
        if record.exc_info:
            payload["error"] = self.formatException(record.exc_info)
        return json.dumps(payload, default=str)


def configure_logging(level: str = "INFO") -> logging.Logger:
    """Install the JSON formatter on the root + uvicorn loggers; return the app logger."""
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())

    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(level)

    # Route uvicorn's loggers through the same JSON handler; suppress its
    # duplicate plain-text access line (we emit our own structured access log).
    for name in ("uvicorn", "uvicorn.error"):
        lg = logging.getLogger(name)
        lg.handlers = [handler]
        lg.propagate = False
    access = logging.getLogger("uvicorn.access")
    access.handlers = []
    access.propagate = False

    return logging.getLogger("d3")
