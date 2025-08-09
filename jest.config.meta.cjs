/**
 * Jest configuration for meta tests
 * 
 * Meta tests analyze the quality of other tests in the codebase.
 * They are expected to fail when they find issues like:
 * - Tests with trivial assertions
 * - Async tests missing await
 * - Error handling tests without error assertions
 * 
 * These tests are excluded from regular test runs because their
 * failures indicate quality issues to fix, not bugs in the code.
 * 
 * Run with: npm run test:meta
 */

/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/meta'],
  testMatch: ['**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  clearMocks: true,
  testTimeout: 30000, // Meta tests analyze all test files, needs more time
};