# Natural Language Date Parsing Behavior

**Research Date:** 2025-01-09
**Research Files:** 
- `research/natural-language-parsing.js`
- `research/natural-language-api-patterns.js`

## Summary

Natural language date parsing converts human-friendly phrases like "next Tuesday" or "tomorrow at 3pm" into precise datetime values. Based on research of Google Calendar, Microsoft Graph, voice assistants, and date-fns capabilities.

## Key Findings

### 1. date-fns Capabilities
- Has `next[Weekday]()` functions for each day of week
- `parse()` function requires format strings, NOT natural language
- Must build pattern matching on top of date-fns primitives

### 2. Industry Patterns (Verified via API Research)

#### Google Calendar Quick Add (Verified 2025-01-09)
- **Endpoint:** `POST /calendar/v3/calendars/{calendarId}/events/quickAdd`
- **Parameter:** `text` - simple string describing the event
- **Example:** "Meeting tomorrow at 3pm"
- **Returns:** Full Events resource with parsed times
- **Note:** Actual NLP parsing is server-side, no documentation on exact patterns
- **Source:** https://developers.google.com/workspace/calendar/api/v3/reference/events/quickAdd

#### Microsoft Graph FindMeetingTimes (Verified 2025-01-09)
- **Does NOT accept natural language** like "next week"
- **Requires:** Explicit ISO 8601 dates in timeConstraint
- **Example:** `"dateTime": "2019-04-16T09:00:00", "timeZone": "Pacific Standard Time"`
- **activityDomain:** "work" (default), "personal", or "unrestricted"
- **Source:** Microsoft Graph API documentation

#### Third-Party Solutions (Research Finding)
- **Chrono.js:** Popular NLP date library many use
- **Calendar.dev:** Commercial API for natural language date parsing
- **Pattern:** Most implementations use regex + hand-coded rules, not ML

### 3. Critical Design Decisions

1. **Reference Date Parameter**
   - MUST accept `reference_date` for testing and consistency
   - Defaults to current time if not provided
   - All relative dates calculated from this point

2. **Timezone Handling**
   - "tomorrow" depends on timezone (midnight boundary)
   - Must accept timezone parameter
   - Defaults to system timezone if not provided

3. **Interpretation String**
   - Always return human-readable interpretation
   - Example: "Next Tuesday at 3:00 PM EST (January 14, 2025)"
   - Helps users confirm correct parsing

4. **"Next [Weekday]" Behavior**
   - If today is Thursday and input is "next Thursday"
   - Should return NEXT week's Thursday, not today
   - Consistent with date-fns `nextThursday()` behavior

## Supported Patterns

### Phase 1 (MVP)
- `next [weekday]` - "next Tuesday", "next Friday"
- `tomorrow`, `yesterday`, `today`
- `in X days/weeks/months` - "in 3 days", "in 2 weeks"
- `[day] at [time]` - "tomorrow at 3pm", "next Tuesday at 2:30pm"

### Phase 2 (Future)
- `this/next weekend`
- `end of month/year`
- `X days/weeks ago`
- Business context ("next business day")

## Implementation Strategy

Use regex pattern matching with date-fns functions:

```javascript
// Pattern: "next [weekday]"
const nextWeekdayMatch = input.match(/^next\s+(monday|tuesday|...)$/);
if (nextWeekdayMatch) {
  return nextTuesday(referenceDate); // Use appropriate date-fns function
}

// Pattern: "in X days"
const inDaysMatch = input.match(/^in\s+(\d+)\s+days?$/);
if (inDaysMatch) {
  return addDays(referenceDate, parseInt(match[1]));
}
```

## Error Handling

Must handle:
- Unrecognized patterns: "the day after tomorrow's yesterday"
- Ambiguous input: "soon", "later"
- Invalid combinations: "yesterday at 9am tomorrow"
- Out of range: "in 1000 years"

## Test Strategy

1. Use fixed reference date in tests: `2025-01-09T10:00:00.000Z` (Thursday)
2. Test timezone boundaries for "tomorrow"
3. Verify interpretation strings are helpful
4. Test case insensitivity

## API Design

```typescript
interface ParseNaturalDateParams {
  input: string;                    // Required: natural language input
  timezone?: string;                 // Optional: IANA timezone
  reference_date?: string | number; // Optional: reference point for relative dates
}

interface ParseNaturalDateResult {
  parsed_date: string;      // ISO 8601 formatted result
  interpretation: string;   // Human-readable explanation
  timezone_used: string;    // Actual timezone used
}
```