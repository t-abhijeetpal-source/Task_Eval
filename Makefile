# Task_Eval — reproducible build/test entrypoint across all components.
# One command per concern instead of remembering pytest / npm test / cargo test
# across 10 projects in 3 languages. See `make help`.

.DEFAULT_GOAL := help
SHELL := /bin/bash
PY ?= python3

# Independently-testable projects (paths quoted: some contain spaces).
PY_PROJECTS   := "Basics/B4" "Intermediate Task/I6" "Advanced Task/A2" "Advanced Task/A3/fastapi-service" "Intermediate Task/I4/fastapi-service"
NODE_PROJECTS := "Basics/B5" "Intermediate Task/I4/node-client" "Advanced Task/A3/node-worker"
RUST_PROJECTS := "Basics/B6" "Advanced Task/A3/rust-engine"

.PHONY: help test rust node python setup a3-integration clean

help:  ## Show available targets
	@grep -hE '^[a-zA-Z0-9_-]+:.*## ' $(MAKEFILE_LIST) \
		| awk 'BEGIN{FS=":.*## "}{printf "  \033[36m%-16s\033[0m %s\n",$$1,$$2}'

rust:  ## Test all Rust crates (B6, A3 engine)
	@for d in $(RUST_PROJECTS); do echo "== rust: $$d =="; ( cd "$$d" && cargo test ) || exit 1; done

node:  ## Test all Node projects (B5, I4 client, A3 worker)
	@for d in $(NODE_PROJECTS); do echo "== node: $$d =="; ( cd "$$d" && npm install --silent && npm test ) || exit 1; done

python:  ## Test all Python services (creates a per-project venv + installs)
	@for d in $(PY_PROJECTS); do echo "== python: $$d =="; \
		( cd "$$d" && $(PY) -m venv .venv && . .venv/bin/activate \
			&& pip -q install -r requirements.txt && python -m pytest -q ) || exit 1; done

test: rust node python  ## Run every test suite (Rust + Node + Python)
	@echo "== ALL SUITES PASSED =="

a3-integration:  ## Run the A3 polyglot end-to-end integration test
	@bash "Advanced Task/A3/integration-tests/run_integration.sh"

clean:  ## Remove generated venvs / node_modules / build artifacts / runtime
	@find . -type d \( -name .venv -o -name node_modules -o -name target \
		-o -name __pycache__ -o -name .pytest_cache -o -name runtime -o -name .run \) \
		-prune -exec rm -rf {} + 2>/dev/null || true
	@echo "cleaned"
