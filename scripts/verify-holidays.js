#!/usr/bin/env node

/**
 * Holiday verification script
 * Runs automated tests and provides summary
 */

const { execSync } = require('child_process');

console.log('🎯 Running Holiday Verification Tests\n');
console.log('='.repeat(50));

try {
  // Run the verification tests
  execSync('npm test holidays.verification', { stdio: 'inherit' });

  console.log('\n✅ All holiday verifications passed!');
  console.log('\nNext steps:');
  console.log('1. Review test output for any warnings');
  console.log('2. Update expected data if official holidays change');
  console.log('3. Run annually to ensure continued accuracy');
} catch (error) {
  console.error('\n❌ Holiday verification failed!');
  console.error('\nPlease check:');
  console.error('1. Holiday data in src/data/holidays.ts');
  console.error('2. Expected dates in tests/data/holidays.verification.test.ts');
  console.error('3. Official sources for any holiday changes');
  process.exit(1);
}

console.log('\n📚 Documentation: docs/verified-behaviors/holiday-automated-verification.md');
