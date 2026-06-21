# A3 Node worker — multi-stage: build the Rust engine, then ship it inside the
# Node runtime so the worker spawns a real fraud-engine binary (single source of
# truth for scoring stays Rust, even in the container).

# ---- stage 1: build the Rust engine (pinned 1.96) ----
FROM rust:1.96-slim AS engine-builder
WORKDIR /engine
# The build context is the repo component root (see docker-compose `context: .`).
COPY rust-engine/Cargo.toml rust-engine/Cargo.lock ./
COPY rust-engine/src ./src
RUN cargo build --release && cp target/release/fraud-engine /fraud-engine

# ---- stage 2: node runtime (pinned to the verified mise.toml version) ----
FROM node:26.3.0-slim AS runtime
ENV NODE_ENV=production \
    QUEUE_DIR=/queue \
    API_URL=http://api:8000 \
    ENGINE_BIN=/usr/local/bin/fraud-engine

WORKDIR /app
COPY node-worker/package.json node-worker/package-lock.json* ./
RUN npm install --omit=dev --silent

COPY node-worker/src ./src
COPY --from=engine-builder /fraud-engine /usr/local/bin/fraud-engine

RUN mkdir -p /queue && \
    adduser --disabled-password --gecos "" worker && \
    chown -R worker:worker /app /queue
USER worker

# Loop mode: poll the shared queue forever.
CMD ["node", "src/worker.js"]
