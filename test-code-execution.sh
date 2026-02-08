#!/bin/bash

# Test script for CubiQo Code Execution API
# Run this after starting the dev server: npm run dev

API_BASE="http://localhost:3000/api/code"
SESSION_ID="test-$(date +%s)"

echo "🧪 Testing CubiQo Code Execution API"
echo "Session ID: $SESSION_ID"
echo ""

# Test 1: Python execution
echo "Test 1: Execute Python code"
curl -s -X POST "$API_BASE/execute" \
  -H "Content-Type: application/json" \
  -d "{
    \"language\": \"python\",
    \"code\": \"print('Hello from CubiQo!')\nfor i in range(5):\n    print(f'Count: {i}')\",
    \"sessionId\": \"$SESSION_ID\"
  }" | jq .
echo ""

# Test 2: JavaScript execution
echo "Test 2: Execute JavaScript code"
curl -s -X POST "$API_BASE/execute" \
  -H "Content-Type: application/json" \
  -d "{
    \"language\": \"javascript\",
    \"code\": \"console.log('Hello from Node.js'); console.log('2 + 2 =', 2 + 2);\",
    \"sessionId\": \"$SESSION_ID\"
  }" | jq .
echo ""

# Test 3: Write file
echo "Test 3: Write file"
curl -s -X POST "$API_BASE/file-ops" \
  -H "Content-Type: application/json" \
  -d "{
    \"operation\": \"write\",
    \"path\": \"hello.py\",
    \"content\": \"def greet(name):\\n    return f'Hello, {name}!'\\n\\nprint(greet('World'))\",
    \"sessionId\": \"$SESSION_ID\"
  }" | jq .
echo ""

# Test 4: Read file
echo "Test 4: Read file"
curl -s -X POST "$API_BASE/file-ops" \
  -H "Content-Type: application/json" \
  -d "{
    \"operation\": \"read\",
    \"path\": \"hello.py\",
    \"sessionId\": \"$SESSION_ID\"
  }" | jq .
echo ""

# Test 5: Execute the file we created
echo "Test 5: Execute the file we created"
curl -s -X POST "$API_BASE/execute" \
  -H "Content-Type: application/json" \
  -d "{
    \"language\": \"python\",
    \"code\": \"with open('hello.py', 'r') as f:\\n    exec(f.read())\",
    \"sessionId\": \"$SESSION_ID\"
  }" | jq .
echo ""

# Test 6: List files
echo "Test 6: List files in workspace"
curl -s "$API_BASE/file-ops?sessionId=$SESSION_ID&path=." | jq .
echo ""

# Test 7: Terminal command
echo "Test 7: Execute terminal command"
curl -s -X POST "$API_BASE/terminal" \
  -H "Content-Type: application/json" \
  -d "{
    \"command\": \"pwd && ls -la && echo 'Terminal works!'\",
    \"sessionId\": \"$SESSION_ID\"
  }" | jq .
echo ""

# Test 8: Create directory
echo "Test 8: Create directory"
curl -s -X POST "$API_BASE/file-ops" \
  -H "Content-Type: application/json" \
  -d "{
    \"operation\": \"create-dir\",
    \"path\": \"src/components\",
    \"sessionId\": \"$SESSION_ID\"
  }" | jq .
echo ""

# Test 9: Write file in new directory
echo "Test 9: Write file in new directory"
curl -s -X POST "$API_BASE/file-ops" \
  -H "Content-Type: application/json" \
  -d "{
    \"operation\": \"write\",
    \"path\": \"src/components/Button.js\",
    \"content\": \"export const Button = () => <button>Click me</button>\",
    \"sessionId\": \"$SESSION_ID\"
  }" | jq .
echo ""

# Test 10: List files in directory
echo "Test 10: List files in src/components"
curl -s "$API_BASE/file-ops?sessionId=$SESSION_ID&path=src/components" | jq .
echo ""

echo "✅ All tests complete!"
echo "Workspace location: /tmp/cubiqo-workspaces/$SESSION_ID"
