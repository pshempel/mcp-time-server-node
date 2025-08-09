#!/usr/bin/env python3
"""
MCP Protocol Debugger

Tests MCP JSON-RPC protocol communication, handshake, and tool execution.
Useful for debugging protocol issues and server responses.

Usage:
    python3 tools/debug/mcp_protocol_debugger.py
    python3 tools/debug/mcp_protocol_debugger.py --tool add_time --verbose
    python3 tools/debug/mcp_protocol_debugger.py --interactive
"""

import subprocess
import json
import time
import os
import argparse
from pathlib import Path
from typing import Dict, Any, Optional

class MCPProtocolDebugger:
    """Debug MCP protocol communication"""
    
    def __init__(self, server_path: str = None):
        """Initialize protocol debugger"""
        self.project_root = Path(__file__).parent.parent.parent
        self.server_path = server_path or str(self.project_root / 'dist' / 'index.js')
        self.request_id = 0
        
    def test_full_protocol(self, verbose: bool = False) -> Dict[str, Any]:
        """Test complete MCP protocol flow"""
        print("🔌 MCP Protocol Full Test")
        print("=" * 40)
        
        results = {
            'initialization': None,
            'tools_list': None,
            'tool_call': None,
            'errors': []
        }
        
        process = self._start_server(verbose)
        
        try:
            # Step 1: Initialize
            print("Step 1: Initializing MCP connection...")
            init_result = self._test_initialization(process, verbose)
            results['initialization'] = init_result
            
            if init_result['success']:
                print("✅ Initialization successful")
            else:
                print("❌ Initialization failed")
                return results
            
            # Step 2: List tools
            print("\nStep 2: Listing available tools...")
            tools_result = self._test_tools_list(process, verbose)
            results['tools_list'] = tools_result
            
            if tools_result['success']:
                print(f"✅ Found {len(tools_result['tools'])} tools")
                if verbose:
                    for tool in tools_result['tools']:
                        print(f"  - {tool['name']}: {tool['description']}")
            else:
                print("❌ Tools list failed")
                return results
            
            # Step 3: Call a tool
            print("\nStep 3: Testing tool execution...")
            tool_result = self._test_tool_call(process, 'get_current_time', {}, verbose)
            results['tool_call'] = tool_result
            
            if tool_result['success']:
                print("✅ Tool call successful")
                if verbose:
                    print(f"  Result: {json.dumps(tool_result['result'], indent=2)}")
            else:
                print("❌ Tool call failed")
                
        except Exception as e:
            results['errors'].append(f"Protocol test error: {e}")
            print(f"❌ Protocol test error: {e}")
            
        finally:
            self._stop_server(process)
            
        return results
    
    def test_specific_tool(self, tool_name: str, arguments: Dict[str, Any] = None, 
                          verbose: bool = False) -> Dict[str, Any]:
        """Test specific tool execution"""
        print(f"🛠️  Testing Tool: {tool_name}")
        print("=" * 40)
        
        if arguments is None:
            arguments = {}
            
        process = self._start_server(verbose)
        results = {'success': False, 'result': None, 'error': None}
        
        try:
            # Initialize
            init_result = self._test_initialization(process, verbose)
            if not init_result['success']:
                results['error'] = "Initialization failed"
                return results
            
            # Call tool
            print(f"Calling {tool_name} with arguments: {json.dumps(arguments)}")
            tool_result = self._test_tool_call(process, tool_name, arguments, verbose)
            results = tool_result
            
            if results['success']:
                print("✅ Tool execution successful")
                print(f"Result: {json.dumps(results['result'], indent=2)}")
            else:
                print("❌ Tool execution failed")
                print(f"Error: {results['error']}")
                
        finally:
            self._stop_server(process)
            
        return results
    
    def interactive_mode(self):
        """Interactive debugging mode"""
        print("🔄 Interactive MCP Debug Mode")
        print("=" * 40)
        print("Commands:")
        print("  init                  - Initialize connection")
        print("  list                  - List tools")
        print("  call <tool> [args]    - Call tool")
        print("  raw <json>            - Send raw JSON-RPC")
        print("  quit                  - Exit")
        print()
        
        process = self._start_server(verbose=True)
        initialized = False
        
        try:
            while True:
                try:
                    command = input("mcp> ").strip()
                    if not command:
                        continue
                        
                    if command == 'quit':
                        break
                    elif command == 'init':
                        result = self._test_initialization(process, verbose=True)
                        initialized = result['success']
                        print(f"Initialization: {'✅' if initialized else '❌'}")
                        
                    elif command == 'list':
                        if not initialized:
                            print("❌ Must initialize first")
                            continue
                        result = self._test_tools_list(process, verbose=True)
                        if result['success']:
                            for tool in result['tools']:
                                print(f"  {tool['name']}: {tool['description']}")
                                
                    elif command.startswith('call '):
                        if not initialized:
                            print("❌ Must initialize first")
                            continue
                        parts = command[5:].split(' ', 1)
                        tool_name = parts[0]
                        args = json.loads(parts[1]) if len(parts) > 1 else {}
                        
                        result = self._test_tool_call(process, tool_name, args, verbose=True)
                        if result['success']:
                            print(f"Result: {json.dumps(result['result'], indent=2)}")
                        else:
                            print(f"Error: {result['error']}")
                            
                    elif command.startswith('raw '):
                        json_str = command[4:]
                        try:
                            request = json.loads(json_str)
                            process.stdin.write(json.dumps(request) + '\n')
                            process.stdin.flush()
                            
                            response_line = process.stdout.readline()
                            if response_line:
                                response = json.loads(response_line)
                                print(f"Response: {json.dumps(response, indent=2)}")
                            else:
                                print("No response")
                        except json.JSONDecodeError as e:
                            print(f"Invalid JSON: {e}")
                            
                    else:
                        print("Unknown command. Type 'quit' to exit.")
                        
                except KeyboardInterrupt:
                    break
                except Exception as e:
                    print(f"Error: {e}")
                    
        finally:
            self._stop_server(process)
            print("👋 Goodbye!")
    
    def _start_server(self, verbose: bool = False) -> subprocess.Popen:
        """Start MCP server process"""
        if verbose:
            print(f"Starting server: node {self.server_path}")
            
        process = subprocess.Popen(
            ['node', self.server_path],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=0
        )
        
        time.sleep(1)  # Let server start
        return process
    
    def _stop_server(self, process: subprocess.Popen):
        """Stop server gracefully"""
        if process and process.poll() is None:
            process.terminate()
            try:
                process.wait(timeout=2)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()
    
    def _test_initialization(self, process: subprocess.Popen, verbose: bool) -> Dict[str, Any]:
        """Test MCP initialization"""
        self.request_id += 1
        
        request = {
            'jsonrpc': '2.0',
            'id': self.request_id,
            'method': 'initialize',
            'params': {
                'protocolVersion': '2024-11-05',
                'capabilities': {},
                'clientInfo': {
                    'name': 'mcp-protocol-debugger',
                    'version': '1.0.0'
                }
            }
        }
        
        if verbose:
            print(f"Sending: {json.dumps(request, indent=2)}")
            
        process.stdin.write(json.dumps(request) + '\n')
        process.stdin.flush()
        
        response_line = process.stdout.readline()
        if response_line:
            try:
                response = json.loads(response_line)
                if verbose:
                    print(f"Received: {json.dumps(response, indent=2)}")
                    
                if 'result' in response:
                    return {
                        'success': True,
                        'server_info': response['result'].get('serverInfo', {}),
                        'protocol_version': response['result'].get('protocolVersion'),
                        'capabilities': response['result'].get('capabilities', {})
                    }
                else:
                    return {
                        'success': False,
                        'error': response.get('error', 'Unknown error')
                    }
            except json.JSONDecodeError as e:
                return {'success': False, 'error': f'JSON decode error: {e}'}
        else:
            return {'success': False, 'error': 'No response'}
    
    def _test_tools_list(self, process: subprocess.Popen, verbose: bool) -> Dict[str, Any]:
        """Test tools listing"""
        self.request_id += 1
        
        request = {
            'jsonrpc': '2.0',
            'id': self.request_id,
            'method': 'tools/list',
            'params': {}
        }
        
        if verbose:
            print(f"Sending: {json.dumps(request, indent=2)}")
            
        process.stdin.write(json.dumps(request) + '\n')
        process.stdin.flush()
        
        response_line = process.stdout.readline()
        if response_line:
            try:
                response = json.loads(response_line)
                if verbose:
                    print(f"Received: {json.dumps(response, indent=2)}")
                    
                if 'result' in response:
                    return {
                        'success': True,
                        'tools': response['result'].get('tools', [])
                    }
                else:
                    return {
                        'success': False,
                        'error': response.get('error', 'Unknown error')
                    }
            except json.JSONDecodeError as e:
                return {'success': False, 'error': f'JSON decode error: {e}'}
        else:
            return {'success': False, 'error': 'No response'}
    
    def _test_tool_call(self, process: subprocess.Popen, tool_name: str, 
                       arguments: Dict[str, Any], verbose: bool) -> Dict[str, Any]:
        """Test tool execution"""
        self.request_id += 1
        
        request = {
            'jsonrpc': '2.0',
            'id': self.request_id,
            'method': 'tools/call',
            'params': {
                'name': tool_name,
                'arguments': arguments
            }
        }
        
        if verbose:
            print(f"Sending: {json.dumps(request, indent=2)}")
            
        process.stdin.write(json.dumps(request) + '\n')
        process.stdin.flush()
        
        response_line = process.stdout.readline()
        if response_line:
            try:
                response = json.loads(response_line)
                if verbose:
                    print(f"Received: {json.dumps(response, indent=2)}")
                    
                if 'result' in response:
                    return {
                        'success': True,
                        'result': response['result']
                    }
                else:
                    return {
                        'success': False,
                        'error': response.get('error', 'Unknown error')
                    }
            except json.JSONDecodeError as e:
                return {'success': False, 'error': f'JSON decode error: {e}'}
        else:
            return {'success': False, 'error': 'No response'}

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Debug MCP protocol communication',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s                                    # Full protocol test
  %(prog)s --tool get_current_time            # Test specific tool
  %(prog)s --tool add_time --args '{"time":"2024-01-01","amount":1,"unit":"days"}'
  %(prog)s --interactive                      # Interactive mode
        """
    )
    
    parser.add_argument('--tool', type=str,
                       help='Test specific tool')
    parser.add_argument('--args', type=str, default='{}',
                       help='Tool arguments as JSON string')
    parser.add_argument('--interactive', action='store_true',
                       help='Interactive debugging mode')
    parser.add_argument('--server', type=str,
                       help='Path to server script (default: dist/index.js)')
    parser.add_argument('--verbose', action='store_true',
                       help='Verbose output')
    
    args = parser.parse_args()
    
    debugger = MCPProtocolDebugger(args.server)
    
    if args.interactive:
        debugger.interactive_mode()
    elif args.tool:
        try:
            tool_args = json.loads(args.args)
        except json.JSONDecodeError as e:
            print(f"Invalid JSON arguments: {e}")
            return
        debugger.test_specific_tool(args.tool, tool_args, args.verbose)
    else:
        debugger.test_full_protocol(args.verbose)

if __name__ == '__main__':
    main()