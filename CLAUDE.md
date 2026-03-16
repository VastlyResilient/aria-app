# ARIA — Claude Code Context
## Listing Transformation Video Feature

This file gives Claude Code full context on the ARIA project and the Listing Transformation Video feature currently being built. Read this before every session.

---

## What ARIA Is

ARIA is an all-in-one AI platform for real estate agents built with Expo / React Native. It functions as an AI command center — handling video generation, lead management, marketing, CRM, and more. The Listing Transformation Video is part of the Media Tab.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Mobile app | Expo / React Native |
| Workflow backbone | n8n self-hosted on Railway |
| Image generation | fal.ai — Nano Banana 2 |
| Video generation | fal.ai — Kling (default), Seedance (alternative) |
| AI brain | Claude API (claude-sonnet-4-20250514) |
| Video assembly | Creatomate |
| Audio generation | ElevenLabs |
| Auth | Clerk |
| Billing | Stripe |
| Deployment | Railway + GitHub |

---

## Feature Overview — Listing Transformation Video

A 6-step guided wizard that turns existing listing photos into a cinematic renovation transformation video. No filming required.

### Step 1 — Photo Upload
- Agent uploads up to 5 listing photos
- Photos: Front of Home (required), Interior View 1/2/3 (optional), Backyard (recommended)
- On upload, every photo is immediately and silently converted to 16:9 via fal.ai Nano Banana 2 using the outpainting prompt
- Continue button is locked until all conversions are complete
- All prompts are in `/prompts.js`

### Step 2 — Style Identity
- Agent provides Front of Home photo + property address
- Claude API analyzes both and returns 5 renovation style options
- Agent selects one style
- Claude generates a full Style Identity document (palette, materials, finishes, lighting, staging)
- Style Identity is saved to project record and injected into all Step 3 room prompts

### Step 3 — Transform Rooms
- For each uploaded photo, fal.ai Nano Banana 2 generates 2 renovated versions
- Backyard room uses `BACKYARD_RENOVATION_PROMPT` exclusively
- All other rooms use `buildRoomTransformationPrompt(styleIdentity, sceneLabel)`
- Agent selects preferred version per room before moving on
- Helper: `getRoomImagePrompt(roomId, styleIdentity, sceneLabel)` in prompts.js

### Step 4 — Animate
- Agent selects video model: Kling (default) or Seedance
- For each room, Claude API silently receives both frames + `RENOVATION_ANIMATION_SYSTEM_PROMPT`
- Claude returns a compact 120–160 word Kling/Seedance-ready prompt
- That prompt + both frames fire to the selected video model via fal.ai
- 2 animation versions returned, agent selects best
- Motion prompt auto-selected per scene via `getRoomPromptKey(roomId)` → `DOLLY_PROMPTS[key]`
- Agent never sees the generated animation prompt — fully silent

### Step 5 — Closing Shot
- Backyard is converted to a night scene
- Agent uploads headshot + fills in contact info (name, phone, email, brokerage)
- ARIA generates a branded contact card overlaid on the blurred backyard
- Animated with `DOLLY_PROMPTS.backyardOutro` — 8 seconds
- Last 5 seconds: backyard blurs, agent card fades in with headshot

### Step 6 — Export
- All selected animation clips + outro + music track packaged for download
- Music generated via ElevenLabs: upbeat, cinematic, bassy, ~60 seconds

---

## Prompt Files

All prompts live in `/prompts.js`. Never hardcode prompts inline — always import from this file.

