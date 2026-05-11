import { auditedAct, captureReviewReceipt, profileInstruction, type JobApplyScriptInput } from './shared';

export async function applyGenericCompanySite(input: JobApplyScriptInput) {
  await auditedAct(input, 'Find the apply button or application form for this job. If the site asks for sign-in, stop and surface that sign-in is required.');
  await auditedAct(input, 'Identify required application fields and custom questions. Stop on fields that require user judgment, essays, salary decisions, legal attestations, or missing profile data.');
  await auditedAct(input, `Fill only clear, non-sensitive fields using approved profile data. ${profileInstruction(input.profileData)}`);
  await auditedAct(input, 'Advance only to a review, preview, or final confirmation step. Do not click Submit, Apply, Send, Continue to payment, or any final public action.');
  const receipt = await captureReviewReceipt(input);
  return {
    status: 'ready_to_submit' as const,
    ...receipt,
    message: 'Review this company-site application. Press Submit application only if every field is correct.'
  };
}
