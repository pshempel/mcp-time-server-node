#!/usr/bin/env python3
"""
Run a memory leak test on the MCP time server
Usage: python3 run_memory_test.py [duration_seconds]
"""

import sys
import os
from stress_test import SimpleStressTester


def main():
    """Run memory leak test"""
    # Default 60 seconds, or use command line arg
    duration = int(sys.argv[1]) if len(sys.argv) > 1 else 60
    
    # Get server path
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    server_path = os.path.join(project_root, 'dist', 'index.js')
    
    print(f"MCP Time Server Memory Leak Test")
    print(f"Duration: {duration} seconds")
    print("=" * 40)
    
    # Create tester
    tester = SimpleStressTester(['node', server_path])
    
    print("Starting server...")
    tester.start_server()
    
    print("Hammering server with requests...")
    results = tester.hammer_server(seconds=duration)
    
    print("\nResults:")
    print(f"Total requests: {results['total_requests']:,}")
    print(f"Errors: {results['errors']}")
    print(f"Duration: {results['duration']:.1f}s")
    print(f"Requests/sec: {results['total_requests'] / results['duration']:.1f}")
    print(f"Memory start: {results['memory_start']:.1f} MB")
    print(f"Memory end: {results['memory_end']:.1f} MB")
    print(f"Memory growth: {results['memory_end'] - results['memory_start']:.1f} MB")
    
    if results['memory_leak_detected']:
        print("\n❌ MEMORY LEAK DETECTED!")
    else:
        print("\n✅ No memory leak detected")
    
    # Cleanup
    print("\nStopping server...")
    tester.stop_server()
    
    return 0 if not results['memory_leak_detected'] else 1


if __name__ == "__main__":
    sys.exit(main())