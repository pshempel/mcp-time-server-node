#!/bin/bash

# Test rate limiting with rapid requests
echo "=== Testing Rate Limiting ==="
echo "Sending 10 rapid requests with RATE_LIMIT=5..."
echo

# Set low rate limit for testing
export RATE_LIMIT=5
export RATE_LIMIT_WINDOW=1000

# Send 10 requests rapidly
for i in {1..10}; do
    echo -n "Request $i: "
    echo '{"jsonrpc":"2.0","method":"tools/call","id":'$i',"params":{"name":"get_current_time","arguments":{}}}' | \
        node dist/index.js 2>/dev/null | head -n 1 | \
        grep -o '"result":\|"error":[^}]*}' | head -n 1
done

echo
echo "=== Rate limiting test completed ==="