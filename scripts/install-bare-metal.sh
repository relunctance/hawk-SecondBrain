#!/usr/bin/env bash
# install-bare-metal.sh — hawk-SecondBrain v0.1 Bare Metal Installer
# Usage: curl -sSL https://raw.githubusercontent.com/relunctance/hawk-SecondBrain/main/scripts/install-bare-metal.sh | bash
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

info "Checking OS..."
if [ "$(uname)" != "Linux" ]; then
    error "This script only supports Linux. Detected: $(uname)"
    exit 1
fi
info "OS: $(uname -r)"

info "Checking architecture..."
ARCH=$(uname -m)
if [ "$ARCH" != "x86_64" ]; then
    warn "This script has been tested on x86_64. Detected: $ARCH"
fi
info "Arch: $ARCH"

info "Checking required commands..."
for cmd in curl tar gzip git go; do
    if ! command -v $cmd &> /dev/null; then
        error "Required command '$cmd' not found. Please install it first."
        exit 1
    fi
    info "  $cmd: $($cmd --version 2>/dev/null | head -1)"
done

# ============================================================
# 2. Directory setup
# ============================================================
section "Directory Setup"

HAWK_DIR="${HAWK_DIR:-$HOME/.hawk}"
INSTALL_DIR="${HAWK_DIR}/install"
mkdir -p "$INSTALL_DIR"

info "HAWK_DIR: $HAWK_DIR"
info "INSTALL_DIR: $INSTALL_DIR"

# Create standard directory structure
mkdir -p "$HAWK_DIR"/{config,data,logs,reports}
info "Directory structure created"

# ============================================================
# 3. Install Node.js (if not present)
# ============================================================
section "Node.js Installation"

if ! command -v node &> /dev/null; then
    info "Node.js not found. Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs 2>/dev/null || {
        # Try alternative for Debian/Ubuntu
        curl -fsSL https://fnm.vercel.app/install | bash
        export PATH="$HOME/.local/share/fnm:$PATH"
        fnm install 20
        fnm use 20
    }
fi
info "Node.js: $(node --version 2>/dev/null)"
info "npm: $(npm --version 2>/dev/null)"

# ============================================================
# 4. Clone lancedb-go-local (pre-built LanceDB Go bindings)
# ============================================================
section "LanceDB Go Bindings (Pre-built)"

LANCEDB_LOCAL="$HOME/repos/lancedb-go-local"
if [ ! -d "$LANCEDB_LOCAL" ]; then
    info "Cloning lancedb-go-local..."
    mkdir -p "$(dirname $LANCEDB_LOCAL)"
    git clone https://github.com/relunctance/lancedb-go-local.git "$LANCEDB_LOCAL"
else
    info "Using existing lancedb-go-local at $LANCEDB_LOCAL"
fi

LANCEDB_LIB="$LANCEDB_LOCAL/lib/linux_amd64"
LANCEDB_INCLUDE="$LANCEDB_LOCAL/include"

if [ ! -f "$LANCEDB_LIB/liblancedb_go.so" ]; then
    error "liblancedb_go.so not found at $LANCEDB_LIB"
    error "Please check lancedb-go-local repository"
    exit 1
fi
info "LanceDB Go bindings: $LANCEDB_LIB/liblancedb_go.so ($(du -h "$LANCEDB_LIB/liblancedb_go.so" | cut -f1))"

# ============================================================
# 5. Clone hawk-memory (if not present)
# ============================================================
section "hawk-memory Source"

HAWK_MEMORY_DIR="$HOME/repos/hawk-memory"
if [ ! -d "$HAWK_MEMORY_DIR" ]; then
    info "Cloning hawk-memory..."
    git clone https://github.com/relunctance/hawk-memory.git "$HAWK_MEMORY_DIR"
else
    info "Using existing hawk-memory at $HAWK_MEMORY_DIR"
    cd "$HAWK_MEMORY_DIR" && git pull origin main 2>/dev/null || true
fi

# Verify go.mod has replace directive for lancedb-go
if ! grep -q "lancedb-go-local" "$HAWK_MEMORY_DIR/go.mod" 2>/dev/null; then
    warn "Adding lancedb-go-local replace directive to go.mod..."
    echo "replace github.com/lancedb/lancedb-go => $LANCEDB_LOCAL" >> "$HAWK_MEMORY_DIR/go.mod"
fi

# ============================================================
# 6. Build hawk-memory with CGO LanceDB native libs
# ============================================================
section "Building hawk-memory"

