import { fal } from '@fal-ai/client';
import dotenv from 'dotenv';
dotenv.config();

fal.config({ credentials: process.env.FAL_KEY });

// Image generation model (outpainting + room transformation)
const IMAGE_MODEL = 'fal-ai/flux-pro/v1.1/ultra';

// Video generation models
const VIDEO_MODELS = {
  kling: 'fal-ai/kling-video/v2.1/pro/image-to-video',
  seedance: 'fal-ai/bytedance/seedance-video/image-to-video',
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

// ── Submit a single image-to-image job ──────────────────────────────────────
export const submitImageJob = async (imageUrl, prompt) => {
  const { request_id } = await fal.queue.submit(IMAGE_MODEL, {
    input: {
      image_url: imageUrl,
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
      duration: String(durationSeconds),
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
    return { status: 'pending', url: null };
  }
};

// ── Check status for a specific model (video) ────────────────────────────────
export const getVideoJobStatus = async (requestId, videoModel = 'kling') => {
  const model = VIDEO_MODELS[videoModel] || VIDEO_MODELS.kling;
  return getJobStatus(requestId, model);
};
