import { getDay, addDays, lastDayOfMonth, isValid } from 'date-fns';

import { debug } from '../utils/debug';

// Types (keeping same as original)
export interface Holiday {
  name: string;
  type: 'fixed' | 'floating' | 'easter-based';
  month?: number;
  day?: number;
  weekday?: number;
  occurrence?: number;
  offset?: number;
  observe?: 'always' | 'never' | 'us_federal' | 'uk_bank' | 'au_public' | 'cl_monday';
}

export interface CalculatedHoliday {
  name: string;
  date: Date;
  observedDate?: Date;
}

// Holiday data
const HOLIDAY_DATA: Record<string, Holiday[]> = {
  US: [
    { name: "New Year's Day", type: 'fixed', month: 1, day: 1, observe: 'us_federal' },
    {
      name: 'Martin Luther King Jr. Day',
      type: 'floating',
      month: 1,
      weekday: 1,
      occurrence: 3,
      observe: 'always',
    },
    {
      name: 'Presidents Day',
      type: 'floating',
      month: 2,
      weekday: 1,
      occurrence: 3,
      observe: 'always',
    },
    {
      name: 'Memorial Day',
      type: 'floating',
      month: 5,
      weekday: 1,
      occurrence: -1,
      observe: 'always',
    },
    {
      name: 'Juneteenth National Independence Day',
      type: 'fixed',
      month: 6,
      day: 19,
      observe: 'us_federal',
    },
    { name: 'Independence Day', type: 'fixed', month: 7, day: 4, observe: 'us_federal' },
    { name: 'Labor Day', type: 'floating', month: 9, weekday: 1, occurrence: 1, observe: 'always' },
    {
      name: 'Columbus Day',
      type: 'floating',
      month: 10,
      weekday: 1,
      occurrence: 2,
      observe: 'always',
    },
    { name: 'Veterans Day', type: 'fixed', month: 11, day: 11, observe: 'us_federal' },
    {
      name: 'Thanksgiving',
      type: 'floating',
      month: 11,
      weekday: 4,
      occurrence: 4,
      observe: 'always',
    },
    { name: 'Christmas Day', type: 'fixed', month: 12, day: 25, observe: 'us_federal' },
  ],
  UK: [
    { name: "New Year's Day", type: 'fixed', month: 1, day: 1, observe: 'uk_bank' },
    { name: 'Good Friday', type: 'easter-based', offset: -2, observe: 'always' },
    { name: 'Easter Monday', type: 'easter-based', offset: 1, observe: 'always' },
    {
      name: 'Early May Bank Holiday',
      type: 'floating',
      month: 5,
      weekday: 1,
      occurrence: 1,
      observe: 'always',
    },
    {
      name: 'Spring Bank Holiday',
      type: 'floating',
      month: 5,
      weekday: 1,
      occurrence: -1,
      observe: 'always',
    },
    {
      name: 'Summer Bank Holiday',
      type: 'floating',
      month: 8,
      weekday: 1,
      occurrence: -1,
      observe: 'always',
    },
    { name: 'Christmas Day', type: 'fixed', month: 12, day: 25, observe: 'uk_bank' },
    { name: 'Boxing Day', type: 'fixed', month: 12, day: 26, observe: 'uk_bank' },
  ],
  CA: [
    { name: "New Year's Day", type: 'fixed', month: 1, day: 1, observe: 'us_federal' },
    { name: 'Good Friday', type: 'easter-based', offset: -2, observe: 'always' },
    {
      name: 'Victoria Day',
      type: 'floating',
      month: 5,
      weekday: 1,
      occurrence: -2,
      observe: 'always',
    }, // Special calc needed
    { name: 'Canada Day', type: 'fixed', month: 7, day: 1, observe: 'us_federal' },
    {
      name: 'Labour Day',
      type: 'floating',
      month: 9,
      weekday: 1,
      occurrence: 1,
      observe: 'always',
    },
    {
      name: 'Thanksgiving Day',
      type: 'floating',
      month: 10,
      weekday: 1,
      occurrence: 2,
      observe: 'always',
    },
    { name: 'Remembrance Day', type: 'fixed', month: 11, day: 11, observe: 'never' }, // Some provinces observe
    { name: 'Christmas Day', type: 'fixed', month: 12, day: 25, observe: 'us_federal' },
    { name: 'Boxing Day', type: 'fixed', month: 12, day: 26, observe: 'us_federal' },
  ],
  AU: [
    { name: "New Year's Day", type: 'fixed', month: 1, day: 1, observe: 'au_public' },
    { name: 'Australia Day', type: 'fixed', month: 1, day: 26, observe: 'au_public' },
    { name: 'Good Friday', type: 'easter-based', offset: -2, observe: 'always' },
    { name: 'Easter Saturday', type: 'easter-based', offset: -1, observe: 'always' },
    { name: 'Easter Monday', type: 'easter-based', offset: 1, observe: 'always' },
    { name: 'Anzac Day', type: 'fixed', month: 4, day: 25, observe: 'never' }, // Special rules
    {
      name: "Queen's Birthday",
      type: 'floating',
      month: 6,
      weekday: 1,
      occurrence: 2,
      observe: 'always',
    },
    { name: 'Christmas Day', type: 'fixed', month: 12, day: 25, observe: 'au_public' },
    { name: 'Boxing Day', type: 'fixed', month: 12, day: 26, observe: 'au_public' },
  ],
  VE: [
    // Venezuela holidays (federal public holidays only)
    { name: 'Año Nuevo', type: 'fixed', month: 1, day: 1, observe: 'never' },
    { name: 'Lunes de Carnaval', type: 'easter-based', offset: -48, observe: 'never' },
    { name: 'Martes de Carnaval', type: 'easter-based', offset: -47, observe: 'never' },
    { name: 'Jueves Santo', type: 'easter-based', offset: -3, observe: 'never' },
    { name: 'Viernes Santo', type: 'easter-based', offset: -2, observe: 'never' },
    { name: 'Declaración de la Independencia', type: 'fixed', month: 4, day: 19, observe: 'never' },
    { name: 'Día del Trabajador', type: 'fixed', month: 5, day: 1, observe: 'never' },
    { name: 'Batalla de Carabobo', type: 'fixed', month: 6, day: 24, observe: 'never' },
    { name: 'Día de la Independencia', type: 'fixed', month: 7, day: 5, observe: 'never' },
    { name: 'Natalicio de Simón Bolívar', type: 'fixed', month: 7, day: 24, observe: 'never' },
    { name: 'Día de la Resistencia Indígena', type: 'fixed', month: 10, day: 12, observe: 'never' },
    { name: 'Navidad', type: 'fixed', month: 12, day: 25, observe: 'never' },
  ],
  CL: [
    // Chile holidays with Monday-moving rules for certain holidays
    { name: 'Año Nuevo', type: 'fixed', month: 1, day: 1, observe: 'never' },
    { name: 'Viernes Santo', type: 'easter-based', offset: -2, observe: 'never' },
    { name: 'Sábado Santo', type: 'easter-based', offset: -1, observe: 'never' },
    { name: 'Día del Trabajo', type: 'fixed', month: 5, day: 1, observe: 'never' },
    { name: 'Día de las Glorias Navales', type: 'fixed', month: 5, day: 21, observe: 'never' },
    {
      name: 'Día Nacional de los Pueblos Indígenas',
      type: 'fixed',
      month: 6,
      day: 20,
      observe: 'never',
    },
    { name: 'San Pedro y San Pablo', type: 'fixed', month: 6, day: 29, observe: 'cl_monday' }, // Monday-moving
    { name: 'Día de la Virgen del Carmen', type: 'fixed', month: 7, day: 16, observe: 'never' },
    { name: 'Asunción de la Virgen', type: 'fixed', month: 8, day: 15, observe: 'never' },
    { name: 'Independencia Nacional', type: 'fixed', month: 9, day: 18, observe: 'never' },
    { name: 'Día de las Glorias del Ejército', type: 'fixed', month: 9, day: 19, observe: 'never' },
    { name: 'Encuentro de Dos Mundos', type: 'fixed', month: 10, day: 12, observe: 'cl_monday' }, // Monday-moving
    {
      name: 'Día de las Iglesias Evangélicas',
      type: 'fixed',
      month: 10,
      day: 31,
      observe: 'never',
    },
    { name: 'Día de Todos los Santos', type: 'fixed', month: 11, day: 1, observe: 'never' },
    { name: 'Inmaculada Concepción', type: 'fixed', month: 12, day: 8, observe: 'never' },
    { name: 'Navidad', type: 'fixed', month: 12, day: 25, observe: 'never' },
  ],
};

