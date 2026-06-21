# Security Review — `Task_Evaluation`

> Phase 6. OWASP-oriented. Findings are verified against current code (`main` @ `3967009`). Date: 2026-06-19.

## Score: 5.0 / 10

---

## 1. What's done well (credit where due)

- **No hardcoded secrets in source** — repo-wide grep for key/secret/token/password patterns over
  `*.py/ts/tsx/js/rs/yml/tf/env` returns nothing real. ✅
- `.env` is **git-ignored and not tracked**; `.env.example` holds only local placeholder creds. ✅
- **No SQL injection** — all DB access via SQLAlchemy ORM with bound parameters; no raw/interpolated SQL. ✅
- **No command injection** in `node-worker` — `spawn(engineBin, [], …)` (no shell, empty argv) with data
  passed via **stdin** (`worker.js:85,145`). Correct, safe pattern. ✅
- **Path traversal in fraud-system is FIXED with defense-in-depth** (the README's "reproduced Critical" was
  true *before* the A5 hardening; it does **not** reproduce now):
  - Pydantic boundary: `transaction_id: str = Field(..., pattern=r"^[A-Za-z0-9_-]{1,64}$")`
    (`fastapi-service/app/schemas.py:9`) → `../A5_PWNED` returns 422.
  - Queue re-sanitizes: `os.path.basename(...)` + `realpath().startswith(queue_dir)` assertion
    (`queue.py:18-23`).
  - Regression test pins it: `test_path_traversal_transaction_id_rejected` (`tests/test_service.py:110-118`).
- **Infra security is genuinely good** (for a demo): K8s `runAsNonRoot`/`runAsUser:10001`,
  `readOnlyRootFilesystem`, `capabilities.drop:[ALL]`, `seccompProfile:RuntimeDefault`
  (`kubernetes-manifests/k8s/deployment.yaml:25-29,72-77`); least-privilege IAM with no wildcards
  (`terraform-aws-stack/main.tf:76-82`); S3 public-access fully blocked + SSE-AES256 + versioning
  (`main.tf:26-41`).

## 2. Findings (ranked)

### 🟠 HIGH — No authentication / authorization on ANY service
No service has auth. Notable consequences:
- `polyglot-fraud-system` **`/internal/transactions/{id}/score` is OPEN BY DEFAULT.** The token gate is
  `if _INTERNAL_TOKEN is not None and …` (`routes.py:115`), and `_INTERNAL_TOKEN = os.environ.get(
  "A3_INTERNAL_TOKEN")` (`routes.py:17`) is `None` unless explicitly set. With the shipped `.env`
  (`A3_INTERNAL_TOKEN=` empty), **anyone can POST an arbitrary fraud score for any transaction** — i.e.
  neutralize a high-risk score. Fail-open is the wrong default for an auth control.
- `bug-diagnosis` exposes **IDOR-style enumeration** via sequential integer order ids (`routes.py:18`,
  `storage.py:10`).

### 🟠 HIGH — No CORS policy, no rate limiting, no security headers (anywhere)
- Verified by grep across all service source: **no CORS middleware, no rate limiting, no `helmet`** on
  Express. Public endpoints are unthrottled (DoS / brute-force exposure).
- The deployed site has **no security headers** — `next.config.ts` is empty `{}` (no CSP/HSTS/
  X-Frame-Options) and there is no `vercel.json`.

### 🟡 MEDIUM — Dependency vulnerabilities in the deployed app
- `npm audit --omit=dev` on `agent-platform` reports **2 moderate** vulnerabilities: PostCSS XSS
  (GHSA-qx2v-qp2m-jg93) reachable transitively via the pinned Next.js version. No `dependabot`/renovate,
  and **no dependency scanning in CI** (no `npm/pip/cargo audit`, no Trivy, no SBOM).

### 🟡 MEDIUM — Weak operational credentials in infra demos
- Docker Compose ships **plaintext** `POSTGRES_PASSWORD: apppass` and embeds it in connection strings
  (`docker-compose-stack/docker-compose.yml:8,25,37`); no `secrets:` block.
- Grafana runs **`admin/admin` with anonymous Viewer access enabled**
  (`observability-bolt-on/docker-compose.yml:39-44`). Self-labeled "local demo," but it is the actual config.
- K8s has **no Secret object anywhere** (`grep kind: Secret` → 0) — only a ConfigMap; the secrets pattern is
  simply absent.

### 🟡 MEDIUM — Containers running as root
- `docker-compose-stack/api`, `docker-compose-stack/worker`, and `ci-pipeline` Dockerfiles have **no `USER`
  directive → run as root**. (The K8s/observability/dockerize/expense images correctly drop to a non-root uid.)

### 🟢 LOW
- **Information leak to production:** the static site ships a developer machine path
  `/Users/abhijeetpal/Desktop/workspace/android-monorepo` (`agent-platform/src/lib/data.ts:459`) and the
  author's name into the public bundle.
- `node-worker` would transmit `X-Internal-Token` in **cleartext** if `API_URL` points at a non-local
  `http://` host (`worker.js:25,180-184`).
- `node-worker` **follows symlinks** when reading queue files (`worker.js:217,340`) — a planted `*.json`
  symlink would be read and fed to the engine.
- Base images are floating tags (`python:3.12-slim`), not digest-pinned — supply-chain drift.

## 3. OWASP Top-10 quick map

| Risk | Status |
|---|---|
| A01 Broken Access Control | **Present** — no authz, `/internal` fail-open, IDOR |
| A02 Cryptographic Failures | Low — no sensitive data at rest; S3 encrypted |
| A03 Injection | **Mitigated** — ORM, no shell, validated inputs |
| A04 Insecure Design | **Present** — fail-open auth default, file-queue trust |
| A05 Security Misconfiguration | **Present** — root containers, admin/admin, no headers, empty next.config |
| A06 Vulnerable Components | **Present** — 2 moderate npm vulns, no scanning |
| A07 Auth Failures | **Present** — no auth on any service |
| A08 Integrity Failures | Low — lockfiles present; no digest pinning |
| A09 Logging/Monitoring | **Present** — no security logging/alerting; site has none |
| A10 SSRF | Low — `node-worker` posts to a configured `API_URL` only |

## 4. Verdict

The fundamentals a portfolio author *controls in code* are sound: no secrets, no SQLi, safe subprocess,
fixed path-traversal, hardened K8s/IAM. But the **application-security surface is essentially unbuilt** — no
auth, CORS, rate limiting, or headers on any service; a fail-open internal endpoint; and known dependency
vulns with no scanning. As a production system this would not pass a security gate. **5.0/10.**
