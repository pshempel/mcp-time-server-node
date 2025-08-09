# Natural Endpoint Conventions for MCP Time Server

**Date:** 2025-01-31  
**Purpose:** Define standard endpoints that LLMs and humans naturally expect in a time/calendar service

## Background

LLMs are trained on millions of API examples and develop "instincts" about what endpoints should exist based on common patterns. When these expected endpoints are missing, users get confused and the service feels incomplete - even if the functionality exists internally.

**Key Insight:** Users shouldn't need to read documentation to find basic functionality. The endpoint names themselves should be discoverable through natural language.

## Reference Standards & Templates

### Industry Standards to Follow
1. **Google Calendar API** - De facto standard for calendar operations
   - https://developers.google.com/calendar/api/v3/reference
   - Good model for event and calendar queries

2. **Microsoft Graph Calendar API** - Enterprise standard
   - https://docs.microsoft.com/en-us/graph/api/resources/calendar
   - Strong timezone and business hours patterns

3. **Moment.js / Luxon API** - JavaScript time library conventions
   - What JS developers expect from time manipulation
   - Natural language parsing patterns

4. **IANA Time Zone Database** - Timezone authority
   - Standard timezone identifiers and rules
   - https://www.iana.org/time-zones

5. **ISO 8601** - International date/time standard
   - Standard formats for date/time representation
   - Duration and interval formats

6. **Voice Assistant Patterns** - What Alexa/Siri/Google understand
   - "What time is it in..."
   - "How many hours until..."
   - "When is the next..."
   - "Is tomorrow a..."

### Common Voice Queries to Support
Based on voice assistant usage patterns:
- "What time is it in [city/country]?"
- "What's the time difference between [place] and [place]?"
- "When is [holiday] this year?"
- "Is [date] a holiday?"
- "How many days until [event]?"
- "What day of the week is [date]?"
- "When is the next [day of week]?"
- "Convert [time] [timezone] to [timezone]"
- "Is it business hours in [place]?"
- "When does [place] open?"

## Currently Missing But Expected Endpoints

### 1. Holiday Operations (PRIORITY: HIGH)
These already exist internally but aren't exposed:

- **`get_holidays`** 
  - Input: country, year, start_date, end_date
  - Output: List of holidays with dates and names
  - Why expected: Every calendar service has this
  
- **`get_next_holiday`**
  - Input: country, from_date (optional, defaults to today)
  - Output: Next holiday name and date
  - Why expected: Common user question
  
- **`is_holiday`**
  - Input: date, country
  - Output: boolean + holiday name if true
  - Why expected: Basic calendar check

- **`get_holiday_info`**
  - Input: holiday_name or date, country
  - Output: Holiday details (type, observed date, etc.)
  - Why expected: Users want to know "when is Thanksgiving?"

### 2. Timezone Operations (PRIORITY: HIGH - Currently Missing!)
Some exist but naming could be clearer:

- **`get_timezone_offset`**
  - Input: timezone, date (optional)
  - Output: UTC offset
  - Why expected: Basic timezone query
  
- **`timezone_difference`** (CRITICAL - Currently impossible!)
  - Input: timezone1, timezone2, date (optional)
  - Output: Hour difference between zones
  - Why expected: "What's the time difference between London and Beijing?"
  - Example: timezone_difference("Europe/London", "Asia/Shanghai") → "+8 hours"
  
- **`compare_timezones`** (CRITICAL - Currently impossible!)
  - Input: timezone1, timezone2
  - Output: Offset difference, current times in both
  - Why expected: "Compare my timezone to London"
  
- **`list_timezones`**
  - Input: region (optional)
  - Output: Available timezone identifiers
  - Why expected: Discovery mechanism

- **`get_timezone_info`**
  - Input: timezone
  - Output: Current time, offset, DST status
  - Why expected: Comprehensive timezone data

### 3. Business Hours Operations (PRIORITY: MEDIUM)
Partially exists but could be more intuitive:

- **`is_business_hours`**
  - Input: datetime, timezone, business_hours (optional)
  - Output: boolean
  - Why expected: Simple check for "is it open?"

- **`get_next_business_day`**
  - Input: from_date, timezone, country (for holidays)
  - Output: Next business day date
  - Why expected: Common scheduling need

- **`get_business_hours_today`**
  - Input: timezone, date (optional)
  - Output: Today's business hours or "closed"
  - Why expected: "What are today's hours?"

### 4. Recurring Events (PRIORITY: LOW)
Exists but could be more intuitive:

- **`schedule_recurring`**
  - More intuitive name than `next_occurrence`
  - Why expected: Natural language mapping

- **`list_occurrences`**
  - Input: pattern, start_date, end_date, count
  - Output: List of occurrence dates
  - Why expected: "Show me all Mondays in March"

### 5. Natural Language Time (PRIORITY: HIGH)
LLMs expect these for human-friendly queries:

- **`parse_natural_date`**
  - Input: "next Tuesday", "in 3 days", "tomorrow at 3pm"
  - Output: Parsed datetime
  - Why expected: Humans use natural language

