/**
 * Test OpenWebUI integration with parseNaturalDate and other tools
 * This tests if Llama can properly use and chain our MCP tools
 */

const API_KEY = 'sk-f6149982d0704eefb2cfc250d19641d2';
const API_URL = 'https://fractal.linuxhardcore.com/api/chat/completions';

// Test queries from simple to complex
const testQueries = [
  // Simple - should use parseNaturalDate
  "What date is next Tuesday?",
  
  // Medium - should use parseNaturalDate with time
  "What will the date and time be tomorrow at 3:30pm in UTC?",
  
  // Complex - needs chaining: parseNaturalDate + calculateBusinessDays
  "How many business days are there between tomorrow and next Friday?",
  
  // Very complex - multiple tool calls needed
  "If I start my vacation next Monday and take 10 business days off, what date do I return?",
  
  // Timezone aware
  "What time will it be in Tokyo when it's tomorrow at 3pm in New York?",
];

async function testQuery(query) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Query: "${query}"`);
  console.log('='.repeat(60));
  
  try {
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
            content: 'You have access to time tools including parse_natural_date. Use them to answer questions accurately.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.1, // Low temperature for more consistent responses
      })
    });

    const data = await response.json();
    
    if (data.choices && data.choices[0]) {
      const message = data.choices[0].message;
      console.log('Response:', message.content);
      
      // Check if the model tried to use tools
      if (message.tool_calls) {
        console.log('\nTool calls detected:');
        message.tool_calls.forEach(tool => {
          console.log(`  - ${tool.function.name}(${tool.function.arguments})`);
        });
      }
    } else if (data.error) {
      console.log('Error:', data.error);
    }
  } catch (error) {
    console.log('Request failed:', error.message);
  }
}

async function runTests() {
  console.log('Testing OpenWebUI Integration with MCP Time Tools');
  console.log('Model should now have access to parse_natural_date');
  
  for (const query of testQueries) {
    await testQuery(query);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Test Summary:');
  console.log('- Simple queries should use parse_natural_date directly');
  console.log('- Complex queries should chain multiple tools');
  console.log('- Check if the model provides accurate answers using the tools');
}

runTests().catch(console.error);