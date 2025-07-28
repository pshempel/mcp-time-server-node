# Holiday Calculations with date-fns

## Verified on 2025-07-19 with date-fns ^4.1.0

### Floating Holiday Calculations

Successfully tested calculation of "nth weekday of month" holidays:

```javascript
// Get 3rd Monday of January (MLK Day)
function getNthWeekdayOfMonth(year, month, weekday, n) {
  const firstDay = new Date(year, month - 1, 1);
  const firstDayOfWeek = getDay(firstDay);
  
  let daysUntilTarget = weekday - firstDayOfWeek;
  if (daysUntilTarget < 0) {
    daysUntilTarget += 7;
  }
  
  const targetDate = addDays(firstDay, daysUntilTarget + (n - 1) * 7);
  
  if (targetDate.getMonth() !== month - 1) {
    return null; // nth occurrence doesn't exist
  }
  
  return targetDate;
}
```

Verified dates:
- MLK Day 2024: January 15, 2024 ✓
- MLK Day 2025: January 20, 2025 ✓
- Thanksgiving 2024: November 28, 2024 ✓

### Last Weekday of Month

For holidays like Memorial Day (last Monday of May):

```javascript
function getLastWeekdayOfMonth(year, month, weekday) {
  const lastDay = lastDayOfMonth(new Date(year, month - 1));
  const lastDayOfWeek = getDay(lastDay);
  
  let daysBack = lastDayOfWeek - weekday;
  if (daysBack < 0) {
    daysBack += 7;
  }
  
  return addDays(lastDay, -daysBack);
}
```

### Observed Holiday Rules

Different countries have different observation rules:

**US Federal**:
- Saturday → Friday (previous day)
- Sunday → Monday (next day)

**UK/Canada Bank Holidays**:
- Saturday → Monday (next Monday)
- Sunday → Monday (next Monday)

### Key Findings

1. **Floating holidays** can be calculated reliably with date-fns
2. **Observation rules** must be per-holiday, not just per-country
3. **Edge cases** include consecutive holidays (UK Christmas/Boxing Day)
4. **Easter** requires special calculation (Computus algorithm) or embedded dates

### Business Day Impact

When holidays are observed:
- July 4, 2026 (Saturday) → Observed July 3 (Friday)
- This changes a business day to a holiday