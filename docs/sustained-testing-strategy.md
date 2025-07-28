# Sustained Testing Strategy - Context Efficient Approach

## Problem
Sustained stress tests generate massive output that quickly exhausts the LLM's context window.

## Solution: Smart Output Management

### 1. File-Based Test Reporting
```javascript
// Instead of console.log every request
const testResults = {
  startTime: Date.now(),
  requests: 0,
  errors: 0,
  memorySnapshots: [],
  anomalies: []
};

// Write to file every 1000 requests
if (testResults.requests % 1000 === 0) {
  fs.appendFileSync('stress-test-results.json', JSON.stringify(testResults));
}
```

### 2. Sampling Strategy
- Memory snapshots: Every 30 seconds, not every request
- Performance metrics: Average over 100-request windows
- Error reporting: Count + first 3 examples only

### 3. Background Test Runners
```bash
# Run test in background, redirect output
npm run test:stress > stress-test.log 2>&1 &
TEST_PID=$!

# Check periodically
tail -n 50 stress-test.log  # Last 50 lines only
```

### 4. Summary-Only Reporting
```javascript
// BAD - fills context
console.log(`Request ${i}: ${result}`);  // 10,000 lines!

// GOOD - preserves context
console.log(`Completed: ${completed}, Failed: ${failed}, Avg: ${avgMs}ms`);
```

### 5. Threshold Alerts
Only report when:
- Memory usage > 80% of limit
- Response time > 99th percentile
- Error rate > 1%
- Unusual patterns detected

### 6. Test Organization
```
tests/
  stress/
    memory-leak.test.ts      # 5-minute test
    cache-overflow.test.ts   # Cache flooding
    concurrent.test.ts       # Parallel requests
    resource-limits.test.ts  # CPU/Memory limits
  stress-results/           
    summary.json            # Aggregated results
    anomalies.log          # Only problems
    metrics/               # Detailed data files
```

## Implementation Plan

### Phase A: Create Test Infrastructure
1. Build result aggregator class
2. Create file-based reporters
3. Set up background runner scripts

### Phase B: Memory Leak Tests
1. Heap snapshot comparisons
2. Handle/timer tracking
3. 5-minute sustained runs

### Phase C: Attack Simulations
1. Cache flooding (unique keys)
2. Rate limit testing (boundary conditions)
3. Concurrent request storms

### Phase D: Analysis Tools
1. Result parser/summarizer
2. Anomaly detector
3. Trend analyzer

## Context-Preserving Commands

```bash
# Run all stress tests, show summary only
make stress-test-summary

# Check test progress without full output
make stress-test-status

# Get anomalies only
make stress-test-anomalies

# Parse results into report
make stress-test-report
```

## Expected Outputs (Context-Friendly)

### Instead of:
```
Request 1: 2.1ms
Request 2: 1.8ms
... (10,000 lines)
```

### We'll see:
```
Stress Test Summary (5 minutes)
- Total requests: 10,000
- Success rate: 99.9%
- Avg response: 2.3ms (p99: 5.2ms)
- Memory: Start 50MB → End 52MB (stable)
- Anomalies: 2 (see stress-results/anomalies.log)
- Full results: stress-results/run-2025-01-28.json
```

This approach lets us run comprehensive tests without burning context!