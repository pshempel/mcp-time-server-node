import { createTestEnvironment } from './helpers/setup';
import { callTool } from './helpers/tools';
import { getMaxListenersConfig } from '../../src/utils/serverConfig';

describe('MaxListenersExceededWarning prevention', () => {
  it('should have proper maxListeners configuration', () => {
    const config = getMaxListenersConfig();
    expect(config.defaultMaxListeners).toBeGreaterThanOrEqual(20);
    expect(config.processMaxListeners).toBeGreaterThanOrEqual(20);
  });

  it('should handle many concurrent requests without MaxListenersExceededWarning', async () => {
    const { client, cleanup } = await createTestEnvironment();

    // Store original warning listener
    const originalWarning = process.listeners('warning');
    const warnings: Error[] = [];

    // Add custom warning listener to catch MaxListenersExceededWarning
    process.removeAllListeners('warning');
    process.on('warning', (warning) => {
      warnings.push(warning);
    });

    try {
      // Make 15 concurrent requests (more than default 10 limit)
      const promises = Array.from({ length: 15 }, (_, i) =>
        callTool(client, 'get_current_time', {
          timezone: i % 2 === 0 ? 'UTC' : 'America/New_York',
        }),
      );

      await Promise.all(promises);

      // Check no MaxListenersExceededWarning was emitted
      const maxListenerWarnings = warnings.filter((w) => w.name === 'MaxListenersExceededWarning');

      expect(maxListenerWarnings).toHaveLength(0);
    } finally {
      // Restore original warning listeners
      process.removeAllListeners('warning');
      originalWarning.forEach((listener) => process.on('warning', listener));

      await cleanup();
    }
  });

  it('should handle rapid sequential requests without warnings', async () => {
    const { client, cleanup } = await createTestEnvironment();

    const warnings: Error[] = [];
    process.removeAllListeners('warning');
    process.on('warning', (warning) => {
      warnings.push(warning);
    });

    try {
      // Make 15 rapid sequential requests
      for (let i = 0; i < 15; i++) {
        await callTool(client, 'format_time', {
          time: '2025-01-01T12:00:00Z',
          format: 'relative',
        });
      }

      const maxListenerWarnings = warnings.filter((w) => w.name === 'MaxListenersExceededWarning');

      expect(maxListenerWarnings).toHaveLength(0);
    } finally {
      process.removeAllListeners('warning');
      await cleanup();
    }
  });
});