| Export | Purpose | Step |
|---|---|---|
| `OUTPAINTING_16x9_PROMPT` | Convert photo to 16:9 | Step 1 |
| `STYLE_IDENTITY_SYSTEM_PROMPT` | Generate style options + identity | Step 2 |
| `buildRoomTransformationPrompt(styleIdentity, sceneLabel)` | Room image generation | Step 3 |
| `BACKYARD_RENOVATION_PROMPT` | Backyard-specific image generation | Step 3 |
| `RENOVATION_ANIMATION_SYSTEM_PROMPT` | Generate Kling/Seedance animation prompt | Step 4 |
| `DOLLY_PROMPTS.hero` | Front of Home motion | Step 4 |
| `DOLLY_PROMPTS.interior` | Interior View 1/2/3 motion | Step 4 |
| `DOLLY_PROMPTS.bedroom` | Bedroom motion | Step 4 |
| `DOLLY_PROMPTS.kitchen` | Kitchen motion | Step 4 |
| `DOLLY_PROMPTS.backyard` | Backyard motion | Step 4 |
| `DOLLY_PROMPTS.backyardOutro` | Closing shot motion (8 sec) | Step 5 |
| `getRoomPromptKey(roomId)` | Maps room ID to dolly prompt key | Step 4 |
| `getRoomImagePrompt(roomId, styleIdentity, sceneLabel)` | Routes image prompt per room | Step 3 |

---

## Project Record Schema

Every wizard session writes to a single project record. Persist this across steps.

```json
{
  "id": "string",
  "address": "string",
  "photos": {
    "hero":     { "original": "url", "converted16x9": "url" },
    "living":   { "original": "url", "converted16x9": "url" },
    "bedroom":  { "original": "url", "converted16x9": "url" },
    "kitchen":  { "original": "url", "converted16x9": "url" },
    "backyard": { "original": "url", "converted16x9": "url" }
  },
  "styleIdentity": "string",
  "selectedStyle": "string",
  "rooms": [
    {
      "id": "string",
      "label": "string",
      "original": "url",
      "version1": "url",
      "version2": "url",
      "selectedVersion": 1,
      "animation1": "url",
      "animation2": "url",
      "selectedAnimation": 1
    }
  ],
  "videoModel": "kling | seedance",
  "agent": {
    "name": "string",
    "phone": "string",
    "email": "string",
    "brokerage": "string",
    "headshot": "url"
  },
  "outro": {
    "nightImage": "url",
    "brandedImage": "url",
    "clip": "url"
  },
  "musicTrack": "url",
  "status": "draft | complete"
}
```

---

## n8n Workflow Structure

Each step maps to an n8n workflow triggered via webhook.

| Workflow | Trigger | Actions |
|---|---|---|
| `ltv-step1-convert` | Photo uploaded | fal.ai outpainting → store 16:9 URL |
| `ltv-step2-style` | Analyze clicked | Claude API → return style options |
| `ltv-step2-lock` | Style selected | Store style identity to project |
| `ltv-step3-transform` | Generate clicked | fal.ai × 2 parallel → store versions |
| `ltv-step4-animate` | Generate animation | Claude API prompt → fal.ai video × 2 |
| `ltv-step5-outro` | Generate outro | Night convert → branded card → video |
| `ltv-step6-export` | Download clicked | Package all assets → zip → serve |

---

## Key Rules

- Never hardcode prompts — always import from `prompts.js`
- Never show the animation prompt to the agent — it is generated and fired silently
- Backyard always uses `BACKYARD_RENOVATION_PROMPT` in Step 3, never the style identity
- All photos must complete 16:9 conversion before Step 2 is accessible
- Project record must be updated after every agent action — support mid-session resume
- 2 versions generated per room in Step 3 and Step 4 — never 1, never 3
- Kling is the default video model — Seedance is the alternative
- Every feature must be fully tested before any user touches it

---

## Frontend Mockup

The full wizard UI is in `/aria-wizard-v3.jsx`. Use this as the reference for all screen layouts, step logic, state management patterns, and UX flow. Do not redesign — build from this.

---

## Build Order

When starting a new Claude Code session, build in this order:
1. Project record schema + database setup
2. n8n workflow: `ltv-step1-convert` (photo upload + 16:9 conversion)
3. Step 1 screen wired to workflow
4. n8n workflow: `ltv-step2-style` (style identity)
5. Step 2 screen wired to workflow
6. Continue through steps 3 → 4 → 5 → 6 in order
7. End-to-end test with real listing photos before any beta user touches it
