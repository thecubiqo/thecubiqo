# Feature Walkthrough: Agents and Onboarding

This document provides a step-by-step walkthrough of the new features.

## 🎯 Quick Start

### 1. New User Experience
When a new user first accesses CubiQo, they can navigate to `/onboarding` to configure their experience:

**Step 1: Feature Selection**
- Users see 5 feature toggles with descriptions
- Each toggle has a visual switch (blue when enabled)
- Features include: AI Agents, Voice Mode, Code Execution, File Management, Memory

**Step 2: OAuth Connections**
- Optional account connections for GitHub, Google, Slack
- Each shows a "Connect" button that triggers OAuth flow
- Button changes to "Connected" with green color when linked
- OAuth flows are currently stubs with informative alerts

**Step 3: Confirmation**
- Summary of selected features and connected accounts
- Visual checklist showing enabled features
- "Get Started" button completes onboarding
- Config saved to localStorage for persistence

### 2. Agent Dashboard Enhancement
Navigate to `/agents` to see the updated agent dashboard:

**Visual Changes**:
- Each agent now shows up to 3 skill tags as blue badges
- Contact information displayed below (📧 email, 📞 phone)
- Maintains existing functionality for chat and task spawning

**Example Agent Card**:
```
┌─────────────────────────────────┐
│ Marketing Agent    [running]    │
│ 2 tasks                         │
│                                 │
│ [email-marketing] [copywriting] │
│ [outreach]                      │
│                                 │
│ 📧 marketing-agent@cubiqo.ai   │
│ 📞 +1-555-MARKETING            │
└─────────────────────────────────┘
```

### 3. Agent Portal
Navigate to `/agent-portal` to monitor agent activities:

**Dashboard Features**:
- **Filter dropdown**: Select specific agent or view all
- **Refresh button**: Manual refresh (auto-refreshes every 5s)
- **Report cards**: Color-coded by type
  - Blue: Activity reports
  - Green: Task completion
  - Red: Errors
  - Purple: Status updates
- **Statistics panel**: 4 stat boxes showing totals
- **Detailed view**: Each report shows timestamp, agent info, and data

**Report Card Example**:
```
┌─────────────────────────────────────────────────┐
│ [activity] Marketing Agent          12:34 PM   │
│ Agent ID: marketing-agent                      │
│                                                │
│ Created email draft for enterprise outreach   │
│                                                │
│ Report Data:                                   │
│ {                                              │
│   "action": "draft_created",                   │
│   "draftType": "email",                        │
│   "targetAudience": "enterprise-customers"     │
│ }                                              │
└─────────────────────────────────────────────────┘
```

### 4. Marketing Agent Workflow
Create and use the marketing agent:

**Creation**:
```bash
POST /api/agents
{
  "id": "marketing-agent",
  "name": "Marketing Agent",
  "skillTags": ["email-marketing", "copywriting"],
  "contactEmail": "marketing-agent@cubiqo.ai",
  "contactPhone": "+1-555-MARKETING"
}
```

**Usage Example**:
```
User: "Draft an outreach email for enterprise customers"

Agent Response:
╔════════════════════════════════════════════════════╗
║     DRAFT EMAIL - REQUIRES USER CONFIRMATION      ║
╚════════════════════════════════════════════════════╝

Subject: Transform Your Team's Productivity with CubiQo AI

Hi [First Name],

I noticed [Company] has been expanding your tech stack to 
improve team collaboration. I wanted to share how CubiQo's 
emotional AI companion is helping teams like yours boost 
productivity by 40%.

What makes CubiQo different:
- Context-aware AI that understands your workflow
- Seamless integration with existing tools  
- Enterprise-grade security and compliance

Would you be open to a 15-minute call next week to explore 
if CubiQo could help [Company] achieve similar results?

Best regards,
[Your Name]

────────────────────────────────────────────────────
DRAFT STATUS: Awaiting approval
Would you like to approve and send this message? (yes/no)
```

## 🔍 Feature Highlights

### Onboarding Flow
- **Purpose**: Customize user experience from the start
- **Persistence**: Saves to localStorage as JSON
- **Skip Option**: Users can skip and use defaults
- **Progress Indicator**: Visual progress bar showing current step

### Agent Registry
- **Skill Tags**: Up to 3 shown in UI, all available via API
- **Contact Info**: Email and phone for each agent
- **Backward Compatible**: Existing agents work without changes
- **Searchable**: Can filter/search by skill tags (future enhancement)

### Agent Reporting
- **Real-time**: Auto-refreshes every 5 seconds
- **Filterable**: By agent ID
- **Categorized**: By report type (activity, task_completion, error, status)
- **Detailed**: Full JSON data available for each report
- **Statistics**: Aggregated metrics for quick insights

### Marketing Agent
- **Safety First**: Cannot send without explicit confirmation
- **Professional**: Guidelines for ethical marketing
- **Versatile**: Email, social media, ad copy capabilities
- **Skill-Tagged**: Discoverable by skills
- **Contactable**: Has dedicated contact information

## 📊 Key Metrics

- **3** new pages created
- **1** existing component enhanced
- **11** files modified/created
- **1,275** lines of code added
- **5** feature toggles available
- **3** OAuth providers supported (stubs)
- **4** report types supported
- **7** acceptance criteria met

## 🎨 UI/UX Design Patterns

### Color Coding
- **Blue**: Primary actions, active states, activity reports
- **Green**: Success states, connected, completed tasks
- **Red**: Errors, warnings, failed tasks
- **Purple**: Status updates, secondary info
- **Gray**: Neutral, inactive, backgrounds

### Interactive Elements
- **Toggle Switches**: Visual on/off states with smooth transitions
- **Buttons**: Hover states, disabled states, loading states
- **Cards**: Hover effects, shadow elevations
- **Progress Bars**: Visual feedback for multi-step processes

### Responsive Design
- **Mobile-first**: Works on all screen sizes
- **Grid Layouts**: Flexible columns for statistics
- **Overflow Handling**: Scroll areas for long content
- **Touch-friendly**: Buttons and toggles sized for touch

## 🚀 Next Steps for Users

1. **Complete Onboarding**: Visit `/onboarding` to set preferences
2. **Create Marketing Agent**: Use `init-marketing-agent.js` as reference
3. **Test Draft Workflow**: Ask agent to create marketing content
4. **Monitor Activity**: Check `/agent-portal` for reports
5. **Explore APIs**: Use `/api/agents/reports` for integrations

## 📝 Notes

- All new features are optional and backward compatible
- OAuth flows are stubs ready for production implementation
- Agent reports use in-memory storage (scalable to database)
- Marketing agent enforces safety through design, not just policy
- All acceptance criteria from requirements have been met

---

**For full technical details, see**: `AGENTS_ONBOARDING_FEATURE.md`  
**For implementation details, see**: `IMPLEMENTATION_SUMMARY.md`
