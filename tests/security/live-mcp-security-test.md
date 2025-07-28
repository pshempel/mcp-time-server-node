# Live MCP Security Test Suite

This document contains security tests to run through the live MCP interface.

## Test 1: Path Traversal - Date Parameter

```javascript
await mcp.get_business_days({
  start_date: "../../../etc/passwd",
  end_date: "2025-01-05"
})
```

**Expected**: Error - invalid date format

## Test 2: SQL Injection - Timezone

```javascript
await mcp.get_current_time({
  timezone: "'; DROP TABLE users; --"
})
```

**Expected**: Error - invalid timezone

## Test 3: XSS - Format String

```javascript
await mcp.get_current_time({
  format: "<script>alert('xss')</script>"
})
```

**Expected**: Error or sanitized output (no script tags)

## Test 4: Command Injection - Timezone

```javascript
await mcp.get_current_time({
  timezone: "UTC; cat /etc/passwd"
})
```

**Expected**: Error - invalid timezone

## Test 5: DoS - Long String

```javascript
await mcp.get_current_time({
  timezone: "A".repeat(10000)
})
```

**Expected**: Error - timezone too long or invalid

## Test 6: DoS - Large Date Range

```javascript
await mcp.get_business_days({
  start_date: "1000-01-01",
  end_date: "9999-12-31"
})
```

**Expected**: Error or reasonable response time

## Test 7: Null Byte Injection

```javascript
await mcp.get_current_time({
  timezone: "UTC\x00admin"
})
```

**Expected**: Error - invalid timezone

## Test 8: Invalid Unit Type

```javascript
await mcp.add_time({
  time: "2025-01-01",
  amount: 1,
  unit: "'; DROP TABLE; --"
})
```

**Expected**: Error - invalid unit

## Test 9: Prototype Pollution

```javascript
await mcp.get_business_days({
  start_date: "2025-01-01",
  end_date: "2025-01-31",
  "__proto__": { "polluted": true }
})
```

**Expected**: Normal response, no pollution

## Test 10: Cache Poisoning

```javascript
await mcp.get_business_days({
  start_date: "2025-01-01",
  end_date: "2025-01-31",
  holiday_calendar: "US\x00admin"
})
```

**Expected**: Error - invalid holiday calendar

## Security Checklist

- [ ] All invalid inputs return proper errors
- [ ] No system paths or internal errors leak
- [ ] No crashes or unhandled exceptions
- [ ] Rate limiting prevents rapid requests
- [ ] Large inputs handled gracefully
- [ ] Special characters properly escaped
- [ ] Cache keys are sanitized (hashed)