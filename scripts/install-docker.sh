#!/usr/bin/env bash
# install-docker.sh — hawk-SecondBrain v0.1 one-click installer
# Usage: curl -sSL https://raw.githubusercontent.com/relunctance/hawk-SecondBrain/main/scripts/install-docker.sh | bash
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }
section() { echo -e "\n${BLUE}==== $1 ====${NC}"; }

# ============================================================
# 1. Pre-flight checks
# ============================================================
section "Pre-flight Checks"

info "Checking Docker..."
if ! command -v docker &> /dev/null; then
    error "Docker not found. Install from https://docs.docker.com/get-docker/"
    exit 1
fi
info "Docker: $(docker --version | cut -d' ' -f3 | cut -d',' -f1)"

info "Checking Docker Compose..."
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    error "Docker Compose not found"
    exit 1
fi
info "Docker Compose: $($DOCKER_COMPOSE version | head -1)"

info "Checking GPU support..."
if command -v nvidia-smi &> /dev/null && nvidia-smi &> /dev/null; then
    GPU_NAME=$(nvidia-smi --query-gpu=name --format=csv,noheader | head -1)
    info "NVIDIA GPU: $GPU_NAME"
    NVIDIA_GPU=true
    XINFERENCE_WORKER_DEVICES="cuda"
else
    warn "No NVIDIA GPU detected — xinference will run in CPU mode (slow)"
    NVIDIA_GPU=false
    XINFERENCE_WORKER_DEVICES="cpu"
fi

# ============================================================
# 2. Port availability check
# ============================================================
section "Port Availability"
check_port() {
    local port=$1 local name=$2
    if ss -tuln 2>/dev/null | grep -q ":${port} " || netstat -tuln 2>/dev/null | grep -q ":${port} "; then
        error "Port ${port} (${name}) is already in use"
        return 1
    fi
    info "Port ${port} (${name}) — available"
}

check_port 18368 "hawk-memory" || exit 1
check_port 9997  "xinference"  || exit 1
check_port 8000  "mflow"       || exit 1
check_port 6379  "redis"       || exit 1
check_port 3000  "hawk-SecondBrain" || exit 1

# ============================================================
# 3. Create directory structure
# ============================================================
section "Creating Directory Structure"
HAWK_DIR="${HAWK_DIR:-$HOME/.hawk}"
mkdir -p "${HAWK_DIR}"/{config,data,logs,reports}

info "Directory: ${HAWK_DIR}"
info "Config:   ${HAWK_DIR}/config"
info "Data:     ${HAWK_DIR}/data"
info "Logs:     ${HAWK_DIR}/logs"
info "Reports:  ${HAWK_DIR}/reports"

# ============================================================
# 4. Generate .env file
# ============================================================
section "Generating Configuration"
ENV_FILE="${HAWK_DIR}/.env"

if [ -f "${ENV_FILE}" ]; then
    info "Using existing config: ${ENV_FILE}"
else
    info "Creating: ${ENV_FILE}"
    cat > "${ENV_FILE}" << EOF
# hawk-SecondBrain v0.1 Configuration
# Generated: $(date -Iseconds)

# Versions
HAWK_MEMORY_VERSION=v0.1.0
XINFERENCE_VERSION=v0.16.0
MFLOW_VERSION=v0.3.0
REDIS_VERSION=7-alpine
VERSION=v0.1.0

# Agent
HAWK_AGENT_ID=${USER}@$(hostname)
HAWK_API_KEY=

# Logging
HAWK_LOG_LEVEL=info
LOG_LEVEL=info

# GPU (auto-detected)
XINFERENCE_WORKER_DEVICES=${XINFERENCE_WORKER_DEVICES}
EOF
fi

# ============================================================
# 5. Generate hawk-memory config.yaml
# ============================================================
CONFIG_YAML="${HAWK_DIR}/config/hawk-memory.yaml"
mkdir -p "${HAWK_DIR}/config"

if [ -f "${CONFIG_YAML}" ]; then
    info "Using existing: ${CONFIG_YAML}"
else
    info "Creating: ${CONFIG_YAML}"
    cat > "${CONFIG_YAML}" << 'YAMLEOF'
