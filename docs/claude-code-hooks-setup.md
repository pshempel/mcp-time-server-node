# Claude Code Hooks Configuration

## Current Status
- Hooks are configured in `.claude/settings.local.json`
- `/hooks` command shows they are loaded
- Hooks are NOT executing (as of this session)
- May require Claude Code restart to activate

## Configured Hooks

### 1. PreToolUse - Bash Command Blocker
- **File**: `./hooks/enforce-tool-usage.sh`
- **Purpose**: Blocks inefficient bash commands (grep, find, cat, etc.)
- **Status**: Script works when tested directly, not firing from Claude Code

### 2. PreToolUse - Shell Script Validator
- **File**: `./hooks/enforce-shellcheck.sh`
- **Purpose**: Validates shell scripts with shellcheck
- **Tools**: Write, Edit, MultiEdit

### 3. PostToolUse - Shellcheck Runner
- **File**: `./hooks/enforce-shellcheck.sh`
- **Purpose**: Runs shellcheck after file operations

### 4. UserPromptSubmit - Tool Usage Reminder
- **Command**: Inline echo reminder
- **Purpose**: Reminds about using proper Claude Code tools

## Testing Hooks

To verify hooks are working:
```bash
# This should be blocked if hooks are active
grep "test" package.json

# This should work (not blocked)
rg "test" package.json
```

## Troubleshooting

If hooks aren't working:
1. Check `/hooks` command output
2. Restart Claude Code
3. Verify `.claude/settings.local.json` exists
4. Check hook scripts are executable (`chmod +x`)
5. Test scripts directly with JSON input

## Hook Script Requirements

1. Must exit with code 1 to block execution
2. Must read JSON from stdin
3. Should write errors to stderr
4. Can modify parameters by outputting new JSON to stdout

See `docs/claude-code-hooks-reference.md` for full documentation.