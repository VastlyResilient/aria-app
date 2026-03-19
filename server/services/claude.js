import Anthropic from '@anthropic-ai/sdk';
import { STYLE_IDENTITY_SYSTEM_PROMPT, RENOVATION_ANIMATION_SYSTEM_PROMPT } from '../prompts.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-20250514';

// ── Resolve an image to { base64, mediaType } for Claude API ─────────────────
// Accepts either a URL (fetched) or a pre-stored { base64, mediaType } object.
const resolveImage = async (source) => {
  if (source && typeof source === 'object') return source; // already base64
  const res = await fetch(source);
  if (!res.ok) throw new Error(`Failed to fetch image for Claude: ${res.status}`);
  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const mediaType = (res.headers.get('content-type') || 'image/jpeg').split(';')[0];
  return { base64, mediaType };
};

// ── Analyze property and return 5 style options ──────────────────────────────
export const analyzeStyleOptions = async (heroImageUrl, address) => {
  const { base64, mediaType } = await resolveImage(heroImageUrl);
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: STYLE_IDENTITY_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          },
          {
            type: 'text',
            text: `Property address: ${address}\n\nPlease analyze this property and return exactly 5 renovation style options as JSON with the structure: { "styleOptions": [{ "id": "string", "label": "string", "description": "string" }] }`,
          },
        ],
      },
    ],
  });

  const raw = message.content[0].text;
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Claude did not return valid JSON for style options');
  return JSON.parse(jsonMatch[0]);
};

// ── Generate full style identity document for selected style ─────────────────
export const generateStyleIdentity = async (heroImageUrl, address, selectedStyleId, selectedStyleLabel) => {
  const { base64, mediaType } = await resolveImage(heroImageUrl);
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: STYLE_IDENTITY_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          },
          {
            type: 'text',
            text: `Property address: ${address}\n\nThe agent has selected the renovation style: "${selectedStyleLabel}" (id: ${selectedStyleId}).\n\nPlease generate the full Style Identity document for this style. Return it as a JSON object: { "styleIdentity": "full style identity text here" }`,
          },
        ],
      },
    ],
  });

  const raw = message.content[0].text;
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Claude did not return valid JSON for style identity');
  const parsed = JSON.parse(jsonMatch[0]);
  return parsed.styleIdentity || parsed.style_identity || raw;
};

// ── Generate animation prompt from before/after frames (silent) ──────────────
export const generateAnimationPrompt = async (beforeImageUrl, afterImageUrl) => {
  const [before, after] = await Promise.all([
    resolveImage(beforeImageUrl),
    resolveImage(afterImageUrl),
  ]);
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: RENOVATION_ANIMATION_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: before.mediaType, data: before.base64 },
          },
          {
            type: 'image',
            source: { type: 'base64', media_type: after.mediaType, data: after.base64 },
          },
          {
            type: 'text',
            text: 'Image 1 is the original property condition. Image 2 is the renovated version. Generate the compact renovation animation prompt (120–160 words) as specified.',
          },
        ],
      },
    ],
  });

  return message.content[0].text.trim();
};
