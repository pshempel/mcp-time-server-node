# Git Strategy for Major Refactoring

## The Linus Torvalds Approach

As Linus would say: "Bad programmers worry about the code. Good programmers worry about data structures and their relationships." In git, the history IS our data structure.

## Core Principles

1. **History Should Tell a Story**: Each commit should be a logical chapter that future developers can understand
2. **Always Be Bisectable**: Any commit should leave the codebase in a working state
3. **Branches Are Free**: Use them liberally, delete them aggressively
4. **Atomic Commits**: One logical change per commit, complete and self-contained
5. **Never Rewrite Public History**: Once it's on main, it's sacred

## Refactoring Branch Strategy

### The Master Plan: Topic Branch with Phase Sub-branches

```
main
  └── refactor/deduplication-initiative (long-lived feature branch)
       ├── phase-0/safety-net
       ├── phase-1/date-parser
       ├── phase-2/cache-wrapper
       ├── phase-3/timezone-resolver
       ├── phase-4/error-factory
       └── phase-5/debug-logger
```

### Why This Structure?

1. **Isolation**: The main refactor branch isolates the entire effort from main
2. **Granularity**: Each phase branch allows focused work and easy rollback
3. **Integration Points**: Merge each phase back to refactor branch when complete
4. **Clean History**: Squash merge phases to tell a coherent story
5. **Escape Hatch**: Can abandon any phase without affecting others

## Workflow

### 1. Initial Setup
```bash
# Create the main refactor branch
git checkout main
git pull origin main
git checkout -b refactor/deduplication-initiative

# Document the initiative
echo "Refactoring Initiative Started: $(date)" > refactor.log
git add refactor.log
git commit -m "refactor: initialize deduplication initiative

- Target: Reduce code duplication from 18% to <5%
- Approach: 6-phase TDD-driven refactoring
- Duration: 7-8 days estimated
- Safety: Feature flags for each phase"
```

### 2. Per-Phase Workflow
```bash
# Start a phase
git checkout refactor/deduplication-initiative
git checkout -b phase-0/safety-net

# Work on the phase with atomic commits
git add tests/integration/baseline/
git commit -m "test: add baseline integration tests for refactoring safety"

git add src/feature-flags/
git commit -m "feat: implement feature flag system for gradual rollout"

# When phase is complete, merge back
git checkout refactor/deduplication-initiative
git merge --no-ff phase-0/safety-net -m "refactor(phase-0): complete safety net implementation

- Added baseline integration tests (X new tests)
- Implemented feature flag system
- Documented current metrics:
  * Total complexity: X
  * Duplication: 18%
  * Coverage: 90%+"

# Delete the phase branch
git branch -d phase-0/safety-net
```

### 3. Daily Sync Pattern
```bash
# Each day, sync with main to avoid drift
git checkout main
git pull origin main
git checkout refactor/deduplication-initiative
git merge main -m "merge: sync with main ($(date +%Y-%m-%d))"
```

### 4. Commit Message Standards

#### Phase Commits
```
refactor(phase-X): [concise description]

- What was extracted/created
- Duplication removed: X lines
- Tests added/modified: X
- Complexity reduced: X → Y
- Feature flag: [flag name]
```

#### Individual Commits Within Phase
```
# Research/verification
research: verify date-fns parsing behavior for edge cases

# Test writing
test: add comprehensive tests for date parser utility

# Implementation
feat: implement universal date parser with timezone support

# Refactoring application
refactor: replace inline date parsing with dateParser utility
- Updated X files
- Removed Y lines of duplication
```

### 5. Integration Strategy

#### Option A: Single PR (Recommended for This Project)
After all phases complete:
```bash
# Ensure all tests pass
make verify

# Create comprehensive PR
git push origin refactor/deduplication-initiative
# Create PR with full description of all phases
```

#### Option B: Incremental PRs (If Needed)
After each phase:
```bash
# Create phase PR to main
git checkout -b refactor/phase-X-to-main
git cherry-pick [phase commits]
git push origin refactor/phase-X-to-main
```

## Emergency Procedures

### Abandoning a Phase
```bash
# If a phase goes wrong
git checkout refactor/deduplication-initiative
git reset --hard HEAD~1  # If merged
# Or simply delete the branch if not merged
git branch -D phase-X/failed-attempt
```

### Rollback via Feature Flags
```javascript
// Each phase has a flag
if (FEATURE_FLAGS.USE_DATE_PARSER_V2) {
  return dateParserV2(input);
} else {
  return legacyDateParsing(input);
}
```

## The Golden Rules

1. **Never commit directly to main during refactoring**
2. **Run `make verify` before EVERY commit**
3. **Each commit must pass all tests**
4. **Document complexity metrics in merge commits**
5. **Use feature flags for any risky changes**
6. **Keep phase branches short-lived (max 2 days)**
7. **Write meaningful commit messages - they're documentation**

## Metrics to Track in Commits

Include these in phase merge commits:
- Lines of duplication removed
- Complexity scores (before/after)
- Test count changes
- Performance impact (if any)
- Files affected count

## Example Timeline

```
Day 1: phase-0/safety-net (4 commits) → merge
Day 2-3: phase-1/date-parser (8 commits) → merge  
Day 4: phase-2/cache-wrapper (6 commits) → merge
Day 5: phase-3/timezone-resolver (6 commits) → merge
Day 6: phase-4/error-factory (4 commits) → merge
Day 7: phase-5/debug-logger (6 commits) → merge
Day 8: Final testing, PR to main
```

## Why This Works

As Linus says: "The only real complexity in git is merging, and we've made that cheap." This structure:

1. Keeps main stable
2. Allows experimentation without fear
3. Provides clear rollback points
4. Creates meaningful history
5. Enables parallel work if needed
6. Makes code review manageable

Remember: Git is a tool to make development easier. This structure serves the code, not the other way around.