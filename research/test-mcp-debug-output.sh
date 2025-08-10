#!/bin/bash

echo "=== Testing MCP Server Debug Output ==="
echo
echo "This script will test getBusinessDays with debug output enabled"
echo "to verify we can see the missing country parameter issue"
echo

# Kill any existing MCP server
pkill -f "node dist/index.js" 2>/dev/null

echo "1. Starting MCP server with debug enabled..."
echo "   DEBUG=mcp:business,mcp:holidays,mcp:validation,mcp:timezone"
echo

# Start the server with debug output in background
DEBUG=mcp:business,mcp:holidays,mcp:validation,mcp:timezone node dist/index.js 2>&1 &
SERVER_PID=$!

# Give server time to start
sleep 2

echo "2. Making test MCP call for Venezuela business days (Jan 1-5, 2025)..."
echo "   This should show debug output revealing no country support"
echo
echo "--- Debug Output Start ---"

# Make a test call - we'll simulate what the MCP client would do
# Since we can't directly call MCP from bash, we'll create a test script
cat > /tmp/test-mcp-call.js << 'EOF'
const { getBusinessDays } = require('./dist/tools/getBusinessDays');

// Test call similar to what MCP would do
const result = getBusinessDays({
  start_date: '2025-01-01',
  end_date: '2025-01-05',
  timezone: 'America/Caracas'
});

console.log('\nResult:', JSON.stringify(result, null, 2));
EOF

# Run the test with debug enabled
DEBUG=mcp:business,mcp:holidays,mcp:validation,mcp:timezone node /tmp/test-mcp-call.js

echo "--- Debug Output End ---"
echo

echo "3. Analysis:"
echo "   - Check if debug shows 'No holiday information provided'"
echo "   - Check if it shows 'Aggregating holidays for calendar: none'"
echo "   - Check if it shows 'Total holidays found: 0'"
echo

# Clean up
kill $SERVER_PID 2>/dev/null
rm -f /tmp/test-mcp-call.js

echo "=== Test Complete ==="