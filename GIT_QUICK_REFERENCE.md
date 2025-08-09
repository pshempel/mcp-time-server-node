# Git Quick Reference - Refactoring

## 🚀 Daily Workflow

### 1. Start Your Day
```bash
make git-check      # Verify you're on right branch
make git-sync       # Sync with main (if needed)
```

### 2. Start New Phase
```bash
make git-phase      # Interactive phase branch creator
```

### 3. During Development
```bash
make verify         # Before EVERY commit
git add .
git commit          # Hook will help with message format
```

### 4. Commit Message Template
```
refactor(phase-X): concise description

- What changed: [describe the extraction/refactor]
- Metrics: complexity 29→8, removed 80 lines
- Tests: added 15, modified 8
- Files affected: 12
```

## 📏 Rules (The Linus Way)

1. **Every commit must pass tests** - No exceptions
2. **One logical change per commit** - Atomic commits
3. **Meaningful messages** - They're documentation
4. **Never commit to main** - Always use branches

## 🔧 Common Commands

```bash
# Check your branch
make git-check

# Create phase branch
make git-phase

# Sync with main
make git-sync

# Verify before commit
make verify

# See full strategy
cat docs/GIT_REFACTORING_STRATEGY.md
```

## ⚡ Quick Fixes

**Wrong branch?**
```bash
git checkout refactor/deduplication-initiative
```

**Forgot to run tests?**
```bash
git reset --soft HEAD~1    # Undo last commit
make verify                # Run tests
git commit -c ORIG_HEAD    # Recommit with same message
```

**Need metrics for commit?**
```bash
# Complexity
npx eslint src/tools/yourTool.ts

# Line count
wc -l src/tools/*.ts | grep -E "(yourTool|PATTERN)"
```

## 🎯 Phase Branches

- `phase-0/safety-net` - Baseline tests & feature flags
- `phase-1/date-parser` - Universal date parsing
- `phase-2/cache-wrapper` - Generic caching
- `phase-3/timezone-resolver` - Timezone handling
- `phase-4/error-factory` - Error standardization
- `phase-5/debug-logger` - Logging enhancement

Remember: Make the right thing easy!