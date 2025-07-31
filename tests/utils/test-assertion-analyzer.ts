/**
 * Test Assertion Analyzer
 *
 * This analyzer ensures tests are actually testing something meaningful.
 * It goes beyond just checking for expect() calls - it validates that:
 * 1. Tests have assertions
 * 2. Assertions are checking actual values (not just expect(true).toBe(true))
 * 3. Tests verify both success and failure cases
 * 4. Async tests properly await their assertions
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface TestAnalysis {
  file: string;
  line: number;
  name: string;
  issues: string[];
  assertions: AssertionInfo[];
}

interface AssertionInfo {
  line: number;
  type: string;
  value: string;
  isMeaningful: boolean;
}

export class TestAssertionAnalyzer {
  private suspiciousPatterns = [
    // Trivial assertions
    /expect\(true\)\.toBe\(true\)/,
    /expect\(false\)\.toBe\(false\)/,
    /expect\(1\)\.toBe\(1\)/,
    /expect\(['"].*['"]\)\.toBe\(['"].*['"]\)/, // Same string literals

    // Empty assertions
    /expect\(\)\.toBe/,
    /expect\(undefined\)\.toBeUndefined\(\)/,
    /expect\(null\)\.toBeNull\(\)/,

    // Console.log instead of assertions
    /console\.log\([^)]*\);\s*}\s*\)/,

    // Comments suggesting missing implementation
    /\/\/\s*(TODO|FIXME|XXX).*assert/i,
    /\/\/\s*should\s+/i,
  ];

  private meaningfulAssertionPatterns = [
    // Function calls with assertions
    /expect\([a-zA-Z_$][a-zA-Z0-9_$]*\([^)]*\)\)/,

    // Property access assertions
    /expect\([a-zA-Z_$][a-zA-Z0-9_$]*\.[a-zA-Z_$][a-zA-Z0-9_$]*\)/,

    // Async assertions
    /await\s+expect/,
    /expect\(.*\)\.rejects/,
    /expect\(.*\)\.resolves/,

    // Mock assertions
    /expect\(.*mock.*\)\.toHaveBeenCalled/,

    // Error assertions
    /expect\(\(\)\s*=>\s*{/,
    /\.toThrow/,
  ];

  async analyzeAllTests(): Promise<TestAnalysis[]> {
    const testFiles = await glob('tests/**/*.test.ts');
    const analyses: TestAnalysis[] = [];

    for (const file of testFiles) {
      const fileAnalyses = await this.analyzeFile(file);
      analyses.push(...fileAnalyses);
    }

    return analyses;
  }

  async analyzeFile(filePath: string): Promise<TestAnalysis[]> {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const analyses: TestAnalysis[] = [];

    let currentTest: TestAnalysis | null = null;
    let braceDepth = 0;
    let inTest = false;

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Check for test start
      const testMatch = line.match(/^\s*(it|test)\s*\(['"`](.*?)['"`]/);
      if (testMatch) {
        if (currentTest) {
          // Analyze previous test
          this.finalizeTestAnalysis(currentTest);
          analyses.push(currentTest);
        }

        currentTest = {
          file: filePath,
          line: lineNumber,
          name: testMatch[2],
          issues: [],
          assertions: [],
        };
        inTest = true;
        braceDepth = 0;
      }

      // Track brace depth
      if (inTest) {
        braceDepth += (line.match(/{/g) || []).length;
        braceDepth -= (line.match(/}/g) || []).length;

        // Check for assertions
        if (line.includes('expect(')) {
          const assertionInfo = this.analyzeAssertion(line, lineNumber);
          if (currentTest) {
            currentTest.assertions.push(assertionInfo);
          }
        }

        // Check for suspicious patterns
        this.suspiciousPatterns.forEach((pattern) => {
          if (pattern.test(line) && currentTest) {
            currentTest.issues.push(`Line ${lineNumber}: Suspicious pattern: ${line.trim()}`);
          }
        });

        // End of test
        if (braceDepth === 0 && line.includes('})')) {
          if (currentTest) {
            this.finalizeTestAnalysis(currentTest);
            analyses.push(currentTest);
            currentTest = null;
          }
          inTest = false;
        }
      }
    });

    return analyses;
  }

  private analyzeAssertion(line: string, lineNumber: number): AssertionInfo {
    // Extract assertion type
    const typeMatch = line.match(
      /\.(toBe|toEqual|toMatch|toContain|toThrow|toHaveBeenCalled|toBeGreaterThan|toBeLessThan|toBeTruthy|toBeFalsy|toBeNull|toBeUndefined|toBeDefined)\(/,
    );
    const type = typeMatch ? typeMatch[1] : 'unknown';

    // Check if assertion is meaningful
    let isMeaningful = false;
    this.meaningfulAssertionPatterns.forEach((pattern) => {
      if (pattern.test(line)) {
        isMeaningful = true;
      }
    });

    // Trivial assertions are not meaningful
    this.suspiciousPatterns.forEach((pattern) => {
      if (pattern.test(line)) {
        isMeaningful = false;
      }
    });

    return {
      line: lineNumber,
      type,
      value: line.trim(),
      isMeaningful,
    };
  }

  private finalizeTestAnalysis(test: TestAnalysis): void {
    // No assertions at all
    if (test.assertions.length === 0) {
      test.issues.push('CRITICAL: Test has no assertions!');
    }

    // All assertions are trivial
    const meaningfulAssertions = test.assertions.filter((a) => a.isMeaningful);
    if (test.assertions.length > 0 && meaningfulAssertions.length === 0) {
      test.issues.push('All assertions are trivial or meaningless');
    }

    // Check for async test patterns without proper handling
    const hasAsync = test.name.includes('async') || test.name.includes('promise');
    const hasAsyncAssertion = test.assertions.some(
      (a) =>
        a.value.includes('await') || a.value.includes('resolves') || a.value.includes('rejects'),
    );

    if (hasAsync && !hasAsyncAssertion && test.assertions.length > 0) {
      test.issues.push('Test name suggests async but no async assertions found');
    }

    // Check for error handling tests
    if (test.name.match(/error|fail|throw|invalid/i)) {
      const hasErrorAssertion = test.assertions.some(
        (a) =>
          a.value.includes('toThrow') || a.value.includes('rejects') || a.value.includes('error'),
      );
      if (!hasErrorAssertion) {
        test.issues.push('Test name suggests error handling but no error assertions found');
      }
    }
  }

  generateReport(analyses: TestAnalysis[]): string {
    const totalTests = analyses.length;
    const fakeTests = analyses.filter((a) => a.assertions.length === 0);
    const suspiciousTests = analyses.filter((a) => a.issues.length > 0);
    const testsWithOnlyTrivialAssertions = analyses.filter(
      (a) => a.assertions.length > 0 && a.assertions.every((assert) => !assert.isMeaningful),
    );

    let report = '=== TEST ASSERTION ANALYSIS REPORT ===\n\n';
    report += `Total Tests Analyzed: ${totalTests}\n`;
    report += `Fake Tests (No Assertions): ${fakeTests.length}\n`;
    report += `Suspicious Tests: ${suspiciousTests.length}\n`;
    report += `Tests with Only Trivial Assertions: ${testsWithOnlyTrivialAssertions.length}\n\n`;

    if (fakeTests.length > 0) {
      report += '❌ FAKE TESTS (No Assertions):\n';
      fakeTests.forEach((test) => {
        report += `  ${test.file}:${test.line} - "${test.name}"\n`;
      });
      report += '\n';
    }

    if (testsWithOnlyTrivialAssertions.length > 0) {
      report += '⚠️  TESTS WITH ONLY TRIVIAL ASSERTIONS:\n';
      testsWithOnlyTrivialAssertions.forEach((test) => {
        report += `  ${test.file}:${test.line} - "${test.name}"\n`;
        test.assertions.forEach((assertion) => {
          report += `    Line ${assertion.line}: ${assertion.value}\n`;
        });
      });
      report += '\n';
    }

    if (suspiciousTests.length > 0) {
      report += '🔍 SUSPICIOUS TESTS:\n';
      suspiciousTests.slice(0, 10).forEach((test) => {
        // Limit to first 10
        report += `  ${test.file}:${test.line} - "${test.name}"\n`;
        test.issues.forEach((issue) => {
          report += `    - ${issue}\n`;
        });
      });
      if (suspiciousTests.length > 10) {
        report += `  ... and ${suspiciousTests.length - 10} more\n`;
      }
      report += '\n';
    }

    // Recommendations
    report += '📋 RECOMMENDATIONS:\n';
    if (fakeTests.length > 0) {
      report += '1. Add assertions to all tests - use expect() with meaningful checks\n';
    }
    if (testsWithOnlyTrivialAssertions.length > 0) {
      report += '2. Replace trivial assertions with meaningful ones that test actual behavior\n';
    }
    report += '3. Ensure async tests properly await their assertions\n';
    report += '4. Tests for error cases should include error assertions (toThrow, rejects)\n';
    report += '5. Consider using expect.assertions(n) to ensure expected number of assertions\n';

    return report;
  }

  async generateJsonReport(analyses: TestAnalysis[]): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: analyses.length,
        fakeTests: analyses.filter((a) => a.assertions.length === 0).length,
        suspiciousTests: analyses.filter((a) => a.issues.length > 0).length,
        testsWithOnlyTrivialAssertions: analyses.filter(
          (a) => a.assertions.length > 0 && a.assertions.every((assert) => !assert.isMeaningful),
        ).length,
      },
      tests: analyses.filter((a) => a.issues.length > 0 || a.assertions.length === 0),
    };

    fs.writeFileSync(
      path.join(process.cwd(), 'test-assertion-report.json'),
      JSON.stringify(report, null, 2),
    );
  }
}