info "Building hawk-memory (native LanceDB, CGO enabled)..."

cd "$HAWK_MEMORY_DIR"

CGO_CFLAGS="-I$LANCEDB_INCLUDE" \
CGO_LDFLAGS="-L$LANCEDB_LIB -Wl,-rpath,$LANCEDB_LIB -llancedb_go -lm -lpthread" \
GOPROXY=https://goproxy.cn,direct \
HOME="$HOME" \
CGO_ENABLED=1 \
    go build -o hawk-memory ./cmd/hawk-memory/

if [ $? -eq 0 ]; then
    info "hawk-memory binary built successfully"
else
    error "Failed to build hawk-memory"
    exit 1
fi

# Install binary to user path
mkdir -p "$HOME/.local/bin"
cp hawk-memory "$HOME/.local/bin/"

# Verify
info "Binary: $(du -h "$HOME/.local/bin/hawk-memory" | cut -f1)"

# ============================================================
# 7. Clone and build hawk-SecondBrain
# ============================================================
section "hawk-SecondBrain"

HAWK_SB_DIR="$HOME/repos/hawk-SecondBrain"
if [ ! -d "$HAWK_SB_DIR" ]; then
    info "Cloning hawk-SecondBrain..."
    git clone https://github.com/relunctance/hawk-SecondBrain.git "$HAWK_SB_DIR"
else
    info "Using existing hawk-SecondBrain at $HAWK_SB_DIR"
    cd "$HAWK_SB_DIR" && git pull origin main 2>/dev/null || true
fi

cd "$HAWK_SB_DIR"

info "Installing Node.js dependencies..."
npm install

info "Building TypeScript..."
npm run build

if [ $? -eq 0 ]; then
    info "hawk-SecondBrain built successfully"
else
    error "Failed to build hawk-SecondBrain"
    exit 1
fi

# ============================================================
# 8. Create config.yaml for hawk-memory
# ============================================================
section "hawk-memory Configuration"

CONFIG_FILE="$HAWK_DIR/config/hawk-memory.yaml"

if [ ! -f "$CONFIG_FILE" ]; then
    info "Creating $CONFIG_FILE"
    cat > "$CONFIG_FILE" << EOF
# hawk-memory v0.1 Configuration
server:
  host: "0.0.0.0"
  port: 18368

storage:
  lancedb:
    path: "$HAWK_DIR/data/hawk-memory/lancedb"
    fts:
      enabled: true
      rebuild_interval: 60s

xai:
  xinference_url: "http://localhost:9997"
  embedding_model: "bge-m3"
  embedding_dim: 1024
  llm_model: "qwen2.5-7b-instruct"
  embedding_batch_size: 32

mflow:
  url: "http://localhost:8000"
  dual_write: true
  mflow_weight: 0.3

redis:
  url: "redis://localhost:6379"
  cache_ttl: 3600s

agent:
  id: "\${HAWK_AGENT_ID:-$USER}"
  api_key: "\${HAWK_API_KEY:-}"

logging:
  level: "info"
  format: "json"
EOF
else
    info "Using existing config: $CONFIG_FILE"
fi

# ============================================================
# 9. Create .env file
# ============================================================
section "Environment Configuration"

ENV_FILE="$HAWK_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
    info "Creating $ENV_FILE"
    cat > "$ENV_FILE" << EOF
# hawk-SecondBrain v0.1 Environment
# Generated: $(date -Iseconds)

# Agent
HAWK_AGENT_ID=$USER@$(hostname)
HAWK_API_KEY=

# hawk-memory
HAWK_PORT=18368
HAWK_DB_PATH=$HAWK_DIR/data/hawk-memory/lancedb
HAWK_XINFERENCE_URL=http://localhost:9997
HAWK_MFLOW_URL=http://localhost:8000
HAWK_REDIS_URL=redis://localhost:6379

# xinference (if running locally)
XINFERENCE_WORKER_DEVICES=cpu

# hawk-SecondBrain
HAWK_MEMORY_URL=http://localhost:18368

# Logging
HAWK_LOG_LEVEL=info
LOG_LEVEL=info
EOF
else
    info "Using existing .env: $ENV_FILE"
fi

# ============================================================
# 10. Create systemd user service for hawk-memory
# ============================================================
section "Systemd Service (User Mode)"

SYSTEMD_DIR="$HOME/.config/systemd/user"
mkdir -p "$SYSTEMD_DIR"

SERVICE_FILE="$SYSTEMD_DIR/hawk-memory.service"

