# Task_Eval Remediation Prompts — Index

Self-contained AI agent prompts to resolve findings from
`docs/agent-analysis/A4_engineering_evaluation_audit.md`.

Each prompt can be handed to Claude Code, Cursor, Codex, or Gemini CLI with write access to this repository.

## Execution Order (recommended)

### P0 — Production gate blockers
| Prompt | Title | Expected Δ |
|---|---|---|
| [PROMPT-001](./PROMPT-001-monorepo-ci-gate.md) | Monorepo-wide CI | +3.5 |
| [PROMPT-002](./PROMPT-002-agent-platform-ci-tests.md) | agent-platform CI/tests | +4.5 |
| [PROMPT-003](./PROMPT-003-agent-platform-data-integrity.md) | Demo data honesty | +3.0 |
| [PROMPT-004](./PROMPT-004-service-security-baseline.md) | Security baseline | +3.5 |

### P1 — High priority
| Prompt | Title | Expected Δ |
|---|---|---|
| [PROMPT-008](./PROMPT-008-dependency-scanning.md) | Dependency scanning | +2.5 |
| [PROMPT-006](./PROMPT-006-coverage-gates.md) | Coverage gates | +2.0 |
| [PROMPT-005](./PROMPT-005-integer-money-units.md) | Integer money | +2.0 |
| [PROMPT-007](./PROMPT-007-a3-e2e-and-sqlite-hardening.md) | A3 E2E + SQLite | +2.0 |
| [PROMPT-009](./PROMPT-009-unified-deploy-path.md) | Unified deploy path | +3.5 |

### P2 — Medium priority
| Prompt | Title | Expected Δ |
|---|---|---|
| [PROMPT-011](./PROMPT-011-monorepo-lint-precommit.md) | Lint + pre-commit | +1.5 |
| [PROMPT-010](./PROMPT-010-python-lockfiles.md) | Python lockfiles | +1.0 |
| [PROMPT-012](./PROMPT-012-remove-dead-ci.md) | Remove dead CI | +1.0 |
| [PROMPT-018](./PROMPT-018-expand-make-test.md) | Expand make test | +1.0 |
| [PROMPT-013](./PROMPT-013-extract-shared-fastapi-core.md) | Shared FastAPI core | +1.5 |
| [PROMPT-014](./PROMPT-014-dependency-injection-refactor.md) | DI refactor | +1.5 |
| [PROMPT-015](./PROMPT-015-nonroot-containers.md) | Non-root containers | +1.0 |
| [PROMPT-016](./PROMPT-016-secrets-hygiene-demos.md) | Demo secrets | +0.5 |
| [PROMPT-017](./PROMPT-017-agent-platform-security-headers.md) | Security headers | +0.5 |
| [PROMPT-019](./PROMPT-019-operational-docs.md) | Operational docs | +1.0 |

### P3 — Lower priority
| Prompt | Title | Expected Δ |
|---|---|---|
| [PROMPT-020](./PROMPT-020-repo-hygiene.md) | Repo hygiene | +1.0 |
| [PROMPT-021](./PROMPT-021-a2-layered-architecture.md) | A2 layering | +0.5 |
| [PROMPT-022](./PROMPT-022-distributed-tracing.md) | Distributed tracing | +1.0 |
| [PROMPT-023](./PROMPT-023-digest-pin-base-images.md) | Digest-pinned images | +1.0 |
| [PROMPT-024](./PROMPT-024-bug-diagnosis-idor.md) | IDOR fix | +0.5 |

## Usage

```text
You are a senior engineer. Read and execute every step in:
Advanced/repo-modernization/prompts/remediation/PROMPT-XXX-*.md

Repository root: /path/to/Task_Eval
Do not mark complete without verification evidence.
```

## Related artifacts

- Prior modernization scan: `A4_modernization_plan.md`
- Full audit (2026-06-19): `../../docs/final-audit/final-scorecard.md`
- This audit (2026-06-21): `../docs/agent-analysis/A4_engineering_evaluation_audit.md`
