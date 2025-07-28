#!/usr/bin/env python3
"""
MCP Time Server Stress Test Runner
==================================
Easy to use stress test runner with configuration support.

Usage:
    python3 run_stress_test.py                    # Run standard test
    python3 run_stress_test.py quick              # Run quick 10s test
    python3 run_stress_test.py sustained          # Run 5-minute test
    python3 run_stress_test.py cache_flood        # Run cache flooding test
    python3 run_stress_test.py --list-scenarios   # Show available scenarios
    python3 run_stress_test.py --config           # Show configuration
"""

import sys
import argparse
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

import config
from stress_tester import ConfigurableStressTester


def list_scenarios():
    """List all available test scenarios"""
    print("\nAvailable Test Scenarios:")
    print("=" * 60)
    for name, scenario in config.TEST_SCENARIOS.items():
        print(f"\n{name}:")
        print(f"  Description: {scenario['description']}")
        print(f"  Duration: {scenario['duration']} seconds")
        print(f"  Request type: {scenario['request_type']}")


def show_config():
    """Show current configuration"""
    print(config.get_config_summary())


def run_test(scenario='standard', duration=None):
    """Run a stress test with the specified scenario"""
    if scenario not in config.TEST_SCENARIOS:
        print(f"Error: Unknown scenario '{scenario}'")
        print("Use --list-scenarios to see available scenarios")
        return 1
    
    # Create tester
    tester = ConfigurableStressTester()
    
    print(f"\nMCP Time Server Stress Test")
    print(f"Scenario: {scenario}")
    print(f"Description: {config.TEST_SCENARIOS[scenario]['description']}")
    
    # Override duration if specified
    test_duration = duration or config.TEST_SCENARIOS[scenario]['duration']
    print(f"Duration: {test_duration} seconds")
    
    try:
        # Start server
        print("\nStarting server...")
        tester.start_server()
        
        # Run test
        results = tester.hammer_server(seconds=test_duration, scenario=scenario)
        
        # Print summary
        tester.print_summary(results)
        
        return 0 if not results['memory_leak_detected'] else 1
        
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        return 130
        
    except Exception as e:
        print(f"\nError during test: {e}")
        return 1
        
    finally:
        print("\nStopping server...")
        tester.stop_server()


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Run stress tests on MCP Time Server',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s                    # Run standard 60s test
  %(prog)s quick              # Run quick 10s test  
  %(prog)s sustained          # Run 5-minute test
  %(prog)s cache_flood        # Test cache flooding
  %(prog)s standard 120       # Run standard test for 120 seconds
  %(prog)s --list-scenarios   # Show all scenarios
  %(prog)s --config           # Show configuration
        """
    )
    
    parser.add_argument(
        'scenario',
        nargs='?',
        default='standard',
        help='Test scenario to run (default: standard)'
    )
    
    parser.add_argument(
        'duration',
        nargs='?',
        type=int,
        help='Override test duration in seconds'
    )
    
    parser.add_argument(
        '--list-scenarios',
        action='store_true',
        help='List available test scenarios'
    )
    
    parser.add_argument(
        '--config',
        action='store_true',
        help='Show current configuration'
    )
    
    # Handle shortcuts
    if len(sys.argv) > 1:
        if sys.argv[1] == 'quick':
            sys.argv[1] = 'standard'
            sys.argv.insert(2, str(config.QUICK_TEST_DURATION))
        elif sys.argv[1] == 'sustained':
            sys.argv[1] = 'standard' 
            sys.argv.insert(2, str(config.SUSTAINED_TEST_DURATION))
    
    args = parser.parse_args()
    
    # Handle special commands
    if args.list_scenarios:
        list_scenarios()
        return 0
        
    if args.config:
        show_config()
        return 0
    
    # Run the test
    return run_test(args.scenario, args.duration)


if __name__ == "__main__":
    sys.exit(main())