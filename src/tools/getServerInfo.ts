/**
 * Get server version and build information
 * Implementation based on TDD tests and verified behavior
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import { debug } from '../utils/debug';

interface ServerInfo {
  version: string;
  revision: string;
  branch: string;
  dirty?: boolean;
  build_date?: string;
  build_number?: string;
  node_version: string;
  timezone: string;
}

interface VersionJson {
  version?: string;
  revision?: string;
  branch?: string;
  dirty?: boolean;
  buildDate?: string;
  buildNumber?: string;
}

/**
 * Get git revision (short hash)
 */
function getGitRevision(): string {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

/**
 * Get git branch name
 */
function getGitBranch(): string {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

/**
 * Check if working directory is dirty
 */
function getGitDirtyStatus(): boolean | undefined {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    return status.length > 0;
  } catch {
    return undefined;
  }
}

/**
 * Get package version from package.json
 */
function getPackageVersion(): string {
  try {
    const packagePath = path.join(__dirname, '../../package.json');
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const packageContent = fs.readFileSync(packagePath, 'utf8');
    const packageData = JSON.parse(packageContent) as { version?: string };
    return packageData.version ?? '1.0.0';
  } catch {
    return '1.0.0';
  }
}

/**
 * Read version.json if it exists
 */
function readVersionJson(): VersionJson | null {
  try {
    const versionPath = path.join(__dirname, '../version.json');
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const content = fs.readFileSync(versionPath, 'utf8');
    const parsed = JSON.parse(content) as unknown;
    // Type guard to ensure it's a VersionJson
    if (parsed && typeof parsed === 'object') {
      return parsed as VersionJson;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get server information including version and revision
 * @param _params - Unused parameter for MCP compatibility
 */
export function getServerInfo(_params?: unknown): ServerInfo {
  debug.server('getServerInfo called');

  // Try to read build-time version info first
  const versionJson = readVersionJson();

  // Always use package.json for version (source of truth)
  const version = getPackageVersion();

  // Use build-time info if available, otherwise detect at runtime
  const revision = versionJson?.revision ?? getGitRevision();
  const branch = versionJson?.branch ?? getGitBranch();

  // Build the response
  const info: ServerInfo = {
    version,
    revision,
    branch,
    node_version: process.version,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };

  // Add optional fields if available
  if (versionJson?.buildDate) {
    info.build_date = versionJson.buildDate;
  }

  if (versionJson?.buildNumber) {
    info.build_number = versionJson.buildNumber;
  }

  // Include dirty status if available
  const dirty = versionJson?.dirty ?? getGitDirtyStatus();
  if (dirty !== undefined) {
    info.dirty = dirty;
  }

  debug.server('getServerInfo returning: v%s, rev: %s, branch: %s', version, revision, branch);
  return info;
}
