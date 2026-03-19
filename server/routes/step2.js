import { Router } from 'express';
import { query } from '../db/db.js';
import { analyzeStyleOptions, generateStyleIdentity } from '../services/claude.js';
import { fal } from '@fal-ai/client';
import { IMAGE_MODEL } from '../services/falai.js';

const router = Router();

const getProject = async (id, userId) => {
  const result = await query('SELECT * FROM projects WHERE id = $1', [id]);
  const project = result.rows[0];
  if (!project) { const e = new Error('Not found'); e.status = 404; throw e; }
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

// POST /preview — fast style preview via flux/schnell text-to-image (4 steps, ~5s)
router.post('/preview', async (req, res) => {
  try {
    const { projectId, styleId, styleLabel, styleDescription } = req.body;
    if (!projectId || !styleId || !styleLabel) {
      return res.status(400).json({ error: 'projectId, styleId, and styleLabel required' });
    }

    const prompt = `Photorealistic interior design, ${styleLabel} renovation style. ${styleDescription}. Professional real estate photography, bright natural light, luxury home staging, wide angle living room view, magazine-quality finish.`;

    const result = await fal.subscribe('fal-ai/flux/schnell', {
      input: {
        prompt,
        image_size: 'landscape_16_9',
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: false,
      },
    });

    const url = result?.data?.images?.[0]?.url ?? result?.images?.[0]?.url ?? null;
    if (!url) throw new Error('No image returned from fal.ai');

    res.json({ url });
  } catch (err) {
    console.error('Step2 preview error:', err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

export default router;