server:
  host: "0.0.0.0"
  port: 18368
  read_timeout: 30s
  write_timeout: 30s
  startup_timeout: 5s

storage:
  lancedb:
    path: "/data/hawk-memory/lancedb"
    fts:
      enabled: true
      rebuild_interval: 60s
  memory:
    max_entries: 100000
    cache_size: 1024MB

xai:
  xinference_url: "http://xinference:9997"
  embedding_model: "bge-m3"
  embedding_dim: 1024
  llm_model: "qwen2.5-7b-instruct"
  embedding_batch_size: 32

mflow:
  url: "http://mflow:8000"
  dual_write: true
  mflow_weight: 0.3

redis:
  url: "redis://redis:6379"
  cache_ttl: 3600s

agent:
  id: "${HAWK_AGENT_ID:-default}"
  api_key: "${HAWK_API_KEY:-}"

logging:
  level: "info"
  format: "json"

timeouts:
  recall: 8s
  capture_batch_async: 3s
  capture_single: 3s
  rewrite: 3s
  mflow_recall: 15s
  til_generation: 10s
  mapping: 5s
  delete_mapping: 5s
  fts_query: 3s
  prediction_recall: 5s
  consensus_recall: 10s
  coach: 30s
  coach_step: 10s
  embedding: 30s
  llm: 60s
  lancedb_http: 30s
  index_create: 15s
  fts_rebuild_scan: 5s

retry:
  webhook_backoff:
    - 1s
    - 2s
    - 4s
  max_retries: 3

thresholds:
  rune_count_medium: 180
  til_rune_low: 50
  til_rune_medium: 300
  til_rune_high: 500

decay:
  fact_half_life_days: 180
  confidence_half_life_days: 180.0
YAMLEOF
fi

# ============================================================
# 6. Pull Docker images
# ============================================================
section "Pulling Docker Images (first run may take 5-10 min)"

# hawk-memory binary is not on Docker Hub yet — for now use a placeholder
# In production, this would be: ghcr.io/relunctance/hawk-memory:${HAWK_MEMORY_VERSION:-v0.1.0}
info "Note: hawk-memory currently runs as a native binary on the host"
info "For v0.1 production release, ghcr.io/relunctance/hawk-memory image will be published"

info "Pulling xinference..."
docker pull xprobe/xinference:${XINFERENCE_VERSION:-v0.16.0} || warn "xinference pull failed (may need auth or GPU drivers)"

info "Pulling redis..."
docker pull redis:${REDIS_VERSION:-7-alpine}

# mflow is not yet published, so skip
info "Note: mflow uses in-memory fallback (production: ghcr.io/relunctance/mflow:${MFLOW_VERSION:-v0.3.0})"

# ============================================================
# 7. Start services
# ============================================================
section "Starting Services"

COMPOSE_FILE="${HAWK_DIR}/docker-compose.yml"

# Write compose file (Docker standalone mode without hawk-memory container)
cat > "${COMPOSE_FILE}" << 'COMPOSE_EOF'
version: "3.9"

networks:
  hawk-net:
    driver: bridge

volumes:
  hawk-data:
  xinference-models:
  mflow-data:
  redis-data:

services:
  xinference:
    image: xprobe/xinference:${XINFERENCE_VERSION:-v0.16.0}
    container_name: xinference
    restart: unless-stopped
    ports:
      - "9997:9997"
      - "8080:8080"
    environment:
      - XINFERENCE_MODEL_DEESeekR1_VOLUME=/models
      - XINFERENCE_WORKER_DEVICES=${XINFERENCE_WORKER_DEVICES:-cpu}
    volumes:
      - xinference-models:/models
    networks:
      - hawk-net
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9997/v1/models"]
      interval: 30s
      timeout: 10s
      retries: 10
      start_period: 180s
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]

  redis:
    image: redis:${REDIS_VERSION:-7-alpine}
    container_name: hawk-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
    volumes:
      - redis-data:/data
    networks:
      - hawk-net
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

networks:
  hawk-net:
    name: hawk-net
COMPOSE_EOF

info "Starting services (redis + xinference)..."
cd "${HAWK_DIR}"
$DOCKER_COMPOSE -f "${COMPOSE_FILE}" up -d

