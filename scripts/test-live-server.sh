#!/bin/bash

# MCP Time Server Live Test Suite
# This script tests all 8 tools with various scenarios

echo "=== MCP Time Server Live Test Suite ==="
echo

# Function to send JSON-RPC request and display result
send_request() {
    local id=$1
    local request=$2
    local description=$3
    
    echo "Test $id: $description"
    echo "Request: $request"
    echo -n "Response: "
    echo "$request" | node dist/index.js | head -n 1
    echo
}

# Test 1: Get Current Time
send_request 1 \
    '{"jsonrpc":"2.0","method":"tools/call","id":1,"params":{"name":"get_current_time","arguments":{"timezone":"America/New_York"}}}' \
    "Get current time in New York"

# Test 2: Convert Timezone
send_request 2 \
    '{"jsonrpc":"2.0","method":"tools/call","id":2,"params":{"name":"convert_timezone","arguments":{"time":"2025-01-20T15:00:00Z","from_timezone":"UTC","to_timezone":"Asia/Tokyo"}}}' \
    "Convert UTC to Tokyo time"

# Test 3: Add Time
send_request 3 \
    '{"jsonrpc":"2.0","method":"tools/call","id":3,"params":{"name":"add_time","arguments":{"time":"2025-01-20","amount":7,"unit":"days"}}}' \
    "Add 7 days to a date"

# Test 4: Subtract Time
send_request 4 \
    '{"jsonrpc":"2.0","method":"tools/call","id":4,"params":{"name":"subtract_time","arguments":{"time":"2025-01-20T15:00:00","amount":3,"unit":"hours"}}}' \
    "Subtract 3 hours from a time"

# Test 5: Calculate Duration
send_request 5 \
    '{"jsonrpc":"2.0","method":"tools/call","id":5,"params":{"name":"calculate_duration","arguments":{"start_time":"2025-01-20T09:00:00","end_time":"2025-01-20T17:30:00"}}}' \
    "Calculate work day duration"

# Test 6: Get Business Days
send_request 6 \
    '{"jsonrpc":"2.0","method":"tools/call","id":6,"params":{"name":"get_business_days","arguments":{"start_date":"2025-01-01","end_date":"2025-01-31","holidays":["2025-01-01","2025-01-20"]}}}' \
    "Calculate business days in January 2025"

# Test 7: Next Occurrence
send_request 7 \
    '{"jsonrpc":"2.0","method":"tools/call","id":7,"params":{"name":"next_occurrence","arguments":{"pattern":"weekly","day_of_week":1,"time":"09:00"}}}' \
    "Find next Monday at 9:00 AM"

# Test 8: Format Time
send_request 8 \
    '{"jsonrpc":"2.0","method":"tools/call","id":8,"params":{"name":"format_time","arguments":{"time":"2025-01-20T15:00:00Z","format":"relative"}}}' \
    "Format time as relative"

# Test Error Handling
echo "=== Error Handling Tests ==="
send_request 9 \
    '{"jsonrpc":"2.0","method":"tools/call","id":9,"params":{"name":"convert_timezone","arguments":{"time":"invalid-date","from_timezone":"UTC","to_timezone":"America/New_York"}}}' \
    "Test invalid date error"

send_request 10 \
    '{"jsonrpc":"2.0","method":"tools/call","id":10,"params":{"name":"get_current_time","arguments":{"timezone":"Invalid/Timezone"}}}' \
    "Test invalid timezone error"

echo "=== All tests completed ==="