"""Shared pytest fixtures for the D3 service test suite."""

import json
import zipfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app

REPO_ROOT = Path(__file__).resolve().parent.parent
# Members the Stage-4 build artifact must contain (mirrors ci.yml / run-ci-local.sh).
ARTIFACT_MEMBERS = ("app/", "app/main.py", "app/calc.py", "requirements.txt", "build-info.json")


@pytest.fixture(scope="session")
def client() -> TestClient:
    """A FastAPI TestClient bound to the real app (exercises middleware too)."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def build_artifact(tmp_path: Path) -> dict:
    """Reproduce the Stage-4 packaging into a temp dir and return its metadata.

    Mirrors the workflow's build step (build-info.json + zip of app + reqs) so the
    artifact *contract* — not just the live pipeline — is asserted in unit time.
    """
    info = {
        "commit": "deadbeef",
        "run": "1",
        "ref": "refs/heads/test",
        "built_at": "2026-06-22T00:00:00Z",
    }
    info_path = tmp_path / "build-info.json"
    info_path.write_text(json.dumps(info))

    zip_path = tmp_path / "d3-app-test.zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for rel in ("app/__init__.py", "app/main.py", "app/calc.py", "requirements.txt"):
            zf.write(REPO_ROOT / rel, rel)
        zf.write(info_path, "build-info.json")

    return {"zip_path": zip_path, "info_path": info_path, "info": info}
