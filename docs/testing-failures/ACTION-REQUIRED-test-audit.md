# ACTION REQUIRED: Test Audit for Next Session

## CRITICAL: We Found a Fake Test

In session 036, we discovered a test that was **passing but not testing anything**:

```javascript
it('should read from environment variables', () => {
  process.env.RATE_LIMIT = '200';
  process.env.RATE_LIMIT_WINDOW = '120000';

  rateLimiter = new SlidingWindowRateLimiter();
  // Should use 200 requests per 120000ms (2 minutes)

  delete process.env.RATE_LIMIT;
  delete process.env.RATE_LIMIT_WINDOW;
});
```

**This test had ZERO assertions!** It was marked as passing while hiding critical bugs.

## Required Actions for Next Session

### 1. Find All Tests Without Assertions
```bash
# Search for test files that might have no expect() calls
rg "it\(" --type ts tests/ -A 10 | rg -v "expect\("
```

### 2. Add ESLint Rule
```json
// .eslintrc.json
{
  "rules": {
    "jest/expect-expect": "error"
  }
}
```

### 3. Audit Checklist
- [ ] Every test has at least one `expect()`
- [ ] Test would fail if implementation was broken
- [ ] Both success and failure cases are tested
- [ ] No console.log instead of assertions

### 4. Fix Any Found Issues
Convert fake tests to real tests with proper assertions.

## This is not optional - it's a critical quality issue!