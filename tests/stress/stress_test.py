#!/usr/bin/env python3
"""
Simple MCP Stress Tester - KISS Implementation
Starting with minimal code to pass tests
"""

import subprocess
import time
import psutil


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