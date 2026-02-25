// Check monitoring status
const fs = require('fs');
const path = require('path');

console.log('📊 MONITORING STATUS CHECK');
console.log('========================================\n');

const logFile = path.join(__dirname, 'monitoring-log.json');
const alertFile = path.join(__dirname, 'monitoring-alerts.json');

try {
  if (fs.existsSync(logFile)) {
    const logData = JSON.parse(fs.readFileSync(logFile, 'utf8'));
    
    console.log('⏱️  MONITORING STATUS:');
    console.log(`   Start Time: ${new Date(logData.startTime).toLocaleString()}`);
    console.log(`   Checks Completed: ${logData.checks.length}`);
    console.log(`   Duration: ${logData.checks.length * 5} minutes`);
    
    if (logData.checks.length > 0) {
      console.log('\n📈 CHECK RESULTS:');
      
      logData.checks.forEach((check, index) => {
        const time = new Date(check.timestamp).toLocaleTimeString();
        console.log(`\n   Check #${index + 1} (${time}):`);
        console.log(`     Overall: ${check.overallSuccess ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`     Success Rate: ${(check.successRate * 100).toFixed(1)}%`);
        
        Object.entries(check.endpoints).forEach(([name, result]) => {
          console.log(`     ${name}: ${result.status} (${result.responseTime}ms) ${result.success ? '✅' : '❌'}`);
        });
      });
      
      // Calculate statistics
      const successfulChecks = logData.checks.filter(c => c.overallSuccess).length;
      const successRate = (successfulChecks / logData.checks.length) * 100;
      
      console.log('\n📊 SUMMARY STATISTICS:');
      console.log(`   Total Checks: ${logData.checks.length}`);
      console.log(`   Successful: ${successfulChecks}`);
      console.log(`   Success Rate: ${successRate.toFixed(1)}%`);
      
      // Check for any alerts
      if (fs.existsSync(alertFile)) {
        const alertData = JSON.parse(fs.readFileSync(alertFile, 'utf8'));
        if (alertData.alerts.length > 0) {
          console.log('\n🚨 ACTIVE ALERTS:');
          alertData.alerts.forEach(alert => {
            console.log(`   ${alert.severity === 'CRITICAL' ? '🔴' : '🟡'} ${alert.type}: ${alert.message}`);
          });
        } else {
          console.log('\n✅ NO ALERTS - All systems operational');
        }
      }
    }
  } else {
    console.log('Monitoring log file not found yet');
  }
  
} catch (error) {
  console.log('Error reading monitoring logs:', error.message);
}

console.log('\n========================================');
console.log('🎯 CURRENT FOCUS: ENERGCUBE DIAGNOSTIC');
console.log('');
console.log('Next Steps:');
console.log('1. Run diagnostic in browser console');
console.log('2. Check WebGL support and context');
console.log('3. Verify Three.js bundle loaded');
console.log('4. Check for JavaScript errors');
console.log('');
console.log('Monitoring continues in background...');