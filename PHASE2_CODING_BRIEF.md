# CubiQo Phase 2: Coding Agent Integration

## Mission
Add coding capabilities to CubiQo - make it able to write, execute, debug, and deploy code like Henry.

---

## Current State (Phase 1)
- ✅ Voice interaction
- ✅ Energy cube visualization
- ✅ Multi-modal AI (Claude, GPT-4, Emergent)
- ✅ Emotion detection
- ✅ Madhyama marg voice modulation

## Phase 2 Goal
Transform CubiQo from conversational AI → **full-stack coding assistant**

---

## Core Features to Add

### 1. Code Execution Environment
- Sandboxed code execution (Python, JavaScript, TypeScript)
- Terminal access with command execution
- Process management (background tasks)
- Safe environment isolation

### 2. File System Integration
- Read/write files
- Project structure navigation
- Git operations (commit, push, pull)
- File search and indexing

### 3. Development Tools
- **exec:** Run shell commands
- **read:** Read files with syntax highlighting
- **write:** Create/edit files
- **browser:** Control web browsers for testing
- **git:** Version control operations

### 4. Project Context Awareness
- Understand project structure
- Track dependencies
- Parse package.json, requirements.txt, etc.
- Maintain working directory context

### 5. AI-Powered Coding Features
- Code generation from natural language
- Debug error messages
- Refactor existing code
- Generate tests
- Explain complex code sections
- Review pull requests

### 6. Voice + Visual Coding
- Voice commands: "Create a React component for..."
- Cube visualization reflects code complexity:
  - Green: Clean, simple code
  - Yellow: Moderate complexity
  - Red: Complex, needs refactoring
- Real-time code quality feedback

---

## Technical Architecture

### Backend Services
```
CubiQo Coding Stack:
┌─────────────────────────────────┐
│   Voice Input (existing)        │
├─────────────────────────────────┤
│   AI Router (Claude/GPT-4)      │
├─────────────────────────────────┤
│   NEW: Code Agent Service       │
│   - Execution sandbox           │
│   - File operations             │
│   - Git integration             │
│   - Terminal emulation          │
├─────────────────────────────────┤
│   Visualization Engine          │
│   - Code quality metrics        │
│   - Execution status            │
├─────────────────────────────────┤
│   Voice Output (existing)       │
└─────────────────────────────────┘
```

### API Endpoints to Add

#### `/api/code/execute`
```typescript
POST /api/code/execute
{
  language: "python" | "javascript" | "typescript" | "bash",
  code: string,
  context?: {
    workdir: string,
    env: Record<string, string>
  }
}
Response: {
  stdout: string,
  stderr: string,
  exitCode: number,
  executionTime: number
}
```

#### `/api/code/file-ops`
```typescript
POST /api/code/file-ops
{
  operation: "read" | "write" | "delete" | "list",
  path: string,
  content?: string
}
```

#### `/api/code/git`
```typescript
POST /api/code/git
{
  operation: "status" | "commit" | "push" | "pull",
  message?: string,
  branch?: string
}
```

#### `/api/code/project-analyze`
```typescript
POST /api/code/project-analyze
{
  path: string
}
Response: {
  structure: FileTree,
  dependencies: Dependency[],
  languages: string[],
  complexity: number,
  issues: Issue[]
}
```

---

## Security Considerations

### Sandboxing
- Execute code in isolated containers (Docker/VM)
- Resource limits (CPU, memory, disk)
- Network restrictions (whitelist only)
- File system access control (workspace only)

### Authentication
- Coding features require authentication
- Admin can enable/disable per user
- Usage tracking and rate limiting
- Spending caps for compute resources

### Permissions
- User workspace isolation
- Git credentials handled securely
- Environment variables encrypted
- Audit logging for all operations

---

## User Experience

### Voice Interactions
**User:** "Create a React component that displays a user profile"
**CubiQo:** *[Cube shifts to blue (thinking)]* "Creating UserProfile component with props interface..."
*[Writes code, shows in UI]*
**CubiQo:** "Component created. Want me to add TypeScript types or tests?"

