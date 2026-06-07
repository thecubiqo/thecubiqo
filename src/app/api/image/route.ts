export const maxDuration = 60;
export const runtime = 'nodejs';

const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY!;
const RUNPOD_ENDPOINT_ID = process.env.RUNPOD_ENDPOINT_ID!;

// POST /api/image
// body: { mode: 'edit'|'generate', prompt: string, imageBase64?: string, maskBase64?: string, negativePrompt?: string }
export async function POST(request: Request) {
  if (!RUNPOD_API_KEY || !RUNPOD_ENDPOINT_ID) {
    return Response.json({ error: 'Image service not configured.' }, { status: 503 });
  }

  const { mode = 'generate', prompt, imageBase64, maskBase64, negativePrompt = 'bad quality, blurry, watermark, text, ugly, deformed' } = await request.json();
  if (!prompt) return Response.json({ error: 'prompt is required' }, { status: 400 });

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
    `https://api.runpod.io/v2/${RUNPOD_ENDPOINT_ID}/run`,
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
      `https://api.runpod.io/v2/${RUNPOD_ENDPOINT_ID}/status/${jobId}`,
      { headers: { Authorization: `Bearer ${RUNPOD_API_KEY}` } }
    );
    const status = await statusRes.json();

    if (status.status === 'COMPLETED') {
      // A1111 returns images as base64 array
      const imageBase64Out = status.output?.images?.[0] || status.output?.image;
      return Response.json({ imageBase64: imageBase64Out, jobId, mode });
    }
    if (status.status === 'FAILED') {
      return Response.json({ error: 'Generation failed', detail: status.error }, { status: 500 });
    }
  }

  return Response.json({ error: 'Timed out', jobId }, { status: 504 });
}
