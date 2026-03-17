import { Router } from 'express';
import { getJobStatus } from '../services/falai.js';

const router = Router();

// GET /:requestId — generic job status check
router.get('/:requestId', async (req, res) => {
  try {
    const status = await getJobStatus(req.params.requestId);
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
