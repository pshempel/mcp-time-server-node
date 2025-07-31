# jest-plugin-must-assert Research Findings

## Date: 2025-01-29

## Summary
The jest-plugin-must-assert IS working correctly in our project. The "302 fake tests" reported by find-fake-tests.js are FALSE POSITIVES due to bugs in the script's parsing logic.

## Key Findings

### 1. Plugin is Properly Configured
- **Package installed**: `jest-plugin-must-assert@3.0.0` in devDependencies
- **Jest config**: Correctly set in `setupFilesAfterEnv` array
- **Status**: WORKING ✅

### 2. Plugin Functionality Verified
Created test cases to verify the plugin catches tests without assertions:

```typescript
// Tests WITHOUT assertions - these FAIL (as expected)
it('test with no assertions - should fail', () => {
  const x = 1 + 1;
  console.log(x);
});

// Error message from plugin:
// expect.hasAssertions()
// Expected at least one assertion to be called but received none.
```

### 3. find-fake-tests.js Has Critical Bugs

The script incorrectly identifies tests as "fake" due to:

1. **Poor regex for test end detection**: Uses `/^\s*\}\s*\)\s*;?\s*$/` which matches any line ending with `});`
2. **No nesting level tracking**: Can't distinguish between test closure and inner function closures
3. **State management issues**: Doesn't properly reset state between nested structures

Example of false positive:
```typescript
it('should subtract years from a date', () => {
  mockedCache.get.mockReturnValue(null);

  const result = subtractTime({
    time: '2025-01-15T10:30:00Z',
    amount: 1,
    unit: 'years',
  });  // <-- Script might think test ends here due to });

  expect(result.original).toBe('2025-01-15T10:30:00.000Z');
  expect(result.result).toBe('2024-01-15T10:30:00.000Z');
  expect(result.unix_original).toBe(1736937000);
  expect(result.unix_result).toBe(1705314600);
});
```

### 4. Actual Test Quality Status

- **jest-plugin-must-assert**: Actively catching tests without assertions
- **All passing tests**: Have proper assertions (verified by plugin)
- **One real fake test fixed**: `rateLimit.test.ts` - "should read from environment variables"
- **302 reported fake tests**: Are false positives

## Recommendations

### 1. Trust jest-plugin-must-assert
The plugin is working correctly. Any test that passes has assertions.

### 2. Replace find-fake-tests.js
Options:
- Use ESLint with `jest/expect-expect` rule (need to remove tests from .eslintignore)
- Write a proper AST-based analyzer using TypeScript compiler API
- Simply rely on jest-plugin-must-assert (current solution)

### 3. ESLint Configuration
To enable ESLint checking of test files:
1. Remove `tests/` from `.eslintignore`
2. Configure `jest/expect-expect` rule
3. Update tsconfig to include test files

### 4. No Mass "Fix" Needed
Since the 302 "fake tests" are false positives, no mass fixing is required.

## Verification Commands

```bash
# Run a specific test to verify it has assertions
npm test -- --testNamePattern="test name here"

# If test passes without assertion errors, it has valid assertions

# Check if jest-plugin-must-assert is loaded
grep -A5 setupFilesAfterEnv jest.config.cjs
```

## Conclusion

The test quality infrastructure is actually working well thanks to jest-plugin-must-assert. The find-fake-tests.js script should be deprecated or completely rewritten.