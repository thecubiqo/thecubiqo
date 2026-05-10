import { auditedSocialAct, captureQueueReceipt, type SocialQueueScriptInput } from './shared';

export async function queueThreads(input: SocialQueueScriptInput) {
  await auditedSocialAct(input, 'Open the Threads composer.');
  await auditedSocialAct(input, `Type this exact content into the Threads composer: ${input.content}`);
  const receipt = await captureQueueReceipt(input);
  return {
    status: 'ready' as const,
    ...receipt,
    message: 'Threads post is composed. Press Publish to post it.'
  };
}
