import { fal } from '@fal-ai/client';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

fal.config({ credentials: process.env.FAL_KEY });

// True img2img model — preserves building/room structure, transforms style
export const IMAGE_MODEL = 'fal-ai/flux/dev/image-to-image';

// Video generation models
const VIDEO_MODELS = {
  kling: 'fal-ai/kling-video/v1.6/pro/image-to-video',
  seedance: 'fal-ai/minimax/video-01-live',
};

// ── Serve an image buffer from Railway and return its public URL ──────────────
const serveFromRailway = async (buffer, suffix = 'image') => {
  const { tempImageStore } = await import('../index.js');
  const id = randomUUID();
  // Store as a single-entry object keyed by suffix
  const existing = tempImageStore.get(id) || {};
  existing[suffix] = buffer;
  tempImageStore.set(id, existing);
  setTimeout(() => tempImageStore.delete(id), 15 * 60 * 1000);
  const BASE_URL = process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : `http://localhost:${process.env.PORT || 3001}`;
  return `${BASE_URL}/temp/${id}/${suffix}`;
};

// ── Upload a base64 data URL — serves from Railway, no fal.ai storage ────────
export const uploadImage = async (imageDataUrl) => {
  const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  // Resize to max 1920px to keep it lean
  const resized = await sharp(buffer).resize({ width: 1920, withoutEnlargement: true }).jpeg({ quality: 90 }).toBuffer();
  return serveFromRailway(resized, 'original');
};

// ── Convert image to 16:9 using blurred background — instant, no AI ──────────
// Scales the original to fill a 16:9 canvas, blurs it as background,
// then composites the original centered on top. Runs in < 1 second.
export const convertTo16x9 = async (imageDataUrl) => {
  const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
  const inputBuffer = Buffer.from(base64Data, 'base64');

  const resized = await sharp(inputBuffer)
    .resize({ width: 1920, withoutEnlargement: true })
    .jpeg({ quality: 90 })
    .toBuffer();

  const { width: origW, height: origH } = await sharp(resized).metadata();

  // Compute 16:9 canvas size
  let targetW, targetH;
  if (origW / origH >= 16 / 9) {
    targetW = origW;
    targetH = Math.round(origW * 9 / 16);
  } else {
    targetW = Math.round(origH * 16 / 9);
    targetH = origH;
  }

  const left = Math.floor((targetW - origW) / 2);
  const top = Math.floor((targetH - origH) / 2);

  // Background: fill canvas by scaling original, then blur heavily
  const bgBuffer = await sharp(resized)
    .resize(targetW, targetH, { fit: 'cover' })
    .blur(25)
    .jpeg({ quality: 80 })
    .toBuffer();

  // Composite original centered on blurred background
  const result = await sharp(bgBuffer)
    .composite([{ input: resized, left, top }])
    .jpeg({ quality: 90 })
    .toBuffer();

  return serveFromRailway(result, 'converted');
};

// ── Submit a single image-to-image job ──────────────────────────────────────
export const submitImageJob = async (imageUrl, prompt) => {
  const { request_id } = await fal.queue.submit(IMAGE_MODEL, {
    input: {
      image_url: imageUrl,
      prompt,
      strength: 0.85,         // 0=keep original exactly, 1=ignore original fully
      num_inference_steps: 28,
      guidance_scale: 3.5,
      num_images: 1,
      enable_safety_checker: false,
    },
  });
  return request_id;
};


// ── Submit 2 image jobs in parallel ─────────────────────────────────────────
export const submitTwoParallelImageJobs = async (imageUrl, prompt) => {
  const [id1, id2] = await Promise.all([
    submitImageJob(imageUrl, prompt),
    submitImageJob(imageUrl, prompt),
  ]);
  return [id1, id2];
};

// ── Submit a single video job ────────────────────────────────────────────────
export const submitVideoJob = async (imageUrl, prompt, videoModel = 'kling', durationSeconds = 5) => {
  const model = VIDEO_MODELS[videoModel] || VIDEO_MODELS.kling;
  const { request_id } = await fal.queue.submit(model, {
    input: {
      image_url: imageUrl,
      prompt,
      duration: durationSeconds,   // numeric, not string
      aspect_ratio: '16:9',
    },
  });
  return request_id;
};

// ── Submit 2 video jobs in parallel ─────────────────────────────────────────
export const submitTwoParallelVideoJobs = async (imageUrl, prompt, videoModel = 'kling', durationSeconds = 5) => {
  const [id1, id2] = await Promise.all([
    submitVideoJob(imageUrl, prompt, videoModel, durationSeconds),
    submitVideoJob(imageUrl, prompt, videoModel, durationSeconds),
  ]);
  return [id1, id2];
};

// ── Check job status ─────────────────────────────────────────────────────────
export const getJobStatus = async (requestId, modelId = IMAGE_MODEL) => {
  try {
    const status = await fal.queue.status(modelId, { requestId, logs: false });

    if (status.status === 'COMPLETED') {
      const result = await fal.queue.result(modelId, { requestId });
      // Images return: { data: { images: [{ url }] } }
      // Videos return: { data: { video: { url } } }
      const url =
        result?.data?.images?.[0]?.url ||
        result?.data?.video?.url ||
        result?.data?.url ||
        null;
      return { status: 'completed', url };
    }

    if (status.status === 'FAILED') {
      return { status: 'failed', url: null, error: 'Job failed on fal.ai' };
    }

    return { status: 'pending', url: null };
  } catch (err) {
    console.error('getJobStatus error:', err.message);
    return { status: 'failed', url: null };
  }
};

// ── Check status for a specific model (video) ────────────────────────────────
export const getVideoJobStatus = async (requestId, videoModel = 'kling') => {
  const model = VIDEO_MODELS[videoModel] || VIDEO_MODELS.kling;
  return getJobStatus(requestId, model);
};
