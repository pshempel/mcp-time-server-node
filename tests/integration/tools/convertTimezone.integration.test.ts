import { createTestEnvironment } from '../helpers/setup';
import { callTool } from '../helpers/tools';

describe('convert_timezone integration', () => {
  it('should execute convert_timezone with all params', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      const result = await callTool(client, 'convert_timezone', {
        time: '2025-01-01T12:00:00Z',
        from_timezone: 'UTC',
        to_timezone: 'America/New_York',
      });

      expect(result.original).toContain('2025-01-01T12:00:00');
      expect(result.converted).toContain('2025-01-01T07:00:00');
      expect(result.from_offset).toBe('Z');
      expect(result.to_offset).toBe('-05:00');
      expect(result.difference).toBe(-300); // -5 hours in minutes
    } finally {
      await cleanup();
    }
  });

  it('should execute convert_timezone with custom format', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      const result = await callTool(client, 'convert_timezone', {
        time: '2025-07-15T14:30:00+02:00',
        from_timezone: 'Europe/Paris',
        to_timezone: 'Asia/Tokyo',
        format: 'dd/MM/yyyy HH:mm',
      });

      expect(result.original).toContain('2025-07-15T14:30:00');
      expect(result.converted).toBe('15/07/2025 21:30');
      expect(result.from_offset).toBe('+02:00');
      expect(result.to_offset).toBe('+09:00');
      expect(result.difference).toBe(420); // +7 hours in minutes
    } finally {
      await cleanup();
    }
  });
});
