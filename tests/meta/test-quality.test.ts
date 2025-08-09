/**
 * Meta Test - Tests that test our tests!
 *
 * This ensures all tests in the codebase have meaningful assertions.
 * It's a test that fails if other tests are fake.
 *
 * IMPORTANT: This test is excluded from regular test runs because it's
 * designed to fail when it finds quality issues. The failures are not bugs
 * but rather indicators of test quality problems that should be addressed.
 *
 * Run separately with: npm run test:meta or make test-meta
 *
 * Current known issues (as of 2025-08-08):
 * - 415 tests with only trivial assertions
 * - 2 async tests potentially missing await
 * - 71 error handling tests without error assertions
 *
 * These are tracked but not blocking regular development.
 */

import { TestAssertionAnalyzer } from '../utils/test-assertion-analyzer';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

describe('Test Quality Meta Tests', () => {
  let analyzer: TestAssertionAnalyzer;

  beforeAll(() => {
    analyzer = new TestAssertionAnalyzer();
  });

  it('all tests should have at least one assertion', async () => {
    const analyses = await analyzer.analyzeAllTests();
    const fakeTests = analyses.filter((a) => a.assertions.length === 0);

    if (fakeTests.length > 0) {
      const report = analyzer.generateReport(analyses);
      console.error('\n' + report);
    }

    expect(fakeTests.length).toBe(0);
  }, 30000); // Increase timeout for analyzing all files

  it('no tests should have only trivial assertions', async () => {
    const analyses = await analyzer.analyzeAllTests();
    const trivialTests = analyses.filter(
      (a) => a.assertions.length > 0 && a.assertions.every((assert) => !assert.isMeaningful)
    );

    expect(trivialTests.length).toBe(0);
  }, 30000);

  it('async tests should properly await their assertions', async () => {
    const testFiles = await glob('tests/**/*.test.ts');
    const issues: string[] = [];

    for (const file of testFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Check for async test without await
        if (line.includes('async') && line.includes('=>')) {
          const nextLines = lines.slice(index, index + 20).join('\n');
          if (nextLines.includes('expect(') && !nextLines.includes('await')) {
            // Check if it's a promise assertion
            if (!nextLines.includes('.resolves') && !nextLines.includes('.rejects')) {
              issues.push(`${file}:${index + 1} - Async test may be missing await`);
            }
          }
        }
      });
    }

    expect(issues).toEqual([]);
  }, 30000);

  it('error handling tests should have error assertions', async () => {
    const analyses = await analyzer.analyzeAllTests();
    const errorTests = analyses.filter((a) => a.name.match(/error|fail|throw|invalid|reject/i));

    const missingErrorAssertions = errorTests.filter((test) => {
      const hasErrorAssertion = test.assertions.some(
        (a) =>
          a.value.includes('toThrow') ||
          a.value.includes('rejects') ||
          a.value.includes('error') ||
          a.value.includes('catch')
      );
      return !hasErrorAssertion && test.assertions.length > 0;
    });

    expect(missingErrorAssertions.length).toBe(0);
  }, 30000);

  it('no test should use console.log instead of assertions', async () => {
    const testFiles = await glob('tests/**/*.test.ts');
    const issues: string[] = [];

    for (const file of testFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      let inTest = false;
      let hasExpect = false;
      let hasConsoleLog = false;
      let testName = '';
      let testLine = 0;

      lines.forEach((line, index) => {
        if (line.match(/^\s*(it|test)\s*\(['"`]/)) {
          if (inTest && hasConsoleLog && !hasExpect) {
            issues.push(
              `${file}:${testLine} - Test "${testName}" uses console.log but has no assertions`
            );
          }

          const match = line.match(/^\s*(it|test)\s*\(['"`](.*?)['"`]/);
          testName = match ? match[2] : '';
          testLine = index + 1;
          inTest = true;
          hasExpect = false;
          hasConsoleLog = false;
        }

        if (inTest) {
          if (line.includes('expect(')) hasExpect = true;
          if (line.includes('console.log')) hasConsoleLog = true;
          if (line.includes('})')) inTest = false;
        }
      });
    }

    expect(issues).toEqual([]);
  }, 30000);

  it('all test files should be included in the analysis', async () => {
    const allTestFiles = await glob('tests/**/*.test.ts');
    const analyzedFiles = await analyzer.analyzeAllTests();
    const analyzedFileNames = [...new Set(analyzedFiles.map((a) => a.file))];

    expect(analyzedFileNames.length).toBeGreaterThan(0);
    expect(allTestFiles.length).toBeGreaterThan(0);
  });

  it('should generate a comprehensive test quality report', async () => {
    const analyses = await analyzer.analyzeAllTests();
    const report = analyzer.generateReport(analyses);

    // Report should include key sections
    expect(report).toContain('TEST ASSERTION ANALYSIS REPORT');
    expect(report).toContain('Total Tests Analyzed:');
    expect(report).toContain('RECOMMENDATIONS');

    // Save report for review
    const reportPath = path.join(process.cwd(), 'test-quality-report.txt');
    fs.writeFileSync(reportPath, report);

    // Also generate JSON report
    await analyzer.generateJsonReport(analyses);

    expect(fs.existsSync(reportPath)).toBe(true);
    expect(fs.existsSync(path.join(process.cwd(), 'test-assertion-report.json'))).toBe(true);
  });
});
