#!/usr/bin/env node

/**
 * Compare holiday data from different sources
 * This helps us decide what to implement
 */

const Holidays = require('date-holidays');

console.log('=== Holiday Source Comparison ===\n');

// Get date-holidays data
const hdVE = new Holidays('VE');
const hdCL = new Holidays('CL');
const veHolidaysExternal = hdVE.getHolidays(2025);
const clHolidaysExternal = hdCL.getHolidays(2025);

// Our research data (what we think should be correct)
const veHolidaysResearch = [
  { name: 'Año Nuevo', date: '2025-01-01', source: 'standard' },
  { name: 'Carnaval Monday', date: '2025-03-03', source: 'Easter-48' },
  { name: 'Carnaval Tuesday', date: '2025-03-04', source: 'Easter-47' },
  { name: 'Jueves Santo', date: '2025-04-17', source: 'Easter-3' },
  { name: 'Viernes Santo', date: '2025-04-18', source: 'Easter-2' },
  { name: 'Declaración de la Independencia', date: '2025-04-19', source: 'fixed' },
  { name: 'Día del Trabajador', date: '2025-05-01', source: 'fixed' },
  { name: 'Batalla de Carabobo', date: '2025-06-24', source: 'fixed' },
  { name: 'Día de la Independencia', date: '2025-07-05', source: 'fixed' },
  { name: 'Natalicio de Simón Bolívar', date: '2025-07-24', source: 'fixed' },
  { name: 'Día de la Resistencia Indígena', date: '2025-10-12', source: 'fixed' },
  { name: 'Navidad', date: '2025-12-25', source: 'fixed' },
];

const clHolidaysResearch = [
  { name: 'Año Nuevo', date: '2025-01-01', source: 'fixed' },
  { name: 'Viernes Santo', date: '2025-04-18', source: 'Easter-2' },
  { name: 'Sábado Santo', date: '2025-04-19', source: 'Easter-1' },
  { name: 'Día del Trabajo', date: '2025-05-01', source: 'fixed' },
  { name: 'Día de las Glorias Navales', date: '2025-05-21', source: 'fixed' },
  { name: 'Día Nacional de los Pueblos Indígenas', date: '2025-06-20', source: 'fixed' },
  { name: 'San Pedro y San Pablo', date: '2025-06-30', source: 'moved from 06-29' }, // Should move to Monday
  { name: 'Día de la Virgen del Carmen', date: '2025-07-16', source: 'fixed' },
  { name: 'Asunción de la Virgen', date: '2025-08-15', source: 'fixed' },
  { name: 'Independencia Nacional', date: '2025-09-18', source: 'fixed' },
  { name: 'Día de las Glorias del Ejército', date: '2025-09-19', source: 'fixed' },
  { name: 'Encuentro de Dos Mundos', date: '2025-10-13', source: 'moved from 10-12' }, // Should move to Monday
  { name: 'Día de las Iglesias Evangélicas', date: '2025-10-31', source: 'fixed' },
  { name: 'Día de Todos los Santos', date: '2025-11-01', source: 'fixed' },
  { name: 'Inmaculada Concepción', date: '2025-12-08', source: 'fixed' },
  { name: 'Navidad', date: '2025-12-25', source: 'fixed' },
];

// Analysis
console.log('🇻🇪 VENEZUELA ANALYSIS:');
console.log('========================');
console.log(`date-holidays: ${veHolidaysExternal.length} holidays (including observances)`);
console.log(`Our research: ${veHolidaysResearch.length} holidays (public only)`);

// Filter only public holidays from date-holidays
const vePublicExternal = veHolidaysExternal.filter((h) => h.type === 'public');
console.log(`date-holidays public only: ${vePublicExternal.length} holidays\n`);

console.log('Key differences:');
console.log('- date-holidays includes many observance/optional holidays');
console.log('- We focus on federal public holidays only');
console.log('- Both agree on core holidays\n');

console.log('🇨🇱 CHILE ANALYSIS:');
console.log('===================');
console.log(`date-holidays: ${clHolidaysExternal.length} holidays`);
console.log(`Our research: ${clHolidaysResearch.length} holidays\n`);

console.log('CRITICAL ISSUE - Monday-moving holidays:');
const june29 = clHolidaysExternal.find((h) => h.name.includes('Pedro'));
const oct12 = clHolidaysExternal.find((h) => h.name.includes('Encuentro'));

console.log(`- San Pedro y San Pablo (Jun 29, Sunday):`);
console.log(`  date-holidays: ${june29 ? june29.date.split(' ')[0] : 'not found'}`);
console.log(`  Should be: 2025-06-30 (Monday)`);

console.log(`- Encuentro de Dos Mundos (Oct 12, Sunday):`);
console.log(`  date-holidays: ${oct12 ? oct12.date.split(' ')[0] : 'not found'}`);
console.log(`  Should be: 2025-10-13 (Monday)\n`);

console.log('📋 RECOMMENDATION:');
console.log('==================');
console.log('1. Implement our own data with proper Monday-moving logic for Chile');
console.log('2. Use date-holidays for verification but not as primary source');
console.log('3. Focus on public holidays only for both countries');
console.log('4. Add bilingual support (Spanish primary, English secondary)');
console.log('5. Document why we differ from date-holidays');

console.log('\n🔧 IMPLEMENTATION PLAN:');
console.log('=======================');
console.log('1. Create test file with expected holidays');
console.log('2. Implement VE holidays (simpler, no special rules)');
console.log('3. Implement CL holidays with Monday-moving logic');
console.log('4. Add verification against date-holidays');
console.log('5. Document all sources and decisions');
