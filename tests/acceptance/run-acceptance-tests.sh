#!/bin/bash

# Docker Deployment Acceptance Test Suite
# Automated testing script for Docker deployment validation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
PASSED_TESTS=0
FAILED_TESTS=0
TOTAL_TESTS=0

# Test log file
LOG_FILE="acceptance-test-results-$(date +%Y%m%d-%H%M%S).log"

# Function to print colored messages
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}" | tee -a "$LOG_FILE"
}

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    print_message "$BLUE" "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_message "$BLUE" "Test $TOTAL_TESTS: $test_name"
    print_message "$BLUE" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if eval "$test_command" >> "$LOG_FILE" 2>&1; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        print_message "$GREEN" "✅ PASSED: $test_name"
        return 0
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        print_message "$RED" "❌ FAILED: $test_name"
        return 1
    fi
}

# Header
print_message "$BLUE" "\n╔══════════════════════════════════════════════════════════╗"
print_message "$BLUE" "║   Docker Deployment Acceptance Test Suite               ║"
print_message "$BLUE" "║   Playwright CLI Automation                              ║"
print_message "$BLUE" "╚══════════════════════════════════════════════════════════╝\n"

print_message "$BLUE" "Test execution started at: $(date)"
print_message "$BLUE" "Log file: $LOG_FILE\n"

# ============================================
# Phase 1: Pre-Deployment Tests
# ============================================
print_message "$YELLOW" "\n═══ Phase 1: Pre-Deployment Tests ═══\n"

run_test "Docker Installation Check" \
    "command -v docker"

run_test "Docker Daemon Running" \
    "docker info > /dev/null 2>&1"

run_test "Docker Compose Installation" \
    "command -v docker-compose || docker compose version"

# ============================================
# Phase 2: Container Build Tests
# ============================================
print_message "$YELLOW" "\n═══ Phase 2: Container Build Tests ═══\n"

run_test "Docker Image Build" \
    "docker build -t lalalaala/playwright-cli-automation:latest . --no-cache"

run_test "Image Exists in Repository" \
    "docker images | grep -q 'lalalaala/playwright-cli-automation'"

run_test "Image Size Check (< 2GB)" \
    "docker images lalalaala/playwright-cli-automation:latest --format '{{.Size}}' | grep -qE '^([0-9]{1,3}MB|1\.[0-9]GB)$'"

# ============================================
# Phase 3: Container Deployment Tests
# ============================================
print_message "$YELLOW" "\n═══ Phase 3: Container Deployment Tests ═══\n"

# Cleanup any existing containers
docker-compose down > /dev/null 2>&1 || true

run_test "Container Startup" \
    "docker-compose up -d"

run_test "Container Running Status" \
    "sleep 5 && docker ps | grep -q 'playwright-automation-prod'"

# ============================================
# Phase 4: Health Check Tests
# ============================================
print_message "$YELLOW" "\n═══ Phase 4: Health Check Tests ═══\n"

run_test "Wait for Container Healthy (30s)" \
    "timeout 30 bash -c 'until docker ps --filter name=playwright-automation-prod --filter health=healthy | grep -q healthy; do sleep 2; done'"

run_test "Shallow Health Check" \
    "curl -f http://localhost:3000/health > /dev/null 2>&1"

run_test "Health Endpoint Returns JSON" \
    "curl -s http://localhost:3000/health | grep -q '\"status\"'"

run_test "Deep Health Check" \
    "curl -f 'http://localhost:3000/health?deep=1' > /dev/null 2>&1"

# ============================================
# Phase 5: Functional Tests
# ============================================
print_message "$YELLOW" "\n═══ Phase 5: Functional Tests ═══\n"

run_test "Browser Automation - Deep Health Check" \
    "docker exec playwright-automation-prod node src/index.js health --once --deep"

run_test "Session Management - List Sessions" \
    "docker exec playwright-automation-prod node src/index.js session list"

run_test "Proxy Management - List Proxies" \
    "docker exec playwright-automation-prod node src/index.js proxy list"

