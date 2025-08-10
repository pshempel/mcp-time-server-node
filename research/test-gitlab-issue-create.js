#!/usr/bin/env node
/**
 * Debug GitLab issue creation
 */

const fs = require('fs');
const { Gitlab } = require('@gitbeaker/rest');

const token = fs.readFileSync('/home/pshempel/api_keys/gitlab.key', 'utf8').trim();
const api = new Gitlab({
  host: 'https://git.linuxhardcore.com',
  token: token,
});

async function main() {
  console.log('Testing GitLab issue creation...\n');
  
  // Test 1: Minimal issue
  console.log('Test 1: Minimal issue (no title)');
  try {
    const issue = await api.Issues.create(23, {
      description: 'Test without title'
    });
    console.log('✅ Created without title?', issue.iid);
  } catch (error) {
    console.log('❌ Failed:', error.message);
  }
  
  // Test 2: With empty title
  console.log('\nTest 2: Empty title');
  try {
    const issue = await api.Issues.create(23, {
      title: '',
      description: 'Test with empty title'
    });
    console.log('✅ Created with empty title?', issue.iid);
  } catch (error) {
    console.log('❌ Failed:', error.message);
  }
  
  // Test 3: Minimal valid issue
  console.log('\nTest 3: Just description (no title field)');
  try {
    const issue = await api.Issues.create(23, {
      description: 'Test issue'
    });
    console.log('✅ Created:', issue.iid);
  } catch (error) {
    console.log('❌ Failed:', error.message);
  }
  
  // Test 4: Try different API approach
  console.log('\nTest 4: Using different method signature');
  try {
    // Some GitLab versions want projectId as part of options
    const issue = await api.Issues.create({
      projectId: 23,
      title: 'Test Issue',
      description: 'Testing'
    });
    console.log('✅ Created:', issue.iid);
  } catch (error) {
    console.log('❌ Failed:', error.message);
  }
  
  // Test 5: Check project permissions
  console.log('\nTest 5: Check project access');
  try {
    const project = await api.Projects.show(23);
    console.log('Project:', project.name);
    console.log('Permissions:', project.permissions);
  } catch (error) {
    console.log('❌ Failed to get project:', error.message);
  }
  
  // Test 6: List existing issues to confirm API works
  console.log('\nTest 6: List existing issues');
  try {
    const issues = await api.Issues.all({ projectId: 23 });
    console.log(`Found ${issues.length} issues`);
    if (issues.length > 0) {
      console.log('First issue:', issues[0].title);
    }
  } catch (error) {
    console.log('❌ Failed to list:', error.message);
  }
}

main().catch(console.error);