// Helper functions for calculateFloatingHoliday
function calculateVictoriaDay(year: number): Date {
  debug.holidays('Calculating Victoria Day for %d', year);
  const may24 = new Date(year, 4, 24); // May is month 4
  const dayOfWeek = getDay(may24);
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const result = addDays(may24, -daysToSubtract);
  debug.holidays(
    'Victoria Day: May 24 is %s, observed on %s',
    may24.toDateString(),
    result.toDateString()
  );
  return result;
}

function calculateLastOccurrence(year: number, month: number, weekday: number): Date {
  debug.holidays('Calculating last occurrence of weekday %d in month %d/%d', weekday, month, year);
  const lastDay = lastDayOfMonth(new Date(year, month - 1));
  const lastDayOfWeek = getDay(lastDay);

  let daysBack = lastDayOfWeek - weekday;
  if (daysBack < 0) {
    daysBack += 7;
  }

  const result = addDays(lastDay, -daysBack);
  debug.holidays(
    'Last %s of month: %s',
    // eslint-disable-next-line security/detect-object-injection -- weekday is validated 0-6 from getDay()
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][weekday],
    result.toDateString()
  );
  return result;
}

function calculateNthOccurrence(
  year: number,
  month: number,
  weekday: number,
  occurrence: number
): Date | null {
  debug.holidays(
    'Calculating occurrence %d of weekday %d in month %d/%d',
    occurrence,
    weekday,
    month,
    year
  );
  const firstDay = new Date(year, month - 1, 1);
  const firstDayOfWeek = getDay(firstDay);

  let daysUntilTarget = weekday - firstDayOfWeek;
  if (daysUntilTarget < 0) {
    daysUntilTarget += 7;
  }

  const targetDate = addDays(firstDay, daysUntilTarget + (occurrence - 1) * 7);

  // Check if still in same month
  if (targetDate.getMonth() !== month - 1) {
    debug.holidays('Target date %s is not in month %d', targetDate.toDateString(), month);
    return null;
  }

  debug.holidays('Nth occurrence result: %s', targetDate.toDateString());
  return targetDate;
}