info "Creating systemd service: $SERVICE_FILE"
cat > "$SERVICE_FILE" << EOF
[Unit]
Description=hawk-memory HTTP API server (Go native LanceDB)
Documentation=https://github.com/relunctance/hawk-memory
After=network.target redis.target

[Service]
Type=simple
WorkingDirectory=$HAWK_MEMORY_DIR

# CGO environment for LanceDB native libs
Environment=CGO_CFLAGS=-I$LANCEDB_INCLUDE
Environment=CGO_LDFLAGS=-L$LANCEDB_LIB -Wl,-rpath,$LANCEDB_LIB
Environment=GOPROXY=https://goproxy.cn,direct
Environment=HOME=$HOME
Environment=PORT=18368
Environment=HAWK_DB_PATH=$HAWK_DIR/data/hawk-memory/lancedb
Environment=HAWK_XINFERENCE_URL=http://localhost:9997
Environment=HAWK_MFLOW_URL=http://localhost:8000
Environment=HAWK_REDIS_URL=redis://localhost:6379

ExecStart=$HOME/.local/bin/hawk-memory

Restart=on-failure
RestartSec=5

StandardOutput=journal
StandardError=journal
SyslogIdentifier=hawk-memory

[Install]
WantedBy=default.target
EOF

# Create redis target (simple)
cat > "$SYSTEMD_DIR/redis.target" << 'EOF'
[Unit]
Description=Redis Server
After=network.target
EOF

# Reload systemd
systemctl --user daemon-reload 2>/dev/null || true

# Enable service
systemctl --user enable hawk-memory 2>/dev/null || true
info "Systemd service installed and enabled"

# ============================================================
# 11. Create helper scripts
# ============================================================
section "Helper Scripts"

# Start script
cat > "$HAWK_DIR/start.sh" << 'EOF'
#!/usr/bin/env bash
# Start hawk-memory + dependencies

# Start redis if not running
if ! redis-cli ping &>/dev/null; then
    echo "Starting redis-server..."
    redis-server --daemonize yes --maxmemory 512mb --maxmemory-policy allkeys-lru
fi

# Start xinference (if installed locally)
# xinference-runner --port 9997 --host 0.0.0.0 &

# Start hawk-memory via systemd
systemctl --user start hawk-memory
systemctl --user status hawk-memory --no-pager
EOF
chmod +x "$HAWK_DIR/start.sh"

# Stop script
cat > "$HAWK_DIR/stop.sh" << 'EOF'
#!/usr/bin/env bash
systemctl --user stop hawk-memory 2>/dev/null || true
EOF
chmod +x "$HAWK_DIR/stop.sh"

# Status script
cat > "$HAWK_DIR/status.sh" << 'EOF'
#!/usr/bin/env bash
echo "=== hawk-memory status ==="
systemctl --user status hawk-memory --no-pager || echo "not running"
echo ""
echo "=== Health check ==="
curl -sf http://localhost:18368/health || echo "not responding"
echo ""
echo "=== Disk usage ==="
du -sh "$HOME/.hawk/data" 2>/dev/null || true
EOF
chmod +x "$HAWK_DIR/status.sh"

info "Helper scripts created: start.sh, stop.sh, status.sh"

# ============================================================
# 12. Print summary
# ============================================================
section "Installation Complete"

echo ""
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}  hawk-SecondBrain v0.1 安装成功！${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
echo -e "  📁 配置目录: ${HAWK_DIR}/config"
echo -e "  📊 数据目录: ${HAWK_DIR}/data"
echo -e "  📄 报告目录: ${HAWK_DIR}/reports"
echo -e "  🔧 hawk-memory: $HOME/.local/bin/hawk-memory"
echo -e "  🌐 hawk-SB: $HAWK_SB_DIR"
echo ""
echo -e "  🚀 启动命令:"
echo -e "    bash $HAWK_DIR/start.sh"
echo ""
echo -e "  📜 常用命令:"
echo -e "    bash $HAWK_DIR/status.sh    # 查看状态"
echo -e "    bash $HAWK_DIR/stop.sh      # 停止"
echo -e "    journalctl --user -u hawk-memory -f  # 查看日志"
echo ""
echo -e "  ⚠️  前置依赖（需手动安装）:"
echo -e "    - Redis: apt install redis-server && redis-server --daemonize yes"
echo -e "    - xinference: Docker or https://github.com/xprobe/xinference"
echo -e "    - mflow: Docker or from https://github.com/relunctance/mflow"
echo ""
