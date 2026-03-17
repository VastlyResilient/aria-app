import { Router } from 'express';
import { query } from '../db/db.js';
import { submitTwoParallelVideoJobs, getVideoJobStatus } from '../services/falai.js';
import { generateAnimationPrompt } from '../services/claude.js';
import { getRoomPromptKey, DOLLY_PROMPTS } from '../../prompts.js';

const router = Router();

const getProject = async (id, userId) => {
  const result = await query('SELECT * FROM projects WHERE id = $1', [id]);
  const project = result.rows[0];
  if (!project) { const e = new Error('Not found'); e.status = 404; throw e; }
  if (project.user_id !== userId) { const e = new Error('Forbidden'); e.status = 403; throw e; }
  return project;
};

// POST /set-model — save video model choice
router.post('/set-model', async (req, res) => {
  try {
    const { projectId, videoModel } = req.body;
    if (!projectId || !videoModel) return res.status(400).json({ error: 'projectId and videoModel required' });

    const project = await getProject(projectId, req.userId);
    const data = { ...project.data, videoModel };
    await query('UPDATE projects SET data = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(data), projectId]);

    res.json({ videoModel });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// POST /animate — Claude generates prompt silently, then fire 2 video jobs
router.post('/animate', async (req, res) => {
  try {
    const { projectId, roomId } = req.body;
    if (!projectId || !roomId) return res.status(400).json({ error: 'projectId and roomId required' });

    const project = await getProject(projectId, req.userId);
    const data = project.data;
    const room = data.rooms?.find(r => r.id === roomId);
    if (!room) return res.status(404).json({ error: 'Room not found in project' });

    const originalUrl = data.photos?.[roomId]?.converted16x9 || data.photos?.[roomId]?.original;
    const renovatedUrl = room.selectedVersion === 1 ? room.version1 : room.version2;
    if (!originalUrl || !renovatedUrl) return res.status(400).json({ error: 'Missing before/after images' });

    const videoModel = data.videoModel || 'kling';

    // Stage 1 — Claude silently generates animation prompt (never returned to client)
    const animationPrompt = await generateAnimationPrompt(originalUrl, renovatedUrl);

    // Get the scene-specific dolly motion prompt
    const promptKey = getRoomPromptKey(roomId);
    const dollyPrompt = DOLLY_PROMPTS[promptKey]?.prompt || DOLLY_PROMPTS.interior.prompt;

    // Combine both prompts for the full video instruction
    const fullVideoPrompt = `${animationPrompt}\n\n${dollyPrompt}`;

    // Stage 2 — Fire 2 parallel video jobs
    const [requestId1, requestId2] = await submitTwoParallelVideoJobs(originalUrl, fullVideoPrompt, videoModel, 5);

    // Store jobs
    await query(
      'INSERT INTO jobs (project_id, fal_request_id, job_type, room_id, status) VALUES ($1, $2, $3, $4, $5)',
      [projectId, requestId1, 'animate_v1', roomId, 'pending']
    );
    await query(
      'INSERT INTO jobs (project_id, fal_request_id, job_type, room_id, status) VALUES ($1, $2, $3, $4, $5)',
      [projectId, requestId2, 'animate_v2', roomId, 'pending']
    );

    // Update project rooms with job IDs (never store the prompt)
    const idx = data.rooms.findIndex(r => r.id === roomId);
    data.rooms[idx] = { ...data.rooms[idx], animJobId1: requestId1, animJobId2: requestId2 };
    await query('UPDATE projects SET data = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(data), projectId]);

    res.json({ requestIds: [requestId1, requestId2] });
  } catch (err) {
    console.error('Step4 animate error:', err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// GET /status/:projectId/:roomId — check both animation jobs
router.get('/status/:projectId/:roomId', async (req, res) => {
  try {
    const { projectId, roomId } = req.params;
    const project = await getProject(projectId, req.userId);
    const data = project.data;
    const room = data.rooms?.find(r => r.id === roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const videoModel = data.videoModel || 'kling';
    const [s1, s2] = await Promise.all([
      getVideoJobStatus(room.animJobId1, videoModel),
      getVideoJobStatus(room.animJobId2, videoModel),
    ]);

    if (s1.status === 'completed' && s2.status === 'completed') {
      const idx = data.rooms.findIndex(r => r.id === roomId);
      data.rooms[idx] = { ...data.rooms[idx], animation1: s1.url, animation2: s2.url };
      await query('UPDATE projects SET data = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(data), projectId]);

      return res.json({ status: 'completed', animation1Url: s1.url, animation2Url: s2.url });
    }

    if (s1.status === 'failed' || s2.status === 'failed') return res.json({ status: 'failed' });

    res.json({ status: 'pending' });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// POST /select — save selected animation
router.post('/select', async (req, res) => {
  try {
    const { projectId, roomId, selectedAnimation } = req.body;
    if (!projectId || !roomId || !selectedAnimation) return res.status(400).json({ error: 'Missing fields' });

    const project = await getProject(projectId, req.userId);
    const data = project.data;
    const idx = data.rooms?.findIndex(r => r.id === roomId);
    if (idx < 0) return res.status(404).json({ error: 'Room not found' });

    data.rooms[idx] = { ...data.rooms[idx], selectedAnimation };
    await query('UPDATE projects SET data = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(data), projectId]);

    res.json(data.rooms[idx]);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

export default router;
