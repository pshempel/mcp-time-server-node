#!/usr/bin/env python3
"""
TDD Test for actually hammering the MCP server
"""

import unittest
import json

try:
    from stress_test import SimpleStressTester
except ImportError:
    SimpleStressTester = None


class TestHammerServer(unittest.TestCase):
    """Test our ability to hammer the server with requests"""

    def test_hammer_server_exists(self):
        """Test that hammer_server method exists"""
        if not SimpleStressTester:
            self.skipTest("SimpleStressTester not implemented yet")

        # Use absolute path to dist/index.js
        import os
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        server_path = os.path.join(project_root, 'dist', 'index.js')

        tester = SimpleStressTester(['node', server_path])
        self.assertTrue(hasattr(tester, 'hammer_server'), "hammer_server method should exist")

    def test_can_send_mcp_request(self):
        """Test that we can send a single MCP request"""
        if not SimpleStressTester:
            self.skipTest("SimpleStressTester not implemented yet")

        import os
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        server_path = os.path.join(project_root, 'dist', 'index.js')

        tester = SimpleStressTester(['node', server_path])
        tester.start_server()

        # Send a single request
        response = tester.send_request({
            "jsonrpc": "2.0",
            "method": "tools/list",
            "id": 1,
            "params": {}
        })

        # Should get a valid response
        self.assertIsNotNone(response)
        self.assertIn('result', response)
        self.assertIn('tools', response['result'])

        tester.stop_server()

    def test_hammer_server_makes_requests(self):
        """Test that hammer_server actually makes many requests"""
        if not SimpleStressTester:
            self.skipTest("SimpleStressTester not implemented yet")

        import os
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        server_path = os.path.join(project_root, 'dist', 'index.js')

        tester = SimpleStressTester(['node', server_path])
        tester.start_server()

        # Hammer for just 5 seconds
        results = tester.hammer_server(seconds=5)

        # Should have made some requests
        self.assertIsNotNone(results)
        self.assertIn('total_requests', results)
        self.assertIn('errors', results)
        self.assertIn('duration', results)
        self.assertGreater(results['total_requests'], 0)

        tester.stop_server()

    def test_memory_leak_detection_with_hammering(self):
        """Test memory leak detection while hammering"""
        if not SimpleStressTester:
            self.skipTest("SimpleStressTester not implemented yet")

        import os
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        server_path = os.path.join(project_root, 'dist', 'index.js')

        tester = SimpleStressTester(['node', server_path])
        tester.start_server()

        # Get initial memory
        initial_memory = tester.check_memory()

        # Hammer for 10 seconds
        results = tester.hammer_server(seconds=10)

        # Get final memory
        final_memory = tester.check_memory()

        # Check results
        self.assertIn('memory_start', results)
        self.assertIn('memory_end', results)
        self.assertIn('memory_leak_detected', results)

        # Memory should be tracked
        self.assertAlmostEqual(results['memory_start'], initial_memory, delta=5)
        self.assertAlmostEqual(results['memory_end'], final_memory, delta=5)

        tester.stop_server()


if __name__ == '__main__':
    unittest.main(verbosity=1)