# Next Session Plan - Phase 0 Refactoring

## Priority 1: calculateBusinessHours Refactor
**Current Issues:**
- Complexity: 17 (limit: 15)
- Lines: 136 (limit: 110)
- Main issue: Large withCache arrow function (lines 68-231)

**Refactor Strategy (TDD Approach):**

### Step 1: Research & Verify
- Analyze existing function behavior
- Document all edge cases and invariants
- Create research script to verify date-fns behavior

### Step 2: Write Tests First (RED)
Create comprehensive tests for new functions:
- `processSingleDay()` - Handle single day calculation
- `setupDateRange()` - Initialize start/end dates  
- `aggregateBusinessResults()` - Final calculations

### Step 3: Extract Functions (GREEN)
```typescript
// Extract from main arrow function
function processSingleDay(
  dayDateStr: string,
  timezone: string,
  businessHours: BusinessHours | undefined,
  holidayDates: Date[],
  include_weekends: boolean
): DayBusinessResult

function setupDateRange(
  start_time: string,
  end_time: string,
  timezone: string
): { startDate: Date; endDate: Date }

function aggregateBusinessResults(
  breakdown: DayBusinessResult[]
): CalculateBusinessHoursResult
```

### Step 4: Preserve Debug Namespaces
Ensure all extracted functions maintain appropriate debug calls:
- `debug.business` for business logic
- `debug.timing` for time calculations
- `debug.validation` for input validation

## Priority 2: Other Pending Refactors

### getBusinessDays (Complexity 21)
- Similar approach to calculateBusinessHours
- Lower priority but follows same pattern

### withDebug Enhancement
- Update to use enhanced debug API fully
- Add performance metrics collection
- Integrate with debugEnhanced patterns

## Todos to Maintain Focus

### Immediate (This Session):
1. ✅ Fix import order violations (DONE)
2. ✅ Suppress false positive warnings (DONE)
3. ⏳ Refactor calculateBusinessHours

### Next Session:
1. Refactor calculateBusinessHours (Priority 1)
2. Update withDebug to use enhanced debug API
3. Fix debug capture tests (module reload issue)

### Future Sessions:
1. Add debug to remaining utilities (resolveTimezone, businessUtils)
2. Consider refactoring getBusinessDays (complexity 21)
3. Phase 6: Expose natural language endpoints

## Success Metrics
- calculateBusinessHours complexity: 17 → ≤15
- calculateBusinessHours lines: 136 → ≤110
- All tests passing (maintain 99%+ coverage)
- Debug coverage maintained in extracted functions

## Notes from Session 100
- Import order issues resolved
- False positives documented with ESLint disable comments
- Complexity analysis script created in research/
- Clear extraction points identified