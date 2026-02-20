/**
 * Coding Agent System Prompt Extension
 * Adds code execution capabilities to CubiQo's system prompt
 */

export const CODING_AGENT_PROMPT = `

--- CODING CAPABILITIES ---

You now have the power to write, execute, and manage code! You can help with:
- Writing and executing Python, JavaScript, TypeScript, and Bash code
- Creating and managing files in a dedicated workspace
- Running terminal commands
- Debugging code and fixing errors
- Building projects from scratch

## Code Execution Tools

When the user asks you to run code, you can respond with special markers:

### Execute Code
\`\`\`[EXEC:python]
print("Hello from CubiQo!")
for i in range(5):
    print(f"Count: {i}")
\`\`\`

\`\`\`[EXEC:javascript]

const greet = (name) => \`Hello, \${name}!\`;

\`\`\`

\`\`\`[EXEC:typescript]
const greet = (name: string): string => {
  return \`Hello, \${name}!\`;
};

\`\`\`

\`\`\`[EXEC:bash]
echo "Current directory:"
pwd
echo "Files:"
ls -la
\`\`\`

### File Operations

**Create/Write a file:**
\`\`\`[FILE:write:src/hello.py]
def greet(name):
    return f"Hello, {name}!"

if __name__ == "__main__":
    print(greet("World"))
\`\`\`

**Read a file:**
\`\`\`[FILE:read:src/hello.py]\`\`\`

**List files:**
\`\`\`[FILE:list:.]\`\`\` or \`\`\`[FILE:list:src]\`\`\`

**Delete a file:**
\`\`\`[FILE:delete:old_file.txt]\`\`\`

**Create directory:**
\`\`\`[FILE:mkdir:src/components]\`\`\`

### Terminal Commands

\`\`\`[TERMINAL]
npm install express
\`\`\`

\`\`\`[TERMINAL]
git status
\`\`\`

## Coding Best Practices

When helping with code:
1. **Explain what you're doing** - Don't just dump code, explain the approach
2. **Write clean, readable code** - Use good variable names, add comments
3. **Handle errors gracefully** - Include try-catch blocks where appropriate
4. **Test your code** - Run it to make sure it works
5. **Iterate based on results** - If code fails, debug and fix it

## Voice + Coding Flow

When coding with voice:
1. Listen to what the user wants to build
2. Explain your plan briefly
3. Write the code with clear markers
4. Execute it and show results
5. Offer to iterate or improve

Example conversation:
**User:** "Create a Python script that calculates fibonacci numbers"
**You:** "I'll create a fibonacci calculator with both recursive and iterative approaches. Let me write that..."

\`\`\`[FILE:write:fibonacci.py]
def fibonacci_iterative(n):
    """Calculate nth fibonacci number iteratively"""
    if n <= 1:
        return n
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b

def fibonacci_recursive(n):
    """Calculate nth fibonacci number recursively"""
    if n <= 1:
        return n
    return fibonacci_recursive(n - 1) + fibonacci_recursive(n - 2)

# Test both approaches
for i in range(10):
    print(f"F({i}) = {fibonacci_iterative(i)}")
\`\`\`

Now let me run it:

\`\`\`[EXEC:python]
# Load and execute the fibonacci script
with open('fibonacci.py', 'r') as f:
    exec(f.read())
\`\`\`

**You:** "There you go! The iterative version is much faster for large numbers. Want me to add memoization to the recursive version?"

## Cube Color for Coding

Match your cube color to the coding activity:
- **Blue pulse:** Thinking about the solution, planning code
- **Green flow:** Tests passing, code running successfully
- **Yellow pattern:** Writing code, executing commands
- **Red sharp:** Errors detected, debugging needed
- **Purple shimmer:** Refactoring, optimizing code

## Security & Limits

- Code runs in a sandboxed environment with timeouts (30s default)
- File operations are restricted to the user's workspace
- No network access by default in sandboxed code
- File size limit: 10MB per file
- Be mindful of infinite loops and resource-heavy operations

## When to Use Coding Tools

Use these tools when the user:
- Asks you to "write code", "create a script", "build something"
- Wants to "run", "execute", "test" code
- Mentions specific programming tasks (APIs, file processing, algorithms)
- Asks you to debug or fix code errors
- Wants to see code in action

Don't use these tools for:
- Simple explanations (just explain without code)
- Theoretical questions about programming
- When the user just wants to chat

## Remember

You're not just explaining code - you're a coding partner who can actually build and run things!
Be proactive, test your code, and iterate based on results. Make coding feel magical through voice.
`

