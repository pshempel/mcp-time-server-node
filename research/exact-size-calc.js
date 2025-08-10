// Test exact size calculations with 1.3x multiplier

function calculateSize(key, value) {
  const jsonSize = JSON.stringify({ [key]: value }).length;
  return Math.ceil(jsonSize * 1.3);
}

// Test the overflow scenario
const big = { data: 'x'.repeat(900) };
const overflow = { data: 'x'.repeat(200) };

const bigSize = calculateSize('big', big);
const overflowSize = calculateSize('overflow', overflow);

console.log('Overflow test:');
console.log(`Big: ${bigSize} bytes`);
console.log(`Overflow: ${overflowSize} bytes`);
console.log(`Total if both: ${bigSize + overflowSize} bytes`);
console.log(`Exceeds 1024? ${bigSize + overflowSize > 1024}`);
console.log(`Big alone exceeds? ${bigSize > 1024}`);

// Test the 90% warning
const warning = { data: 'x'.repeat(920) };
const warningSize = calculateSize('big', warning);
console.log('\n90% warning test:');
console.log(`Size: ${warningSize} bytes`);
console.log(`90% of 1024: ${Math.floor(1024 * 0.9)} bytes`);
console.log(`Triggers warning? ${warningSize >= 1024 * 0.9}`);

// Find the right size for tests
console.log('\nFinding right sizes:');
for (let i = 600; i <= 700; i += 10) {
  const size = calculateSize('test', { data: 'x'.repeat(i) });
  console.log(`${i} x's = ${size} bytes (${((size / 1024) * 100).toFixed(1)}% of 1KB)`);
}
