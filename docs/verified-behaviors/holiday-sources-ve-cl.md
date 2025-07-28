# Venezuela and Chile Holiday Sources and Decisions

## Venezuela (VE) Holiday Implementation

### Official Sources
- Government source: Not directly accessible
- Verified against: date-holidays npm package
- Cross-referenced with: timeanddate.com, public calendars

### Implementation Decisions

1. **Public Holidays Only**: Included only official public holidays where work is suspended
   - Excluded bank holidays, regional observances
   - Total: 12 fixed holidays + 2 Easter-based

2. **Easter-Based Holidays**:
   - Carnival Monday: Easter - 48 days
   - Carnival Tuesday: Easter - 47 days
   - Maundy Thursday: Easter - 3 days
   - Good Friday: Easter - 2 days

3. **No Observation Rules**: Venezuela holidays fall on their actual dates
   - No Monday-moving like US/UK
   - If holiday falls on weekend, it's still on weekend

### Holiday List
1. Año Nuevo - January 1
2. Lunes de Carnaval - Easter-48 (moveable)
3. Martes de Carnaval - Easter-47 (moveable)
4. Jueves Santo - Easter-3 (moveable)
5. Viernes Santo - Easter-2 (moveable)
6. Declaración de Independencia - April 19
7. Día del Trabajador - May 1
8. Batalla de Carabobo - June 24
9. Día de la Independencia - July 5
10. Natalicio de Simón Bolívar - July 24
11. Día de la Resistencia Indígena - October 12
12. Navidad - December 25

## Chile (CL) Holiday Implementation

### Official Sources
- Government portal: www.chileatiende.gob.cl
- Labor law: Código del Trabajo, Artículo 35
- Verified against: date-holidays npm package

### Implementation Decisions

1. **Monday-Moving Rule (cl_monday)**: 
   - Holidays on Tuesday/Wednesday/Thursday → Move to previous Monday
   - Holidays on Saturday/Sunday → Move to following Monday
   - Holidays on Friday/Monday → Stay as-is (already long weekend)
   - Exceptions: Jan 1, May 1, Sep 18-19, Dec 25 never move

2. **Special Rules**:
   - Sep 18-19 are treated as a unit (Fiestas Patrias)
   - Religious holidays follow Chilean Catholic calendar

3. **Implementation Note**: date-holidays package has a bug with cl_monday
   - Their implementation moves ALL holidays
   - Our implementation correctly excludes the statutory exceptions

### Holiday List
1. Año Nuevo - January 1 (no move)
2. Viernes Santo - Good Friday (moveable)
3. Sábado Santo - Holy Saturday (moveable)
4. Día del Trabajo - May 1 (no move)
5. Día de las Glorias Navales - May 21 (cl_monday)
6. Día de los Pueblos Indígenas - June 20 (cl_monday)
7. San Pedro y San Pablo - June 29 (cl_monday)
8. Día de la Virgen del Carmen - July 16 (cl_monday)
9. Asunción de la Virgen - August 15 (cl_monday)
10. Día de la Independencia - September 18 (no move)
11. Día de las Glorias del Ejército - September 19 (no move)
12. Encuentro de Dos Mundos - October 12 (cl_monday)
13. Día de la Reforma - October 31 (cl_monday)
14. Día de Todos los Santos - November 1 (cl_monday)
15. Inmaculada Concepción - December 8 (cl_monday)
16. Navidad - December 25 (no move)

## Testing Approach

1. **Unit Tests**: Verify each holiday date and moving rules
2. **Integration Tests**: Test with MCP calls
3. **Comparison Tests**: Planned cross-verification with date-holidays
4. **Annual Updates**: Need process for yearly verification

## Future Considerations

1. **Dynamic Data Sources**: Consider fetching from official APIs
2. **Regional Holidays**: Some regions have additional holidays
3. **Holiday Changes**: Need update process when laws change
4. **Notification System**: Alert when holidays need verification