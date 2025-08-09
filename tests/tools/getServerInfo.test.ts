/**
 * TDD tests for getServerInfo tool
 * Written BEFORE implementation (RED phase)
 * Based on verified behavior in docs/verified-behaviors/version-tracking-behavior.md
 */

import * as fs from 'fs';
import * as path from 'path';

describe('getServerInfo tool', () => {
  const versionJsonPath = path.join(__dirname, '../../src/version.json');
  let originalVersionJson: string | undefined;
  let versionJsonExists: boolean;

  beforeEach(() => {
    // Save original state of version.json if it exists
    versionJsonExists = fs.existsSync(versionJsonPath);
    if (versionJsonExists) {
      originalVersionJson = fs.readFileSync(versionJsonPath, 'utf8');
    }

    // Clear module cache to ensure fresh imports
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original version.json state
    if (versionJsonExists && originalVersionJson) {
      fs.writeFileSync(versionJsonPath, originalVersionJson);
    } else if (!versionJsonExists && fs.existsSync(versionJsonPath)) {
      fs.unlinkSync(versionJsonPath);
    }
  });

  describe('module exports', () => {
    it('should export getServerInfo function', () => {
      const module = require('../../src/tools/getServerInfo');
      expect(module.getServerInfo).toBeDefined();
      expect(typeof module.getServerInfo).toBe('function');
    });
  });

  describe('basic structure', () => {
    it('should return object with required fields', () => {
      const { getServerInfo } = require('../../src/tools/getServerInfo');
      const info = getServerInfo();

      // Required fields
      expect(info).toHaveProperty('version');
      expect(info).toHaveProperty('revision');
      expect(info).toHaveProperty('branch');
      expect(info).toHaveProperty('node_version');
      expect(info).toHaveProperty('timezone');
    });

    it('should return valid version from package.json', () => {
      const { getServerInfo } = require('../../src/tools/getServerInfo');
      const info = getServerInfo();

      expect(info.version).toBe('1.0.0'); // From our package.json
      expect(info.version).toMatch(/^\d+\.\d+\.\d+/);
    });

    it('should return current Node.js version', () => {
      const { getServerInfo } = require('../../src/tools/getServerInfo');
      const info = getServerInfo();

      expect(info.node_version).toBe(process.version);
    });

    it('should return valid timezone', () => {
      const { getServerInfo } = require('../../src/tools/getServerInfo');
      const info = getServerInfo();

      expect(typeof info.timezone).toBe('string');
      expect(info.timezone.length).toBeGreaterThan(0);
      // Should be a valid IANA timezone
      expect(info.timezone).toMatch(/^[A-Z][A-Za-z_\/]+$/);
    });
  });

  describe('git information', () => {
    it('should return git revision or "unknown"', () => {
      const { getServerInfo } = require('../../src/tools/getServerInfo');
      const info = getServerInfo();

      expect(typeof info.revision).toBe('string');
      // Either a short git hash (7 chars) or "unknown"
      expect(info.revision).toMatch(/^([a-f0-9]{7,8}|unknown)$/);
    });

    it('should return git branch or "unknown"', () => {
      const { getServerInfo } = require('../../src/tools/getServerInfo');
      const info = getServerInfo();

      expect(typeof info.branch).toBe('string');
      expect(info.branch.length).toBeGreaterThan(0);
      // Should not contain whitespace
      expect(info.branch).not.toMatch(/\s/);
    });

    it('should indicate dirty status when available', () => {
      const { getServerInfo } = require('../../src/tools/getServerInfo');
      const info = getServerInfo();

      if (info.hasOwnProperty('dirty')) {
        expect(typeof info.dirty).toBe('boolean');
      }
    });
  });

  describe('build-time information from version.json', () => {
    it('should use version.json when it exists', () => {
      // Create mock version.json
      const mockVersion = {
        version: '2.0.0-test',
        revision: 'abc1234',
        branch: 'test-branch',
        dirty: false,
        buildDate: '2025-01-08T12:00:00.000Z',
        buildNumber: 'build-123',
      };

      fs.writeFileSync(versionJsonPath, JSON.stringify(mockVersion, null, 2));

      // Clear cache and reimport
      delete require.cache[require.resolve('../../src/tools/getServerInfo')];
      const { getServerInfo } = require('../../src/tools/getServerInfo');
      const info = getServerInfo();

      // Should use build-time values from version.json
      expect(info.revision).toBe('abc1234');
      expect(info.branch).toBe('test-branch');
      expect(info.dirty).toBe(false);
      expect(info.build_date).toBe('2025-01-08T12:00:00.000Z');
      expect(info.build_number).toBe('build-123');

      // But package.json version should still be used
      expect(info.version).toBe('1.0.0'); // Always from package.json
    });

    it('should work without version.json', () => {
      // Ensure version.json doesn't exist
      if (fs.existsSync(versionJsonPath)) {
        fs.unlinkSync(versionJsonPath);
      }

      const { getServerInfo } = require('../../src/tools/getServerInfo');
      const info = getServerInfo();

      // Should still return valid info
      expect(info.version).toBe('1.0.0');
      expect(info.revision).toBeDefined();
      expect(info.branch).toBeDefined();
      expect(info.node_version).toBe(process.version);
    });

    it('should handle malformed version.json gracefully', () => {
      // Write invalid JSON
      fs.writeFileSync(versionJsonPath, 'not valid json{]');

      const { getServerInfo } = require('../../src/tools/getServerInfo');

      // Should not throw
      expect(() => getServerInfo()).not.toThrow();

      const info = getServerInfo();
      // Should fallback to runtime detection
      expect(info.version).toBe('1.0.0');
      expect(info.revision).toBeDefined();
    });
  });

  describe('MCP tool integration', () => {
    it('should be callable without parameters', () => {
      const { getServerInfo } = require('../../src/tools/getServerInfo');

      // MCP tools are called with params object, but this needs none
      expect(() => getServerInfo()).not.toThrow();
      expect(() => getServerInfo({})).not.toThrow();
      expect(() => getServerInfo(undefined)).not.toThrow();
    });

    it('should return JSON-serializable object', () => {
      const { getServerInfo } = require('../../src/tools/getServerInfo');
      const info = getServerInfo();

      // Should be JSON serializable (no functions, undefined, etc)
      expect(() => JSON.stringify(info)).not.toThrow();

      const serialized = JSON.stringify(info);
      const parsed = JSON.parse(serialized);

      // Should survive round-trip
      expect(parsed.version).toBe(info.version);
      expect(parsed.revision).toBe(info.revision);
    });
  });
});
