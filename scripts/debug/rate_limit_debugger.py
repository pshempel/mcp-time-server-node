#!/usr/bin/env python3
"""
Rate Limiting Debugger

Specifically tests rate limiting functionality with various scenarios.
Useful for debugging rate limiting configuration and bypass detection.

Usage:
    python3 tools/debug/rate_limit_debugger.py
    python3 tools/debug/rate_limit_debugger.py --scenario burst
    python3 tools/debug/rate_limit_debugger.py --scenario bypass --connections 3
"""

import subprocess
import json
import time
import os
import argparse
from pathlib import Path
from typing import Dict, List, Any

class RateLimitDebugger:
    """Debug rate limiting functionality and detect bypasses"""
    
    def __init__(self, server_path: str = None):
        """Initialize debugger"""
        self.project_root = Path(__file__).parent.parent.parent
        self.server_path = server_path or str(self.project_root / 'dist' / 'index.js')
        
    def test_burst_scenario(self, limit: int = 3, window_ms: int = 5000) -> Dict[str, Any]:
        """Test burst requests at rate limit"""
        print(f"🚀 Burst Rate Limit Test")
        print(f"Limit: {limit}, Window: {window_ms}ms")
        print(f"Sending {limit + 2} requests rapidly...")
        
        results = self._run_single_server_test(limit, window_ms, limit + 2)
        
        # Analysis
        expected_success = limit
        expected_limited = (limit + 2) - limit
        
        print(f"\n📊 Results:")
        print(f"Successful: {results['successful']} (expected: {expected_success})")
        print(f"Rate limited: {results['rate_limited']} (expected: {expected_limited})")
        
        if results['successful'] == expected_success and results['rate_limited'] == expected_limited:
            print("✅ Rate limiting working correctly")
        else:
            print("❌ Rate limiting bypass detected!")
            
        return results
    
    def test_bypass_scenario(self, connections: int = 3, limit: int = 2) -> Dict[str, Any]:
        """Test parallel connection bypass"""
        print(f"🔍 Parallel Connection Bypass Test")
        print(f"Connections: {connections}, Limit per connection: {limit}")
        print(f"Expected max total requests: {limit} (if no bypass)")
        print(f"Actual max if bypassed: {connections * limit}")
        
        # Set environment
        env = os.environ.copy()
        env['RATE_LIMIT'] = str(limit)
        env['RATE_LIMIT_WINDOW'] = '10000'
        
        servers = []
        total_successful = 0
        total_limited = 0
        
        try:
            # Start multiple servers (simulating parallel connections)
            for i in range(connections):
                print(f"Starting connection {i+1}...")
                process = subprocess.Popen(
                    ['node', self.server_path],
                    stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    env=env,
                    text=True,
                    bufsize=0
                )
                servers.append(process)
                time.sleep(0.5)  # Stagger startup
            
            # Test each connection
            for i, server in enumerate(servers):
                print(f"Testing connection {i+1}...")
                
                # Initialize
                self._send_initialize(server)
                
                # Send requests up to limit
                successful = 0
                limited = 0
                
                for j in range(limit + 1):  # Try one more than limit
                    response = self._send_tool_request(server, j + 1)
                    
                    if 'error' in response and response['error'].get('code') == -32000:
                        limited += 1
                    elif 'result' in response:
                        successful += 1
                        
                print(f"  Connection {i+1}: {successful} successful, {limited} limited")
                total_successful += successful
                total_limited += limited
                
        finally:
            # Cleanup
            for server in servers:
                if server.poll() is None:
                    server.terminate()
                    server.wait()
        
        results = {
            'connections': connections,
            'limit_per_connection': limit,
            'total_successful': total_successful,
            'total_limited': total_limited,
            'bypass_detected': total_successful > limit
        }
        
        print(f"\n📊 Bypass Test Results:")
        print(f"Total successful requests: {total_successful}")
        print(f"Total rate limited: {total_limited}")
        
        if results['bypass_detected']:
            print(f"🚨 BYPASS DETECTED! Got {total_successful} requests, expected max {limit}")
            print(f"   Bypass factor: {total_successful / limit:.1f}x")
        else:
            print(f"✅ No bypass detected")
            
        return results
    
    def test_timing_scenario(self, limit: int = 5, window_ms: int = 2000) -> Dict[str, Any]:
        """Test timing-based rate limiting"""
        print(f"⏱️  Timing Rate Limit Test")
        print(f"Limit: {limit}, Window: {window_ms}ms")
        print("Testing sliding window behavior...")
        
        results = {
            'phases': [],
            'total_requests': 0,
            'total_successful': 0,
            'total_limited': 0
        }
        
        # Set environment
        env = os.environ.copy()
        env['RATE_LIMIT'] = str(limit)
        env['RATE_LIMIT_WINDOW'] = str(window_ms)
        
        process = subprocess.Popen(
            ['node', self.server_path],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=env,
            text=True,
            bufsize=0
        )
        
        try:
            self._send_initialize(process)
            
            # Phase 1: Use up limit quickly
            print(f"Phase 1: Using {limit} requests quickly...")
            phase1_results = {'successful': 0, 'limited': 0}
            
            for i in range(limit):
                response = self._send_tool_request(process, i + 1)
                if 'result' in response:
                    phase1_results['successful'] += 1
                elif 'error' in response and response['error'].get('code') == -32000:
                    phase1_results['limited'] += 1
                    
            results['phases'].append(('quick_burst', phase1_results))
            print(f"  Phase 1: {phase1_results['successful']} successful, {phase1_results['limited']} limited")
            
            # Phase 2: Wait for window to expire
            wait_time = (window_ms / 1000) + 0.5  # Wait a bit longer than window
            print(f"Phase 2: Waiting {wait_time:.1f}s for window to expire...")
            time.sleep(wait_time)
            
            # Phase 3: Try requests again
            print(f"Phase 3: Testing after window expiry...")
            phase3_results = {'successful': 0, 'limited': 0}
            
            for i in range(3):  # Just try a few
                response = self._send_tool_request(process, 100 + i)
                if 'result' in response:
                    phase3_results['successful'] += 1
                elif 'error' in response and response['error'].get('code') == -32000:
                    phase3_results['limited'] += 1
                    
            results['phases'].append(('after_expiry', phase3_results))
            print(f"  Phase 3: {phase3_results['successful']} successful, {phase3_results['limited']} limited")
            
        finally:
            process.terminate()
            process.wait()
        
        # Calculate totals
        for phase_name, phase_results in results['phases']:
            results['total_successful'] += phase_results['successful']
            results['total_limited'] += phase_results['limited']
            results['total_requests'] += phase_results['successful'] + phase_results['limited']
        
        print(f"\n📊 Timing Test Results:")
        print(f"Total requests: {results['total_requests']}")
        print(f"Total successful: {results['total_successful']}")
        print(f"Total limited: {results['total_limited']}")
        
        # Check if sliding window works
        phase1 = dict(results['phases'][0][1])
        phase3 = dict(results['phases'][1][1])
        
        if phase1['successful'] == limit and phase3['successful'] > 0:
            print("✅ Sliding window appears to be working")
        else:
            print("❌ Sliding window may not be working correctly")
            
        return results
    
    def _run_single_server_test(self, limit: int, window_ms: int, num_requests: int) -> Dict[str, int]:
        """Run test on single server instance"""
        env = os.environ.copy()
        env['RATE_LIMIT'] = str(limit)
        env['RATE_LIMIT_WINDOW'] = str(window_ms)
        
        process = subprocess.Popen(
            ['node', self.server_path],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=env,
            text=True,
            bufsize=0
        )
        
        results = {'successful': 0, 'rate_limited': 0, 'errors': 0}
        
        try:
            self._send_initialize(process)
            
            for i in range(num_requests):
                response = self._send_tool_request(process, i + 1)
                
                if 'error' in response:
                    if response['error'].get('code') == -32000:
                        results['rate_limited'] += 1
                    else:
                        results['errors'] += 1
                elif 'result' in response:
                    results['successful'] += 1
                    
        finally:
            process.terminate()
            process.wait()
            
        return results
    
    def _send_initialize(self, process: subprocess.Popen):
        """Send MCP initialization"""
        init_request = {
            'jsonrpc': '2.0',
            'id': 0,
            'method': 'initialize',
            'params': {
                'protocolVersion': '2024-11-05',
                'capabilities': {},
                'clientInfo': {'name': 'rate-limit-debugger', 'version': '1.0.0'}
            }
        }
        
        process.stdin.write(json.dumps(init_request) + '\n')
        process.stdin.flush()
        
        # Read response
        process.stdout.readline()
    
    def _send_tool_request(self, process: subprocess.Popen, request_id: int) -> Dict[str, Any]:
        """Send tool request and return response"""
        request = {
            'jsonrpc': '2.0',
            'id': request_id,
            'method': 'tools/call',
            'params': {
                'name': 'get_current_time',
                'arguments': {}
            }
        }
        
        process.stdin.write(json.dumps(request) + '\n')
        process.stdin.flush()
        
        response_line = process.stdout.readline()
        if response_line:
            try:
                return json.loads(response_line)
            except json.JSONDecodeError:
                return {'error': {'code': -32603, 'message': 'Invalid JSON response'}}
        else:
            return {'error': {'code': -32603, 'message': 'No response'}}

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Debug rate limiting functionality',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Scenarios:
  burst     - Test burst requests at rate limit (default)
  bypass    - Test parallel connection bypass
  timing    - Test sliding window timing behavior

Examples:
  %(prog)s                                   # Burst test with defaults
  %(prog)s --scenario bypass --connections 3      # Test 3 parallel connections
  %(prog)s --scenario timing --limit 5 --window 2000  # Timing test
        """
    )
    
    parser.add_argument('--scenario', choices=['burst', 'bypass', 'timing'], 
                       default='burst', help='Test scenario to run')
    parser.add_argument('--limit', type=int, default=3,
                       help='Rate limit (default: 3)')
    parser.add_argument('--window', type=int, default=5000,
                       help='Window in milliseconds (default: 5000)')
    parser.add_argument('--connections', type=int, default=3,
                       help='Number of parallel connections for bypass test (default: 3)')
    parser.add_argument('--server', type=str,
                       help='Path to server script (default: dist/index.js)')
    
    args = parser.parse_args()
    
    debugger = RateLimitDebugger(args.server)
    
    if args.scenario == 'burst':
        debugger.test_burst_scenario(args.limit, args.window)
    elif args.scenario == 'bypass':
        debugger.test_bypass_scenario(args.connections, args.limit)
    elif args.scenario == 'timing':
        debugger.test_timing_scenario(args.limit, args.window)

if __name__ == '__main__':
    main()