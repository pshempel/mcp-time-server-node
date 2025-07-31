#!/bin/bash
# Quick check for fake tests after remediation

set -euo pipefail

echo "=== Fake Test Quick Check ==="
echo "Running test suite to find remaining fake tests..."
echo "This will show all test output (errors and all)..."
echo ""

# Run tests and let all output show
# We'll save output to analyze while still showing it
temp_file=$(mktemp)
trap 'rm -f "$temp_file"' EXIT

echo "Running: npm test"
echo "----------------------------------------"

# Run tests, showing ALL output to user
npm test | tee "$temp_file"

echo "----------------------------------------"
echo ""
echo "Analyzing results for fake tests..."

# Now analyze the saved output
if grep -q "Expected at least one assertion" "$temp_file"; then
    count=$(grep -c "Expected at least one assertion" "$temp_file" || true)
    echo ""
    echo "❌ Found ${count:-0} fake test(s) that need assertions!"
    echo ""
    echo "Failed tests:"
    grep -B2 "Expected at least one assertion" "$temp_file" | grep "●" || true
else
    echo ""
    echo "✅ No fake tests found! All tests have assertions."
fi

echo ""
echo "For detailed analysis: make test-quality"
echo "For remediation plan: docs/testing-failures/fake-test-remediation-plan.md"