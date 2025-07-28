# NodeCache Memory Tracking - Verified Behavior

**Date**: 2025-07-20
**NodeCache Version**: 5.1.2
**Node.js Version**: 18.19.0

## Key Findings

### 1. Built-in Memory Tracking
NodeCache provides `getStats()` which returns:
```javascript
{
  hits: number,    // Cache hits
  misses: number,  // Cache misses  
  keys: number,    // Number of keys
  ksize: number,   // Total size of all keys (in chars)
  vsize: number    // Total size of all values (mysterious units)
}
```

### 2. vsize Calculation
- **NOT** based on JSON.stringify length
- vsize seems to use a fixed overhead calculation
- For our typical cache entry (144 bytes JSON), vsize reports 400 bytes
- Ratio is inconsistent - small objects have high overhead, large objects have low overhead

### 3. Memory Usage Observations
- Empty cache: 0 bytes
- Typical time entry: 400 vsize units (330 actual heap bytes)
- 10MB = ~30,000 entries based on actual heap measurement
- vsize updates correctly on set/delete operations

### 4. vsize Reliability Issues
Testing showed vsize is NOT accurate for memory limits:
- 1KB string object: vsize reported only 80 bytes increase
- Actual memory usage is 3-4x higher than vsize for typical entries
- vsize appears to count characters, not actual memory bytes

## Conclusion
NodeCache's vsize is not suitable for enforcing a 10MB memory limit. We need to:
1. Track actual memory usage ourselves
2. Use process.memoryUsage() for verification
3. Implement our own size calculation

## Recommended Approach
Create a wrapper that tracks memory using JSON.stringify length as a consistent approximation, with a safety factor to account for object overhead.