"""
Test runner that writes output to a file.
Run: python run_tests.py
"""
import subprocess
import sys
import os

os.environ["DATABASE_URL"] = "sqlite:///./test.db"

result = subprocess.run(
    [sys.executable, "-m", "pytest", "tests/", "-v", "--tb=short"],
    capture_output=True,
    text=True,
    cwd=os.path.dirname(__file__),
    env={**os.environ, "DATABASE_URL": "sqlite:///./test.db"},
    timeout=120,
)

output = result.stdout + result.stderr
print(output)
with open("test_results.txt", "w") as f:
    f.write(output)
    f.write(f"\nReturn code: {result.returncode}\n")
sys.exit(result.returncode)
