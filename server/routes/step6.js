import { Router } from 'express';
import { query } from '../db/db.js';
import { generateMusicTrack } from '../services/elevenlabs.js';

const router = Router();

const getProject = async (id, userId) => {
  const result = await query('SELECT * FROM projects WHERE id = $1', [id]);
  const project = result.rows[0];
  if (!project) { const e = new Error('Not found'); e.status = 404; throw e; }
  if (project.user_id !== userId) { const e = new Error('Forbidden'); e.status = 403; throw e; }
  return project;
};

// POST /generate-music — generate 60s music track via ElevenLabs
router.post('/generate-music', async (req, res) => {
  try {
    const { projectId } = req.body;
    if (!projectId) return res.status(400).json({ error: 'projectId required' });

    const project = await getProject(projectId, req.userId);
    const { url } = await generateMusicTrack();

    const data = { ...project.data, musicTrack: url };
    await query('UPDATE projects SET data = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(data), projectId]);

    res.json({ musicTrackUrl: url });
  } catch (err) {
    console.error('Step6 music error:', err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// GET /assets/:projectId — return all export-ready assets
router.get('/assets/:projectId', async (req, res) => {
  try {
    const project = await getProject(req.params.projectId, req.userId);
    const data = project.data;

    const assets = [];

    // Room animation clips
    for (const room of data.rooms || []) {
      const clipUrl = room.selectedAnimation === 1 ? room.animation1 : room.animation2;
      if (clipUrl) {
        assets.push({
          label: `${room.label || room.id} Transformation`,
          url: clipUrl,
          duration: '5 sec',
          type: 'CLIP',
          ready: true,
        });
      }
    }

    // Outro clip
    if (data.outro?.clip) {
      assets.push({
        label: 'Agent Outro',
        url: data.outro.clip,
        duration: '8 sec',
        type: 'CLIP',
        ready: true,
      });
    }

    // Music track
    if (data.musicTrack) {
      assets.push({
        label: 'Background Music Track',
        url: data.musicTrack,
        duration: '60 sec',
        type: 'AUDIO',
        ready: true,
      });
    }

    const allReady = assets.length > 0 && assets.every(a => a.ready) && !!data.musicTrack;

    res.json({ assets, allReady });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// POST /complete — mark project as complete
router.post('/complete', async (req, res) => {
  try {
    const { projectId } = req.body;
    if (!projectId) return res.status(400).json({ error: 'projectId required' });

    const project = await getProject(projectId, req.userId);
    const data = { ...project.data, status: 'complete' };
    await query('UPDATE projects SET data = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(data), projectId]);

    res.json({ status: 'complete' });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

export default router;
