export type FidelityCriterionStatus = 'pass' | 'fail' | 'untested';

export type FidelityCriterion = {
  id: string;
  testId: string;
  category: string;
  criterion: string;
  status: FidelityCriterionStatus;
  testerType: 'automated' | 'manual' | 'semi-automated' | 'ci' | 'human' | 'ai';
  testedAt: string | null;
  evidence: string | null;
};

export type FidelityReport = {
  projectId: string;
  runId: string | null;
  passCount: number;
  failCount: number;
  untestedCount: number;
  overallScore: number;
  completedAt: string | null;
  criteria: FidelityCriterion[];
};
