.PHONY: help install build test test-watch test-quick coverage lint lint-fix clean deep-clean fix-jest reset verify commit-tool dev git-check

# Default target
help:
	@echo "Available targets:"
	@echo "  install      - Install dependencies"
	@echo "  build        - Build TypeScript files"
	@echo "  test         - Run tests (excludes meta tests)"
	@echo "  test-meta    - Run meta tests (quality analysis)"
	@echo "  test-watch   - Run tests in watch mode"
	@echo "  coverage     - Run tests with coverage report"
	@echo "  lint         - Run ESLint"
	@echo "  lint-fix     - Run ESLint with auto-fix"
	@echo "  clean        - Clean build artifacts and coverage"
	@echo "  deep-clean   - Clean everything including node_modules"
	@echo "  fix-jest     - Fix Jest module resolution issues"
	@echo "  reset        - Full environment reset (deep-clean + reinstall)"
	@echo "  verify       - Run all checks (lint, test, build)"
	@echo "  test-quality - Analyze test quality and find fake tests"
	@echo "  test-audit   - Full test audit with detailed report"
	@echo "  commit-tool  - Commit a new tool implementation"
	@echo "  dev          - Start development mode"
	@echo "  run          - Run the MCP server"
	@echo "  pack         - Create npm package (mcp-time-server-*.tgz)"
	@echo "  setup        - Initial setup (install + build)"

# Install dependencies
install:
	npm install

# Build TypeScript
build: clean
	npm run build

# Run tests
test:
	npm test

# Run meta tests (quality analysis)
test-meta:
	npm run test:meta

# Run tests with MCP reload reminder
test-verify:
	npm run test:verify

# Quick test after fixing issues
test-quick: fix-jest
	@echo "🧪 Running tests after Jest fix..."
	npm test

# Run tests in watch mode for TDD
test-watch:
	npm test -- --watch

# Run tests with coverage
coverage:
	npm run test:coverage

# Run linter
lint:
	npm run lint

# Run linter with auto-fix
lint-fix:
	npm run lint -- --fix

# Python linting for stress tests
lint-python:
	@echo "🐍 Linting Python stress tests..."
	@if command -v flake8 >/dev/null 2>&1; then \
		flake8 tests/stress/ || true; \
	else \
		echo "⚠️  flake8 not installed. Install with: sudo apt install python3-flake8"; \
	fi

# Clean build artifacts
clean:
	rm -rf dist coverage

# Deep clean - for module resolution issues
deep-clean: clean
	@echo "🧹 Deep cleaning for module resolution issues..."
	rm -rf node_modules package-lock.json
	npx jest --clearCache 2>/dev/null || true
	@echo "✅ Deep clean complete"

# Reset - full environment reset
reset: deep-clean
	@echo "🔄 Full environment reset..."
	npm install
	npm run build
	@echo "✅ Reset complete. Run 'make test' to verify"

# Fix Jest issues specifically
fix-jest:
	@echo "🔧 Fixing Jest module resolution..."
	npx jest --clearCache
	rm -rf dist
	npm run build
	@echo "✅ Jest fix applied. Running tests..."
	npm test || echo "⚠️  If tests still fail, try 'make reset'"

# Run all verification steps (useful before commits)
verify: lint test build
	@echo "✅ All checks passed!"
	@node scripts/post-test-reminder.js

# Helper for committing a new tool
commit-tool:
	@echo "Which tool did you implement?"
	@echo "1) get_current_time"
	@echo "2) convert_timezone"
	@echo "3) add_time"
	@echo "4) subtract_time"
	@echo "5) calculate_duration"
	@echo "6) get_business_days"
	@echo "7) next_occurrence"
	@echo "8) format_time"
	@read -p "Enter number: " tool_num; \
	case $$tool_num in \
		1) tool_name="get_current_time" ;; \
		2) tool_name="convert_timezone" ;; \
		3) tool_name="add_time" ;; \
		4) tool_name="subtract_time" ;; \
		5) tool_name="calculate_duration" ;; \
		6) tool_name="get_business_days" ;; \
		7) tool_name="next_occurrence" ;; \
		8) tool_name="format_time" ;; \
		*) echo "Invalid selection"; exit 1 ;; \
	esac; \
	git add -A && \
	git commit -m "feat: implement $$tool_name tool"

