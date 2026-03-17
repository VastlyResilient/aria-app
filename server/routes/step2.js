import { Router } from 'express';
import { query } from '../db/db.js';
import { analyzeStyleOptions, generateStyleIdentity } from '../services/claude.js';

const router = Router();

const getProject = async (id, userId) => {
  const result = await query('SELECT * FROM projects WHERE id = $1', [id]);
  const project = result.rows[0];
  if (!project) { const e = new Error('Not found'); e.status = 404; throw e; }
  if (project.user_id !== userId) { const e = new Error('Forbidden'); e.status = 403; throw e; }
  return project;
};

// POST /analyze — analyze hero photo + address, return 5 style options
router.post('/analyze', async (req, res) => {
  try {
    const { projectId, address } = req.body;
    if (!projectId || !address) return res.status(400).json({ error: 'projectId and address required' });

    const project = await getProject(projectId, req.userId);
    const heroUrl = project.data?.photos?.hero?.converted16x9 || project.data?.photos?.hero?.original;
    if (!heroUrl) return res.status(400).json({ error: 'Hero photo not yet converted' });

    // Save address to project
    const data = { ...project.data, address };
    await query('UPDATE projects SET data = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(data), projectId]);

    // Call Claude
    const result = await analyzeStyleOptions(heroUrl, address);
    res.json(result);
  } catch (err) {
    console.error('Step2 analyze error:', err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// POST /lock — lock selected style, generate full style identity
router.post('/lock', async (req, res) => {
  try {
    const { projectId, selectedStyleId, selectedStyleLabel } = req.body;
    if (!projectId || !selectedStyleId) return res.status(400).json({ error: 'projectId and selectedStyleId required' });

    const project = await getProject(projectId, req.userId);
    const heroUrl = project.data?.photos?.hero?.converted16x9 || project.data?.photos?.hero?.original;
    const address = project.data?.address;
    if (!heroUrl || !address) return res.status(400).json({ error: 'Missing hero photo or address' });

    // Generate style identity via Claude
    const styleIdentity = await generateStyleIdentity(heroUrl, address, selectedStyleId, selectedStyleLabel);

    // Save to project
    const data = { ...project.data, selectedStyle: selectedStyleId, styleIdentity };
    await query('UPDATE projects SET data = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(data), projectId]);

    res.json({ styleIdentity, selectedStyle: selectedStyleId });
  } catch (err) {
    console.error('Step2 lock error:', err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

export default router;
