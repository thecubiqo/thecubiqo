import { auditedAct, captureReviewReceipt, profileInstruction, type JobApplyScriptInput } from './shared';

export async function applyDice(input: JobApplyScriptInput) {
  await auditedAct(input, 'Start the Dice application flow for this job. Do not click any final Submit application button.');
  await auditedAct(input, `Fill required non-sensitive fields using approved profile data. ${profileInstruction(input.profileData)}`);
  await auditedAct(input, 'Continue through the application flow until the review step is visible. Stop before final submit.');
  const receipt = await captureReviewReceipt(input);
  return {
    status: 'ready_to_submit' as const,
    ...receipt,
    message: 'Review your Dice application. Press Submit application only if everything is correct.'
  };
}
