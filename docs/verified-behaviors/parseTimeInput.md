# parseTimeInput Verified Behavior

**Decision Date:** 2025-08-07 23:30 EST
**Research Script:** research/parseTimeInput-behavior.js

## Purpose
Consolidate all date/time parsing logic into a single, well-tested utility function to eliminate ~80 lines of duplication across the codebase.

## Current State Analysis
The codebase has 8+ different files implementing similar parsing logic with variations:
- Unix timestamp detection (2 patterns: regex vs string comparison)
- ISO string parsing with parseISO
- Timezone-aware parsing with toDate
- Native Date constructor as fallback
- Inconsistent error handling

## Verified Behaviors

### 1. Unix Timestamp Parsing
**Input Pattern:** String containing only digits
**Detection:** `/^\d+$/.test(input)`
**Conversion:** 
- Assume seconds: `new Date(parseInt(input, 10) * 1000)`
- Milliseconds if > 10 digits (after year 2286)

**Verified:**
- "1735689600" → 2025-01-01T00:00:00.000Z (seconds)
- "1735689600000" → 2025-01-01T00:00:00.000Z (milliseconds)
- Native Date("1735689600") returns Invalid Date

### 2. ISO Strings with Timezone Information
**Input Pattern:** ISO 8601 with 'Z' suffix or offset (+/-HH:MM)
**Detection:** `input.includes('Z') || /[+-]\d{2}:\d{2}/.test(input)`
**Parsing:** `parseISO(input)` preserves timezone information

**Verified:**
- "2025-01-01T12:00:00Z" → UTC time preserved
- "2025-01-01T12:00:00+05:00" → Offset preserved
- "2025-01-01T12:00:00-08:00" → Negative offset preserved

### 3. ISO Strings without Timezone
**Input Pattern:** ISO 8601 without timezone indicator
**Behavior:** Parse as local time in specified timezone

**Critical Project Convention:**
- `undefined` timezone → System local timezone
- `""` (empty string) timezone → UTC
- Other string → Specific IANA timezone

**Parsing Strategy:**
```javascript
if (timezone === "" || timezone === "UTC") {
  // Parse as UTC
  return toDate(input, { timeZone: "UTC" });
} else if (timezone) {
  // Parse as local time in specified timezone
  return toDate(input, { timeZone: timezone });
} else {
  // Parse as system local time
  return parseISO(input);
}
```

### 4. Date-Only Strings
**Input Pattern:** "YYYY-MM-DD"
**Project Convention:** Parse as UTC (not local)

**Verified Behavior:**
- parseISO("2025-01-01") → Treats as start of day in LOCAL timezone
- new Date("2025-01-01") → Treats as UTC midnight
- **Decision:** Use parseISO and apply timezone logic consistently

### 5. Invalid Input Handling
**Invalid Patterns:**
- Empty string
- null/undefined
- Non-date strings ("tomorrow", "next week")
- Malformed dates

**Response:** Throw TimeServerErrorCodes.INVALID_DATE_FORMAT with details

### 6. Timezone Detection Algorithm
```javascript
function hasTimezoneInfo(input: string): boolean {
  return input.includes('Z') || /[+-]\d{2}:\d{2}$/.test(input);
}

function extractOffset(input: string): number | null {
  const match = input.match(/([+-])(\d{2}):(\d{2})$/);
  if (!match) return null;
  
  const sign = match[1] === '+' ? 1 : -1;
  const hours = parseInt(match[2], 10);
  const minutes = parseInt(match[3], 10);
  return sign * (hours * 60 + minutes);
}
```

## Consolidated Algorithm

```typescript
function parseTimeInput(
  input: string | number | undefined,
  timezone?: string
): ParseResult {
  // 1. Handle undefined/null
  if (input == null) {
    throw INVALID_DATE_FORMAT;
  }

  // 2. Normalize to string
  const timeStr = String(input);

  // 3. Check for Unix timestamp (all digits)
  if (/^\d+$/.test(timeStr)) {
    const timestamp = parseInt(timeStr, 10);
    if (isNaN(timestamp)) throw INVALID_DATE_FORMAT;
    
    // Heuristic: > 10 digits likely milliseconds
    const multiplier = timeStr.length > 10 ? 1 : 1000;
    return {
      date: new Date(timestamp * multiplier),
      detectedTimezone: 'UTC',
      hasExplicitTimezone: true
    };
  }

  // 4. Check for timezone information in string
  if (hasTimezoneInfo(timeStr)) {
    const date = parseISO(timeStr);
    if (!isValid(date)) throw INVALID_DATE_FORMAT;
    
    return {
      date,
      detectedTimezone: timeStr.includes('Z') ? 'UTC' : 'offset',
      hasExplicitTimezone: true,
      offset: extractOffset(timeStr)
    };
  }

  // 5. Parse as local time in specified timezone
  const effectiveTimezone = timezone === "" ? "UTC" : (timezone || undefined);
  
  let date: Date;
  if (effectiveTimezone) {
    date = toDate(timeStr, { timeZone: effectiveTimezone });
  } else {
    // System local timezone
    date = parseISO(timeStr);
  }

  if (!isValid(date)) throw INVALID_DATE_FORMAT;

  return {
    date,
    detectedTimezone: effectiveTimezone || 'local',
    hasExplicitTimezone: false
  };
}
```

## Migration Impact
This consolidation will affect:
- addTime.ts (complex multi-strategy parsing)
- subtractTime.ts (similar to addTime)
- calculateDuration.ts (2 parsing locations)
- calculateBusinessHours.ts (2 parsing locations)
- convertTimezone.ts (from_timezone parsing)
- daysUntil.ts (target date parsing)
- formatTime.ts (time parameter parsing)
- getBusinessDays.ts (start/end date parsing)
- nextOccurrence.ts (start_from parsing)

## Testing Requirements
1. Unix timestamp detection and conversion
2. ISO strings with/without timezone
3. Date-only string handling
4. Timezone convention ("" = UTC, undefined = local)
5. Invalid input error messages
6. Edge cases (leap years, DST boundaries)
7. Backwards compatibility with existing tools