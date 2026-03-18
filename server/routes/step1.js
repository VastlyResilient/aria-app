import { Router } from 'express';
import { query } from '../db/db.js';
import { uploadImage, submitOutpaintingJob, getJobStatus } from '../services/falai.js';
import { updateProject } from './projects.js';
import { OUTPAINTING_16x9_PROMPT } from '../prompts.js';

const router = Router();

// POST /convert — upload photo + fire 16:9 conversion
router.post('/convert', async (req, res) => {
  try {
    const { projectId, roomId, imageDataUrl } = req.body;
    if (!projectId || !roomId || !imageDataUrl) {
      return res.status(400).json({ error: 'projectId, roomId, and imageDataUrl are required' });
    }

    // Upload image to fal.ai storage
    const originalUrl = await uploadImage(imageDataUrl);

    // Save original URL to project
    const projectResult = await query('SELECT * FROM projects WHERE id = $1', [projectId]);
    const project = projectResult.rows[0];
    if (!project || project.user_id !== req.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const data = project.data;
    data.photos = data.photos || {};
    data.photos[roomId] = { ...data.photos[roomId], original: originalUrl };
    await query('UPDATE projects SET data = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(data), projectId]);

    // Submit fal.ai outpainting job (fast model)
    const requestId = await submitOutpaintingJob(originalUrl, OUTPAINTING_16x9_PROMPT);

    // Store job record
    await query(
      'INSERT INTO jobs (project_id, fal_request_id, job_type, room_id, status) VALUES ($1, $2, $3, $4, $5)',
      [projectId, requestId, 'convert16x9', roomId, 'pending']
    );

    res.json({ requestId, roomId });
  } catch (err) {
    console.error('Step1 convert error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /status/:requestId — check conversion status
router.get('/status/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;

    // Look up job to get project + room context
    const jobResult = await query('SELECT * FROM jobs WHERE fal_request_id = $1', [requestId]);
    const job = jobResult.rows[0];
    if (!job) return res.status(404).json({ error: 'Job not found' });

    // Verify ownership
    const projectResult = await query('SELECT * FROM projects WHERE id = $1', [job.project_id]);
    const project = projectResult.rows[0];
    if (!project || project.user_id !== req.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // If already completed in our DB, return cached result
    if (job.status === 'completed' && job.result?.url) {
      return res.json({ status: 'completed', result: job.result });
    }

    // Check fal.ai (use outpainting model)
    const falStatus = await getJobStatus(requestId, 'fal-ai/flux/dev');

    if (falStatus.status === 'completed' && falStatus.url) {
      // Save result to project
      const data = project.data;
      data.photos[job.room_id] = { ...data.photos[job.room_id], converted16x9: falStatus.url };
      await query('UPDATE projects SET data = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(data), job.project_id]);

      // Update job record
      await query('UPDATE jobs SET status = $1, result = $2, updated_at = NOW() WHERE id = $3',
        ['completed', JSON.stringify({ url: falStatus.url }), job.id]);

      return res.json({ status: 'completed', result: { url: falStatus.url } });
    }

    if (falStatus.status === 'failed') {
      await query('UPDATE jobs SET status = $1, updated_at = NOW() WHERE id = $2', ['failed', job.id]);
      return res.json({ status: 'failed' });
    }

    res.json({ status: 'pending' });
  } catch (err) {
    console.error('Step1 status error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
