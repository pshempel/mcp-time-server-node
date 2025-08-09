# Debug Strategy for MCP Time Server

## Philosophy

Debug logging should help developers understand **problematic areas** and **complex logic**, not clutter the codebase with noise. We add debug where developers would naturally think "I need to understand what's happening here."

## Where Debug Belongs

### HIGH Priority Areas
These are areas where we'd immediately want visibility when troubleshooting:

1. **Business Logic Calculations**
   - `calculateBusinessHours`: Complex working hours, timezone handling
   - `getBusinessDays`: Holiday logic, weekend detection
   - Why: Multiple edge cases, timezone complexities

2. **Recurrence Patterns**
   - `nextOccurrence`: Pattern matching, date calculations
   - `formatTime` (with recurrence): Complex state decisions
   - Why: Stateful logic with many branches

3. **Complex Timezone Operations**
   - Boundary crossings (DST transitions)
   - Format conversions with timezone context
   - Why: Platform differences, edge cases

### MEDIUM Priority Areas

1. **Date/Time Parsing**
   - Input interpretation decisions
   - Format detection logic
   - Why: User input variability

2. **Cache Decisions**
   - Why something was/wasn't cached
   - Cache key generation logic
   - Why: Performance troubleshooting

### LOW Priority Areas

1. **Simple Validations**
   - Basic parameter checks
   - Type validations
   - Why: Errors are self-explanatory

2. **Pure Calculations**
   - Simple math operations
   - Direct pass-throughs
   - Why: No complex decisions

## Namespace Strategy

```bash
# Selective debugging by concern:
DEBUG=mcp:business:*        # All business logic
DEBUG=mcp:business:hours    # Just business hours
DEBUG=mcp:timezone:*        # Timezone operations
DEBUG=mcp:parse:*           # Parsing decisions
DEBUG=mcp:recurrence:*      # Recurrence patterns
DEBUG=mcp:cache:*           # Cache behavior
DEBUG=mcp:error:*           # Error paths
DEBUG=mcp:trace             # Request flow

# Combinations for specific troubleshooting:
DEBUG=mcp:business:*,mcp:parse:*  # Business logic issues
DEBUG=mcp:timezone:*,mcp:error:*  # Timezone problems
DEBUG=mcp:trace,mcp:cache:*       # Performance analysis
```

## Implementation Guidelines

### DO:
- Add debug at **decision points** that affect outcomes
- Log **transformations** (input → output with reasoning)
- Include **context** (timezone, locale, business rules applied)
- Use **structured data** for complex objects
- Add debug where you'd naturally write a test console.log

### DON'T:
- Add debug to every function entry/exit
- Log trivial validations
- Debug simple getters/setters
- Add redundant information
- Create performance overhead when disabled

## Examples

### Good: Business Logic Decision
```typescript
debug.business('Checking if %s is a workday: weekend=%s, holiday=%s, result=%s', 
  format(date, 'yyyy-MM-dd'),
  isWeekend,
  isHoliday,
  isWorkday
);
```

### Good: Transformation Context
```typescript
debug.timezone('Converting %s from %s to %s: %s → %s',
  inputStr,
  sourceTimezone,
  targetTimezone,
  format(sourceDate, 'yyyy-MM-dd HH:mm:ss zzz'),
  format(targetDate, 'yyyy-MM-dd HH:mm:ss zzz')
);
```

### Bad: Redundant Entry/Exit
```typescript
// DON'T DO THIS
debug.tools('getCurrentTime called');
// ... simple logic ...
debug.tools('getCurrentTime completed');
```

### Bad: Trivial Validation
```typescript
// DON'T DO THIS
debug.tools('Validating timezone parameter');
if (!timezone) {
  debug.tools('Timezone is undefined, using default');
}
```

## Decorator Usage

Decorators should be used **sparingly** for cross-cutting concerns:

```typescript
// Use for complex business logic that needs consistent logging
@debugBusinessLogic('mcp:business:hours')
function calculateBusinessHours(...) { }

// Use for error-prone operations
@debugErrors('mcp:error:parse')
function parseComplexInput(...) { }

// DON'T use for simple functions
function getSimpleValue() { } // No decorator needed
```

## Testing Debug Output

When developing, test with targeted namespaces:

```bash
# Development: See everything for a specific tool
DEBUG=mcp:*:calculateBusinessHours npm start

# Testing: Focus on specific concern
DEBUG=mcp:business:* npm test

# Production: Errors only
DEBUG=mcp:error:* npm start
```

## Maintenance

- Review debug output quarterly
- Remove debug that's never used
- Add debug when troubleshooting reveals gaps
- Keep namespaces consistent and documented