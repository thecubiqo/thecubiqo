/**
 * Job Hunt Mode Types
 * Types for the job hunting automation feature
 */

// ============================================================================
// JOB HUNT PROFILE TYPES
// ============================================================================

export type WorkType = 'remote' | 'hybrid' | 'onsite'
export type JobType = 'full-time' | 'part-time' | 'contract' | 'internship'

export type JobHuntProfile = {
  id: string
  user_id: string
  
  // Resume information
  resume_url: string | null
  resume_filename: string | null
  resume_content: string | null
  
  // Job preferences
  target_roles: string[]
  target_companies: string[]
  target_locations: string[]
  work_type: WorkType[]
  job_types: JobType[]
  salary_min: number | null
  salary_max: number | null
  
  // Skills and experience
  skills: string[]
  years_of_experience: number | null
  
  // Additional info
  cover_letter_template: string | null
  linkedin_profile: string | null
  portfolio_url: string | null
  github_profile: string | null
  
  // Status
  is_active: boolean
  
  // Metadata
  preferences: Record<string, any>
  created_at: string
  updated_at: string
}

export type JobHuntProfileInsert = Omit<JobHuntProfile, 'id' | 'created_at' | 'updated_at'>
export type JobHuntProfileUpdate = Partial<JobHuntProfileInsert>

// ============================================================================
// JOB HUNT QUESTION TYPES
// ============================================================================

export type QuestionAnswerType = 'text' | 'multiple_choice' | 'boolean' | 'number'

export type JobHuntQuestion = {
  id: string
  profile_id: string
  question_key: string
  question_text: string
  answer: string | null
  answer_type: QuestionAnswerType
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export type JobHuntQuestionInsert = Omit<JobHuntQuestion, 'id' | 'created_at' | 'updated_at'>
export type JobHuntQuestionUpdate = Partial<JobHuntQuestionInsert>

// ============================================================================
// JOB APPLICATION TYPES
// ============================================================================

export type ApplicationStatus =
  | 'pending'
  | 'applied'
  | 'screening'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'offer_received'
  | 'rejected'
  | 'withdrawn'

export type InterviewType = 'phone' | 'video' | 'onsite' | 'take_home'

export type JobPlatform =
  | 'linkedin'
  | 'indeed'
  | 'glassdoor'
  | 'monster'
  | 'ziprecruiter'
  | 'company_website'
  | 'other'

export type JobApplication = {
  id: string
  profile_id: string
  
  // Job details
  job_title: string
  company_name: string
  job_url: string | null
  job_description: string | null
  
  // Application details
  platform: string
  status: ApplicationStatus
  
  // Tracking
  applied_at: string | null
  last_updated_at: string
  
  // Custom materials
  custom_resume_url: string | null
  custom_cover_letter: string | null
  
  // Interview info
  interview_date: string | null
  interview_type: InterviewType | null
  interview_notes: string | null
  
  // Additional data
  metadata: Record<string, any>
  created_at: string
}

export type JobApplicationInsert = Omit<JobApplication, 'id' | 'created_at'>
export type JobApplicationUpdate = Partial<JobApplicationInsert>

// ============================================================================
// JOB HUNT ACTIVITY TYPES
// ============================================================================

export type ActivityType =
  | 'search_performed'
  | 'application_submitted'
  | 'resume_updated'
  | 'email_sent'
  | 'interview_detected'
  | 'status_updated'
  | 'error'

export type JobHuntActivity = {
  id: string
  profile_id: string
  application_id: string | null
  activity_type: ActivityType
  description: string
  details: Record<string, any>
  created_at: string
}

export type JobHuntActivityInsert = Omit<JobHuntActivity, 'id' | 'created_at'>

// ============================================================================
// JOB HUNT REPORT TYPES
// ============================================================================

export type ReportType =
  | 'daily_summary'
  | 'weekly_summary'
  | 'interview_alert'
  | 'screening_alert'
  | 'question_needed'
  | 'activity_update'

export type ReportStatus = 'pending' | 'sent' | 'failed'

export type JobHuntReport = {
  id: string
  profile_id: string
  report_type: ReportType
  subject: string
  content: string
  sent_at: string | null
  status: ReportStatus
  metadata: Record<string, any>
  created_at: string
}

export type JobHuntReportInsert = Omit<JobHuntReport, 'id' | 'created_at'>
export type JobHuntReportUpdate = Partial<Pick<JobHuntReport, 'sent_at' | 'status' | 'metadata'>>

// ============================================================================
// JOB HUNT CREDENTIALS TYPES
// ============================================================================

export type JobHuntCredentials = {
  id: string
  profile_id: string
  platform: string
  credentials_encrypted: string
  is_active: boolean
  last_used_at: string | null
  created_at: string
  updated_at: string
}

export type JobHuntCredentialsInsert = Omit<JobHuntCredentials, 'id' | 'created_at' | 'updated_at'>
export type JobHuntCredentialsUpdate = Partial<JobHuntCredentialsInsert>

// ============================================================================
// COMPOSITE TYPES
// ============================================================================

export type JobApplicationWithProfile = JobApplication & {
  profile: JobHuntProfile
}

export type JobHuntProfileWithApplications = JobHuntProfile & {
  applications: JobApplication[]
  activities: JobHuntActivity[]
  pending_questions: JobHuntQuestion[]
}

export type JobHuntDashboardStats = {
  total_applications: number
  pending: number
  applied: number
  interviews: number
  offers: number
  rejected: number
  last_activity: string | null
  active_platforms: string[]
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export type CreateJobHuntProfileRequest = {
  target_roles: string[]
  skills: string[]
  years_of_experience: number
  work_type: WorkType[]
  job_types: JobType[]
  target_locations?: string[]
  salary_min?: number
  salary_max?: number
  linkedin_profile?: string
  github_profile?: string
  portfolio_url?: string
}

export type UpdateJobHuntProfileRequest = Partial<CreateJobHuntProfileRequest>

export type UploadResumeRequest = {
  file: File
  extract_content?: boolean
}

export type UploadResumeResponse = {
  resume_url: string
  resume_filename: string
  resume_content?: string
  success: boolean
}

export type SubmitQuestionnaireRequest = {
  questions: Array<{
    question_key: string
    answer: string
  }>
}

export type CreateJobApplicationRequest = {
  job_title: string
  company_name: string
  job_url?: string
  job_description?: string
  platform: JobPlatform
  custom_cover_letter?: string
}

export type UpdateApplicationStatusRequest = {
  status: ApplicationStatus
  interview_date?: string
  interview_type?: InterviewType
  interview_notes?: string
}

export type SearchJobsRequest = {
  keywords: string[]
  location?: string
  platforms?: JobPlatform[]
  max_results?: number
}

export type SearchJobsResponse = {
  jobs: Array<{
    title: string
    company: string
    location: string
    url: string
    description: string
    platform: JobPlatform
    posted_date?: string
  }>
  total: number
}

export type GenerateReportRequest = {
  report_type: ReportType
  include_stats?: boolean
}

export type JobHuntAutomationConfig = {
  auto_apply: boolean
  auto_apply_limit_per_day: number
  auto_update_resume: boolean
  send_daily_report: boolean
  send_interview_alerts: boolean
  platforms_enabled: JobPlatform[]
  min_job_match_score: number
}
