#!/usr/bin/env python3
"""
Enhanced Stress Tester with Configuration Support
================================================
Builds on SimpleStressTester with file-based logging and better reporting.
"""

import json
import time
from datetime import datetime
from pathlib import Path

from stress_test import SimpleStressTester
import config


class ConfigurableStressTester(SimpleStressTester):
    """Stress tester that uses configuration and provides better output"""
    
    def __init__(self, server_cmd=None):
        """Initialize with config values"""
        super().__init__(server_cmd or config.SERVER_COMMAND)
        self.results_file = None
        self.start_timestamp = None
        
    def start_server(self):
        """Start server with configured wait time"""
        super().start_server()
        time.sleep(config.SERVER_STARTUP_TIME)
        
    def hammer_server(self, seconds=None, scenario='standard'):
        """Enhanced hammer with file logging and progress updates"""
        if seconds is None:
            seconds = config.TEST_SCENARIOS[scenario]['duration']
            
        self.start_timestamp = datetime.now()
        timestamp_str = self.start_timestamp.strftime('%Y%m%d_%H%M%S')
        
        # Setup results file
        self.results_file = config.RESULTS_DIR / config.DETAIL_FILE_PATTERN.format(
            timestamp=timestamp_str
        )
        
        print(f"\nRunning {scenario} scenario for {seconds} seconds")
        # Show relative path
        relative_path = self.results_file.relative_to(config.PROJECT_ROOT) if self.results_file.is_relative_to(config.PROJECT_ROOT) else self.results_file.name
        print(f"Results will be saved to: {relative_path}")
        print("=" * 60)
        
        # Initialize detailed results
        detailed_results = {
            'test_info': {
                'scenario': scenario,
                'description': config.TEST_SCENARIOS[scenario]['description'],
                'duration': seconds,
                'start_time': self.start_timestamp.isoformat(),
                'server_command': 'node dist/index.js'  # Don't expose full path
            },
            'memory_snapshots': [],
            'request_batches': [],
            'errors': []
        }
        
        # Run the actual test with progress updates
        start_time = time.time()
        start_memory = self.check_memory()
        
        results = {
            'total_requests': 0,
            'errors': 0,
            'duration': 0,
            'memory_start': start_memory,
            'memory_end': 0,
            'memory_leak_detected': False
        }
        
        # Take initial memory snapshot
        detailed_results['memory_snapshots'].append({
            'time': 0,
            'memory_mb': start_memory,
            'requests_so_far': 0
        })
        
        request_id = 1
        last_update = start_time
        last_memory_check = start_time
        batch_requests = 0
        batch_errors = 0
        
        while time.time() - start_time < seconds:
            # Make request based on scenario
            request = self._create_request(scenario, request_id)
            response = self.send_request(request)
            
            results['total_requests'] += 1
            batch_requests += 1
            
            if response is None or 'error' in response:
                results['errors'] += 1
                batch_errors += 1
                if len(detailed_results['errors']) < 10:  # Keep first 10 errors
                    detailed_results['errors'].append({
                        'request_id': request_id,
                        'time': time.time() - start_time,
                        'error': str(response) if response else 'No response'
                    })
            
            # Progress update
            if config.SHOW_PROGRESS and time.time() - last_update > config.PROGRESS_UPDATE_INTERVAL:
                elapsed = time.time() - start_time
                current_mem = self.check_memory()
                print(f"Progress: {results['total_requests']} requests, "
                      f"{results['errors']} errors, "
                      f"{elapsed:.1f}s elapsed, "
                      f"Memory: {current_mem:.1f} MB")
                last_update = time.time()
            
            # Memory check
            if time.time() - last_memory_check > config.MEMORY_CHECK_INTERVAL:
                current_mem = self.check_memory()
                detailed_results['memory_snapshots'].append({
                    'time': time.time() - start_time,
                    'memory_mb': current_mem,
                    'requests_so_far': results['total_requests']
                })
                last_memory_check = time.time()
            
            # Batch reporting
            if batch_requests >= config.REQUESTS_PER_BATCH:
                detailed_results['request_batches'].append({
                    'time': time.time() - start_time,
                    'requests': batch_requests,
                    'errors': batch_errors,
                    'avg_memory': self.check_memory()
                })
                batch_requests = 0
                batch_errors = 0
            
            request_id += 1
            time.sleep(config.REQUEST_DELAY)
        
        # Final measurements
        results['duration'] = time.time() - start_time
        results['memory_end'] = self.check_memory()
        results['memory_leak_detected'] = self.is_memory_leak(
            start_memory, results['memory_end'], config.MEMORY_LEAK_THRESHOLD
        )
        
        # Final memory snapshot
        detailed_results['memory_snapshots'].append({
            'time': results['duration'],
            'memory_mb': results['memory_end'],
            'requests_so_far': results['total_requests']
        })
        
        # Add summary to detailed results
        detailed_results['summary'] = results
        
        # Save detailed results
        with open(self.results_file, 'w') as f:
            json.dump(detailed_results, f, indent=2)
        
        # Update summary file
        self._update_summary(scenario, results)
        
        return results
    
    def _create_request(self, scenario, request_id):
        """Create request based on scenario"""
        base_request = {
            "jsonrpc": "2.0",
            "id": request_id,
        }
        
        request_type = config.TEST_SCENARIOS[scenario]['request_type']
        
        if request_type == 'get_current_time':
            base_request.update({
                "method": "tools/call",
                "params": {
                    "name": "get_current_time",
                    "arguments": {"timezone": "UTC"}
                }
            })
        elif request_type == 'unique_timezones':
            # Create unique timezone to flood cache
            base_request.update({
                "method": "tools/call",
                "params": {
                    "name": "get_current_time",
                    "arguments": {"timezone": f"Test/Zone{request_id}"}
                }
            })
        elif request_type == 'invalid':
            base_request.update({
                "method": "tools/call",
                "params": {
                    "name": "nonexistent_tool",
                    "arguments": {}
                }
            })
        elif request_type == 'mixed':
            # Mix valid and invalid
            if request_id % 3 == 0:
                return self._create_request('invalid', request_id)
            else:
                return self._create_request('standard', request_id)
        
        return base_request
    
    def _update_summary(self, scenario, results):
        """Update summary file with latest test results"""
        summary = {}
        if config.SUMMARY_FILE.exists():
            with open(config.SUMMARY_FILE, 'r') as f:
                summary = json.load(f)
        
        if 'tests' not in summary:
            summary['tests'] = []
        
        summary['tests'].append({
            'timestamp': self.start_timestamp.isoformat(),
            'scenario': scenario,
            'duration': results['duration'],
            'total_requests': results['total_requests'],
            'errors': results['errors'],
            'memory_start': results['memory_start'],
            'memory_end': results['memory_end'],
            'memory_leak_detected': results['memory_leak_detected'],
            'results_file': str(self.results_file.name)
        })
        
        # Keep only last N tests
        if len(summary['tests']) > 100:
            summary['tests'] = summary['tests'][-100:]
        
        with open(config.SUMMARY_FILE, 'w') as f:
            json.dump(summary, f, indent=2)
    
    def print_summary(self, results):
        """Print a nice summary of results"""
        print("\n" + "=" * 60)
        print("Test Summary")
        print("=" * 60)
        print(f"Total requests: {results['total_requests']:,}")
        print(f"Errors: {results['errors']} "
              f"({results['errors']/results['total_requests']*100:.1f}%)")
        print(f"Duration: {results['duration']:.1f}s")
        print(f"Requests/sec: {results['total_requests'] / results['duration']:.1f}")
        print(f"\nMemory:")
        print(f"  Start: {results['memory_start']:.1f} MB")
        print(f"  End: {results['memory_end']:.1f} MB")
        print(f"  Growth: {results['memory_end'] - results['memory_start']:.1f} MB "
              f"({(results['memory_end'] - results['memory_start']) / results['memory_start'] * 100:.1f}%)")
        
        if results['memory_leak_detected']:
            print("\n❌ MEMORY LEAK DETECTED!")
        else:
            print("\n✅ No memory leak detected")
        
        # Show relative paths
        results_rel = self.results_file.relative_to(config.PROJECT_ROOT) if self.results_file.is_relative_to(config.PROJECT_ROOT) else self.results_file.name
        summary_rel = config.SUMMARY_FILE.relative_to(config.PROJECT_ROOT) if config.SUMMARY_FILE.is_relative_to(config.PROJECT_ROOT) else config.SUMMARY_FILE.name
        
        print(f"\nDetailed results saved to: {results_rel}")
        print(f"Summary updated in: {summary_rel}")