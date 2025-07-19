import { createTestEnvironment } from './helpers/setup';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';

describe('Error Handling Integration', () => {
  describe('Invalid Tool Name', () => {
    it('should return error for non-existent tool', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        const response = await client.request(
          {
            method: 'tools/call',
            params: {
              name: 'non_existent_tool',
              arguments: {},
            },
          },
          CallToolResultSchema,
        );

        // MCP SDK returns errors in the response
        expect(response.content).toHaveLength(0);
        expect(response.error).toBeDefined();

        const error = response.error as any;
        expect(error.code).toBe('TOOL_ERROR');
        expect(error.message).toBe('Unknown tool: non_existent_tool');
        expect(error.details).toEqual({
          error: 'Error: Unknown tool: non_existent_tool',
          name: 'non_existent_tool',
        });
      } finally {
        await cleanup();
      }
    });
  });

  describe('Tool Validation Errors', () => {
    it('should return error for invalid timezone', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        const response = await client.request(
          {
            method: 'tools/call',
            params: {
              name: 'convert_timezone',
              arguments: {
                time: '2025-01-01T12:00:00Z',
                from_timezone: 'UTC',
                to_timezone: 'Invalid/Timezone',
              },
            },
          },
          CallToolResultSchema,
        );

        // Tool validation errors are returned in response.error
        expect(response.content).toHaveLength(0);
        expect(response.error).toBeDefined();

        const error = response.error as any;
        expect(error.code).toBe('INVALID_TIMEZONE');
        expect(error.message).toContain('Invalid to_timezone: Invalid/Timezone');
      } finally {
        await cleanup();
      }
    });

    it('should return error for invalid date format', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        const response = await client.request(
          {
            method: 'tools/call',
            params: {
              name: 'add_time',
              arguments: {
                time: 'not-a-date',
                amount: 1,
                unit: 'days',
              },
            },
          },
          CallToolResultSchema,
        );

        // Tool validation errors are returned in response.error
        expect(response.content).toHaveLength(0);
        expect(response.error).toBeDefined();

        const error = response.error as any;
        expect(error.code).toBe('INVALID_DATE_FORMAT');
        expect(error.message).toContain('Invalid time format');
      } finally {
        await cleanup();
      }
    });
  });
});
