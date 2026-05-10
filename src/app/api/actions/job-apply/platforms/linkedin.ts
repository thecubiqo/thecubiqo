import { auditedAct, captureReviewReceipt, profileInstruction, type JobApplyScriptInput } from './shared';

export async function applyLinkedIn(input: JobApplyScriptInput) {
  await auditedAct(input, 'Find and click the LinkedIn Easy Apply button for this job. Do not click any final Submit application button.');
  await auditedAct(input, `Fill required non-sensitive fields using approved profile data. ${profileInstruction(input.profileData)}`);
  await auditedAct(input, 'Click Next, Continue, or Review until the application reaches the review step. Stop before the final submit button.');
  const receipt = await captureReviewReceipt(input);
  return {
    status: 'ready_to_submit' as const,
    ...receipt,
    message: 'Review your LinkedIn application. Press Submit application only if everything is correct.'
  };
}
