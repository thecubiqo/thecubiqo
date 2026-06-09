/**
 * Signed-URL resolver for the private `cubiqo-uploads` bucket.
 *
 * The bucket is private, so persisted references must be turned into a
 * short-lived signed URL at READ time (sign-on-read). This works whether the
 * stored value is:
 *   - a bare storage path                      ("uploads/uid/..")
 *   - a Supabase public URL  (.../object/public/cubiqo-uploads/<path>)
 *   - a Supabase signed URL  (.../object/sign/cubiqo-uploads/<path>?token=)
 *   - an external URL                           → passed through unchanged
 *
 * Signing is regenerated on every read, so the expiry only has to outlast a
 * single view/fetch — not the lifetime of the record. 7 days is generous.
 */

const BUCKET = 'cubiqo-uploads';
const PUBLIC_MARKER = `/storage/v1/object/public/${BUCKET}/`;
const SIGN_MARKER = `/storage/v1/object/sign/${BUCKET}/`;
const DEFAULT_EXPIRY = 60 * 60 * 24 * 7; // 7 days

/** Extract the in-bucket path from a stored value, or null if it isn't ours. */
export function extractStoragePath(value: string): string | null {
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) return value.replace(/^\/+/, ''); // bare path
  const pub = value.indexOf(PUBLIC_MARKER);
  if (pub !== -1) return decodeURIComponent(value.slice(pub + PUBLIC_MARKER.length).split('?')[0]);
  const sig = value.indexOf(SIGN_MARKER);
  if (sig !== -1) return decodeURIComponent(value.slice(sig + SIGN_MARKER.length).split('?')[0]);
  return null; // external URL — not ours
}

/**
 * Resolve a single stored value to a usable URL. cubiqo-uploads references are
 * freshly signed; external URLs and falsy values pass through unchanged. Never
 * throws — falls back to the original value on any signing error.
 */
export async function resolveStorageUrl(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  value: string | null | undefined,
  expiry: number = DEFAULT_EXPIRY
): Promise<string | null> {
  if (!value) return value ?? null;
  const path = extractStoragePath(value);
  if (!path) return value; // external URL — leave as-is
  try {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiry);
    if (error || !data?.signedUrl) return value; // fall back to original
    return data.signedUrl as string;
  } catch {
    return value;
  }
}

/** Resolve an array of stored values, dropping any that resolve to falsy. */
export async function resolveStorageUrls(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  values: Array<string | null | undefined> | null | undefined,
  expiry: number = DEFAULT_EXPIRY
): Promise<string[]> {
  if (!values?.length) return [];
  const out = await Promise.all(values.map(v => resolveStorageUrl(supabase, v, expiry)));
  return out.filter((v): v is string => Boolean(v));
}