- **`days_until`** ✅ (Already exists!)
  - Good example of natural endpoint

- **`time_between`**
  - Alias for `calculate_duration` with natural language support
  - Input: "Christmas" to "New Year"
  - Why expected: More intuitive than calculate_duration

### 6. Comparison Operations (PRIORITY: LOW)

- **`compare_times`**
  - Input: time1, time2, unit (optional)
  - Output: difference, which is later/earlier
  - Why expected: Basic comparison

- **`is_before`** / **`is_after`**
  - Input: time1, time2
  - Output: boolean
  - Why expected: Simple checks

### 7. Date Information Queries (PRIORITY: HIGH - Voice Common)

- **`get_day_info`**
  - Input: date, timezone (optional)
  - Output: day_of_week, week_number, day_of_year, is_weekend
  - Why expected: "What day is December 25th?"

- **`get_week_number`**
  - Input: date
  - Output: ISO week number
  - Why expected: Business planning

- **`is_leap_year`**
  - Input: year
  - Output: boolean
  - Why expected: Basic calendar query

- **`get_month_info`**
  - Input: month, year
  - Output: days_in_month, first_day, last_day
  - Why expected: Calendar display needs

### 8. Location-Based Time (PRIORITY: MEDIUM - Voice Common)

- **`time_in_city`**
  - Input: city_name
  - Output: current_time, timezone
  - Why expected: "What time is it in Paris?"
  - Note: Requires city->timezone mapping

- **`sunrise_sunset`**
  - Input: date, location (lat/long or city)
  - Output: sunrise, sunset, daylight_hours
  - Why expected: Common voice query
  - Note: May need external data source

### 9. Meeting & Scheduling Helpers (PRIORITY: LOW)

- **`find_meeting_time`**
  - Input: participants_timezones[], preferred_hours, duration
  - Output: suggested_times[]
  - Why expected: Common scheduling need

- **`overlapping_business_hours`**
  - Input: timezone1, timezone2, business_hours (optional)
  - Output: overlapping_hours
  - Why expected: International collaboration

## Implementation Strategy

### Phase 1: Expose Existing Internal Functions
No new logic needed, just create endpoint wrappers:
1. `get_holidays` - expose internal `getHolidays()`
2. `get_next_holiday` - wrap existing holiday logic
3. `is_holiday` - simple lookup wrapper

### Phase 2: Add Natural Language Aliases
Create intuitive aliases for existing tools:
1. `time_between` → `calculate_duration`
2. `schedule_recurring` → `next_occurrence`
3. `is_business_hours` → subset of `calculate_business_hours`

### Phase 3: Fill Functional Gaps
Add genuinely new functionality:
1. `parse_natural_date` - integrate date parsing library
2. `list_timezones` - expose timezone database
3. `get_holiday_info` - reverse lookup holidays

## Success Criteria

A user should be able to ask:
- "When is the next holiday?"
- "Is tomorrow a business day?"
- "What time is it in Tokyo?"
- "Is the bank open?"
- "When is Thanksgiving this year?"

And the LLM should find the right tool WITHOUT needing documentation.

## Testing Natural Discoverability

Test with LLM prompts that DON'T reference specific tool names:
1. "Check if Christmas is a holiday" → should find `is_holiday`
2. "Find the next long weekend" → should find `get_next_holiday`
3. "What holidays are in December?" → should find `get_holidays`

## Refactoring Sprint Integration

**Suggested Sprint:** After current refactoring phases
**Priority:** HIGH for holiday endpoints (most confusing currently)
**Effort:** LOW (mostly aliasing existing functions)
**Impact:** HIGH (major usability improvement)

## Developer Quick Reference

### Use These APIs as Templates
When implementing new endpoints, check how these services name similar functions:
1. **Google Calendar API** - For calendar/event operations
2. **Luxon/Moment.js** - For time manipulation naming
3. **Chrono.js** - For natural language parsing patterns
4. **WorldTimeAPI** - For timezone operations
5. **Python datetime** - For standard library conventions

### Naming Patterns That Work
- Prefix with verb: `get_`, `is_`, `calculate_`, `convert_`, `find_`
- Use common terms: `holiday` not `observance`, `timezone` not `tz`
- Match voice patterns: `time_in_city` not `city_current_time`
- Be specific: `timezone_difference` not just `difference`

## Notes

- This isn't about adding features, it's about making existing features discoverable
- Follow REST/RPC conventions that are common in the wild
- Tool names should match how humans ask questions
- Consider both programmer expectations AND natural language patterns
- When in doubt, test with voice: "Would Alexa understand this?"

## Implementation Checklist

For each new endpoint:
- [ ] Does the name match how a human would ask the question?
- [ ] Is there a similar function in Google Calendar or Luxon?
- [ ] Would it work with voice input without modification?
- [ ] Is it discoverable without reading docs?
- [ ] Does it follow the verb_noun pattern?