import { computeRGYScore } from './rgy-engine';

export async function runRGYCronEvaluation(userId: string) {
  return computeRGYScore(userId);
}
