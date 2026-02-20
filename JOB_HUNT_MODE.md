# Job Hunt Mode - Documentation

## Overview

Job Hunt Mode is an automated job application tracking and management system integrated into CubiQo. It helps users streamline their job search by:

- **Resume Management**: Upload and manage resumes
- **Job Application Tracking**: Track applications across multiple platforms
- **Automated Reports**: Receive email summaries and alerts
- **Profile Management**: Customize job preferences and requirements
- **Activity Logging**: Monitor all job hunting activities

## Features

### 1. Job Hunt Profile
Users can create a comprehensive profile including:
- Target job roles
- Skills and experience
- Work type preferences (remote, hybrid, onsite)
- Job type preferences (full-time, part-time, contract, internship)
- Preferred locations
- Salary range
- LinkedIn, GitHub, and portfolio URLs

### 2. Resume Management
- Upload resumes in PDF, DOC, DOCX, or TXT format
- Automatic resume storage in Supabase Storage
- Resume content extraction for AI processing
- Version tracking

### 3. Application Tracking
Track applications with:
- Job title and company
- Platform (LinkedIn, Indeed, Glassdoor, etc.)
- Application status (pending, applied, screening, interview, offer, rejected)
- Interview scheduling
- Custom cover letters
- Application notes

### 4. Activity Monitoring
All activities are logged:
- Profile creation/updates
- Resume uploads
- Applications submitted
- Status changes
- Email reports sent

### 5. Email Reports
Automated email reports including:
- Daily summaries
- Weekly summaries
- Interview alerts
- Screening alerts
- Activity updates

## Database Schema

### Tables

1. **job_hunt_profiles**
   - Stores user job hunting profiles
   - Links to auth users
   - Contains preferences and target criteria

2. **job_applications**
   - Tracks individual job applications
   - Status tracking and interview scheduling
   - Links to job_hunt_profiles

3. **job_hunt_questions**
   - Stores questionnaire responses
   - Helps customize job search

4. **job_hunt_activities**
   - Logs all job hunting activities
   - Provides audit trail

5. **job_hunt_reports**
   - Tracks email reports sent to users
   - Report history and status

6. **job_hunt_credentials**
   - Stores encrypted platform credentials (future use)
   - For automation purposes

## API Routes

### Profile Management
- `GET /api/job-hunt/profile` - Get user's profile
- `POST /api/job-hunt/profile` - Create new profile
- `PATCH /api/job-hunt/profile` - Update profile
- `DELETE /api/job-hunt/profile` - Delete profile

### Resume Management
- `POST /api/job-hunt/resume` - Upload resume file

### Questions
- `GET /api/job-hunt/questions` - Get questionnaire
- `POST /api/job-hunt/questions` - Submit answers

### Applications
- `GET /api/job-hunt/applications` - List applications
- `POST /api/job-hunt/applications` - Create new application
- `PATCH /api/job-hunt/applications` - Update application status

### Dashboard
- `GET /api/job-hunt/dashboard` - Get dashboard stats and data

### Reports
- `GET /api/job-hunt/reports` - Get report history
- `POST /api/job-hunt/reports` - Generate new report

## UI Pages

### 1. `/job-hunt`
Main dashboard showing:
- Application statistics
- Profile summary
- Recent activity
- Quick actions

### 2. `/job-hunt/setup`
Profile setup page where users:
- Define target roles
- Add skills
- Set work preferences
- Configure job search criteria

## User Flow

1. **Initial Setup**
   - User navigates to `/job-hunt`
   - If no profile exists, shown welcome screen
   - Click "Get Started" → redirects to `/job-hunt/setup`
   - Fill out profile information
   - Submit to create profile

2. **Dashboard Usage**
   - View application statistics
   - See recent activities
   - Access quick actions:
     - Add new application
     - Refresh data
     - View reports

3. **Application Management**
   - Manually add applications
   - Track status updates
   - Schedule interviews
   - Add notes

4. **Reports**
   - Generate on-demand reports
   - Receive automated daily/weekly summaries
   - Get interview alerts

## Security

- **Row Level Security (RLS)**: All tables have RLS policies
- **Authentication Required**: All routes require authentication
- **Data Isolation**: Users can only access their own data
- **Encrypted Credentials**: Platform credentials stored with AES-256-GCM encryption

## Future Enhancements

### Phase 4: Background Automation
- [ ] Automated job search across platforms
- [ ] Auto-apply to matching jobs
- [ ] Resume auto-optimization based on job descriptions
- [ ] Email inbox monitoring for interview invites

### Phase 5: Advanced Features
- [ ] AI-powered job matching
- [ ] Interview preparation tools
- [ ] Salary negotiation assistance
- [ ] Career path recommendations

## Technical Implementation

### Technologies Used
- **Frontend**: Next.js 16, React 19, TypeScript
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS

### Type Safety
All entities are fully typed using TypeScript:
```typescript
import type { 
  JobHuntProfile, 
  JobApplication, 
  JobHuntDashboardStats 
} from '@/types/job-hunt'
```

### Error Handling
- API routes return appropriate HTTP status codes
- User-friendly error messages in UI
- Activity logging for debugging

## Testing

### Manual Testing Checklist
- [ ] Create job hunt profile
- [ ] Upload resume
- [ ] Add job application
- [ ] Update application status
- [ ] Generate report
- [ ] View dashboard statistics
- [ ] Edit profile settings

### API Testing
Use tools like Postman or curl to test API endpoints:

```bash
# Get profile
curl -X GET http://localhost:3000/api/job-hunt/profile \
  -H "Cookie: your-auth-cookie"

# Create profile
curl -X POST http://localhost:3000/api/job-hunt/profile \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "target_roles": ["Software Engineer"],
    "skills": ["React", "TypeScript"],
    "work_type": ["remote"],
    "job_types": ["full-time"],
    "years_of_experience": 5
  }'
```

## Deployment

### Database Migration
Run the migration to create required tables:
```sql
-- Run: supabase/migrations/20260218000001_job_hunt_schema.sql
```

### Environment Variables
No additional environment variables required. Uses existing Supabase configuration.

### Supabase Storage
Create a storage bucket named `job-hunt-resumes`:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('job-hunt-resumes', 'job-hunt-resumes', true);
```

## Support

For issues or questions:
1. Check the codebase documentation
2. Review API route implementations
3. Check database schema
4. Open an issue on GitHub

## License

Part of the CubiQo project - MIT License
