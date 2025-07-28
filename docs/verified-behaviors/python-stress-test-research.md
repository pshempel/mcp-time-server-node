# Python Stress Test Research Findings

## Date: 2025-01-28
## Python Version: 3.11.2 (Debian Bookworm)

### Key Findings

1. **MCP Communication**
   - MCP servers communicate via JSON-RPC over stdin/stdout
   - Each request/response is a single line of JSON
   - Must flush stdin after writing
   - Responses come back on stdout, one per line

2. **Memory Measurement**
   - Use psutil.Process(pid).memory_info().rss for Resident Set Size
   - RSS is the most reliable metric for actual memory usage
   - Initial memory: ~143MB for our Node.js MCP server
   - Memory spike on first request: ~51MB increase (V8 warm-up)
   - Memory stabilizes and can drop below initial (GC working)

3. **Memory Leak Indicators**
   - Continuous growth without plateau = BAD
   - Initial spike then stabilization = NORMAL
   - Memory dropping after requests = GOOD (GC active)

4. **Process Management**
   - Use subprocess.Popen for full control
   - Set text=True for string I/O
   - Set bufsize=0 for unbuffered communication
   - Always terminate() and wait() for cleanup

### Verified Test Approach

```python
# Start server
server = subprocess.Popen(
    ['node', 'dist/index.js'],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True,
    bufsize=0
)

# Monitor memory
proc = psutil.Process(server.pid)
memory_mb = proc.memory_info().rss / 1024 / 1024

# Send MCP request
request = {"jsonrpc": "2.0", "method": "tools/call", "id": 1, "params": {...}}
server.stdin.write(json.dumps(request) + '\n')
server.stdin.flush()

# Read response
response = json.loads(server.stdout.readline())
```

### Memory Patterns Observed

1. **Normal Pattern** (what we saw):
   ```
   Initial: 143.28 MB
   After 1: 194.35 MB (+51.07 MB) - V8 warm-up
   After 2: 142.39 MB (-0.89 MB)  - GC kicked in
   After 3: 142.39 MB (-0.89 MB)  - Stable
   ```

2. **Leak Pattern** (what to detect):
   ```
   Initial: 143 MB
   After 1000: 200 MB
   After 2000: 250 MB
   After 3000: 300 MB
   (Continuous growth)
   ```

### Next Steps
1. Create test that establishes baseline behavior
2. Create test that detects memory leaks
3. Create test runner that outputs context-efficient summaries