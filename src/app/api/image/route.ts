import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;
export const runtime = 'nodejs';

const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY!;
const RUNPOD_ENDPOINT_ID = process.env.RUNPOD_ENDPOINT_ID!;

// Verify the request comes from an authenticated CubiQo user.
// Images contain personal/explicit content — we must never process
// photos from unauthenticated callers.
async function getAuthenticatedUserId(authHeader: string | null): Promise<string | null> {
  if (!authHeader) return null;
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabase.auth.getUser(token);
    return data?.user?.id ?? null;
  } catch {
    return null;
  }
}

// POST /api/image
// Headers: Authorization: Bearer <supabase-jwt>   (required — auth-gated)
// Body: { mode: 'edit'|'generate', prompt: string, imageBase64?: string, maskBase64?: string, negativePrompt?: string }
//
// Privacy guarantee:
//   - Images are never stored in CubiQo's database or file storage
//   - The raw base64 is forwarded to RunPod's serverless GPU (HTTPS only) for processing
//   - RunPod auto-deletes job data after ~1 hour per their data retention policy
//   - Only authenticated users may submit images
export async function POST(request: Request) {
  if (!RUNPOD_API_KEY || !RUNPOD_ENDPOINT_ID) {
    return Response.json({ error: 'Image service not configured.' }, { status: 503 });
  }

  // ── Auth gate ────────────────────────────────────────────────────────────────
  const userId = await getAuthenticatedUserId(request.headers.get('authorization'));
  if (!userId) {
    return Response.json(
      { error: 'Authentication required. Images are only processed for signed-in users.' },
      { status: 401 }
    );
  }

  const {
    mode = 'generate',
    prompt,
    imageBase64,
    maskBase64,
    negativePrompt = 'bad quality, blurry, watermark, text, ugly, deformed',
  } = await request.json();

  if (!prompt) return Response.json({ error: 'prompt is required' }, { status: 400 });

  // Enforce reasonable size limit — base64 of a 10 MB image ≈ 13.3 MB string
  if (imageBase64 && imageBase64.length > 14_000_000) {
    return Response.json({ error: 'Image too large. Please use an image under 10 MB.' }, { status: 413 });
  }

  // A1111 API format — same shape for txt2img and img2img/inpaint
  const input =
    mode === 'edit' && imageBase64
      ? {
          // img2img inpainting
          prompt,
          negative_prompt: negativePrompt,
          init_images: [imageBase64],
          mask: maskBase64 || null,
          inpainting_fill: 1,
          inpaint_full_res: true,
          denoising_strength: 0.75,
          width: 1024,
          height: 1024,
          num_inference_steps: 30,
          guidance_scale: 7.5,
          sampler_name: 'DPM++ 2M Karras',
          seed: -1,
        }
      : {
          // txt2img
          prompt,
          negative_prompt: negativePrompt,
          width: 1024,
          height: 1024,
          num_inference_steps: 30,
          guidance_scale: 7.5,
          sampler_name: 'DPM++ 2M Karras',
          seed: -1,
        };

  const submitRes = await fetch(
    `https://api.runpod.ai/v2/${RUNPOD_ENDPOINT_ID}/run`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RUNPOD_API_KEY}`,
      },
      body: JSON.stringify({ input }),
    }
  );

  if (!submitRes.ok) {
    return Response.json({ error: `RunPod submit failed: ${await submitRes.text()}` }, { status: 502 });
  }

  const { id: jobId } = await submitRes.json();
  const deadline = Date.now() + 55_000;

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 2500));
    const statusRes = await fetch(
      `https://api.runpod.ai/v2/${RUNPOD_ENDPOINT_ID}/status/${jobId}`,
      { headers: { Authorization: `Bearer ${RUNPOD_API_KEY}` } }
    );
    const status = await statusRes.json();

    if (status.status === 'COMPLETED') {
      const imageBase64Out = status.output?.images?.[0] || status.output?.image;
      return Response.json({
        imageBase64: imageBase64Out,
        jobId,
        mode,
        // Remind the client: the original photo was never stored by CubiQo
        privacy: 'Image processed in-flight only. Not stored by CubiQo.',
      });
    }
    if (status.status === 'FAILED') {
      return Response.json({ error: 'Generation failed', detail: status.error }, { status: 500 });
    }
  }

  return Response.json({ error: 'Timed out', jobId }, { status: 504 });
}
