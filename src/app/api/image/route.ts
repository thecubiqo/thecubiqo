export const maxDuration = 60;
export const runtime = 'nodejs';

const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY!;
const RUNPOD_ENDPOINT_ID = process.env.RUNPOD_ENDPOINT_ID!; // set after ComfyUI endpoint is created

// POST /api/image
// body: { mode: 'edit' | 'generate', prompt: string, imageBase64?: string, maskBase64?: string }
export async function POST(request: Request) {
  if (!RUNPOD_API_KEY || !RUNPOD_ENDPOINT_ID) {
    return Response.json(
      { error: 'Image service not configured. Add RUNPOD_API_KEY and RUNPOD_ENDPOINT_ID to env vars.' },
      { status: 503 }
    );
  }

  const { mode = 'generate', prompt, imageBase64, maskBase64 } = await request.json();

  if (!prompt) return Response.json({ error: 'prompt is required' }, { status: 400 });
  if (mode === 'edit' && !imageBase64) return Response.json({ error: 'imageBase64 required for edit mode' }, { status: 400 });

  // Build ComfyUI workflow input
  const workflowInput =
    mode === 'edit'
      ? {
          workflow: 'inpaint',
          prompt,
          image: imageBase64,
          mask: maskBase64 || null,
          model: 'pony_diffusion_xl',
          steps: 30,
          cfg: 7,
          use_ip_adapter: true,      // preserves likeness
          use_adetailer: true,        // fixes faces
          upscale: true,
        }
      : {
          workflow: 'txt2img',
          prompt,
          model: 'pony_diffusion_xl',
          steps: 30,
          cfg: 7,
          width: 1024,
          height: 1024,
          use_adetailer: true,
          upscale: true,
        };

  // Submit job to RunPod serverless endpoint
  const submitRes = await fetch(`https://api.runpod.io/v2/${RUNPOD_ENDPOINT_ID}/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RUNPOD_API_KEY}`,
    },
    body: JSON.stringify({ input: workflowInput }),
  });

  if (!submitRes.ok) {
    const err = await submitRes.text();
    return Response.json({ error: `RunPod submit failed: ${err}` }, { status: 502 });
  }

  const { id: jobId } = await submitRes.json();

  // Poll for result (max 55s to stay within maxDuration)
  const deadline = Date.now() + 55_000;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 2000));

    const statusRes = await fetch(`https://api.runpod.io/v2/${RUNPOD_ENDPOINT_ID}/status/${jobId}`, {
      headers: { Authorization: `Bearer ${RUNPOD_API_KEY}` },
    });
    const status = await statusRes.json();

    if (status.status === 'COMPLETED') {
      return Response.json({ imageBase64: status.output?.image, jobId });
    }
    if (status.status === 'FAILED') {
      return Response.json({ error: 'Image generation failed', detail: status.error }, { status: 500 });
    }
  }

  return Response.json({ error: 'Timed out waiting for image', jobId }, { status: 504 });
}
