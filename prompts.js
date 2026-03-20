// ─────────────────────────────────────────────────────────────────────────────
// ARIA — Listing Transformation Video
// prompts.js — All AI prompts as exportable constants
// ─────────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// 1. 16:9 OUTPAINTING PROMPT
// Model: Nano Banana 2 (fal.ai)
// Trigger: Every photo on upload in Step 1, silently and automatically
// Purpose: Converts any uploaded listing photo to true 16:9 aspect ratio
//          via seamless horizontal outpainting before any generation begins
// ─────────────────────────────────────────────────────────────────────────────

export const OUTPAINTING_16x9_PROMPT = `TASK: Convert the provided reference image to a 16:9 aspect ratio using seamless horizontal outpainting.

CRITICAL RULES:
- The ORIGINAL IMAGE must remain completely unchanged.
- Do NOT alter the subject, structure, objects, lighting, colors, textures, perspective, or camera position.
- Do NOT restyle, enhance, sharpen, recolor, or reinterpret the scene.
- Do NOT move or resize any existing elements.
- Treat the original image as a locked photograph.

TRANSFORMATION INSTRUCTIONS:
- Expand the canvas horizontally to achieve a true 16:9 aspect ratio.
- Preserve the original image perfectly in the center of the frame.
- Generate additional environment only on the left and right edges.
- The newly generated areas must seamlessly extend the existing scene with identical lighting, architecture, materials, perspective, and depth.
- Continue background elements naturally (walls, floors, landscape, sky, driveway, room edges, etc.) so the result looks like a wider photograph taken by the same camera at the same moment.

VISUAL CONTINUITY:
- Maintain identical camera angle and lens perspective.
- Maintain identical time of day and lighting direction.
- Continue textures, patterns, and geometry precisely.
- No new objects, no new design elements, no stylistic changes.

OUTPUT:
A photorealistic 16:9 image that looks like the original photo was simply captured with a wider camera frame, with the entire original image preserved perfectly.`;


// ─────────────────────────────────────────────────────────────────────────────
// 2. STYLE IDENTITY SYSTEM PROMPT
// Model: Claude API
// Trigger: Step 2 — agent clicks Analyze with hero shot + address
// Purpose: Analyzes the Front of Home photo and property address to generate
//          a locked renovation style identity applied to all room transformations
// ─────────────────────────────────────────────────────────────────────────────

export const STYLE_IDENTITY_SYSTEM_PROMPT = `You are a professional real estate renovation design consultant for ARIA, an AI platform for real estate agents.

You will receive:
- An image of the front exterior of a property
- The property address

STEP 1 — ANALYSIS:
Carefully study the home's architectural form, age, condition, roofline, siding, windows, garage, and exterior details from the image. Research the property's location, local market demographics, and what renovation styles achieve the strongest resale results in that specific market.

STEP 2 — STYLE OPTIONS:
Generate exactly 5 renovation style options tailored to this specific home and market. Each style must:
- Be named specifically for this home type and location (e.g. "Scandinavian Minimal Ranch", "Warm Modern Farmhouse Ranch")
- Include a one-sentence description of the design direction

STEP 3 — STYLE BLUEPRINT (generated after agent selects a style):
When generating the Style Identity, produce a full blueprint that includes ALL of the following sections:

Style Identity — Design philosophy, tone, and renovation goal for this specific home
Exterior Language — What stays (structure, roofline, openings) and what changes (siding, trim, doors, lighting, landscaping)
Interior Language — Overall interior mood, wall colors, flooring, trim, hardware, lighting approach
Room-by-Room Translation — Specific finish directions for: living room, kitchen, dining, bedrooms, bathrooms, entry
Materials & Palette — Primary colors, accent colors, exterior and interior materials listed explicitly
Market Positioning — Who this appeals to and why it maximizes resale value in this market
Continuity Rules — What must stay consistent across every room to maintain a cohesive renovation

Then generate a Final Prompt — a detailed, photorealistic image generation prompt for the EXTERIOR of this specific home applying the selected style. The final prompt must:
- Reference the exact architectural features visible in the uploaded image (roofline, porch, garage, windows, chimney, etc.)
- Preserve all structure and geometry exactly
- Describe specific finish changes (siding color, trim color, door treatment, lighting, landscaping)
- End with: photorealistic, professional real estate listing photography, market-ready.

This Style Blueprint will be injected into every subsequent room transformation to ensure the entire renovation video looks cohesive.

Respond in JSON format:
{
  "styleOptions": [
    { "id": "string", "label": "string", "description": "string" }
  ],
  "styleIdentity": "string (the full Style Blueprint including all sections and the Final Prompt)"
}`;


