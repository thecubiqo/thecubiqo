/**
 * Career-specific agentic tools for CubiQo
 * Powers the BA/job-application flow end-to-end — JD analysis, resume gap check,
 * ATS keyword extraction, application checklist, cover letter brief, interview prep.
 * All tools are self-contained: no external API keys required.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JdAnalysis {
  title: string;
  seniority: string;
  workStyle: string;
  requiredSkills: string[];
  niceToHave: string[];
  atsKeywords: string[];
  responsibilities: string[];
  redFlags: string[];
  estimatedSalary: string;
  applicationStrategy: string;
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

// ─── JD Analysis ─────────────────────────────────────────────────────────────

export function analyzeJobDescription(jdText: string): JdAnalysis {
  const text = jdText.toLowerCase();
  const lines = jdText.split(/[\n.]+/).map(l => l.trim()).filter(Boolean);

  // Seniority
  const seniority =
    /\b(vp|vice president|director|head of|principal|staff)\b/.test(text) ? 'Senior Leadership' :
    /\b(senior|sr\.?|lead|iii|iv)\b/.test(text) ? 'Senior' :
    /\b(junior|jr\.?|associate|entry|graduate|0[-–]2 years?)\b/.test(text) ? 'Junior' :
    'Mid-level';

  // Work style
  const workStyle =
    /\bfully remote\b|\b100%\s*remote\b/.test(text) ? 'Fully Remote' :
    /\bhybrid\b/.test(text) ? 'Hybrid' :
    /\bon[-\s]?site\b|\bin[-\s]?office\b/.test(text) ? 'On-site' :
    /\bremote\b/.test(text) ? 'Remote' : 'Not specified';

  // Title extraction — look for job title patterns
  const titleMatch = jdText.match(/^(.{0,80}?(?:analyst|manager|engineer|developer|specialist|consultant|coordinator|architect|designer|owner|director)[^\n]*)/im);
  const title = titleMatch ? titleMatch[1].trim().replace(/[^a-zA-Z0-9 \/\-]/g, '').trim() : 'Role';

  // Required skills
  const SKILL_PATTERNS: [RegExp, string][] = [
    [/\b(agile|scrum|kanban|safe|scaled agile)\b/gi, 'Agile/Scrum'],
    [/\bjira\b/gi, 'Jira'],
    [/\bconfluence\b/gi, 'Confluence'],
    [/\bsql\b/gi, 'SQL'],
    [/\bpython\b/gi, 'Python'],
    [/\bexcel\b/gi, 'Excel'],
    [/\bpower\s*bi\b/gi, 'Power BI'],
    [/\btableau\b/gi, 'Tableau'],
    [/\blooker\b/gi, 'Looker'],
    [/\bsalesforce\b/gi, 'Salesforce'],
    [/\bsap\b/gi, 'SAP'],
    [/\bworkday\b/gi, 'Workday'],
    [/\bservice\s*now\b/gi, 'ServiceNow'],
    [/\bvisio\b/gi, 'Visio'],
    [/\blucid(chart)?\b/gi, 'LucidChart'],
    [/\b(stakeholder\s*management|stakeholder\s*engagement)\b/gi, 'Stakeholder Management'],
    [/\b(requirements?\s*(gathering|elicitation|analysis))\b/gi, 'Requirements Gathering'],
    [/\b(user stories?|use cases?)\b/gi, 'User Stories / Use Cases'],
    [/\b(process\s*(mapping|improvement|re-?engineering))\b/gi, 'Process Mapping'],
    [/\b(data\s*analysis|data\s*analytics)\b/gi, 'Data Analysis'],
    [/\b(product\s*(management|owner|ownership))\b/gi, 'Product Management'],
    [/\b(change\s*management)\b/gi, 'Change Management'],
    [/\b(uat|user acceptance testing)\b/gi, 'UAT'],
    [/\b(bpmn|brd|frd|prd|srs)\b/gi, 'Business Documents (BRD/FRD/PRD)'],
    [/\b(api|rest|soap|integration)\b/gi, 'API / Integrations'],
    [/\b(erp)\b/gi, 'ERP Systems'],
    [/\b(crm)\b/gi, 'CRM Systems'],
    [/\b(lean|six\s*sigma)\b/gi, 'Lean / Six Sigma'],
    [/\b(presentation|powerpoint|storytelling)\b/gi, 'Presentation / Storytelling'],
    [/\b(devops|ci\/cd|sdlc)\b/gi, 'SDLC / DevOps'],
    [/\b(machine learning|ml|ai|nlp)\b/gi, 'AI / ML'],
    [/\b(azure|aws|gcp|cloud)\b/gi, 'Cloud Platforms'],
    [/\b(sharepoint)\b/gi, 'SharePoint'],
    [/\b(monday\.com|asana|trello|linear)\b/gi, 'Project Tools'],
  ];

  const requiredSkills: string[] = [];
  const niceToHave: string[] = [];

  // Split text into required vs preferred sections
  const reqSection = jdText.match(/(?:required|must have|qualifications|responsibilities)([\s\S]*?)(?:nice to have|preferred|bonus|plus|desirable|$)/i)?.[1] || jdText;
  const preferredSection = jdText.match(/(?:nice to have|preferred|bonus|plus|desirable)([\s\S]*?)$/i)?.[1] || '';

  for (const [pattern, label] of SKILL_PATTERNS) {
    if (pattern.test(reqSection)) requiredSkills.push(label);
    else if (preferredSection && pattern.test(preferredSection)) niceToHave.push(label);
    pattern.lastIndex = 0;
  }

  // Years of experience
  const yoeMatch = jdText.match(/(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)/i);
  if (yoeMatch) requiredSkills.unshift(`${yoeMatch[1]}+ years experience`);

  // ATS keywords — power phrases that ATS scanners look for
  const atsKeywords: string[] = [];
  const atsPatterns = [
    'business analyst', 'requirements', 'stakeholder', 'agile', 'scrum', 'product owner',
    'user stories', 'process improvement', 'data analysis', 'sql', 'jira', 'confluence',
    'change management', 'uat', 'brd', 'frd', 'gap analysis', 'workflow', 'cross-functional',
    'sprint', 'backlog', 'epics', 'kpi', 'roi', 'roadmap', 'solution design', 'elicitation'
  ];
  for (const kw of atsPatterns) {
    if (text.includes(kw)) atsKeywords.push(kw);
  }

  // Responsibilities extraction
  const responsibilities = lines
    .filter(l => /^[-•*]|^\d+\./.test(l) || /\b(responsible for|will|you'll|you will|must|required to)\b/i.test(l))
    .map(l => l.replace(/^[-•*\d.]\s*/, '').trim())
    .filter(l => l.length > 20 && l.length < 180)
    .slice(0, 8);

  // Red flags
  const redFlags: string[] = [];
  if (/\b(10|12|15)\+?\s*years?\b/i.test(jdText)) redFlags.push('Very high experience bar');
  if (/\b(nights?|weekends?|on[-\s]?call)\b/i.test(text)) redFlags.push('After-hours availability expected');
  if (/\b(unicorn|rockstar|ninja|wizard)\b/i.test(text)) redFlags.push('Vague "unicorn" job spec');
  if (requiredSkills.length > 15) redFlags.push('Possibly overloaded role with too many requirements');

  // Salary estimate
  const salaryMatch = jdText.match(/\$[\d,]+\s*[-–]\s*\$[\d,]+|\$[\d,]+k?\s*(?:per year|\/yr|annually)/i);
  const estimatedSalary = salaryMatch ? salaryMatch[0] : 'Not listed — research on Glassdoor/Levels.fyi';

  // Application strategy
  const strategy =
    requiredSkills.length <= 5 ? 'Apply immediately — you likely meet most requirements.' :
    requiredSkills.length <= 10 ? 'Strong match likely. Tailor resume before applying.' :
    'Selective match — address gaps in cover letter, highlight transferable skills.';

  return {
    title,
    seniority,
    workStyle,
    requiredSkills: [...new Set(requiredSkills)].slice(0, 15),
    niceToHave: [...new Set(niceToHave)].slice(0, 8),
    atsKeywords: [...new Set(atsKeywords)].slice(0, 12),
    responsibilities,
    redFlags,
    estimatedSalary,
    applicationStrategy: strategy,
  };
}

