import { Router } from 'express';
import { query } from '../db/db.js';
import { submitTwoParallelImageJobs, getJobStatus } from '../services/falai.js';
import { getRoomImagePrompt } from '../../prompts.js';

const router = Router();

const ROOM_LABELS = {
  hero: 'front exterior',
  living: 'living room',
  bedroom: 'bedroom',
  kitchen: 'kitchen',
  backyard: 'backyard',
};

const getProject = async (id, userId) => {
  const result = await query('SELECT * FROM projects WHERE id = $1', [id]);
  const project = result.rows[0];
  if (!project) { const e = new Error('Not found'); e.status = 404; throw e; }
  if (project.user_id !== userId) { const e = new Error('Forbidden'); e.status = 403; throw e; }
  return project;
};

// POST /transform — fire 2 parallel image generation jobs for a room
router.post('/transform', async (req, res) => {
  try {
    const { projectId, roomId } = req.body;
    if (!projectId || !roomId) return res.status(400).json({ error: 'projectId and roomId required' });

    const project = await getProject(projectId, req.userId);
    const data = project.data;

    const imageUrl = data.photos?.[roomId]?.converted16x9 || data.photos?.[roomId]?.original;
    if (!imageUrl) return res.status(400).json({ error: `No image found for room: ${roomId}` });

    const sceneLabel = ROOM_LABELS[roomId] || roomId;
    const prompt = getRoomImagePrompt(roomId, data.styleIdentity || '', sceneLabel);

    // Fire 2 parallel jobs
    const [requestId1, requestId2] = await submitTwoParallelImageJobs(imageUrl, prompt);

    // Store job records
    await query(
      'INSERT INTO jobs (project_id, fal_request_id, job_type, room_id, status) VALUES ($1, $2, $3, $4, $5)',
      [projectId, requestId1, 'transform_v1', roomId, 'pending']
    );
    await query(
      'INSERT INTO jobs (project_id, fal_request_id, job_type, room_id, status) VALUES ($1, $2, $3, $4, $5)',
      [projectId, requestId2, 'transform_v2', roomId, 'pending']
    );

    // Update project with job IDs
    const rooms = data.rooms || [];
    const existingIdx = rooms.findIndex(r => r.id === roomId);
    const roomEntry = { id: roomId, label: sceneLabel, transformJobId1: requestId1, transformJobId2: requestId2 };
    if (existingIdx >= 0) rooms[existingIdx] = { ...rooms[existingIdx], ...roomEntry };
    else rooms.push(roomEntry);
    data.rooms = rooms;
    await query('UPDATE projects SET data = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(data), projectId]);

    res.json({ requestIds: [requestId1, requestId2] });
  } catch (err) {
    console.error('Step3 transform error:', err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// GET /status/:projectId/:roomId — check both transform jobs
router.get('/status/:projectId/:roomId', async (req, res) => {
  try {
    const { projectId, roomId } = req.params;
    const project = await getProject(projectId, req.userId);
    const room = project.data.rooms?.find(r => r.id === roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const [s1, s2] = await Promise.all([
      getJobStatus(room.transformJobId1),
      getJobStatus(room.transformJobId2),
    ]);

    if (s1.status === 'completed' && s2.status === 'completed') {
      // Save URLs to project
      const data = project.data;
      const idx = data.rooms.findIndex(r => r.id === roomId);
      data.rooms[idx] = { ...data.rooms[idx], version1: s1.url, version2: s2.url };
      await query('UPDATE projects SET data = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(data), projectId]);

      return res.json({ status: 'completed', version1Url: s1.url, version2Url: s2.url });
    }

    if (s1.status === 'failed' || s2.status === 'failed') {
      return res.json({ status: 'failed' });
    }

    res.json({ status: 'pending' });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// POST /select — save selected version
router.post('/select', async (req, res) => {
  try {
    const { projectId, roomId, selectedVersion } = req.body;
    if (!projectId || !roomId || !selectedVersion) return res.status(400).json({ error: 'Missing fields' });

    const project = await getProject(projectId, req.userId);
    const data = project.data;
    const idx = data.rooms?.findIndex(r => r.id === roomId);
    if (idx < 0) return res.status(404).json({ error: 'Room not found' });

    data.rooms[idx] = { ...data.rooms[idx], selectedVersion };
    await query('UPDATE projects SET data = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(data), projectId]);

    res.json(data.rooms[idx]);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

export default router;
