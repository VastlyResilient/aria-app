import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export const query = (text, params) => pool.query(text, params);

export const initDb = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      data JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);

    CREATE TABLE IF NOT EXISTS jobs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      fal_request_id TEXT,
      job_type TEXT NOT NULL,
      room_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      result JSONB,
      error TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS jobs_fal_request_id_idx ON jobs(fal_request_id);
    CREATE INDEX IF NOT EXISTS jobs_project_id_idx ON jobs(project_id);

    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS fal_model_id TEXT;
  `);
  console.log('Database tables ready.');
};