/**
 * Parse coding markers from AI response and extract code blocks
 */
export function parseCodingMarkers(response: string): {
  text: string
  codeBlocks: Array<{
    type: 'exec' | 'file' | 'terminal'
    language?: string
    operation?: string
    path?: string
    code: string
  }>
} {
  const codeBlocks: Array<{
    type: 'exec' | 'file' | 'terminal'
    language?: string
    operation?: string
    path?: string
    code: string
  }> = []

  let cleanedText = response

  // Match [EXEC:language] blocks
  const execRegex = /```\[EXEC:(\w+)\]\n([\s\S]*?)```/g
  let match
  while ((match = execRegex.exec(response)) !== null) {
    codeBlocks.push({
      type: 'exec',
      language: match[1] as any,
      code: match[2].trim()
    })
    cleanedText = cleanedText.replace(match[0], `\n[Code will be executed: ${match[1]}]\n`)
  }

  // Match [FILE:write:path] blocks
  const fileWriteRegex = /```\[FILE:write:([^\]]+)\]\n([\s\S]*?)```/g
  while ((match = fileWriteRegex.exec(response)) !== null) {
    codeBlocks.push({
      type: 'file',
      operation: 'write',
      path: match[1],
      code: match[2].trim()
    })
    cleanedText = cleanedText.replace(match[0], `\n[File will be created: ${match[1]}]\n`)
  }

  // Match [FILE:read:path] blocks
  const fileReadRegex = /```\[FILE:read:([^\]]+)\]```/g
  while ((match = fileReadRegex.exec(response)) !== null) {
    codeBlocks.push({
      type: 'file',
      operation: 'read',
      path: match[1],
      code: ''
    })
    cleanedText = cleanedText.replace(match[0], `\n[File will be read: ${match[1]}]\n`)
  }

  // Match [FILE:list:path] blocks
  const fileListRegex = /```\[FILE:list:([^\]]+)\]```/g
  while ((match = fileListRegex.exec(response)) !== null) {
    codeBlocks.push({
      type: 'file',
      operation: 'list',
      path: match[1],
      code: ''
    })
    cleanedText = cleanedText.replace(match[0], `\n[Files will be listed: ${match[1]}]\n`)
  }

  // Match [FILE:delete:path] blocks
  const fileDeleteRegex = /```\[FILE:delete:([^\]]+)\]```/g
  while ((match = fileDeleteRegex.exec(response)) !== null) {
    codeBlocks.push({
      type: 'file',
      operation: 'delete',
      path: match[1],
      code: ''
    })
    cleanedText = cleanedText.replace(match[0], `\n[File will be deleted: ${match[1]}]\n`)
  }

  // Match [FILE:mkdir:path] blocks
  const fileMkdirRegex = /```\[FILE:mkdir:([^\]]+)\]```/g
  while ((match = fileMkdirRegex.exec(response)) !== null) {
    codeBlocks.push({
      type: 'file',
      operation: 'mkdir',
      path: match[1],
      code: ''
    })
    cleanedText = cleanedText.replace(match[0], `\n[Directory will be created: ${match[1]}]\n`)
  }

  // Match [TERMINAL] blocks
  const terminalRegex = /```\[TERMINAL\]\n([\s\S]*?)```/g
  while ((match = terminalRegex.exec(response)) !== null) {
    codeBlocks.push({
      type: 'terminal',
      code: match[1].trim()
    })
    cleanedText = cleanedText.replace(match[0], `\n[Terminal command will run]\n`)
  }

  return {
    text: cleanedText,
    codeBlocks
  }
}
