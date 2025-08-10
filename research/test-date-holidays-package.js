#!/usr/bin/env node

/**
 * Test the date-holidays npm package for Chile and Venezuela
 * This will help us decide if we can use it as a data source
 */

console.log('=== Testing date-holidays npm package ===\n');

// First, check if the package is installed
try {
  const Holidays = require('date-holidays');
  console.log('✅ date-holidays package found\n');

  // Test Venezuela holidays
  console.log('🇻🇪 VENEZUELA 2025:');
  console.log('==================');
  const hdVE = new Holidays('VE');
  const veHolidays = hdVE.getHolidays(2025);

  if (veHolidays && veHolidays.length > 0) {
    veHolidays.forEach((h) => {
      console.log(`${h.date} - ${h.name} (${h.type})`);
    });
  } else {
    console.log('No holidays found for Venezuela');
  }

  console.log('\n🇨🇱 CHILE 2025:');
  console.log('==============');
  const hdCL = new Holidays('CL');
  const clHolidays = hdCL.getHolidays(2025);

  if (clHolidays && clHolidays.length > 0) {
    clHolidays.forEach((h) => {
      console.log(`${h.date} - ${h.name} (${h.type})`);
    });
  } else {
    console.log('No holidays found for Chile');
  }

  // Check if package supports Monday-moving holidays for Chile
  console.log('\n📋 Chile Monday-moving holidays check:');
  const june29 = clHolidays.find((h) => h.name.includes('Pedro'));
  const oct12 = clHolidays.find((h) => h.name.includes('Mundo') || h.name.includes('Columbus'));

  if (june29) {
    console.log(`San Pedro y San Pablo: ${june29.date}`);
  }
  if (oct12) {
    console.log(`Encuentro de Dos Mundos: ${oct12.date}`);
  }

  // Get more details about the holidays
  console.log('\n📊 Package capabilities:');
  console.log('- Countries supported:', hdCL.getCountries().length);
  console.log('- Has Venezuela:', hdCL.getCountries().VE ? 'Yes' : 'No');
  console.log('- Has Chile:', hdCL.getCountries().CL ? 'Yes' : 'No');
} catch (error) {
  console.log('❌ date-holidays package not found');
  console.log('To install: npm install date-holidays');
  console.log('\nWe would need to install this package to use it as a data source');
  console.log('Alternatively, we can implement the holidays manually based on official sources');
}

console.log('\n=== Manual Implementation Data ===\n');
console.log("If we implement manually, here's what we gathered:\n");

console.log('CHILE 2025 (from timeanddate.com):');
console.log('- 18 public holidays confirmed');
console.log('- June 29 (Saint Peter and Saint Paul) - Sunday');
console.log('- Oct 12 (Discovery of Two Worlds) - Sunday');
console.log('- Need to verify Monday-moving rule still applies\n');

console.log('VENEZUELA 2025 (typical holidays - needs verification):');
console.log('- Carnival Monday/Tuesday (Mar 3-4)');
console.log('- Holy Week (Apr 17-18)');
console.log('- Fixed holidays throughout the year');
console.log('- Total typically 12-14 holidays');
