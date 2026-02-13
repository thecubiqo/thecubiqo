# Henry's Phase 2 Coordination Plan

Henry, you are coordinating Phase 2 completion. Here's your mission:

## Your Role
You are the delivery lead. Spawn specialized agents, track their progress, verify their work, and report back.

## Phase 2 Tasks (Spawn in Parallel)

### Task 1: Supabase Database Integration
**Spawn:** Dev  
**Task:** "Set up Supabase project with tables for agents, sessions, messages, and tasks. Migrate SessionStore from in-memory to Supabase. Keep backward compatibility. Document the schema in docs/DATABASE.md"

**Success Criteria:**
- Supabase project created
- Tables defined and migrated
- SessionStore uses Supabase
- No breaking changes
- Tests pass

### Task 2: Swift Language Support
**Spawn:** Dev  
**Task:** "Add Swift code execution to /api/code/execute. Install Swift toolchain in sandbox, add Swift language handler, test basic Swift scripts. Document usage in docs/SWIFT_SUPPORT.md"

**Success Criteria:**
- Swift scripts can execute
- Basic Swift code works (variables, functions, classes)
- Error handling proper
- Documentation complete

### Task 3: API Documentation
**Spawn:** Writer  
**Task:** "Create comprehensive API documentation in docs/API.md covering all /api routes: /agents, /agents/[id]/run, /agents/[id]/spawn, /agents/[id]/tasks, /agents/[id]/sessions, /code/execute, /code/file-ops, /voice/command. Include examples, request/response formats, error codes."

**Success Criteria:**
- All endpoints documented
- Request/response examples included
- Error codes listed
- Easy to follow

### Task 4: Test Suite for Agent Engine
**Spawn:** Tester  
**Task:** "Create test suite for agent engine. Test agent creation, spawning, tool execution, session management. Use Jest or Vitest. Put tests in tests/engine/ directory. Aim for 80%+ coverage of core engine."

**Success Criteria:**
- Test files created
- Tests cover agent spawn/run/stop
- Tests cover tool execution
- All tests pass
- Coverage report generated

### Task 5: Landing Page Copy
**Spawn:** Marketing  
**Task:** "Update landing page copy to highlight the self-coding agent capability. Focus on: 'AI agents that build and coordinate other AI agents.' Include benefits, use cases, and clear CTA. Update src/app/page.tsx"

**Success Criteria:**
- Compelling headline
- Clear value proposition
- Benefits-focused copy
- Strong CTA
- Professional tone

## Coordination Rules

1. **Spawn all tasks immediately** (parallel execution)
2. **Check status every 5 minutes** via sessions_send
3. **If a task fails**, respawn with clarified instructions
4. **When all tasks done**, run Tester to validate everything
5. **Report back** with summary of what was accomplished

## Communication Pattern

**To spawn:**
```
sessions_spawn(task="[detailed task description]", agentId="dev", label="Task 1: Supabase")
```

**To check status:**
```
sessions_send(agentId="dev", message="What's your progress on Supabase integration?")
```

**To verify:**
```
sessions_send(agentId="tester", message="Run tests on the agent engine and report results")
```

## Success Metrics

- All 5 tasks spawned
- All 5 tasks completed
- Tests pass
- Build succeeds
- Deployed to production

## Timeline

Target: 3-4 hours for full Phase 2 completion with parallel agent work.

---

**Henry, this is your mission. Coordinate the team. Build Phase 2. Report back when complete.**
