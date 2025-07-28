import { getHolidaysForYear, isHoliday } from '../../src/data/holidays';

describe('Venezuela (VE) Holidays', () => {
  describe('2025 Holidays', () => {
    const holidays2025 = [
      { name: 'Año Nuevo', englishName: "New Year's Day", date: '2025-01-01' },
      { name: 'Lunes de Carnaval', englishName: 'Carnival Monday', date: '2025-03-03' },
      { name: 'Martes de Carnaval', englishName: 'Carnival Tuesday', date: '2025-03-04' },
      { name: 'Jueves Santo', englishName: 'Maundy Thursday', date: '2025-04-17' },
      { name: 'Viernes Santo', englishName: 'Good Friday', date: '2025-04-18' },
      {
        name: 'Declaración de la Independencia',
        englishName: 'Declaration of Independence',
        date: '2025-04-19',
      },
      { name: 'Día del Trabajador', englishName: 'Labor Day', date: '2025-05-01' },
      { name: 'Batalla de Carabobo', englishName: 'Battle of Carabobo', date: '2025-06-24' },
      { name: 'Día de la Independencia', englishName: 'Independence Day', date: '2025-07-05' },
      {
        name: 'Natalicio de Simón Bolívar',
        englishName: "Simón Bolívar's Birthday",
        date: '2025-07-24',
      },
      {
        name: 'Día de la Resistencia Indígena',
        englishName: 'Indigenous Resistance Day',
        date: '2025-10-12',
      },
      { name: 'Navidad', englishName: 'Christmas Day', date: '2025-12-25' },
    ];

    it('should return correct number of holidays', () => {
      const result = getHolidaysForYear('VE', 2025);
      expect(result).toHaveLength(12);
    });

    holidays2025.forEach(({ name, englishName, date }) => {
      it(`should include ${englishName} on ${date}`, () => {
        const result = getHolidaysForYear('VE', 2025);
        const holiday = result.find(
          (h) => h.date.toISOString().startsWith(date) || h.name === name || h.name === englishName,
        );
        expect(holiday).toBeDefined();
        expect(holiday?.date.toISOString().split('T')[0]).toBe(date);
      });
    });

    it('should calculate Carnival dates based on Easter', () => {
      // Easter 2025 is April 20, Carnival is 48-47 days before
      const result = getHolidaysForYear('VE', 2025);
      const carnivalMonday = result.find((h) => h.name.includes('Lunes de Carnaval'));
      const carnivalTuesday = result.find((h) => h.name.includes('Martes de Carnaval'));

      expect(carnivalMonday?.date.toISOString().split('T')[0]).toBe('2025-03-03');
      expect(carnivalTuesday?.date.toISOString().split('T')[0]).toBe('2025-03-04');
    });
  });

  describe('2026 Holidays', () => {
    it('should calculate different Carnival dates for 2026', () => {
      // Easter 2026 is April 5, so Carnival should be different
      const result = getHolidaysForYear('VE', 2026);
      const carnivalMonday = result.find((h) => h.name.includes('Lunes de Carnaval'));
      const carnivalTuesday = result.find((h) => h.name.includes('Martes de Carnaval'));

      expect(carnivalMonday?.date.toISOString().split('T')[0]).toBe('2026-02-16');
      expect(carnivalTuesday?.date.toISOString().split('T')[0]).toBe('2026-02-17');
    });
  });

  describe('isHoliday function', () => {
    it('should recognize VE holidays', () => {
      // Use local timezone dates to match how holidays are created
      expect(isHoliday(new Date(2025, 0, 1), 'VE')).toBe(true); // Jan 1
      expect(isHoliday(new Date(2025, 2, 3), 'VE')).toBe(true); // March 3 - Carnival Monday
      expect(isHoliday(new Date(2025, 11, 25), 'VE')).toBe(true); // Dec 25
      expect(isHoliday(new Date(2025, 0, 2), 'VE')).toBe(false); // Jan 2
    });
  });
});

