const BLOCKED_PATTERNS = [
  /\bself[-\s]?harm\b/i,
  /\bkill myself\b/i,
  /\bcredit card number\b/i,
  /\bpassword\b/i,
  /\bprivate key\b/i,
  /\bseed phrase\b/i,
];

export function checkContentPolicy(text: string) {
  const matched = BLOCKED_PATTERNS.find(pattern => pattern.test(text));
  return {
    allowed: !matched,
    reason: matched ? 'safety_or_secret_pattern' : null,
  };
}
