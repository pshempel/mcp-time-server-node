#!/usr/bin/env node

/**
 * Research script to verify version tracking approaches
 * This will help us understand what information we can reliably get
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== Version Tracking Research ===\n');

// 1. Can we get git information?
console.log('1. Git Information:');
try {
  const revision = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  const isDirty = status.length > 0;

  console.log(`   - Revision: ${revision}`);
  console.log(`   - Branch: ${branch}`);
  console.log(`   - Working directory: ${isDirty ? 'dirty (uncommitted changes)' : 'clean'}`);
} catch (error) {
  console.log(`   - Error: ${error.message}`);
  console.log('   - Git info may not be available in production');
}

// 2. Can we read package.json?
console.log('\n2. Package.json:');
try {
  const packagePath = path.join(__dirname, '../package.json');
  const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  console.log(`   - Version: ${packageData.version}`);
  console.log(`   - Name: ${packageData.name}`);
  console.log(`   - Path exists: ${fs.existsSync(packagePath)}`);
} catch (error) {
  console.log(`   - Error: ${error.message}`);
}

// 3. Runtime information
console.log('\n3. Runtime Information:');
console.log(`   - Node version: ${process.version}`);
console.log(`   - Platform: ${process.platform}`);
console.log(`   - Architecture: ${process.arch}`);
console.log(`   - Current directory: ${process.cwd()}`);
console.log(`   - Script directory: ${__dirname}`);

// 4. Can we create a build-time version file?
console.log('\n4. Build-time Version File:');
const versionFile = path.join(__dirname, '../src/version.json');
const testVersion = {
  version: '1.0.0-test',
  revision: 'test123',
  buildDate: new Date().toISOString(),
  buildNumber: Date.now().toString(36),
};

try {
  // Test write
  fs.writeFileSync(versionFile, JSON.stringify(testVersion, null, 2));
  console.log(`   - Can write to: ${versionFile}`);

  // Test read
  const readBack = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
  console.log(`   - Can read back: ${JSON.stringify(readBack).substring(0, 50)}...`);

  // Clean up
  fs.unlinkSync(versionFile);
  console.log('   - Cleanup successful');
} catch (error) {
  console.log(`   - Error: ${error.message}`);
}

// 5. Environment variables
console.log('\n5. Environment Variables:');
console.log(`   - NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`   - BUILD_NUMBER: ${process.env.BUILD_NUMBER || 'not set'}`);
console.log(`   - CI: ${process.env.CI || 'not set'}`);
console.log(`   - DEBUG: ${process.env.DEBUG || 'not set'}`);

// 6. MCP server info requirements
console.log('\n6. MCP Server Info Requirements:');
console.log('   - Must be callable as a tool');
console.log('   - Should work even without git (production)');
console.log('   - Should indicate build vs runtime info');
console.log('   - Should help identify version mismatches');

console.log('\n=== Research Complete ===');
