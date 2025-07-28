# Timezone Default Behavior (Verified 2025-07-19)

## Three-Way Timezone Resolution

All MCP Time Server tools that accept a timezone parameter follow this precedence:

1. **Empty String (`""`)** → Always resolves to **UTC**
   - Maintains backward compatibility
   - Explicit way to request UTC
   - Example: `{ timezone: "" }` → uses UTC

2. **Undefined/Not Provided** → Uses **System Timezone**
   - New default behavior as of Session 017
   - Detects system timezone via `Intl.DateTimeFormat().resolvedOptions().timeZone`
   - Example: `{}` → uses "America/Indianapolis" (or whatever system is set to)

3. **Any Other Value** → Uses **Specified Timezone**
   - Standard IANA timezone names
   - Example: `{ timezone: "Asia/Tokyo" }` → uses Asia/Tokyo

## Implementation Pattern

All tools use this consistent pattern:
```typescript
const config = getConfig();
const timezone = params.timezone === '' ? 'UTC' : (params.timezone ?? config.defaultTimezone);
```

## Rationale

This design ensures:
- **Backward Compatibility**: Existing code using empty strings for UTC continues to work
- **User Convenience**: Most users get their local timezone by default
- **Explicit Control**: Users can still specify any timezone they need
- **Unix Timestamp Handling**: Empty string → UTC is important for timestamp processing