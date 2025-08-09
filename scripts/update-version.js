#!/usr/bin/env node

/**
 * Pre-build script to generate version.json
 * This captures build-time information for the server
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get git information
let gitRevision = 'unknown';
let gitBranch = 'unknown';
let isDirty = false;

try {
  gitRevision = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();

  // Check if working directory is clean
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  isDirty = status.length > 0;
} catch (error) {
  console.warn('Git info not available (may be in CI/production)');
}

// Get package version for reference
const packagePath = path.join(__dirname, '../package.json');
const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Create version info
const versionInfo = {
  // Note: version is always read from package.json at runtime
  // This is just for reference
  version: packageData.version,
  revision: gitRevision,
  branch: gitBranch,
  dirty: isDirty,
  buildDate: new Date().toISOString(),
  buildNumber: process.env.BUILD_NUMBER || Date.now().toString(36),
};

// Write version file
const versionPath = path.join(__dirname, '../src/version.json');
fs.writeFileSync(versionPath, JSON.stringify(versionInfo, null, 2));

// Display build info
console.log('=== Build Version Info ===');
console.log(`Version: ${versionInfo.version}`);
console.log(`Revision: ${versionInfo.revision}${isDirty ? ' (dirty)' : ''}`);
console.log(`Branch: ${versionInfo.branch}`);
console.log(`Build: ${versionInfo.buildNumber}`);
console.log(`Date: ${versionInfo.buildDate}`);
console.log(`Written to: ${versionPath}`);
