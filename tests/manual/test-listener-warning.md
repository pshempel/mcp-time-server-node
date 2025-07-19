# Manual Test Plan: MaxListenersExceededWarning Fix Verification

## Background
The MCP server previously showed a warning:
```
MaxListenersExceededWarning: Possible EventTarget memory leak detected. 
11 abort listeners added to [AbortSignal].
```

## Fix Applied
- Commit: a591953 
- Solution: Increased maxListeners from default 10 to 20
- Files: src/utils/serverConfig.ts, called in src/index.ts

## Test Procedure

### Test 1: Baseline Test (5 concurrent calls)
Ask Claude: "What time is it in NYC, London, Tokyo, Sydney, and LA?"

**Expected**: No warnings, all times returned correctly

### Test 2: At Default Limit (10 concurrent calls)
Ask Claude to make 10 concurrent time queries using different tools.

**Expected**: No warnings (fix increases limit to 20)

### Test 3: Above Original Limit (15 concurrent calls)
Ask Claude to make 15 different time calculations at once.

**Expected**: No warnings (still under new limit of 20)

### Test 4: At New Limit (20 concurrent calls)
Ask Claude to make 20 concurrent MCP time server calls.

**Expected**: No warnings (exactly at new limit)

### Test 5: Above New Limit (25+ concurrent calls)
Ask Claude to make 25-30 concurrent calls.

**Expected**: Warning MAY appear if exceeding 20 listeners

## How to Monitor

1. Watch the Claude Code terminal where you ran `claude`
2. Look for any output containing "MaxListenersExceededWarning"
3. Note at what concurrent count the warning appears (if at all)

## Test Commands for Claude

```
# Test 1 (5 calls)
Please make these 5 time queries at once:
- Current time in New York
- Current time in London  
- Current time in Tokyo
- Add 5 days to today
- Calculate days until next Monday

# Test 2 (10 calls)
Please make 10 concurrent time calculations using different MCP time tools

# Test 3 (15 calls)
Please make 15 different time queries simultaneously to test the MCP server

# Test 4 (20 calls)
Please stress test the MCP time server with 20 concurrent operations

# Test 5 (25+ calls)
Please make 25 concurrent time calculations to find the server's limit
```

## Recording Results

After each test, note:
- [ ] Did warning appear? (Yes/No)
- [ ] At what concurrent count?
- [ ] Were all responses successful?
- [ ] Any other errors or issues?

## Success Criteria

The fix is working if:
- No warnings appear for up to 20 concurrent calls
- All time calculations return correct results
- Server remains stable under load