# ============================================================
# 8. Wait for xinference to be ready
# ============================================================
section "Waiting for Services"

MAX_WAIT=180
WAIT_INTERVAL=10
ELAPSED=0

info "Waiting for xinference (max ${MAX_WAIT}s)..."
while [ $ELAPSED -lt $MAX_WAIT ]; do
    if curl -sf http://localhost:9997/v1/models > /dev/null 2>&1; then
        info "✅ xinference ready (${ELAPSED}s)"
        break
    fi
    echo -n "."
    sleep $WAIT_INTERVAL
    ELAPSED=$((ELAPSED + WAIT_INTERVAL))
done
echo ""

if [ $ELAPSED -ge $MAX_WAIT ]; then
    warn "xinference still loading (this is normal — models load in background)"
fi

info "Redis: $(docker exec hawk-redis redis-cli ping 2>/dev/null || echo 'not ready')"

# ============================================================
# 9. Smoke test
# ============================================================
section "Running Smoke Tests"

SMOKE_PASS=0
SMOKE_TOTAL=0

# Test: xinference
SMOKE_TOTAL=$((SMOKE_TOTAL+1))
if curl -sf http://localhost:9997/v1/models > /dev/null 2>&1; then
    info "✅ [${SMOKE_TOTAL}] xinference API — OK"
    SMOKE_PASS=$((SMOKE_PASS+1))
else
    error "❌ [${SMOKE_TOTAL}] xinference API — FAIL"
fi

# Test: redis
SMOKE_TOTAL=$((SMOKE_TOTAL+1))
if docker exec hawk-redis redis-cli ping > /dev/null 2>&1; then
    info "✅ [${SMOKE_TOTAL}] redis — OK"
    SMOKE_PASS=$((SMOKE_PASS+1))
else
    error "❌ [${SMOKE_TOTAL}] redis — FAIL"
fi

# Test: hawk-memory (if running on host)
SMOKE_TOTAL=$((SMOKE_TOTAL+1))
if curl -sf http://localhost:18368/health > /dev/null 2>&1; then
    info "✅ [${SMOKE_TOTAL}] hawk-memory — OK"
    SMOKE_PASS=$((SMOKE_PASS+1))
else
    warn "⚠️  [${SMOKE_TOTAL}] hawk-memory — not reachable (running on host or not started)"
fi

# ============================================================
# 10. Summary
# ============================================================
section "Installation Complete"
echo ""
info "=========================================="
info "  🎉 hawk-SecondBrain v0.1 Docker Stack"
info "=========================================="
echo ""
info "  📍 Service Endpoints:"
info "    xinference:  http://localhost:9997"
info "    redis:       localhost:6379"
info "    hawk-memory: http://localhost:18368 (host binary)"
info "    hawk-SB:    http://localhost:3000"
echo ""
info "  📁 Directories:"
info "    Config:  ${HAWK_DIR}/config"
info "    Data:    ${HAWK_DIR}/data"
info "    Logs:    ${HAWK_DIR}/logs"
info "    Reports: ${HAWK_DIR}/reports"
echo ""
info "  🚀 Common Commands:"
info "    Status:   $DOCKER_COMPOSE -f ${COMPOSE_FILE} ps"
info "    Logs:     $DOCKER_COMPOSE -f ${COMPOSE_FILE} logs -f"
info "    Stop:     $DOCKER_COMPOSE -f ${COMPOSE_FILE} down"
info "    Restart:  $DOCKER_COMPOSE -f ${COMPOSE_FILE} restart"
echo ""
info "  🔧 Model Registration (after xinference loads):"
info "    curl -X POST http://localhost:9997/v1/models \\"
info "      -H 'Content-Type: application/json' \\"
info "      -d '{\"model_name\":\"bge-m3\",\"model_type\":\"embedding\"}'"
echo ""
info "  ✅ Smoke Tests: ${SMOKE_PASS}/${SMOKE_TOTAL} passed"
echo ""

if [ $SMOKE_PASS -lt $SMOKE_TOTAL ]; then
    error "Some smoke tests failed — check logs"
    exit 1
fi
