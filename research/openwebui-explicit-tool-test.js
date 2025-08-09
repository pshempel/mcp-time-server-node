/**
 * Explicitly instruct the model to use tools
 */

const API_KEY = 'sk-f6149982d0704eefb2cfc250d19641d2';
const API_URL = 'https://fractal.linuxhardcore.com/api/chat/completions';

async function testExplicitToolUse() {
  console.log('Testing Explicit Tool Usage\n');
  
  const query = "Use the parse_natural_date tool to parse 'next Tuesday' with timezone UTC";
  
  console.log(`Query: "${query}"\n`);
  
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
            content: 'You must use the available tools to answer questions. You have access to parse_natural_date, get_current_time, calculate_business_days and other time tools. Always use tools rather than calculating yourself.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.1,
        // Explicitly enable tools if needed
        tool_choice: 'auto',
      })
    });

    const data = await response.json();
    
    if (data.choices && data.choices[0]) {
      const message = data.choices[0].message;
      console.log('Response:', message.content || 'No content');
      
      if (message.tool_calls) {
        console.log('\nTool calls:');
        message.tool_calls.forEach(tool => {
          console.log(`  ${tool.function.name}(${tool.function.arguments})`);
        });
      } else {
        console.log('\nNo tool calls detected - model did not use tools');
      }
    }
  } catch (error) {
    console.log('Error:', error.message);
  }
}

// Also test if the model knows what tools are available
async function testToolAwareness() {
  console.log('\n' + '='.repeat(60));
  console.log('Testing Tool Awareness\n');
  
  const query = "What time-related tools do you have available?";
  
  console.log(`Query: "${query}"\n`);
  
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
            role: 'user',
            content: query
          }
        ],
        temperature: 0.1,
      })
    });

    const data = await response.json();
    
    if (data.choices && data.choices[0]) {
      console.log('Response:', data.choices[0].message.content);
    }
  } catch (error) {
    console.log('Error:', error.message);
  }
}

async function runTests() {
  await testExplicitToolUse();
  await testToolAwareness();
}

runTests().catch(console.error);