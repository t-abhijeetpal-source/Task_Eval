"""Validate the Stage-4 build artifact: zip contents + build-info.json schema."""

import datetime as dt
import json
import zipfile

from tests.conftest import ARTIFACT_MEMBERS

REQUIRED_INFO_KEYS = {"commit", "built_at"}


def test_artifact_zip_is_valid_and_complete(build_artifact):
    zip_path = build_artifact["zip_path"]
    assert zip_path.exists()
    with zipfile.ZipFile(zip_path) as zf:
        assert zf.testzip() is None  # no corrupt members
        names = set(zf.namelist())
    for member in ("app/main.py", "app/calc.py", "requirements.txt", "build-info.json"):
        assert member in names


def test_build_info_schema(build_artifact):
    info = json.loads(build_artifact["info_path"].read_text())
    assert REQUIRED_INFO_KEYS <= info.keys()
    assert isinstance(info["commit"], str) and info["commit"]


def test_build_info_timestamp_is_iso8601_utc(build_artifact):
    built_at = build_artifact["info"]["built_at"]
    parsed = dt.datetime.strptime(built_at, "%Y-%m-%dT%H:%M:%SZ")
    assert parsed.year >= 2024


def test_artifact_members_constant_matches_packaging(build_artifact):
    with zipfile.ZipFile(build_artifact["zip_path"]) as zf:
        names = set(zf.namelist())
    # Every advertised member (files, not the dir prefix) is actually packaged.
    for member in (m for m in ARTIFACT_MEMBERS if not m.endswith("/")):
        assert member in names
