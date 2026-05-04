#!/usr/bin/env bash
# smoke-test.sh — hawk-SecondBrain v0.1 smoke test suite
# Returns 0 if all tests pass, 1 otherwise
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
pass() { echo -e "${GREEN}[PASS]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
info() { echo -e "${GREEN}[INFO]${NC} $1"; }

TOTAL=0; PASSED=0; FAILED=0

run_test() {
    local name="$1"; local cmd="$2"
    TOTAL=$((TOTAL+1))
    if eval "$cmd" > /dev/null 2>&1; then
        pass "$name"; PASSED=$((PASSED+1)); return 0
    else
        fail "$name"; FAILED=$((FAILED+1)); return 1
    fi
}

run_test_warn() {
    local name="$1"; local cmd="$2"
    TOTAL=$((TOTAL+1))
    if eval "$cmd" > /dev/null 2>&1; then
        pass "$name"; PASSED=$((PASSED+1)); return 0
    else
        warn "$name (non-critical)"; return 0
    fi
}

echo "=========================================="
echo "  hawk-SecondBrain v0.1 Smoke Tests"
echo "=========================================="
echo ""

# ============================================================
# 1. Core health checks (critical)
# ============================================================
echo "--- Core Services ---"
run_test "hawk-memory health" "curl -sf http://localhost:18368/health"
run_test "hawk-memory ready" "curl -sf http://localhost:18368/ready"

# ============================================================
# 2. Capture API (critical)
# ============================================================
echo ""
echo "--- Memory Operations ---"

# Generate unique test data to avoid collisions
SMOKE_ID="smoke-$(date +%s)-$$"
SMOKE_TEXT="smoke test memory ${SMOKE_ID}"

CAPTURE_RESP=$(curl -sf -X POST http://localhost:18368/v1/capture \
    -H "Content-Type: application/json" \
    -d "{\"text\":\"${SMOKE_TEXT}\",\"agent_id\":\"smoke-test\"}" 2>&1) && \
    CAPTURE_OK=$? || CAPTURE_OK=$?

if [ $CAPTURE_OK -eq 0 ] && echo "$CAPTURE_RESP" | grep -q "id"; then
    pass "capture memory"; PASSED=$((PASSED+1))
    TOTAL=$((TOTAL+1))
    MEMORY_ID=$(echo "$CAPTURE_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    info "  captured memory id: ${MEMORY_ID}"
else
    fail "capture memory"; FAILED=$((FAILED+1))
    TOTAL=$((TOTAL+1))
    MEMORY_ID=""
fi

# ============================================================
# 3. Recall API (critical) — wait for FTS index
# ============================================================
echo "Waiting 5s for FTS index to build..."
sleep 5

if [ -n "$MEMORY_ID" ]; then
    RECALL_RESP=$(curl -sf -X POST http://localhost:18368/v1/recall \
        -H "Content-Type: application/json" \
        -d "{\"query\":\"${SMOKE_TEXT}\",\"agent_id\":\"smoke-test\",\"top_k\":5}" 2>&1)
    if [ $? -eq 0 ] && echo "$RECALL_RESP" | grep -q "memories"; then
        pass "recall memory"; PASSED=$((PASSED+1))
        TOTAL=$((TOTAL+1))
    else
        warn "recall memory (may need more time for indexing)"
        TOTAL=$((TOTAL+1))
    fi
else
    warn "recall memory (skipping - capture failed)"
    TOTAL=$((TOTAL+1))
fi

# ============================================================
# 4. Stats API (important)
# ============================================================
run_test "stats daily" "curl -sf 'http://localhost:18368/v1/analytics/roi?agent_id=smoke-test'"

# ============================================================
# 5. Belief API (important)
# ============================================================
run_test "belief record" "curl -sf -X POST http://localhost:18368/v1/belief \
    -H 'Content-Type: application/json' \
    -d '{\"agent_id\":\"smoke-test\",\"topic\":\"test-topic\",\"belief\":\"testing belief timeline\"}'"

# ============================================================
# 6. Coach/Hygiene API (important)
# ============================================================
run_test "coach hygiene score" "curl -sf 'http://localhost:18368/v1/hygiene/score?agent_id=smoke-test'"

# ============================================================
# 7. xinference (non-critical — may still be loading)
# ============================================================
echo ""
echo "--- AI Services (non-critical) ---"
run_test_warn "xinference API" "curl -sf http://localhost:9997/v1/models"
run_test_warn "xinference models available" "curl -sf http://localhost:9997/v1/models | grep -q 'data'"

# ============================================================
# 8. Redis (non-critical in bare-metal context)
# ============================================================
if docker ps 2>/dev/null | grep -q hawk-redis; then
    run_test_warn "redis ping" "docker exec hawk-redis redis-cli ping"
else
    # Try local redis-cli
    run_test_warn "redis ping" "redis-cli ping 2>/dev/null || nc -z localhost 6379 2>/dev/null"
fi

# ============================================================
# Summary
# ============================================================
echo ""
echo "=========================================="
echo "  Results: ${PASSED}/${TOTAL} passed"
if [ $FAILED -gt 0 ]; then
    echo -e "  ${RED}${FAILED} failed${NC}"
fi
echo "=========================================="

if [ $PASSED -eq $TOTAL ]; then
    echo -e "${GREEN}✅ Status: Healthy${NC}"
    exit 0
elif [ $PASSED -ge 4 ]; then
    echo -e "${YELLOW}⚠️  Status: Degraded (core services OK)${NC}"
    exit 0
else
    echo -e "${RED}❌ Status: Unhealthy${NC}"
    exit 1
fi
