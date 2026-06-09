function n(key: string, fallback: number) {
  const value = Number.parseInt(process.env[key] || '', 10);
  return Number.isFinite(value) ? value : fallback;
}

export const cfg = {
  historyWindowSize: n('HISTORY_WINDOW_SIZE', 8),
  fallbackHistorySize: n('FALLBACK_HISTORY_SIZE', 6),
  jobScanBatchSize: n('JOB_SCAN_BATCH_SIZE', 15),
  jobScanProfilesBatch: n('JOB_SCAN_PROFILES_BATCH', 20),
  jobScanSkillLimit: n('JOB_SCAN_SKILL_LIMIT', 4),
  jobScanRoleLimit: n('JOB_SCAN_ROLE_LIMIT', 2),
  jobDescPromptLimit: n('JOB_DESC_PROMPT_LIMIT', 500),
  jobDescTailoringLimit: n('JOB_DESC_TAILORING_LIMIT', 1200),
  jobDescStorageLimit: n('JOB_DESC_STORAGE_LIMIT', 3000),
  stagehandNavTimeout: n('STAGEHAND_NAV_TIMEOUT', 30000),
  stagehandLoadTimeout: n('STAGEHAND_LOAD_TIMEOUT', 20000),
  pushTtl: n('PUSH_TTL', 86400),
  vapidJwtExpiry: n('VAPID_JWT_EXPIRY_SECONDS', 43200),
  pushTitleMaxLength: n('PUSH_TITLE_MAX_LENGTH', 100),
  pushMessageMaxLength: n('PUSH_MESSAGE_MAX_LENGTH', 500),
  applicationAnswersBatch: n('APPLICATION_ANSWERS_BATCH', 50),
  maxApplicationAnswers: n('MAX_APPLICATION_ANSWERS', 20),
  resumeSummaryMaxLength: n('RESUME_SUMMARY_MAX_LENGTH', 3000),
  coverLetterMaxLength: n('COVER_LETTER_MAX_LENGTH', 6000),
  contextSummarySentences: n('CONTEXT_SUMMARY_SENTENCES', 2),
  contextMaxTopics: n('CONTEXT_MAX_TOPICS', 6),
  contextMaxClaims: n('CONTEXT_MAX_CLAIMS', 5),
  contextMaxKeywords: n('CONTEXT_MAX_KEYWORDS', 10),
  contextMaxUrls: n('CONTEXT_MAX_URLS', 3),
  maxSuggestionsReturn: n('MAX_SUGGESTIONS_RETURN', 5)
} as const;
