# PROMPT-023 — Digest-Pin Container Base Images (P3)

## Objective
Pin all Docker base images to immutable SHA256 digests instead of floating tags (`python:3.12-slim`, `node:22-slim`).

## Problem Description
Dockerfiles use mutable tags — supply-chain drift if upstream tags are retagged or compromised. K8s/terraform demos pin versions but container bases do not.

## Root Cause
Standard Dockerfile tutorials use tag-based FROM lines.

## Desired Outcome
- All Dockerfiles: `FROM python:3.12-slim@sha256:...` format.
- Script or Dependabot to check digest freshness monthly.
- CI fails if digest comment older than 90 days (optional warn).

## Functional Requirements
1. Audit every Dockerfile in repo.
2. Resolve current digests via `docker buildx imagetools inspect`.
3. Document update process in DevOps RUNBOOK.

## Non-Functional Requirements
- Reproducible builds across machines.
- Document arch (amd64) assumption for CI.

## Technical Constraints
- Multi-arch images if M1 devs build locally — document platform.
- Rebuild all images after pin update.

## Best Practices
- Pin distroless or slim variants consistently.
- Combine with Trivy scan (PROMPT-008).

## Implementation Steps
1. List Dockerfiles: `find . -name Dockerfile`.
2. For each base image, fetch digest from Docker Hub.
3. Update FROM lines.
4. Rebuild and run smoke tests (a2-docker-smoke, ci container job).
5. Add RUNBOOK section "Updating base image digests."

## Files/Modules to Modify
- All `**/Dockerfile` in repo
- `DevOps-Infra/RUNBOOK.md`

## Testing Requirements
- Docker builds succeed on linux/amd64.
- Smoke tests pass.

## Verification Steps
```bash
grep '@sha256:' **/Dockerfile | wc -l  # equals Dockerfile count
make a2-docker-smoke  # if docker available
```

## Documentation Requirements
- RUNBOOK: digest update cadence and commands.

## Acceptance Criteria
- [ ] All FROM lines digest-pinned
- [ ] Builds green
- [ ] RUNBOOK updated

## Expected Score Improvement
Security +0.5, DevOps +0.5 → **+1.0 points**

## Production-Grade Recommendations
- Use Renovate docker digest pinning.
- Sign images with cosign after PROMPT-009.
