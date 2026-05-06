type LegacyHandler = (req: Record<string, unknown>, res: LegacyResponse) => Promise<void> | void;

type LegacyResponse = {
  status: (code: number) => LegacyResponse;
  json: (data: unknown) => LegacyResponse;
  send: (data: unknown) => LegacyResponse;
  setHeader: (key: string, value: string) => void;
};

export async function runLegacyVercelHandler(
  handler: LegacyHandler,
  request: Request,
  method: string
) {
  const body = method === 'GET' ? undefined : await request.json().catch(() => ({}));
  let statusCode = 200;
  let payload: unknown = null;
  const headers = new Headers();

  const response: LegacyResponse = {
    status(code: number) {
      statusCode = code;
      return response;
    },
    json(data: unknown) {
      payload = data;
      return response;
    },
    send(data: unknown) {
      payload = data;
      return response;
    },
    setHeader(key: string, value: string) {
      headers.set(key, value);
    }
  };

  await handler({ method, body, headers: Object.fromEntries(request.headers.entries()) }, response);

  if (payload instanceof Response) return payload;
  if (typeof payload === 'string') {
    return new Response(payload, { status: statusCode, headers });
  }

  return Response.json(payload ?? {}, { status: statusCode, headers });
}
