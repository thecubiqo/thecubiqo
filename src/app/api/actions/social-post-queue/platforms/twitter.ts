import { auditedSocialAct, captureQueueReceipt, type SocialQueueScriptInput } from './shared';

export async function queueTwitter(input: SocialQueueScriptInput) {
  await auditedSocialAct(input, 'Open the post composer if it is not already open.');
  await auditedSocialAct(input, `Type this exact content into the X/Twitter post composer: ${input.content}`);
  const receipt = await captureQueueReceipt(input);
  return {
    status: 'ready' as const,
    ...receipt,
    message: 'X/Twitter post is composed. Press Publish to post it.'
  };
}
