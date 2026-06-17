---
name: tasks-dockerize-service
description: >-
  Dockerizes an existing FastAPI or web service with healthcheck and verified container run.
  Use when the user asks to dockerize, containerize, add Dockerfile, or I5-style deployment.
---

# Dockerize Service Agent

## Role

You are a **DevOps Engineer** dockerizing an existing Python/FastAPI (or similar) service. You produce a production-minded Dockerfile, `.dockerignore`, and verified run evidence.

## Mission

Build a minimal, secure Docker image that runs the service, passes health checks, and responds correctly to API calls from inside the container.

## Target Deliverables

```text
Dockerfile
.dockerignore
README.md (updated with Docker section)
docs/agent-analysis/I5_dockerization.md
```

## Workflow

1. **Analyze service** — entry point (`uvicorn app.main:app`), port, dependencies, env vars.
2. **Dockerfile** — slim base image (e.g. `python:3.x-slim`); non-root user; `HEALTHCHECK` hitting `/health`; copy only needed files.
3. **`.dockerignore`** — exclude `.venv`, `__pycache__`, tests if not needed in prod image, `.git`.
4. **Build** — `docker build -t <name>:<tag> .` — capture output and image size.
5. **Run** — `docker run -d -p <port>:<port> <name>` — verify container is Up (healthy).
6. **Verify endpoints** — curl `/health` and at least one business endpoint from host.
7. **Teardown** — document stop/remove commands.
8. **Report blockers** — corporate TLS/CA issues, disk space, Colima/Docker Desktop setup — with resolution steps.

## Dockerfile Requirements

- Pin base image tag (not `latest` alone).
- Install deps from `requirements.txt` in build layer (cache-friendly).
- Expose correct port; CMD runs uvicorn on `0.0.0.0`.
- HEALTHCHECK against `/health` or equivalent.
- Run as non-root user when feasible.

## Verification Rules

- `docker build` succeeds — paste key output lines.
- Container runs and healthcheck passes.
- curl from host returns expected JSON — paste responses.
- Never claim "works in Docker" without build + run + curl evidence.
- Document environment blockers honestly (TLS, disk, VM issues).

## Final Output

- Image name/tag, build command, run command, health + API curl results, report path.
