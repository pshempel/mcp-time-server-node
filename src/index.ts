#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import {
  getCurrentTime,
  convertTimezone,
  addTime,
  subtractTime,
  calculateDuration,
  getBusinessDays,
  nextOccurrence,
  formatTime,
  calculateBusinessHours,
  daysUntil,
} from './tools/index.js';
import { SlidingWindowRateLimiter } from './utils/rateLimit.js';
import { configureServer } from './utils/serverConfig.js';

// Configure server settings to prevent warnings
configureServer();

// Tool definitions with metadata
export const TOOL_DEFINITIONS = [
  {
    name: 'get_current_time',
    description: 'Get current time in specified timezone with formatting options',
    inputSchema: {
      type: 'object' as const,
      properties: {
        timezone: {
          type: 'string' as const,
          description: 'IANA timezone (default: system timezone)',
        },
        format: { type: 'string' as const, description: 'date-fns format string' },
        include_offset: {
          type: 'boolean' as const,
          description: 'Include UTC offset (default: true)',
        },
      },
    },
  },
  {
    name: 'convert_timezone',
    description: 'Convert time between timezones',
    inputSchema: {
      type: 'object' as const,
      properties: {
        time: { type: 'string' as const, description: 'Input time' },
        from_timezone: { type: 'string' as const, description: 'Source IANA timezone' },
        to_timezone: { type: 'string' as const, description: 'Target IANA timezone' },
        format: { type: 'string' as const, description: 'Output format' },
      },
      required: ['time', 'from_timezone', 'to_timezone'],
    },
  },
  {
    name: 'add_time',
    description: 'Add duration to a date/time',
    inputSchema: {
      type: 'object' as const,
      properties: {
        time: { type: 'string' as const, description: 'Base time' },
        amount: { type: 'number' as const, description: 'Amount to add' },
        unit: {
          type: 'string' as const,
          enum: ['years', 'months', 'days', 'hours', 'minutes', 'seconds'],
          description: 'Unit of time',
        },
        timezone: {
          type: 'string' as const,
          description: 'Timezone for calculation (default: system timezone)',
        },
      },
      required: ['time', 'amount', 'unit'],
    },
  },
  {
    name: 'subtract_time',
    description: 'Subtract duration from a date/time',
    inputSchema: {
      type: 'object' as const,
      properties: {
        time: { type: 'string' as const, description: 'Base time' },
        amount: { type: 'number' as const, description: 'Amount to subtract' },
        unit: {
          type: 'string' as const,
          enum: ['years', 'months', 'days', 'hours', 'minutes', 'seconds'],
          description: 'Unit of time',
        },
        timezone: {
          type: 'string' as const,
          description: 'Timezone for calculation (default: system timezone)',
        },
      },
      required: ['time', 'amount', 'unit'],
    },
  },
  {
    name: 'calculate_duration',
    description: 'Calculate duration between two times',
    inputSchema: {
      type: 'object' as const,
      properties: {
        start_time: { type: 'string' as const, description: 'Start time' },
        end_time: { type: 'string' as const, description: 'End time' },
        unit: { type: 'string' as const, description: 'Output unit (default: "auto")' },
        timezone: {
          type: 'string' as const,
          description: 'Timezone for parsing (default: system timezone)',
        },
      },
      required: ['start_time', 'end_time'],
    },
  },
  {
    name: 'get_business_days',
    description: 'Calculate business days between dates',
    inputSchema: {
      type: 'object' as const,
      properties: {
        start_date: { type: 'string' as const, description: 'Start date' },
        end_date: { type: 'string' as const, description: 'End date' },
        exclude_weekends: {
          type: 'boolean' as const,
          description: 'Exclude weekends (default: true)',
        },
        holidays: {
          type: 'array' as const,
          items: { type: 'string' as const },
          description: 'Array of holiday dates',
        },
        timezone: {
          type: 'string' as const,
          description: 'Timezone for calculation (default: system timezone)',
        },
      },
      required: ['start_date', 'end_date'],
    },
  },
  {
    name: 'next_occurrence',
    description: 'Find next occurrence of a recurring event',
    inputSchema: {
      type: 'object' as const,
      properties: {
        pattern: {
          type: 'string' as const,
          enum: ['daily', 'weekly', 'monthly', 'yearly'],
          description: 'Recurrence pattern',
        },
        start_from: { type: 'string' as const, description: 'Start searching from' },
        day_of_week: { type: 'number' as const, description: 'For weekly (0-6, 0=Sunday)' },
        day_of_month: { type: 'number' as const, description: 'For monthly (1-31)' },
        time: { type: 'string' as const, description: 'Time in HH:mm format' },
        timezone: {
          type: 'string' as const,
          description: 'Timezone for calculation (default: system timezone)',
        },
      },
      required: ['pattern'],
    },
  },
  {
    name: 'format_time',
    description: 'Format time in various human-readable formats',
    inputSchema: {
      type: 'object' as const,
      properties: {
        time: { type: 'string' as const, description: 'Time to format' },
        format: {
          type: 'string' as const,
          enum: ['relative', 'calendar', 'custom'],
          description: 'Format type',
        },
        custom_format: { type: 'string' as const, description: 'For custom format' },
        timezone: {
          type: 'string' as const,
          description: 'Timezone for display (default: system timezone)',
        },
      },
      required: ['time', 'format'],
    },
  },
  {
    name: 'calculate_business_hours',
    description: 'Calculate business hours between two times',
    inputSchema: {
      type: 'object' as const,
      properties: {
        start_time: { type: 'string' as const, description: 'Start time' },
        end_time: { type: 'string' as const, description: 'End time' },
        business_hours: {
          type: 'object' as const,
          description: 'Business hours definition (default: 9 AM - 5 PM)',
        },
        timezone: {
          type: 'string' as const,
          description: 'Timezone for calculation (default: system timezone)',
        },
        holidays: {
          type: 'array' as const,
          items: { type: 'string' as const },
          description: 'Array of holiday dates',
        },
        include_weekends: {
          type: 'boolean' as const,
          description: 'Include weekends in calculation (default: false)',
        },
      },
      required: ['start_time', 'end_time'],
    },
  },
  {
    name: 'days_until',
    description: 'Calculate days until a target date/event',
    inputSchema: {
      type: 'object' as const,
      properties: {
        target_date: {
          type: ['string', 'number'] as const,
          description: 'Target date (ISO string, natural language, or Unix timestamp)',
        },
        timezone: {
          type: 'string' as const,
          description: 'Timezone for calculation (default: system timezone)',
        },
        format_result: {
          type: 'boolean' as const,
          description:
            'Return formatted string (e.g., "in 5 days") instead of number (default: false)',
        },
      },
      required: ['target_date'],
    },
  },
];

