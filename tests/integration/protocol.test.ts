import { ListToolsResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { createTestEnvironment, createTestEnvironmentWithInterceptor } from './helpers/setup';

describe('MCP Protocol Communication', () => {
  describe('Tools List', () => {
    it('should list tools through protocol', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        const response = await client.request(
          {
            method: 'tools/list',
            params: {},
          },
          ListToolsResultSchema,
        );

        expect(response.tools).toBeDefined();
        expect(response.tools.length).toBe(8);
      } finally {
        await cleanup();
      }
    });
  });

  describe('JSON-RPC Message Structure', () => {
    it('should send valid JSON-RPC 2.0 messages', async () => {
      const { client, clientInterceptor, cleanup } = await createTestEnvironmentWithInterceptor();

      try {
        await client.request({ method: 'tools/list', params: {} }, ListToolsResultSchema);

        const sentMessages = clientInterceptor.getSentMessages();

        // Find the tools/list message (ignoring initialization messages)
        const toolsListMessage = sentMessages.find((msg) => msg.method === 'tools/list');
        expect(toolsListMessage).toBeDefined();

        expect(toolsListMessage.jsonrpc).toBe('2.0');
        expect(toolsListMessage.method).toBe('tools/list');
        expect(toolsListMessage.id).toBeDefined();
        expect(typeof toolsListMessage.id).toBe('number');
      } finally {
        await cleanup();
      }
    });
  });
});
