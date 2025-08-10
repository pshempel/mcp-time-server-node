#!/usr/bin/env node

/**
 * Detailed verification for Venezuela and Chile holidays 2025
 * This script outlines what we need to verify before implementation
 */

// First, let's calculate Easter 2025 for moveable holidays
function calculateEaster(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day);
}

const easter2025 = calculateEaster(2025);
console.log('Easter 2025:', easter2025.toDateString()); // Sun Apr 20 2025

console.log('\n=== 🇻🇪 VENEZUELA 2025 - Holidays to Verify ===\n');

// Calculate Carnival dates (47-48 days before Easter)
const carnivalMonday = new Date(easter2025);
carnivalMonday.setDate(carnivalMonday.getDate() - 48);
const carnivalTuesday = new Date(easter2025);
carnivalTuesday.setDate(carnivalTuesday.getDate() - 47);

console.log('MUST VERIFY with official Venezuelan sources:');
console.log('(These are typical holidays, but Venezuela has made changes)\n');

const venezuelaHolidays2025 = [
  { name: 'Año Nuevo', englishName: "New Year's Day", date: '2025-01-01', type: 'fixed' },
  {
    name: 'Lunes de Carnaval',
    englishName: 'Carnival Monday',
    date: carnivalMonday.toISOString().split('T')[0],
    type: 'easter-based',
  },
  {
    name: 'Martes de Carnaval',
    englishName: 'Carnival Tuesday',
    date: carnivalTuesday.toISOString().split('T')[0],
    type: 'easter-based',
  },
  {
    name: 'Jueves Santo',
    englishName: 'Maundy Thursday',
    date: '2025-04-17',
    type: 'easter-based',
  },
  { name: 'Viernes Santo', englishName: 'Good Friday', date: '2025-04-18', type: 'easter-based' },
  {
    name: 'Declaración de la Independencia',
    englishName: 'Declaration of Independence',
    date: '2025-04-19',
    type: 'fixed',
  },
  { name: 'Día del Trabajador', englishName: 'Labor Day', date: '2025-05-01', type: 'fixed' },
  {
    name: 'Batalla de Carabobo',
    englishName: 'Battle of Carabobo',
    date: '2025-06-24',
    type: 'fixed',
  },
  {
    name: 'Día de la Independencia',
    englishName: 'Independence Day',
    date: '2025-07-05',
    type: 'fixed',
  },
  {
    name: 'Natalicio de Simón Bolívar',
    englishName: "Simón Bolívar's Birthday",
    date: '2025-07-24',
    type: 'fixed',
  },
  {
    name: 'Día de la Resistencia Indígena',
    englishName: 'Indigenous Resistance Day',
    date: '2025-10-12',
    type: 'fixed',
  },
  { name: 'Navidad', englishName: 'Christmas Day', date: '2025-12-25', type: 'fixed' },
];

venezuelaHolidays2025.forEach((h) => {
  console.log(`- ${h.englishName} (${h.name}): ${h.date}`);
});

console.log('\n=== 🇨🇱 CHILE 2025 - Holidays to Verify ===\n');

// Helper to calculate Chile's Monday-moving holidays
function chileMovableDate(baseDate, holidayName) {
  const date = new Date(baseDate);
  const day = date.getDay();

  // If Tuesday, Wednesday, or Thursday, move to previous Monday
  if (day >= 2 && day <= 4) {
    date.setDate(date.getDate() - (day - 1));
  }
  // If Saturday or Sunday, move to next Monday
  else if (day === 0) {
    date.setDate(date.getDate() + 1);
  } else if (day === 6) {
    date.setDate(date.getDate() + 2);
  }

  return date.toISOString().split('T')[0];
}

console.log('MUST VERIFY with https://www.chile.gob.cl/feriados:');
console.log('(Chile has specific laws about holiday movements)\n');

const chileHolidays2025 = [
  { name: 'Año Nuevo', englishName: "New Year's Day", date: '2025-01-01', type: 'fixed' },
  { name: 'Viernes Santo', englishName: 'Good Friday', date: '2025-04-18', type: 'easter-based' },
  { name: 'Sábado Santo', englishName: 'Holy Saturday', date: '2025-04-19', type: 'easter-based' },
  { name: 'Día del Trabajo', englishName: 'Labor Day', date: '2025-05-01', type: 'fixed' },
  {
    name: 'Día de las Glorias Navales',
    englishName: 'Navy Day',
    date: '2025-05-21',
    type: 'fixed',
  },
  {
    name: 'Día Nacional de los Pueblos Indígenas',
    englishName: 'Indigenous Peoples Day',
    date: '2025-06-20',
    type: 'fixed',
  },
  {
    name: 'San Pedro y San Pablo',
    englishName: 'Saints Peter and Paul',
    date: chileMovableDate('2025-06-29'),
    type: 'movable',
    originalDate: '2025-06-29',
  },
  {
    name: 'Día de la Virgen del Carmen',
    englishName: 'Our Lady of Mount Carmel',
    date: '2025-07-16',
    type: 'fixed',
  },
  {
    name: 'Asunción de la Virgen',
    englishName: 'Assumption of Mary',
    date: '2025-08-15',
    type: 'fixed',
  },
  {
    name: 'Independencia Nacional',
    englishName: 'Independence Day',
    date: '2025-09-18',
    type: 'fixed',
  },
  {
    name: 'Día de las Glorias del Ejército',
    englishName: 'Army Day',
    date: '2025-09-19',
    type: 'fixed',
  },
  {
    name: 'Encuentro de Dos Mundos',
    englishName: 'Columbus Day',
    date: chileMovableDate('2025-10-12'),
    type: 'movable',
    originalDate: '2025-10-12',
  },
  {
    name: 'Día de las Iglesias Evangélicas',
    englishName: 'Reformation Day',
    date: '2025-10-31',
    type: 'fixed',
  },
  {
    name: 'Día de Todos los Santos',
    englishName: "All Saints' Day",
    date: '2025-11-01',
    type: 'fixed',
  },
  {
    name: 'Inmaculada Concepción',
    englishName: 'Immaculate Conception',
    date: '2025-12-08',
    type: 'fixed',
  },
  { name: 'Navidad', englishName: 'Christmas Day', date: '2025-12-25', type: 'fixed' },
];

chileHolidays2025.forEach((h) => {
  if (h.type === 'movable') {
    console.log(`- ${h.englishName} (${h.name}): ${h.originalDate} → ${h.date} (MOVED)`);
  } else {
    console.log(`- ${h.englishName} (${h.name}): ${h.date}`);
  }
});

console.log('\n=== CRITICAL VERIFICATION STEPS ===\n');
console.log('1. ❗ Check official government sources for both countries');
console.log("2. ❗ Verify Chile's Monday-moving rules are still in effect");
console.log("3. ❗ Confirm Venezuela hasn't added/removed holidays");
console.log('4. ❗ Check if any holidays have been moved for 2025 specifically');
console.log('5. ❗ Verify English translations are appropriate');

console.log('\n=== IMPLEMENTATION NOTES ===\n');
console.log('- Both countries need bilingual support');
console.log('- Chile needs special Monday-moving logic');
console.log('- Venezuela needs Carnival calculation (Easter-based)');
console.log('- Consider adding alternate names for holidays');
console.log('- May need to handle regional variations in future');
