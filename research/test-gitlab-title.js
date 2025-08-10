#!/usr/bin/env node
/**
 * Test what title formats GitLab accepts
 */

const fs = require('fs');
const { Gitlab } = require('@gitbeaker/rest');

const token = fs.readFileSync('/home/pshempel/api_keys/gitlab.key', 'utf8').trim();
const api = new Gitlab({
  host: 'https://git.linuxhardcore.com',
  token: token,
});

async function testTitle(title) {
  console.log(`Testing: "${title}"`);
  try {
    const issue = await api.Issues.create(23, {
      title: title,
      description: 'Testing title validation',
      labels: ['test']
    });
    console.log(`✅ Success: Issue #${issue.iid} created`);
    // Delete the test issue
    await api.Issues.remove(23, issue.iid);
    console.log(`   Deleted test issue #${issue.iid}`);
    return true;
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
    console.log(`   Full error:`, error.response?.data || error);
    return false;
  }
}

async function main() {
  console.log('Testing GitLab title validation...\n');
  
  const testTitles = [
    'Simple title',
    'Title with numbers 123',
    'Title with percentage 90%',
    'Title with dash - test',
    'Title: with colon',
    'Title (with parentheses)',
    'Title with arrow →',
    'Fix withCache Coverage - 66% to 90%',
    'Debug Module Caching Issue',
  ];
  
  for (const title of testTitles) {
    await testTitle(title);
    console.log('');
  }
}

main().catch(console.error);