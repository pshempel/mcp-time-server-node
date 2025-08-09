#!/usr/bin/env python3
"""
MCP Environment Variable Debugger

Tests if MCP server correctly reads environment variables and responds to basic requests.
Useful for debugging server configuration and environment variable issues.

Usage:
    python3 tools/debug/mcp_env_debugger.py
    python3 tools/debug/mcp_env_debugger.py --rate-limit 2 --window 5000
    python3 tools/debug/mcp_env_debugger.py --requests 5 --verbose
"""

import subprocess
import json
import time
import os
import argparse
from pathlib import Path

class MCPEnvironmentDebugger:
    """Debug MCP server environment variable handling"""
    
    def __init__(self, server_path: str = None):
        """Initialize debugger with server path"""
        self.project_root = Path(__file__).parent.parent.parent
        self.server_path = server_path or str(self.project_root / 'dist' / 'index.js')
        
    def test_environment_vars(self, rate_limit: int = 3, window_ms: int = 5000, 
                            num_requests: int = 4, verbose: bool = False) -> dict:
        """Test environment variable handling"""
        
        print(f"🔧 MCP Environment Variable Debug Test")
        print(f"{'='*50}")
        print(f"Rate limit: {rate_limit} requests")
        print(f"Window: {window_ms}ms ({window_ms/1000}s)")
        print(f"Test requests: {num_requests}")
        print(f"Expected: {rate_limit} success, {max(0, num_requests-rate_limit)} rate limited")
        print()
        
        # Set environment variables
        env = os.environ.copy()
        env['RATE_LIMIT'] = str(rate_limit)
        env['RATE_LIMIT_WINDOW'] = str(window_ms)
        env['NODE_ENV'] = 'development'  # Enable any debug output
        
        if verbose:
            print(f"Environment variables:")
            print(f"  RATE_LIMIT={env['RATE_LIMIT']}")
            print(f"  RATE_LIMIT_WINDOW={env['RATE_LIMIT_WINDOW']}")
            print()
        
        # Start server
        if verbose:
            print(f"Starting server: node {self.server_path}")
            
        process = subprocess.Popen(
            ['node', self.server_path],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=env,
            text=True,
            bufsize=0
        )
        
        time.sleep(1)  # Let server initialize
        
        results = {
            'rate_limit_setting': rate_limit,
            'window_ms': window_ms,
            'requests_sent': 0,
            'successful_requests': 0,
            'rate_limited_requests': 0,
            'errors': [],
            'responses': []
        }
        
        try:
            # Send initialization (MCP protocol requirement)
            if verbose:
                print("Sending MCP initialization...")
                
            init_request = {
                'jsonrpc': '2.0',
                'id': 0,
                'method': 'initialize',
                'params': {
                    'protocolVersion': '2024-11-05',
                    'capabilities': {},
                    'clientInfo': {
                        'name': 'mcp-env-debugger',
                        'version': '1.0.0'
                    }
                }
            }
            
            process.stdin.write(json.dumps(init_request) + '\n')
            process.stdin.flush()
            
            # Read initialization response
            init_response = process.stdout.readline()
            if verbose and init_response:
                init_data = json.loads(init_response)
                print(f"✅ Server initialized: {init_data.get('result', {}).get('serverInfo', {}).get('name', 'Unknown')}")
                print()
            
            # Send test requests rapidly
            print(f"Sending {num_requests} requests rapidly...")
            for i in range(num_requests):
                request = {
                    'jsonrpc': '2.0',
                    'id': i + 1,
                    'method': 'tools/call',
                    'params': {
                        'name': 'get_current_time',
                        'arguments': {}
                    }
                }
                
                results['requests_sent'] += 1
                
                if verbose:
                    print(f"  Request {i+1}: ", end='')
                    
                process.stdin.write(json.dumps(request) + '\n')
                process.stdin.flush()
                
                # Read response
                response_line = process.stdout.readline()
                if response_line:
                    try:
                        response = json.loads(response_line)
                        results['responses'].append(response)
                        
                        if 'error' in response:
                            error = response['error']
                            if error.get('code') == -32000:  # Rate limit error
                                results['rate_limited_requests'] += 1
                                if verbose:
                                    print(f"RATE LIMITED (retry after: {error.get('data', {}).get('retryAfter', '?')}s)")
                                else:
                                    print(f"Request {i+1}: RATE LIMITED")
                            else:
                                results['errors'].append(error)
                                if verbose:
                                    print(f"ERROR - {error.get('message', 'Unknown')}")
                                else:
                                    print(f"Request {i+1}: ERROR - {error.get('message', 'Unknown')}")
                        else:
                            results['successful_requests'] += 1
                            if verbose:
                                print("SUCCESS")
                            else:
                                print(f"Request {i+1}: SUCCESS")
                    except json.JSONDecodeError as e:
                        results['errors'].append(f"JSON decode error: {e}")
                        print(f"Request {i+1}: JSON ERROR")
                else:
                    results['errors'].append("No response received")
                    print(f"Request {i+1}: NO RESPONSE")
                    
        except Exception as e:
            results['errors'].append(f"Test error: {e}")
            print(f"❌ Test error: {e}")
            
        finally:
            # Check for server errors
            stderr_output = process.stderr.read()
            if stderr_output and verbose:
                print(f"\nServer stderr:\n{stderr_output}")
                
            # Clean up
            process.terminate()
            try:
                process.wait(timeout=2)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()
        
        return results
    
    def print_results(self, results: dict):
        """Print formatted test results"""
        print(f"\n{'='*50}")
        print(f"📊 Test Results")
        print(f"{'='*50}")
        print(f"Requests sent: {results['requests_sent']}")
        print(f"Successful: {results['successful_requests']}")
        print(f"Rate limited: {results['rate_limited_requests']}")
        print(f"Errors: {len(results['errors'])}")
        
        # Analysis
        expected_success = results['rate_limit_setting']
        expected_limited = max(0, results['requests_sent'] - expected_success)
        
        print(f"\n📈 Analysis:")
        print(f"Expected successful: {expected_success}")
        print(f"Expected rate limited: {expected_limited}")
        
        if (results['successful_requests'] == expected_success and 
            results['rate_limited_requests'] == expected_limited):
            print(f"✅ Rate limiting working correctly!")
        else:
            print(f"❌ Rate limiting NOT working as expected!")
            print(f"   This indicates a configuration or server issue.")
        
        if results['errors']:
            print(f"\n⚠️  Errors encountered:")
            for error in results['errors']:
                print(f"   - {error}")
                
        print(f"\n💡 Troubleshooting tips:")
        if results['successful_requests'] > expected_success:
            print(f"   - Check if server is reading RATE_LIMIT environment variable")
            print(f"   - Verify server restart after changing configuration")
        if results['rate_limited_requests'] == 0 and results['requests_sent'] > expected_success:
            print(f"   - Rate limiting may be completely bypassed")
            print(f"   - Check server logs for initialization errors")

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Debug MCP server environment variable handling',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s                          # Default test (3 limit, 4 requests)
  %(prog)s --rate-limit 1 --requests 3    # Test with 1 request limit
  %(prog)s --window 10000 --verbose       # 10 second window, verbose output
  %(prog)s --server ../dist/index.js      # Custom server path
        """
    )
    
    parser.add_argument('--rate-limit', type=int, default=3,
                       help='Rate limit to test (default: 3)')
    parser.add_argument('--window', type=int, default=5000,
                       help='Rate limit window in milliseconds (default: 5000)')
    parser.add_argument('--requests', type=int, default=4,
                       help='Number of requests to send (default: 4)')
    parser.add_argument('--server', type=str,
                       help='Path to MCP server script (default: dist/index.js)')
    parser.add_argument('--verbose', action='store_true',
                       help='Verbose output')
    
    args = parser.parse_args()
    
    debugger = MCPEnvironmentDebugger(args.server)
    results = debugger.test_environment_vars(
        rate_limit=args.rate_limit,
        window_ms=args.window,
        num_requests=args.requests,
        verbose=args.verbose
    )
    
    debugger.print_results(results)

if __name__ == '__main__':
    main()