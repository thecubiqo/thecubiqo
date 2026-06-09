import { auditedBrowserStep, buildUserInputPrompts, captureReviewReceipt, profileInstruction, type JobApplyScriptInput } from './shared';

export async function applyDice(input: JobApplyScriptInput) {
  const userInputPrompts = buildUserInputPrompts(input);
  const stepReceipts = [];
  stepReceipts.push(await auditedBrowserStep(input, {
    stepId: 'dice-start-apply',
    label: 'Started Dice apply flow',
    action: 'Start the Dice application flow for this job. Do not click any final Submit application button.'
  }));
  stepReceipts.push(await auditedBrowserStep(input, {
    stepId: 'dice-prefill-profile-fields',
    label: 'Pre-filled approved Dice fields',
    action: `Fill required non-sensitive fields using approved profile data. ${profileInstruction(input.profileData)}`,
    userInputPrompts
  }));
  stepReceipts.push(await auditedBrowserStep(input, {
    stepId: 'dice-review-step',
    label: 'Stopped at Dice review step',
    action: 'Continue through the application flow until the review step is visible. Stop before final submit.',
    userInputPrompts
  }));
  const receipt = await captureReviewReceipt(input);
  return {
    status: 'ready_to_submit' as const,
    ...receipt,
    stepReceipts,
    userInputPrompts,
    message: 'Review your Dice application. Press Submit application only if everything is correct.'
  };
}
