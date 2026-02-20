-- Job Hunt Mode: Complete schema for job hunting automation
-- Migration: 20260218000001_job_hunt_schema.sql

-- Job Hunt Profiles table - stores user's job hunting profile and preferences
CREATE TABLE IF NOT EXISTS job_hunt_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  
  -- Resume information
  resume_url TEXT,
  resume_filename TEXT,
  resume_content TEXT, -- Extracted text for AI processing
  
  -- Job preferences
  target_roles TEXT[] DEFAULT '{}',
  target_companies TEXT[] DEFAULT '{}',
  target_locations TEXT[] DEFAULT '{}',
  work_type TEXT[] DEFAULT '{}', -- remote, hybrid, onsite
  job_types TEXT[] DEFAULT '{}', -- full-time, part-time, contract
  salary_min INTEGER,
  salary_max INTEGER,
  
  -- Skills and experience
  skills TEXT[] DEFAULT '{}',
  years_of_experience INTEGER,
  
  -- Additional info
  cover_letter_template TEXT,
  linkedin_profile TEXT,
  portfolio_url TEXT,
  github_profile TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for user lookups
CREATE INDEX idx_job_hunt_profiles_user_id ON job_hunt_profiles(user_id);
CREATE INDEX idx_job_hunt_profiles_is_active ON job_hunt_profiles(is_active);

-- Job Hunt Questions table - stores questionnaire responses
CREATE TABLE IF NOT EXISTS job_hunt_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES job_hunt_profiles(id) ON DELETE CASCADE,
  
  question_key TEXT NOT NULL,
  question_text TEXT NOT NULL,
  answer TEXT,
  answer_type TEXT DEFAULT 'text' CHECK (answer_type IN ('text', 'multiple_choice', 'boolean', 'number')),
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(profile_id, question_key)
);

-- Index for question lookups
CREATE INDEX idx_job_hunt_questions_profile_id ON job_hunt_questions(profile_id);

-- Job Applications table - tracks all job applications
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES job_hunt_profiles(id) ON DELETE CASCADE,
  
  -- Job details
  job_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  job_url TEXT,
  job_description TEXT,
  
  -- Application details
  platform TEXT NOT NULL, -- linkedin, indeed, glassdoor, company_website, etc.
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'applied', 'screening', 'interview_scheduled', 
    'interview_completed', 'offer_received', 'rejected', 'withdrawn'
  )),
  
  -- Tracking
  applied_at TIMESTAMPTZ,
  last_updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Custom resume/cover letter for this application
  custom_resume_url TEXT,
  custom_cover_letter TEXT,
  
  -- Interview/screening info
  interview_date TIMESTAMPTZ,
  interview_type TEXT, -- phone, video, onsite
  interview_notes TEXT,
  
  -- Additional data
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for application lookups
CREATE INDEX idx_job_applications_profile_id ON job_applications(profile_id);
CREATE INDEX idx_job_applications_status ON job_applications(status);
CREATE INDEX idx_job_applications_platform ON job_applications(platform);
CREATE INDEX idx_job_applications_applied_at ON job_applications(applied_at);

-- Job Hunt Activity Log - tracks all automation activities
CREATE TABLE IF NOT EXISTS job_hunt_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES job_hunt_profiles(id) ON DELETE CASCADE,
  application_id UUID REFERENCES job_applications(id) ON DELETE SET NULL,
  
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'search_performed', 'application_submitted', 'resume_updated', 
    'email_sent', 'interview_detected', 'status_updated', 'error'
  )),
  
  description TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for activity lookups
CREATE INDEX idx_job_hunt_activities_profile_id ON job_hunt_activities(profile_id);
CREATE INDEX idx_job_hunt_activities_application_id ON job_hunt_activities(application_id);
CREATE INDEX idx_job_hunt_activities_created_at ON job_hunt_activities(created_at);

-- Job Hunt Email Reports - tracks email reports sent to users
CREATE TABLE IF NOT EXISTS job_hunt_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES job_hunt_profiles(id) ON DELETE CASCADE,
  
  report_type TEXT NOT NULL CHECK (report_type IN (
    'daily_summary', 'weekly_summary', 'interview_alert', 
    'screening_alert', 'question_needed', 'activity_update'
  )),
  
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for report lookups
CREATE INDEX idx_job_hunt_reports_profile_id ON job_hunt_reports(profile_id);
CREATE INDEX idx_job_hunt_reports_status ON job_hunt_reports(status);
CREATE INDEX idx_job_hunt_reports_sent_at ON job_hunt_reports(sent_at);