// ─────────────────────────────────────────────────────────────────────────────
// 3. ROOM TRANSFORMATION PROMPT BUILDER
// Model: Nano Banana 2 (fal.ai)
// Trigger: Step 3 — agent hits Generate on each room tab
// Purpose: Builds the image generation prompt for each room using the locked
//          Style Identity. Backyard uses its own dedicated prompt (see #4).
// Usage: Call buildRoomTransformationPrompt(styleIdentity, sceneType)
// ─────────────────────────────────────────────────────────────────────────────

export const buildRoomTransformationPrompt = (styleIdentity, sceneType) => `Transform this image into a renovated version of the exact same ${sceneType} while preserving the identical room layout, dimensions, camera angle, perspective, ceiling height, window placement, doorways, and all fixed architectural features.

RENOVATION STYLE BLUEPRINT:
${styleIdentity}

TRANSFORMATION RULES:
- Apply only the Interior Language, Room-by-Room Translation, Materials & Palette, and Continuity Rules from the Style Blueprint above
- Update surfaces, finishes, materials, cabinetry, fixtures, flooring, and lighting only
- Do not change any structural element, layout, or architectural geometry
- Do not add or remove windows, walls, doors, or architectural features
- Lighting shifts to warm, natural, designer-quality illumination consistent with the blueprint
- Every finish decision must follow the Continuity Rules to stay cohesive with the full renovation

OUTPUT:
Photorealistic professional real estate listing photography. Natural light. High dynamic range. Crisp and market-ready. The result should look like the same ${sceneType} photographed after a professional renovation — identical space, elevated design.`;


// ─────────────────────────────────────────────────────────────────────────────
// 4. BACKYARD RENOVATION PROMPT
// Model: Nano Banana 2 (fal.ai)
// Trigger: Step 3 — when the Backyard room tab is active
// Purpose: Dedicated outdoor renovation prompt that overrides the Style Identity
//          for the backyard scene specifically. Handles landscaping, deck,
//          lighting, and atmosphere with Austin market-specific landscaping.
// ─────────────────────────────────────────────────────────────────────────────

export const BACKYARD_RENOVATION_PROMPT = `Transform the provided backyard photo into a renovated, professionally landscaped version of the exact same backyard.

IMPORTANT: Preserve the exact architecture and layout of the scene. Do not change the house structure, deck size, tree position, fence location, or camera perspective. The house and deck must remain identical to the original image.

LANDSCAPING UPGRADES:
Replace dry dirt with a lush green lawn covering most of the backyard. Add clean modern landscaping beds along the fence line and around the large tree using dark mulch and natural stone edging. Plant native Austin landscaping: agave, ornamental grasses, small yucca, drought-resistant shrubs.

TREE FEATURE:
Keep the large mature tree as the centerpiece of the yard. Create a circular mulch bed around the tree with decorative stone edging.

DECK AREA:
Stain deck wood a rich warm cedar tone. Add modern outdoor lounge furniture with neutral cushions. Include a small outdoor coffee table. Stage the grill area neatly.

BACKYARD FEATURES:
Install subtle pathway pavers leading to the deck. Clean and refresh the wooden fence. Add modern outdoor lighting along the fence and deck.

ATMOSPHERE:
Warm late-afternoon sunlight. Soft shadows from the tree branches. Inviting outdoor living space.

PHOTOGRAPHY STYLE:
Professional luxury real estate photography. Ultra photorealistic. Architectural landscape photography. High dynamic range. 8K realism.

FINAL GOAL:
The result should look like the same backyard after a professional landscaping renovation — turning the yard into a welcoming modern outdoor living space. Maintain the exact framing and perspective of the original image.`;


