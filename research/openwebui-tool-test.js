/**
 * Test how OpenWebUI/Llama handles MCP tool calls
 * 
 * Goal: See if simpler LLMs can chain our tools for complex queries
 */

const API_KEY = 'sk-f6149982d0704eefb2cfc250d19641d2';
const API_URL = 'https://fractal.linuxhardcore.com/api/chat/completions';

// Simulate our MCP tools
const tools = [
  {
    type: 'function',
    function: {
      name: 'getCurrentTime',
      description: 'Get current time in specified timezone',
      parameters: {
        type: 'object',
        properties: {
          timezone: { type: 'string', description: 'IANA timezone' }
        }
      }
    }
  },
  {
    type: 'function', 
    function: {
      name: 'parseNaturalDate',
      description: 'Parse natural language dates like "next Tuesday" or "tomorrow at 3pm"',
      parameters: {
        type: 'object',
        properties: {
          input: { type: 'string', description: 'Natural language date/time' },
          timezone: { type: 'string', description: 'IANA timezone' }
        },
        required: ['input']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'calculateBusinessDays',
      description: 'Calculate business days between two dates',
      parameters: {
        type: 'object',
        properties: {
          start_date: { type: 'string' },
          end_date: { type: 'string' }
        },
        required: ['start_date', 'end_date']
      }
    }
  }
];

async function testQuery(query) {
  console.log(`\nTesting: "${query}"`);
  console.log('=' .repeat(50));
  
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama3.1:latest',
      messages: [
        {
          role: 'system',
          content: 'You have access to time-related tools. Use them to answer questions. Output tool calls in JSON format.'
        },
        {
          role: 'user',
          content: query
        }
      ],
      tools: tools,
      tool_choice: 'auto'
    })
  });

  const data = await response.json();
  
  if (data.choices && data.choices[0]) {
    const message = data.choices[0].message;
    console.log('Response:', message.content);
    
    if (message.tool_calls) {
      console.log('Tool calls:', JSON.stringify(message.tool_calls, null, 2));
    }
  } else if (data.error) {
    console.log('Error:', data.error);
  }
}

// Test queries from simple to complex
async function runTests() {
  // Simple - single tool
  await testQuery("What time is it in Tokyo?");
  
  // Medium - parse natural language
  await testQuery("What date is next Tuesday?");
  
  // Complex - needs tool chaining
  await testQuery("How many business days are there between tomorrow and next Friday?");
  
  // Very complex - multiple steps
  await testQuery("I need 14 work days off starting next Monday. What's my return date?");
}

runTests().catch(console.error);