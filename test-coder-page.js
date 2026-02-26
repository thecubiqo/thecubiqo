
// Test if coder page loads correctly
console.log('Testing CubiQo Coder page...');

// Check for common issues
const issues = [];

// 1. Check if page is client component
if (!document.querySelector('script[src*="chunks"]')) {
  issues.push('No client JavaScript loaded');
}

// 2. Check for error messages
const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
if (errorElements.length > 0) {
  issues.push('Error elements found on page');
}

// 3. Check for loading state
const loadingElements = document.querySelectorAll('[class*="loading"], [class*="Loading"], [class*="animate-pulse"]');
if (loadingElements.length === 0) {
  issues.push('No loading indicators found');
}

// 4. Check for main components
const requiredComponents = ['editor', 'terminal', 'preview', 'conversation'];
requiredComponents.forEach(comp => {
  if (!document.querySelector(`[class*="${comp}"], [id*="${comp}"]`)) {
    issues.push(`${comp} component not found`);
  }
});

if (issues.length === 0) {
  console.log('✅ Coder page appears to be loading correctly');
} else {
  console.log('❌ Issues found:', issues);
}
