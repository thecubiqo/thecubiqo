/**
 * Fraud Detection and Prevention
 * 
 * AI-driven fraud detection for identifying suspicious activities.
 */

export interface FraudAnalysisResult {
  riskScore: number; // 0-100 (0 = no risk, 100 = high risk)
  recommendation: 'allow' | 'review' | 'block';
  flags: string[];
  details: {
    velocity: number;
    anomaly: number;
    reputation: number;
    pattern: number;
  };
}

export interface Transaction {
  userId: string;
  action: string;
  amount?: number;
  metadata: Record<string, unknown>;
  timestamp?: Date;
  ipAddress?: string;
  userAgent?: string;
  location?: {
    country?: string;
    city?: string;
  };
}

interface UserActivity {
  transactions: Transaction[];
  lastSeen: Date;
  countries: Set<string>;
  devices: Set<string>;
}

// In-memory activity store (use Redis in production)
const activityStore = new Map<string, UserActivity>();

/**
 * Analyze transaction for fraud risk
 */
export async function analyzeTransaction(
  transaction: Transaction
): Promise<FraudAnalysisResult> {
  const flags: string[] = [];
  let riskScore = 0;

  // Get user activity history
  let activity = activityStore.get(transaction.userId);
  if (!activity) {
    activity = {
      transactions: [],
      lastSeen: new Date(),
      countries: new Set(),
      devices: new Set(),
    };
    activityStore.set(transaction.userId, activity);
  }

  // Velocity check (rapid successive transactions)
  const velocityScore = checkVelocity(activity, transaction);
  if (velocityScore > 50) {
    flags.push('High transaction velocity detected');
    riskScore += velocityScore * 0.3;
  }

  // Anomaly detection
  const anomalyScore = detectAnomaly(activity, transaction);
  if (anomalyScore > 50) {
    flags.push('Unusual behavior pattern detected');
    riskScore += anomalyScore * 0.3;
  }

  // Reputation check
  const reputationScore = checkReputation(transaction);
  if (reputationScore > 50) {
    flags.push('Suspicious IP or device detected');
    riskScore += reputationScore * 0.2;
  }

  // Pattern matching (known fraud patterns)
  const patternScore = matchFraudPatterns(activity, transaction);
  if (patternScore > 50) {
    flags.push('Matches known fraud pattern');
    riskScore += patternScore * 0.2;
  }

  // Update activity history
  activity.transactions.push(transaction);
  activity.lastSeen = transaction.timestamp || new Date();
  if (transaction.location?.country) {
    activity.countries.add(transaction.location.country);
  }
  if (transaction.userAgent) {
    activity.devices.add(transaction.userAgent);
  }

  // Keep only recent transactions (last 24 hours)
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  activity.transactions = activity.transactions.filter(
    t => (t.timestamp?.getTime() || Date.now()) > oneDayAgo
  );

  // Determine recommendation
  let recommendation: 'allow' | 'review' | 'block' = 'allow';
  if (riskScore > 80) {
    recommendation = 'block';
    flags.push('High fraud risk - transaction blocked');
  } else if (riskScore > 50) {
    recommendation = 'review';
    flags.push('Moderate fraud risk - manual review required');
  }

  return {
    riskScore: Math.min(100, Math.round(riskScore)),
    recommendation,
    flags,
    details: {
      velocity: velocityScore,
      anomaly: anomalyScore,
      reputation: reputationScore,
      pattern: patternScore,
    },
  };
}

/**
 * Check transaction velocity (rate of transactions)
 */
function checkVelocity(activity: UserActivity, transaction: Transaction): number {
  const now = transaction.timestamp?.getTime() || Date.now();
  const recentTransactions = activity.transactions.filter(
    t => {
      const txTime = t.timestamp?.getTime() || 0;
      return now - txTime < 5 * 60 * 1000; // Last 5 minutes
    }
  );

  // Risk increases with number of transactions in short time
  if (recentTransactions.length > 10) {
    return 100;
  } else if (recentTransactions.length > 5) {
    return 70;
  } else if (recentTransactions.length > 3) {
    return 40;
  }

  return 0;
}

/**
 * Detect anomalous behavior
 */
