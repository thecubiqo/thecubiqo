export type V2CapabilityStatus = 'active' | 'locked' | 'read_only';

export type V2Capability = {
  actionType: string;
  toolName: string;
  label: string;
  category: string;
  status: V2CapabilityStatus;
  approvalRequired: boolean;
  approvalRequestable: boolean;
  endpoint: string | null;
  summary: string;
  requirements: string[];
  externalAction: boolean;
};

export const V2_CAPABILITIES: V2Capability[] = [
  {
    actionType: 'approval_request',
    toolName: 'approval_request',
    label: 'Approval request',
    category: 'Control Plane',
    status: 'active',
    approvalRequired: false,
    approvalRequestable: false,
    endpoint: '/api/actions/approvals',
    summary: 'Creates an approval card before any V2 write/action.',
    requirements: ['signed-in user', 'action summary', 'valid action type'],
    externalAction: false
  },
  {
    actionType: 'approval_status',
    toolName: 'approval_status',
    label: 'Approval status',
    category: 'Control Plane',
    status: 'active',
    approvalRequired: false,
    approvalRequestable: false,
    endpoint: '/api/actions/approvals',
    summary: 'Approves, denies, or cancels requested action cards.',
    requirements: ['signed-in user', 'requested approval owned by user'],
    externalAction: false
  },
  {
    actionType: 'action_audit_log',
    toolName: 'action_audit_log',
    label: 'Action audit log',
    category: 'Control Plane',
    status: 'active',
    approvalRequired: false,
    approvalRequestable: false,
    endpoint: '/api/actions/audit',
    summary: 'Reads user-owned audit history. Audit writes are server/trigger controlled.',
    requirements: ['signed-in user'],
    externalAction: false
  },
  {
    actionType: 'task_write',
    toolName: 'task_write',
    label: 'Task write',
    category: 'Personal Ops',
    status: 'active',
    approvalRequired: true,
    approvalRequestable: true,
    endpoint: '/api/tasks',
    summary: 'Creates or updates user-owned tasks after approval.',
    requirements: ['signed-in user', 'approved task_write approval'],
    externalAction: false
  },
  {
    actionType: 'cron_schedule_create',
    toolName: 'cron_schedule_create',
    label: 'In-app report schedule',
    category: 'Personal Ops',
    status: 'active',
    approvalRequired: true,
    approvalRequestable: true,
    endpoint: '/api/reports/schedules',
    summary: 'Creates in-app report schedules only. No email or external delivery.',
    requirements: ['signed-in user', 'approved cron_schedule_create approval'],
    externalAction: false
  },
  {
    actionType: 'daily_report_send',
    toolName: 'daily_report_send',
    label: 'Store daily report',
    category: 'Personal Ops',
    status: 'active',
    approvalRequired: true,
    approvalRequestable: true,
    endpoint: '/api/reports/daily',
    summary: 'Stores a daily report in-app. It does not send messages or email.',
    requirements: ['signed-in user', 'approved daily_report_send approval'],
    externalAction: false
  },
  {
    actionType: 'self_report_create',
    toolName: 'self_report_create',
    label: 'Create self-report',
    category: 'Ops',
    status: 'active',
    approvalRequired: true,
    approvalRequestable: true,
    endpoint: '/api/reports/daily',
    summary: 'Stores a truthful in-app self-report after approval.',
    requirements: ['signed-in user', 'approved self_report_create approval'],
    externalAction: false
  },
  {
    actionType: 'diagnostics_run',
    toolName: 'diagnostics_run',
    label: 'Diagnostics run',
    category: 'Ops',
    status: 'read_only',
    approvalRequired: false,
    approvalRequestable: false,
    endpoint: '/api/diagnostics',
    summary: 'Reads app/provider health and returns recommendations. It does not repair or mutate production.',
    requirements: ['server diagnostics endpoint'],
    externalAction: false
  },
  {
    actionType: 'browser_control',
    toolName: 'browser_control',
    label: 'Browser control container',
    category: 'Browser',
    status: 'active',
    approvalRequired: false,
    approvalRequestable: false,
    endpoint: '/api/actions/execute',
    summary: 'Creates the approved, audited, user-visible container for browser workflows. It does not run hidden automation.',
    requirements: ['signed-in user', 'approval card for each browser action', 'browser session audit trail'],
    externalAction: false
  },
  {
    actionType: 'browser_open',
    toolName: 'browser_open',
    label: 'Browser open',
    category: 'Browser',
    status: 'active',
    approvalRequired: true,
    approvalRequestable: true,
    endpoint: '/api/actions/execute',
    summary: 'Opens an isolated browser-control session container after explicit approval.',
    requirements: ['browser_control active', 'approved browser_open approval', 'http/https URL', 'session isolation'],
    externalAction: true
  },
  {
    actionType: 'browser_click',
    toolName: 'browser_click',
    label: 'Browser click',
    category: 'Browser',
    status: 'active',
    approvalRequired: true,
    approvalRequestable: true,
    endpoint: '/api/actions/execute',
    summary: 'Records an approved click inside an active isolated browser session container.',
    requirements: ['browser_control active', 'active browser_session_id', 'approved browser_click approval', 'audit log'],
    externalAction: true
  },
  {
    actionType: 'browser_type',
    toolName: 'browser_type',
    label: 'Browser type',
    category: 'Browser',
    status: 'active',
    approvalRequired: true,
    approvalRequestable: true,
    endpoint: '/api/actions/execute',
    summary: 'Records approved text entry intent after showing the data that would be typed.',
    requirements: ['browser_control active', 'active browser_session_id', 'field preview', 'approved browser_type approval'],
    externalAction: true
  },
  {
    actionType: 'browser_extract',
    toolName: 'browser_extract',
    label: 'Browser extract',
    category: 'Browser',
    status: 'active',
    approvalRequired: true,
    approvalRequestable: true,
    endpoint: '/api/actions/execute',
    summary: 'Records approved extraction intent with source/session tracking. No hidden page read occurs in this foundation.',
    requirements: ['browser_control active', 'active browser_session_id', 'approved browser_extract approval', 'source description'],
    externalAction: true
  },
  {
    actionType: 'browser_screenshot',
    toolName: 'browser_screenshot',
    label: 'Browser screenshot',
    category: 'Browser',
    status: 'active',
    approvalRequired: true,
    approvalRequestable: true,
    endpoint: '/api/actions/execute',
    summary: 'Records approved screenshot intent with session tracking. No image capture occurs until a visible runtime is attached.',
    requirements: ['browser_control active', 'active browser_session_id', 'approved browser_screenshot approval', 'retention controls'],
    externalAction: true
  },
  {
    actionType: 'browser_close',
    toolName: 'browser_close',
    label: 'Stop browser session',
    category: 'Browser',
    status: 'active',
    approvalRequired: false,
    approvalRequestable: false,
    endpoint: '/api/actions/execute',
    summary: 'Stops an active browser-control session using the session approval record and writes an audit entry.',
    requirements: ['active browser_session_id', 'session-owned approval record', 'audit log'],
    externalAction: false
  },
  {
    actionType: 'job_profile_write',
    toolName: 'job_profile_write',
    label: 'Job profile write',
    category: 'Job Hunt',
    status: 'locked',
    approvalRequired: true,
    approvalRequestable: false,
    endpoint: null,
    summary: 'Locked until job profile schema and resume/profile UX are end-to-end.',
    requirements: ['job profile schema', 'resume storage rules', 'approval card', 'audit log'],
    externalAction: false
  },
  {
    actionType: 'job_search_save',
    toolName: 'job_search_save',
    label: 'Job search save',
    category: 'Job Hunt',
    status: 'locked',
    approvalRequired: true,
    approvalRequestable: false,
    endpoint: null,
    summary: 'Locked until job source APIs/connectors and job tracker tables are ready.',
    requirements: ['job source API/provider choice', 'saved search schema', 'source timestamping'],
    externalAction: false
  },
  {
    actionType: 'job_application_prepare',
    toolName: 'job_application_prepare',
    label: 'Application prepare',
    category: 'Job Hunt',
    status: 'locked',
    approvalRequired: true,
    approvalRequestable: false,
    endpoint: null,
    summary: 'Locked until resume/profile data and application preview UI are built.',
    requirements: ['resume/profile context', 'job description source', 'field preview', 'approval card'],
    externalAction: false
  },
  {
    actionType: 'job_application_submit_approved',
    toolName: 'job_application_submit_approved',
    label: 'Submit job application',
    category: 'Job Hunt',
    status: 'locked',
    approvalRequired: true,
    approvalRequestable: false,
    endpoint: null,
    summary: 'Locked. CubiQo cannot apply to LinkedIn, Indeed, Dice, or employer sites until provider/browser workflows are ready.',
    requirements: ['job board/API review', 'visible browser fallback', 'data preview', 'user approval', 'submission audit'],
    externalAction: true
  },
  {
    actionType: 'resume_version_write',
    toolName: 'resume_version_write',
    label: 'Resume version write',
    category: 'Job Hunt',
    status: 'locked',
    approvalRequired: true,
    approvalRequestable: false,
    endpoint: null,
    summary: 'Locked until resume version storage and preview/edit UI are complete.',
    requirements: ['resume version schema', 'diff/preview UI', 'approval card'],
    externalAction: false
  },
  {
    actionType: 'pod_design_brief_create',
    toolName: 'pod_design_brief_create',
    label: 'POD design brief',
    category: 'Business/POD',
    status: 'locked',
    approvalRequired: true,
    approvalRequestable: false,
    endpoint: null,
    summary: 'Locked for persistence/execution. V1 can create in-session briefs only.',
    requirements: ['POD brief schema', 'brand/product context', 'approval card'],
    externalAction: false
  },
  {
    actionType: 'gfxtools_job_create',
    toolName: 'gfxtools_job_create',
    label: 'GFXTools job create',
    category: 'Business/POD',
    status: 'locked',
    approvalRequired: true,
    approvalRequestable: false,
    endpoint: null,
    summary: 'Locked until GFXTools API credentials, payload schema, and approval UI are available.',
    requirements: ['GFXTools API key', 'server-side token storage', 'payload preview', 'approval card'],
    externalAction: true
  },
  {
    actionType: 'shopify_connector_status',
    toolName: 'shopify_connector_status',
    label: 'Shopify status',
    category: 'Business/POD',
    status: 'read_only',
    approvalRequired: false,
    approvalRequestable: false,
    endpoint: '/api/actions/capabilities',
    summary: 'Read-only status only. No fake connected state and no store mutation.',
    requirements: ['secure token storage before live connection'],
    externalAction: false
  },
  {
    actionType: 'printify_connector_status',
    toolName: 'printify_connector_status',
    label: 'Printify status',
    category: 'Business/POD',
    status: 'read_only',
    approvalRequired: false,
    approvalRequestable: false,
    endpoint: '/api/actions/capabilities',
    summary: 'Read-only status only. No fake connected state and no product mutation.',
    requirements: ['secure token storage before live connection'],
    externalAction: false
  },
  {
    actionType: 'social_post_prepare',
    toolName: 'social_post_prepare',
    label: 'Social post prepare',
    category: 'Social/Affiliate',
    status: 'locked',
    approvalRequired: true,
    approvalRequestable: false,
    endpoint: null,
    summary: 'Locked for persistence/execution. V1 can draft in-session content only.',
    requirements: ['campaign schema', 'platform rules', 'approval card'],
    externalAction: false
  },
  {
    actionType: 'social_post_schedule_approved',
    toolName: 'social_post_schedule_approved',
    label: 'Schedule social post',
    category: 'Social/Affiliate',
    status: 'locked',
    approvalRequired: true,
    approvalRequestable: false,
    endpoint: null,
    summary: 'Locked until platform APIs or approved browser fallback are integrated.',
    requirements: ['platform connector', 'account connection', 'post preview', 'approval card', 'audit log'],
    externalAction: true
  },
  {
    actionType: 'camera_permission_check',
    toolName: 'camera_permission_check',
    label: 'Camera permission check',
    category: 'Sensors/Auth',
    status: 'read_only',
    approvalRequired: false,
    approvalRequestable: false,
    endpoint: '/api/actions/capabilities',
    summary: 'Permission state must remain browser/platform controlled. No camera read occurs here.',
    requirements: ['browser permission prompt before any camera context'],
    externalAction: false
  },
  {
    actionType: 'camera_context_read',
    toolName: 'camera_context_read',
    label: 'Camera context read',
    category: 'Sensors/Auth',
    status: 'locked',
    approvalRequired: true,
    approvalRequestable: false,
    endpoint: null,
    summary: 'Locked until explicit camera permission, visible sensor indicator, and retention controls exist.',
    requirements: ['camera permission UI', 'active sensor indicator', 'session-only mode', 'retention controls'],
    externalAction: true
  },
  {
    actionType: 'coder_write_approved',
    toolName: 'coder_write_approved',
    label: 'Coder write approved',
    category: 'Coder/Studio',
    status: 'locked',
    approvalRequired: true,
    approvalRequestable: false,
    endpoint: null,
    summary: 'Locked until managed sandbox/API execution replaces custom raw terminal access.',
    requirements: ['managed sandbox/API', 'patch preview', 'allowlisted commands', 'approval card', 'audit log'],
    externalAction: true
  }
];

export const ACTION_TYPES = V2_CAPABILITIES.map(capability => capability.actionType) as string[];

export const FOUNDATION_ACTION_TYPES = V2_CAPABILITIES
  .filter(capability => capability.status === 'active' && capability.approvalRequestable)
  .map(capability => capability.actionType) as string[];

export function getActionCapability(actionType: string | null | undefined) {
  return V2_CAPABILITIES.find(capability => capability.actionType === actionType) || null;
}

export function isApprovalRequestable(actionType: string) {
  return Boolean(getActionCapability(actionType)?.approvalRequestable);
}
