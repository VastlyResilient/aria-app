import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'https://api.elevenlabs.io/v1';

// ── Generate a ~60 second cinematic music track ──────────────────────────────
export const generateMusicTrack = async () => {
  const prompt = 'Upbeat cinematic luxury real estate background music. Modern, motivational, bassy, professional. No lyrics. Suitable for a property transformation video. 60 seconds.';

  const response = await axios.post(
    `${BASE_URL}/sound-generation`,
    {
      text: prompt,
      duration_seconds: 60,
      prompt_influence: 0.5,
    },
    {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      responseType: 'arraybuffer',
    }
  );

  // Upload the audio buffer to fal.ai storage for a hosted URL
  const { fal } = await import('@fal-ai/client');
  const buffer = Buffer.from(response.data);
  const blob = new Blob([buffer], { type: 'audio/mpeg' });
  const url = await fal.storage.upload(blob);

  return { url };
};
