# Scripts Directory

This directory contains utility scripts for repository maintenance and analysis.

## Available Scripts

### PR Management

#### `audit-pr-merges.ts`
Programmatically verifies that all closed PRs (#1-#80) are fully merged into main branch.

**Usage:**
```bash
GITHUB_TOKEN=<your-token> npm run audit-pr-merges
```

**Features:**
- Checks PR merge status for PRs #1-#80
- Verifies merge commits exist in main branch history
- Detects closed-without-merge and partial merges
- Generates detailed report in `REPORTS/PR_MERGE_AUDIT.md`
- Provides actionable follow-up steps

**Environment Variables:**
- `GITHUB_TOKEN` (required): GitHub personal access token
- `AUDIT_OWNER` (optional): Repository owner, defaults to "thecubiqo"
- `AUDIT_REPO` (optional): Repository name, defaults to "thecubiqo"

**Output:**
- Console summary with pass/fail status
- Detailed markdown report in `REPORTS/PR_MERGE_AUDIT.md`
- Exit code 1 if discrepancies found

---

#### `pr-triage-agent.ts`
Automatically triages draft PRs and converts them to "Ready for Review" when all checks pass.

**Usage:**
```bash
GITHUB_TOKEN=<your-token> npm run pr-triage
```

---

#### `analyze-prs.js`
Analyzes git history to identify merged PRs and generate cleanup reports.

**Usage:**
```bash
node scripts/analyze-prs.js
```

**Output:**
- Console summary of PR status
- `PR_CLEANUP_REPORT.md` with detailed findings

**Features:**
- Scans git history for merged PR references
- Identifies stale/open PRs
- Generates actionable recommendations

---

#### `pr-cleanup-guide.js`
Generates a comprehensive guide for cleaning up stale PRs with prioritized actions.

**Usage:**
```bash
node scripts/pr-cleanup-guide.js
```

**Output:**
- `PR_CLEANUP_GUIDE.md` with categorized PRs
- Priority-based action items
- Automation recommendations

**Features:**
- Categorizes PRs by status (merged, superseded, draft, ready)
- Provides step-by-step cleanup instructions
- Includes GitHub Actions workflow examples

---

### Environment Validation

#### `validate-env.js`
Validates environment variables for the application.

**Usage:**
```bash
node scripts/validate-env.js
```

**Purpose:**
- Ensures required environment variables are set
- Validates API keys and configuration
- Helps prevent deployment issues

---

## Running All PR Cleanup Scripts

To perform a complete PR cleanup analysis:

```bash
# 1. Analyze git history
node scripts/analyze-prs.js

# 2. Generate comprehensive guide
node scripts/pr-cleanup-guide.js

# 3. Review generated files
cat PR_CLEANUP_SUMMARY.md      # Overview
cat PR_CLEANUP_GUIDE.md         # Detailed guide
cat PR_CLEANUP_CHECKLIST.md     # Quick checklist
```

## Generated Files

The PR cleanup scripts generate these files in the root directory:

- **PR_CLEANUP_SUMMARY.md** - Executive summary and overview
- **PR_CLEANUP_GUIDE.md** - Comprehensive cleanup guide with priorities
- **PR_CLEANUP_REPORT.md** - Technical analysis from git history
- **PR_CLEANUP_CHECKLIST.md** - Quick reference checklist

## Development

### Adding New Scripts

When adding new scripts to this directory:

1. **Use Node.js** for consistency
2. **Add usage documentation** in this README
3. **Include error handling** and helpful output
4. **Follow naming convention:** `kebab-case.js`
5. **Add executable permissions:** `chmod +x scripts/your-script.js`

### Script Template

```javascript
#!/usr/bin/env node

/**
 * Script Name
 * 
 * Description of what the script does
 */

function main() {
  try {
    // Your logic here
    console.log('Script completed successfully');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
```

## Troubleshooting

### "Cannot find module" errors
Make sure you're running scripts from the repository root:
```bash
cd /path/to/thecubiqo
node scripts/script-name.js
```

### Permission denied
Add execute permissions:
```bash
chmod +x scripts/script-name.js
```

### Git commands failing
Ensure you're in a git repository:
```bash
git status
```

## Contributing

When contributing scripts:
- Ensure they work from repository root
- Add comprehensive error handling
- Document usage in this README
- Test on clean repository clone

---

Last updated: 2026-02-15
