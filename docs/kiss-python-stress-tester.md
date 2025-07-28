# KISS Python MCP Stress Tester

## Philosophy: Start Small, Add As Needed

NO kitchen sinks on bicycles! Just a simple bike that works.

## Phase 1: Minimum Viable Tester (What We Need NOW)

```python
# stress_test.py - That's it, one file to start!

import subprocess
import time
import psutil
import json

class SimpleStressTester:
    def __init__(self, server_cmd):
        self.server_cmd = server_cmd
        self.process = None
        
    def start_server(self):
        """Just start the darn server"""
        self.process = subprocess.Popen(self.server_cmd)
        time.sleep(2)  # Let it warm up
        
    def check_memory(self):
        """Is it leaking?"""
        proc = psutil.Process(self.process.pid)
        return proc.memory_info().rss / 1024 / 1024  # MB
        
    def hammer_server(self, minutes=5):
        """Just hit it with requests"""
        # Your test code here
        pass
        
    def stop_server(self):
        """Clean up"""
        self.process.terminate()
```

## Phase 2: Add What We Actually Need (Not What We Might Need)

### Need: Memory leak detection? Add it:
```python
def test_memory_leak(self):
    start_mem = self.check_memory()
    self.hammer_server(minutes=5)
    end_mem = self.check_memory()
    
    if end_mem > start_mem * 1.5:  # 50% growth = BAD
        print(f"LEAK! {start_mem}MB → {end_mem}MB")
    else:
        print(f"STABLE: {start_mem}MB → {end_mem}MB")
```

### Need: Cache testing? Add it:
```python
def test_cache_flooding(self):
    # Just add the specific test when we need it
    pass
```

## Usage: Dead Simple

```bash
# Run our basic memory test
python stress_test.py memory

# Need more? Add it THEN:
python stress_test.py cache
python stress_test.py ratelimit
```

## File Structure: Keep It Flat

```
tests/stress/
  stress_test.py         # Main runner
  test_memory.py         # Add when needed
  test_cache.py          # Add when needed
  results/               # JSON logs go here
```

## Output: Just What Matters

```
Memory Test (5 minutes)
Start: 50MB
End: 52MB
Status: PASS ✓
Details: results/memory_2025-01-28.json
```

## Modular Growth Plan

1. **Start**: One file, one test (memory leak)
2. **Add as needed**: Each new concern = new test file
3. **No abstractions**: Until we have 3+ similar things
4. **No frameworks**: Until manual becomes painful

## What We DON'T Build (Yet)

- ❌ Plugin architecture
- ❌ Abstract base classes  
- ❌ Configuration files
- ❌ Web UI
- ❌ Multi-server support
- ❌ Cloud deployment
- ❌ Docker containers
- ❌ Report generators

## What We DO Build

- ✅ One test that finds memory leaks
- ✅ Add cache test when we need it
- ✅ Add rate limit test when we need it
- ✅ Simple, readable, works

## Example: Our First Test

```python
#!/usr/bin/env python3
"""
MCP Time Server Memory Leak Test
Usage: python stress_test.py
"""

import subprocess
import time
import psutil
import requests
import json
from datetime import datetime

def test_memory_leak():
    # Start server
    server = subprocess.Popen(['node', 'dist/index.js'])
    time.sleep(2)
    
    # Get baseline
    proc = psutil.Process(server.pid)
    start_mem = proc.memory_info().rss / 1024 / 1024
    
    # Hammer it
    print(f"Starting memory test... Initial: {start_mem:.1f}MB")
    for i in range(10000):
        # Make MCP request here
        if i % 1000 == 0:
            current_mem = proc.memory_info().rss / 1024 / 1024
            print(f"Request {i}: {current_mem:.1f}MB")
    
    # Check result
    end_mem = proc.memory_info().rss / 1024 / 1024
    growth = ((end_mem - start_mem) / start_mem) * 100
    
    print(f"\nResults:")
    print(f"Start: {start_mem:.1f}MB")
    print(f"End: {end_mem:.1f}MB")
    print(f"Growth: {growth:.1f}%")
    
    # Clean up
    server.terminate()
    
    # Simple pass/fail
    if growth > 20:
        print("❌ FAIL: Memory grew > 20%")
        return 1
    else:
        print("✅ PASS: Memory stable")
        return 0

if __name__ == "__main__":
    exit(test_memory_leak())
```

That's it. One file. One test. Add more when we need them.

KISS achieved! 🚴