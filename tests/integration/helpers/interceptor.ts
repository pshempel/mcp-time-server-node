import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

export interface MessageInterceptor {
  getSentMessages(): any[];
  getReceivedMessages(): any[];
  clear(): void;
}

export function createInterceptedTransport(transport: InMemoryTransport): MessageInterceptor {
  const sentMessages: any[] = [];
  const receivedMessages: any[] = [];

  // Intercept send method
  const originalSend = transport.send.bind(transport);
  transport.send = async (message: any) => {
    sentMessages.push(message);
    return originalSend(message);
  };

  // Intercept onmessage to capture received messages
  const originalOnMessage = transport.onmessage;
  transport.onmessage = (message: any) => {
    receivedMessages.push(message);
    if (originalOnMessage) {
      originalOnMessage(message);
    }
  };

  return {
    getSentMessages: () => [...sentMessages],
    getReceivedMessages: () => [...receivedMessages],
    clear: () => {
      sentMessages.length = 0;
      receivedMessages.length = 0;
    },
  };
}
