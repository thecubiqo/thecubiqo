import type { ThreatSeverity } from '@/next/types/security';

const INJECTION_PATTERNS = [
  /ignore\s+previous\s+instructions/i,
  /system\s+prompt/i,
  /jailbreak/i,
  /<script[^>]*>/i,
  /union\s+select/i,
  /exec\s*\(/i,
  /\beval\s*\(/i,
  /\bdrop\s+table\b/i,
];

export interface ThreatAssessment {
  severity: ThreatSeverity;
  isInjection: boolean;
  flags: string[];
}

export function assessThreat(input: string): ThreatAssessment {
  const flags: string[] = [];
  let isInjection = false;

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      flags.push(pattern.source.slice(0, 30));
      isInjection = true;
    }
  }

  if (input.length > 50_000) flags.push('excessive_length');
  if (/(.)\1{20,}/.test(input)) flags.push('char_repetition');

  let severity: ThreatSeverity;
  if (isInjection && flags.length >= 3) severity = 'critical';
  else if (isInjection) severity = 'high';
  else if (flags.length > 0) severity = 'medium';
  else severity = 'low';

  return { severity, isInjection, flags };
}
