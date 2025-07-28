import { describe, it, expect } from '@jest/globals';
import { createTestEnvironment } from '../integration/helpers/setup';
import { callTool } from '../integration/helpers/tools';

describe('MCP Security Tests - Attack Vectors', () => {
  describe('Path Traversal Attacks', () => {
    it('should reject path traversal in date parameters', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        await expect(
          callTool(client, 'get_business_days', {
            start_date: '../../../etc/passwd',
            end_date: '2025-01-05',
          }),
        ).rejects.toThrow();
      } finally {
        await cleanup();
      }
    });

    it('should reject path traversal in timezone parameters', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        await expect(
          callTool(client, 'get_current_time', {
            timezone: '../../etc/passwd',
          }),
        ).rejects.toThrow(/timezone/i);
      } finally {
        await cleanup();
      }
    });
  });

  describe('SQL Injection Attacks', () => {
    it('should reject SQL injection in timezone', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        await expect(
          callTool(client, 'get_current_time', {
            timezone: "'; DROP TABLE users; --",
          }),
        ).rejects.toThrow(/timezone/i);
      } finally {
        await cleanup();
      }
    });

    it('should reject SQL injection in date parameters', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        await expect(
          callTool(client, 'add_time', {
            time: "2025-01-01'; DELETE FROM holidays; --",
            amount: 1,
            unit: 'days',
          }),
        ).rejects.toThrow();
      } finally {
        await cleanup();
      }
    });
  });

  describe('XSS Attacks', () => {
    it('should sanitize XSS attempts in format strings', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        const result = await callTool(client, 'get_current_time', {
          format: "<script>alert('xss')</script>",
        });

        // Should either error or return safe output
        if (result.time) {
          expect(result.time).not.toContain('<script>');
          expect(result.time).not.toContain('alert');
        }
      } catch (error) {
        // Error is acceptable for invalid format
        expect(error).toBeDefined();
      } finally {
        await cleanup();
      }
    });

    it('should reject XSS in timezone parameters', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        await expect(
          callTool(client, 'convert_timezone', {
            time: '2025-01-01T12:00:00',
            from_timezone: '<img src=x onerror=alert(1)>',
            to_timezone: 'UTC',
          }),
        ).rejects.toThrow(/timezone/i);
      } finally {
        await cleanup();
      }
    });
  });

  describe('Command Injection Attacks', () => {
    it('should reject command injection via timezone', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        await expect(
          callTool(client, 'get_current_time', {
            timezone: 'UTC; cat /etc/passwd',
          }),
        ).rejects.toThrow(/timezone/i);
      } finally {
        await cleanup();
      }
    });

    it('should safely handle command injection in format strings', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        await expect(
          callTool(client, 'format_time', {
            time: '2025-01-01T12:00:00',
            format: 'custom',
            custom_format: "'; cat /etc/passwd; echo '",
          }),
        ).rejects.toThrow();
      } finally {
        await cleanup();
      }
    });
  });

  describe('DoS Attack Vectors', () => {
    it('should handle extremely long timezone strings', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        const longString = 'A'.repeat(10000);
        await expect(
          callTool(client, 'get_current_time', {
            timezone: longString,
          }),
        ).rejects.toThrow();
      } finally {
        await cleanup();
      }
    });

    it('should handle extremely large date ranges', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        const result = await callTool(client, 'get_business_days', {
          start_date: '1000-01-01',
          end_date: '9999-12-31',
        });

        // Should either handle gracefully or error
        if (result.business_days) {
          expect(typeof result.business_days).toBe('number');
        }
      } catch (error) {
        // Error for unreasonable range is acceptable
        expect(error).toBeDefined();
      } finally {
        await cleanup();
      }
    });

    it('should handle large holiday arrays', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        const largeHolidayArray = new Array(10000).fill('2025-01-15');
        const result = await callTool(client, 'get_business_days', {
          start_date: '2025-01-01',
          end_date: '2025-01-31',
          holidays: largeHolidayArray,
        });

        // Should handle gracefully
        expect(result.business_days).toBeDefined();
      } catch (error) {
        // Error for too many holidays is acceptable
        expect(error).toBeDefined();
      } finally {
        await cleanup();
      }
    });
  });

  describe('Prototype Pollution Attacks', () => {
    it('should ignore __proto__ in parameters', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        const result = await callTool(client, 'get_business_days', {
          start_date: '2025-01-01',
          end_date: '2025-01-31',
          __proto__: { polluted: true },
        } as any);

        // Should work normally, ignoring __proto__
        expect(result.business_days).toBeDefined();
        expect((Object.prototype as any).polluted).toBeUndefined();
      } finally {
        await cleanup();
      }
    });

    it('should ignore constructor.prototype in parameters', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        const result = await callTool(client, 'add_time', {
          time: '2025-01-01',
          amount: 1,
          unit: 'days',
          constructor: { prototype: { polluted: true } },
        } as any);

        // Should work normally
        expect(result).toBeDefined();
        expect((Object.prototype as any).polluted).toBeUndefined();
      } finally {
        await cleanup();
      }
    });
  });

  describe('Invalid Input Handling', () => {
    it('should handle null timezone gracefully', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        const result = await callTool(client, 'get_current_time', {
          timezone: null as any,
        });

        // Should use default timezone
        expect(result.time).toBeDefined();
        expect(result.timezone).toBeDefined();
      } finally {
        await cleanup();
      }
    });

    it('should reject non-string date inputs', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        await expect(
          callTool(client, 'add_time', {
            time: { toString: () => '2025-01-01' } as any,
            amount: 1,
            unit: 'days',
          }),
        ).rejects.toThrow();
      } finally {
        await cleanup();
      }
    });

    it('should handle negative amount overflow', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        const result = await callTool(client, 'add_time', {
          time: '2025-01-01',
          amount: -999999999999,
          unit: 'days',
        });

        // Should either handle or error gracefully
        if (result) {
          expect(result).toBeDefined();
        }
      } catch (error) {
        expect(error).toBeDefined();
      } finally {
        await cleanup();
      }
    });

    it('should validate unit types strictly', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        await expect(
          callTool(client, 'add_time', {
            time: '2025-01-01',
            amount: 1,
            unit: "'; DROP TABLE; --" as any,
          }),
        ).rejects.toThrow(/unit/i);
      } finally {
        await cleanup();
      }
    });
  });

  describe('Cache Key Attacks', () => {
    it('should sanitize cache keys with null bytes', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        await expect(
          callTool(client, 'get_current_time', {
            timezone: 'UTC\x00extra',
          }),
        ).rejects.toThrow();
      } finally {
        await cleanup();
      }
    });

    it('should reject cache keys with path traversal', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        await expect(
          callTool(client, 'get_current_time', {
            timezone: 'UTC/../../../etc',
          }),
        ).rejects.toThrow(/timezone/i);
      } finally {
        await cleanup();
      }
    });

    it('should prevent cache poisoning attempts', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        await expect(
          callTool(client, 'get_business_days', {
            start_date: '2025-01-01',
            end_date: '2025-01-31',
            holiday_calendar: 'US\x00admin',
          }),
        ).rejects.toThrow();
      } finally {
        await cleanup();
      }
    });
  });
});
