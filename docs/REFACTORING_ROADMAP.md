# MCP Time Server - Refactoring Roadmap
**Date**: 2025-07-30  
**Time**: 22:25 EDT  
**Status**: Planning Phase

## Overview

This roadmap outlines our plan to reduce code duplication from ~18% to under 5% while maintaining full functionality and test coverage.

## Current State
- **Duplication**: ~520 lines (18% of codebase)
- **ESLint Errors**: 8 (complexity and line length)
- **Tests**: 905 passing
- **Functionality**: All 10 tools working correctly

## Refactoring Phases

### Phase 0: Safety Net (4 hours)
**Objective**: Establish baseline and rollback capability

- Create comprehensive integration tests capturing current behavior
- Set up feature flags for gradual rollout
- Document current metrics (errors, coverage, performance)
- **Deliverable**: Baseline tests that ensure no regression

### Phase 1: Date Parser Utilities (1.5 days)
**Objective**: Centralize date parsing logic

- Extract common patterns for Unix timestamps, ISO strings, local times
- Create `src/utils/dateParser.ts` with consistent interface
- Follow strict TDD: write tests first, then implement
- **Impact**: -80 lines duplication, reduces complexity in 8 functions

### Phase 2: Cache Wrapper Pattern (1 day)
**Objective**: Eliminate repetitive cache handling

- Create generic `withCache()` higher-order function
- Support different TTL strategies
- Reduce each tool's cache logic to single line
- **Impact**: -120 lines duplication, major line count reduction

### Phase 3: Timezone Resolver (1 day)
**Objective**: Standardize timezone handling

- Extract logic for undefined → system, "" → UTC
- Create `src/utils/timezoneResolver.ts`
- Add timezone validation and error messages
- **Impact**: -60 lines duplication, improved consistency

### Phase 4: Error Factory (0.5 days)
**Objective**: Consistent error handling

- Create standardized error types
- Include context in all errors
- Preserve stack traces
- **Impact**: -100 lines duplication, better debugging

### Phase 5: Debug Logger Enhancement (1 day)
**Objective**: Simplify logging patterns

- Create decorator-based logging
- Automatic entry/exit tracking
- Performance metrics
- **Impact**: -150 lines boilerplate

## Success Metrics

1. **Code Reduction**: Target 500+ lines removed
2. **ESLint Errors**: From 8 → 1 (87.5% reduction)
3. **Test Coverage**: Maintain >95%
4. **Performance**: No regression in response times

## Implementation Guidelines

- **Research + TDD + DRY**: Our core methodology
- **Feature Flags**: Each phase can be toggled on/off
- **Backward Compatible**: No breaking changes to API
- **Incremental**: Each phase is independently valuable

## Timeline

Total estimated time: 7-8 days (accounting for TDD practices)

## Next Steps

1. Complete Phase 0 baseline tests
2. Begin Phase 1 with date parser extraction
3. Validate each phase with full test suite

---

For detailed implementation notes and analysis, see `sessions/refactor-planning/`