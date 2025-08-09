# Contributing to MCP Time Server

Thank you for your interest in contributing to the MCP Time Server project!

## Development Workflow

### Current Work
Check `sessions/SPRINT_INDEX.md` for active development tasks and priorities.

## Code Standards

### Mandatory Requirements
1. **Test-Driven Development (TDD)**: Write tests BEFORE implementation
2. **Complexity Limit**: Functions must have cyclomatic complexity ≤ 10
3. **Function Length**: Keep functions under 50 lines
4. **Research First**: Verify library behavior before using it

### Development Cycle
1. **Research** → Create verification script in `research/`
2. **Document** → Record findings in `docs/verified-behaviors/`
3. **Test** → Write failing tests first (RED)
4. **Implement** → Write minimal code to pass (GREEN)
5. **Refactor** → Clean up with passing tests as safety net

### Commands
```bash
make test       # Run all tests
make lint       # Check code style
make verify     # Full validation (required before commit)
make coverage   # Check test coverage
```

## Commit Guidelines

Use [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New feature
- `fix:` Bug fix
- `test:` Test changes
- `refactor:` Code refactoring
- `docs:` Documentation
- `chore:` Maintenance

## Project Structure

```
src/tools/      # Business logic for each tool
src/utils/      # Shared utilities (reuse these!)
tests/          # Mirrors src/ structure
research/       # Verification scripts
docs/           # Public documentation
```

## Key Conventions

### Timezone Handling
- `undefined` → System local timezone
- `""` (empty string) → UTC
- Any other string → Specific IANA timezone

### Date Parsing
- ISO dates without timezone (`'2025-01-01'`) → Parsed as UTC
- Always use `parseISO()` from date-fns

## Getting Started

1. Fork the repository
2. Create a feature branch
3. Follow TDD workflow
4. Run `make verify` before committing
5. Submit a pull request

## Questions?

Check the documentation in `docs/` or open an issue for clarification.