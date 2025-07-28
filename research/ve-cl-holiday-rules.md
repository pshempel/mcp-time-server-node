# Venezuela and Chile Holiday Implementation Rules

## Venezuela (VE) 🇻🇪

### Key Characteristics:
1. **Carnival**: Always Monday and Tuesday, 40-41 days before Easter
2. **Holy Week**: Maundy Thursday and Good Friday (Easter-based)
3. **Fixed dates**: Most holidays are on fixed dates
4. **No complex moving rules**: Unlike Chile, holidays generally stay on their dates

### Challenges:
- Political changes have affected holiday calendar
- Some sources may be outdated
- Need to verify current official list

## Chile (CL) 🇨🇱

### Key Characteristics:
1. **Monday-moving holidays** (Ley 19.973):
   - San Pedro y San Pablo (June 29) → moves to nearest Monday if not Mon/Fri
   - Día del Encuentro de Dos Mundos (Oct 12) → moves to nearest Monday if not Mon/Fri

2. **"Sandwich days"** (unofficial but common):
   - If holiday falls on Tuesday, Monday often becomes holiday
   - If holiday falls on Thursday, Friday often becomes holiday
   - This is discretionary, not automatic

3. **Fiestas Patrias**:
   - September 18-19 are always holidays
   - Often extended if near weekend

### Implementation Strategy:

```javascript
// For Chile Monday-moving holidays:
function moveToNearestMonday(date, holidayName) {
  const dayOfWeek = date.getDay();
  
  // If the holiday falls on Tuesday, Wednesday, or Thursday
  if (dayOfWeek >= 2 && dayOfWeek <= 4) {
    // Move to previous Monday
    const daysToSubtract = dayOfWeek - 1;
    return new Date(date.getTime() - daysToSubtract * 24 * 60 * 60 * 1000);
  }
  
  // If the holiday falls on Saturday or Sunday
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    // Move to next Monday
    const daysToAdd = dayOfWeek === 0 ? 1 : 2;
    return new Date(date.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  }
  
  // Monday or Friday - keep as is
  return date;
}
```

## Official Sources to Verify:

### Venezuela:
- Government gazette (Gaceta Oficial)
- Ministry of Labor website
- Recent news for updates

### Chile:
- https://www.chile.gob.cl/feriados (official portal)
- https://www.dt.gob.cl/ (Dirección del Trabajo)
- Diario Oficial de Chile

## Testing Approach:

1. Create separate test files for VE and CL
2. Test Monday-moving logic for Chile extensively
3. Verify Easter-based calculations for both
4. Include both Spanish and English holiday names
5. Add year-specific verification tests