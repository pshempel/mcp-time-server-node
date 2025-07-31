# Claude Code Hooks - Complete Reference

## What Are Hooks?

Hooks are shell commands that execute automatically at specific events during Claude Code sessions. They enable:
- Automated validation and enforcement
- Custom workflows
- Security checks
- Context injection

## Hook Types

### 1. **PreToolUse**
Runs BEFORE a tool executes. Can:
- Block tool execution (exit non-zero)
- Modify parameters (output new JSON)
- Validate inputs

### 2. **PostToolUse**
Runs AFTER a tool completes. Can:
- Process results
- Log actions
- Trigger follow-up actions

### 3. **UserPromptSubmit**
Runs when you submit a prompt. Can:
- Add context
- Log queries
- Inject reminders

### 4. **MainAgentStopped / SubAgentStopped**
Runs when agents complete tasks. Can:
- Summarize work
- Clean up resources
- Generate reports

### 5. **NotificationHook**
Handles notifications. Can:
- Log messages
- Send alerts
- Track events

### 6. **PreCompact**
Runs before context compaction. Can:
- Save important context
- Generate summaries
- Clean up

### 7. **SessionStart**
Runs at session beginning. Can:
- Set up environment
- Load context
- Display reminders

## Hook Input/Output

### Input (via stdin)
Hooks receive JSON with context:
```json
{
  "Tool": "Bash",
  "Parameters": {
    "command": "grep pattern file.txt"
  },
  "Timestamp": "2024-01-01T12:00:00Z",
  "SessionId": "abc123"
}
```

### Output
- **Exit 0**: Allow action to proceed
- **Exit non-zero**: Block action
- **stdout**: New parameters (for PreToolUse)
- **stderr**: Messages shown to user

## Configuration Format

In `.claude/settings.json`:
```json
{
  "PreToolUse": [
    {
      "Match": {
        "Tool": "Write",
        "Parameters": {
          "file_path": "*.py"  // Glob patterns supported
        }
      },
      "Command": "./hooks/validate-python.sh",
      "Description": "Validate Python files before writing"
    }
  ]
}
```

## Match Conditions

### Tool Matching
```json
// Single tool
"Match": { "Tool": "Bash" }

// Multiple tools
"Match": { "Tool": ["Write", "Edit", "MultiEdit"] }

// All tools
"Match": {}
```

### Parameter Matching
```json
// Exact match
"Match": {
  "Tool": "Write",
  "Parameters": {
    "file_path": "config.json"
  }
}

// Pattern match
"Match": {
  "Tool": "Write",
  "Parameters": {
    "file_path": "*.test.ts"
  }
}
```

## Common Use Cases

### 1. Security Validation
```bash
#!/bin/bash
# Block writes to sensitive files
json=$(cat)
file=$(echo "$json" | jq -r '.Parameters.file_path')

if [[ "$file" =~ \.(env|key|pem)$ ]]; then
    echo "❌ Cannot write to sensitive file: $file" >&2
    exit 1
fi
```

### 2. Auto-formatting
```bash
#!/bin/bash
# Format code after writing
json=$(cat)
file=$(echo "$json" | jq -r '.Parameters.file_path')

if [[ "$file" =~ \.ts$ ]]; then
    prettier --write "$file"
fi
```

### 3. Test Running
```bash
#!/bin/bash
# Run tests after code changes
json=$(cat)
file=$(echo "$json" | jq -r '.Parameters.file_path')

if [[ "$file" =~ \.(ts|js)$ ]] && [[ ! "$file" =~ \.test\. ]]; then
    echo "Running tests for $file..." >&2
    npm test -- "$file"
fi
```

### 4. Context Injection
```bash
#!/bin/bash
# Add project-specific context
cat <<EOF >&2
Remember:
- Follow TDD approach
- Check research docs before implementing
- Run 'make verify' before committing
EOF
```

## Best Practices

### 1. Fast Execution
Hooks run synchronously - keep them fast:
```bash
# Good: Quick check
[[ "$file" =~ \.sh$ ]] && echo "Check shellcheck"

# Bad: Slow operation
npm test  # Could take minutes
```

### 2. Clear Messages
Always explain why something was blocked:
```bash
# Good
echo "❌ BLOCKED: Use 'Grep' tool instead of grep command" >&2
echo "✅ Example: Grep({ pattern: 'TODO', path: 'src/' })" >&2

# Bad
echo "Error" >&2
exit 1
```

### 3. Proper Error Handling
```bash
set -euo pipefail  # Exit on errors
json=$(cat)        # Capture input
# ... process ...
exit 0             # Explicit exit
```

### 4. Use jq for JSON
```bash
# Extract nested values safely
tool=$(echo "$json" | jq -r '.Tool // empty')
command=$(echo "$json" | jq -r '.Parameters.command // empty')

# Check if values exist
if [ -z "$tool" ]; then
    echo "No tool specified" >&2
    exit 1
fi
```

## Testing Hooks

### Manual Testing
```bash
# Test specific input
echo '{"Tool": "Bash", "Parameters": {"command": "grep test"}}' | ./hooks/my-hook.sh

# Check exit code
echo $?
```

### Test Script
```bash
#!/bin/bash
# test-hooks.sh
test_cases=(
    '{"Tool": "Bash", "Parameters": {"command": "grep pattern"}}'
    '{"Tool": "Write", "Parameters": {"file_path": "test.sh"}}'
)

for json in "${test_cases[@]}"; do
    echo "Testing: $json"
    echo "$json" | ./hooks/my-hook.sh
    echo "Exit code: $?"
    echo "---"
done
```

## Debugging Hooks

### Enable Debug Output
```bash
#!/bin/bash
# Add debug flag
DEBUG=${DEBUG:-false}

if [ "$DEBUG" = "true" ]; then
    set -x  # Print commands
    exec 2>/tmp/hook-debug.log  # Log stderr
fi
```

### Log All Inputs
```bash
# Log inputs for debugging
echo "$json" >> /tmp/hook-inputs.log
```

## Performance Considerations

1. **Hooks block execution** - Keep them fast (<100ms)
2. **Avoid network calls** - Can timeout or fail
3. **Cache results** - Don't repeat expensive checks
4. **Use background tasks** - For slow operations

## Security Notes

1. Hooks run with your user permissions
2. Validate all inputs from JSON
3. Use quotes to prevent injection: `"$var"`
4. Don't store secrets in hooks

## Our Implementation

We use hooks for:
1. **Tool enforcement** - Block inefficient commands
2. **Code quality** - Run shellcheck automatically
3. **Reminders** - Keep TDD philosophy front of mind

This creates an active learning environment where Claude Code is guided toward best practices automatically!