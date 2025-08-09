# Technical Debt Tracker

## Debug Infrastructure

### withDebug Function (Low Priority)
**Location:** `src/utils/withDebug.ts`
**Issue:** Currently using old debug pattern, not fully leveraging enhanced debug API
**Current State:** 
- Fixed for compatibility in Phase 1
- Uses `debug[namespace]` pattern instead of enhanced API
- Not actively used in codebase (only in examples)

**Future Work:**
1. Update to use `debug.log()` for auto-namespacing
2. Consider deprecation in favor of decorator pattern
3. Or enhance to work seamlessly with new debug API

**Impact:** Low - not actively used, tests work fine
**Effort:** Small - 1-2 hours
**Priority:** Can wait until decorator support is added

## Other Items
(To be added as discovered)