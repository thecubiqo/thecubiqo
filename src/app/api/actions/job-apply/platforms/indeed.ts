import { auditedAct, captureReviewReceipt, profileInstruction, type JobApplyScriptInput } from './shared';

export async function applyIndeed(input: JobApplyScriptInput) {
  await auditedAct(input, 'Start the Indeed application flow for this job. Do not click any final Submit application button.');
  await auditedAct(input, `Fill required non-sensitive fields using approved profile data. ${profileInstruction(input.profileData)}`);
  await auditedAct(input, 'Move through Continue, Next, or Review steps until the application is on the final review screen. Stop before final submit.');
  const receipt = await captureReviewReceipt(input);
  return {
    status: 'ready_to_submit' as const,
    ...receipt,
    message: 'Review your Indeed application. Press Submit application only if everything is correct.'
  };
}