-- Job Hunt Platform Credentials - stores encrypted credentials for job platforms
CREATE TABLE IF NOT EXISTS job_hunt_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES job_hunt_profiles(id) ON DELETE CASCADE,
  
  platform TEXT NOT NULL,
  credentials_encrypted TEXT NOT NULL, -- Encrypted JSON with username/password/tokens
  
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(profile_id, platform)
);

-- Index for credential lookups
CREATE INDEX idx_job_hunt_credentials_profile_id ON job_hunt_credentials(profile_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_job_hunt_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trg_job_hunt_profiles_updated_at
  BEFORE UPDATE ON job_hunt_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_job_hunt_timestamp();

CREATE TRIGGER trg_job_hunt_questions_updated_at
  BEFORE UPDATE ON job_hunt_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_job_hunt_timestamp();

CREATE TRIGGER trg_job_hunt_credentials_updated_at
  BEFORE UPDATE ON job_hunt_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_job_hunt_timestamp();

-- RLS Policies
ALTER TABLE job_hunt_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_hunt_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_hunt_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_hunt_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_hunt_credentials ENABLE ROW LEVEL SECURITY;

-- Policies for job_hunt_profiles
CREATE POLICY job_hunt_profiles_select ON job_hunt_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY job_hunt_profiles_insert ON job_hunt_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY job_hunt_profiles_update ON job_hunt_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY job_hunt_profiles_delete ON job_hunt_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for job_hunt_questions
CREATE POLICY job_hunt_questions_select ON job_hunt_questions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM job_hunt_profiles WHERE id = profile_id AND user_id = auth.uid())
  );

CREATE POLICY job_hunt_questions_insert ON job_hunt_questions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM job_hunt_profiles WHERE id = profile_id AND user_id = auth.uid())
  );

CREATE POLICY job_hunt_questions_update ON job_hunt_questions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM job_hunt_profiles WHERE id = profile_id AND user_id = auth.uid())
  );

CREATE POLICY job_hunt_questions_delete ON job_hunt_questions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM job_hunt_profiles WHERE id = profile_id AND user_id = auth.uid())
  );

-- Policies for job_applications
CREATE POLICY job_applications_select ON job_applications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM job_hunt_profiles WHERE id = profile_id AND user_id = auth.uid())
  );

CREATE POLICY job_applications_insert ON job_applications
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM job_hunt_profiles WHERE id = profile_id AND user_id = auth.uid())
  );

CREATE POLICY job_applications_update ON job_applications
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM job_hunt_profiles WHERE id = profile_id AND user_id = auth.uid())
  );

CREATE POLICY job_applications_delete ON job_applications
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM job_hunt_profiles WHERE id = profile_id AND user_id = auth.uid())
  );

-- Policies for job_hunt_activities
CREATE POLICY job_hunt_activities_select ON job_hunt_activities
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM job_hunt_profiles WHERE id = profile_id AND user_id = auth.uid())
  );

CREATE POLICY job_hunt_activities_insert ON job_hunt_activities
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM job_hunt_profiles WHERE id = profile_id AND user_id = auth.uid())
  );

-- Policies for job_hunt_reports
CREATE POLICY job_hunt_reports_select ON job_hunt_reports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM job_hunt_profiles WHERE id = profile_id AND user_id = auth.uid())
  );

CREATE POLICY job_hunt_reports_insert ON job_hunt_reports
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM job_hunt_profiles WHERE id = profile_id AND user_id = auth.uid())
  );

-- Policies for job_hunt_credentials
CREATE POLICY job_hunt_credentials_select ON job_hunt_credentials
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM job_hunt_profiles WHERE id = profile_id AND user_id = auth.uid())
  );

CREATE POLICY job_hunt_credentials_insert ON job_hunt_credentials
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM job_hunt_profiles WHERE id = profile_id AND user_id = auth.uid())
  );

CREATE POLICY job_hunt_credentials_update ON job_hunt_credentials
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM job_hunt_profiles WHERE id = profile_id AND user_id = auth.uid())
  );

CREATE POLICY job_hunt_credentials_delete ON job_hunt_credentials
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM job_hunt_profiles WHERE id = profile_id AND user_id = auth.uid())
  );
