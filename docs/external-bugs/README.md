# External Bug Tracking

This directory contains bug reports we've filed with external dependencies.

## Why Track External Bugs?

1. **Self-interest**: Fixes upstream mean less workarounds for us
2. **Documentation**: Explains why our implementation differs
3. **Verification**: When fixed, our tests confirm alignment
4. **Community**: Helping improve tools we all use

## Current Bug Reports

### date-holidays Package

- **File**: `date-holidays-chile-monday-rule-bug.md`
- **Issue**: Chile Monday-moving holidays not working for weekends
- **Impact**: Had to implement our own Monday-moving logic
- **Status**: To be filed
- **GitHub Issue**: [Link to be added after filing]

## When Bugs Are Fixed

1. Our verification tests will show alignment
2. Consider removing workarounds in major version update
3. Keep documentation for historical context
4. Update our implementation notes