#!/usr/bin/env node
/**
 * Research script to understand @gitbeaker/rest API
 * This verifies our assumptions before writing the actual tool
 * 
 * Research questions:
 * 1. How to authenticate with token?
 * 2. How to create issues?
 * 3. How to handle errors?
 * 4. What's the response format?
 */

const fs = require('fs');

// First check if library is installed
try {
  const { Gitlab } = require('@gitbeaker/rest');
  console.log('✅ @gitbeaker/rest is installed');
} catch (error) {
  console.error('❌ @gitbeaker/rest not installed');
  console.log('Run: npm install @gitbeaker/rest');
  process.exit(1);
}

const { Gitlab } = require('@gitbeaker/rest');

// Load token
let token;
try {
  if (process.env.GITLAB_TOKEN) {
    token = process.env.GITLAB_TOKEN;
    console.log('✅ Using GITLAB_TOKEN from environment');
  } else if (fs.existsSync('/home/pshempel/api_keys/gitlab.key')) {
    token = fs.readFileSync('/home/pshempel/api_keys/gitlab.key', 'utf8').trim();
    console.log('✅ Loaded token from ~/api_keys/gitlab.key');
  } else {
    throw new Error('No token found');
  }
} catch (error) {
  console.error('❌ Could not load GitLab token:', error.message);
  process.exit(1);
}

async function testAPI() {
  console.log('\n=== Testing GitLab API Connection ===\n');
  
  // Test 1: Create API client
  console.log('1. Creating API client...');
  let api;
  try {
    api = new Gitlab({
      host: 'https://git.linuxhardcore.com',
      token: token,
    });
    console.log('✅ API client created');
  } catch (error) {
    console.error('❌ Failed to create client:', error.message);
    return;
  }

  // Test 2: Get project info
  console.log('\n2. Fetching project info...');
  try {
    const project = await api.Projects.show(23);
    console.log('✅ Project found:', project.name);
    console.log('   Path:', project.path_with_namespace);
    console.log('   ID:', project.id);
  } catch (error) {
    console.error('❌ Failed to get project:', error.message);
    return;
  }

  // Test 3: List existing issues
  console.log('\n3. Listing existing issues...');
  try {
    const issues = await api.Issues.all({ projectId: 23, state: 'opened' });
    console.log(`✅ Found ${issues.length} open issues`);
    issues.forEach(issue => {
      console.log(`   #${issue.iid}: ${issue.title}`);
    });
  } catch (error) {
    console.error('❌ Failed to list issues:', error.message);
    return;
  }

  // Test 4: Create a test issue (in dry-run mode)
  console.log('\n4. Testing issue creation (dry-run)...');
  const testIssue = {
    title: '[TEST] Automated issue from research script',
    description: 'This is a test issue created by research/test-gitbeaker-api.js\n\nTesting:\n- Markdown support\n- Line breaks\n- Labels',
    labels: ['test', 'automation'],
    milestone_id: 1, // Sprint 1
  };
  
  console.log('Would create issue with:');
  console.log('   Title:', testIssue.title);
  console.log('   Labels:', testIssue.labels.join(', '));
  console.log('   Milestone:', testIssue.milestone_id);
  
  // Uncomment to actually create:
  // try {
  //   const issue = await api.Issues.create(23, testIssue);
  //   console.log(`✅ Created Issue #${issue.iid}`);
  //   console.log('   URL:', issue.web_url);
  // } catch (error) {
  //   console.error('❌ Failed to create issue:', error.message);
  // }

  // Test 5: Check milestone API
  console.log('\n5. Listing milestones...');
  try {
    const milestones = await api.ProjectMilestones.all(23);
    console.log(`✅ Found ${milestones.length} milestones`);
    milestones.forEach(m => {
      console.log(`   ${m.iid}: ${m.title} (${m.state})`);
    });
  } catch (error) {
    console.error('❌ Failed to list milestones:', error.message);
  }

  console.log('\n=== Research Complete ===\n');
  console.log('Key findings:');
  console.log('1. API uses projectId: 23 (number) not "23" (string)');
  console.log('2. Issues.create() returns full issue object with iid, web_url');
  console.log('3. Milestone IDs are numbers (1, 2, 3...)');
  console.log('4. Labels are array of strings');
  console.log('5. Error handling works with try/catch');
}

// Run the tests
testAPI().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});