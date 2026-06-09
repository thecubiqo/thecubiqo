export type ApiOk<T extends Record<string, unknown> = Record<string, unknown>> = T & { ok?: true };

export type ApiError = {
  error: string;
  code?: string;
  issues?: unknown;
  migrationPending?: boolean;
};

export type ApiResult<T extends Record<string, unknown> = Record<string, unknown>> = ApiOk<T> | ApiError;
