#!/usr/bin/env node

/**
 * Extract and analyze VE/CL holiday data from date-holidays package
 * This will be our baseline for implementation
 */

const Holidays = require('date-holidays');

console.log('=== Extracting VE/CL Holiday Data from date-holidays ===\n');

// Helper to format date nicely
function formatHoliday(h) {
  const date = new Date(h.date);
  const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
  return {
    date: h.date.split(' ')[0],
    dayOfWeek: dayName,
    name: h.name,
    type: h.type,
    rule: h.rule || 'fixed',
  };
}

// Extract Venezuela holidays
console.log('🇻🇪 VENEZUELA 2025 (from date-holidays):');
console.log('=========================================');
const hdVE = new Holidays('VE');
const veHolidays2025 = hdVE.getHolidays(2025);

if (veHolidays2025 && veHolidays2025.length > 0) {
  console.log(`Found ${veHolidays2025.length} holidays:\n`);
  veHolidays2025.forEach((h) => {
    const formatted = formatHoliday(h);
    console.log(`${formatted.date} (${formatted.dayOfWeek}) - ${formatted.name}`);
    if (formatted.rule !== 'fixed') {
      console.log(`  Rule: ${formatted.rule}`);
    }
  });
} else {
  console.log('No holidays found');
}

// Extract Chile holidays
console.log('\n🇨🇱 CHILE 2025 (from date-holidays):');
console.log('====================================');
const hdCL = new Holidays('CL');
const clHolidays2025 = hdCL.getHolidays(2025);

if (clHolidays2025 && clHolidays2025.length > 0) {
  console.log(`Found ${clHolidays2025.length} holidays:\n`);
  clHolidays2025.forEach((h) => {
    const formatted = formatHoliday(h);
    console.log(`${formatted.date} (${formatted.dayOfWeek}) - ${formatted.name}`);
    if (formatted.rule !== 'fixed') {
      console.log(`  Rule: ${formatted.rule}`);
    }
  });
} else {
  console.log('No holidays found');
}

// Analyze patterns
console.log('\n📊 PATTERN ANALYSIS:');
console.log('===================');

// Check for Monday-moving holidays in Chile
console.log('\nChile Monday-moving holidays:');
const june29CL = clHolidays2025.find((h) => h.date.includes('06-29'));
const oct12CL = clHolidays2025.find((h) => h.date.includes('10-12'));
console.log('- San Pedro y San Pablo (Jun 29):', june29CL ? june29CL.date : 'Not found');
console.log('- Encuentro de Dos Mundos (Oct 12):', oct12CL ? oct12CL.date : 'Not found');

// Check for Easter-based holidays
console.log('\nEaster-based holidays:');
const easterBasedVE = veHolidays2025.filter((h) => h.rule && h.rule.includes('easter'));
const easterBasedCL = clHolidays2025.filter((h) => h.rule && h.rule.includes('easter'));
console.log(`- Venezuela: ${easterBasedVE.length} Easter-based holidays`);
console.log(`- Chile: ${easterBasedCL.length} Easter-based holidays`);

// Generate implementation data structure
console.log('\n💾 IMPLEMENTATION DATA STRUCTURE:');
console.log('=================================');

console.log('\nVenezuela holidays array:');
console.log('const venezuelaHolidays = [');
veHolidays2025.forEach((h, i) => {
  const formatted = formatHoliday(h);
  const comma = i < veHolidays2025.length - 1 ? ',' : '';
  console.log(
    `  { name: '${h.name}', date: '${formatted.date}', type: '${formatted.type}' }${comma}`,
  );
});
console.log('];');

console.log('\nChile holidays array:');
console.log('const chileHolidays = [');
clHolidays2025.forEach((h, i) => {
  const formatted = formatHoliday(h);
  const comma = i < clHolidays2025.length - 1 ? ',' : '';
  console.log(
    `  { name: '${h.name}', date: '${formatted.date}', type: '${formatted.type}' }${comma}`,
  );
});
console.log('];');

// Check what's available in the package
console.log('\n📦 PACKAGE CAPABILITIES:');
console.log('=======================');
const countries = hdVE.getCountries();
console.log(`Total countries supported: ${Object.keys(countries).length}`);
console.log(
  '\nVenezuela regions:',
  countries.VE ? Object.keys(countries.VE.states || {}).join(', ') : 'None',
);
console.log(
  'Chile regions:',
  countries.CL ? Object.keys(countries.CL.states || {}).join(', ') : 'None',
);

// Compare with our research
console.log('\n🔍 COMPARISON WITH OUR RESEARCH:');
console.log('================================');
console.log('\nNeed to verify:');
console.log('1. Do the dates match official sources?');
console.log('2. Are Monday-moving rules correctly applied?');
console.log('3. Are all holidays included?');
console.log('4. Do we need bilingual support (Spanish/English)?');
