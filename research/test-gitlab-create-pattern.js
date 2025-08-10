#!/usr/bin/env node
/**
 * Test different patterns for creating issues with Gitbeaker
 */

const fs = require('fs');
const { Gitlab } = require('@gitbeaker/rest');

const token = fs.readFileSync('/home/pshempel/api_keys/gitlab.key', 'utf8').trim();
const api = new Gitlab({
  host: 'https://git.linuxhardcore.com',
  token: token,
});

async function main() {
  console.log('Testing GitLab issue creation patterns...\n');
  
  // Pattern 1: As shown in Gitbeaker docs - single options object
  console.log('Pattern 1: Single options object (as per docs)');
  try {
    const issue = await api.Issues.create({
      projectId: 23,
      title: 'Test Issue from Pattern 1',
      description: 'Testing single object pattern'
    });
    console.log(`✅ Created Issue #${issue.iid}`);
    await api.Issues.remove(23, issue.iid);
    console.log('   Deleted test issue');
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
  }
  
  // Pattern 2: projectId as first param, options as second
  console.log('\nPattern 2: projectId, then options');
  try {
    const issue = await api.Issues.create(23, {
      title: 'Test Issue from Pattern 2',
      description: 'Testing two-param pattern'
    });
    console.log(`✅ Created Issue #${issue.iid}`);
    await api.Issues.remove(23, issue.iid);
    console.log('   Deleted test issue');
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
  }
  
  // Pattern 3: Check if title needs to be separate
  console.log('\nPattern 3: Title as named param');
  try {
    const issue = await api.Issues.create(23, 'Test Title', {
      description: 'Testing if title is separate'
    });
    console.log(`✅ Created Issue #${issue.iid}`);
    await api.Issues.remove(23, issue.iid);
    console.log('   Deleted test issue');
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
  }
  
  // Pattern 4: Check actual error details
  console.log('\nPattern 4: Detailed error check');
  try {
    const issue = await api.Issues.create(23, {
      title: 'Test',
      description: 'Test'
    });
    console.log(`✅ Created Issue #${issue.iid}`);
    await api.Issues.remove(23, issue.iid);
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
    if (error.cause) {
      console.log('Request URL:', error.cause.request?.url);
      console.log('Request body:', error.cause.request?.body);
      console.log('Response status:', error.cause.response?.status);
      console.log('Response body:', await error.cause.response?.text());
    }
  }
}

main().catch(console.error);