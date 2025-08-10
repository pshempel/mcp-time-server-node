// Debug why our size calculations are off

// Simulate our calculation
function calculateSize(key, value) {
  const jsonSize = JSON.stringify({ [key]: value }).length;
  return jsonSize * 2;
}

// Test case from failing test
const bigData = 'x'.repeat(900);
const bigObject = { data: bigData };
const bigSize = calculateSize('big', bigObject);

const overflowData = 'x'.repeat(200);
const overflowObject = { data: overflowData };
const overflowSize = calculateSize('overflow', overflowObject);

console.log('=== Size Calculation Debug ===');
console.log(`Big object: ${bigSize} bytes`);
console.log(`Overflow object: ${overflowSize} bytes`);
console.log(`Total: ${bigSize + overflowSize} bytes`);
console.log(`1KB limit: 1024 bytes`);
console.log(`Would exceed? ${bigSize + overflowSize > 1024}`);

// Test actual JSON sizes
console.log('\n=== Actual JSON Sizes ===');
console.log(`Big JSON: ${JSON.stringify({ big: bigObject }).length} bytes`);
console.log(`Overflow JSON: ${JSON.stringify({ overflow: overflowObject }).length} bytes`);

// Test the 90% calculation
const cache920 = { data: 'x'.repeat(920) };
const size920 = calculateSize('big', cache920);
console.log('\n=== 90% Warning Test ===');
console.log(`920 x's object: ${size920} bytes`);
console.log(`90% of 1024: ${1024 * 0.9} bytes`);
console.log(`Would trigger warning? ${size920 >= 1024 * 0.9}`);
