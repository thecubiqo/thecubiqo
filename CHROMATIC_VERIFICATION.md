# Chromatic Integration Verification Guide

This guide helps verify that your Chromatic token is properly configured and working.

## Quick Verification

Run the verification script:
```bash
./verify-chromatic.sh
```

## Manual Verification Steps

### 1. Check Local Setup ✅

All of these should be passing:
- ✅ Chromatic is installed (chromatic@15.1.0)
- ✅ Storybook is configured (.storybook/ directory)
- ✅ 8 component stories created
- ✅ Storybook builds successfully

### 2. Verify GitHub Secret

The `CHROMATIC_PROJECT_TOKEN` must be set as a GitHub repository secret:

1. Go to: https://github.com/thecubiqo/thecubiqo/settings/secrets/actions
2. Look for `CHROMATIC_PROJECT_TOKEN` in the list
3. If it exists, it's properly configured! 🎉

### 3. Test the Integration

#### Option A: Test Locally (Recommended)

If you have the Chromatic token, test locally:

```bash
# Set the token temporarily
export CHROMATIC_PROJECT_TOKEN='chpt_xxxxxxxxxxxxxxxx'

# Run Chromatic
npm run chromatic

# Or use npx directly
npx chromatic --exit-zero-on-changes
```

Expected output:
```
✔ Started build 1
✔ Storybook published to Chromatic
✔ Build 1 complete!
  View it at: https://www.chromatic.com/build?appId=...&number=1
```

#### Option B: Test via GitHub Actions

1. **Push to a branch:**
   ```bash
   git push origin copilot/setup-chromatic-visual-testing
   ```

2. **Check the workflow run:**
   - Go to: https://github.com/thecubiqo/thecubiqo/actions
   - Look for "Chromatic Visual Tests" workflow
   - Click on the latest run

3. **Expected results:**
   - ✅ All steps should pass
   - ✅ "Run Chromatic" step should show: "Build passed!"
   - ✅ You'll see a link to the Chromatic build

#### Option C: Create a Pull Request

The most realistic test:

1. Create a PR from your branch
2. The workflow automatically runs
3. Check for a comment from Chromatic bot with visual diff results

## Troubleshooting

### Error: "Invalid project token"

**Problem:** The token format is incorrect or expired.

**Solution:**
1. Go to https://www.chromatic.com
2. Navigate to your project
3. Go to "Manage" → "Configure"
4. Copy the fresh project token
5. Update the GitHub secret

### Error: "HTTP 401 Unauthorized"

**Problem:** Token is missing or not passed correctly.

**Solution:**
- Verify the secret name is exactly: `CHROMATIC_PROJECT_TOKEN`
- Check workflow file uses: `${{ secrets.CHROMATIC_PROJECT_TOKEN }}`

### Error: "No stories found"

**Problem:** Storybook build is failing or stories aren't being detected.

**Solution:**
```bash
# Test Storybook build locally
npm run build-storybook

# Check story files exist
find src -name "*.stories.tsx"
```

## Success Indicators

When everything is working correctly, you should see:

1. **In GitHub Actions logs:**
   ```
   ✔ Started build 1
   ✔ Storybook published to Chromatic  
   ✔ Build 1 complete!
   ```

2. **In Chromatic dashboard:**
   - New builds appear for each commit
   - Visual snapshots are captured
   - Diffs are shown for UI changes

3. **In Pull Requests:**
   - Chromatic status check appears
   - Link to visual review is posted

## Next Steps

Once verified:
- ✅ Visual regression testing is active on all PRs
- ✅ Team can review UI changes before merging
- ✅ Baseline snapshots are automatically updated on main branch

## Support

- Chromatic Docs: https://www.chromatic.com/docs
- Storybook Docs: https://storybook.js.org/docs
- Issues: https://github.com/thecubiqo/thecubiqo/issues