// ─── Resume Gap Check ─────────────────────────────────────────────────────────

export function resumeGapCheck(
  userProfile: string,
  jdAnalysis: JdAnalysis
): ResumeGapResult {
  const profile = userProfile.toLowerCase();
  const required = jdAnalysis.requiredSkills;
  const ats = jdAnalysis.atsKeywords;

  const strongMatches: string[] = [];
  const partialMatches: string[] = [];
  const gaps: string[] = [];

  for (const skill of required) {
    const skillLower = skill.toLowerCase().replace(/[^a-z0-9\s\/]/g, '');
    const words = skillLower.split(/[\s\/]+/).filter(w => w.length > 2);
    const fullMatch = words.every(w => profile.includes(w));
    const partialMatch = words.some(w => profile.includes(w));

    if (fullMatch) strongMatches.push(skill);
    else if (partialMatch) partialMatches.push(skill);
    else gaps.push(skill);
  }

  const matchScore = required.length === 0 ? 80 :
    Math.round(((strongMatches.length + partialMatches.length * 0.5) / required.length) * 100);

  // Quick wins — things the user might have but hasn't highlighted
  const quickWins = gaps.filter(g => {
    const gLower = g.toLowerCase();
    return (
      (gLower.includes('agile') && /\bsprint|standup|retro|backlog\b/.test(profile)) ||
      (gLower.includes('sql') && /\bdatabase|query|data\b/.test(profile)) ||
      (gLower.includes('stakeholder') && /\bclient|partner|business\b/.test(profile)) ||
      (gLower.includes('user stor') && /\baccept|criteria|feature\b/.test(profile)) ||
      (gLower.includes('uat') && /\btest|qa|quality\b/.test(profile))
    );
  });

  // Concrete resume additions
  const resumeAdditions = gaps
    .filter(g => !quickWins.includes(g))
    .slice(0, 5)
    .map(g => `Add evidence for: "${g}" — even a brief project reference counts`);

  const summary =
    matchScore >= 85 ? `Strong fit (${matchScore}%). Tailor keywords and apply with confidence.` :
    matchScore >= 70 ? `Good match (${matchScore}%). Address ${gaps.length} gap(s) in cover letter and resume.` :
    matchScore >= 55 ? `Moderate match (${matchScore}%). Target quick wins and consider a skills addendum.` :
    `Lower match (${matchScore}%). Focus on transferable skills and address the most critical gaps directly.`;

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

// ─── Application Checklist ────────────────────────────────────────────────────

export function buildApplicationChecklist(
  roleTitle: string,
  company: string,
  platform: 'linkedin' | 'indeed' | 'greenhouse' | 'lever' | 'workday' | 'direct' | 'other',
  gapCount: number
): { step: string; priority: 'critical' | 'high' | 'medium'; done: boolean }[] {
  const base = [
    { step: `Tailor resume headline: "${roleTitle} | ${gapCount <= 3 ? 'Strong match' : 'Specialized expertise'}"`, priority: 'critical' as const, done: false },
    { step: 'Mirror top 5 ATS keywords from the JD verbatim in your resume', priority: 'critical' as const, done: false },
    { step: 'Quantify at least 3 bullet points (%, $, time saved, users impacted)', priority: 'critical' as const, done: false },
    { step: `Research ${company || 'the company'}: business model, recent news, strategic priorities`, priority: 'high' as const, done: false },
    { step: 'Write a 3-paragraph cover letter: hook → proof → fit', priority: 'high' as const, done: false },
    { step: 'Prepare STAR answers for: stakeholder conflict, ambiguous requirements, delivery under pressure', priority: 'high' as const, done: false },
    { step: 'Check LinkedIn connections at this company for warm intro opportunity', priority: 'high' as const, done: false },
  ];

  const platformSteps: Record<typeof platform, { step: string; priority: 'critical' | 'high' | 'medium'; done: boolean }[]> = {
    linkedin: [
      { step: 'Enable "Open to Work" if not already — use private mode targeting recruiters', priority: 'medium' as const, done: false },
      { step: 'Use LinkedIn Easy Apply — attach tailored resume, answer screening questions carefully', priority: 'critical' as const, done: false },
      { step: 'Send InMail or connection request to hiring manager within 24h of applying', priority: 'high' as const, done: false },
    ],
    indeed: [
      { step: 'Apply via Indeed — select "Resume from Indeed" only if it is fully up-to-date', priority: 'critical' as const, done: false },
      { step: 'Answer screening questions honestly — ATS rejects mismatches', priority: 'high' as const, done: false },
    ],
    greenhouse: [
      { step: 'Greenhouse ATS: use simple formatting — no tables, no columns in resume PDF', priority: 'critical' as const, done: false },
      { step: 'Fill every optional field — completeness score affects ranking', priority: 'high' as const, done: false },
    ],
    lever: [
      { step: 'Lever ATS: paste cover letter into the "Additional info" field if no upload slot', priority: 'high' as const, done: false },
    ],
    workday: [
      { step: 'Workday: create profile account first, then apply — saves data for future roles', priority: 'high' as const, done: false },
      { step: 'Workday resume parser is aggressive — use clean one-column PDF resume', priority: 'critical' as const, done: false },
    ],
    direct: [
      { step: 'Email application: subject line = "Application: [Role Title] — [Your Name]"', priority: 'critical' as const, done: false },
      { step: 'Follow up in 5–7 business days if no acknowledgement', priority: 'medium' as const, done: false },
    ],
    other: [
      { step: 'Use clean one-column PDF resume — safe for all ATS parsers', priority: 'critical' as const, done: false },
    ],
  };

  return [...base, ...(platformSteps[platform] || platformSteps.other)];
}

// ─── Cover Letter Brief ───────────────────────────────────────────────────────

export function coverLetterBrief(
  roleTitle: string,
  company: string,
  strongMatches: string[],
  gaps: string[],
  yearsExp: number
): { hook: string; proofPoints: string[]; fitStatement: string; closingAction: string } {
  const hook = `Opening hook: Lead with the business outcome you deliver — "I help ${company || 'organizations'} bridge the gap between business needs and technical delivery as a ${roleTitle}."`;

  const proofPoints = [
    strongMatches.length > 0
      ? `Proof 1: Highlight ${strongMatches.slice(0, 3).join(', ')} with a specific metric — e.g., "Led requirements workshops that reduced rework by 30%"`
      : `Proof 1: Describe your most impactful BA project end-to-end`,
    `Proof 2: Show cross-functional leadership — stakeholders aligned, ambiguity resolved`,
    yearsExp >= 5
      ? `Proof 3: Cite your ${yearsExp}-year track record across multiple domains or industries`
      : `Proof 3: Show rapid growth and ability to ramp up quickly`,
    gaps.length > 0
      ? `Address gap: If ${gaps[0]} is missing, reframe it — "While I haven't used ${gaps[0]} formally, I have [equivalent skill]"`
      : `Differentiate: mention something not in your resume that makes you memorable`,
  ];

  const fitStatement = `Fit paragraph: Connect your direction to the company's — "Your focus on [company initiative from research] aligns with my work on [relevant project]. I'm drawn to roles where BAs have real strategic influence, not just documentation."`;

  const closingAction = `Closing: "I'd welcome a conversation to discuss how I can contribute to [specific team or goal]. Available for a call this week — [LinkedIn/phone]."`;

  return { hook, proofPoints, fitStatement, closingAction };
}

// ─── Interview Prep ───────────────────────────────────────────────────────────

export function interviewPrepKit(
  roleTitle: string,
  requiredSkills: string[],
  seniority: string
): { behavioural: string[]; technical: string[]; theyAskYou: string[]; youAskThem: string[] } {
  const behavioural = [
    'Tell me about a time a stakeholder pushed back on your requirements — how did you handle it?',
    'Describe a project where scope changed significantly. How did you manage it?',
    'Give an example where you found a requirement gap late in delivery. What happened?',
    'Tell me about a cross-functional conflict and how you resolved it.',
    'Describe the most complex process you mapped and improved.',
  ];

  const technicalBySkill: Record<string, string> = {
    'Agile/Scrum': 'Walk me through how you write and prioritize user stories with a dev team.',
    'SQL': 'How do you use SQL in your BA work? Give a real example.',
    'Stakeholder Management': 'How do you handle a stakeholder who keeps changing requirements?',
    'Requirements Gathering': 'What techniques do you use for eliciting requirements from non-technical stakeholders?',
    'User Stories / Use Cases': 'What makes a good acceptance criterion? Give an example.',
    'Data Analysis': 'Describe a time your data analysis changed a business decision.',
    'UAT': 'How do you structure a UAT plan and manage defects?',
    'Process Mapping': 'Walk me through your process for mapping an AS-IS vs TO-BE state.',
    'Change Management': 'How do you get business users to adopt a new system or process?',
  };

  const technical = requiredSkills
    .filter(s => technicalBySkill[s])
    .map(s => technicalBySkill[s])
    .slice(0, 5);

  if (technical.length < 3) {
    technical.push(
      'How do you decide between building a requirements doc vs. going straight to user stories?',
      'Describe how you collaborate with dev leads during sprint planning.',
      'How do you measure whether a delivered solution actually solved the business problem?'
    );
  }

  const seniorityExtras =
    seniority === 'Senior' || seniority === 'Senior Leadership'
      ? [
          'How do you mentor junior BAs or PMs on your team?',
          'Describe your experience influencing product strategy, not just executing it.',
        ]
      : ['What does your ideal relationship with a product manager look like?'];

  const youAskThem = [
    'What does success look like for this role in the first 90 days?',
    'What is the biggest challenge the BA team is solving right now?',
    'How does the BA team collaborate with product and engineering here?',
    'What tools and processes does the team use for requirements management?',
    'What does the career path look like for someone in this role?',
  ];

  return {
    behavioural,
    technical: [...technical, ...seniorityExtras].slice(0, 6),
    theyAskYou: [...behavioural, ...technical].slice(0, 5),
    youAskThem,
  };
}

// ─── Job Search Query Builder ─────────────────────────────────────────────────

export function buildJobSearchQueries(
  role: string,
  location: 'remote' | 'usa' | 'hybrid' | string,
  skills: string[],
  seniority: 'junior' | 'mid' | 'senior' | 'any'
): { primary: string; alternative: string[]; linkedinUrl: string; indeedUrl: string } {
  const seniorityMap = { junior: 'junior OR associate', mid: '', senior: 'senior OR lead OR principal', any: '' };
  const seniorityStr = seniorityMap[seniority] || '';
  const locationStr = location === 'remote' ? 'remote' : location === 'usa' ? 'remote USA' : location;
  const topSkills = skills.slice(0, 3).join(' ');

  const primary = `"${role}" ${seniorityStr} ${locationStr} ${topSkills}`.replace(/\s+/g, ' ').trim();

  const alternatives = [
    `"business systems analyst" ${locationStr} ${skills[0] || 'agile'}`,
    `"product analyst" OR "data analyst" "${role.toLowerCase()}" ${locationStr}`,
    `"${role}" contract ${locationStr}`,
    `site:linkedin.com/jobs "${role}" ${locationStr}`,
    `site:greenhouse.io OR site:lever.co "${role}" ${locationStr}`,
  ];

  const liQuery = encodeURIComponent(`${role} ${locationStr}`);
  const indeedQuery = encodeURIComponent(`${role} ${skills[0] || ''}`);

  return {
    primary,
    alternative: alternatives,
    linkedinUrl: `https://www.linkedin.com/jobs/search/?keywords=${liQuery}&f_WT=2`,
    indeedUrl: `https://www.indeed.com/jobs?q=${indeedQuery}&l=Remote&remotejob=032b3046-06a3-4876-8dfd-474eb5e7ed11`,
  };
}
