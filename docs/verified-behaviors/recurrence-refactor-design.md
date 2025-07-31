# Recurrence Pattern Refactor Design

## Problem Analysis

The current `nextOccurrence` function has:
- Cyclomatic complexity of 82 (limit is 10)
- 437 lines of code (limit is 50)
- Deep nesting (up to 5 levels)
- Massive switch statement handling all patterns
- Duplicate logic for UTC vs timezone handling
- Mixed concerns (validation, parsing, calculation, caching)

## Proposed Architecture

### 1. Separation of Concerns

```typescript
// Core interfaces
interface RecurrencePattern {
  calculate(from: Date, params: RecurrenceParams): Date;
}

interface RecurrenceParams {
  time?: { hours: number; minutes: number };
  timezone: string;
}

// Pattern-specific interfaces
interface WeeklyParams extends RecurrenceParams {
  dayOfWeek?: number;
}

interface MonthlyParams extends RecurrenceParams {
  dayOfMonth?: number;
}
```

### 2. Strategy Pattern for Recurrence Types

Each recurrence type becomes its own class:

```typescript
class DailyRecurrence implements RecurrencePattern {
  calculate(from: Date, params: RecurrenceParams): Date {
    // Simple, focused logic for daily recurrence
  }
}

class WeeklyRecurrence implements RecurrencePattern {
  calculate(from: Date, params: WeeklyParams): Date {
    // Weekly-specific logic
  }
}

class MonthlyRecurrence implements RecurrencePattern {
  calculate(from: Date, params: MonthlyParams): Date {
    // Monthly-specific logic with overflow handling
  }
}

class YearlyRecurrence implements RecurrencePattern {
  calculate(from: Date, params: RecurrenceParams): Date {
    // Yearly-specific logic
  }
}
```

### 3. Factory Pattern for Pattern Selection

```typescript
class RecurrenceFactory {
  private static patterns = new Map<string, RecurrencePattern>([
    ['daily', new DailyRecurrence()],
    ['weekly', new WeeklyRecurrence()],
    ['monthly', new MonthlyRecurrence()],
    ['yearly', new YearlyRecurrence()],
  ]);

  static getPattern(type: string): RecurrencePattern {
    const pattern = this.patterns.get(type.toLowerCase());
    if (!pattern) {
      throw new Error(`Invalid pattern: ${type}`);
    }
    return pattern;
  }
}
```

### 4. Time Setting Logic Extraction

```typescript
class TimezoneDateBuilder {
  static setTimeInTimezone(
    date: Date, 
    hours: number, 
    minutes: number, 
    timezone: string
  ): Date {
    if (timezone === 'UTC') {
      const result = new Date(date);
      result.setUTCHours(hours, minutes, 0, 0);
      return result;
    }
    
    const zoned = toZonedTime(date, timezone);
    const withTime = setHours(setMinutes(zoned, minutes), hours);
    return fromZonedTime(withTime, timezone);
  }
}
```

### 5. Validation Separation

```typescript
class RecurrenceValidator {
  static validateParams(params: NextOccurrenceParams): void {
    this.validatePattern(params.pattern);
    this.validateTimezone(params.timezone);
    this.validateTime(params.time);
    this.validateStartFrom(params.start_from);
    // Pattern-specific validations
  }
  
  private static validatePattern(pattern: string): void {
    // Validation logic
  }
  
  // Other validation methods...
}
```

### 6. Main Function Simplification

```typescript
export function nextOccurrence(params: NextOccurrenceParams): NextOccurrenceResult {
  // 1. Validate inputs
  RecurrenceValidator.validateParams(params);
  
  // 2. Parse parameters
  const config = parseParameters(params);
  
  // 3. Check cache
  const cached = checkCache(config);
  if (cached) return cached;
  
  // 4. Get pattern strategy
  const pattern = RecurrenceFactory.getPattern(params.pattern);
  
  // 5. Calculate next occurrence
  const nextDate = pattern.calculate(config.startFrom, config);
  
  // 6. Build result
  const result = buildResult(nextDate, config.startFrom);
  
  // 7. Cache and return
  cacheResult(config, result);
  return result;
}
```

## Benefits

1. **Reduced Complexity**: Each function has single responsibility
2. **Testability**: Each component can be tested in isolation
3. **Maintainability**: Changes to one pattern don't affect others
4. **Extensibility**: Easy to add new recurrence patterns
5. **Type Safety**: Better TypeScript support with specific interfaces
6. **Code Reuse**: Common logic extracted to shared utilities

## Migration Strategy

1. Create new files without breaking existing code
2. Write comprehensive tests for new components
3. Implement one pattern at a time
4. Run both old and new in parallel for verification
5. Switch over once all tests pass
6. Remove old implementation

## Complexity Estimates

- Main function: ~10 lines (complexity ~3)
- Each pattern class: ~30-50 lines (complexity ~5-8)
- Validation: ~40 lines (complexity ~8)
- Utilities: ~20 lines each (complexity ~3-4)

Total complexity distributed across 10+ small, focused functions.