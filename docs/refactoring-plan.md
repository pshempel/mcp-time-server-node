# Complexity Refactoring Plan with Debug Integration

## Overview
22 complexity/length errors remaining after fixing 51 linting issues. This plan orders tasks by actual refactoring difficulty to enable surgical, efficient fixes.

## Strategy Update: Add Debug During Refactoring
- Add debug statements as we refactor each file
- Keep debug additions minimal and focused
- Test after each file to ensure nothing breaks
- Commit each file separately for clean history
- After refactoring, add debug to remaining files for consistency

## Refactoring Order (Easiest → Hardest)

### 1. ✅ EASIEST: holidays.ts
- **Functions**: `calculateFloatingHoliday` (complexity 12), `getObservedDate` (complexity 16)
- **Strategy**: Extract each switch case into separate functions
- **Estimated effort**: 15 minutes
- **Status**: COMPLETED

### 2. ✅ EASY: index.ts 
- **Function**: `main()` - 73 lines (limit 50)
- **Strategy**: Extract server setup and tool registration into separate functions
- **Estimated effort**: 15 minutes
- **Status**: COMPLETED

### 3. ✅ EASY: getCurrentTime.ts
- **Function**: `getCurrentTime` - 57 lines, complexity 17
- **Strategy**: Extract validation, timezone resolution, and formatting sections
- **Estimated effort**: 20 minutes
- **Status**: COMPLETED

### 4. ✅ EASY: calculateDuration.ts (formatDuration only)
- **Function**: `formatDuration` - complexity 12
- **Strategy**: Extract unit formatting logic into helper functions
- **Estimated effort**: 15 minutes
- **Status**: COMPLETED

### 5. ✅ MEDIUM: daysUntil.ts
- **Function**: `daysUntil` - 77 lines, complexity 23
- **Strategy**: Extract date parsing variations and calculation logic
- **Estimated effort**: 30 minutes
- **Status**: COMPLETED

### 6. ✅ MEDIUM: addTime.ts
- **Function**: `addTime` - 121 lines, complexity 29
- **Strategy**: Extract validation, timezone handling, calculation, and result building
- **Estimated effort**: 45 minutes
- **Status**: COMPLETED (but helpers need further refactoring)

### 7. ✅ MEDIUM: convertTimezone.ts
- **Function**: `convertTimezone` - 126 lines, complexity 29
- **Strategy**: Similar pattern to addTime - extract validation and conversion logic
- **Estimated effort**: 45 minutes
- **Status**: COMPLETED (4 phases)

### 8. 🟡 MEDIUM: formatTime.ts (isValidFormatString)
- **Function**: `isValidFormatString` - 162 lines
- **Strategy**: Break validation list into logical groups
- **Estimated effort**: 30 minutes

### 9. 🟠 HARD: getBusinessDays.ts
- **Function**: `getBusinessDays` - 159 lines, complexity 29
- **Strategy**: Separate holiday logic from date calculations
- **Estimated effort**: 1 hour

### 10. ✅ HARD: calculateDuration.ts (calculateDuration)
- **Function**: `calculateDuration` - 122 lines, complexity 32
- **Strategy**: Extract unit conversion logic and calculation branches
- **Estimated effort**: 1 hour
- **Status**: COMPLETED (3 phases)

### 11. 🟠 HARD: formatTime.ts (formatTime)
- **Function**: `formatTime` - 132 lines, complexity 30
- **Strategy**: Extract format type handlers and switching logic
- **Estimated effort**: 1 hour

### 12. 🔴 HARDEST: calculateBusinessHours.ts
- **Function**: `calculateBusinessHours` - 206 lines, complexity 35, deep nesting
- **Strategy**: Major restructuring - extract day processing, hour calculations
- **Estimated effort**: 2 hours

## Remaining Refactoring Tasks (Phased Approach)

### Phase 1: Fix addTime.ts Helpers
- **Functions**: `parseDateWithTimezone` (65 lines, complexity 11), `formatAddTimeResult` (58 lines)
- **Strategy**: Further extract parsing logic and formatting branches
- **Estimated effort**: 45 minutes

### Phase 2: Refactor formatTime.ts (formatTime)
- **Function**: `formatTime` - 132 lines, complexity 30
- **Strategy**: Extract format type handlers and switching logic
- **Estimated effort**: 1 hour

### Phase 3: Refactor getBusinessDays.ts
- **Function**: `getBusinessDays` - 159 lines, complexity 29
- **Strategy**: Separate holiday logic from date calculations
- **Estimated effort**: 1 hour

### Phase 4: Refactor formatTime.ts (isValidFormatString)
- **Function**: `isValidFormatString` - 162 lines
- **Strategy**: Break validation list into logical groups
- **Estimated effort**: 30 minutes

### Phase 5: Refactor calculateBusinessHours.ts
- **Function**: `calculateBusinessHours` - 206 lines, complexity 35, nesting depth 5
- **Strategy**: Major restructuring - extract day processing, hour calculations
- **Estimated effort**: 2 hours

## Total Remaining Time: ~5.25 hours

## Duplicate Code Cleanup (After Refactoring)
- Comprehensive codebase review for duplicate patterns
- Design shared helper architecture
- Create meta-tests to detect code duplication
- Extract common patterns (cache operations, validation, error handling)
- Estimated effort: 4-6 hours

## Key Principles
1. **One file per commit** - Each refactoring gets its own commit
2. **Test after each extraction** - Ensure no regression
3. **Descriptive function names** - Self-documenting code
4. **No logic changes** - Pure refactoring, behavior unchanged
5. **Start with easy wins** - Build momentum and patterns
6. **Add debug strategically** - At function entry/exit and key decision points

## Debug Integration Pattern
```typescript
import { debug } from '../utils/debug';

// Main function entry/exit
debug.tools('functionName called with: %O', params);
// ... logic ...
debug.tools('functionName returning: %O', result);

// Extracted functions - focused debug
function validateParams(params) {
  debug.tools('Validating params...');
  // validation
}

function calculateResult(data) {
  debug.tools('Calculating with timezone: %s', data.timezone);
  // calculation
}
```

## Files Needing Debug After Refactoring
- subtractTime.ts
- nextOccurrence.ts 
- All recurrence/*.ts files (7 files)
- cache/timeCache.ts
- cache/memoryAwareCache.ts

Total additional files: ~11 files (est. 2-3 hours)
