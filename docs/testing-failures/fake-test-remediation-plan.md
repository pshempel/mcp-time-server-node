# Fake Test Remediation Plan

## Overview
- **Total Fake Tests**: 302
- **Suspicious Tests**: 60
- **Estimated Time**: ~10 hours (2 min/test average)
- **Approach**: Fix in small batches using existing research documentation

## Quick Start for Next Session

```bash
# 1. See current fake tests
make test-quality

# 2. Run audit to get detailed list
node research/find-fake-tests.js > fake-tests-detailed.txt

# 3. Start with first batch (see Group 1 below)
```

## Test Groups by Research Area

### Group 1: Environment Variable Tests (Priority: HIGH)
- **Count**: ~5 tests
- **Research Doc**: `sessions/session-036-env-vars-and-time-testing.md`
- **Key Pattern**: Tests that set process.env but don't verify
- **Example**: `tests/utils/rateLimit.test.ts` - "should read from environment variables"

### Group 2: Date Subtraction Tests
- **Count**: ~35 tests in subtractTime
- **Research Doc**: `docs/verified-behaviors/date-arithmetic.md`
- **Pattern**: All have the operation but no expect() on result
- **Files**: `tests/tools/subtractTime.test.ts`

### Group 3: Business Days Tests  
- **Count**: ~40 tests
- **Research Doc**: `docs/verified-behaviors/business-days-calculation.md`
- **Pattern**: Calculate but don't assert on business_days, weekends, holidays
- **Files**: `tests/tools/getBusinessDays.test.ts`

### Group 4: Next Occurrence Tests
- **Count**: ~30 tests
- **Research Doc**: `docs/verified-behaviors/recurring-events.md`
- **Pattern**: Find next occurrence but don't verify the date
- **Files**: `tests/tools/nextOccurrence.test.ts`

### Group 5: Cache Tests
- **Count**: ~25 tests
- **Research Doc**: `src/cache/config.ts` (for TTLs)
- **Pattern**: Mock cache calls but don't verify set/get
- **Files**: Various tool tests with caching

### Group 6: Integration Tests
- **Count**: ~50 tests
- **Research Doc**: Tool-specific behavior docs
- **Pattern**: Complex scenarios without assertions
- **Files**: `tests/integration/**/*.test.ts`

## Fix Template

```javascript
// Step 1: Identify what to test from the test name
it('should subtract years from a date', () => {

// Step 2: Look up expected behavior in research
// From docs/verified-behaviors/date-arithmetic.md:
// - Subtracting 1 year from 2025-01-15 → 2024-01-15

// Step 3: Add assertion based on research
  const result = subtractTime({
    time: '2025-01-15T10:30:00Z',
    amount: 1,
    unit: 'years'
  });
  
  expect(result.result).toBe('2024-01-15T10:30:00.000Z');
  expect(result.difference).toContain('-1 year');
});
```

## Research Quick Reference

### Date/Time Patterns
```javascript
// From research:
parseISO('2025-01-01') // → 2025-01-01T00:00:00.000Z (UTC!)
new Date(2025, 0, 1)   // → Local timezone
format(date, 'yyyy-MM-dd') // → Local date string
```

### Business Days
```javascript
// Mon-Fri = 5 business days, 0 weekends
// Include holidays array to exclude them
// timezone parameter affects date interpretation
```

### Caching
```javascript
// All tools cache for 1 hour (3600000 ms)
// Cache key includes ALL parameters + timezone
// mockedCache.set.mock.calls[0] shows [key, value, ttl]
```

## Batch Processing Workflow

### For Each Session:

1. **Pick a group** (start with Group 1 - highest priority)
2. **Open research docs** for that group
3. **Fix 10-20 tests**:
   ```bash
   # Test single fix
   npm test -- --testNamePattern="exact test name"
   
   # Test whole file after batch
   npm test tests/tools/[tool].test.ts
   ```
4. **Commit batch**:
   ```bash
   git add -p  # Review each change
   git commit -m "fix: add assertions to [area] tests (X/302)"
   ```

## Progress Tracking

### Session Template
```markdown
## Session XXX - [Date]
Started: X fake tests remaining
Fixed: Y tests in [area]
Research used: [docs]
Issues found: [any bugs]
Remaining: Z tests

### Fixed Tests:
- [ ] test name 1
- [ ] test name 2
...
```

## Verification Commands

```bash
# After fixing a batch, verify no new fake tests
npm test [file] 2>&1 | grep "Expected at least one assertion"

# Should return nothing if all tests have assertions
```

## Red Flags to Watch For

1. **Test fails after adding correct assertion** → Found a bug!
2. **Can't find research for behavior** → Need new research
3. **Test name doesn't match what it does** → Needs refactor
4. **Assertion seems wrong** → Double-check research

## Next Session Checklist

- [ ] Run `make test-quality` to see current state
- [ ] Start with Group 1 (env var tests)
- [ ] Have research docs open
- [ ] Fix in batches of 10-20
- [ ] Commit after each successful batch
- [ ] Update progress in this doc

---

Remember: We have jest-plugin-must-assert now, so no new fake tests can sneak in!