# Verified Version Tracking Behavior

**Decision Date:** 2025-01-08 18:30 EST

## Research Findings

Based on research script `research/version-tracking-research.js`, we verified:

### 1. Git Information
- **Can retrieve**: short hash, branch name, dirty status
- **Limitation**: May not be available in production (no .git directory)
- **Fallback**: Return "unknown" when git not available

### 2. Package.json
- **Always available**: Version number from package.json
- **Location**: `../package.json` relative to compiled code
- **Reliable**: This is our primary version source

### 3. Build-time vs Runtime
- **Build-time**: Can generate `src/version.json` during build
- **Runtime**: Can read version.json if exists, fallback to dynamic detection
- **Strategy**: Prefer build-time info, fallback to runtime detection

## Implementation Requirements

The `get_server_info` tool must:

1. **Return structure**:
   ```json
   {
     "version": "1.0.0",           // From package.json
     "revision": "abc123",          // Git short hash or "unknown"
     "branch": "main",              // Git branch or "unknown"
     "dirty": false,                // Working directory status
     "build_date": "2025-01-08...", // When version.json was created
     "build_number": "xyz",         // From CI or timestamp
     "node_version": "v20.19.2",    // Runtime Node.js version
     "timezone": "America/New_York" // Server timezone
   }
   ```

2. **Fallback behavior**:
   - If `src/version.json` exists → use it for build info
   - If no version.json → generate info at runtime
   - If no git → use "unknown" for git fields

3. **Build process**:
   - Add pre-build script to generate `src/version.json`
   - Include version.json in TypeScript compilation
   - Make it optional (server works without it)

## Why This Matters

As discovered in session 101, different MCP server instances can return different results. Version tracking helps:
- Identify which code version is actually running
- Detect when cached/old versions are being used
- Verify deployments and updates
- Debug version mismatches between test and production