# Development mode
dev:
	@echo "Starting development mode..."
	@echo "Run 'make test-watch' in another terminal for TDD"
	npm run dev

# TDD workflow for a new tool
.PHONY: tdd-research tdd-test tdd-implement tdd-cycle

tdd-research:
	@echo "Creating research script for date-fns behavior..."
	@read -p "Enter tool name (e.g., convert_timezone): " tool_name; \
	echo "#!/usr/bin/env ts-node\n\nimport { format } from 'date-fns';\nimport { toZonedTime, formatInTimeZone } from 'date-fns-tz';\n\nconsole.log('=== Researching $$tool_name behavior ===\\n');\n\n// Add your research code here\n\nconsole.log('\\n=== End of research ===');" > scripts/research-$$tool_name.ts && \
	chmod +x scripts/research-$$tool_name.ts && \
	echo "Created scripts/research-$$tool_name.ts"

tdd-test:
	@read -p "Enter tool name (e.g., convertTimezone): " tool_name; \
	echo "Creating test file tests/tools/$$tool_name.test.ts..." && \
	touch tests/tools/$$tool_name.test.ts && \
	echo "Created tests/tools/$$tool_name.test.ts"

tdd-implement:
	@read -p "Enter tool name (e.g., convertTimezone): " tool_name; \
	echo "Creating implementation file src/tools/$$tool_name.ts..." && \
	touch src/tools/$$tool_name.ts && \
	echo "Created src/tools/$$tool_name.ts"

# Full TDD cycle helper
tdd-cycle:
	@echo "Starting TDD cycle for a new tool..."
	@echo "1. Research library behavior"
	@echo "2. Write tests based on research"
	@echo "3. Implement to pass tests"
	@echo "4. Verify coverage and lint"
	@echo ""
	@read -p "Ready to start? (y/n): " confirm; \
	if [ "$$confirm" = "y" ]; then \
		make tdd-research && \
		echo "\n✅ Research script created. Run it to verify library behavior" && \
		echo "📝 When ready, run 'make tdd-test' to create test file"; \
	fi

# Quick status check
.PHONY: status check-coverage todo verify-holidays

status:
	@echo "📊 Project Status:"
	@echo "==================="
	@git status --short
	@echo ""
	@echo "📦 Dependencies:"
	@npm list --depth=0 2>/dev/null | grep -E "(date-fns|@modelcontextprotocol)" || echo "Run 'make install'"
	@echo ""
	@echo "🧪 Test Summary:"
	@npm test 2>&1 | grep -E "(Test Suites:|Tests:)" || echo "No tests run yet"

check-coverage:
	@echo "📈 Coverage Report:"
	@npm run test:coverage 2>&1 | grep -A 20 "File.*%" || echo "Run 'make coverage' first"

todo:
	@echo "📝 TODO items in code:"
	@grep -r "TODO\|FIXME\|XXX" src tests --exclude-dir=node_modules 2>/dev/null || echo "No TODOs found"

verify-holidays:
	@echo "🎯 Verifying Holiday Data"
	@echo "========================"
	@npm test holidays.verification
	@echo "\n✅ Holiday verification complete!"
	@echo "📚 See: docs/verified-behaviors/holiday-automated-verification.md"

# Test quality targets
test-quality:
	@echo "🔍 Analyzing Test Quality (Quick Check)..."
	@echo "========================================"
	@echo "Running test quality meta-tests..."
	@npm test tests/meta/test-quality.test.ts --silent 2>&1 | grep -E "(FAIL|PASS|✓|✕)" || true
	@echo "\n📊 For detailed report, run 'make test-audit'"

test-audit:
	@echo "🔎 Running Comprehensive Test Audit..."
	@echo "====================================="
	@npm test tests/meta/test-quality.test.ts
	@echo "\n📄 Reports generated:"
	@echo "  - test-quality-report.txt (human-readable summary)"
	@echo "  - test-assertion-report.json (detailed analysis)"
	@echo "\n📈 Summary from test-quality-report.txt:"
	@head -10 test-quality-report.txt 2>/dev/null || echo "No report generated yet"

