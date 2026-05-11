import { auditedBrowserStep, buildUserInputPrompts, captureReviewReceipt, profileInstruction, type JobApplyScriptInput } from './shared';

export async function applyLinkedIn(input: JobApplyScriptInput) {
  const userInputPrompts = buildUserInputPrompts(input);
  const stepReceipts = [];
  stepReceipts.push(await auditedBrowserStep(input, {
    stepId: 'linkedin-open-easy-apply',
    label: 'Opened LinkedIn Easy Apply',
    action: 'Find and click the LinkedIn Easy Apply button for this job. Do not click any final Submit application button.'
  }));
  stepReceipts.push(await auditedBrowserStep(input, {
    stepId: 'linkedin-prefill-profile-fields',
    label: 'Pre-filled approved LinkedIn fields',
    action: `Fill required non-sensitive fields using approved profile data. ${profileInstruction(input.profileData)}`,
    userInputPrompts
  }));
  stepReceipts.push(await auditedBrowserStep(input, {
    stepId: 'linkedin-review-step',
    label: 'Stopped at LinkedIn review step',
    action: 'Click Next, Continue, or Review until the application reaches the review step. Stop before the final submit button.',
    userInputPrompts
  }));
  const receipt = await captureReviewReceipt(input);
  return {
    status: 'ready_to_submit' as const,
    ...receipt,
    stepReceipts,
    userInputPrompts,
    message: 'Review your LinkedIn application. Press Submit application only if everything is correct.'
  };
}