**User:** "Run the tests"
**CubiQo:** *[Cube pulses green (executing)]* "Running test suite..."
*[Executes: npm test]*
**CubiQo:** "All 12 tests passed. Code coverage: 94%"

**User:** "Commit this with message 'Add user profile component'"
**CubiQo:** *[Cube flows yellow (writing)]* "Committed to branch main. Ready to push?"

### Visual Feedback
- **Blue pulse:** Thinking/planning code
- **Green flow:** Tests passing, clean code
- **Yellow pattern:** Writing/executing
- **Red sharp:** Errors detected
- **Purple shimmer:** Refactoring/optimizing

---

## Implementation Plan

### Phase 2A: Core Execution (2 weeks)
- [ ] Code execution sandbox (Python, JS, TS)
- [ ] File read/write API
- [ ] Terminal emulation
- [ ] Basic voice commands for coding

### Phase 2B: Development Tools (2 weeks)
- [ ] Git integration
- [ ] Package manager support (npm, pip)
- [ ] Project structure analysis
- [ ] Dependency management

### Phase 2C: AI Coding Features (3 weeks)
- [ ] Code generation from voice
- [ ] Debugging assistance
- [ ] Test generation
- [ ] Code review/refactoring
- [ ] Documentation generation

### Phase 2D: Advanced Integration (2 weeks)
- [ ] Browser automation (testing)
- [ ] Database operations
- [ ] API testing tools
- [ ] CI/CD integration

### Phase 2E: Visualization & Polish (1 week)
- [ ] Code complexity visualization
- [ ] Real-time execution feedback
- [ ] Error highlighting in cube
- [ ] Performance metrics display

---

## Tech Stack Additions

### New Dependencies
```json
{
  "dependencies": {
    "@e2b/code-interpreter": "^1.0.0",  // Sandboxed code execution
    "simple-git": "^3.20.0",            // Git operations
    "node-pty": "^1.0.0",               // Terminal emulation
    "prettier": "^3.0.0",               // Code formatting
    "eslint": "^8.0.0",                 // Code linting
    "typescript": "^5.0.0",             // TypeScript support
    "vm2": "^3.9.19",                   // JavaScript sandbox
    "dockerode": "^4.0.0"               // Docker container management
  }
}
```

### Infrastructure
- Docker for code execution sandboxes
- Redis for task queue (long-running compilations)
- PostgreSQL for code session history
- S3/Blob storage for workspace files

---

## Pricing Model

### Compute Resources
- **Free Tier:** 100 code executions/day, 1 CPU core, 512MB RAM
- **Pro Tier ($29/mo):** 1000 executions/day, 2 CPU cores, 2GB RAM
- **Team Tier ($99/mo):** Unlimited executions, 4 CPU cores, 8GB RAM

### Storage
- 1GB workspace storage included
- Additional storage: $5/GB/month

---

## Success Metrics
- [ ] Voice-to-code accuracy > 85%
- [ ] Code execution latency < 2s
- [ ] Test generation coverage > 80%
- [ ] User satisfaction score > 4.5/5
- [ ] Zero security incidents

---

## Timeline
- **Phase 2A:** Week 1-2
- **Phase 2B:** Week 3-4
- **Phase 2C:** Week 5-7
- **Phase 2D:** Week 8-9
- **Phase 2E:** Week 10
- **Beta Launch:** Week 11
- **Production:** Week 12

---

## Team Assignment

### Dev Agent
- Build code execution sandbox
- Implement file operations API
- Git integration
- Terminal emulation

### AI Agent  
- Code generation prompts
- Debugging assistance logic
- Test generation algorithms
- Code review system

### Security Agent
- Sandbox security audit
- Permission system implementation
- Rate limiting
- Audit logging

### UX Agent
- Voice command design
- Visual feedback for code operations
- Error message UX
- Tutorial/onboarding

---

**Status:** Ready to start Phase 2A  
**Next Step:** Spawn Dev agent to build execution sandbox
