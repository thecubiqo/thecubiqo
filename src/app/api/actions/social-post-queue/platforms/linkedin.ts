import { auditedSocialAct, captureQueueReceipt, type SocialQueueScriptInput } from './shared';

export async function queueLinkedIn(input: SocialQueueScriptInput) {
  await auditedSocialAct(input, 'Click the Start a post button.');
  await auditedSocialAct(input, `Type this exact content into the LinkedIn post composer: ${input.content}`);
  const receipt = await captureQueueReceipt(input);
  return {
    status: 'ready' as const,
    ...receipt,
    message: 'LinkedIn post is composed. Press Publish to post it.'
  };
}
