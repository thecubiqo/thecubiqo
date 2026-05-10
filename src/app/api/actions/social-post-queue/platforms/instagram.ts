import { auditedSocialAct, captureQueueReceipt, type SocialQueueScriptInput } from './shared';

export async function queueInstagram(input: SocialQueueScriptInput) {
  if (!input.mediaUrls.length) {
    const error = new Error('media_required');
    error.name = 'media_required';
    throw error;
  }

  await auditedSocialAct(input, 'Open the Instagram create-post composer.');
  await auditedSocialAct(input, `Prepare the Instagram post caption with this exact content: ${input.content}`);
  await auditedSocialAct(input, `Attach or wait for the approved media URLs if supported by this session: ${input.mediaUrls.join(', ')}`);
  const receipt = await captureQueueReceipt(input);
  return {
    status: 'ready' as const,
    ...receipt,
    message: 'Instagram post is prepared with media. Press Publish to post it.'
  };
}
