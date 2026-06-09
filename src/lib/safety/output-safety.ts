export type OutputSafetyResult = {
  flagged: boolean;
  reason?: string;
  safeText: string;
};

const OUTPUT_BLOCK_PATTERNS: Array<{ reason: string; pattern: RegExp }> = [
  { reason: "self_harm_instruction", pattern: /\b(how to|steps to|instructions for).{0,80}\b(kill myself|suicide|self-harm)\b/i },
  { reason: "weapon_instruction", pattern: /\b(make|build|assemble).{0,80}\b(bomb|explosive|ghost gun)\b/i },
  { reason: "payment_execution", pattern: /\b(i have|i'll|i will).{0,40}\b(pay|purchase|submit payment|place the order)\b/i },
  { reason: "autonomous_publish", pattern: /\b(i have|i'll|i will).{0,40}\b(published|sent|submitted|deployed|posted)\b/i },
];

export function checkOutputSafety(text: string): OutputSafetyResult {
  for (const rule of OUTPUT_BLOCK_PATTERNS) {
    if (rule.pattern.test(text)) {
      return {
        flagged: true,
        reason: rule.reason,
        safeText: "I need to keep this safe and confirmation-led. I can help draft, review, or plan the next step, but I will not execute sensitive actions or provide harmful instructions.",
      };
    }
  }

  return { flagged: false, safeText: text };
}
