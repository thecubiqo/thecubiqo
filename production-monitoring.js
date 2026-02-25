// Production Monitoring for Next Hour
const https = require('https');
const fs = require('fs');
const path = require('path');

console.log('🚀 PRODUCTION MONITORING INITIATED');
console.log('========================================\n');
console.log('Monitoring Period: 1 Hour (until ~19:50 EST)');
console.log('Start Time:', new Date().toLocaleString());
console.log('');

const productionUrl = 'https://cubiqo-repo-git-main-cubiqo-projects-d7156840.vercel.app';
const domainUrl = 'https://cubiqo.ai';
const foundersPassUrl = `${productionUrl}/founderspass`;
const catalogApiUrl = `${productionUrl}/api/founderspass/catalog`;

// Monitoring log file
const logFile = path.join(__dirname, 'monitoring-log.json');
const alertFile = path.join(__dirname, 'monitoring-alerts.json');

// Initialize logs
if (!fs.existsSync(logFile)) {
  fs.writeFileSync(logFile, JSON.stringify({
    startTime: new Date().toISOString(),
    checks: [],
    alerts: []
  }, null, 2));
}

if (!fs.existsSync(alertFile)) {
  fs.writeFileSync(alertFile, JSON.stringify({
    alerts: [],
    lastAlertTime: null
  }, null, 2));
}

// Monitoring configuration
const config = {
  checkInterval: 300000, // 5 minutes
  totalDuration: 3600000, // 1 hour
  alertThresholds: {
    responseTime: 5000, // 5 seconds
    errorRate: 0.2, // 20% errors
    downtime: 2 // 2 consecutive failures
  }
};

let checkCount = 0;
let errorCount = 0;
let consecutiveFailures = 0;
let monitoringActive = true;

async function performCheck() {
  checkCount++;
  const checkTime = new Date().toISOString();
  console.log(`\n🔍 CHECK #${checkCount} - ${new Date().toLocaleTimeString()}`);
  
  const checkResults = {
    timestamp: checkTime,
    checkNumber: checkCount,
    endpoints: {}
  };
  
  // Test 1: Main deployment
  console.log('1. Testing main deployment...');
  const mainResult = await testEndpoint(productionUrl, 'Main Deployment');
  checkResults.endpoints.main = mainResult;
  
  // Test 2: Domain redirect
  console.log('2. Testing domain redirect...');
  const domainResult = await testEndpoint(domainUrl, 'Domain');
  checkResults.endpoints.domain = domainResult;
  
  // Test 3: FoundersPass login page
  console.log('3. Testing FoundersPass login...');
  const foundersResult = await testEndpoint(foundersPassUrl, 'FoundersPass');
  checkResults.endpoints.foundersPass = foundersResult;
  
  // Test 4: Catalog API (database connectivity)
  console.log('4. Testing database API...');
  const apiResult = await testEndpoint(catalogApiUrl, 'Catalog API');
  checkResults.endpoints.catalogApi = apiResult;
  
  // Calculate overall status
  const successfulChecks = Object.values(checkResults.endpoints).filter(r => r.success).length;
  const totalChecks = Object.keys(checkResults.endpoints).length;
  checkResults.overallSuccess = successfulChecks === totalChecks;
  checkResults.successRate = successfulChecks / totalChecks;
  
  // Update error tracking
  if (!checkResults.overallSuccess) {
    errorCount++;
    consecutiveFailures++;
  } else {
    consecutiveFailures = 0;
  }
  
  // Check for alerts
  checkForAlerts(checkResults);
  
  // Log results
  logCheck(checkResults);
  
  // Display summary
  console.log('\n📊 CHECK SUMMARY:');
  console.log(`   Overall: ${checkResults.overallSuccess ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Success Rate: ${(checkResults.successRate * 100).toFixed(1)}%`);
  console.log(`   Response Times:`);
  Object.entries(checkResults.endpoints).forEach(([name, result]) => {
    console.log(`     ${name}: ${result.responseTime}ms ${result.success ? '✅' : '❌'}`);
  });
  
  return checkResults;
}