// ─────────────────────────────────────────────────────────────────────────────
// 5. RENOVATION ANIMATION SYSTEM PROMPT
// Model: Claude API (intermediate step — generates the Kling/Seedance prompt)
// Trigger: Step 4 — agent hits Generate Animation for each room
// Purpose: Claude receives the before and after frames and generates a
//          compact, Kling-ready renovation animation prompt (120–160 words).
//          This fires silently — the agent never sees this prompt.
// ─────────────────────────────────────────────────────────────────────────────

export const RENOVATION_ANIMATION_SYSTEM_PROMPT = `You are a specialized real estate renovation animation prompt engineer for Kling and Seedance video generation.

Your job is to analyze two images of the same real estate scene:
- Image 1 — Original property condition (starting frame)
- Image 2 — Renovated version (ending frame)

Both images share the exact same camera position, framing, and perspective.

Your task is to generate a video model-ready animation prompt that smoothly transforms the original scene into the renovated version through a realistic renovation-style transition.

CRITICAL LENGTH RULE:
The generated prompt must be compact and concise.
- Maximum 120–160 words
- Each phase: 1–2 short sentences
- Use clear construction actions
- Avoid unnecessary adjectives
- Include short sound effect cues
- Only describe visible upgrades

SCENE CLASSIFICATION:
Identify the scene type:
- Exterior: house exterior, front yard, backyard, pool, patio
- Interior: kitchen, living room, bedroom, bathroom, dining room, hallway

RENOVATION DIFFERENCE DETECTION:
Detect visible upgrades between the two images only.
Exterior: siding, windows, doors, lighting, driveway, landscaping
Interior: flooring, cabinets, counters, backsplash, paint, appliances, fixtures

RENOVATION ANIMATION LOGIC:
Convert upgrades into construction-style actions:
- surfaces repaint, flooring installs, cabinets assemble
- countertops slide in, tiles appear, fixtures install
- landscaping grows, lights switch on
Avoid magical morphing. Everything should look like real materials being installed.

CAMERA RULES (STRICT):
Camera must remain completely fixed.
Always include: Camera locked on a tripod. No camera movement. Maintain exact framing and perspective.
Never change: structure, layout, roofline, window placement, camera position.
Only materials and finishes change.

LIGHTING EVOLUTION:
Exterior: neutral daylight → warm polished daylight
Interior: neutral lighting → warm designer lighting

SOUND DESIGN:
Include short construction sound effects matching renovation actions:
hammering, drilling, wood cutting, tile placement, tools clanking, landscaping sounds, soft construction ambience.

OUTPUT FORMAT:
Always output one video model-ready prompt. Keep it compact and within the length rule.

Use this structure:

Use image 1 as the starting frame and image 2 as the ending frame.
Create a smooth renovation transformation where the space upgrades from the original condition into the renovated version.
Camera locked on a tripod. No camera movement. Maintain the exact same framing and perspective.

Renovation animation sequence:

Phase 1 — Initial upgrade
[brief renovation actions]

Phase 2 — Major construction
[brief renovation actions]

Phase 3 — Final reveal
[brief renovation actions]

Sound effects:
[short construction audio cues matching the phases]

Maintain the exact geometry, layout, and structure of the scene. No structural changes.
Lighting subtly improves during the renovation.
Style: photorealistic luxury real estate renovation transformation.`;


// ─────────────────────────────────────────────────────────────────────────────
// 6. MICRO DOLLY-IN MOTION PROMPTS
// Model: Kling / Seedance (fal.ai)
// Trigger: Step 4 animation generation (wired per scene type automatically)
//          and Step 5 closing shot
// Purpose: Scene-specific cinematic motion prompts for the video model.
//          Each uses a calibrated 6–12 inch dolly advance, locked geometry,
//          and subtle cloud drift. The correct prompt is auto-selected
//          based on the active room's scene type.
// ─────────────────────────────────────────────────────────────────────────────

