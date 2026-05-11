import { auditedBrowserStep, buildUserInputPrompts, captureReviewReceipt, profileInstruction, type JobApplyScriptInput } from './shared';

export async function applyIndeed(input: JobApplyScriptInput) {
  const userInputPrompts = buildUserInputPrompts(input);
  const stepReceipts = [];
  stepReceipts.push(await auditedBrowserStep(input, {
    stepId: 'indeed-start-apply',
    label: 'Started Indeed apply flow',
    action: 'Start the Indeed application flow for this job. Do not click any final Submit application button.'
  }));
  stepReceipts.push(await auditedBrowserStep(input, {
    stepId: 'indeed-prefill-profile-fields',
    label: 'Pre-filled approved Indeed fields',
    action: `Fill required non-sensitive fields using approved profile data. ${profileInstruction(input.profileData)}`,
    userInputPrompts
  }));
  stepReceipts.push(await auditedBrowserStep(input, {
    stepId: 'indeed-review-step',
    label: 'Stopped at Indeed review step',
    action: 'Move through Continue, Next, or Review steps until the application is on the final review screen. Stop before final submit.',
    userInputPrompts
  }));
  const receipt = await captureReviewReceipt(input);
  return {
    status: 'ready_to_submit' as const,
    ...receipt,
    stepReceipts,
    userInputPrompts,
    message: 'Review your Indeed application. Press Submit application only if everything is correct.'
  };
}