async function testEndpoint(url, name) {
  const startTime = Date.now();
  
  try {
    const result = await fetchWithTimeout(url, 10000);
    const responseTime = Date.now() - startTime;
    
    const endpointResult = {
      name,
      url,
      success: result.status === 200 || result.status === 307,
      status: result.status,
      responseTime,
      timestamp: new Date().toISOString(),
      size: result.data?.length || 0
    };
    
    // Special checks for specific endpoints
    if (url === catalogApiUrl && result.status === 200) {
      try {
        const data = JSON.parse(result.data);
        endpointResult.dataSize = JSON.stringify(data).length;
        endpointResult.featureCount = data.length || data.features?.length || 0;
        console.log(`   ✅ ${name}: ${result.status} (${endpointResult.featureCount} features, ${responseTime}ms)`);
      } catch (e) {
        console.log(`   ⚠️ ${name}: ${result.status} (non-JSON, ${responseTime}ms)`);
      }
    } else if (url === domainUrl && result.status === 307) {
      console.log(`   ✅ ${name}: ${result.status} (redirect, ${responseTime}ms)`);
      endpointResult.redirectTo = result.headers.location;
    } else {
      console.log(`   ${endpointResult.success ? '✅' : '❌'} ${name}: ${result.status} (${responseTime}ms)`);
    }
    
    return endpointResult;
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.log(`   ❌ ${name}: ERROR - ${error.message} (${responseTime}ms)`);
    
    return {
      name,
      url,
      success: false,
      error: error.message,
      responseTime,
      timestamp: new Date().toISOString()
    };
  }
}

function fetchWithTimeout(url, timeout) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', reject);
    
    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error(`Timeout after ${timeout}ms`));
    });
  });
}

function checkForAlerts(checkResults) {
  const alerts = [];
  
  // Check response time thresholds
  Object.entries(checkResults.endpoints).forEach(([name, result]) => {
    if (result.responseTime > config.alertThresholds.responseTime) {
      alerts.push({
        type: 'PERFORMANCE',
        endpoint: name,
        message: `High response time: ${result.responseTime}ms`,
        timestamp: new Date().toISOString(),
        severity: 'WARNING'
      });
    }
  });
  
  // Check for consecutive failures
  if (consecutiveFailures >= config.alertThresholds.downtime) {
    alerts.push({
      type: 'DOWNTIME',
      message: `${consecutiveFailures} consecutive check failures`,
      timestamp: new Date().toISOString(),
      severity: 'CRITICAL'
    });
  }
  
  // Check overall error rate
  const errorRate = errorCount / checkCount;
  if (errorRate > config.alertThresholds.errorRate) {
    alerts.push({
      type: 'ERROR_RATE',
      message: `High error rate: ${(errorRate * 100).toFixed(1)}%`,
      timestamp: new Date().toISOString(),
      severity: 'WARNING'
    });
  }
  
  // Log alerts
  if (alerts.length > 0) {
    console.log('\n🚨 ALERTS DETECTED:');
    alerts.forEach(alert => {
      console.log(`   ${alert.severity === 'CRITICAL' ? '🔴' : '🟡'} ${alert.type}: ${alert.message}`);
    });
    
    // Save alerts to file
    const alertData = JSON.parse(fs.readFileSync(alertFile, 'utf8'));
    alertData.alerts.push(...alerts);
    alertData.lastAlertTime = new Date().toISOString();
    fs.writeFileSync(alertFile, JSON.stringify(alertData, null, 2));
  }
  
  return alerts;
}

function logCheck(checkResults) {
  const logData = JSON.parse(fs.readFileSync(logFile, 'utf8'));
  logData.checks.push(checkResults);
  fs.writeFileSync(logFile, JSON.stringify(logData, null, 2));
}

function generateSummary() {
  const logData = JSON.parse(fs.readFileSync(logFile, 'utf8'));
  const alertData = JSON.parse(fs.readFileSync(alertFile, 'utf8'));
  
  const totalChecks = logData.checks.length;
  const successfulChecks = logData.checks.filter(c => c.overallSuccess).length;
  const successRate = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 0;
  
  // Calculate average response times
  const avgResponseTimes = {};
  Object.keys(logData.checks[0]?.endpoints || {}).forEach(endpoint => {
    const times = logData.checks.map(c => c.endpoints[endpoint]?.responseTime || 0);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    avgResponseTimes[endpoint] = Math.round(avg);
  });
  
  return {
    monitoringPeriod: {
      start: logData.startTime,
      end: new Date().toISOString(),
      duration: `${totalChecks * (config.checkInterval / 60000)} minutes`
    },
    statistics: {
      totalChecks,
      successfulChecks,
      successRate: successRate.toFixed(1) + '%',
      errorCount,
      consecutiveFailures
    },
    performance: {
      avgResponseTimes,
      maxResponseTime: Math.max(...logData.checks.flatMap(c => 
        Object.values(c.endpoints).map(e => e.responseTime || 0)
      ))
    },
    alerts: {
      total: alertData.alerts.length,
      critical: alertData.alerts.filter(a => a.severity === 'CRITICAL').length,
      warnings: alertData.alerts.filter(a => a.severity === 'WARNING').length,
      lastAlert: alertData.lastAlertTime
    }
  };
}

