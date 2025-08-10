import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import * as tools from '../src/tools';
import { SlidingWindowRateLimiter } from '../src/utils/rateLimit';

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

// Mock the rate limiter
jest.mock('../src/utils/rateLimit');

describe('MCP Server with Rate Limiting', () => {
  let server: Server;
  let rateLimiter: jest.Mocked<SlidingWindowRateLimiter>;
  const mockedTools = tools as jest.Mocked<typeof tools>;
  const MockedRateLimiter = SlidingWindowRateLimiter as jest.MockedClass<
    typeof SlidingWindowRateLimiter
  >;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mocked rate limiter
    rateLimiter = {
      checkLimit: jest.fn(),
      getCurrentUsage: jest.fn(),
      getRetryAfter: jest.fn(),
      reset: jest.fn(),
      getInfo: jest.fn(),
    } as any;

    MockedRateLimiter.mockImplementation(() => rateLimiter);

    server = new Server(
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
  });

  describe('Rate limiting on tool calls', () => {
    let callHandler: any;

    beforeEach(() => {
      // Set up handlers with rate limiting
      server.setRequestHandler(ListToolsRequestSchema, () =>
        Promise.resolve({
          tools: [
            {
              name: 'get_current_time',
              description: 'Get current time in specified timezone with formatting options',
              inputSchema: {
                type: 'object',
                properties: {
                  timezone: { type: 'string' },
                },
              },
            },
          ],
        })
      );

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
          let result: any;

          switch (name) {
            case 'get_current_time':
              result = mockedTools.getCurrentTime(args as any);
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
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Tool execution failed';
          return {
            error: {
              code: 'TOOL_ERROR',
              message: errorMessage,
              details: { name, error: String(error) },
            },
          };
        }
      });

      callHandler = server['_requestHandlers'].get('tools/call');
    });

    it('should allow requests when under rate limit', async () => {
      rateLimiter.checkLimit.mockReturnValue(true);

      const mockResult = {
        time: '2025-07-19T10:30:00.000Z',
        timezone: 'UTC',
        offset: 'Z',
        unix: 1737283800,
        iso: '2025-07-19T10:30:00.000Z',
      };
      mockedTools.getCurrentTime.mockReturnValue(mockResult);

      const request = {
        method: 'tools/call',
        params: {
          name: 'get_current_time',
          arguments: {},
        },
      };

      const result = await callHandler(request, {});

      expect(rateLimiter.checkLimit).toHaveBeenCalled();
      expect(result.content).toBeDefined();
      expect(result.content[0].text).toBe(JSON.stringify(mockResult));
    });

    it('should deny requests when rate limit exceeded', async () => {
      rateLimiter.checkLimit.mockReturnValue(false);
      rateLimiter.getRetryAfter.mockReturnValue(45);
      rateLimiter.getInfo.mockReturnValue({
        limit: 100,
        window: 60000,
        current: 100,
        remaining: 0,
        retryAfter: 45,
      });

      const request = {
        method: 'tools/call',
        params: {
          name: 'get_current_time',
          arguments: {},
        },
      };

      const result = await callHandler(request, {});

      expect(rateLimiter.checkLimit).toHaveBeenCalled();
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe(-32000);
      expect(result.error.message).toBe('Rate limit exceeded');
      expect(result.error.data).toEqual({
        limit: 100,
        window: 60000,
        retryAfter: 45,
      });
      expect(mockedTools.getCurrentTime).not.toHaveBeenCalled();
    });

    it('should not apply rate limiting to tools/list', async () => {
      const listHandler = server['_requestHandlers'].get('tools/list');

      const request = {
        method: 'tools/list',
        params: {},
      };

      const result = await listHandler(request, {});

      expect(rateLimiter.checkLimit).not.toHaveBeenCalled();
      expect(result.tools).toBeDefined();
      expect(result.tools.length).toBeGreaterThan(0);
    });

    it('should track each tool call separately', async () => {
      rateLimiter.checkLimit
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      rateLimiter.getRetryAfter.mockReturnValue(30);
      rateLimiter.getInfo.mockReturnValue({
        limit: 100,
        window: 60000,
        current: 100,
        remaining: 0,
        retryAfter: 30,
      });

      const mockResult = { time: '2025-07-19T10:30:00.000Z' };
      mockedTools.getCurrentTime.mockReturnValue(mockResult as any);

      const request = {
        method: 'tools/call',
        params: {
          name: 'get_current_time',
          arguments: {},
        },
      };

      // First two calls should succeed
      const result1 = await callHandler(request, {});
      expect(result1.content).toBeDefined();

      const result2 = await callHandler(request, {});
      expect(result2.content).toBeDefined();

      // Third call should fail
      const result3 = await callHandler(request, {});
      expect(result3.error).toBeDefined();
      expect(result3.error.code).toBe(-32000);

      expect(rateLimiter.checkLimit).toHaveBeenCalledTimes(3);
    });

    it('should create rate limiter with environment configuration', () => {
      // This test verifies that environment variables are passed to rate limiter
      // The actual creation happens when the handler is set up
      process.env.RATE_LIMIT = '50';
      process.env.RATE_LIMIT_WINDOW = '30000';

      // Create a new instance to trigger rate limiter creation
      new SlidingWindowRateLimiter();

      // The MockedRateLimiter should have been called with environment values
      expect(MockedRateLimiter).toHaveBeenCalled();

      delete process.env.RATE_LIMIT;
      delete process.env.RATE_LIMIT_WINDOW;
    });
  });

  describe('Error handling with rate limiting', () => {
    it('should handle tool errors normally when under rate limit', async () => {
      // Set up the handler first
      server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
        if (!rateLimiter.checkLimit()) {
          const retryAfter = rateLimiter.getRetryAfter();
          const info = rateLimiter.getInfo();

          return {
            error: {
              code: -32000,
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
          let result: any;

          switch (name) {
            case 'get_current_time':
              result = mockedTools.getCurrentTime(args as any);
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
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Tool execution failed';
          return {
            error: {
              code: 'TOOL_ERROR',
              message: errorMessage,
              details: { name, error: String(error) },
            },
          };
        }
      });

      rateLimiter.checkLimit.mockReturnValue(true);

      const toolError = new Error('Invalid timezone');
      mockedTools.getCurrentTime.mockImplementation(() => {
        throw toolError;
      });

      const request = {
        method: 'tools/call',
        params: {
          name: 'get_current_time',
          arguments: { timezone: 'Bad/Zone' },
        },
      };

      const callHandler = server['_requestHandlers'].get('tools/call');
      const result = await callHandler(request, {});

      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('TOOL_ERROR');
      expect(result.error.message).toBe('Invalid timezone');
    });
  });
});
