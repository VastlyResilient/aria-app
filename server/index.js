import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initDb } from './db/db.js';
import { requireAuth } from './middleware/auth.js';
import { fal } from '@fal-ai/client';

const __dirname = dirname(fileURLToPath(import.meta.url));

import projectsRouter from './routes/projects.js';
import step1Router from './routes/step1.js';
import step2Router from './routes/step2.js';
import step3Router from './routes/step3.js';
import step4Router from './routes/step4.js';
import step5Router from './routes/step5.js';
import step6Router from './routes/step6.js';
import jobsRouter from './routes/jobs.js';

// Configure fal.ai client
fal.config({ credentials: process.env.FAL_KEY });

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '50mb' })); // large limit for base64 image uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ── Serve React frontend ──────────────────────────────────────────────────────
const webDist = join(__dirname, '../web/dist');
app.use(express.static(webDist));

// ── Health check (no auth) ───────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'aria-server' }));

// ── Temp image store — serves padded/mask images to fal.ai (no auth) ─────────
// fal.ai fetches these URLs directly, so they must be public (no auth header)
export const tempImageStore = new Map(); // id → { padded: Buffer, mask: Buffer }

app.get('/temp/:id/padded', (req, res) => {
  const entry = tempImageStore.get(req.params.id);
  if (!entry) return res.status(404).end();
  res.setHeader('Content-Type', 'image/jpeg');
  res.send(entry.padded);
});

app.get('/temp/:id/mask', (req, res) => {
  const entry = tempImageStore.get(req.params.id);
  if (!entry) return res.status(404).end();
  res.setHeader('Content-Type', 'image/jpeg');
  res.send(entry.mask);
});

// ── Auth middleware on all /api routes ───────────────────────────────────────
app.use('/api', requireAuth);

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/projects', projectsRouter);
app.use('/api/step1',    step1Router);
app.use('/api/step2',    step2Router);
app.use('/api/step3',    step3Router);
app.use('/api/step4',    step4Router);
app.use('/api/step5',    step5Router);
app.use('/api/step6',    step6Router);
app.use('/api/jobs',     jobsRouter);

// ── SPA fallback — serve index.html for all non-API routes ───────────────────
app.get('*', (req, res) => {
  res.sendFile(join(webDist, 'index.html'));
});

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const start = async () => {
  await initDb();
  app.listen(PORT, () => {
    console.log(`ARIA server running on port ${PORT}`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
