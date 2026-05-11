import { auditedBrowserStep, buildUserInputPrompts, captureReviewReceipt, profileInstruction, type JobApplyScriptInput } from './shared';

export async function applyGenericCompanySite(input: JobApplyScriptInput) {
  const userInputPrompts = buildUserInputPrompts(input);
  const stepReceipts = [];
  stepReceipts.push(await auditedBrowserStep(input, {
    stepId: 'company-site-find-form',
    label: 'Located company-site application form',
    action: 'Find the apply button or application form for this job. If the site asks for sign-in, stop and surface that sign-in is required.'
  }));
  stepReceipts.push(await auditedBrowserStep(input, {
    stepId: 'company-site-field-audit',
    label: 'Audited company-site required fields',
    action: 'Identify required application fields and custom questions. Stop on fields that require user judgment, essays, salary decisions, legal attestations, or missing profile data.',
    userInputPrompts
  }));
  stepReceipts.push(await auditedBrowserStep(input, {
    stepId: 'company-site-prefill-profile-fields',
    label: 'Pre-filled safe company-site fields',
    action: `Fill only clear, non-sensitive fields using approved profile data. ${profileInstruction(input.profileData)}`,
    userInputPrompts
  }));
  stepReceipts.push(await auditedBrowserStep(input, {
    stepId: 'company-site-review-step',
    label: 'Stopped at company-site review step',
    action: 'Advance only to a review, preview, or final confirmation step. Do not click Submit, Apply, Send, Continue to payment, or any final public action.',
    userInputPrompts
  }));
  const receipt = await captureReviewReceipt(input);
  return {
    status: 'ready_to_submit' as const,
    ...receipt,
    stepReceipts,
    userInputPrompts,
    message: 'Review this company-site application. Press Submit application only if every field is correct.'
  };
}
