import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';

/**
 * Helper function to call a tool through the MCP protocol
 * @param client - The MCP client instance
 * @param name - The name of the tool to call
 * @param args - The arguments to pass to the tool
 * @returns The parsed result from the tool
 */
export async function callTool(client: Client, name: string, args: any = {}): Promise<any> {
  const response = await client.request(
    {
      method: 'tools/call',
      params: {
        name,
        arguments: args,
      },
    },
    CallToolResultSchema,
  );

  // Check if the response contains an error
  if ('error' in response && response.error) {
    const errorResponse = response as any; // Type assertion for error response
    const error = new Error(errorResponse.error.message);
    Object.assign(error, errorResponse.error);
    throw error;
  }

  if (!response.content || response.content.length === 0) {
    throw new Error('No content in tool response');
  }

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error(`Unexpected content type: ${content.type}`);
  }

  return JSON.parse(content.text);
}
