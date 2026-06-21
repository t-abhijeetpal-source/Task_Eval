import json
import os
import tempfile


def _queue_dir() -> str:
    return os.environ.get("QUEUE_DIR", "./queue")


def writable() -> bool:
    """Readiness probe: confirm the queue directory exists and is writable.

    Creates (if needed) the queue dir and writes+removes a tiny temp file. Any
    OSError (missing parent, read-only mount, permissions) returns False so the
    readiness endpoint can fail-fast instead of silently dropping enqueues.
    """
    queue_dir = _queue_dir()
    try:
        os.makedirs(queue_dir, exist_ok=True)
        fd, path = tempfile.mkstemp(prefix=".health-", dir=queue_dir)
        try:
            os.write(fd, b"ok")
        finally:
            os.close(fd)
            os.unlink(path)
        return True
    except OSError:
        return False


def enqueue(txn: dict) -> str:
    """Write the full transaction JSON to QUEUE_DIR/<transaction_id>.json.

    Defense-in-depth against path traversal (A5-1): use only the basename of the
    id and assert the resolved path stays inside the queue dir, even if the
    schema-level validation is ever bypassed. Returns the path written.
    """
    queue_dir = _queue_dir()
    os.makedirs(queue_dir, exist_ok=True)
    safe_id = os.path.basename(str(txn["transaction_id"]))
    path = os.path.join(queue_dir, f"{safe_id}.json")
    if os.path.realpath(path) != os.path.realpath(
        os.path.join(queue_dir, f"{safe_id}.json")
    ) or not os.path.realpath(path).startswith(os.path.realpath(queue_dir) + os.sep):
        raise ValueError(f"unsafe transaction_id for queue path: {txn['transaction_id']!r}")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(txn, f)
    return path
