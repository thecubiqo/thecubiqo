export const CAREER_TERMS = [
  'job', 'jobs', 'resume', 'cv', 'career', 'apply', 'application', 'hire', 'hiring',
  'interview', 'linkedin', 'ba', 'business analyst', 'analyst', 'product owner', 'scrum',
  'salary', 'offer', 'recruiter', 'ats', 'jd', 'job description', 'cover letter',
  'remote', 'opportunity', 'role', 'position', 'work', 'employed', 'employment'
] as const;

export const GOAL_TERMS = [
  'linkedin', 'career', 'yoga', 'wellness', 'build', 'ship', 'launch', 'job', 'resume',
  'routine', 'business', 'pod'
] as const;

export const CASUAL_TERMS = [
  'instagram', 'facebook', 'fb', 'insta', 'comfort', 'chat', 'friends', 'mood', 'movie'
] as const;

export const GATED_TERMS = [
  'grindr', 'tinder', 'adult', 'explicit', 'nsfw', 'hookup'
] as const;

export const SKILL_KEYWORDS = new Set([
  'javascript', 'typescript', 'python', 'java', 'sql', 'react', 'node', 'aws', 'azure', 'gcp',
  'agile', 'scrum', 'jira', 'salesforce', 'tableau', 'excel', 'powerbi', 'looker', 'figma',
  'kubernetes', 'docker', 'git', 'api', 'rest', 'graphql', 'machine learning', 'ai', 'llm',
  'product management', 'stakeholder', 'roadmap', 'sprint', 'kanban', 'okr', 'kpi'
]);

export const POSITIVE_WORDS = [
  'excellent', 'strong', 'leading', 'innovative', 'growth', 'success', 'proven',
  'achieve', 'award', 'top', 'best', 'dynamic', 'collaborative'
] as const;

export const NEGATIVE_WORDS = [
  'lack', 'missing', 'poor', 'fail', 'issue', 'problem', 'risk', 'challenge',
  'weak', 'gap', 'concern', 'difficult'
] as const;

export const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'from', 'is', 'was', 'are', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does',
  'did', 'will', 'would', 'can', 'could', 'should', 'may', 'might', 'that', 'this',
  'these', 'those', 'it', 'its', 'they', 'their', 'we', 'our', 'you', 'your', 'he',
  'she', 'his', 'her'
]);