export function calculateFloatingHoliday(holiday: Holiday, year: number): Date | null {
  debug.holidays('calculateFloatingHoliday called for %s in %d', holiday.name, year);

  if (
    holiday.type !== 'floating' ||
    !holiday.month ||
    holiday.weekday === undefined ||
    holiday.occurrence === undefined
  ) {
    debug.holidays('Invalid floating holiday configuration');
    return null;
  }

  // Special case for Victoria Day (Monday on or before May 24)
  if (holiday.name === 'Victoria Day' && holiday.month === 5) {
    return calculateVictoriaDay(year);
  }

  if (holiday.occurrence === -1) {
    return calculateLastOccurrence(year, holiday.month, holiday.weekday);
  } else {
    return calculateNthOccurrence(year, holiday.month, holiday.weekday, holiday.occurrence);
  }
}

// Helper functions for getObservedDate
function applyUSFederalRule(date: Date, dayOfWeek: number): Date {
  if (dayOfWeek === 6) {
    debug.holidays('US Federal: Saturday -> Friday');
    return addDays(date, -1); // Saturday -> Friday
  }
  if (dayOfWeek === 0) {
    debug.holidays('US Federal: Sunday -> Monday');
    return addDays(date, 1); // Sunday -> Monday
  }
  return date;
}

