# PROMPT-009 — Unified Deploy Path for DevOps Demos (P1)

## Objective
Connect the DevOps-Infra tier into a coherent, documentable deploy path — container registry, promoted environments, and a single canonical service image — instead of isolated demos.

## Problem Description
Terraform was never applied (mock creds, local state). K8s uses kind side-loaded images. CI builds containers with `push: false`. Each DevOps task duplicates a FastAPI app. Evaluators score **shipability**, not manifest craft alone.

## Root Cause
Tasks were designed as independent learning artifacts without integration into one deployment story.

## Desired Outcome
- One **canonical service** (`DevOps-Infra/ci-pipeline/app` or A2 expense-tracker) built once, deployed everywhere.
- CI publishes image to GHCR (`ghcr.io/<org>/task-eval-service:sha`) on main merge.
- Terraform: remote state backend documented; `terraform plan` in CI (no apply without creds).
- K8s manifests reference published image tag, not `kind load`.
- docker-compose-stack uses same image from registry or local build arg.
- Documented path: commit → CI → image → staging (compose) → prod (K8s manifest apply).

## Functional Requirements
1. Enable `push: true` to GHCR in CI with `GITHUB_TOKEN` permissions.
2. Update K8s deployment image reference to `ghcr.io/...`.
3. Add `terraform validate` + `tflint` CI job.
4. Add `kubeconform` or `kubectl apply --dry-run=server` for manifests.
5. Root `docs/DEPLOYMENT.md` with step-by-step.

## Non-Functional Requirements
- Image tags immutable (SHA, not `:latest` in prod).
- Secrets via GitHub Actions secrets / K8s Secret (not plaintext in compose for prod doc).

## Technical Constraints
- Do not require real AWS credentials for CI — plan/validate only.
- Keep demos runnable locally without cloud (`docker compose up`).

## Best Practices
- Multi-stage Dockerfile (builder + slim runtime).
- Semantic versioning tags on release branches.
- Environment promotion: dev → staging → prod checklist.

## Implementation Steps
1. Choose canonical app (recommend A2 or ci-pipeline).
2. Consolidate duplicate FastAPI copies or document why not.
3. Update `.github/workflows/ci.yml` container job: push to GHCR.
4. Add terraform-validate.yml, k8s-validate.yml workflows.
5. Write DEPLOYMENT.md with mermaid pipeline diagram.
6. Update K8s deployment.yaml image field.

## Files/Modules to Modify
- `.github/workflows/ci.yml` (container push)
- `DevOps-Infra/kubernetes-manifests/k8s/deployment.yaml`
- `DevOps-Infra/terraform-aws-stack/` (validate only)
- `docs/DEPLOYMENT.md` (new)
- Optionally consolidate duplicate app folders

## Testing Requirements
- CI: image push succeeds (test on fork if needed).
- `terraform validate` green.
- `kubeconform` passes on manifests.

## Verification Steps
```bash
terraform -chdir=DevOps-Infra/terraform-aws-stack validate
kubeconform DevOps-Infra/kubernetes-manifests/k8s/*.yaml
docker pull ghcr.io/.../task-eval-service:<sha>
```

## Documentation Requirements
- DEPLOYMENT.md: prerequisites, promote steps, rollback.
- Update DevOps READMEs to reference unified path.

## Acceptance Criteria
- [ ] CI publishes container to GHCR
- [ ] K8s manifest references published image
- [ ] Terraform/K8s validate in CI
- [ ] DEPLOYMENT.md complete

## Expected Score Improvement
DevOps +2.0, Production Readiness +1.5 → **+3.5 points**

## Production-Grade Recommendations
- GitOps (ArgoCD/Flux) for K8s sync.
- OIDC federation for AWS instead of static keys.
