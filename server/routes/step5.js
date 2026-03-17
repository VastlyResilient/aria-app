import { Router } from 'express';
import { query } from '../db/db.js';
import { uploadImage, submitVideoJob, getVideoJobStatus } from '../services/falai.js';
import { DOLLY_PROMPTS } from '../../prompts.js';

const router = Router();

const NIGHT_CONVERSION_PROMPT = `Convert this renovated backyard image to a dramatic night scene. Preserve the exact architecture, deck, furniture, and landscape layout. Add: warm string lights along the fence and deck, soft uplighting on the mature tree, glowing warm light spilling from house windows, moonlit sky with subtle stars. Deep rich night atmosphere. Luxury outdoor evening ambiance. Ultra photorealistic. 8K HDR. Maintain exact camera angle and framing.`;

const getProject = async (id, userId) => {
  const result = await query('SELECT * FROM projects WHERE id = $1', [id]);
  const project = result.rows[0];
  if (!project) { const e = new Error('Not found'); e.status = 404; throw e; }
  if (project.user_id !== userId) { const e = new Error('Forbidden'); e.status = 403; throw e; }
  return project;
};

// POST /save-agent — save agent contact info
router.post('/save-agent', async (req, res) => {
  try {
    const { projectId, agent } = req.body;
    if (!projectId || !agent) return res.status(400).json({ error: 'projectId and agent required' });

    const project = await getProject(projectId, req.userId);
    const data = { ...project.data, agent: { ...project.data.agent, ...agent } };
    await query('UPDATE projects SET data = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(data), projectId]);

    res.json({ agent: data.agent });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// POST /upload-headshot — upload headshot to fal.ai storage
router.post('/upload-headshot', async (req, res) => {
  try {
    const { projectId, imageDataUrl } = req.body;
    if (!projectId || !imageDataUrl) return res.status(400).json({ error: 'projectId and imageDataUrl required' });

    const project = await getProject(projectId, req.userId);
    const url = await uploadImage(imageDataUrl);

    const data = { ...project.data };
    data.agent = { ...data.agent, headshot: url };
    await query('UPDATE projects SET data = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(data), projectId]);

    res.json({ url });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// POST /generate — start night conversion + outro video generation
router.post('/generate', async (req, res) => {
  try {
    const { projectId } = req.body;
    if (!projectId) return res.status(400).json({ error: 'projectId required' });

    const project = await getProject(projectId, req.userId);
    const data = project.data;

    const backyardRoom = data.rooms?.find(r => r.id === 'backyard');
    const backyardUrl = backyardRoom?.selectedVersion === 1 ? backyardRoom?.version1 : backyardRoom?.version2;
    if (!backyardUrl) return res.status(400).json({ error: 'No backyard renovated image found' });

    const videoModel = data.videoModel || 'kling';
    const outroPrompt = DOLLY_PROMPTS.backyardOutro.prompt;

    // Job 1: Night scene image conversion
    const { submitImageJob } = await import('../services/falai.js');
    const nightJobId = await submitImageJob(backyardUrl, NIGHT_CONVERSION_PROMPT);

    // Job 2: Outro video using the night conversion (we'll use backyardUrl for now
    // and update to nightImage URL once night job completes - handled in status polling)
    const videoJobId = await submitVideoJob(backyardUrl, outroPrompt, videoModel, 8);

    // Store job records
    await query('INSERT INTO jobs (project_id, fal_request_id, job_type, room_id, status) VALUES ($1, $2, $3, $4, $5)',
      [projectId, nightJobId, 'outro_night', 'backyard', 'pending']);
    await query('INSERT INTO jobs (project_id, fal_request_id, job_type, room_id, status) VALUES ($1, $2, $3, $4, $5)',
      [projectId, videoJobId, 'outro_video', 'backyard', 'pending']);

    data.outro = { ...data.outro, nightJobId, videoJobId };
    await query('UPDATE projects SET data = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(data), projectId]);

    res.json({ nightJobId, videoJobId });
  } catch (err) {
    console.error('Step5 generate error:', err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// GET /status/:projectId — check outro generation jobs
router.get('/status/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await getProject(projectId, req.userId);
    const data = project.data;
    const { nightJobId, videoJobId } = data.outro || {};

    if (!nightJobId || !videoJobId) return res.status(400).json({ error: 'No outro jobs found' });

    const videoModel = data.videoModel || 'kling';
    const [nightStatus, videoStatus] = await Promise.all([
      getVideoJobStatus(nightJobId, 'kling'), // night conversion is image job, use image model status
      getVideoJobStatus(videoJobId, videoModel),
    ]);

    const updated = { ...data };

    if (nightStatus.status === 'completed' && nightStatus.url) {
      updated.outro = { ...updated.outro, nightImage: nightStatus.url };
    }
    if (videoStatus.status === 'completed' && videoStatus.url) {
      updated.outro = { ...updated.outro, clip: videoStatus.url };
    }

    if (nightStatus.status === 'completed' || videoStatus.status === 'completed') {
      await query('UPDATE projects SET data = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(updated), projectId]);
    }

    res.json({
      nightStatus: nightStatus.status,
      videoStatus: videoStatus.status,
      nightImageUrl: updated.outro?.nightImage || null,
      clipUrl: updated.outro?.clip || null,
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

export default router;
