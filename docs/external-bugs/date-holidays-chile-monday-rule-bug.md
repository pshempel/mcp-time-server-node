# Bug Report: Chile Monday-Moving Holiday Rule Not Applied

**Package**: date-holidays
**Version**: 3.24.4
**Date**: 2025-01-28

## Issue Description

Chile has a law (Ley 19.973) that moves certain holidays to Monday to create long weekends. The rule is defined in the package but not being applied correctly for 2025.

## Expected Behavior

According to Chilean law, when these holidays fall on specific days:
- **Tuesday, Wednesday, or Thursday** → Move to previous Monday
- **Saturday or Sunday** → Move to next Monday
- **Monday or Friday** → Keep as-is (already creates long weekend)

This applies to:
1. San Pedro y San Pablo (June 29)
2. Día del Encuentro de Dos Mundos (October 12)

## Actual Behavior

In 2025, both holidays fall on Sunday but remain on Sunday:
- San Pedro y San Pablo: June 29, 2025 (Sunday) - Should move to June 30 (Monday)
- Encuentro de Dos Mundos: October 12, 2025 (Sunday) - Should move to October 13 (Monday)

## Steps to Reproduce

```javascript
const Holidays = require('date-holidays');
const hd = new Holidays('CL');
const holidays2025 = hd.getHolidays(2025);

// Check San Pedro y San Pablo
const june29 = holidays2025.find(h => h.name.includes('Pedro'));
console.log(june29);
// Output: { date: '2025-06-29 00:00:00', ... }
// Expected: { date: '2025-06-30 00:00:00', ... }

// Check Encuentro de Dos Mundos
const oct12 = holidays2025.find(h => h.name.includes('Encuentro'));
console.log(oct12);
// Output: { date: '2025-10-12 00:00:00', ... }
// Expected: { date: '2025-10-13 00:00:00', ... }
```

## Analysis

The rule is defined in the data:
```
Rule: 06-29 if tuesday, wednesday, thursday then previous monday if friday then next monday
Rule: 10-12 if tuesday, wednesday, thursday then previous monday if friday then next monday
```

However, the rule doesn't handle Saturday/Sunday cases, which should also move to next Monday according to Chilean law.

## Suggested Fix

The rule should be updated to include weekend handling:
```
if tuesday, wednesday, thursday then previous monday 
if friday then next monday
if saturday, sunday then next monday
```

## References

- Chilean Labor Code (Código del Trabajo)
- Ley 19.973 on holiday movements
- Official Chilean government holiday calendar

## Impact

This affects anyone using the package for Chilean holiday calculations, particularly for:
- Business day calculations
- Payroll systems
- Scheduling applications

---

*Note: This bug report was discovered while implementing holiday support for an MCP time server and cross-verifying with multiple sources.*