// Test for hydration errors
console.log('Checking for hydration errors...');

// Check if page loads without errors
window.addEventListener('error', (event) => {
  console.error('Page error:', event.error);
});

// Check for Next.js hydration error
const errorElement = document.querySelector('#__next_error__');
if (errorElement) {
  console.error('❌ Next.js error page detected!');
  console.error('Error details:', errorElement.innerText.substring(0, 200));
} else {
  console.log('✅ No Next.js error page detected');
}

// Check for React hydration warnings
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (entry.name.includes('hydration') || entry.name.includes('React')) {
      console.warn('⚠️  React hydration issue:', entry.name);
    }
  });
});

observer.observe({ entryTypes: ['resource'] });

console.log('✅ Hydration check complete');