fix-fake-tests:
	@echo "🔧 Fixing Fake Tests..."
	@echo "======================="
	@echo "Running ESLint to identify tests without assertions..."
	@npx eslint tests/**/*.test.ts --fix

# Development helpers
.PHONY: clean-research watch-all pre-commit

clean-research:
	@echo "Cleaning research scripts..."
	rm -f scripts/research-*.ts scripts/verify-*.ts
	@echo "✅ Research scripts cleaned"

watch-all:
	@echo "Starting watchers in parallel..."
	@echo "This will run tests and TypeScript compiler in watch mode"
	npx concurrently "npm run test -- --watch" "npm run build -- --watch"

pre-commit:
	@echo "Running pre-commit checks..."
	make verify
	@echo "✅ Ready to commit!"

# Git workflow helpers for refactoring
.PHONY: git-check git-phase git-sync

git-check:
	@echo "🔍 Git Refactoring Check"
	@echo "======================="
	@current_branch=$$(git branch --show-current); \
	if [ "$$current_branch" = "main" ]; then \
		echo "❌ ERROR: On main branch!"; \
		echo "📖 Read: docs/GIT_REFACTORING_STRATEGY.md"; \
		echo ""; \
		echo "Quick fix:"; \
		echo "  git checkout refactor/deduplication-initiative"; \
		exit 1; \
	elif [ "$$current_branch" = "refactor/deduplication-initiative" ]; then \
		echo "✅ On refactor branch"; \
		echo ""; \
		echo "Next: Create phase branch with 'make git-phase'"; \
	elif echo "$$current_branch" | grep -q "^phase-"; then \
		echo "✅ On phase branch: $$current_branch"; \
		echo ""; \
		echo "Remember:"; \
		echo "- Atomic commits (one logical change)"; \
		echo "- Run 'make verify' before each commit"; \
		echo "- Include metrics in commit messages"; \
	else \
		echo "⚠️  On branch: $$current_branch"; \
		echo "📖 Check: docs/GIT_REFACTORING_STRATEGY.md"; \
	fi; \
	echo ""; \
	echo "📊 Current status:"; \
	git status --short

git-phase:
	@echo "🚀 Create Phase Branch"
	@echo "===================="
	@current_branch=$$(git branch --show-current); \
	if [ "$$current_branch" != "refactor/deduplication-initiative" ]; then \
		echo "❌ Must be on refactor/deduplication-initiative branch"; \
		echo "Run: git checkout refactor/deduplication-initiative"; \
		exit 1; \
	fi; \
	echo "Phase options:"; \
	echo "  0: safety-net"; \
	echo "  1: date-parser"; \
	echo "  2: cache-wrapper"; \
	echo "  3: timezone-resolver"; \
	echo "  4: error-factory"; \
	echo "  5: debug-logger"; \
	read -p "Enter phase number: " phase_num; \
	case $$phase_num in \
		0) phase_name="safety-net" ;; \
		1) phase_name="date-parser" ;; \
		2) phase_name="cache-wrapper" ;; \
		3) phase_name="timezone-resolver" ;; \
		4) phase_name="error-factory" ;; \
		5) phase_name="debug-logger" ;; \
		*) echo "Invalid phase"; exit 1 ;; \
	esac; \
	git checkout -b "phase-$$phase_num/$$phase_name"; \
	echo "✅ Created branch: phase-$$phase_num/$$phase_name"; \
	echo ""; \
	echo "📝 Commit format for this phase:"; \
	echo "refactor(phase-$$phase_num): your description here"

git-sync:
	@echo "🔄 Syncing with main"
	@echo "=================="
	@current_branch=$$(git branch --show-current); \
	git checkout main && \
	git pull origin main && \
	git checkout $$current_branch && \
	git merge main -m "merge: sync with main ($$(date +%Y-%m-%d))"; \
	echo "✅ Synced with main"

# User-friendly targets for contributors
.PHONY: setup run pack

setup:
	@echo "🚀 Setting up MCP Time Server development environment..."
	npm install
	npm run build
	@echo "✅ Setup complete! Run 'make test' to verify everything works."

run:
	@echo "🏃 Running MCP Time Server..."
	node dist/index.js

pack:
	@echo "📦 Creating npm package..."
	npm pack
	@echo "✅ Package created! Check for mcp-time-server-*.tgz"