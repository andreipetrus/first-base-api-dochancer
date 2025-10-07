#!/bin/bash

# Load test environment variables
if [ -f "tests/e2e/.env.test" ]; then
  export $(cat tests/e2e/.env.test | grep -v '^#' | xargs)
fi

# Ensure servers are running
echo "Starting development servers..."
npm run dev &
DEV_PID=$!

# Wait for servers to be ready
echo "Waiting for servers to start..."
sleep 5

# Check if frontend is responding
curl -s http://localhost:5173 > /dev/null
if [ $? -ne 0 ]; then
  echo "Frontend server not responding. Waiting longer..."
  sleep 10
fi

# Run tests
echo "Running E2E tests in headless mode..."
npm run test:e2e

# Capture test result
TEST_RESULT=$?

# Kill dev servers
kill $DEV_PID 2>/dev/null

# Show test results
if [ $TEST_RESULT -eq 0 ]; then
  echo "✅ All tests passed!"
else
  echo "❌ Some tests failed. Run 'npm run test:e2e:report' to see the report."
fi

exit $TEST_RESULT