describe('Chile (CL) Holidays', () => {
  describe('2025 Holidays', () => {
    const holidays2025 = [
      { name: 'Año Nuevo', englishName: "New Year's Day", date: '2025-01-01' },
      { name: 'Viernes Santo', englishName: 'Good Friday', date: '2025-04-18' },
      { name: 'Sábado Santo', englishName: 'Holy Saturday', date: '2025-04-19' },
      { name: 'Día del Trabajo', englishName: 'Labor Day', date: '2025-05-01' },
      { name: 'Día de las Glorias Navales', englishName: 'Navy Day', date: '2025-05-21' },
      {
        name: 'Día Nacional de los Pueblos Indígenas',
        englishName: 'Indigenous Peoples Day',
        date: '2025-06-20',
      },
      {
        name: 'San Pedro y San Pablo',
        englishName: 'Saints Peter and Paul',
        date: '2025-06-30',
        originalDate: '2025-06-29',
      },
      {
        name: 'Día de la Virgen del Carmen',
        englishName: 'Our Lady of Mount Carmel',
        date: '2025-07-16',
      },
      { name: 'Asunción de la Virgen', englishName: 'Assumption of Mary', date: '2025-08-15' },
      { name: 'Independencia Nacional', englishName: 'Independence Day', date: '2025-09-18' },
      { name: 'Día de las Glorias del Ejército', englishName: 'Army Day', date: '2025-09-19' },
      {
        name: 'Encuentro de Dos Mundos',
        englishName: 'Meeting of Two Worlds',
        date: '2025-10-13',
        originalDate: '2025-10-12',
      },
      {
        name: 'Día de las Iglesias Evangélicas',
        englishName: 'Reformation Day',
        date: '2025-10-31',
      },
      { name: 'Día de Todos los Santos', englishName: "All Saints' Day", date: '2025-11-01' },
      { name: 'Inmaculada Concepción', englishName: 'Immaculate Conception', date: '2025-12-08' },
      { name: 'Navidad', englishName: 'Christmas Day', date: '2025-12-25' },
    ];

    it('should return correct number of holidays', () => {
      const result = getHolidaysForYear('CL', 2025);
      expect(result).toHaveLength(16);
    });

    holidays2025.forEach(({ name, englishName, date, originalDate }) => {
      it(`should include ${englishName} on ${date}${originalDate ? ` (moved from ${originalDate})` : ''}`, () => {
        const result = getHolidaysForYear('CL', 2025);
        const holiday = result.find(
          (h) =>
            h.name === name ||
            h.name === englishName ||
            (originalDate && h.date.toISOString().startsWith(date)),
        );
        expect(holiday).toBeDefined();
        expect(holiday?.date.toISOString().split('T')[0]).toBe(date);
      });
    });
  });

  describe('Monday-moving rule', () => {
    it('should move Sunday holidays to Monday', () => {
      const result = getHolidaysForYear('CL', 2025);

      // June 29 (Sunday) → June 30 (Monday)
      const sanPedro = result.find((h) => h.name.includes('San Pedro'));
      expect(sanPedro?.date.toISOString().split('T')[0]).toBe('2025-06-30');
      expect(sanPedro?.date.getDay()).toBe(1); // Monday

      // October 12 (Sunday) → October 13 (Monday)
      const encuentro = result.find((h) => h.name.includes('Encuentro'));
      expect(encuentro?.date.toISOString().split('T')[0]).toBe('2025-10-13');
      expect(encuentro?.date.getDay()).toBe(1); // Monday
    });

    it('should move Tuesday/Wednesday/Thursday holidays to previous Monday', () => {
      // Test with a year where these holidays fall on Tue/Wed/Thu
      // June 29, 2027 is a Tuesday
      const result2027 = getHolidaysForYear('CL', 2027);
      const sanPedro2027 = result2027.find((h) => h.name.includes('San Pedro'));
      expect(sanPedro2027?.date.toISOString().split('T')[0]).toBe('2027-06-28'); // Previous Monday
      expect(sanPedro2027?.date.getDay()).toBe(1); // Monday
    });

    it('should move Saturday holidays to Monday', () => {
      // Test with a year where holiday falls on Saturday
      // October 12, 2024 is a Saturday
      const result2024 = getHolidaysForYear('CL', 2024);
      const encuentro2024 = result2024.find((h) => h.name.includes('Encuentro'));
      expect(encuentro2024?.date.toISOString().split('T')[0]).toBe('2024-10-14'); // Next Monday
      expect(encuentro2024?.date.getDay()).toBe(1); // Monday
    });

    it('should not move Friday holidays (already creates long weekend)', () => {
      // October 12, 2029 is a Friday
      const result2029 = getHolidaysForYear('CL', 2029);
      const encuentro2029 = result2029.find((h) => h.name.includes('Encuentro'));
      expect(encuentro2029?.date.toISOString().split('T')[0]).toBe('2029-10-12'); // Stays on Friday
      expect(encuentro2029?.date.getDay()).toBe(5); // Friday
    });

    it('should not move Monday holidays', () => {
      // June 29, 2026 is a Monday
      const result2026 = getHolidaysForYear('CL', 2026);
      const sanPedro2026 = result2026.find((h) => h.name.includes('San Pedro'));
      expect(sanPedro2026?.date.toISOString().split('T')[0]).toBe('2026-06-29'); // Stays on Monday
      expect(sanPedro2026?.date.getDay()).toBe(1); // Monday
    });
  });

  describe('isHoliday function', () => {
    it('should recognize CL holidays including moved ones', () => {
      // Use local timezone dates to match how holidays are created
      expect(isHoliday(new Date(2025, 0, 1), 'CL')).toBe(true); // Jan 1
      expect(isHoliday(new Date(2025, 5, 30), 'CL')).toBe(true); // June 30 - Moved San Pedro
      expect(isHoliday(new Date(2025, 5, 29), 'CL')).toBe(false); // June 29 - Original date, not a holiday
      expect(isHoliday(new Date(2025, 9, 13), 'CL')).toBe(true); // Oct 13 - Moved Encuentro
      expect(isHoliday(new Date(2025, 9, 12), 'CL')).toBe(false); // Oct 12 - Original date, not a holiday
    });
  });
});
