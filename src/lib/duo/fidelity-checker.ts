import { getSupabaseAdmin, safeTableMissing } from '@/next/app/api/_lib/supabase-admin';
import type { FidelityCriterion, FidelityCriterionStatus, FidelityReport } from '@/next/types/duo-fidelity';

type AcceptanceTestRow = {
  test_id: string;
  category: string;
  criterion: string;
  test_type: 'automated' | 'manual' | 'semi-automated';
};

type TestResultRow = {
  test_id: string;
  status: 'pass' | 'fail' | 'skip' | 'error';
  tester: string | null;
  notes: string | null;
  error_detail: string | null;
  tested_at: string | null;
};

function normalizeStatus(status: TestResultRow['status'] | null | undefined): FidelityCriterionStatus {
  if (status === 'pass') return 'pass';
  if (status === 'fail' || status === 'error') return 'fail';
  return 'untested';
}

function evaluateAutomatedCriterion(testId: string, project: Record<string, any>, tasks: Array<Record<string, any>>) {
  const completedTasks = tasks.filter(task => task.status === 'completed' || task.status === 'succeeded');
  const blockedTasks = tasks.filter(task => task.status === 'blocked' || task.status === 'failed');
  const hasApprovals = tasks.some(task => task.approval_required);
  const hasEvidence = tasks.some(task => Array.isArray(task.evidence) ? task.evidence.length : Boolean(task.evidence));
  const budgetGate = Number(project.budget_gate_gbp || 0);
  const apiCost = Number(project.api_cost_gbp || 0);

  switch (testId) {
    case 'AT-01':
      return tasks.length
        ? { status: 'pass' as const, notes: `${tasks.length} task rows are available for the graph.` }
        : { status: 'fail' as const, notes: 'No duo_tasks rows exist for this project.' };
    case 'AT-02':
      return tasks.some(task => Array.isArray(task.depends_on_tasks) && task.depends_on_tasks.length > 0)
        ? { status: 'pass' as const, notes: 'At least one task declares dependencies.' }
        : { status: 'skip' as const, notes: 'No dependency edges are present to verify.' };
    case 'AT-05':
      return hasApprovals
        ? { status: 'skip' as const, notes: 'Approval-required tasks exist; live approval resume requires integration test.' }
        : { status: 'skip' as const, notes: 'No approval-required task in this project.' };
    case 'AT-15':
      return budgetGate > 0 && apiCost >= budgetGate
        ? { status: project.status === 'paused' ? 'pass' as const : 'fail' as const, notes: `Cost ${apiCost} / budget ${budgetGate}.` }
        : { status: 'skip' as const, notes: 'Budget gate not reached.' };
    case 'AT-17':
      return blockedTasks.length
        ? { status: 'pass' as const, notes: `${blockedTasks.length} blocked/failed task(s) have visible failure state.` }
        : { status: 'skip' as const, notes: 'No failed task to verify.' };
    case 'AT-20':
      return project.status === 'completed'
        ? { status: completedTasks.length || hasEvidence ? 'pass' as const : 'fail' as const, notes: 'Completed project has task completion/evidence check.' }
        : { status: 'skip' as const, notes: 'Project is not completed yet.' };
    default:
      return { status: 'skip' as const, notes: 'Manual or UI acceptance check not run by server fidelity checker.' };
  }
}

function buildReportFromRows(
  projectId: string,
  run: Record<string, any> | null,
  tests: AcceptanceTestRow[],
  results: TestResultRow[]
): FidelityReport {
  const byTest = new Map(results.map(result => [result.test_id, result]));
  const criteria: FidelityCriterion[] = tests.map(test => {
    const result = byTest.get(test.test_id);
    return {
      id: result?.test_id || test.test_id,
      testId: test.test_id,
      category: test.category,
      criterion: test.criterion,
      status: normalizeStatus(result?.status),
      testerType: (result?.tester || test.test_type || 'automated') as FidelityCriterion['testerType'],
      testedAt: result?.tested_at || null,
      evidence: result?.notes || result?.error_detail || null
    };
  });

  const passCount = criteria.filter(item => item.status === 'pass').length;
  const failCount = criteria.filter(item => item.status === 'fail').length;
  const untestedCount = criteria.filter(item => item.status === 'untested').length;
  const overallScore = criteria.length ? Math.round((passCount / criteria.length) * 100) : 0;

  return {
    projectId,
    runId: run?.id || null,
    passCount,
    failCount,
    untestedCount,
    overallScore,
    completedAt: run?.completed_at || null,
    criteria
  };
}

export async function runFidelityCheck(projectId: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const [{ data: project }, { data: tasks }, { data: tests }] = await Promise.all([
    supabase.from('duo_projects').select('*').eq('id', projectId).maybeSingle(),
    supabase.from('duo_tasks').select('*').eq('project_id', projectId),
    supabase.from('duo_acceptance_tests').select('test_id,category,criterion,test_type').eq('active', true)
  ]);

  if (!project || !tests?.length) return null;

  const { data: run, error: runError } = await supabase
    .from('duo_test_runs')
    .insert({
      run_label: `fidelity_${projectId}_${Date.now()}`,
      project_id: projectId,
      triggered_by: 'manual',
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'local'
    })
    .select('id')
    .maybeSingle();

  if (runError || !run?.id) return null;

  const now = new Date().toISOString();
  const rows = (tests as AcceptanceTestRow[]).map(test => {
    const result = evaluateAutomatedCriterion(test.test_id, project, tasks ?? []);
    return {
      run_id: run.id,
      test_id: test.test_id,
      status: result.status,
      tester: test.test_type,
      notes: result.notes,
      duration_ms: 0,
      tested_at: now
    };
  });

  await supabase.from('duo_test_results').insert(rows);

  const passCount = rows.filter(row => row.status === 'pass').length;
  const failCount = rows.filter(row => row.status === 'fail').length;
  const skipCount = rows.filter(row => row.status === 'skip').length;

  await supabase
    .from('duo_test_runs')
    .update({
      overall_pass: failCount === 0,
      pass_count: passCount,
      fail_count: failCount,
      skip_count: skipCount,
      completed_at: new Date().toISOString()
    })
    .eq('id', run.id);

  return run.id;
}

export async function getFidelityReport(projectId: string): Promise<FidelityReport | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data: tests, error: testsError } = await supabase
    .from('duo_acceptance_tests')
    .select('test_id,category,criterion,test_type')
    .eq('active', true)
    .order('test_id', { ascending: true });

  if (testsError) {
    if (safeTableMissing(testsError)) return null;
    return null;
  }

  const { data: run } = await supabase
    .from('duo_test_runs')
    .select('id,completed_at,pass_count,fail_count,skip_count')
    .eq('project_id', projectId)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!run) return buildReportFromRows(projectId, null, tests ?? [], []);

  const { data: results } = await supabase
    .from('duo_test_results')
    .select('test_id,status,tester,notes,error_detail,tested_at')
    .eq('run_id', run.id);

  return buildReportFromRows(projectId, run, tests ?? [], results ?? []);
}