function applyUKBankRule(date: Date, dayOfWeek: number): Date {
  if (dayOfWeek === 6) {
    debug.holidays('UK Bank: Saturday -> Monday');
    return addDays(date, 2); // Saturday -> Monday
  }
  if (dayOfWeek === 0) {
    debug.holidays('UK Bank: Sunday -> Monday');
    return addDays(date, 1); // Sunday -> Monday
  }
  return date;
}

function applyAUPublicRule(date: Date, dayOfWeek: number): Date {
  if (dayOfWeek === 0) {
    debug.holidays('AU Public: Sunday -> Monday');
    return addDays(date, 1); // Sunday -> Monday
  }
  return date; // Saturday stays Saturday
}

function applyChileMondayRule(date: Date, dayOfWeek: number): Date {
  // Chile Monday-moving rule (Ley 19.973):
  // Tuesday, Wednesday, Thursday -> Previous Monday
  // Saturday, Sunday -> Next Monday
  // Monday, Friday -> No change (already creates long weekend)

  if (dayOfWeek >= 2 && dayOfWeek <= 4) {
    // Tue(2), Wed(3), Thu(4) -> move to previous Monday
    debug.holidays(
      'Chile Monday: %s -> previous Monday',
      // eslint-disable-next-line security/detect-object-injection -- dayOfWeek is validated 0-6 from getDay()
      ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek]
    );
    return addDays(date, -(dayOfWeek - 1));
  } else if (dayOfWeek === 0) {
    // Sunday -> next Monday
    debug.holidays('Chile Monday: Sunday -> next Monday');
    return addDays(date, 1);
  } else if (dayOfWeek === 6) {
    // Saturday -> next Monday
    debug.holidays('Chile Monday: Saturday -> next Monday');
    return addDays(date, 2);
  }
  // Monday(1) or Friday(5) -> no change
  debug.holidays(
    'Chile Monday: %s -> no change',
    // eslint-disable-next-line security/detect-object-injection -- dayOfWeek is validated 0-6 from getDay()
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek]
  );
  return date;
}

export function getObservedDate(date: Date, rule: string): Date {
  debug.holidays('getObservedDate called for %s with rule %s', date.toDateString(), rule);
  const dayOfWeek = getDay(date);

  switch (rule) {
    case 'us_federal':
      return applyUSFederalRule(date, dayOfWeek);

    case 'uk_bank':
      return applyUKBankRule(date, dayOfWeek);

    case 'au_public':
      return applyAUPublicRule(date, dayOfWeek);

    case 'cl_monday':
      return applyChileMondayRule(date, dayOfWeek);

    case 'never':
    case 'always':
    default:
      debug.holidays('No observation rule change for rule: %s', rule);
      return date;
  }
}

// Export other functions unchanged (just add debug statements)
export function getHolidayDefinitions(country: string): Holiday[] {
  debug.holidays('getHolidayDefinitions called for country: %s', country);
  if (!Object.prototype.hasOwnProperty.call(HOLIDAY_DATA, country)) {
    debug.holidays('Unknown country code: %s', country);
    return [];
  }
  // eslint-disable-next-line security/detect-object-injection -- Country validated above
  return HOLIDAY_DATA[country] || [];
}

