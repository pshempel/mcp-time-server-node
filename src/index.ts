#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';

import { mapToMcpError, McpError } from './adapters/mcp-sdk';
import {
  getCurrentTime,
  convertTimezone,
  addTime,
  subtractTime,
  calculateDuration,
  getBusinessDays,
  getServerInfo,
  nextOccurrence,
  formatTime,
  calculateBusinessHours,
  daysUntil,
} from './tools';
import { debug, logEnvironment } from './utils/debug';
import { SlidingWindowRateLimiter } from './utils/rateLimit';
import { configureServer } from './utils/serverConfig';

// Configure server settings to prevent warnings
configureServer();

// Log environment at startup
logEnvironment();

// Tool definitions with metadata (keeping same as before)
export const TOOL_DEFINITIONS = [
  {
    name: 'get_server_info',
    description: 'Get server version and build information',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
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
  get_server_info: (params: unknown) => getServerInfo(params),
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

// Create the MCP server instance
export function createServer(): Server {
  debug.server('Creating MCP server instance');
  return new Server(
    {
      name: 'mcp-time-server-node',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );
}

// Check rate limit and return appropriate response
export function handleRateLimit(
  rateLimiter: SlidingWindowRateLimiter
):
  | { limited: false }
  | { limited: true; error: { code: number; message: string; data?: unknown } } {
  if (!rateLimiter.checkLimit()) {
    debug.rateLimit('Rate limit exceeded');
    const retryAfter = rateLimiter.getRetryAfter();
    const info = rateLimiter.getInfo();

    return {
      limited: true,
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

  debug.rateLimit('Rate limit check passed');
  return { limited: false };
}

// Execute a tool function and format the result
// eslint-disable-next-line max-lines-per-function
/**
 * Helper function to format tool execution errors
 * Now uses our adapter to properly map errors to MCP format
 */
function formatToolError(
  error: unknown,
  toolName: string
): { error: { code: number; message: string; data?: unknown } } {
  debug.trace('Tool %s execution failed: %O', toolName, error);

  // If it's already an McpError, return it in the expected format
  if (error instanceof McpError) {
    return {
      error: {
        code: error.code,
        message: error.message,
        data: error.data,
      },
    };
  }

  // Map any other error to McpError using our adapter
  const mcpError = mapToMcpError(error, toolName);

  return {
    error: {
      code: mcpError.code,
      message: mcpError.message,
      data: mcpError.data,
    },
  };
}

export async function executeToolFunction(
  name: string,
  args: unknown
): Promise<
  | { content: Array<{ type: string; text: string }> }
  | { error: { code: number; message: string; data?: unknown } }
> {
  debug.trace('Executing tool: %s with args: %O', name, args);

  try {
    // Get the tool function - validate against known tools
    if (!Object.prototype.hasOwnProperty.call(TOOL_FUNCTIONS, name)) {
      debug.error('Unknown tool: %s', name);
      throw new Error(`Unknown tool: ${name}`);
    }
    // eslint-disable-next-line security/detect-object-injection -- Tool name validated above
    const toolFunction = TOOL_FUNCTIONS[name];
    if (!toolFunction) {
      debug.error('Tool function is null for: %s', name);
      throw new Error(`Unknown tool: ${name}`);
    }

    // Execute the tool
    const result = await toolFunction(args);
    debug.trace('Tool %s executed successfully', name);

    // Return the result
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result),
        },
      ],
    };
  } catch (error: unknown) {
    return formatToolError(error, name);
  }
}

// Handle a tool call request
export async function handleToolCall(
  request: CallToolRequest,
  rateLimiter: SlidingWindowRateLimiter
): Promise<
  | { content: Array<{ type: string; text: string }> }
  | { error: { code: number; message: string; data?: unknown } }
> {
  debug.server('Handling tool call: %s', request.params.name);

  // Check rate limit
  const rateLimitResult = handleRateLimit(rateLimiter);
  if (rateLimitResult.limited) {
    return { error: rateLimitResult.error };
  }

  const { name, arguments: args } = request.params;
  return executeToolFunction(name, args);
}

// Register all request handlers
export function registerHandlers(server: Server, rateLimiter: SlidingWindowRateLimiter): void {
  debug.server('Registering request handlers');

  // Register tools/list handler
  server.setRequestHandler(ListToolsRequestSchema, () => {
    debug.server('Handling tools/list request');
    return Promise.resolve({
      tools: TOOL_DEFINITIONS,
    });
  });

  // Register tools/call handler
  server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
    return handleToolCall(request, rateLimiter);
  });
}

// Main function - now simple orchestration
async function main(): Promise<void> {
  debug.server('Starting MCP Time Server...');

  const rateLimiter = new SlidingWindowRateLimiter();
  const server = createServer();

  registerHandlers(server, rateLimiter);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  debug.server('MCP Time Server connected to stdio transport');
  console.error('MCP Time Server Node running on stdio');
}

// Run the server
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