async function startMonitoring() {
  console.log('🚀 STARTING 1-HOUR PRODUCTION MONITORING');
  console.log('========================================\n');
  console.log('Monitoring Endpoints:');
  console.log(`   1. Main Deployment: ${productionUrl}`);
  console.log(`   2. Domain: ${domainUrl}`);
  console.log(`   3. FoundersPass: ${foundersPassUrl}`);
  console.log(`   4. Catalog API: ${catalogApiUrl}`);
  console.log('');
  console.log('Check Interval: Every 5 minutes');
  console.log('Total Duration: 1 hour');
  console.log('');
  
  const startTime = Date.now();
  const endTime = startTime + config.totalDuration;
  
  // Initial check
  await performCheck();
  
  // Schedule periodic checks
  const intervalId = setInterval(async () => {
    if (Date.now() >= endTime) {
      clearInterval(intervalId);
      await completeMonitoring();
      return;
    }
    
    await performCheck();
    
  }, config.checkInterval);
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    clearInterval(intervalId);
    console.log('\n\n🛑 Monitoring interrupted by user');
    await completeMonitoring();
    process.exit(0);
  });
}

async function completeMonitoring() {
  monitoringActive = false;
  
  console.log('\n\n========================================');
  console.log('📊 MONITORING COMPLETE - FINAL SUMMARY');
  console.log('========================================\n');
  
  const summary = generateSummary();
  
  console.log('⏱️  MONITORING PERIOD:');
  console.log(`   Start: ${new Date(summary.monitoringPeriod.start).toLocaleString()}`);
  console.log(`   End: ${new Date().toLocaleString()}`);
  console.log(`   Duration: ${summary.monitoringPeriod.duration}`);
  
  console.log('\n📈 STATISTICS:');
  console.log(`   Total Checks: ${summary.statistics.totalChecks}`);
  console.log(`   Successful: ${summary.statistics.successfulChecks}`);
  console.log(`   Success Rate: ${summary.statistics.successRate}`);
  console.log(`   Errors: ${summary.statistics.errorCount}`);
  console.log(`   Consecutive Failures: ${summary.statistics.consecutiveFailures}`);
  
  console.log('\n⚡ PERFORMANCE:');
  Object.entries(summary.performance.avgResponseTimes).forEach(([endpoint, time]) => {
    console.log(`   ${endpoint}: ${time}ms avg`);
  });
  console.log(`   Max Response Time: ${summary.performance.maxResponseTime}ms`);
  
  console.log('\n🚨 ALERTS:');
  console.log(`   Total Alerts: ${summary.alerts.total}`);
  console.log(`   Critical: ${summary.alerts.critical}`);
  console.log(`   Warnings: ${summary.alerts.warnings}`);
  if (summary.alerts.lastAlert) {
    console.log(`   Last Alert: ${new Date(summary.alerts.lastAlert).toLocaleTimeString()}`);
  }
  
  console.log('\n🎯 RECOMMENDATIONS:');
  
  if (summary.statistics.successRate === '100.0%') {
    console.log('   ✅ EXCELLENT - 100% uptime during monitoring');
    console.log('   ✅ Deployment is stable and reliable');
    console.log('   ✅ No immediate action required');
  } else if (parseFloat(summary.statistics.successRate) >= 95) {
    console.log('   ✅ GOOD - High reliability (>95%)');
    console.log('   ✅ Minor issues detected but overall stable');
    console.log('   ⚠️  Review alerts for potential improvements');
  } else if (parseFloat(summary.statistics.successRate) >= 80) {
    console.log('   ⚠️  FAIR - Some reliability issues');
    console.log('   🔧 Investigate alerts and error patterns');
    console.log('   📊 Consider performance optimizations');
  } else {
    console.log('   🔴 POOR - Significant reliability issues');
    console.log('   🚨 Immediate investigation required');
    console.log('   🔧 Check deployment configuration and dependencies');
  }
  
  console.log('\n📁 LOG FILES:');
  console.log(`   Check Log: ${logFile}`);
  console.log(`   Alert Log: ${alertFile}`);
  
  console.log('\n========================================');
  console.log('🎉 MONITORING COMPLETE');
  console.log('Production deployment has been monitored for 1 hour.');
  console.log('Check log files for detailed results.');
  
  // Save final summary
  const summaryFile = path.join(__dirname, 'monitoring-summary.json');
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
  console.log(`\n📄 Summary saved to: ${summaryFile}`);
}

// Start monitoring
startMonitoring().catch(console.error);