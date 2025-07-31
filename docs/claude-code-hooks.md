# Claude Code Hooks Configuration

## Overview

We use Claude Code hooks to enforce proper tool usage and prevent common mistakes. This is proactive enforcement instead of relying on documentation.

## Current Hooks

### 1. Enforce Tool Usage (`hooks/enforce-tool-usage.sh`)

**Purpose**: Blocks inefficient bash commands and suggests proper Claude Code tools.

**Blocked Commands**:
- `grep` → Use `Grep` tool or `rg`
- `find` → Use `Glob` tool or `rg --files`
- `cat` → Use `Read` tool
- `head/tail` → Use `Read` tool with offset/limit
- `ls` → Use `LS` tool
- `sed` → Use `Edit` or `MultiEdit` tool
- `awk` → Use `Read` tool and process in code

**Special Cases**:
- Blocks `npm test | grep` patterns
- Warns about `2>&1` hiding Node.js errors

## Configuration

The hooks are configured in `.claude/settings.json`:

```json
{
  "PreToolUse": [
    {
      "Match": { "Tool": "Bash" },
      "Command": "./hooks/enforce-tool-usage.sh"
    }
  ]
}
```

## How It Works

1. When Claude tries to use `Bash` tool
2. Hook receives JSON with the command
3. Hook checks for blocked patterns
4. If found, exits with code 1 and helpful message
5. Claude must use the proper tool instead

## Benefits

- **Immediate feedback** - No waiting to realize mistake
- **Consistent tool usage** - Always use the most efficient tool
- **Better performance** - `rg` is faster than `find/grep`
- **No hidden errors** - Prevents `2>&1` masking issues

## Examples

### Blocked:
```bash
# These will be blocked:
grep "TODO" src/
find . -name "*.test.ts"
cat package.json
ls -la tests/
npm test 2>&1 | grep fail
```

### Allowed:
```bash
# These are fine:
rg "TODO" src/
rg --files -g "*.test.ts"
make test
npm install
git status
```

### Claude will use:
```typescript
// Instead of blocked commands:
Grep({ pattern: "TODO", path: "src/" })
Glob({ pattern: "**/*.test.ts" })
Read({ file_path: "package.json" })
LS({ path: "tests/" })
```

## Adding New Rules

To add new blocked commands:

1. Edit `hooks/enforce-tool-usage.sh`
2. Add to the `blocked_commands` array
3. Add example in the case statement
4. Test with `hooks/test-hook.sh`

## Testing Hooks

```bash
# Test all blocked patterns
./hooks/test-hook.sh

# Test specific command
echo '{"Tool": "Bash", "Parameters": {"command": "grep test"}}' | ./hooks/enforce-tool-usage.sh
```

## Why This Approach?

1. **Active vs Passive** - Enforces at runtime, not just documents
2. **Immediate** - Catches mistakes before they happen
3. **Educational** - Provides correct alternative every time
4. **Consistent** - Same rules every session

This ensures Claude Code always uses the most efficient tools available!