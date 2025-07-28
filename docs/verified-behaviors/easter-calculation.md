# Easter Calculation Behavior Verification

**Date**: 2025-07-20
**Libraries**: Pure JavaScript implementation (no external dependencies)
**Algorithm**: Gauss's Easter Algorithm (Computus)

## Purpose
Document the verified behavior of Easter date calculations for implementing Easter-based holidays in the MCP Time Server.

## Research Findings

### 1. Algorithm Selection
- **Gauss's Easter Algorithm** (Computus) is the standard calculation method
- Produces identical results to the Meeus/Jones/Butcher algorithm
- Successfully calculated all test years (2024-2030) matching known dates

### 2. Verified Easter Dates
```
2024: March 31
2025: April 20
2026: April 5
2027: March 28
2028: April 16
2029: April 1
2030: April 21
```

### 3. Easter Date Range
- **Earliest possible**: March 22
- **Latest possible**: April 25
- Easter always falls on Sunday

### 4. Related Holiday Offsets
From Easter Sunday:
- **Good Friday**: -2 days (Friday before Easter)
- **Easter Saturday**: -1 day (Saturday before Easter)
- **Easter Monday**: +1 day (Monday after Easter)
- **Ascension Day**: +39 days (always Thursday)
- **Pentecost**: +49 days (always Sunday)

### 5. Algorithm Implementation
```javascript
function calculateEaster(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return { year, month, day };
}
```

### 6. Date Object Considerations
- JavaScript Date months are 0-indexed (0-11)
- Algorithm returns 1-indexed months (1-12)
- Must subtract 1 from month when creating Date objects

### 7. Century Boundary Testing
Verified algorithm works correctly across centuries:
- 1900: April 15
- 2000: April 23
- 2100: March 28
- 2200: April 6

## Implementation Strategy

### Holiday Type Extension
Current structure supports:
```typescript
type: 'fixed' | 'floating' | 'easter-based'
```

For Easter-based holidays, we'll add optional offset:
```typescript
interface Holiday {
  name: string;
  type: 'easter-based';
  offset?: number;  // Days from Easter Sunday (negative for before)
  observe?: ObservationRule;
}
```

### Examples:
```typescript
{ name: 'Good Friday', type: 'easter-based', offset: -2, observe: 'always' }
{ name: 'Easter Monday', type: 'easter-based', offset: 1, observe: 'always' }
{ name: 'Easter Sunday', type: 'easter-based', offset: 0, observe: 'always' }
```

## Testing Requirements
1. Unit tests for calculateEaster() function with known dates
2. Integration tests for getHolidaysForYear() with Easter holidays
3. Timezone handling tests (Easter date should be consistent globally)
4. Observation rule tests (when Easter Monday falls on existing holiday)

## References
- [Computus - Wikipedia](https://en.wikipedia.org/wiki/Computus)
- Research script: `/research/verify-easter-calculation.js`