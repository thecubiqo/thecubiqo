import { auditedAct, captureReviewReceipt, profileInstruction, type JobApplyScriptInput } from './shared';

export async function applyAts(input: JobApplyScriptInput) {
  await auditedAct(input, 'Start the ATS application form for this job. Do not click any final Submit application button.');
  await auditedAct(input, `Fill required non-sensitive fields using approved profile data. ${profileInstruction(input.profileData)}`);
  await auditedAct(input, 'Continue through the ATS form until a final review or confirmation step is visible. Stop before final submit.');
  const receipt = await captureReviewReceipt(input);
  return {
    status: 'ready_to_submit' as const,
    ...receipt,
    message: 'Review your ATS application. Press Submit application only if everything is correct.'
  };
}