// Tool function mapping - wrapping each function to handle unknown params
const TOOL_FUNCTIONS: Record<string, (params: unknown) => unknown> = {
  get_current_time: (params: unknown) =>
    getCurrentTime(params as Parameters<typeof getCurrentTime>[0]),
  convert_timezone: (params: unknown) =>
    convertTimezone(params as Parameters<typeof convertTimezone>[0]),
  add_time: (params: unknown) => addTime(params as Parameters<typeof addTime>[0]),
  subtract_time: (params: unknown) => subtractTime(params as Parameters<typeof subtractTime>[0]),
  calculate_duration: (params: unknown) =>
    calculateDuration(params as Parameters<typeof calculateDuration>[0]),
  get_business_days: (params: unknown) =>
    getBusinessDays(params as Parameters<typeof getBusinessDays>[0]),
  next_occurrence: (params: unknown) =>
    nextOccurrence(params as Parameters<typeof nextOccurrence>[0]),
  format_time: (params: unknown) => formatTime(params as Parameters<typeof formatTime>[0]),
  calculate_business_hours: (params: unknown) =>
    calculateBusinessHours(params as Parameters<typeof calculateBusinessHours>[0]),
  days_until: (params: unknown) => daysUntil(params as Parameters<typeof daysUntil>[0]),
};

async function main(): Promise<void> {
  // Create rate limiter
  const rateLimiter = new SlidingWindowRateLimiter();

  // Create server
  const server = new Server(
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

  // Register tools/list handler
  server.setRequestHandler(ListToolsRequestSchema, () =>
    Promise.resolve({
      tools: TOOL_DEFINITIONS,
    }),
  );

  // Register tools/call handler
  server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
    // Check rate limit
    if (!rateLimiter.checkLimit()) {
      const retryAfter = rateLimiter.getRetryAfter();
      const info = rateLimiter.getInfo();

      return {
        error: {
          code: -32000, // JSON-RPC server-defined error
          message: 'Rate limit exceeded',
          data: {
            limit: info.limit,
            window: info.window,
            retryAfter: retryAfter,
          },
        },
      };
    }

    const { name, arguments: args } = request.params;

    try {
      // Get the tool function - validate against known tools
      if (!Object.prototype.hasOwnProperty.call(TOOL_FUNCTIONS, name)) {
        throw new Error(`Unknown tool: ${name}`);
      }
      // eslint-disable-next-line security/detect-object-injection -- Tool name validated above
      const toolFunction = TOOL_FUNCTIONS[name];
      if (!toolFunction) {
        throw new Error(`Unknown tool: ${name}`);
      }

      // Execute the tool
      const result = await toolFunction(args);

      // Return the result
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result),
          },
        ],
      };
    } catch (error) {
      // Check if error is an object with error property
      if (error && typeof error === 'object' && 'error' in error) {
        return error as { error: { code: string; message: string; details?: unknown } };
      }

      // Otherwise, wrap it in the expected format
      const errorMessage = error instanceof Error ? error.message : 'Tool execution failed';
      const errorString = error instanceof Error ? error.toString() : String(error);

      return {
        error: {
          code: 'TOOL_ERROR',
          message: errorMessage,
          details: { name, error: errorString },
        },
      };
    }
  });

  // Create and connect transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('MCP Time Server Node running on stdio');
}

// Run the server
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
