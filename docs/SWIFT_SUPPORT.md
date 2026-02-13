# Swift Language Support Plan

## Overview
Add Swift code execution to CubiQo's code execution engine.

## Requirements

### 1. Swift Toolchain Installation
```bash
# Install Swift on the server
curl -s https://swift.org/install/linux.sh | bash

# Or use Docker with Swift pre-installed
FROM swift:5.9-jammy
```

### 2. Code Execution API Updates

**File:** `src/app/api/code/execute/route.ts`

Add Swift language handler:
```typescript
case 'swift':
  // Create temp .swift file
  // Run: swift <file>.swift
  // Capture stdout/stderr
  // Return result
```

### 3. REPL Support (Optional)
Swift has an interactive REPL:
```bash
swift repl
```

### 4. Package Manager Integration

Swift Package Manager (SPM) support:
```bash
# Initialize SPM project
swift package init --type executable

# Build
swift build

# Run
swift run
```

## Implementation Steps

1. **Install Swift toolchain** in sandbox environment
2. **Add language handler** to code execution API
3. **Test execution:** simple print statements
4. **Test imports:** Foundation, SwiftUI basics
5. **Add SPM support:** multi-file projects
6. **UI updates:** Swift syntax highlighting in CodePanel

## Testing

```swift
// Test 1: Basic execution
print("Hello from Swift!")

// Test 2: Variables and types
let name = "CubiQo"
var count = 42
print("\(name) has \(count) agents")

// Test 3: Functions
func greet(_ name: String) -> String {
    return "Hello, \(name)!"
}
print(greet("Ed"))

// Test 4: Classes
class Agent {
    var name: String
    init(name: String) {
        self.name = name
    }
}
let henry = Agent(name: "Henry")
print(henry.name)
```

## Security Considerations

- Run in isolated sandbox
- Timeout limits (30s default)
- Memory limits
- No file system access outside workspace
- No network access (unless explicitly allowed)

## Timeline

- **Phase 1:** Install toolchain + basic execution (2-3 hours)
- **Phase 2:** SPM support (2-3 hours)
- **Phase 3:** Advanced features (REPL, UI) (3-4 hours)

**Total estimate:** 8-10 hours for full Swift support

## Alternatives

If server installation is blocked, use:
- **Swift Sandbox API** (online service)
- **Docker container** with Swift pre-installed
- **AWS Lambda** with Swift runtime

---

**Status:** Planned - Ready for Dev agent to implement
**Priority:** High (per Ed's request)
**Assigned:** TBD (will spawn Dev agent when ready)
