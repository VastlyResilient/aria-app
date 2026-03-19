import { Router } from 'express';
import { randomUUID } from 'crypto';
import { query } from '../db/db.js';
import { uploadImage, convertTo16x9 } from '../services/falai.js';

const router = Router();

// POST /convert — upload photo + convert to 16:9 synchronously (no AI, instant)
router.post('/convert', async (req, res) => {
  try {
    const { projectId, roomId, imageDataUrl } = req.body;
    if (!projectId || !roomId || !imageDataUrl) {
      return res.status(400).json({ error: 'projectId, roomId, and imageDataUrl are required' });
    }

    const projectResult = await query('SELECT * FROM projects WHERE id = $1', [projectId]);
    const project = projectResult.rows[0];
    if (!project) return res.status(404).json({ error: 'Not found' });

    // Both ops run in parallel — pure sharp processing, instant
    const [originalUrl, converted16x9Url] = await Promise.all([
      uploadImage(imageDataUrl),
      convertTo16x9(imageDataUrl),
    ]);

    // Save to project
    const data = project.data;
    data.photos = data.photos || {};
    data.photos[roomId] = { ...data.photos[roomId], original: originalUrl, converted16x9: converted16x9Url };
    await query('UPDATE projects SET data = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(data), projectId]);

    // Store completed job record
    const fakeRequestId = `sharp-${randomUUID()}`;
    await query(
      'INSERT INTO jobs (project_id, fal_request_id, job_type, room_id, status, fal_model_id, result) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [projectId, fakeRequestId, 'convert16x9', roomId, 'completed', 'sharp', JSON.stringify({ url: converted16x9Url })]
    );

    res.json({ url: converted16x9Url, roomId });
  } catch (err) {
    console.error('Step1 convert error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /status/:requestId — kept for backwards compatibility, always returns completed
router.get('/status/:requestId', async (req, res) => {
  try {
    const jobResult = await query('SELECT * FROM jobs WHERE fal_request_id = $1', [req.params.requestId]);
    const job = jobResult.rows[0];
    if (!job) return res.status(404).json({ error: 'Job not found' });
    return res.json({ status: job.status, result: job.result });
  } catch (err) {
    console.error('Step1 status error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
