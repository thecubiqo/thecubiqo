/**
 * Role-agnostic career tools for CubiQo.
 *
 * These helpers avoid hardcoded profession assumptions. They structure job
 * descriptions, compare user-supplied skills against a role, and generate
 * generic career workflow artifacts that the LLM can adapt to any field.
 */

// --- Types -------------------------------------------------------------------

export interface JdStructure {
  title: string | null;
  company: string | null;
  salary: string | null;
  yearsExperience: string | null;
  workMode: 'fully-remote' | 'hybrid' | 'onsite' | 'remote' | null;
  location: string | null;
  sections: {
    required: string;
    preferred: string;
    responsibilities: string;
    compensation: string;
    about: string;
    full: string;
  };
}

export interface ResumeGapInput {
  title: string;
  seniority: string | null;
  workStyle: string | null;
  requiredSkills: string[];
  atsKeywords: string[];
}

export interface ResumeGapResult {
  matchScore: number;
  strongMatches: string[];
  gaps: string[];
  partialMatches: string[];
  quickWins: string[];
  resumeAdditions: string[];
  summary: string;
}

// --- JD Structure ------------------------------------------------------------

function cleanText(value: string) {
  return value.replace(/\r/g, '').replace(/[ \t]+/g, ' ').trim();
}

function firstMeaningfulLine(lines: string[]) {
  return lines.find(line => {
    const trimmed = line.trim();
    return trimmed.length >= 4 && trimmed.length <= 90 && !/^(about|overview|description|responsibilities|requirements)$/i.test(trimmed);
  }) || null;
}

