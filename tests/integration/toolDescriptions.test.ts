import { ListToolsResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { createTestEnvironment } from './helpers/setup';

describe('Tool Descriptions Integration', () => {
  it('should return tool descriptions with system timezone as default', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      // Call the actual server's tools/list endpoint
      const response = await client.request(
        {
          method: 'tools/list',
          params: {},
        },
        ListToolsResultSchema,
      );

      const tools = response.tools;

      // Check get_current_time description
      const getCurrentTimeTool = tools.find((t) => t.name === 'get_current_time');
      expect(getCurrentTimeTool).toBeDefined();
      const getCurrentTimeSchema = getCurrentTimeTool?.inputSchema as any;
      expect(getCurrentTimeSchema?.properties?.timezone?.description).toBe(
        'IANA timezone (default: system timezone)',
      );

      // Check add_time description
      const addTimeTool = tools.find((t) => t.name === 'add_time');
      expect(addTimeTool).toBeDefined();
      const addTimeSchema = addTimeTool?.inputSchema as any;
      expect(addTimeSchema?.properties?.timezone?.description).toBe(
        'Timezone for calculation (default: system timezone)',
      );

      // Check subtract_time description
      const subtractTimeTool = tools.find((t) => t.name === 'subtract_time');
      expect(subtractTimeTool).toBeDefined();
      const subtractTimeSchema = subtractTimeTool?.inputSchema as any;
      expect(subtractTimeSchema?.properties?.timezone?.description).toBe(
        'Timezone for calculation (default: system timezone)',
      );

      // Check calculate_duration description
      const calculateDurationTool = tools.find((t) => t.name === 'calculate_duration');
      expect(calculateDurationTool).toBeDefined();
      const calculateDurationSchema = calculateDurationTool?.inputSchema as any;
      expect(calculateDurationSchema?.properties?.timezone?.description).toBe(
        'Timezone for parsing (default: system timezone)',
      );

      // Check get_business_days description
      const getBusinessDaysTool = tools.find((t) => t.name === 'get_business_days');
      expect(getBusinessDaysTool).toBeDefined();
      const getBusinessDaysSchema = getBusinessDaysTool?.inputSchema as any;
      expect(getBusinessDaysSchema?.properties?.timezone?.description).toBe(
        'Timezone for calculation (default: system timezone)',
      );

      // Check next_occurrence description
      const nextOccurrenceTool = tools.find((t) => t.name === 'next_occurrence');
      expect(nextOccurrenceTool).toBeDefined();
      const nextOccurrenceSchema = nextOccurrenceTool?.inputSchema as any;
      expect(nextOccurrenceSchema?.properties?.timezone?.description).toBe(
        'Timezone for calculation (default: system timezone)',
      );

      // Check format_time description
      const formatTimeTool = tools.find((t) => t.name === 'format_time');
      expect(formatTimeTool).toBeDefined();
      const formatTimeSchema = formatTimeTool?.inputSchema as any;
      expect(formatTimeSchema?.properties?.timezone?.description).toBe(
        'Timezone for display (default: system timezone)',
      );

      // Verify convert_timezone doesn't have a default (it has from/to)
      const convertTimezoneTool = tools.find((t) => t.name === 'convert_timezone');
      expect(convertTimezoneTool).toBeDefined();
      const convertTimezoneSchema = convertTimezoneTool?.inputSchema as any;
      expect(convertTimezoneSchema?.properties?.from_timezone?.description).toBe(
        'Source IANA timezone',
      );
      expect(convertTimezoneSchema?.properties?.to_timezone?.description).toBe(
        'Target IANA timezone',
      );
    } finally {
      await cleanup();
    }
  });
});
