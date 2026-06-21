# PROMPT-015 — Non-Root Container Users (P2)

## Objective
Add non-root `USER` directives to DevOps Dockerfiles that currently run as root: docker-compose-stack and ci-pipeline images.

## Problem Description
K8s and observability demos correctly drop privileges (`runAsUser:10001`), but `DevOps-Infra/docker-compose-stack/` and `ci-pipeline` Dockerfiles lack `USER` — containers run as root. Evaluators flag inconsistent security posture.

## Root Cause
Minimal Dockerfile templates for learning tasks omitted USER directive.

## Desired Outcome
- All Dockerfiles create app user (uid 10001 to match K8s), `chown` app dirs, `USER appuser`.
- Compose still works without volume permission issues.
- CI container build + smoke tests pass.

## Functional Requirements
1. Update each Dockerfile: add user, drop to non-root before CMD.
2. Ensure write paths (tmp, logs) owned by appuser or use tmpfs.
3. Document in DevOps READMEs.

## Non-Functional Requirements
- Image size increase negligible.
- No runtime permission denied errors.

## Technical Constraints
- Test with `docker run --user` verification.
- ci-pipeline CI workflow must still build and run.

## Best Practices
- Match K8s uid 10001 for consistency.
- Use multi-stage build: root only in build stage.

## Implementation Steps
1. Audit all Dockerfiles: `grep -L USER DevOps-Infra/**/Dockerfile`.
2. Add RUN groupadd/useradd pattern (Debian slim).
3. Rebuild and run container smoke tests.
4. Update D3 CI workflow if needed.

## Files/Modules to Modify
- `DevOps-Infra/docker-compose-stack/**/Dockerfile`
- `DevOps-Infra/ci-pipeline/Dockerfile`
- Any compose files mounting volumes

## Testing Requirements
- `docker run` → `whoami` ≠ root inside container.
- Existing pytest/compose smoke green.

## Verification Steps
```bash
docker build -t test-ci DevOps-Infra/ci-pipeline
docker run --rm test-ci whoami  # expect appuser or uid 10001
```

## Documentation Requirements
- Note non-root requirement in docker-compose-stack README.

## Acceptance Criteria
- [ ] All DevOps Dockerfiles run as non-root
- [ ] CI container stage green
- [ ] Compose stack starts healthy

## Expected Score Improvement
Security +0.5, DevOps +0.5 → **+1.0 points**

## Production-Grade Recommendations
- Read-only root filesystem + tmpfs /tmp in compose.
- Trivy scan for USER directive in CI.
