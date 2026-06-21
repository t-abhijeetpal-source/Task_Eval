# currency-core

Shared, versioned Python package holding the **single canonical implementation** of the
currency-conversion logic used by two services in this monorepo:

| Consumer | Path | Role |
|---|---|---|
| I4 — polyglot service | `Intermediate/polyglot-currency-pair/fastapi-service` | FastAPI service + Node CLI client |
| I5 — dockerized service | `Intermediate/dockerize-service` | Same service, containerized |

Both consumers ship only a thin `app/main.py` that creates a FastAPI app (its own
title/description) and mounts `currency_core.routes.router`.

## Contents

```
currency_core/
  schemas.py    # ConvertRequest / ConvertResponse (Pydantic v2)
  services.py   # convert() + typed errors + hardcoded rates  (business logic)
  routes.py     # APIRouter exposing POST /convert and GET /health
```

## Install (editable, for local dev / tests)

```bash
# From a consumer service directory:
pip install -e ../shared/currency-core          # I5 (dockerize-service)
pip install -e ../../shared/currency-core        # I4 (fastapi-service)
```

The package declares its own runtime deps (`fastapi`, `pydantic`), so an editable
install pulls them in automatically.

## Test the core in isolation

```bash
cd Intermediate/shared/currency-core
pip install -e ".[dev]"
pytest -v
```

## Versioning

Version lives in `pyproject.toml` (`0.1.0`). Bump it on any contract or behavior change.
See the **Production-grade** note below for the internal-publish / release path.

## Production-grade follow-ups

- Publish to an internal index (e.g. a private PyPI / CodeArtifact) with semver tags
  instead of relying on the editable path install.
- Add a changeset/release workflow so consumers pin a published version rather than the
  working-tree source.
