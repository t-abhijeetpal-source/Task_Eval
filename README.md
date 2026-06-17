# Task_Eval — Coding-Agent Task Workspace

A polyglot monorepo of graded coding-agent deliverables across **Python, Node.js, and Rust**,
grouped by tier:

```
Basics/            B1–B6   (repo inventory, API map, test discovery, FastAPI/Node/Rust builds)
Intermediate Task/ I1–I6   (ER diagram, flow trace, safe change, polyglot pair, dockerize, bug fix)
Advanced Task/     A1–A6   (parallel analysis, system builders, adversarial review, perf, ...)
Devops & Infra/    D1–D5   (Terraform, Docker Compose E2E, CI pipeline, ..., this reproducible env)
```

## Getting Started (reproducible — D5)

> One command sets up the entire workspace from a fresh clone.

1. **Prerequisites:** [`mise`](https://mise.jdx.dev) and `make`. (Docker is needed only for the
   container/compose tasks — D2/D3/A2/A3 image builds.)
2. **Setup the environment (single command):**
   ```bash
   make bootstrap
   ```
   This: installs the **pinned runtimes** (Python 3.12.7, Node 22.11.0, Rust 1.83.0 via `mise.toml`)
   → installs all dependencies from lockfiles → generates `.env` from `.env.example` → builds and
   runs the **full test suite** (85 tests across 10 components).
3. **Run test verification:**
   ```bash
   make test        # or: make verify
   ```
4. **Environment variables:** `make setup-env` copies `.env.example` → `.env` (no overwrite). Edit
   `.env` to override locally (`DATABASE_URL`, `A3_INTERNAL_TOKEN`, `QUEUE_DIR`, …). Apps read these
   from the process environment.

### Other useful targets
```bash
make help            # list all targets
make doctor          # install pinned runtimes + report active versions
make rust|node|python  # run one language's suites
make a3-integration  # A3 polyglot end-to-end test (needs Docker-free local run)
make clean           # remove generated venvs / node_modules / build artifacts
```

## Toolchain pinning
Runtimes are pinned in **`mise.toml`** (and `.tool-versions` for asdf compatibility); per-component
dependencies are locked (`requirements*.txt`, `package-lock.json`, `Cargo.lock`). See
`Devops & Infra/D5/docs/agent-analysis/` for the full environment-discovery and reproducibility record.

## CI
GitHub Actions runs lint → unit → integration → build → container on push/PR
(`.github/workflows/ci.yml`; see `Devops & Infra/D3`).
