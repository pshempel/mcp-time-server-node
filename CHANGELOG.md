# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Natural language date parsing capability
- Version tracking with `getServerInfo` tool
- Comprehensive debug logging infrastructure
- Cache wrapper utility for all tools
- Holiday aggregation from multiple sources

### Fixed
- Rate limiting per-process isolation issue
- Test quality (addressing 302 tests without assertions)
- Timezone handling consistency across tools
- Business hours calculation edge cases

### Changed
- Repository structure reorganization for clarity
- Documentation split between public (docs/) and internal (sessions/)
- Improved error messages across all tools

### Security
- Cache key sanitization to prevent injection attacks
- Input validation strengthened across all tools

## [0.1.0] - 2024-12-01

### Added
- Initial MCP Time Server implementation
- 10 core time manipulation tools
- Comprehensive test suite
- TDD-based development workflow
- Research-driven behavior verification

[Unreleased]: https://github.com/pshempel/mcp-time-server-node/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/pshempel/mcp-time-server-node/releases/tag/v0.1.0