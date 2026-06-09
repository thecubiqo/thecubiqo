/**
 * CubiQo outbound SMS — Twilio REST API (no SDK dep).
 *
 * CubiQo's number: process.env.TWILIO_FROM_NUMBER  (e.g. +14155552671)
 * This is the number users will see "CubiQo" texting from.
 *
 * For WhatsApp: set TWILIO_FROM_NUMBER to "whatsapp:+14155552671"
 * and the user's phone becomes "whatsapp:+447..."
 */

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM = process.env.TWILIO_FROM_NUMBER; // CubiQo's number

export type SmsResult =
  | { ok: true; sid: string }
  | { ok: false; error: string };

export async function sendSms(to: string, body: string): Promise<SmsResult> {
  if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) {
    // In production a missing credential must surface as a REAL failure — never a
    // silent "success" that drops the message. No-op only in non-prod (local dev).
    if (process.env.NODE_ENV === 'production') {
      console.error('[sms] Twilio not configured — message NOT sent');
      return { ok: false, error: 'SMS/WhatsApp provider not configured' };
    }
    // Dev-only, masked: never log full phone numbers or message bodies (PII).
    console.log('[sms:dev]', { to: to.length > 4 ? `***${to.slice(-4)}` : '***' });
    return { ok: true, sid: 'dev-noop' };
  }

  // Twilio REST API — basic auth with SID:token
  const credentials = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64');

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ From: TWILIO_FROM, To: to, Body: body.slice(0, 1600) }),
      }
    );
    const data = await res.json();
    if (!res.ok || data.error_code) {
      return { ok: false, error: data.message ?? `Twilio error ${res.status}` };
    }
    return { ok: true, sid: data.sid };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Send via WhatsApp (Twilio WhatsApp sandbox or Business number) */
export function sendWhatsApp(to: string, body: string): Promise<SmsResult> {
  const waTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  // TWILIO_FROM_NUMBER must be set to "whatsapp:+18662414026" in Vercel env
  return sendSms(waTo, body);
}

/**
 * Unified send — routes to WhatsApp or SMS based on channel setting.
 * channel: 'whatsapp' | 'sms' | 'both' | 'email'
 */
export function sendByChannel(channel: string, phone: string, body: string): Promise<SmsResult> {
  if (channel === 'whatsapp') return sendWhatsApp(phone, body);
  return sendSms(phone, body);
}