function detectAnomaly(activity: UserActivity, transaction: Transaction): number {
  let anomalyScore = 0;

  // Check for geographic anomaly
  if (transaction.location?.country && activity.countries.size > 0) {
    if (!activity.countries.has(transaction.location.country)) {
      const timeSinceLastSeen = Date.now() - activity.lastSeen.getTime();
      // If location changed in less than 1 hour, suspicious
      if (timeSinceLastSeen < 60 * 60 * 1000) {
        anomalyScore += 50;
      } else {
        anomalyScore += 20;
      }
    }
  }

  // Check for device change
  if (transaction.userAgent && activity.devices.size > 0) {
    if (!activity.devices.has(transaction.userAgent)) {
      anomalyScore += 15;
    }
  }

  // Check for unusual time of day
  const hour = (transaction.timestamp || new Date()).getHours();
  if (hour >= 2 && hour <= 5) {
    // 2 AM - 5 AM is unusual for most users
    anomalyScore += 10;
  }

  // Check for unusual transaction amount
  if (transaction.amount) {
    const amounts = activity.transactions
      .map(t => t.amount)
      .filter((a): a is number => a !== undefined);
    
    if (amounts.length > 0) {
      const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const maxAmount = Math.max(...amounts);
      
      // If current amount is much higher than average
      if (transaction.amount > avgAmount * 5 || transaction.amount > maxAmount * 2) {
        anomalyScore += 30;
      }
    }
  }

  return Math.min(100, anomalyScore);
}

/**
 * Check IP and device reputation
 */
function checkReputation(transaction: Transaction): number {
  let reputationScore = 0;

  // Known bad IP ranges (simplified - use real threat intelligence in production)
  const suspiciousIPRanges = [
    '10.0.0.', '192.168.', '172.16.',  // Private IPs (shouldn't be external)
  ];

  if (transaction.ipAddress) {
    for (const range of suspiciousIPRanges) {
      if (transaction.ipAddress.startsWith(range)) {
        reputationScore += 30;
        break;
      }
    }
  }

  // Check user agent
  if (transaction.userAgent) {
    const suspiciousAgents = [
      'curl', 'wget', 'python', 'bot', 'crawler', 'scraper',
    ];
    
    const agent = transaction.userAgent.toLowerCase();
    if (suspiciousAgents.some(s => agent.includes(s))) {
      reputationScore += 40;
    }
    
    // Empty or very short user agent
    if (transaction.userAgent.length < 20) {
      reputationScore += 20;
    }
  }

  return Math.min(100, reputationScore);
}

/**
 * Match against known fraud patterns
 */
function matchFraudPatterns(activity: UserActivity, transaction: Transaction): number {
  let patternScore = 0;

  // Pattern 1: Account testing (small transactions before large one)
  const recentAmounts = activity.transactions
    .slice(-5)
    .map(t => t.amount)
    .filter((a): a is number => a !== undefined);

  if (recentAmounts.length >= 3 && transaction.amount) {
    const allSmall = recentAmounts.every(a => a < 10);
    if (allSmall && transaction.amount > 100) {
      patternScore += 60;
    }
  }

  // Pattern 2: Rapid account creation and usage
  if (activity.transactions.length < 3 && transaction.amount && transaction.amount > 50) {
    patternScore += 30;
  }

  // Pattern 3: Multiple failed attempts before success
  const failedAttempts = activity.transactions.filter(
    t => t.metadata.status === 'failed' || t.metadata.error
  ).length;

  if (failedAttempts > 3) {
    patternScore += 40;
  }

  // Pattern 4: High-value transaction from new location
  if (transaction.amount && transaction.amount > 100 &&
      transaction.location?.country && 
      activity.countries.size > 0 &&
      !activity.countries.has(transaction.location.country)) {
    patternScore += 50;
  }

  return Math.min(100, patternScore);
}

/**
 * Check if user requires MFA for this transaction
 */
export function requiresMFA(transaction: Transaction, riskScore: number): boolean {
  // Always require MFA for high-risk transactions
  if (riskScore > 50) {
    return true;
  }

  // Require MFA for high-value transactions
  if (transaction.amount && transaction.amount > 100) {
    return true;
  }

  // Require MFA for sensitive actions
  const sensitiveActions = [
    'delete_account',
    'change_email',
    'change_password',
    'add_payment_method',
    'export_data',
    'revoke_tokens',
  ];

  if (sensitiveActions.includes(transaction.action)) {
    return true;
  }

  return false;
}

/**
 * Log suspicious activity
 */
export async function logSuspiciousActivity(
  transaction: Transaction,
  analysis: FraudAnalysisResult
): Promise<void> {
  // In production, send to logging service (e.g., Datadog, Sentry)
  console.warn('[FRAUD DETECTION]', {
    userId: transaction.userId,
    action: transaction.action,
    riskScore: analysis.riskScore,
    recommendation: analysis.recommendation,
    flags: analysis.flags,
    timestamp: new Date().toISOString(),
  });

  // Could also trigger alerts, send to security team, etc.
  if (analysis.riskScore > 80) {
    // Send critical alert
    console.error('[CRITICAL FRAUD ALERT]', transaction);
  }
}
