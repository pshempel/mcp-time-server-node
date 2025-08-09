/**
 * Simple holiday mapping for common holidays
 * No external dependencies needed
 * Falls back to date-holidays package if installed for more comprehensive support
 */

import { getHolidayFromPackage } from './holidayLoader';

// Removed unused Holiday interface

// Fixed date holidays (same date every year)
const FIXED_HOLIDAYS: Record<string, [number, number]> = {
  "new year": [1, 1],
  "new year's": [1, 1],
  "new years": [1, 1],
  "new year's day": [1, 1],
  "valentines": [2, 14],
  "independence day": [7, 4],
  "july 4th": [7, 4],
  "fourth of july": [7, 4],
  "halloween": [10, 31],
  "christmas eve": [12, 24],
  "christmas": [12, 25],
  "new year's eve": [12, 31],
  
  // Commonly used cultural holidays (even in English)
  "cinco de mayo": [5, 5],
  "st. patrick's day": [3, 17],
  "st patrick's day": [3, 17],
  "valentine's day": [2, 14],
  "valentines day": [2, 14],
  "groundhog day": [2, 2],
  "april fools": [4, 1],
  "april fools day": [4, 1],
  "earth day": [4, 22],
  "tax day": [4, 15],
  "flag day": [6, 14],
  "juneteenth": [6, 19],
  "veterans day": [11, 11],
  "pearl harbor day": [12, 7],
  
  // Religious holidays with fixed dates
  "epiphany": [1, 6],
  "three kings day": [1, 6],
  "dia de reyes": [1, 6],
  "día de reyes": [1, 6],
  "all saints day": [11, 1],
  "all souls day": [11, 2],
  "dia de los muertos": [11, 2],
  "día de los muertos": [11, 2],
  "day of the dead": [11, 2],
};

// Dynamic holidays (need calculation)
const DYNAMIC_HOLIDAYS: Record<string, (year: number) => Date> = {
  "thanksgiving": (year: number) => {
    // US Thanksgiving: 4th Thursday of November
    const nov1 = new Date(year, 10, 1); // November 1
    const dayOfWeek = nov1.getDay();
    // Find first Thursday
    const firstThursday = dayOfWeek <= 4 ? 5 - dayOfWeek : 12 - dayOfWeek;
    // Add 3 weeks to get 4th Thursday
    return new Date(year, 10, firstThursday + 21);
  },
  "easter": (year: number) => {
    // Simplified Easter calculation (Western/Gregorian)
    // This is approximate - real Easter calculation is complex
    // For production, use a proper algorithm or library
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
    const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-indexed
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month, day);
  },
  "mother's day": (year: number) => {
    // US Mother's Day: 2nd Sunday of May
    const may1 = new Date(year, 4, 1);
    const dayOfWeek = may1.getDay();
    const firstSunday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    return new Date(year, 4, firstSunday + 7);
  },
  "father's day": (year: number) => {
    // US Father's Day: 3rd Sunday of June
    const june1 = new Date(year, 5, 1);
    const dayOfWeek = june1.getDay();
    const firstSunday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    return new Date(year, 5, firstSunday + 14);
  },
};

/**
 * Try to parse a holiday name and return its date
 * @param input - The holiday name to parse
 * @param year - The year to get the holiday for (defaults to current year)
 * @returns The date of the holiday, or null if not recognized
 */
export function parseHoliday(input: string, year?: number): Date | null {
  const normalized = input.toLowerCase().trim();
  const targetYear = year || new Date().getFullYear();
  
  // Try the optional date-holidays package first (if installed)
  const fromPackage = getHolidayFromPackage(input, targetYear);
  if (fromPackage) {
    return fromPackage;
  }
  
  // Check fixed holidays
  const fixed = FIXED_HOLIDAYS[normalized];
  if (fixed) {
    const [month, day] = fixed;
    return new Date(targetYear, month - 1, day); // month is 0-indexed
  }
  
  // Check dynamic holidays
  const dynamicCalc = DYNAMIC_HOLIDAYS[normalized];
  if (dynamicCalc) {
    return dynamicCalc(targetYear);
  }
  
  return null;
}

/**
 * Get next occurrence of a holiday from a reference date
 * @param holidayName - Name of the holiday
 * @param referenceDate - Date to search from
 * @returns Next occurrence of the holiday
 */
export function getNextHoliday(holidayName: string, referenceDate: Date = new Date()): Date | null {
  const currentYear = referenceDate.getFullYear();
  
  // Try current year first
  let holidayDate = parseHoliday(holidayName, currentYear);
  if (holidayDate && holidayDate > referenceDate) {
    return holidayDate;
  }
  
  // Try next year
  holidayDate = parseHoliday(holidayName, currentYear + 1);
  return holidayDate;
}