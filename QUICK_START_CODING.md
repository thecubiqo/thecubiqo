# CubiQo Coding Agent - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Start the Development Server
```bash
cd /root/clawd/thecubiqo
npm run dev
```

### 2. Test the API (in another terminal)
```bash
./test-code-execution.sh
```

You should see successful responses for:
- ✅ Python execution
- ✅ JavaScript execution
- ✅ File operations
- ✅ Terminal commands

---

## 💬 Try Voice Commands

Open CubiQo in your browser: `http://localhost:3000`

Then try these voice commands:

### Example 1: Create a Python Script
**Say:** "Create a Python script that prints the first 10 fibonacci numbers"

**CubiQo will:**
1. Write the fibonacci.py file
2. Execute it
3. Show you the results
4. Offer to improve it

### Example 2: Set Up a Node Project
**Say:** "Create a Node.js Express server"

**CubiQo will:**
1. Create package.json
2. Write server.js
3. Run npm install (optional)
4. Show you how to start it

### Example 3: List Files
**Say:** "What files are in my workspace?"

**CubiQo will:**
- List all files and folders
- Show file sizes and dates

### Example 4: Debug Code
**Say:** "My Python script has an error. Can you fix it?"

**CubiQo will:**
1. Read your file
2. Identify the error
3. Suggest a fix
4. Optionally rewrite the file
5. Test it again

---

## 🔧 Manual API Testing

### Execute Python Code
```bash
curl -X POST http://localhost:3000/api/code/execute \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "code": "print(\"Hello CubiQo!\")",
    "sessionId": "my-session"
  }'
```

### Write a File
```bash
curl -X POST http://localhost:3000/api/code/file-ops \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "write",
    "path": "hello.py",
    "content": "print(\"Hello World\")",
    "sessionId": "my-session"
  }'
```

### Read a File
```bash
curl -X POST http://localhost:3000/api/code/file-ops \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "read",
    "path": "hello.py",
    "sessionId": "my-session"
  }'
```

### List Files
```bash
curl http://localhost:3000/api/code/file-ops?sessionId=my-session&path=.
```

### Run Terminal Command
```bash
curl -X POST http://localhost:3000/api/code/terminal \
  -H "Content-Type: application/json" \
  -d '{
    "command": "ls -la",
    "sessionId": "my-session"
  }'
```

---

## 🎨 Use in React Components

```typescript
import { useCodeExecution } from '@/hooks/useCodeExecution'

function MyComponent() {
  const { execute, write, list } = useCodeExecution('my-session')

  const runExample = async () => {
    // Write a file
    await write('script.py', 'print("Hello World")')

    // Execute it
    const result = await execute('python', 'exec(open("script.py").read())')
    console.log(result.stdout) // "Hello World"

    // List files
    const files = await list('.')
    console.log(files.data.files)
  }

  return <button onClick={runExample}>Run Example</button>
}
```

---

## 📚 Learn More

- **Full API Documentation:** [docs/CODING_AGENT_API.md](docs/CODING_AGENT_API.md)
- **Phase 2 Brief:** [PHASE2_CODING_BRIEF.md](PHASE2_CODING_BRIEF.md)
- **Completion Report:** [PHASE2A_COMPLETE.md](PHASE2A_COMPLETE.md)

---

## 🐛 Troubleshooting

### Build Errors
```bash
npm run build
```

### TypeScript Errors
Most TypeScript errors in test files can be ignored. Our new code compiles cleanly.

### API Not Responding
1. Check if dev server is running: `npm run dev`
2. Check the terminal for error messages
3. Verify the workspace directory exists: `/tmp/cubiqo-workspaces/`

### Permission Errors
```bash
# Ensure workspace directory is writable
mkdir -p /tmp/cubiqo-workspaces
chmod 777 /tmp/cubiqo-workspaces
```

---

## 🎯 What's Next?

### Phase 2B: Development Tools (Next Sprint)
- Git integration (commit, push, pull)
- Package manager support (npm, pip)
- Project structure analysis
- Dependency management

### Try These Advanced Examples
1. **Create a React component**
   - "Create a React button component with TypeScript"
   
2. **Set up a database**
   - "Create a SQLite database with a users table"
   
3. **Build an API**
   - "Create an Express API with a /users endpoint"
   
4. **Data analysis**
   - "Analyze this CSV file and show me statistics"

---

## ✅ Verification Checklist

- [ ] Dev server running (`npm run dev`)
- [ ] Test script passes (`./test-code-execution.sh`)
- [ ] Can execute Python code via API
- [ ] Can create and read files
- [ ] Can run terminal commands
- [ ] Voice commands work in browser

---

**🎉 You're ready to code with CubiQo!**

For questions or issues, check the full documentation or create an issue on GitHub.
