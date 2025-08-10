import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
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
} from '../../../src/tools/index';
import { SlidingWindowRateLimiter } from '../../../src/utils/rateLimit';
import { createInterceptedTransport, MessageInterceptor } from './interceptor';
import { configureServer } from '../../../src/utils/serverConfig';

// Apply server configuration for tests
configureServer();

export interface TestEnvironment {
  client: Client;
  server: Server;
  cleanup: () => Promise<void>;
}

export interface TestEnvironmentWithInterceptor extends TestEnvironment {
  clientInterceptor: MessageInterceptor;
  serverInterceptor: MessageInterceptor;
}

// Tool definitions with updated descriptions
const TOOL_DEFINITIONS = [
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

// Tool function mapping
const TOOL_FUNCTIONS: Record<string, (params: any) => any> = {
  get_current_time: getCurrentTime as (params: any) => any,
  convert_timezone: convertTimezone as (params: any) => any,
  add_time: addTime as (params: any) => any,
  subtract_time: subtractTime as (params: any) => any,
  calculate_duration: calculateDuration as (params: any) => any,
  get_business_days: getBusinessDays as (params: any) => any,
  next_occurrence: nextOccurrence as (params: any) => any,
  format_time: formatTime as (params: any) => any,
  calculate_business_hours: calculateBusinessHours as (params: any) => any,
  days_until: daysUntil as (params: any) => any,
};

export async function createTestEnvironment(options?: {
  rateLimit?: number;
  rateLimitWindow?: number;
}): Promise<TestEnvironment> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  // Set environment variables if options provided
  if (options?.rateLimit !== undefined) {
    process.env.RATE_LIMIT = options.rateLimit.toString();
  }
  if (options?.rateLimitWindow !== undefined) {
    process.env.RATE_LIMIT_WINDOW = options.rateLimitWindow.toString();
  }

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

  // Create rate limiter
  const rateLimiter = new SlidingWindowRateLimiter();

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
      // Get the tool function
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
    } catch (error: any) {
      // Check if error already has MCP error code format (from our tools)
      if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'number') {
        // This is already a properly formatted MCP error from our tools
        return {
          error: {
            code: error.code,
            message: error.message,
            details: error.data, // Use 'details' as per the type definition
          },
        };
      }

      // Check if error is an object with error property (legacy format)
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

  const client = new Client({
    name: 'test-client',
    version: '1.0.0',
  });

  await server.connect(serverTransport);
  await client.connect(clientTransport);

  const cleanup = async () => {
    await client.close();
    await server.close();

    // Clean up environment variables
    if (options?.rateLimit !== undefined) {
      delete process.env.RATE_LIMIT;
    }
    if (options?.rateLimitWindow !== undefined) {
      delete process.env.RATE_LIMIT_WINDOW;
    }
  };

  return { client, server, cleanup };
}

export async function createTestEnvironmentWithInterceptor(options?: {
  rateLimit?: number;
  rateLimitWindow?: number;
}): Promise<TestEnvironmentWithInterceptor> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  // Create interceptors
  const clientInterceptor = createInterceptedTransport(clientTransport);
  const serverInterceptor = createInterceptedTransport(serverTransport);

  // Set environment variables if options provided
  if (options?.rateLimit !== undefined) {
    process.env.RATE_LIMIT = options.rateLimit.toString();
  }
  if (options?.rateLimitWindow !== undefined) {
    process.env.RATE_LIMIT_WINDOW = options.rateLimitWindow.toString();
  }

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

  // Create rate limiter
  const rateLimiter = new SlidingWindowRateLimiter();

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
      // Get the tool function
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
    } catch (error: any) {
      // Check if error already has MCP error code format (from our tools)
      if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'number') {
        // This is already a properly formatted MCP error from our tools
        return {
          error: {
            code: error.code,
            message: error.message,
            details: error.data, // Use 'details' as per the type definition
          },
        };
      }

      // Check if error is an object with error property (legacy format)
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

  const client = new Client({
    name: 'test-client',
    version: '1.0.0',
  });

  await server.connect(serverTransport);
  await client.connect(clientTransport);

  const cleanup = async () => {
    await client.close();
    await server.close();

    // Clean up environment variables
    if (options?.rateLimit !== undefined) {
      delete process.env.RATE_LIMIT;
    }
    if (options?.rateLimitWindow !== undefined) {
      delete process.env.RATE_LIMIT_WINDOW;
    }
  };

  return { client, server, cleanup, clientInterceptor, serverInterceptor };
}
