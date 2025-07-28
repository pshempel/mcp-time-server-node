# Holiday Calendar Feature Design

## Overview

Enhance the `get_business_days` tool to support country/region-specific holidays with proper observation rules.

## Design Goals

1. **No external dependencies** - Embed holiday data
2. **Support major countries** - US, UK, Canada, Australia initially
3. **Flexible observation rules** - Per-holiday, not just per-country
4. **Maintainable** - Easy to add new countries/holidays
5. **Performant** - Efficient holiday lookups

## Proposed API Changes

### Current Parameters
```typescript
interface GetBusinessDaysParams {
  start_date: string;
  end_date: string;
  exclude_weekends?: boolean;
  holidays?: string[];  // Simple date array
  timezone?: string;
}
```

### Enhanced Parameters (Backward Compatible)
```typescript
interface GetBusinessDaysParams {
  start_date: string;
  end_date: string;
  exclude_weekends?: boolean;
  holidays?: string[];  // Keep for backward compatibility
  timezone?: string;
  
  // New optional parameters
  holiday_calendar?: string;  // 'US', 'UK', 'CA', 'AU'
  include_observed?: boolean;  // Default: true
  custom_holidays?: string[];  // Additional holidays
}
```

## Holiday Data Structure

### Holiday Definition
```typescript
interface Holiday {
  name: string;
  type: 'fixed' | 'floating' | 'easter-based' | 'custom';
  
  // For fixed holidays
  month?: number;  // 1-12
  day?: number;    // 1-31
  
  // For floating holidays
  weekday?: number;     // 0-6 (Sunday-Saturday)
  occurrence?: number;  // 1-5 (1st-5th) or -1 (last)
  
  // For Easter-based
  daysFromEaster?: number;  // e.g., -2 for Good Friday
  
  // Observation rules
  observe?: 'always' | 'never' | 'us_federal' | 'uk_bank' | 'next_weekday';
}

interface CountryHolidays {
  [countryCode: string]: {
    holidays: Holiday[];
    defaultObserve?: string;  // Default observation rule
  };
}
```

### Example Data
```typescript
const HOLIDAY_DATA: CountryHolidays = {
  US: {
    holidays: [
      { name: "New Year's Day", type: 'fixed', month: 1, day: 1, observe: 'us_federal' },
      { name: "Martin Luther King Jr. Day", type: 'floating', month: 1, weekday: 1, occurrence: 3, observe: 'always' },
      { name: "Independence Day", type: 'fixed', month: 7, day: 4, observe: 'us_federal' },
      { name: "Thanksgiving", type: 'floating', month: 11, weekday: 4, occurrence: 4, observe: 'always' },
      { name: "Christmas Day", type: 'fixed', month: 12, day: 25, observe: 'us_federal' },
    ],
    defaultObserve: 'us_federal'
  },
  UK: {
    holidays: [
      { name: "New Year's Day", type: 'fixed', month: 1, day: 1, observe: 'uk_bank' },
      { name: "Good Friday", type: 'easter-based', daysFromEaster: -2, observe: 'always' },
      { name: "Christmas Day", type: 'fixed', month: 12, day: 25, observe: 'uk_bank' },
      { name: "Boxing Day", type: 'fixed', month: 12, day: 26, observe: 'uk_bank' },
    ],
    defaultObserve: 'uk_bank'
  }
};
```

## Implementation Plan

### Phase 1: Core Infrastructure
1. Create holiday data module (`src/data/holidays.ts`)
2. Implement holiday calculation functions
3. Implement observation rule functions
4. Add caching for calculated holidays

### Phase 2: Update get_business_days
1. Add new parameters to interface
2. Integrate holiday calendar lookup
3. Merge calendar holidays with custom holidays
4. Update business day calculation logic

### Phase 3: Testing
1. Unit tests for holiday calculations
2. Unit tests for observation rules
3. Integration tests with various scenarios
4. Performance tests with large date ranges

### Phase 4: Documentation
1. Update tool documentation
2. Add examples for each country
3. Document holiday data maintenance

## Technical Details

### Holiday Calculation Service
```typescript
class HolidayService {
  getHolidaysForYear(country: string, year: number): Date[];
  getObservedDate(holiday: Date, rule: string): Date;
  isHoliday(date: Date, country: string, year: number): boolean;
}
```

### Easter Calculation
For Easter-based holidays, we'll embed pre-calculated Easter dates for supported years (2020-2030) to avoid complex Computus algorithm implementation.

### Caching Strategy
- Cache calculated holidays per country/year
- Cache TTL: 24 hours (same as business days)
- Cache key: `holidays_${country}_${year}`

## Testing Scenarios

1. **Basic holidays** - Fixed dates like Christmas
2. **Floating holidays** - MLK Day, Thanksgiving
3. **Observed holidays** - July 4th on weekend
4. **Consecutive holidays** - UK Christmas/Boxing Day on weekend
5. **Mixed scenarios** - Calendar + custom holidays
6. **Performance** - 10-year date range calculation

## Future Enhancements

1. **Regional support** - US-CA, US-NY for state holidays
2. **More countries** - Expand beyond initial 4
3. **Holiday names in results** - Return which holidays affected calculation
4. **Corporate calendars** - NYSE, NASDAQ trading days
5. **Dynamic holiday data** - Load from configuration file