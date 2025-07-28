# MCP Time Server Stress Testing

Simple, configurable stress testing for the MCP Time Server.

## Quick Start

```bash
# Run a standard 60-second memory leak test
python3 tests/stress/run_stress_test.py

# Run a quick 10-second test
python3 tests/stress/run_stress_test.py quick

# Run a 5-minute sustained test
python3 tests/stress/run_stress_test.py sustained

# Run cache flooding test
python3 tests/stress/run_stress_test.py cache_flood
```

## Configuration

All configuration is in `config.py`. No hidden settings, no magic.

```bash
# Show current configuration
python3 tests/stress/run_stress_test.py --config

# List available test scenarios
python3 tests/stress/run_stress_test.py --list-scenarios
```

## Key Settings in config.py

- **MEMORY_LEAK_THRESHOLD**: 0.5 (50% growth = potential leak)
- **REQUEST_DELAY**: 0.01 seconds between requests
- **Test Durations**:
  - Quick: 10 seconds
  - Standard: 60 seconds  
  - Sustained: 300 seconds (5 minutes)

## Output

Results are saved in two places:

1. **Summary**: `results/summary.json` - Overview of all tests
2. **Details**: `results/stress_test_YYYYMMDD_HHMMSS.json` - Full test details

Logs are kept in `logs/` directory.

## Test Scenarios

- **standard**: Normal requests to test memory leaks
- **cache_flood**: Unique requests to flood the cache
- **invalid_requests**: Invalid requests to test error handling
- **mixed**: Combination of valid and invalid requests

## Understanding Results

✅ **No leak detected**: Memory growth < 50%
❌ **Leak detected**: Memory growth > 50%

Normal patterns:
- Initial spike (V8 warm-up) then stabilization
- Small fluctuations due to garbage collection
- Growth < 50% over test duration

## Requirements

- Python 3.7+
- psutil (`sudo apt install python3-psutil`)

## Development

Run tests:
```bash
python3 tests/stress/test_memory_leak.py
python3 tests/stress/test_hammer_server.py
```

Lint code:
```bash
make lint-python
```