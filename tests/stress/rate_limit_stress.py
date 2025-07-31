#!/usr/bin/env python3
"""
Rate limiting stress tester for MCP Time Server
Tests various rate limiting scenarios including bypass attempts
"""

import json
import time
import subprocess
import os
from pathlib import Path
from typing import Dict, Any, List
import psutil
from datetime import datetime
import config


class RateLimitStressTester:
    """Stress test rate limiting implementation"""
    
    def __init__(self, rate_limit: int = 100, window_ms: int = 60000):
        """Initialize rate limit stress tester"""
        self.rate_limit = rate_limit
        self.window_ms = window_ms
        self.results_dir = Path(__file__).parent / 'results'
        self.results_dir.mkdir(exist_ok=True)
    
    def test_burst_at_limit(self) -> Dict[str, Any]:
        """Test sending burst of requests at exactly the rate limit"""
        print(f"\nTesting burst at limit ({self.rate_limit} requests)...")
        
        result = {
            'scenario': 'burst_at_limit',
            'timestamp': datetime.now().isoformat(),
            'rate_limit': self.rate_limit,
            'window_ms': self.window_ms,
            'successful_requests': 0,
            'rate_limited_requests': 0,
            'errors': []
        }
        
        # Start server
        server_process = self._start_server()
        
        try:
            # Send rate_limit + 1 requests as fast as possible
            for i in range(self.rate_limit + 1):
                response = self._send_request({
                    'jsonrpc': '2.0',
                    'id': i + 1,
                    'method': 'tools/call',
                    'params': {
                        'name': 'get_current_time',
                        'arguments': {}
                    }
                }, server_process)
                
                if 'error' in response:
                    if response['error'].get('code') == -32000:
                        result['rate_limited_requests'] += 1
                    else:
                        result['errors'].append(response['error'])
                else:
                    result['successful_requests'] += 1
            
            # Verify results
            print(f"  Successful: {result['successful_requests']}")
            print(f"  Rate limited: {result['rate_limited_requests']}")
            print(f"  Expected: {self.rate_limit} successful, 1 rate limited")
            
        finally:
            self._stop_server(server_process)
        
        return result
    
    def test_parallel_connections(self, num_connections: int = 3) -> Dict[str, Any]:
        """Test multiple parallel connections to bypass rate limits"""
        print(f"\nTesting {num_connections} parallel connections...")
        
        result = {
            'scenario': 'parallel_connections',
            'timestamp': datetime.now().isoformat(),
            'num_connections': num_connections,
            'rate_limit': self.rate_limit,
            'connections': [],
            'total_requests': 0,
            'bypass_detected': False
        }
        
        # Start multiple server instances
        servers = []
        for i in range(num_connections):
            server = self._start_server()
            servers.append(server)
            
            connection_result = {
                'connection_id': i,
                'successful_requests': 0,
                'rate_limited_requests': 0
            }
            
            # Send requests up to limit on each connection
            for j in range(self.rate_limit):
                response = self._send_request({
                    'jsonrpc': '2.0',
                    'id': j + 1,
                    'method': 'tools/call',
                    'params': {
                        'name': 'get_current_time',
                        'arguments': {}
                    }
                }, server)
                
                if 'error' in response and response['error'].get('code') == -32000:
                    connection_result['rate_limited_requests'] += 1
                else:
                    connection_result['successful_requests'] += 1
            
            result['connections'].append(connection_result)
            result['total_requests'] += connection_result['successful_requests']
        
        # Check if bypass detected
        if result['total_requests'] > self.rate_limit:
            result['bypass_detected'] = True
            print(f"  ⚠️  Bypass detected: {result['total_requests']} total requests")
            print(f"     (Expected max: {self.rate_limit})")
        
        # Clean up
        for server in servers:
            self._stop_server(server)
        
        return result
    
    def test_memory_exhaustion(self, duration_seconds: int = 5) -> Dict[str, Any]:
        """Test memory exhaustion by sending limit-1 requests repeatedly"""
        print(f"\nTesting memory exhaustion prevention ({duration_seconds}s)...")
        
        server_process = self._start_server()
        
        # Get initial memory
        server_pid = server_process.pid
        process = psutil.Process(server_pid)
        memory_start = process.memory_info().rss / 1024 / 1024  # MB
        
        result = {
            'scenario': 'memory_exhaustion',
            'timestamp': datetime.now().isoformat(),
            'duration_seconds': duration_seconds,
            'memory_start_mb': memory_start,
            'memory_end_mb': 0,
            'memory_growth_mb': 0,
            'requests_made': 0
        }
        
        try:
            start_time = time.time()
            request_id = 1
            
            while time.time() - start_time < duration_seconds:
                # Send limit-1 requests
                for i in range(self.rate_limit - 1):
                    response = self._send_request({
                        'jsonrpc': '2.0',
                        'id': request_id,
                        'method': 'tools/call',
                        'params': {
                            'name': 'get_current_time',
                            'arguments': {}
                        }
                    }, server_process)
                    request_id += 1
                    result['requests_made'] += 1
                
                # Small delay to prevent overwhelming
                time.sleep(0.1)
            
            # Get final memory
            memory_end = process.memory_info().rss / 1024 / 1024  # MB
            result['memory_end_mb'] = memory_end
            result['memory_growth_mb'] = memory_end - memory_start
            
            print(f"  Memory start: {memory_start:.1f} MB")
            print(f"  Memory end: {memory_end:.1f} MB")
            print(f"  Growth: {result['memory_growth_mb']:.1f} MB")
            print(f"  Requests made: {result['requests_made']}")
            
        finally:
            self._stop_server(server_process)
        
        return result
    
    def test_rapid_reconnect(self, num_cycles: int = 3) -> Dict[str, Any]:
        """Test rapid disconnect/reconnect to bypass rate limits"""
        print(f"\nTesting rapid reconnect ({num_cycles} cycles)...")
        
        result = {
            'scenario': 'rapid_reconnect',
            'timestamp': datetime.now().isoformat(),
            'num_cycles': num_cycles,
            'rate_limit': self.rate_limit,
            'cycles': [],
            'total_requests': 0,
            'expected_limited': 0,
            'actual_limited': 0
        }
        
        for cycle in range(num_cycles):
            # Start fresh server
            server = self._start_server()
            
            cycle_result = {
                'cycle': cycle + 1,
                'successful_requests': 0,
                'rate_limited_requests': 0
            }
            
            # Use up rate limit + try one more
            for i in range(self.rate_limit + 1):
                response = self._send_request({
                    'jsonrpc': '2.0',
                    'id': i + 1,
                    'method': 'tools/call',
                    'params': {
                        'name': 'get_current_time',
                        'arguments': {}
                    }
                }, server)
                
                if 'error' in response and response['error'].get('code') == -32000:
                    cycle_result['rate_limited_requests'] += 1
                else:
                    cycle_result['successful_requests'] += 1
            
            result['cycles'].append(cycle_result)
            result['total_requests'] += cycle_result['successful_requests']
            result['actual_limited'] += cycle_result['rate_limited_requests']
            
            # Stop server (simulating disconnect)
            self._stop_server(server)
            
            # Small delay before reconnect
            time.sleep(0.1)
        
        # We expect 1 rate limited request per cycle
        result['expected_limited'] = num_cycles
        
        print(f"  Total requests: {result['total_requests']}")
        print(f"  Expected rate limited: {result['expected_limited']}")
        print(f"  Actual rate limited: {result['actual_limited']}")
        
        if result['total_requests'] > self.rate_limit:
            print(f"  ⚠️  Bypass via reconnect: {result['total_requests']} > {self.rate_limit}")
        
        return result
    
    def save_results(self, results: Dict[str, Any]) -> str:
        """Save test results to JSON file"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"rate_limit_test_{timestamp}.json"
        filepath = self.results_dir / filename
        
        with open(filepath, 'w') as f:
            json.dump(results, f, indent=2)
        
        return str(filepath)
    
    def _start_server(self) -> subprocess.Popen:
        """Start MCP server with custom rate limit settings"""
        env = os.environ.copy()
        env['RATE_LIMIT'] = str(self.rate_limit)
        env['RATE_LIMIT_WINDOW'] = str(self.window_ms)
        
        cmd = config.SERVER_COMMAND
        process = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=env,
            text=True,
            bufsize=0
        )
        
        # Wait for server initialization
        time.sleep(1)
        
        # Send initialization request
        init_request = {
            'jsonrpc': '2.0',
            'id': 0,
            'method': 'initialize',
            'params': {
                'protocolVersion': '2024-11-05',
                'capabilities': {},
                'clientInfo': {
                    'name': 'rate-limit-stress-tester',
                    'version': '1.0.0'
                }
            }
        }
        
        process.stdin.write(json.dumps(init_request) + '\n')
        process.stdin.flush()
        
        # Read initialization response
        init_response = process.stdout.readline()
        if init_response:
            response = json.loads(init_response)
            if 'error' in response:
                print(f"Initialization error: {response['error']}")
        
        return process
    
    def _stop_server(self, process: subprocess.Popen):
        """Stop MCP server gracefully"""
        if process and process.poll() is None:
            process.stdin.close()
            process.stdout.close()
            process.stderr.close()
            process.terminate()
            try:
                process.wait(timeout=2)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()
    
    def _send_request(self, request: Dict[str, Any], process: subprocess.Popen) -> Dict[str, Any]:
        """Send JSON-RPC request to server"""
        try:
            # Send request
            request_str = json.dumps(request) + '\n'
            process.stdin.write(request_str)
            process.stdin.flush()
            
            # Read response
            response_line = process.stdout.readline()
            if response_line:
                return json.loads(response_line)
            else:
                return {'error': {'code': -32603, 'message': 'No response'}}
        except Exception as e:
            return {'error': {'code': -32603, 'message': str(e)}}