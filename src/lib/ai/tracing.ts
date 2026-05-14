export interface TraceContext {
  traceId: string;
  projectId?: string;
  taskId?: string;
  userId?: string;
}

/**
 * Creates a new trace context.
 */
export function createTrace(userId?: string, projectId?: string): TraceContext {
  return {
    traceId: crypto.randomUUID(),
    projectId,
    userId
  };
}

/**
 * Attaches a task to an existing trace context.
 */
export function withTask(context: TraceContext, taskId: string): TraceContext {
  return {
    ...context,
    taskId
  };
}

/**
 * Formats metadata for Supabase jsonb columns, ensuring trace_id is present.
 */
export function traceMetadata(context: TraceContext, additional: Record<string, any> = {}) {
  return {
    ...additional,
    trace_id: context.traceId,
    project_id: context.projectId,
    task_id: context.taskId,
    timestamp: new Date().toISOString()
  };
}
