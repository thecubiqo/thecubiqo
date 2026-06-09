import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser } from '../_lib/supabase-admin';
import { resolveStorageUrl } from '../_lib/storage-url';

export const runtime = 'nodejs';
export const maxDuration = 30;

const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'text/plain': 'txt',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
};

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json({ error: 'multipart/form-data required' }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Failed to parse form data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  const category = String(formData.get('category') || 'general').slice(0, 40);

  if (!file) return NextResponse.json({ error: 'file field required' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: `File exceeds 10 MB limit (${file.size} bytes)` }, { status: 413 });

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) return NextResponse.json({ error: `File type ${file.type} not allowed` }, { status: 415 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const storagePath = `uploads/${auth.user.id}/${category}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  const supabase = auth.supabase;

  // Upload to Supabase Storage (bucket: cubiqo-uploads, auto-created if missing)
  const { data: storageData, error: storageError } = await supabase.storage
    .from('cubiqo-uploads')
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false
    });

  if (storageError) {
    return NextResponse.json({ error: `Storage upload failed: ${storageError.message}` }, { status: 500 });
  }

  // Private bucket: store the PATH, generate a short-lived signed URL on read.
  const signedUrl = await resolveStorageUrl(supabase, storagePath);

  // Record in file_uploads table (public_url column kept = storage path for
  // back-compat with the schema; the usable URL is signed on read).
  const { data: record, error: dbError } = await supabase
    .from('file_uploads')
    .insert({
      user_id: auth.user.id,
      storage_path: storagePath,
      public_url: storagePath,
      filename: file.name,
      content_type: file.type,
      size_bytes: file.size,
      category
    })
    .select('id,storage_path,public_url,filename,content_type,size_bytes,category,created_at')
    .single();

  if (dbError) {
    // Storage upload succeeded even if DB record fails — return partial success
    return NextResponse.json({
      uploaded: true,
      storagePath,
      url: signedUrl,
      warning: 'File saved but DB record failed'
    });
  }

  return NextResponse.json({ uploaded: true, file: { ...record, url: signedUrl } });
}

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 50);

  let query = auth.supabase
    .from('file_uploads')
    .select('id,storage_path,public_url,filename,content_type,size_bytes,category,created_at')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sign each file's stored path/URL on read (private bucket).
  const files = await Promise.all(
    (data || []).map(async (row: Record<string, any>) => ({
      ...row,
      url: await resolveStorageUrl(auth.supabase, row.storage_path || row.public_url),
    }))
  );

  return NextResponse.json({ files });
}
