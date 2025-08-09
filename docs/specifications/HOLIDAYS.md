# Holiday Data Format Documentation

## Quick Start - Adding a New Country

To add holidays for a new country, edit `src/data/holidays.ts`:

```typescript
const HOLIDAY_DATA: Record<string, Holiday[]> = {
  // ... existing countries ...
  
  // Add your country code and holidays:
  FR: [
    // Fixed holiday (same date every year)
    { name: "New Year's Day", type: 'fixed', month: 1, day: 1, observe: 'always' },
    
    // Floating holiday (e.g., 3rd Monday in January)
    { name: 'Some Holiday', type: 'floating', month: 1, weekday: 1, occurrence: 3, observe: 'always' },
    
    // Last Monday of month (use -1)
    { name: 'Last Monday', type: 'floating', month: 5, weekday: 1, occurrence: -1, observe: 'always' },
  ],
};
```

That's it! The system handles the rest.

## Overview

The MCP Time Server supports holiday calendars for multiple countries. All holiday definitions are stored in `src/data/holidays.ts`.

## Holiday Definition Structure

### Holiday Interface
```typescript
interface Holiday {
  name: string;                    // Display name of the holiday
  type: 'fixed' | 'floating' | 'easter-based';
  month?: number;                  // 1-12 for fixed/floating holidays
  day?: number;                    // Day of month for fixed holidays
  weekday?: number;                // 0-6 (Sunday-Saturday) for floating holidays
  occurrence?: number;             // Which occurrence (-1 = last, 1 = first, 2 = second, etc.)
  observe?: 'always' | 'never' | 'us_federal' | 'uk_bank' | 'au_public';
}
```

## Holiday Types

### 1. Fixed Holidays
Occur on the same date every year.
```typescript
{ name: 'Canada Day', type: 'fixed', month: 7, day: 1, observe: 'us_federal' }
```

### 2. Floating Holidays
Occur on a specific weekday within a month.
```typescript
// First Monday in September
{ name: 'Labor Day', type: 'floating', month: 9, weekday: 1, occurrence: 1, observe: 'always' }

// Last Monday in May (-1 means last occurrence)
{ name: 'Memorial Day', type: 'floating', month: 5, weekday: 1, occurrence: -1, observe: 'always' }

// Second Monday in October
{ name: 'Thanksgiving Day', type: 'floating', month: 10, weekday: 1, occurrence: 2, observe: 'always' }
```

### 3. Easter-Based Holidays
Currently placeholders - require Easter calculation implementation.
```typescript
{ name: 'Good Friday', type: 'easter-based', observe: 'always' }
```

## Observation Rules

### `always`
Holiday is always observed on its actual date.

### `never`
Holiday has no observation rules (e.g., falls on weekend = no substitute day).

### `us_federal`
- Saturday → Friday (observed day before)
- Sunday → Monday (observed day after)

### `uk_bank`
- Saturday → Monday (observed next Monday)
- Sunday → Monday (observed next Monday)

### `au_public`
- Saturday → No change (stays on Saturday)
- Sunday → Monday (observed next Monday)

## Special Cases

### Victoria Day (Canada)
Requires special calculation: "Monday on or before May 24"
```typescript
// Marked with occurrence: -2 as a flag, but handled specially in calculateFloatingHoliday()
{ name: 'Victoria Day', type: 'floating', month: 5, weekday: 1, occurrence: -2, observe: 'always' }
```

## Adding a New Country

1. Add country code and holidays to `HOLIDAY_DATA`:
```typescript
const HOLIDAY_DATA: Record<string, Holiday[]> = {
  // ... existing countries ...
  FR: [
    { name: "New Year's Day", type: 'fixed', month: 1, day: 1, observe: 'always' },
    { name: 'Bastille Day', type: 'fixed', month: 7, day: 14, observe: 'always' },
    // ... more holidays
  ],
};
```

2. If needed, add new observation rules:
   - Add to the `observe` type union
   - Implement in `getObservedDate()` function

3. Write tests in `tests/data/holidays.{country}.test.ts`

## Country-Specific Notes

### United States (US)
- Federal holidays only
- Uses `us_federal` observation rules
- Martin Luther King Jr. Day, Presidents Day, etc.

### United Kingdom (UK)
- Bank holidays
- Uses `uk_bank` observation rules
- Includes Early May, Spring, and Summer bank holidays
- Easter-based holidays pending implementation

### Canada (CA)
- Federal holidays
- Victoria Day requires special calculation
- Remembrance Day marked as 'never' observe (varies by province)
- Uses `us_federal` rules for most holidays

### Australia (AU)
- National public holidays
- Uses `au_public` observation rules (Saturday stays Saturday)
- Includes Easter Saturday (unique among implemented countries)
- Queen's Birthday is 2nd Monday in June (federal standard, varies by state)

## Future Enhancements

1. **Easter Calculation**: Implement algorithm for Easter-based holidays
2. **Regional Variations**: Support state/province-specific holidays
3. **Dynamic Holiday Data**: Load from external sources vs static definitions
4. **Separate Files**: Consider splitting into `src/data/holidays/{country}.ts` as more countries are added