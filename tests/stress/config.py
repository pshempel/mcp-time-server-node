#!/usr/bin/env python3
"""
Stress Test Configuration
=========================
All configuration in one place. Easy to understand, easy to modify.
No magic, no hidden settings.
"""

import os
from pathlib import Path

# Base paths
PROJECT_ROOT = Path(__file__).parent.parent.parent
STRESS_TEST_DIR = Path(__file__).parent

# Server configuration
SERVER_COMMAND = ['node', str(PROJECT_ROOT / 'dist' / 'index.js')]
SERVER_STARTUP_TIME = 2  # seconds to wait for server to start

# Test durations (seconds)
QUICK_TEST_DURATION = 10
STANDARD_TEST_DURATION = 60
SUSTAINED_TEST_DURATION = 300  # 5 minutes

# Memory leak detection
MEMORY_LEAK_THRESHOLD = 0.5  # 50% growth = potential leak
MEMORY_CHECK_INTERVAL = 30   # Check memory every N seconds

# Request configuration
REQUEST_DELAY = 0.01  # Delay between requests (seconds)
REQUESTS_PER_BATCH = 100  # For progress reporting

# Output configuration
RESULTS_DIR = STRESS_TEST_DIR / 'results'
LOG_DIR = STRESS_TEST_DIR / 'logs'
SUMMARY_FILE = RESULTS_DIR / 'summary.json'
DETAIL_FILE_PATTERN = 'stress_test_{timestamp}.json'

# Console output
SHOW_PROGRESS = True  # Show progress during tests
PROGRESS_UPDATE_INTERVAL = 10  # Update console every N seconds

# Create directories if they don't exist
RESULTS_DIR.mkdir(exist_ok=True)
LOG_DIR.mkdir(exist_ok=True)

# Test scenarios
TEST_SCENARIOS = {
    'standard': {
        'description': 'Standard memory leak test with normal requests',
        'duration': STANDARD_TEST_DURATION,
        'request_type': 'get_current_time'
    },
    'cache_flood': {
        'description': 'Flood cache with unique timezone requests',
        'duration': QUICK_TEST_DURATION,
        'request_type': 'unique_timezones'
    },
    'invalid_requests': {
        'description': 'Send invalid requests to test error handling',
        'duration': QUICK_TEST_DURATION,
        'request_type': 'invalid'
    },
    'mixed': {
        'description': 'Mix of valid and invalid requests',
        'duration': STANDARD_TEST_DURATION,
        'request_type': 'mixed'
    }
}

# Logging configuration
LOG_LEVEL = 'INFO'  # DEBUG, INFO, WARNING, ERROR
MAX_LOG_SIZE_MB = 10
KEEP_LAST_N_LOGS = 5

# Report format
REPORT_FORMAT = {
    'show_memory_graph': True,
    'show_request_stats': True,
    'show_error_details': False,  # Set True for debugging
    'timestamp_format': '%Y-%m-%d %H:%M:%S'
}


def get_config_summary():
    """Return a human-readable config summary"""
    # Make paths relative for display
    results_dir = RESULTS_DIR.relative_to(PROJECT_ROOT) if RESULTS_DIR.is_relative_to(PROJECT_ROOT) else RESULTS_DIR.name
    log_dir = LOG_DIR.relative_to(PROJECT_ROOT) if LOG_DIR.is_relative_to(PROJECT_ROOT) else LOG_DIR.name
    
    return f"""
Stress Test Configuration
========================
Server: node dist/index.js
Results: {results_dir}
Logs: {log_dir}

Test Durations:
  Quick: {QUICK_TEST_DURATION}s
  Standard: {STANDARD_TEST_DURATION}s
  Sustained: {SUSTAINED_TEST_DURATION}s

Memory Leak Threshold: {MEMORY_LEAK_THRESHOLD * 100}%
Request Delay: {REQUEST_DELAY * 1000}ms

Available Scenarios:
{chr(10).join(f"  - {k}: {v['description']}" for k, v in TEST_SCENARIOS.items())}
"""


if __name__ == "__main__":
    # Print config when run directly
    print(get_config_summary())