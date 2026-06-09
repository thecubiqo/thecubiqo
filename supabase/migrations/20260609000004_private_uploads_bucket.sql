-- ─────────────────────────────────────────────────────────────────────────────
-- Make the cubiqo-uploads Storage bucket PRIVATE.
--
-- The app now signs every cubiqo-uploads reference on read (sign-on-read via
-- src/app/api/_lib/storage-url.ts), and stores storage PATHS (not public URLs)
-- for new uploads/screenshots/media. Signed URLs work regardless of bucket
-- privacy, and the read helper extracts the path from any legacy public URL, so
-- existing rows keep working once the bucket is private.
--
-- ORDER OF OPERATIONS: apply this ONLY after the sign-on-read code is deployed,
-- otherwise the previously-deployed code (which returned getPublicUrl links)
-- would serve URLs that 404 against a now-private bucket.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('cubiqo-uploads', 'cubiqo-uploads', false)
ON CONFLICT (id) DO UPDATE SET public = false;
