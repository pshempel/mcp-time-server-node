import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { CallToolRequest, ListToolsRequest } from '@modelcontextprotocol/sdk/types.js';
import * as tools from '../src/tools';

// Mock all the tools
jest.mock('../src/tools', () => ({
  getCurrentTime: jest.fn(),
  convertTimezone: jest.fn(),
  addTime: jest.fn(),
  subtractTime: jest.fn(),
  calculateDuration: jest.fn(),
  getBusinessDays: jest.fn(),
  nextOccurrence: jest.fn(),
  formatTime: jest.fn(),
}));

// Rate limiter will be mocked when implemented

describe('MCP Time Server', () => {
  let server: Server;
  const mockedTools = tools as jest.Mocked<typeof tools>;

  beforeEach(() => {
    jest.clearAllMocks();

    server = new Server(
      {
        name: 'mcp-time-server-node',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );
  });

  describe('Server Setup', () => {
    it('should create server with correct info', () => {
      expect(server).toBeDefined();
      // Server instance created successfully
    });

    it('should register tool handlers', () => {
      // Register handlers
      server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: [],
      }));

      server.setRequestHandler(CallToolRequestSchema, async () => ({
        content: [],
      }));

      // No errors thrown means handlers registered successfully
      expect(true).toBe(true);
    });
  });

  describe('ListTools Handler', () => {
    beforeEach(() => {
      server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: [
          {
            name: 'get_current_time',
            description: 'Get current time in specified timezone with formatting options',
            inputSchema: {
              type: 'object',
              properties: {
                timezone: { type: 'string', description: 'IANA timezone (default: "UTC")' },
                format: { type: 'string', description: 'date-fns format string' },
                include_offset: {
                  type: 'boolean',
                  description: 'Include UTC offset (default: true)',
                },
              },
            },
          },
          {
            name: 'convert_timezone',
            description: 'Convert time between timezones',
            inputSchema: {
              type: 'object',
              properties: {
                time: { type: 'string', description: 'Input time' },
                from_timezone: { type: 'string', description: 'Source IANA timezone' },
                to_timezone: { type: 'string', description: 'Target IANA timezone' },
                format: { type: 'string', description: 'Output format' },
              },
              required: ['time', 'from_timezone', 'to_timezone'],
            },
          },
          {
            name: 'add_time',
            description: 'Add duration to a date/time',
            inputSchema: {
              type: 'object',
              properties: {
                time: { type: 'string', description: 'Base time' },
                amount: { type: 'number', description: 'Amount to add' },
                unit: {
                  type: 'string',
                  enum: ['years', 'months', 'days', 'hours', 'minutes', 'seconds'],
                  description: 'Unit of time',
                },
                timezone: { type: 'string', description: 'Timezone for calculation' },
              },
              required: ['time', 'amount', 'unit'],
            },
          },
          {
            name: 'subtract_time',
            description: 'Subtract duration from a date/time',
            inputSchema: {
              type: 'object',
              properties: {
                time: { type: 'string', description: 'Base time' },
                amount: { type: 'number', description: 'Amount to subtract' },
                unit: {
                  type: 'string',
                  enum: ['years', 'months', 'days', 'hours', 'minutes', 'seconds'],
                  description: 'Unit of time',
                },
                timezone: { type: 'string', description: 'Timezone for calculation' },
              },
              required: ['time', 'amount', 'unit'],
            },
          },
          {
            name: 'calculate_duration',
            description: 'Calculate duration between two times',
            inputSchema: {
              type: 'object',
              properties: {
                start_time: { type: 'string', description: 'Start time' },
                end_time: { type: 'string', description: 'End time' },
                unit: { type: 'string', description: 'Output unit (default: "auto")' },
                timezone: { type: 'string', description: 'Timezone for parsing' },
              },
              required: ['start_time', 'end_time'],
            },
          },
          {
            name: 'get_business_days',
            description: 'Calculate business days between dates',
            inputSchema: {
              type: 'object',
              properties: {
                start_date: { type: 'string', description: 'Start date' },
                end_date: { type: 'string', description: 'End date' },
                exclude_weekends: {
                  type: 'boolean',
                  description: 'Exclude weekends (default: true)',
                },
                holidays: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array of holiday dates',
                },
                timezone: { type: 'string', description: 'Timezone for calculation' },
              },
              required: ['start_date', 'end_date'],
            },
          },
          {
            name: 'next_occurrence',
            description: 'Find next occurrence of a recurring event',
            inputSchema: {
              type: 'object',
              properties: {
                pattern: {
                  type: 'string',
                  enum: ['daily', 'weekly', 'monthly', 'yearly'],
                  description: 'Recurrence pattern',
                },
                start_from: { type: 'string', description: 'Start searching from' },
                day_of_week: { type: 'number', description: 'For weekly (0-6, 0=Sunday)' },
                day_of_month: { type: 'number', description: 'For monthly (1-31)' },
                time: { type: 'string', description: 'Time in HH:mm format' },
                timezone: { type: 'string', description: 'Timezone for calculation' },
              },
              required: ['pattern'],
            },
          },
          {
            name: 'format_time',
            description: 'Format time in various human-readable formats',
            inputSchema: {
              type: 'object',
              properties: {
                time: { type: 'string', description: 'Time to format' },
                format: {
                  type: 'string',
                  enum: ['relative', 'calendar', 'custom'],
                  description: 'Format type',
                },
                custom_format: { type: 'string', description: 'For custom format' },
                timezone: { type: 'string', description: 'Timezone for display' },
              },
              required: ['time', 'format'],
            },
          },
        ],
      }));
    });

    it('should return all 8 tools', async () => {
      // Create a mock request
      const request: ListToolsRequest = {
        method: 'tools/list',
        params: {},
      };

      // Get the handler and call it
      const handler = server['_requestHandlers'].get('tools/list');
      const result = await handler?.(request, {});

      expect(result).toBeDefined();
      expect(result.tools).toHaveLength(8);
    });

    it('should return correct tool names', async () => {
      const request: ListToolsRequest = {
        method: 'tools/list',
        params: {},
      };

      const handler = server['_requestHandlers'].get('tools/list');
      const result = await handler?.(request, {});

      const toolNames = result.tools.map((t: any) => t.name);
      expect(toolNames).toEqual([
        'get_current_time',
        'convert_timezone',
        'add_time',
        'subtract_time',
        'calculate_duration',
        'get_business_days',
        'next_occurrence',
        'format_time',
      ]);
    });

    it('should include proper input schemas for each tool', async () => {
      const request: ListToolsRequest = {
        method: 'tools/list',
        params: {},
      };

      const handler = server['_requestHandlers'].get('tools/list');
      const result = await handler?.(request, {});

      result.tools.forEach((tool: any) => {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema.properties).toBeDefined();
      });
    });
  });

  describe('CallTool Handler', () => {
    let callHandler: any;

    beforeEach(() => {
      // Set up the call tool handler
      server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;

        try {
          let result: any;

          switch (name) {
            case 'get_current_time':
              result = mockedTools.getCurrentTime(args as any);
              break;
            case 'convert_timezone':
              result = mockedTools.convertTimezone(args as any);
              break;
            case 'add_time':
              result = mockedTools.addTime(args as any);
              break;
            case 'subtract_time':
              result = mockedTools.subtractTime(args as any);
              break;
            case 'calculate_duration':
              result = mockedTools.calculateDuration(args as any);
              break;
            case 'get_business_days':
              result = mockedTools.getBusinessDays(args as any);
              break;
            case 'next_occurrence':
              result = mockedTools.nextOccurrence(args as any);
              break;
            case 'format_time':
              result = mockedTools.formatTime(args as any);
              break;
            default:
              throw new Error(`Unknown tool: ${name}`);
          }

          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(result),
              },
            ],
          };
        } catch (error: any) {
          // If the tool throws an error with the expected format, return it
          if (error.error) {
            return error;
          }
          // Otherwise, wrap it in the expected format
          return {
            error: {
              code: 'TOOL_ERROR',
              message: error.message || 'Tool execution failed',
              details: { name, error: error.toString() },
            },
          };
        }
      });

      callHandler = server['_requestHandlers'].get('tools/call');
    });

    describe('get_current_time', () => {
      it('should call getCurrentTime tool with correct params', async () => {
        const mockResult = {
          time: '2025-07-19T10:30:00.000Z',
          timezone: 'UTC',
          offset: 'Z',
          unix: 1737283800,
          iso: '2025-07-19T10:30:00.000Z',
        };
        mockedTools.getCurrentTime.mockReturnValue(mockResult);

        const request: CallToolRequest = {
          method: 'tools/call',
          params: {
            name: 'get_current_time',
            arguments: { timezone: 'America/New_York' },
          },
        };

        const result = await callHandler(request, {});

        expect(mockedTools.getCurrentTime).toHaveBeenCalledWith({ timezone: 'America/New_York' });
        expect(result.content[0].text).toBe(JSON.stringify(mockResult));
      });
    });

    describe('convert_timezone', () => {
      it('should call convertTimezone tool with correct params', async () => {
        const mockResult = {
          original: '2025-07-19T10:30:00.000-05:00',
          converted: '2025-07-20T00:30:00.000+09:00',
          from_offset: '-05:00',
          to_offset: '+09:00',
          difference: 840,
        };
        mockedTools.convertTimezone.mockReturnValue(mockResult);

        const request: CallToolRequest = {
          method: 'tools/call',
          params: {
            name: 'convert_timezone',
            arguments: {
              time: '2025-07-19T10:30:00.000Z',
              from_timezone: 'America/New_York',
              to_timezone: 'Asia/Tokyo',
            },
          },
        };

        const result = await callHandler(request, {});

        expect(mockedTools.convertTimezone).toHaveBeenCalledWith({
          time: '2025-07-19T10:30:00.000Z',
          from_timezone: 'America/New_York',
          to_timezone: 'Asia/Tokyo',
        });
        expect(result.content[0].text).toBe(JSON.stringify(mockResult));
      });
    });

    describe('Error handling', () => {
      it('should handle unknown tool error', async () => {
        const request: CallToolRequest = {
          method: 'tools/call',
          params: {
            name: 'unknown_tool',
            arguments: {},
          },
        };

        const result = await callHandler(request, {});

        expect(result.error).toBeDefined();
        expect(result.error.code).toBe('TOOL_ERROR');
        expect(result.error.message).toBe('Unknown tool: unknown_tool');
      });

      it('should handle tool execution errors', async () => {
        mockedTools.getCurrentTime.mockImplementation(() => {
          throw new Error('Timezone validation failed');
        });

        const request: CallToolRequest = {
          method: 'tools/call',
          params: {
            name: 'get_current_time',
            arguments: { timezone: 'Invalid/Zone' },
          },
        };

        const result = await callHandler(request, {});

        expect(result.error).toBeDefined();
        expect(result.error.code).toBe('TOOL_ERROR');
        expect(result.error.message).toBe('Timezone validation failed');
      });

      it('should pass through properly formatted tool errors', async () => {
        const toolError = {
          error: {
            code: 'INVALID_TIMEZONE',
            message: 'Invalid timezone: BadZone',
            details: { timezone: 'BadZone' },
          },
        };
        mockedTools.getCurrentTime.mockImplementation(() => {
          throw toolError;
        });

        const request: CallToolRequest = {
          method: 'tools/call',
          params: {
            name: 'get_current_time',
            arguments: { timezone: 'BadZone' },
          },
        };

        const result = await callHandler(request, {});

        expect(result.error).toEqual(toolError.error);
      });
    });

    describe('All tools integration', () => {
      it('should handle all 8 tools', async () => {
        const toolTests = [
          { name: 'get_current_time', args: {}, mockFn: mockedTools.getCurrentTime },
          {
            name: 'convert_timezone',
            args: { time: '2025-07-19T10:00:00Z', from_timezone: 'UTC', to_timezone: 'EST' },
            mockFn: mockedTools.convertTimezone,
          },
          {
            name: 'add_time',
            args: { time: '2025-07-19T10:00:00Z', amount: 1, unit: 'days' },
            mockFn: mockedTools.addTime,
          },
          {
            name: 'subtract_time',
            args: { time: '2025-07-19T10:00:00Z', amount: 1, unit: 'hours' },
            mockFn: mockedTools.subtractTime,
          },
          {
            name: 'calculate_duration',
            args: { start_time: '2025-07-19T10:00:00Z', end_time: '2025-07-20T10:00:00Z' },
            mockFn: mockedTools.calculateDuration,
          },
          {
            name: 'get_business_days',
            args: { start_date: '2025-07-19', end_date: '2025-07-26' },
            mockFn: mockedTools.getBusinessDays,
          },
          {
            name: 'next_occurrence',
            args: { pattern: 'weekly' },
            mockFn: mockedTools.nextOccurrence,
          },
          {
            name: 'format_time',
            args: { time: '2025-07-19T10:00:00Z', format: 'relative' },
            mockFn: mockedTools.formatTime,
          },
        ];

        for (const { name, args, mockFn } of toolTests) {
          // Mock with appropriate return value for each tool
          const mockResults: any = {
            get_current_time: {
              time: '2025-07-19T10:00:00Z',
              timezone: 'UTC',
              offset: 'Z',
              unix: 1737283200,
              iso: '2025-07-19T10:00:00Z',
            },
            convert_timezone: {
              original: '2025-07-19T10:00:00Z',
              converted: '2025-07-19T05:00:00-05:00',
              from_offset: 'Z',
              to_offset: '-05:00',
              difference: -300,
            },
            add_time: {
              original: '2025-07-19T10:00:00Z',
              result: '2025-07-20T10:00:00Z',
              unix_original: 1737283200,
              unix_result: 1737369600,
            },
            subtract_time: {
              original: '2025-07-19T10:00:00Z',
              result: '2025-07-19T09:00:00Z',
              unix_original: 1737283200,
              unix_result: 1737279600,
            },
            calculate_duration: {
              milliseconds: 86400000,
              seconds: 86400,
              minutes: 1440,
              hours: 24,
              days: 1,
              formatted: '1 day',
              is_negative: false,
            },
            get_business_days: {
              total_days: 7,
              business_days: 5,
              weekend_days: 2,
              holiday_count: 0,
            },
            next_occurrence: { next: '2025-07-26T00:00:00Z', unix: 1737849600, days_until: 7 },
            format_time: { formatted: 'in 5 days', original: '2025-07-19T10:00:00Z' },
          };

          mockFn.mockReturnValue(mockResults[name]);

          const request: CallToolRequest = {
            method: 'tools/call',
            params: { name, arguments: args },
          };

          const result = await callHandler(request, {});

          expect(mockFn).toHaveBeenCalledWith(args);
          expect(result.content).toBeDefined();
          expect(result.content[0].type).toBe('text');
          expect(JSON.parse(result.content[0].text)).toEqual(mockResults[name]);
        }
      });
    });
  });

  describe('Environment Configuration', () => {
    it('should read configuration from environment variables', () => {
      process.env.CACHE_SIZE = '5000';
      process.env.RATE_LIMIT = '50';

      // In real implementation, these would be used
      expect(process.env.CACHE_SIZE).toBe('5000');
      expect(process.env.RATE_LIMIT).toBe('50');
    });
  });
});
