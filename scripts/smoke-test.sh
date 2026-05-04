#!/usr/bin/env bash
# smoke-test.sh — hawk-SecondBrain v0.1 smoke test suite
# Returns 0 if all tests pass, 1 otherwise
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
pass() { echo -e "${GREEN}[PASS]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

TOTAL=0; PASSED=0

run_test() {
    local name="$1"; local cmd="$2"
    TOTAL=$((TOTAL+1))
    if eval "$cmd" > /dev/null 2>&1; then
        pass "$name"; PASSED=$((PASSED+1))
    else
        fail "$name"; return 1
    fi
}

echo "=== hawk-SecondBrain v0.1 Smoke Tests ==="

# 1. Health endpoints
run_test "hawk-memory health" "curl -sf http://localhost:18368/health"
run_test "xinference API" "curl -sf http://localhost:9997/v1/models"
run_test "redis ping" "docker exec hawk-redis redis-cli ping"

# 2. Capture
run_test "capture memory" "curl -sf -X POST http://localhost:18368/v1/capture \
    -H 'Content-Type: application/json' \
    -d '{\"text\":\"smoke test\",\"agent_id\":\"smoke-test\"}'"

# 3. Recall (wait for index)
sleep 3
run_test "recall memory" "curl -sf -X POST http://localhost:18368/v1/recall \
    -H 'Content-Type: application/json' \
    -d '{\"query\":\"smoke\",\"agent_id\":\"smoke-test\",\"top_k\":5}'"

# 4. Stats
run_test "stats daily" "curl -sf 'http://localhost:18368/v1/stats/daily?agent_id=smoke-test'"

# 5. xinference models listed
run_test "xinference models available" "curl -sf http://localhost:9997/v1/models | grep -q 'data'"

echo ""
echo "=== Results: ${PASSED}/${TOTAL} passed ==="
[ $PASSED -eq $TOTAL ]