export function calculateFixedHoliday(holiday: Holiday, year: number): Date | null {
  debug.holidays('calculateFixedHoliday called for %s in %d', holiday.name, year);

  if (holiday.type !== 'fixed' || !holiday.month || !holiday.day) {
    debug.holidays('Invalid fixed holiday configuration');
    return null;
  }

  const date = new Date(year, holiday.month - 1, holiday.day);

  // Check if date is valid (e.g., Feb 29 in non-leap year)
  if (!isValid(date) || date.getDate() !== holiday.day) {
    debug.holidays('Invalid date: %d/%d/%d', holiday.month, holiday.day, year);
    return null;
  }

  debug.holidays('Fixed holiday date: %s', date.toDateString());
  return date;
}

export function calculateEaster(year: number): { year: number; month: number; day: number } {
  debug.holidays('calculateEaster called for year %d', year);
  // Gauss's Easter Algorithm (Computus)
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

  debug.holidays('Easter date: %d/%d/%d', month, day, year);
  return { year, month, day };
}

export function getEasterBasedHoliday(holiday: Holiday, year: number): Date {
  debug.holidays('getEasterBasedHoliday called for %s in %d', holiday.name, year);
  const easter = calculateEaster(year);
  // Create Easter date (month is 1-indexed from algorithm, Date expects 0-indexed)
  const easterDate = new Date(year, easter.month - 1, easter.day);

  // Apply offset if specified (default to 0 for Easter Sunday)
  const offset = holiday.offset ?? 0;
  const result = addDays(easterDate, offset);
  debug.holidays('Easter-based holiday %s: %s', holiday.name, result.toDateString());
  return result;
}

export function getHolidaysForYear(country: string, year: number): CalculatedHoliday[] {
  debug.holidays('getHolidaysForYear called for %s in %d', country, year);
  const definitions = getHolidayDefinitions(country);
  const holidays: CalculatedHoliday[] = [];

  for (const def of definitions) {
    let date: Date | null = null;

    if (def.type === 'fixed') {
      date = calculateFixedHoliday(def, year);
    } else if (def.type === 'floating') {
      date = calculateFloatingHoliday(def, year);
    } else if (def.type === 'easter-based') {
      date = getEasterBasedHoliday(def, year);
    }

    if (date) {
      // For Chile's Monday-moving holidays, the holiday IS on the moved date
      if (def.observe === 'cl_monday') {
        const movedDate = getObservedDate(date, def.observe);
        const holiday: CalculatedHoliday = {
          name: def.name,
          date: movedDate, // The actual holiday is on the moved date
        };
        holidays.push(holiday);
      } else {
        // For other observation rules, keep original date and add observedDate if different
        const holiday: CalculatedHoliday = {
          name: def.name,
          date: date,
        };

        // Calculate observed date if different
        if (def.observe) {
          const observed = getObservedDate(date, def.observe);
          if (observed.getTime() !== date.getTime()) {
            holiday.observedDate = observed;
          }
        }

        holidays.push(holiday);
      }
    }
  }

  debug.holidays('Found %d holidays for %s in %d', holidays.length, country, year);
  return holidays;
}

export function isHoliday(
  date: Date,
  country: string,
  options: { checkObserved?: boolean } = {}
): boolean {
  debug.holidays('isHoliday called for %s in %s', date.toDateString(), country);
  const year = date.getFullYear();
  const holidays = getHolidaysForYear(country, year);

  for (const holiday of holidays) {
    // Check actual date
    if (holiday.date.toDateString() === date.toDateString()) {
      debug.holidays('Date %s is holiday: %s', date.toDateString(), holiday.name);
      return true;
    }

    // Check observed date if requested
    if (options.checkObserved && holiday.observedDate) {
      if (holiday.observedDate.toDateString() === date.toDateString()) {
        debug.holidays('Date %s is observed holiday: %s', date.toDateString(), holiday.name);
        return true;
      }
    }
  }

  debug.holidays('Date %s is not a holiday', date.toDateString());
  return false;
}
