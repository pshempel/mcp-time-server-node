# Verified Behavior: Business Logic Utilities

**Decision Date:** 2025-01-31 16:30 EST

## Critical Analysis

After deep analysis of `calculateBusinessHours` and `getBusinessDays`, the shared logic is LIMITED. These tools serve fundamentally different purposes:
- **calculateBusinessHours**: Calculates actual business HOURS/MINUTES within specific time ranges
- **getBusinessDays**: Counts whole DAYS (business vs weekend vs holiday)

## Verified Shared Patterns

### 1. Date Parsing with Timezone (IDENTICAL)
Both tools have this exact helper:
```typescript
const parseDate = (dateStr: string, fieldName: string): Date => {
  try {
    return parseTimeInput(dateStr, timezone).date;
  } catch (error) {
    throw {
      error: createError(
        TimeServerErrorCodes.INVALID_DATE_FORMAT,
        `Invalid ${fieldName} format: ${dateStr}`,
        { /* error details */ }
      ),
    };
  }
};
```

### 2. Holiday Date Parsing (SIMILAR but DIFFERENT)

**calculateBusinessHours approach:**
- Takes simple `holidays: string[]` array
- Stores as `Date[]` for comparison
- Uses `format(h, 'yyyy-MM-dd')` for date matching

**getBusinessDays approach:**
- Takes THREE sources: `holidays[]`, `custom_holidays[]`, `holiday_calendar`
- Stores in `Set<string>` using `toDateString()`
- Supports observed dates from holiday calendars
- Has complex validation for calendar codes

### 3. Weekend Detection (DIFFERENT implementations)

**calculateBusinessHours:**
```typescript
const dayOfWeek = parseInt(formatInTimeZone(day, timezone, 'c'), 10) - 1;
const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;
```

**getBusinessDays:**
```typescript
const isWeekendDay = isWeekend(day); // date-fns function
```

## What to Extract

### 1. `parseDateWithTimezone` utility
- Exact shared pattern for parsing dates with timezone and error handling
- Safe to extract as it's identical in both files

### 2. `parseHolidayDates` utility (BASIC version)
- Extract the common pattern of parsing an array of date strings
- Each tool can extend this for their specific needs
- Must preserve exact error handling

### 3. DO NOT EXTRACT
- Business hours validation (specific to calculateBusinessHours)
- Business hours calculations (specific to calculateBusinessHours)
- Holiday calendar logic (specific to getBusinessDays)
- The actual calculation logic (fundamentally different)

## Implementation Strategy

1. Create `businessUtils.ts` with:
   - `parseDateWithTimezone(dateStr, timezone, fieldName)`
   - `parseHolidayDates(dates, timezone)` - returns Date[]

2. Each tool keeps its specific logic:
   - calculateBusinessHours keeps minute-level calculations
   - getBusinessDays keeps day counting and calendar logic

## Critical Edge Cases to Preserve

1. **Timezone boundaries**: Dates parsed in business timezone
2. **Error messages**: Must maintain exact error structure
3. **Holiday comparison**: Different tools use different comparison methods
4. **Weekend detection**: Keep existing implementations (don't unify)

## Why This Approach

The tools are MORE DIFFERENT than similar. Over-extracting would:
- Create unnecessary abstractions
- Make the code harder to understand
- Risk breaking complex business logic
- Not significantly improve maintainability

By extracting only the truly identical patterns, we:
- Improve consistency where it matters
- Preserve tool-specific optimizations
- Maintain clarity of purpose for each tool
- Reduce risk of introducing bugs