function sectionAfter(text: string, labels: string[], stopLabels: string[]) {
  const labelPattern = labels.map(label => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const stopPattern = stopLabels.map(label => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(`(?:^|\\n)\\s*(?:${labelPattern})\\s*:?\\s*\\n([\\s\\S]*?)(?=\\n\\s*(?:${stopPattern})\\s*:?\\s*\\n|$)`, 'i');
  return cleanText(text.match(regex)?.[1] || '');
}

export function structureJobDescription(jdText: string): JdStructure {
  const full = cleanText(jdText);
  const lower = full.toLowerCase();
  const lines = full.split('\n').map(line => line.trim()).filter(Boolean);

  const salaryMatch = full.match(/\$[\d,]+(?:\.\d+)?\s*(?:k|K)?\s*(?:[-\u2013to]+\s*\$?[\d,]+(?:\.\d+)?\s*(?:k|K)?)?(?:\s*(?:per year|\/year|\/yr|annually|hourly|\/hr|per hour))?/i);
  const yearsMatch = full.match(/\b(?:at least\s*)?(\d+\+?(?:\s*[-\u2013]\s*\d+)?\s*years?(?:\s+of)?\s+(?:relevant\s+)?experience)\b/i);

  const workMode =
    /\b(fully remote|100%\s*remote|remote-first|remote first)\b/i.test(full) ? 'fully-remote' :
    /\bhybrid\b/i.test(full) ? 'hybrid' :
    /\b(on-site|onsite|in-office|in office)\b/i.test(full) ? 'onsite' :
    /\bremote\b/i.test(full) ? 'remote' :
    null;

  const title = firstMeaningfulLine(lines);
  const companyMatch = full.match(/\b(?:at|with|company:)\s+([A-Z][A-Za-z0-9&.,' -]{2,80})/);
  const locationMatch = full.match(/\b(?:location|based in|work location)\s*:?\s*([A-Za-z0-9, /.-]{2,80})/i);

  const stopLabels = [
    'about', 'overview', 'responsibilities', 'what you will do', 'requirements',
    'qualifications', 'required', 'preferred', 'nice to have', 'compensation',
    'salary', 'benefits', 'location', 'equal opportunity'
  ];

  const required = sectionAfter(full, ['requirements', 'required qualifications', 'must have', 'qualifications'], stopLabels);
  const preferred = sectionAfter(full, ['preferred qualifications', 'preferred', 'nice to have', 'bonus', 'plus'], stopLabels);
  const responsibilities = sectionAfter(full, ['responsibilities', 'what you will do', 'what you will be doing', 'role responsibilities'], stopLabels);
  const compensation = sectionAfter(full, ['compensation', 'salary', 'pay range', 'benefits'], stopLabels);
  const about = sectionAfter(full, ['about us', 'about the company', 'overview', 'about'], stopLabels);

  return {
    title,
    company: companyMatch?.[1]?.trim() || null,
    salary: salaryMatch?.[0]?.trim() || null,
    yearsExperience: yearsMatch?.[1]?.trim() || null,
    workMode,
    location: locationMatch?.[1]?.trim() || (lower.includes('remote') ? 'Remote' : null),
    sections: {
      required,
      preferred,
      responsibilities,
      compensation,
      about,
      full
    }
  };
}

// --- Resume Gap Check --------------------------------------------------------

export function resumeGapCheck(
  userProfile: string,
  jdAnalysis: ResumeGapInput
): ResumeGapResult {
  const profile = userProfile.toLowerCase();
  const required = jdAnalysis.requiredSkills;

  const strongMatches: string[] = [];
  const partialMatches: string[] = [];
  const gaps: string[] = [];

  for (const skill of required) {
    const skillLower = skill.toLowerCase().replace(/[^a-z0-9\s/+.#-]/g, '');
    const words = skillLower.split(/[\s/+.#-]+/).filter(w => w.length > 2);
    const fullMatch = words.length > 0 && words.every(w => profile.includes(w));
    const partialMatch = words.some(w => profile.includes(w));

    if (fullMatch) strongMatches.push(skill);
    else if (partialMatch) partialMatches.push(skill);
    else gaps.push(skill);
  }

  const matchScore = required.length === 0 ? 80 :
    Math.round(((strongMatches.length + partialMatches.length * 0.5) / required.length) * 100);

  const quickWins = partialMatches.slice(0, 5);
  const resumeAdditions = gaps
    .slice(0, 5)
    .map(g => `Add concrete evidence for "${g}" using a project, metric, certification, or transferable example.`);

  const summary =
    matchScore >= 85 ? `Strong fit (${matchScore}%). Tune the resume language to mirror the role and apply with confidence.` :
    matchScore >= 70 ? `Good match (${matchScore}%). Address ${gaps.length} gap(s) with specific resume evidence.` :
    matchScore >= 55 ? `Moderate match (${matchScore}%). Strengthen proof points before applying.` :
    `Lower match (${matchScore}%). Focus on transferable evidence and decide whether the gap is acceptable.`;

  return {
    matchScore,
    strongMatches,
    partialMatches,
    gaps,
    quickWins,
    resumeAdditions,
    summary,
  };
}

// --- Application Checklist ---------------------------------------------------

export function buildApplicationChecklist(
  roleTitle: string,
  company: string,
  platform: 'linkedin' | 'indeed' | 'greenhouse' | 'lever' | 'workday' | 'direct' | 'other',
  gapCount: number
): { step: string; priority: 'critical' | 'high' | 'medium'; done: boolean }[] {
  const base = [
    { step: `Tailor resume headline to the exact role: "${roleTitle}"`, priority: 'critical' as const, done: false },
    { step: 'Mirror the most important JD language truthfully in resume bullets and summary.', priority: 'critical' as const, done: false },
    { step: 'Quantify at least 3 proof points with measurable outcomes.', priority: 'critical' as const, done: false },
    { step: `Research ${company || 'the company'}: product, customers, recent news, and priorities.`, priority: 'high' as const, done: false },
    { step: 'Prepare a short cover note: role fit, proof, motivation, and availability.', priority: 'high' as const, done: false },
    { step: 'Prepare examples for conflict, ambiguity, delivery pressure, and learning curve.', priority: 'high' as const, done: false },
    { step: 'Check whether a warm intro or recruiter contact is available before applying.', priority: 'medium' as const, done: false },
  ];

  const platformSteps: Record<typeof platform, { step: string; priority: 'critical' | 'high' | 'medium'; done: boolean }[]> = {
    linkedin: [
      { step: 'Use the saved profile and tailored resume; answer screening questions carefully.', priority: 'critical' as const, done: false },
      { step: 'Review the application screen before pressing the final submit button.', priority: 'critical' as const, done: false },
      { step: 'Consider a recruiter or hiring-manager follow-up after applying.', priority: 'medium' as const, done: false },
    ],
    indeed: [
      { step: 'Use the most current resume version and verify parsed fields before continuing.', priority: 'critical' as const, done: false },
      { step: 'Answer screening questions honestly; mismatches can create downstream issues.', priority: 'high' as const, done: false },
    ],
    greenhouse: [
      { step: 'Use a clean one-column resume PDF for ATS parsing.', priority: 'critical' as const, done: false },
      { step: 'Complete optional fields when they add useful context.', priority: 'high' as const, done: false },
    ],
    lever: [
      { step: 'Use the additional information field for a concise role-specific note if available.', priority: 'high' as const, done: false },
    ],
    workday: [
      { step: 'Create or reuse the Workday profile carefully to avoid duplicate applications.', priority: 'high' as const, done: false },
      { step: 'Verify every parsed resume field before moving to review.', priority: 'critical' as const, done: false },
    ],
    direct: [
      { step: 'Follow the employer instructions exactly and keep a copy of submitted answers.', priority: 'critical' as const, done: false },
      { step: 'Follow up in 5-7 business days if no acknowledgement arrives.', priority: 'medium' as const, done: false },
    ],
    other: [
      { step: 'Use a clean one-column PDF resume and verify every parsed field.', priority: 'critical' as const, done: false },
    ],
  };

  if (gapCount > 0) {
    base.splice(2, 0, { step: `Address ${gapCount} role gap(s) with truthful supporting evidence before applying.`, priority: 'high' as const, done: false });
  }

  return [...base, ...(platformSteps[platform] || platformSteps.other)];
}

// --- Cover Letter Brief ------------------------------------------------------

export function coverLetterBrief(
  roleTitle: string,
  company: string,
  strongMatches: string[],
  gaps: string[],
  yearsExp: number
): { hook: string; proofPoints: string[]; fitStatement: string; closingAction: string } {
  const targetCompany = company || 'the organization';
  const hook = `Opening hook: State the role you are targeting and the outcome you can help ${targetCompany} achieve as a ${roleTitle}.`;

  const proofPoints = [
    strongMatches.length > 0
      ? `Proof 1: Highlight ${strongMatches.slice(0, 3).join(', ')} with one concrete project or metric.`
      : 'Proof 1: Use the strongest relevant project, achievement, or credential from your background.',
    'Proof 2: Show how you work with people, tools, constraints, or customers in this kind of role.',
    yearsExp >= 5
      ? `Proof 3: Cite your ${yearsExp}-year track record and connect it to the role requirements.`
      : 'Proof 3: Show learning speed, ownership, and readiness for the role.',
    gaps.length > 0
      ? `Address gap: If ${gaps[0]} is missing, name the closest truthful transferable evidence.`
      : 'Differentiate: mention one relevant detail that is not obvious from the resume.',
  ];

  const fitStatement = `Fit paragraph: Connect your direction to ${targetCompany}'s needs using one researched detail and one relevant proof point.`;
  const closingAction = 'Closing: Ask for a conversation and provide a clear availability or next-step signal.';

  return { hook, proofPoints, fitStatement, closingAction };
}

// --- Interview Prep ----------------------------------------------------------

export function interviewPrepKit(
  roleTitle: string,
  requiredSkills: string[],
  seniority: string
): { behavioural: string[]; technical: string[]; theyAskYou: string[]; youAskThem: string[] } {
  const behavioural = [
    `Tell me about a time you solved a difficult problem in a role similar to ${roleTitle}.`,
    'Describe a time priorities changed quickly. How did you respond?',
    'Give an example where you had to learn a new domain, tool, or process quickly.',
    'Tell me about a conflict or disagreement and how you handled it.',
    'Describe an achievement you are proud of and how you measured success.',
  ];

  const technical = requiredSkills.slice(0, 5).map(skill =>
    `How have you used ${skill} in a real setting? Give a specific example, outcome, and lesson learned.`
  );

  if (technical.length < 3) {
    technical.push(
      `What skills matter most for success as a ${roleTitle}, and where are you strongest?`,
      'Walk me through a recent project or responsibility that best matches this role.',
      'What would you need to ramp up on in the first 30 days?'
    );
  }

  const seniorityExtras =
    seniority === 'Senior' || seniority === 'Senior Leadership'
      ? [
          'How do you influence strategy or mentor others in your area?',
          'Describe a time you improved a system, team, or operating model.',
        ]
      : ['What support helps you do your best work in a new role?'];

  const youAskThem = [
    'What does success look like for this role in the first 90 days?',
    'What are the biggest problems this person will need to solve?',
    'How is performance measured for this role?',
    'What tools, processes, and collaborators does this role depend on?',
    'What is the growth path for someone who performs well here?',
  ];

  return {
    behavioural,
    technical: [...technical, ...seniorityExtras].slice(0, 6),
    theyAskYou: [...behavioural, ...technical].slice(0, 5),
    youAskThem,
  };
}

// --- Job Search Query Builder ------------------------------------------------

export type JobSearchRecency = '24h' | '3d' | '7d' | '30d' | 'any';

export interface JobSearchQueryInput {
  role?: string | null;
  targetTitles?: string[];
  location?: string | null;
  workMode?: 'remote' | 'hybrid' | 'onsite' | 'flexible' | string | null;
  skills?: string[];
  seniority?: 'junior' | 'mid' | 'senior' | 'any';
  recency?: JobSearchRecency;
}

export type JobSearchQueries =
  | {
      clarificationNeeded: true;
      error: 'Role unclear';
      action: 'ask_user';
      message: string;
      requiredFields: string[];
    }
  | {
      clarificationNeeded?: false;
      primary: string;
      alternative: string[];
      linkedinUrl: string;
      indeedUrl: string;
      recency: JobSearchRecency;
    };

function linkedInRecencyFilter(recency: JobSearchRecency): string {
  const secondsByRecency: Record<JobSearchRecency, number | null> = {
    '24h': 86400,
    '3d': 259200,
    '7d': 604800,
    '30d': 2592000,
    any: null,
  };
  const seconds = secondsByRecency[recency];
  return seconds ? `&f_TPR=r${seconds}` : '';
}

function indeedRecencyFilter(recency: JobSearchRecency): string {
  const daysByRecency: Record<JobSearchRecency, number | null> = {
    '24h': 1,
    '3d': 3,
    '7d': 7,
    '30d': 30,
    any: null,
  };
  const days = daysByRecency[recency];
  return days ? `&fromage=${days}` : '';
}

export function buildJobSearchQueries(input: JobSearchQueryInput): JobSearchQueries {
  const role = (input.role || input.targetTitles?.[0] || '').trim();
  if (!role) {
    return {
      clarificationNeeded: true,
      error: 'Role unclear',
      action: 'ask_user',
      message: 'What role or job title should I search for?',
      requiredFields: ['role'],
    };
  }

  const location = input.location || '';
  const workMode = input.workMode || '';
  const skills = input.skills || [];
  const seniority = input.seniority || 'mid';
  const recency = input.recency || '24h';
  const seniorityMap = { junior: 'junior OR associate', mid: '', senior: 'senior OR lead OR principal', any: '' };
  const seniorityStr = seniorityMap[seniority] || '';
  const locationStr = [location, workMode].filter(Boolean).join(' ') || 'open location';
  const topSkills = skills.slice(0, 3).join(' ');

  const primary = `"${role}" ${seniorityStr} ${locationStr} ${topSkills}`.replace(/\s+/g, ' ').trim();

  const alternatives = [
    `"${role}" ${locationStr}`,
    `"${role}" ${topSkills}`.replace(/\s+/g, ' ').trim(),
    `"${role}" contract ${locationStr}`,
    `site:linkedin.com/jobs "${role}" ${locationStr}`,
    `site:greenhouse.io OR site:lever.co "${role}" ${locationStr}`,
  ];

  const liQuery = encodeURIComponent(`${role} ${locationStr}`);
  const indeedQuery = encodeURIComponent(`${role} ${topSkills}`);
  const isRemote = /\bremote\b/i.test(locationStr);
  const linkedInRemoteFilter = isRemote ? '&f_WT=2' : '';
  const indeedRemoteFilter = isRemote ? '&remotejob=032b3046-06a3-4876-8dfd-474eb5e7ed11' : '';
  const linkedInRecency = linkedInRecencyFilter(recency);
  const indeedRecency = indeedRecencyFilter(recency);

  return {
    primary,
    alternative: alternatives.filter(Boolean),
    linkedinUrl: `https://www.linkedin.com/jobs/search/?keywords=${liQuery}${linkedInRemoteFilter}${linkedInRecency}`,
    indeedUrl: `https://www.indeed.com/jobs?q=${indeedQuery}&l=${encodeURIComponent(locationStr)}${indeedRemoteFilter}${indeedRecency}`,
    recency,
  };
}
