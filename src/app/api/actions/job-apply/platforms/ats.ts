import { auditedBrowserStep, buildUserInputPrompts, captureReviewReceipt, profileInstruction, type JobApplyScriptInput } from './shared';

export async function applyAts(input: JobApplyScriptInput) {
  const userInputPrompts = buildUserInputPrompts(input);
  const stepReceipts = [];
  stepReceipts.push(await auditedBrowserStep(input, {
    stepId: `${input.platform}-start-ats-form`,
    label: 'Started ATS application form',
    action: 'Start the ATS application form for this job. Do not click any final Submit application button.'
  }));
  stepReceipts.push(await auditedBrowserStep(input, {
    stepId: `${input.platform}-prefill-profile-fields`,
    label: 'Pre-filled approved ATS fields',
    action: `Fill required non-sensitive fields using approved profile data. ${profileInstruction(input.profileData)}`,
    userInputPrompts
  }));
  stepReceipts.push(await auditedBrowserStep(input, {
    stepId: `${input.platform}-review-step`,
    label: 'Stopped at ATS review step',
    action: 'Continue through the ATS form until a final review or confirmation step is visible. Stop before final submit.',
    userInputPrompts
  }));
  const receipt = await captureReviewReceipt(input);
  return {
    status: 'ready_to_submit' as const,
    ...receipt,
    stepReceipts,
    userInputPrompts,
    message: 'Review your ATS application. Press Submit application only if everything is correct.'
  };
}
