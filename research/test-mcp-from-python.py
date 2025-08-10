#!/usr/bin/env python3
"""
Research: Test actual MCP communication from Python
"""

import subprocess
import json
import time

def test_mcp_server_communication():
    """Test real communication with our MCP time server"""
    print("Testing MCP Server Communication")
    print("=" * 40)
    
    # Start the MCP server
    server = subprocess.Popen(
        ['node', 'dist/index.js'],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=0  # Unbuffered
    )
    
    # Give it time to start
    time.sleep(1)
    
    try:
        # Test 1: List tools
        request1 = {"jsonrpc": "2.0", "method": "tools/list", "id": 1, "params": {}}
        print(f"\nSending: {json.dumps(request1)}")
        
        server.stdin.write(json.dumps(request1) + '\n')
        server.stdin.flush()
        
        # Read response
        response_line = server.stdout.readline()
        if response_line:
            response = json.loads(response_line)
            print(f"Response: {json.dumps(response, indent=2)[:200]}...")
            print(f"Number of tools: {len(response.get('result', {}).get('tools', []))}")
        
        # Test 2: Call a tool
        request2 = {
            "jsonrpc": "2.0",
            "method": "tools/call",
            "id": 2,
            "params": {
                "name": "get_current_time",
                "arguments": {"timezone": "UTC"}
            }
        }
        print(f"\nSending: {json.dumps(request2)}")
        
        server.stdin.write(json.dumps(request2) + '\n')
        server.stdin.flush()
        
        response_line = server.stdout.readline()
        if response_line:
            response = json.loads(response_line)
            print(f"Response: {json.dumps(response, indent=2)}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        # Clean up
        server.terminate()
        server.wait()
        print("\nServer terminated")

def test_memory_measurement_during_requests():
    """Test memory measurement while making requests"""
    print("\n\nTesting Memory Measurement")
    print("=" * 40)
    
    import psutil
    
    # Start server
    server = subprocess.Popen(
        ['node', 'dist/index.js'],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    time.sleep(1)
    
    try:
        # Monitor the process
        proc = psutil.Process(server.pid)
        
        # Initial memory
        initial_mem = proc.memory_info().rss / 1024 / 1024
        print(f"Initial memory: {initial_mem:.2f} MB")
        
        # Make some requests
        for i in range(5):
            request = {
                "jsonrpc": "2.0",
                "method": "tools/call",
                "id": i + 1,
                "params": {
                    "name": "get_current_time",
                    "arguments": {"timezone": f"Test_{i}"}  # Invalid timezone to test error handling
                }
            }
            
            server.stdin.write(json.dumps(request) + '\n')
            server.stdin.flush()
            
            # Read response
            response = server.stdout.readline()
            
            # Check memory
            current_mem = proc.memory_info().rss / 1024 / 1024
            print(f"After request {i+1}: {current_mem:.2f} MB (Δ {current_mem - initial_mem:.2f} MB)")
            
            time.sleep(0.1)
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        server.terminate()
        server.wait()

if __name__ == "__main__":
    test_mcp_server_communication()
    test_memory_measurement_during_requests()