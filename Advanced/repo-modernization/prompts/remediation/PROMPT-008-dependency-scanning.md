# PROMPT-008 — Dependency Scanning & Vulnerability Remediation (P1)

## Objective
Add automated dependency vulnerability scanning to CI and remediate known issues in the deployed agent-platform (2 moderate npm advisories).

## Problem Description
`npm audit` on agent-platform reports 2 moderate PostCSS vulnerabilities via Next.js. No Dependabot, Renovate, pip-audit, cargo audit, or container scanning exists in any workflow.

## Root Cause
Supply-chain governance was out of scope for task deliverables; no central security scanning policy.

## Desired Outcome
- `.github/dependabot.yml` for npm, pip, cargo, GitHub Actions.
- CI job running `npm audit --audit-level=high`, `pip-audit`, `cargo audit` (fail on high/critical).
- agent-platform: bump Next.js to patched version resolving GHSA-qx2v-qp2m-jg93 (test thoroughly).
- Optional: Trivy scan on Docker images in A2/D3 workflows.

## Functional Requirements
1. Dependabot weekly PRs for root + agent-platform + each package.json/requirements.txt.
2. CI audit stage in monorepo-verify or dedicated security.yml.
3. Document accepted risks for unfixable lows in `SECURITY.md`.

## Non-Functional Requirements
- Audit stage ≤ 5 min.
- Do not auto-merge Dependabot without CI pass.

## Technical Constraints
- Next.js upgrade may require code changes — read `agent-platform/AGENTS.md`.
- pip-audit needs locked or pinned requirements for accuracy.

## Best Practices
- Fail CI only on high/critical; warn on moderate.
- SBOM export via `syft` optional artifact.
- Pin GitHub Actions to SHA for supply chain.

## Implementation Steps
1. Run audits locally; capture baseline.
2. Upgrade agent-platform Next.js; run tests (PROMPT-002).
3. Add dependabot.yml.
4. Add security-audit.yml workflow.
5. Fix or document each finding.

## Files/Modules to Modify
- `.github/dependabot.yml` (new)
- `.github/workflows/security-audit.yml` (new)
- `agent-platform/package.json`, `package-lock.json`
- `SECURITY.md` (new at root)

## Testing Requirements
- `npm audit --omit=dev` returns 0 high/critical after remediation.
- CI audit job green on main.

## Verification Steps
```bash
cd agent-platform && npm audit --omit=dev
pip-audit -r Basics/fastapi-transaction-service/requirements.txt
cargo audit --manifest-path Advanced/polyglot-fraud-system/rust-engine/Cargo.toml
```

## Documentation Requirements
- SECURITY.md: scanning policy, update cadence, exception process.

## Acceptance Criteria
- [ ] Dependabot configured
- [ ] CI audit job running
- [ ] agent-platform moderate vulns resolved or documented with mitigation
- [ ] No high/critical unaddressed

## Expected Score Improvement
Security +1.5, CI/CD +1.0 → **+2.5 points**

## Production-Grade Recommendations
- Snyk or GitHub Advanced Security integration.
- Image signing with cosign on published containers.
