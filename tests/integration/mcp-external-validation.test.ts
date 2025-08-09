/**
 * MCP External Validation Tests
 *
 * These tests validate our outputs against external sources to ensure
 * we're not just testing against ourselves.
 *
 * RUN THESE AFTER RELOADING CLAUDE CODE CLIENT WITH NEW BUILD
 */

import { spawn } from 'child_process';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('MCP External Validation - Real World Accuracy', () => {
  let server: any;
  let sendRequest: (method: string, params: any) => Promise<any>;

  beforeAll(async () => {
    // Start actual MCP server
    server = spawn('node', ['dist/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Setup request handler
    const responses = new Map();
    let currentId = 1;
    let buffer = '';

    server.stdout.on('data', (data: Buffer) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() && !line.includes('MCP Time Server running')) {
          try {
            const response = JSON.parse(line);
            const resolver = responses.get(response.id);
            if (resolver) {
              resolver(response);
              responses.delete(response.id);
            }
          } catch (e) {
            // Ignore
          }
        }
      }
    });

    sendRequest = (name: string, args: any) => {
      return new Promise((resolve) => {
        const id = currentId++;
        responses.set(id, resolve);

        const request = {
          jsonrpc: '2.0',
          id,
          method: 'tools/call',
          params: { name, arguments: args },
        };

        server.stdin.write(JSON.stringify(request) + '\n');
      });
    };

    // Wait for server to start
    await new Promise((resolve) => setTimeout(resolve, 200));
  });

  afterAll(() => {
    server.kill();
  });

  describe('Validate Against Known Truth', () => {
    it('should calculate business days correctly for known date ranges', async () => {
      // Known truth: Jan 1-31, 2025 has 23 business days (excluding weekends)
      const result = await sendRequest('get_business_days', {
        start_date: '2025-01-01',
        end_date: '2025-01-31',
      });

      expect(result.result.content[0].text).toContain('"business_days":23');
    });

    it('should calculate business hours matching real-world expectations', async () => {
      // Known truth: Monday 9am to Friday 5pm = 40 business hours
      const result = await sendRequest('calculate_business_hours', {
        start_time: '2025-01-20T09:00:00', // Monday 9am
        end_time: '2025-01-24T17:00:00', // Friday 5pm
      });

      expect(result.result.content[0].text).toContain('"total_business_hours":40');
    });

    it('should handle timezone conversions matching external sources', async () => {
      // Known truth: When it's noon UTC, it's 7am EST (UTC-5 in January)
      const result = await sendRequest('convert_timezone', {
        time: '2025-01-15T12:00:00Z',
        from_timezone: 'UTC',
        to_timezone: 'America/New_York',
      });

      expect(result.result.content[0].text).toContain('07:00:00');
    });

    it('should calculate duration matching manual calculation', async () => {
      // Known truth: Jan 1 to Jan 15 = 14 days = 336 hours
      const result = await sendRequest('calculate_duration', {
        start_time: '2025-01-01T00:00:00Z',
        end_time: '2025-01-15T00:00:00Z',
        unit: 'hours',
      });

      expect(result.result.content[0].text).toContain('336');
    });
  });

  describe('Validate Complex Scenarios', () => {
    it('should handle DST transitions correctly', async () => {
      // Known truth: March 9, 2025 - DST starts, day has 23 hours
      const result = await sendRequest('calculate_duration', {
        start_time: '2025-03-09T00:00:00',
        end_time: '2025-03-10T00:00:00',
        timezone: 'America/New_York',
        unit: 'hours',
      });

      // Should be 23 hours due to DST
      expect(result.result.content[0].text).toContain('23');
    });

    it('should exclude US holidays from business days', async () => {
      // Known truth: July 2025 has July 4th (Friday) as holiday
      const result = await sendRequest('get_business_days', {
        start_date: '2025-07-01',
        end_date: '2025-07-31',
        holidays: ['2025-07-04'],
      });

      // July 2025: 23 weekdays - 1 holiday = 22 business days
      expect(result.result.content[0].text).toContain('"business_days":22');
    });
  });

  describe('Cross-validation with Multiple Timezones', () => {
    it('should show same moment in different timezones correctly', async () => {
      const testTime = '2025-06-15T15:00:00Z'; // 3pm UTC

      // Get conversions
      const nyResult = await sendRequest('convert_timezone', {
        time: testTime,
        from_timezone: 'UTC',
        to_timezone: 'America/New_York',
      });

      const tokyoResult = await sendRequest('convert_timezone', {
        time: testTime,
        from_timezone: 'UTC',
        to_timezone: 'Asia/Tokyo',
      });

      // NYC should be UTC-4 in June (EDT): 11am
      expect(nyResult.result.content[0].text).toContain('11:00:00');

      // Tokyo should be UTC+9: midnight next day
      expect(tokyoResult.result.content[0].text).toContain('2025-06-16');
      expect(tokyoResult.result.content[0].text).toContain('00:00:00');
    });
  });
});

describe('MCP Protocol Compliance', () => {
  let server: any;

  beforeAll(async () => {
    server = spawn('node', ['dist/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    await new Promise((resolve) => setTimeout(resolve, 200));
  });

  afterAll(() => {
    server.kill();
  });

  it('should handle invalid tool names gracefully', async () => {
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: 'invalid_tool', arguments: {} },
    };

    server.stdin.write(JSON.stringify(request) + '\n');

    const response = await new Promise<any>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Response timeout'));
      }, 1000);

      server.stdout.once('data', (data: Buffer) => {
        clearTimeout(timeout);
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (line.trim()) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.id === 1 || parsed.error) {
                resolve(parsed);
                break;
              }
            } catch {
              // Ignore non-JSON lines
            }
          }
        }
        // If no valid response found, resolve with empty object
        resolve({});
      });
    });

    expect(response.result).toBeDefined();
    expect(response.result.error).toBeDefined();
    expect(response.result.error.message).toContain('invalid_tool');
  });
});
