# PROMPT-016 — Demo Secrets Hygiene (P2)

## Objective
Harden credentials in DevOps demo stacks: remove Grafana admin/admin defaults, disable anonymous access by default, and migrate compose secrets to env files or Docker secrets.

## Problem Description
`observability-bolt-on/docker-compose.yml` uses Grafana `admin/admin` with anonymous Viewer enabled. Compose postgres uses plaintext `apppass` in YAML. Acceptable for local demo labels but fails security review when presented as "production-grade infra."

## Root Cause
Demo convenience prioritized over security theater expectations.

## Desired Outcome
- Grafana: require `GF_SECURITY_ADMIN_PASSWORD` from `.env` (no default in compose); anonymous auth disabled unless `GRAFANA_ANONYMOUS=true`.
- Postgres: use `env_file: .env` or Docker secrets; `.env.example` documents generation.
- README warnings: "Demo credentials — never use in production."

## Functional Requirements
1. Compose services fail fast if required secrets missing (when `REQUIRE_SECRETS=1`).
2. Default local dev: `.env.example` copied by `make setup-env` with random password generator optional.
3. Tests use fixed test credentials via env override.

## Non-Functional Requirements
- One-command local start still works after `make setup-env`.
- No secrets committed to git.

## Technical Constraints
- Do not break observability demo pytest (may mock external deps).
- Keep kind/k8s demos separate — add K8s Secret example (PROMPT-009 companion).

## Best Practices
- `docker secret` or compose secrets for swarm-compatible pattern.
- Rotate credentials documented in runbook.

## Implementation Steps
1. Move passwords to `.env.example` placeholders.
2. Update compose files to reference env vars.
3. Disable Grafana anonymous by default.
4. Add startup script check for default passwords in production mode.
5. Update observability README with setup steps.

## Files/Modules to Modify
- `DevOps-Infra/observability-bolt-on/docker-compose.yml`
- `DevOps-Infra/docker-compose-stack/docker-compose.yml`
- `.env.example` (root or per-stack)
- Stack READMEs

## Testing Requirements
- `docker compose config` validates.
- Manual smoke: Grafana login with env password works.

## Verification Steps
```bash
cp .env.example .env
docker compose -f DevOps-Infra/observability-bolt-on/docker-compose.yml up -d
# login with env password
```

## Documentation Requirements
- Bold warning in README: demo-only credentials.

## Acceptance Criteria
- [ ] No hardcoded admin/admin in committed compose
- [ ] Anonymous Grafana disabled by default
- [ ] Local dev still one-command with .env

## Expected Score Improvement
Security +0.5 → **+0.5 points**

## Production-Grade Recommendations
- Hashicorp Vault or AWS Secrets Manager for real deployments.
- Sealed secrets for K8s.
