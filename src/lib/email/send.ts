/**
 * Thin email sender — uses Resend REST API (no SDK dep).
 * Falls back to a console log in dev when RESEND_API_KEY is not set.
 *
 * FROM address is always "CubiQo <noreply@cubiqo.ai>" for transactional,
 * or "CubiQo Reports <reports@cubiqo.ai>" for system digests.
 */

const RESEND_API = 'https://api.resend.com/emails';
const FROM_TRANSACTIONAL = 'CubiQo <noreply@cubiqo.ai>';
const FROM_REPORTS = 'CubiQo Reports <reports@cubiqo.ai>';

export type SendEmailOptions = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
};

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
  const key = process.env.RESEND_API_KEY;

  if (!key) {
    // Dev-only fallback — log subject only, never recipient addresses (PII).
    if (process.env.NODE_ENV !== 'production') {
      console.log('[email:dev]', { subject: opts.subject });
    }
    return { ok: true, id: 'dev-noop' };
  }

  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: opts.from ?? FROM_TRANSACTIONAL,
        to: Array.isArray(opts.to) ? opts.to : [opts.to],
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
        reply_to: opts.replyTo,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.message ?? `Resend error ${res.status}` };
    }
    return { ok: true, id: data.id ?? 'unknown' };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Send a system report / digest email — uses reports@ from address */
export function sendReportEmail(opts: Omit<SendEmailOptions, 'from'>) {
  return sendEmail({ ...opts, from: FROM_REPORTS });
}

// ── HTML template helpers ────────────────────────────────────────────────────
export function reportHtml(title: string, sections: { heading: string; body: string }[]): string {
  const rows = sections.map(s => `
    <tr>
      <td style="padding:16px 0;border-bottom:1px solid #1e293b;">
        <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#64748b;">${s.heading}</p>
        <p style="margin:0;font-size:14px;color:#e2e8f0;white-space:pre-wrap;">${s.body}</p>
      </td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html>
<body style="background:#050510;font-family:system-ui,sans-serif;margin:0;padding:24px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr>
      <td style="padding-bottom:24px;border-bottom:1px solid #1e293b;">
        <p style="margin:0;font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:#64748b;">CubiQo System</p>
        <h1 style="margin:4px 0 0;font-size:20px;color:#f8fafc;">${title}</h1>
      </td>
    </tr>
    ${rows}
    <tr>
      <td style="padding-top:20px;">
        <p style="margin:0;font-size:11px;color:#334155;">
          Sent automatically by CubiQo self-reporting.<br>
          <a href="https://cubiqo.ai/admin" style="color:#67e8f9;">Open admin dashboard →</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
