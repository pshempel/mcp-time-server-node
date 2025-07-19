.PHONY: help install build test test-watch coverage lint lint-fix clean verify commit-tool dev

# Default target
help:
	@echo "Available targets:"
	@echo "  install      - Install dependencies"
	@echo "  build        - Build TypeScript files"
	@echo "  test         - Run tests"
	@echo "  test-watch   - Run tests in watch mode"
	@echo "  coverage     - Run tests with coverage report"
	@echo "  lint         - Run ESLint"
	@echo "  lint-fix     - Run ESLint with auto-fix"
	@echo "  clean        - Clean build artifacts and coverage"
	@echo "  verify       - Run all checks (lint, test, build)"
	@echo "  commit-tool  - Commit a new tool implementation"
	@echo "  dev          - Start development mode"

# Install dependencies
install:
	npm install

# Build TypeScript
build: clean
	npm run build

# Run tests
test:
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

# Clean build artifacts
clean:
	rm -rf dist coverage

# Run all verification steps (useful before commits)
verify: lint test build
	@echo "✅ All checks passed!"

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
.PHONY: status check-coverage todo

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