export const DOLLY_PROMPTS = {

  hero: {
    label: "Front of Home — Exterior",
    prompt: `Micro Dolly-In toward the centered front entry door and porch surround, using the doorway, flanking architectural details, and entry steps as the primary visual anchor while the full facade and surrounding landscaping remain balanced on either side of the frame; the camera advances approximately 6–12 inches in real-world space directly toward the entrance, subtly increasing the prominence of the door panel, trim details, and porch elements while maintaining the complete width of the home within frame. Extremely slow, measured, stabilized movement distributed evenly across the entire duration of the clip with gentle slow-in and slow-out easing, simulating a precision slider push that enhances depth from the foreground lawn toward the entry without altering perspective or composition. Micro-Motion: soft, natural cloud drift across the visible sky with very low amplitude and gradual movement, remaining subtle and secondary to the camera motion. Structural Integrity: all architectural elements including siding, roofline, windows, shutters, porch railings, steps, shrubs, and surrounding structures remain perfectly static; vertical lines remain straight, horizons level, and geometry fully locked with no warping, bending, breathing surfaces, or object drift. Finish: 4K, HDR, photorealistic, stabilized slider shot.`,
  },

  interior: {
    label: "Interior View — Living / Dining / General",
    prompt: `Micro Dolly-In toward the large picture window or focal wall beyond the seating area, using the window frame or feature wall and any exterior view as the visual anchor while the coffee table and sofas remain in the foreground reference; the camera advances approximately 6–12 inches forward across the room, maintaining balanced framing between the primary seating pieces and the central coffee table while gradually increasing the prominence of the window, artwork, or architectural focal point. Extremely slow, measured, stabilized movement distributed evenly across the entire duration of the clip with gentle slow-in and slow-out easing, simulating a precision slider push that subtly enhances depth across the rug, coffee table, and seating area without altering perspective. Micro-Motion: subtle cloud drift visible through any windows with very low amplitude and slow natural movement, remaining secondary to the camera motion. Structural Integrity: all architectural elements including walls, ceiling, window frames, trim, furniture, flooring, and hallway structure remain perfectly static; vertical lines remain straight, horizons level, and geometry fully locked with no warping, bending, breathing walls, or object drift. Finish: 4K, HDR, photorealistic, stabilized slider shot.`,
  },

  bedroom: {
    label: "Interior View — Bedroom",
    prompt: `Micro Dolly-In toward the bed headboard and any centered artwork or window beyond it, using the headboard and surrounding wall as the primary visual anchor while the bedside tables and foot of the bed remain in the foreground reference; the camera advances approximately 6–12 inches forward across the bedroom floor plane, subtly increasing the prominence of the headboard detail, pillows, and wall treatment while maintaining balanced framing of the room width. Extremely slow, measured, stabilized movement distributed evenly across the entire duration of the clip with gentle slow-in and slow-out easing, simulating a precision slider push that enhances depth from the foot of the bed toward the headboard without altering perspective or composition. Micro-Motion: very subtle cloud drift visible through any windows with soft, low-amplitude movement, remaining secondary to the camera motion. Structural Integrity: all architectural elements including walls, ceiling, windows, trim, furniture, flooring, and closet structures remain perfectly static; vertical lines remain straight, horizons level, and geometry fully locked with no warping, bending, breathing surfaces, or object drift. Finish: 4K, HDR, photorealistic, stabilized slider shot.`,
  },

  kitchen: {
    label: "Interior View — Kitchen",
    prompt: `Micro Dolly-In toward the range, hood, and centered back-wall cabinetry as the primary visual anchor while the countertop edge and sink remain in the foreground reference; the camera advances approximately 6–12 inches forward across the kitchen floor plane, subtly increasing the prominence of the stove, backsplash, and cabinet detailing while maintaining balanced framing of the full kitchen width. Extremely slow, measured, stabilized movement distributed evenly across the entire duration of the clip with gentle slow-in and slow-out easing, simulating a precision slider push that enhances depth across the countertop edge, appliance faces, and cabinetry without altering perspective or composition. Micro-Motion: very subtle cloud drift visible through any windows with soft, natural, low-amplitude movement that remains secondary to the camera motion. Structural Integrity: all architectural elements including cabinetry, walls, ceiling, window frames, appliances, flooring, doorways, and trim remain perfectly static; vertical lines remain straight, horizons level, and geometry fully locked with no warping, bending, breathing surfaces, or object drift. Finish: 4K, HDR, photorealistic, stabilized slider shot.`,
  },

  backyard: {
    label: "Backyard — Exterior",
    prompt: `Micro Dolly-In toward the centered rear structure, patio, or landscape focal point, using the primary outdoor feature — whether a pergola, pool edge, fire pit, or garden centerpiece — as the visual anchor while the foreground lawn or deck surface remains in the lower frame reference; the camera advances approximately 6–12 inches forward across the outdoor space, subtly increasing the prominence of the focal structure and surrounding landscaping while maintaining balanced framing of the full yard width. Extremely slow, measured, stabilized movement distributed evenly across the entire duration of the clip with gentle slow-in and slow-out easing, simulating a precision slider push that enhances depth from the foreground surface toward the outdoor feature without altering perspective or composition. Micro-Motion: soft, natural cloud drift across the visible sky with very low amplitude and gradual movement, remaining subtle and secondary to the camera motion. Structural Integrity: all architectural and landscape elements including fencing, plantings, trees, structures, outdoor furniture, and surrounding features remain perfectly static; vertical lines remain straight, horizons level, and geometry fully locked with no warping, bending, breathing surfaces, or object drift. Finish: 4K, HDR, photorealistic, stabilized slider shot.`,
  },

  backyardOutro: {
    label: "Backyard Night — Closing Shot Outro",
    prompt: `Micro Dolly-In toward the centered rear structure, patio, or landscape focal point at night, using the illuminated outdoor feature and warm lighting as the primary visual anchor while the foreground deck or lawn surface remains in the lower frame reference; the camera advances approximately 6–12 inches forward across the outdoor space, subtly increasing the prominence of the lit focal structure and surrounding evening landscaping while maintaining balanced framing of the full yard width. Extremely slow, measured, stabilized movement distributed evenly across the entire 8-second duration of the clip with gentle slow-in and slow-out easing, simulating a precision slider push that enhances depth from the foreground surface toward the outdoor feature without altering perspective or composition. Micro-Motion: soft, natural star drift or subtle cloud movement across the visible night sky with very low amplitude, remaining secondary to the camera motion. Structural Integrity: all architectural and landscape elements including fencing, plantings, trees, structures, outdoor furniture, and surrounding features remain perfectly static; vertical lines remain straight, horizons level, and geometry fully locked. The agent contact card overlay fades in during the final 5 seconds. Finish: 4K, HDR, photorealistic, stabilized slider shot, 8 seconds total.`,
  },

};


// ─────────────────────────────────────────────────────────────────────────────
// PROMPT ROUTING HELPER
// Maps room IDs to the correct dolly prompt key
// Used in Step 4 to auto-select the correct motion prompt per scene
// ─────────────────────────────────────────────────────────────────────────────

export const getRoomPromptKey = (roomId) => {
  const map = {
    hero:     "hero",
    living:   "interior",
    bedroom:  "bedroom",
    kitchen:  "kitchen",
    backyard: "backyard",
  };
  return map[roomId] || "interior";
};


// ─────────────────────────────────────────────────────────────────────────────
// PROMPT ROUTING HELPER — IMAGE TRANSFORMATION
// Returns the correct image generation prompt for Step 3
// Backyard gets its dedicated prompt, all other rooms get the style identity
// ─────────────────────────────────────────────────────────────────────────────

export const getRoomImagePrompt = (roomId, styleIdentity, sceneLabel) => {
  if (roomId === "backyard") return BACKYARD_RENOVATION_PROMPT;
  return buildRoomTransformationPrompt(styleIdentity, sceneLabel);
};
