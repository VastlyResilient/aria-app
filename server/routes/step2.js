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

// POST /preview — generate AI styled interior preview for a style option
router.post('/preview', async (req, res) => {
  try {
    const { projectId, styleId, styleLabel, styleDescription } = req.body;
    if (!projectId || !styleId || !styleLabel) {
      return res.status(400).json({ error: 'projectId, styleId, and styleLabel required' });
    }

    const project = await getProject(projectId, req.userId);
    const photos = project.data?.photos || {};

    // Pick best interior photo: living > bedroom > kitchen > any non-hero/non-backyard
    const priority = ['living', 'bedroom', 'kitchen'];
    let interiorUrl = null;
    for (const roomId of priority) {
      const photo = photos[roomId];
      if (photo?.converted16x9 || photo?.original) {
        interiorUrl = photo.converted16x9 || photo.original;
        break;
      }
    }
    if (!interiorUrl) {
      for (const [roomId, photo] of Object.entries(photos)) {
        if (roomId !== 'hero' && roomId !== 'backyard' && (photo?.converted16x9 || photo?.original)) {
          interiorUrl = photo.converted16x9 || photo.original;
          break;
        }
      }
    }
    if (!interiorUrl) {
      return res.status(400).json({ error: 'No interior photo available. Upload a living room or bedroom photo in Step 1.' });
    }

    const prompt = `Interior design renovation, ${styleLabel} style. ${styleDescription}. Photorealistic professional interior design photography, bright natural light, well-staged and furnished, magazine-quality finish. Preserve the exact room layout and architecture — transform only the materials, colors, furnishings, and finishes.`;

    const result = await fal.subscribe(IMAGE_MODEL, {
      input: {
        image_url: interiorUrl,
        prompt,
        image_prompt_strength: 0.38,
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
