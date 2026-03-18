import { Router } from 'express';
import { query } from '../db/db.js';

const router = Router();

const DEFAULT_PROJECT_DATA = {
  address: '',
  photos: { hero: {}, living: {}, bedroom: {}, kitchen: {}, backyard: {} },
  styleIdentity: null,
  selectedStyle: null,
  rooms: [],
  videoModel: 'kling',
  agent: { name: '', phone: '', email: '', brokerage: '', headshot: null },
  outro: { nightImage: null, brandedImage: null, clip: null },
  musicTrack: null,
  status: 'draft',
};

const getProject = async (id, userId) => {
  const result = await query('SELECT * FROM projects WHERE id = $1', [id]);
  if (!result.rows[0]) {
    const err = new Error('Project not found'); err.status = 404; throw err;
  }
  return result.rows[0];
};

export const updateProject = async (id, userId, updates) => {
  const project = await getProject(id, userId);
  const merged = { ...project.data, ...updates };
  const result = await query(
    'UPDATE projects SET data = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [JSON.stringify(merged), id]
  );
  return result.rows[0];
};

// POST / — create project
router.post('/', async (req, res) => {
  try {
    const result = await query(
      'INSERT INTO projects (user_id, data) VALUES ($1, $2) RETURNING *',
      [req.userId, JSON.stringify(DEFAULT_PROJECT_DATA)]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET / — list projects for user
router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM projects WHERE user_id = $1 ORDER BY updated_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id — get single project
router.get('/:id', async (req, res) => {
  try {
    const project = await getProject(req.params.id, req.userId);
    res.json(project);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// PATCH /:id — partial update
router.patch('/:id', async (req, res) => {
  try {
    const updated = await updateProject(req.params.id, req.userId, req.body);
    res.json(updated);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  try {
    await getProject(req.params.id, req.userId); // verify ownership
    await query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

export default router;
