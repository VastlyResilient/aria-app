import { fal } from '@fal-ai/client';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

fal.config({ credentials: process.env.FAL_KEY });

// True img2img model — preserves building/room structure, transforms style
// strength 0.65: keeps architecture/layout, changes materials/finishes/landscaping
export const IMAGE_MODEL = 'fal-ai/flux/dev/image-to-image';
// Dedicated fill/outpainting model for 16:9 conversion
export const OUTPAINTING_MODEL = 'fal-ai/flux-pro/v1/fill';

// Video generation models
const VIDEO_MODELS = {
  kling: 'fal-ai/kling-video/v1.6/pro/image-to-video',
  seedance: 'fal-ai/minimax/video-01-live',
};

// ── Upload a base64 data URL to fal.ai storage, returns hosted URL ──────────
export const uploadImage = async (imageDataUrl) => {
  const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
  const mimeMatch = imageDataUrl.match(/^data:(image\/\w+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const buffer = Buffer.from(base64Data, 'base64');
  const blob = new Blob([buffer], { type: mimeType });
  const url = await fal.storage.upload(blob);
  return url;
};

// ── Build 16:9 padded image + mask, serve from Railway, return URLs ───────────
// Avoids fal.ai storage entirely — stores buffers in memory and serves them
// via /temp/:id/padded and /temp/:id/mask (public, no auth required)
export const prepareOutpaintAssets = async (imageDataUrl) => {
  const { tempImageStore } = await import('../index.js');

  const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
  const inputBuffer = Buffer.from(base64Data, 'base64');

  // Cap to 1920px max width
  const resizedInput = await sharp(inputBuffer)
    .resize({ width: 1920, withoutEnlargement: true })
    .jpeg({ quality: 90 })
    .toBuffer();

  const meta = await sharp(resizedInput).metadata();
  const origW = meta.width;
  const origH = meta.height;

  // Compute 16:9 target dimensions
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

  // Padded image: original centered on neutral gray 16:9 canvas
  const paddedBuffer = await sharp(resizedInput)
    .extend({
      top,
      bottom: targetH - origH - top,
      left,
      right: targetW - origW - left,
      background: { r: 128, g: 128, b: 128, alpha: 1 },
    })
    .jpeg({ quality: 90 })
    .toBuffer();

  // Mask: white canvas with black rect over original image area
  const blackRect = await sharp({
    create: { width: origW, height: origH, channels: 3, background: { r: 0, g: 0, b: 0 } },
  }).jpeg().toBuffer();

  const maskBuffer = await sharp({
    create: { width: targetW, height: targetH, channels: 3, background: { r: 255, g: 255, b: 255 } },
  })
    .composite([{ input: blackRect, left, top }])
    .jpeg()
    .toBuffer();

  // Store in memory and serve from Railway — no fal.ai storage upload needed
  const tempId = randomUUID();
  tempImageStore.set(tempId, { padded: paddedBuffer, mask: maskBuffer });
  setTimeout(() => tempImageStore.delete(tempId), 15 * 60 * 1000); // clean up after 15 min

  const BASE_URL = process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : `http://localhost:${process.env.PORT || 3001}`;

  return {
    paddedUrl: `${BASE_URL}/temp/${tempId}/padded`,
    maskUrl: `${BASE_URL}/temp/${tempId}/mask`,
  };
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

// ── Submit a fast outpainting job (16:9 conversion) ──────────────────────────
export const submitOutpaintingJob = async (paddedUrl, maskUrl, prompt) => {
  const { request_id } = await fal.queue.submit(OUTPAINTING_MODEL, {
    input: {
      image_url: paddedUrl,
      mask_url: maskUrl,
      prompt,
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
