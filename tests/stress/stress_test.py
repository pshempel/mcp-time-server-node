#!/usr/bin/env python3
"""
Simple MCP Stress Tester - KISS Implementation
Starting with minimal code to pass tests
"""

import subprocess
import time
import psutil
import json


class SimpleStressTester:
    """Simple stress tester for MCP servers"""
    
    def __init__(self, server_cmd):
        self.server_cmd = server_cmd
        self.process = None
    
    def start_server(self):
        """Start the MCP server"""
        self.process = subprocess.Popen(
            self.server_cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=0
        )
        time.sleep(2)  # Let it warm up
    
    def check_memory(self):
        """Check server memory usage in MB"""
        if not self.process or self.process.poll() is not None:
            return 0.0
        try:
            proc = psutil.Process(self.process.pid)
            return proc.memory_info().rss / 1024 / 1024
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            return 0.0
    
    def stop_server(self):
        """Stop the server"""
        if self.process:
            # Close pipes first
            if self.process.stdin:
                self.process.stdin.close()
            if self.process.stdout:
                self.process.stdout.close()
            if self.process.stderr:
                self.process.stderr.close()
            
            # Then terminate
            self.process.terminate()
            self.process.wait()
    
    def is_memory_leak(self, initial_memory, final_memory, threshold=0.5):
        """Check if memory growth indicates a leak
        
        Args:
            initial_memory: Starting memory in MB
            final_memory: Ending memory in MB
            threshold: Growth factor threshold (default 0.5 = 50%)
            
        Returns:
            True if memory growth exceeds threshold
        """
        growth_factor = (final_memory - initial_memory) / initial_memory
        return growth_factor > threshold

    def send_request(self, request):
        """Send a single MCP request and get response"""
        if not self.process or self.process.poll() is not None:
            return None

        try:
            # Send request
            self.process.stdin.write(json.dumps(request) + '\n')
            self.process.stdin.flush()

            # Read response
            response_line = self.process.stdout.readline()
            if response_line:
                return json.loads(response_line)
            return None
        except Exception:
            return None

    def hammer_server(self, seconds=60):
        """Hammer the server with requests for specified duration"""
        if not self.process or self.process.poll() is not None:
            return None

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

        # Hammer until time is up
        request_id = 1
        while time.time() - start_time < seconds:
            request = {
                "jsonrpc": "2.0",
                "method": "tools/call",
                "id": request_id,
                "params": {
                    "name": "get_current_time",
                    "arguments": {"timezone": "UTC"}
                }
            }

            response = self.send_request(request)
            results['total_requests'] += 1
            
            if response is None or 'error' in response:
                results['errors'] += 1

            request_id += 1
            # Small delay to avoid overwhelming
            time.sleep(0.01)

        # Final measurements
        results['duration'] = time.time() - start_time
        results['memory_end'] = self.check_memory()
        results['memory_leak_detected'] = self.is_memory_leak(
            start_memory, results['memory_end']
        )

        return results