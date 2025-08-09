/**
 * Optional holiday loader for comprehensive holiday support
 * Only loads date-holidays if it's installed
 */

import { debug } from './debug';

let Holidays: any = null;
let holidayInstance: any = null;

/**
 * Try to load date-holidays package if available
 * This is optional - if not installed, we fall back to commonHolidays
 */
export function loadHolidayPackage(countryCode: string = 'US'): boolean {
  try {
    // Try to load date-holidays dynamically
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Holidays = require('date-holidays');
    holidayInstance = new Holidays(countryCode);
    debug.timing('Loaded date-holidays package for country: %s', countryCode);
    return true;
  } catch (e) {
    debug.timing('date-holidays not installed, using basic holiday list');
    return false;
  }
}

/**
 * Get holiday date using the optional package
 * @returns null if package not loaded or holiday not found
 */
export function getHolidayFromPackage(holidayName: string, year: number): Date | null {
  if (!holidayInstance) {
    return null;
  }
  
  try {
    const holidays = holidayInstance.getHolidays(year);
    const normalized = holidayName.toLowerCase();
    
    // Search for matching holiday
    const holiday = holidays.find((h: any) => 
      h.name.toLowerCase().includes(normalized) ||
      (h.nameLocal && h.nameLocal.toLowerCase().includes(normalized))
    );
    
    if (holiday) {
      return new Date(holiday.start);
    }
  } catch (e) {
    debug.error('Error getting holiday from package: %o', e);
  }
  
  return null;
}

/**
 * Check if date-holidays is available
 */
export function hasFullHolidaySupport(): boolean {
  return holidayInstance !== null;
}

// Try to load on module init
loadHolidayPackage();