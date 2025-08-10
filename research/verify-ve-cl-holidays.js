#!/usr/bin/env node

/**
 * Research script for Venezuela (VE) and Chile (CL) holidays
 *
 * Special considerations:
 * - Both countries use Spanish as official language
 * - Chile has complex "sandwich day" rules
 * - Venezuela has had political changes affecting holidays
 * - Both have regional holidays we'll focus on national only
 */

console.log('=== Venezuela (VE) and Chile (CL) Holiday Research ===\n');

console.log('🇻🇪 VENEZUELA Official Holidays 2025:');
console.log('Source: Would need official government source');
console.log('Common holidays include:');
console.log('- Año Nuevo (New Year): January 1');
console.log(
  '- Lunes y Martes de Carnaval (Carnival Monday/Tuesday): Moveable (40-41 days before Easter)',
);
console.log('- Jueves y Viernes Santo (Maundy Thursday/Good Friday): Moveable');
console.log('- Declaración de Independencia: April 19');
console.log('- Día del Trabajador (Labor Day): May 1');
console.log('- Batalla de Carabobo: June 24');
console.log('- Día de la Independencia: July 5');
console.log('- Natalicio de Simón Bolívar: July 24');
console.log('- Día de la Resistencia Indígena: October 12');
console.log('- Navidad (Christmas): December 25\n');

console.log('🇨🇱 CHILE Official Holidays 2025:');
console.log('Source: https://www.chile.gob.cl/feriados');
console.log('Known holidays include:');
console.log('- Año Nuevo (New Year): January 1');
console.log('- Viernes Santo (Good Friday): Moveable');
console.log('- Sábado Santo (Holy Saturday): Moveable');
console.log('- Día del Trabajo (Labor Day): May 1');
console.log('- Día de las Glorias Navales: May 21');
console.log('- Día Nacional de los Pueblos Indígenas: June 20');
console.log('- San Pedro y San Pablo: June 29 (or nearest Monday)');
console.log('- Día de la Virgen del Carmen: July 16');
console.log('- Asunción de la Virgen: August 15');
console.log('- Independencia Nacional: September 18');
console.log('- Día de las Glorias del Ejército: September 19');
console.log('- Encuentro de Dos Mundos: October 12 (or nearest Monday)');
console.log('- Día de las Iglesias Evangélicas: October 31');
console.log('- Día de Todos los Santos: November 1');
console.log('- Inmaculada Concepción: December 8');
console.log('- Navidad (Christmas): December 25\n');

console.log('=== Special Rules to Research ===\n');

console.log('VENEZUELA:');
console.log('- Carnival dates (based on Easter)');
console.log('- Any holidays that move to Monday');
console.log('- Recent political changes to holiday calendar\n');

console.log('CHILE:');
console.log('- "Sandwich days" (feriados sandwich) - automatic long weekends');
console.log('- Holidays that move to nearest Monday:');
console.log('  - San Pedro y San Pablo (June 29)');
console.log('  - Encuentro de Dos Mundos (October 12)');
console.log("- Regional holidays (we'll skip these)");
console.log('- Fiestas Patrias can extend multiple days\n');

console.log('=== Implementation Considerations ===\n');
console.log('1. Need bilingual support (Spanish/English names)');
console.log('2. Easter-based calculations for Carnival, Holy Week');
console.log('3. Complex Monday-moving rules for Chile');
console.log('4. Verify current laws (holidays change with governments)');
console.log('5. Focus on national holidays only\n');

console.log('=== Reliable Sources Needed ===\n');
console.log('Venezuela:');
console.log('- Official government calendar');
console.log('- Labor ministry website');
console.log('- Recent news for holiday changes\n');

console.log('Chile:');
console.log('- https://www.chile.gob.cl/feriados');
console.log('- Dirección del Trabajo');
console.log('- Official gazette (Diario Oficial)\n');

console.log("⚠️  IMPORTANT: Both countries' holiday calendars can change");
console.log('Need to verify with 2025 official sources before implementation');

// Calculate Easter 2025 for moveable holidays
const easter2025 = new Date('2025-04-20'); // Easter Sunday 2025
console.log('\n📅 Easter 2025: April 20');
console.log('This affects:');
console.log('- Venezuela: Carnival (Feb 3-4), Holy Week (Apr 17-18)');
console.log('- Chile: Good Friday (Apr 18), Holy Saturday (Apr 19)');