run_test "Data Directory - Sessions Exists" \
    "docker exec playwright-automation-prod ls /usr/src/app/data/sessions"

run_test "Data Directory - Logs Exists" \
    "docker exec playwright-automation-prod ls /usr/src/app/data/logs"

run_test "Data Directory - Output Exists" \
    "docker exec playwright-automation-prod ls /usr/src/app/data/output"

# ============================================
# Phase 6: Performance Tests
# ============================================
print_message "$YELLOW" "\n═══ Phase 6: Performance Tests ═══\n"

run_test "Health Check Response Time < 1s" \
    "timeout 1 curl -f http://localhost:3000/health > /dev/null 2>&1"

run_test "Container Resource Usage Check" \
    "docker stats --no-stream playwright-automation-prod | grep -q playwright-automation-prod"

run_test "Memory Usage < 2GB" \
    "docker stats --no-stream --format '{{.MemUsage}}' playwright-automation-prod | grep -qvE '([2-9]|[1-9][0-9]+)\.[0-9]+GiB'"

# ============================================
# Phase 7: Data Persistence Tests
# ============================================
print_message "$YELLOW" "\n═══ Phase 7: Data Persistence Tests ═══\n"

run_test "Create Test Log File" \
    "docker exec playwright-automation-prod sh -c 'echo \"test\" > /usr/src/app/data/logs/test.log'"

run_test "Verify Test Log Created" \
    "docker exec playwright-automation-prod test -f /usr/src/app/data/logs/test.log"

run_test "Container Restart" \
    "docker restart playwright-automation-prod && sleep 10"

run_test "Container Healthy After Restart" \
    "timeout 30 bash -c 'until docker ps --filter name=playwright-automation-prod --filter health=healthy | grep -q healthy; do sleep 2; done'"

run_test "Test Log Persists After Restart" \
    "docker exec playwright-automation-prod test -f /usr/src/app/data/logs/test.log"

run_test "Cleanup Test Log" \
    "docker exec playwright-automation-prod rm /usr/src/app/data/logs/test.log"

# ============================================
# Phase 8: Security Tests
# ============================================
print_message "$YELLOW" "\n═══ Phase 8: Security Tests ═══\n"

run_test "Only Port 3000 Exposed" \
    "docker port playwright-automation-prod | grep -q '3000/tcp' && [ $(docker port playwright-automation-prod | wc -l) -eq 1 ]"

run_test "Container Network Isolation" \
    "docker inspect playwright-automation-prod | grep -q 'playwright-network'"

run_test "No .env Files in Image" \
    "! docker run --rm lalalaala/playwright-cli-automation:latest ls -la | grep -q '.env$'"

# ============================================
# Test Summary
# ============================================
print_message "$BLUE" "\n╔══════════════════════════════════════════════════════════╗"
print_message "$BLUE" "║              Test Execution Summary                      ║"
print_message "$BLUE" "╚══════════════════════════════════════════════════════════╝\n"

print_message "$BLUE" "Total Tests:  $TOTAL_TESTS"
print_message "$GREEN" "Passed:       $PASSED_TESTS"
print_message "$RED" "Failed:       $FAILED_TESTS"

SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
print_message "$BLUE" "Success Rate: ${SUCCESS_RATE}%"

print_message "$BLUE" "\nTest execution completed at: $(date)"
print_message "$BLUE" "Detailed logs saved to: $LOG_FILE"

# Determine overall result
if [ $FAILED_TESTS -eq 0 ]; then
    print_message "$GREEN" "\n🎉 ALL TESTS PASSED! Deployment is ready for production."
    exit 0
elif [ $SUCCESS_RATE -ge 90 ]; then
    print_message "$YELLOW" "\n⚠️  MOSTLY PASSED: $FAILED_TESTS test(s) failed. Review and address issues."
    exit 1
else
    print_message "$RED" "\n❌ TESTS FAILED: $FAILED_TESTS test(s) failed. Deployment needs attention."
    exit 1
fi
