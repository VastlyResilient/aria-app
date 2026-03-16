import { useState } from "react";

// ── PROMPT SYSTEM ─────────────────────────────────────────────────────────────
const DOLLY_PROMPTS = {
  hero: {
    label: "Hero Shot — Front Exterior",
    prompt: `Micro Dolly-In toward the centered front entry door and porch surround, using the doorway, flanking architectural details, and entry steps as the primary visual anchor while the full facade and surrounding landscaping remain balanced on either side of the frame; the camera advances approximately 6–12 inches in real-world space directly toward the entrance, subtly increasing the prominence of the door panel, trim details, and porch elements while maintaining the complete width of the home within frame. Extremely slow, measured, stabilized movement distributed evenly across the entire duration of the clip with gentle slow-in and slow-out easing, simulating a precision slider push that enhances depth from the foreground lawn toward the entry without altering perspective or composition. Micro-Motion: soft, natural cloud drift across the visible sky with very low amplitude and gradual movement, remaining subtle and secondary to the camera motion. Structural Integrity: all architectural elements including siding, roofline, windows, shutters, porch railings, steps, shrubs, and surrounding structures remain perfectly static; vertical lines remain straight, horizons level, and geometry fully locked with no warping, bending, breathing surfaces, or object drift. Finish: 4K, HDR, photorealistic, stabilized slider shot.`,
  },
  living: {
    label: "Living Room — Interior",
    prompt: `Micro Dolly-In toward the large picture window or focal wall beyond the seating area, using the window frame or feature wall and any exterior view as the visual anchor while the coffee table and sofas remain in the foreground reference; the camera advances approximately 6–12 inches forward across the living room seating arrangement, maintaining balanced framing between the primary seating pieces and the central coffee table while gradually increasing the prominence of the window, artwork, or architectural focal point. Extremely slow, measured, stabilized movement distributed evenly across the entire duration of the clip with gentle slow-in and slow-out easing, simulating a precision slider push that subtly enhances depth across the rug, coffee table, and seating area without altering perspective. Micro-Motion: subtle cloud drift visible through any windows with very low amplitude and slow natural movement, remaining secondary to the camera motion. Structural Integrity: all architectural elements including walls, ceiling, window frames, trim, furniture, flooring, and hallway structure remain perfectly static; vertical lines remain straight, horizons level, and geometry fully locked with no warping, bending, breathing walls, or object drift. Finish: 4K, HDR, photorealistic, stabilized slider shot.`,
  },
  bedroom: {
    label: "Bedroom — Interior",
    prompt: `Micro Dolly-In toward the bed headboard and any centered artwork or window beyond it, using the headboard and surrounding wall as the primary visual anchor while the bedside tables and foot of the bed remain in the foreground reference; the camera advances approximately 6–12 inches forward across the bedroom floor plane, subtly increasing the prominence of the headboard detail, pillows, and wall treatment while maintaining balanced framing of the room width. Extremely slow, measured, stabilized movement distributed evenly across the entire duration of the clip with gentle slow-in and slow-out easing, simulating a precision slider push that enhances depth from the foot of the bed toward the headboard without altering perspective or composition. Micro-Motion: very subtle cloud drift visible through any windows with soft, low-amplitude movement, remaining secondary to the camera motion. Structural Integrity: all architectural elements including walls, ceiling, windows, trim, furniture, flooring, and closet structures remain perfectly static; vertical lines remain straight, horizons level, and geometry fully locked with no warping, bending, breathing surfaces, or object drift. Finish: 4K, HDR, photorealistic, stabilized slider shot.`,
  },
  kitchen: {
    label: "Kitchen — Interior",
    prompt: `Micro Dolly-In toward the range, hood, and centered back-wall cabinetry as the primary visual anchor while the countertop edge and sink remain in the foreground reference; the camera advances approximately 6–12 inches forward across the kitchen floor plane, subtly increasing the prominence of the stove, backsplash, and cabinet detailing while maintaining balanced framing of the full kitchen width. Extremely slow, measured, stabilized movement distributed evenly across the entire duration of the clip with gentle slow-in and slow-out easing, simulating a precision slider push that enhances depth across the countertop edge, appliance faces, and cabinetry without altering perspective or composition. Micro-Motion: very subtle cloud drift visible through any windows with soft, natural, low-amplitude movement that remains secondary to the camera motion. Structural Integrity: all architectural elements including cabinetry, walls, ceiling, window frames, appliances, flooring, doorways, and trim remain perfectly static; vertical lines remain straight, horizons level, and geometry fully locked with no warping, bending, breathing surfaces, or object drift. Finish: 4K, HDR, photorealistic, stabilized slider shot.`,
  },
  backyard: {
    label: "Backyard — Exterior",
    prompt: `Micro Dolly-In toward the centered rear structure, patio, or landscape focal point, using the primary outdoor feature — whether a pergola, pool edge, fire pit, or garden centerpiece — as the visual anchor while the foreground lawn or deck surface remains in the lower frame reference; the camera advances approximately 6–12 inches forward across the outdoor space, subtly increasing the prominence of the focal structure and surrounding landscaping while maintaining balanced framing of the full yard width. Extremely slow, measured, stabilized movement distributed evenly across the entire duration of the clip with gentle slow-in and slow-out easing, simulating a precision slider push that enhances depth from the foreground surface toward the outdoor feature without altering perspective or composition. Micro-Motion: soft, natural cloud drift across the visible sky with very low amplitude and gradual movement, remaining subtle and secondary to the camera motion. Structural Integrity: all architectural and landscape elements including fencing, plantings, trees, structures, outdoor furniture, and surrounding features remain perfectly static; vertical lines remain straight, horizons level, and geometry fully locked with no warping, bending, breathing surfaces, or object drift. Finish: 4K, HDR, photorealistic, stabilized slider shot.`,
  },
  dining: {
    label: "Dining Room — Interior",
    prompt: `Micro Dolly-In toward the centered dining table and any chandelier, artwork, or window beyond it, using the table centerpiece and overhead fixture as the primary visual anchor while the near chair backs remain in the foreground reference; the camera advances approximately 6–12 inches forward across the dining room floor plane, subtly increasing the prominence of the table surface, place settings, and wall treatment while maintaining balanced framing of the room width. Extremely slow, measured, stabilized movement distributed evenly across the entire duration of the clip with gentle slow-in and slow-out easing, simulating a precision slider push that enhances depth from the foreground chairs toward the far wall without altering perspective or composition. Micro-Motion: very subtle cloud drift visible through any windows with soft, low-amplitude movement, remaining secondary to the camera motion. Structural Integrity: all architectural elements including walls, ceiling, windows, trim, furniture, flooring, and any built-in cabinetry remain perfectly static; vertical lines remain straight, horizons level, and geometry fully locked with no warping, bending, breathing surfaces, or object drift. Finish: 4K, HDR, photorealistic, stabilized slider shot.`,
  },
};

// ── BACKYARD RENOVATION IMAGE PROMPT (Step 3 override) ────────────────────────
// Used exclusively when the backyard room is active in Step 3.
// Replaces the generic style identity prompt for this scene only.
const BACKYARD_RENOVATION_PROMPT = `Transform the provided backyard photo into a renovated, professionally landscaped version of the exact same backyard.

IMPORTANT: Preserve the exact architecture and layout of the scene. Do not change the house structure, deck size, tree position, fence location, or camera perspective. The house and deck must remain identical to the original image.

Landscaping: Replace dry dirt with a lush green lawn. Add modern landscaping beds along the fence line and around the large tree using dark mulch and natural stone edging. Plant native Austin landscaping: agave, ornamental grasses, small yucca, drought-resistant shrubs.

Tree Feature: Keep the large mature tree as the centerpiece. Create a circular mulch bed with decorative stone edging.

Deck Area: Stain deck wood a rich warm cedar tone. Add modern outdoor lounge furniture with neutral cushions, small outdoor coffee table, neatly staged grill area.

Backyard Features: Subtle pathway pavers leading to the deck. Clean and refresh the wooden fence. Modern outdoor lighting along the fence and deck.

Atmosphere: Warm late-afternoon sunlight. Soft shadows from tree branches. Inviting outdoor living space.

Style: Professional luxury real estate photography. Ultra photorealistic. Architectural landscape photography. High dynamic range. 8K realism.

Goal: Same backyard after a professional landscaping renovation. Maintain exact framing and perspective of the original image.`;

// ── DATA ───────────────────────────────────────────────────────────────────────
const steps = [
  {
    id: 1, label: "Select Photos", icon: "◈",
    guide: {
      what: "Pick up to 5 photos from the listing to include in the renovation video. The Front of Home shot is required and must be selected first.",
      why: "These are the scenes ARIA will transform. The Front of Home shot anchors the style identity for every other scene — it sets the tone for the entire video.",
      tip: "Include a mix of interior and exterior shots. Backyard is highly recommended as it becomes the closing scene.",
    }
  },
  {
    id: 2, label: "Style Identity", icon: "◉",
    guide: {
      what: "ARIA analyzes your Front of Home shot and property address to suggest renovation styles that match the home type and local market.",
      why: "The Style Identity is locked and applied to every scene so all views look like they belong to the same cohesive renovation — consistent palette, finishes, and design language.",
      tip: "Pick the style that matches what buyers in that market want, not your personal preference. Think resale, not taste.",
    }
  },
  {
    id: 3, label: "Transform Rooms", icon: "◐",
    guide: {
      what: "For each photo selected, ARIA generates 2 renovated versions using your locked style. Same room, same angle — upgraded finishes, landscaping, and design.",
      why: "Two versions give you a clear A/B choice without overwhelming you. The style identity keeps all rooms consistent across the video.",
      tip: "Look for natural lighting, accurate room proportions, and clean finishes. Choose the version that feels most realistic and market-ready.",
    }
  },
  {
    id: 4, label: "Animate", icon: "◑",
    guide: {
      what: "ARIA takes your before and after images and generates a precision micro dolly-in animation — a cinematic slider push that transitions from original to renovated.",
      why: "Each clip uses a calibrated 6–12 inch dolly advance with locked geometry and subtle cloud drift. 2 versions generated per scene so you pick the smoothest transition.",
      tip: "Watch both versions before choosing. Look for smooth structural transitions — avoid any that warp, bend, or flicker.",
    }
  },
  {
    id: 5, label: "Closing Shot", icon: "◎",
    guide: {
      what: "ARIA builds the branded outro — a cinematic night-scene push-in of the renovated backyard with the agent's contact information as a call to action.",
      why: "The outro is 8 seconds and anchors the viewer's last impression. Agent name, phone, and brokerage appear over a luxury dusk scene to drive direct inquiries.",
      tip: "Double-check the contact info before generating. This is the frame viewers will screenshot and save.",
    }
  },
  {
    id: 6, label: "Export", icon: "◆",
    guide: {
      what: "All clips and the music track are packaged and ready. Import into your editor in order and the video assembles in minutes.",
      why: "Each asset is labeled and sequenced. The full video runs 30–60 seconds. No advanced editing required.",
      tip: "Arrange clips in order on the timeline, drag the music track underneath, trim to taste, and export.",
    }
  },
];

const tutorialSlides = [
  { icon: "◈", heading: "What This Tool Does", body: "ARIA turns your existing listing photos into a cinematic renovation transformation video. No filming, no equipment, no production team. Just your photos." },
  { icon: "◉", heading: "How It Works", body: "You'll move through 6 guided steps. ARIA handles all the AI generation — you make the creative decisions. Pick your style, choose the best versions, and ARIA builds the video." },
  { icon: "◐", heading: "What You'll Need", body: "Up to 5 existing listing photos — Front of Home, up to 3 interior views, and the backyard. Plus the property address and the agent's contact info for the branded outro." },
  { icon: "◑", heading: "What You'll Get", body: "A 30–60 second cinematic property transformation video with luxury micro dolly-in animations, renovation reveals, a branded agent outro, and an AI-generated music track." },
];

const mockRooms = [
  { id: "hero",     label: "Front of Home",   promptKey: "hero",    tag: "Required",    src: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&q=80" },
  { id: "living",   label: "Interior View 1", promptKey: "living",  tag: null,          src: "https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=400&q=80" },
  { id: "bedroom",  label: "Interior View 2", promptKey: "bedroom", tag: null,          src: "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=400&q=80" },
  { id: "kitchen",  label: "Interior View 3", promptKey: "kitchen", tag: null,          src: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80" },
  { id: "backyard", label: "Backyard",        promptKey: "backyard",tag: "Recommended", src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
];

const styleOptions = [
  { id: "contemporary", label: "Austin Contemporary Flip",  desc: "Clean modernized take on classic Texas midcentury ranch" },
  { id: "ranch",        label: "Modern Ranch Refresh",       desc: "Updated rural warmth with clean lines and natural materials" },
  { id: "craftsman",    label: "Warm Texas Craftsman",       desc: "Rich wood tones, covered porches, handcrafted details" },
  { id: "desert",       label: "Desert Modern Minimal",      desc: "Earthy neutrals, flat rooflines, dramatic desert landscaping" },
  { id: "scandi",       label: "Scandinavian Ranch Hybrid",  desc: "Light woods, white walls, functional open-concept flow" },
];

// ── THEME ──────────────────────────────────────────────────────────────────────
const T = {
  gold: "#c9a96e", bg: "#090910", surface: "#0e0e18",
  border: "#1c1c2e", muted: "#6b6b8a", green: "#4a9a6a",
  text: "#e8e4dc", dim: "#3a3a5a",
};

const btn = (active, disabled) => ({
  background: disabled ? T.border : active ? T.gold : T.surface,
  color: disabled ? T.muted : active ? T.bg : T.muted,
  border: `1px solid ${disabled ? T.border : active ? T.gold : T.border}`,
  padding: "11px 22px", borderRadius: "5px", fontSize: "10px",
  fontFamily: "monospace", letterSpacing: "2px",
  cursor: disabled ? "not-allowed" : "pointer", fontWeight: active ? 700 : 400,
});

// ── COMPONENT ──────────────────────────────────────────────────────────────────
export default function ARIAWizard() {
  const [phase, setPhase]               = useState("tutorial");
  const [slide, setSlide]               = useState(0);
  const [step, setStep]                 = useState(1);
  const [panelOpen, setPanelOpen]       = useState(false);
  const [promptModal, setPromptModal]   = useState(null); // roomId or null
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const [selectedPhotos, setSelectedPhotos]   = useState(["hero"]);
  const [convertingPhotos, setConvertingPhotos] = useState({}); // roomId: true while converting
  const [convertedPhotos, setConvertedPhotos]   = useState({ hero: true }); // roomId: true when 16:9 ready
  const [headshot, setHeadshot]               = useState(null); // base64 preview URL
  const [selectedStyle, setSelectedStyle]     = useState(null);
  const [generatingStyle, setGeneratingStyle] = useState(false);
  const [styleGenerated, setStyleGenerated]   = useState(false);
  const [currentRoom, setCurrentRoom]         = useState(0);
  const [roomVersions, setRoomVersions]       = useState({});   // roomId: 1|2
  const [generatingRoom, setGeneratingRoom]   = useState(false);
  const [animVersions, setAnimVersions]       = useState({});   // roomId: 1|2
  const [animatingRoom, setAnimatingRoom]     = useState(false);
  const [animStage, setAnimStage]             = useState({});   // roomId: 'prompting'|'generating'
  const [videoModel, setVideoModel]           = useState("kling"); // kling | seedance

  const selectedRooms = mockRooms.filter(r => selectedPhotos.includes(r.id));
  const activeRoom    = selectedRooms[currentRoom];

  const togglePhoto = (id) => {
    if (id === "hero") return;
    if (selectedPhotos.includes(id)) {
      setSelectedPhotos(prev => prev.filter(p => p !== id));
      setConvertingPhotos(c => { const n = { ...c }; delete n[id]; return n; });
      setConvertedPhotos(c => { const n = { ...c }; delete n[id]; return n; });
    } else {
      if (selectedPhotos.length >= 5) return;
      setSelectedPhotos(prev => [...prev, id]);
      setConvertingPhotos(c => ({ ...c, [id]: true }));
      setTimeout(() => {
        setConvertingPhotos(c => { const n = { ...c }; delete n[id]; return n; });
        setConvertedPhotos(c => ({ ...c, [id]: true }));
      }, 1800);
    }
  };

  const handleGenerateStyle = () => {
    setGeneratingStyle(true);
    setTimeout(() => { setGeneratingStyle(false); setStyleGenerated(true); }, 2200);
  };

  const handleGenerateRoom = () => {
    setGeneratingRoom(true);
    const id = activeRoom?.id;
    setTimeout(() => { setGeneratingRoom(false); setRoomVersions(p => ({ ...p, [id]: 0 })); }, 2000);
  };

  const handleAnimate = () => {
    setAnimatingRoom(true);
    const id = activeRoom?.id;
    // Stage 1 — Claude silently generates the renovation animation prompt
    setAnimStage(p => ({ ...p, [id]: "prompting" }));
    setTimeout(() => {
      // Stage 2 — Prompt fires to Kling or Seedance
      setAnimStage(p => ({ ...p, [id]: "generating" }));
      setTimeout(() => {
        setAnimatingRoom(false);
        setAnimStage(p => { const n = { ...p }; delete n[id]; return n; });
        setAnimVersions(p => ({ ...p, [id]: 0 }));
      }, 2400);
    }, 1600);
  };

  const copyPrompt = (text) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const allRoomsTransformed = selectedRooms.every(r => roomVersions[r.id] !== undefined && roomVersions[r.id] !== null);
  const allRoomsAnimated    = selectedRooms.every(r => animVersions[r.id] !== undefined && animVersions[r.id] !== null);

  // ── TUTORIAL ────────────────────────────────────────────────────────────────
  if (phase === "tutorial") {
    const s = tutorialSlides[slide];
    const isLast = slide === tutorialSlides.length - 1;
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", flexDirection: "column", fontFamily: "Georgia, serif", color: T.text }}>
        <div style={{ borderBottom: `1px solid ${T.border}`, padding: "16px 28px", display: "flex", alignItems: "center", gap: "10px", background: T.surface }}>
          <span style={{ fontSize: "12px", letterSpacing: "4px", color: T.gold, fontFamily: "monospace", fontWeight: 700 }}>ARIA</span>
          <span style={{ color: T.border, fontSize: "16px" }}>|</span>
          <span style={{ fontSize: "10px", letterSpacing: "2px", color: T.muted, fontFamily: "monospace" }}>LISTING TRANSFORMATION VIDEO</span>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
          <div style={{ maxWidth: "460px", width: "100%", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginBottom: "36px" }}>
              {tutorialSlides.map((_, i) => (
                <div key={i} style={{ width: i === slide ? "22px" : "6px", height: "6px", borderRadius: "3px", background: i === slide ? T.gold : T.border, transition: "all 0.3s" }} />
              ))}
            </div>
            <div style={{ fontSize: "34px", color: T.gold, marginBottom: "18px" }}>{s.icon}</div>
            <h2 style={{ fontSize: "22px", fontWeight: 400, marginBottom: "14px", lineHeight: 1.3 }}>{s.heading}</h2>
            <p style={{ fontSize: "13px", color: T.muted, lineHeight: 1.9, fontFamily: "monospace", marginBottom: "44px" }}>{s.body}</p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              {slide > 0 && (
                <button onClick={() => setSlide(s => s - 1)} style={{ ...btn(false, false), padding: "12px 22px" }}>← BACK</button>
              )}
              <button onClick={() => isLast ? setPhase("wizard") : setSlide(s => s + 1)} style={{ background: T.gold, color: T.bg, border: "none", padding: "12px 30px", borderRadius: "5px", fontSize: "10px", fontFamily: "monospace", letterSpacing: "2px", cursor: "pointer", fontWeight: 700 }}>
                {isLast ? "START BUILDING →" : "NEXT →"}
              </button>
            </div>
            {!isLast && (
              <button onClick={() => setPhase("wizard")} style={{ background: "none", border: "none", color: T.dim, fontSize: "10px", fontFamily: "monospace", letterSpacing: "1px", cursor: "pointer", marginTop: "18px", textDecoration: "underline" }}>
                skip intro
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const stepData = steps[step - 1];

  // ── WIZARD ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "Georgia, serif", color: T.text, position: "relative" }}>

      {/* ── PROMPT MODAL ── */}
      {promptModal && (() => {
        const room = mockRooms.find(r => r.id === promptModal);
        const pd   = DOLLY_PROMPTS[room?.promptKey] || DOLLY_PROMPTS.hero;
        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div onClick={() => setPromptModal(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)" }} />
            <div style={{ position: "relative", background: "#0c0c18", border: `1px solid ${T.border}`, borderTop: `2px solid ${T.gold}`, borderRadius: "8px", padding: "24px", maxWidth: "600px", width: "90%", zIndex: 201 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <div style={{ fontSize: "9px", fontFamily: "monospace", color: T.gold, letterSpacing: "2px", marginBottom: "4px" }}>VIDEO MOTION PROMPT</div>
                  <div style={{ fontSize: "13px", color: T.text }}>{pd.label}</div>
                </div>
                <button onClick={() => setPromptModal(null)} style={{ background: "none", border: "none", color: T.muted, fontSize: "18px", cursor: "pointer" }}>✕</button>
              </div>
              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: "5px", padding: "14px 16px", marginBottom: "16px", maxHeight: "240px", overflowY: "auto" }}>
                <p style={{ fontSize: "11px", color: "#9a9ab0", fontFamily: "monospace", lineHeight: 1.8, margin: 0 }}>{pd.prompt}</p>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => copyPrompt(pd.prompt)} style={{ ...btn(true, false), flex: 1, textAlign: "center" }}>
                  {copiedPrompt ? "✓ COPIED" : "COPY PROMPT"}
                </button>
                <button onClick={() => setPromptModal(null)} style={{ ...btn(false, false), padding: "11px 18px" }}>CLOSE</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── SIDE GUIDE PANEL ── */}
      {panelOpen && <div onClick={() => setPanelOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 99 }} />}
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "290px", background: "#0b0b16", borderLeft: `1px solid ${T.border}`, transform: panelOpen ? "translateX(0)" : "translateX(100%)", transition: "transform 0.32s cubic-bezier(0.4,0,0.2,1)", zIndex: 100, display: "flex", flexDirection: "column", padding: "22px", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "26px" }}>
          <span style={{ fontSize: "10px", letterSpacing: "3px", color: T.gold, fontFamily: "monospace" }}>STEP GUIDE</span>
          <button onClick={() => setPanelOpen(false)} style={{ background: "none", border: "none", color: T.muted, fontSize: "17px", cursor: "pointer" }}>✕</button>
        </div>
        {steps.map(s => (
          <div key={s.id} style={{ marginBottom: "26px", opacity: s.id === step ? 1 : 0.38, transition: "opacity 0.3s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "9px" }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: s.id === step ? T.gold : T.border, color: s.id === step ? T.bg : T.muted, fontSize: "9px", fontFamily: "monospace", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.id}</div>
              <span style={{ fontSize: "10px", fontFamily: "monospace", letterSpacing: "1px", color: s.id === step ? T.gold : T.muted }}>{s.label.toUpperCase()}</span>
            </div>
            <div style={{ paddingLeft: "28px" }}>
              <p style={{ fontSize: "11px", color: "#9a9ab0", lineHeight: 1.7, marginBottom: "8px", fontFamily: "monospace" }}>{s.guide.what}</p>
              <div style={{ background: "#12121e", border: `1px solid ${T.border}`, borderRadius: "4px", padding: "9px 11px" }}>
                <div style={{ fontSize: "9px", color: T.gold, fontFamily: "monospace", letterSpacing: "1px", marginBottom: "3px" }}>💡 TIP</div>
                <p style={{ fontSize: "10px", color: T.muted, lineHeight: 1.6, fontFamily: "monospace", margin: 0 }}>{s.guide.tip}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── HEADER ── */}
      <div style={{ borderBottom: `1px solid ${T.border}`, padding: "13px 22px", display: "flex", alignItems: "center", gap: "10px", background: T.surface, position: "sticky", top: 0, zIndex: 10 }}>
        <span style={{ fontSize: "12px", letterSpacing: "4px", color: T.gold, fontFamily: "monospace", fontWeight: 700 }}>ARIA</span>
        <span style={{ color: T.border }}>|</span>
        <span style={{ fontSize: "10px", letterSpacing: "2px", color: T.muted, fontFamily: "monospace" }}>LISTING TRANSFORMATION VIDEO</span>
        <button onClick={() => setPanelOpen(true)} style={{ marginLeft: "auto", ...btn(false, false), padding: "7px 13px", fontSize: "9px" }}>GUIDE ☰</button>
      </div>

      {/* ── STEP PROGRESS ── */}
      <div style={{ padding: "16px 22px", display: "flex", alignItems: "center", overflowX: "auto", borderBottom: `1px solid ${T.border}`, background: T.surface, gap: 0 }}>
        {steps.map((s, i) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center" }}>
            <div onClick={() => s.id < step && setStep(s.id)} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: s.id < step ? "pointer" : "default", opacity: s.id > step ? 0.28 : 1 }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontFamily: "monospace", fontWeight: 700, background: s.id === step ? T.gold : s.id < step ? "#1a3a1a" : T.border, color: s.id === step ? T.bg : s.id < step ? T.green : "#4a4a6a", border: `1px solid ${s.id < step ? T.green : T.border}`, flexShrink: 0 }}>
                {s.id < step ? "✓" : s.id}
              </div>
              <span style={{ fontSize: "9px", letterSpacing: "1px", fontFamily: "monospace", color: s.id === step ? T.gold : s.id < step ? T.green : "#4a4a6a", whiteSpace: "nowrap" }}>{s.label.toUpperCase()}</span>
            </div>
            {i < steps.length - 1 && <div style={{ width: "18px", height: "1px", background: T.border, margin: "0 5px", flexShrink: 0 }} />}
          </div>
        ))}
      </div>

      {/* ── MAIN ── */}
      <div style={{ padding: "24px 22px", maxWidth: "800px" }}>

        {/* Inline Guide */}
        <div style={{ background: "#0c0c1a", border: `1px solid #1a1a2e`, borderLeft: `3px solid ${T.gold}`, borderRadius: "6px", padding: "14px 18px", marginBottom: "24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <div>
            <div style={{ fontSize: "9px", fontFamily: "monospace", color: T.gold, letterSpacing: "2px", marginBottom: "5px" }}>WHAT TO DO</div>
            <p style={{ fontSize: "11px", color: "#9a9ab0", fontFamily: "monospace", lineHeight: 1.7, margin: 0 }}>{stepData.guide.what}</p>
          </div>
          <div>
            <div style={{ fontSize: "9px", fontFamily: "monospace", color: T.green, letterSpacing: "2px", marginBottom: "5px" }}>WHY IT MATTERS</div>
            <p style={{ fontSize: "11px", color: "#9a9ab0", fontFamily: "monospace", lineHeight: 1.7, margin: 0 }}>{stepData.guide.why}</p>
          </div>
          <div style={{ gridColumn: "span 2", borderTop: `1px solid ${T.border}`, paddingTop: "10px", display: "flex", gap: "7px", alignItems: "flex-start" }}>
            <span style={{ fontSize: "12px" }}>💡</span>
            <p style={{ fontSize: "10px", color: T.muted, fontFamily: "monospace", lineHeight: 1.6, margin: 0 }}>{stepData.guide.tip}</p>
          </div>
        </div>

        {/* ── STEP 1: SELECT PHOTOS ── */}
        {step === 1 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 400, margin: 0 }}>Select Your Listing Photos</h2>
              <span style={{ fontSize: "10px", fontFamily: "monospace", color: selectedPhotos.length >= 5 ? T.gold : T.muted }}>
                {selectedPhotos.length} / 5 SELECTED
              </span>
            </div>

            {/* Upload instruction */}
            <div style={{ background: "#0e0e1c", border: `1px solid ${T.border}`, borderRadius: "6px", padding: "12px 16px", marginBottom: "18px", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ fontSize: "20px", flexShrink: 0 }}>📁</div>
              <div>
                <div style={{ fontSize: "10px", fontFamily: "monospace", color: T.gold, letterSpacing: "2px", marginBottom: "3px" }}>UPLOAD YOUR LISTING PHOTOS</div>
                <div style={{ fontSize: "11px", fontFamily: "monospace", color: T.muted, lineHeight: 1.6 }}>
                  Click any slot below to upload a photo from your device. Select up to 5 photos total — Front of Home is required. Each photo is automatically converted to 16:9 the moment it's uploaded.
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
              {mockRooms.map(room => {
                const sel       = selectedPhotos.includes(room.id);
                const maxed     = !sel && selectedPhotos.length >= 5;
                const converting = convertingPhotos[room.id];
                const converted  = convertedPhotos[room.id];
                return (
                  <div key={room.id} onClick={() => !maxed && !converting && togglePhoto(room.id)} style={{ border: sel ? `1.5px solid ${converting ? T.muted : converted ? T.gold : T.gold}` : `1.5px solid ${T.border}`, borderRadius: "7px", overflow: "hidden", cursor: room.id === "hero" || maxed || converting ? "default" : "pointer", background: T.surface, opacity: maxed ? 0.4 : 1, transition: "border-color 0.2s, opacity 0.2s" }}>
                    <div style={{ position: "relative", height: "110px" }}>
                      <img src={room.src} alt={room.label} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: sel ? 1 : 0.4, transition: "opacity 0.2s" }} />

                      {/* Converting overlay */}
                      {converting && (
                        <div style={{ position: "absolute", inset: 0, background: "rgba(9,9,16,0.75)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                          <div style={{ width: "18px", height: "18px", border: `2px solid ${T.gold}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                          <span style={{ fontSize: "8px", fontFamily: "monospace", color: T.gold, letterSpacing: "1px" }}>CONVERTING 16:9</span>
                        </div>
                      )}

                      {/* Converted badge */}
                      {converted && sel && !converting && (
                        <div style={{ position: "absolute", top: "8px", right: "8px", background: T.gold, borderRadius: "3px", padding: "2px 6px", fontSize: "7px", fontFamily: "monospace", color: T.bg, fontWeight: 700, letterSpacing: "1px" }}>16:9 ✓</div>
                      )}

                      {room.tag && (
                        <div style={{ position: "absolute", bottom: "8px", left: "8px", background: room.id === "hero" ? T.gold : "#1e3a1e", color: room.id === "hero" ? T.bg : T.green, fontSize: "8px", fontFamily: "monospace", letterSpacing: "1px", padding: "2px 6px", borderRadius: "3px" }}>{room.tag.toUpperCase()}</div>
                      )}
                    </div>
                    <div style={{ padding: "9px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "12px", color: sel ? T.text : "#4a4a6a" }}>{room.label}</span>
                      {converting && <span style={{ fontSize: "8px", fontFamily: "monospace", color: T.muted }}>processing...</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Conversion status bar */}
            {selectedPhotos.length > 0 && (
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "5px", padding: "10px 14px", marginBottom: "18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "9px", fontFamily: "monospace", color: T.muted, letterSpacing: "1px" }}>16:9 CONVERSION</span>
                  <div style={{ display: "flex", gap: "4px" }}>
                    {selectedPhotos.map(id => (
                      <div key={id} style={{ width: "6px", height: "6px", borderRadius: "50%", background: convertingPhotos[id] ? T.gold : convertedPhotos[id] ? T.green : T.border, transition: "background 0.3s" }} />
                    ))}
                  </div>
                </div>
                <span style={{ fontSize: "9px", fontFamily: "monospace", color: Object.keys(convertingPhotos).length > 0 ? T.gold : T.green }}>
                  {Object.keys(convertingPhotos).length > 0
                    ? `CONVERTING ${Object.keys(convertingPhotos).length} PHOTO${Object.keys(convertingPhotos).length > 1 ? "S" : ""}...`
                    : `${Object.keys(convertedPhotos).length} / ${selectedPhotos.length} READY`}
                </span>
              </div>
            )}

            {/* Spin animation */}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              {/* Block continue if any photo still converting */}
              <button
                onClick={() => setStep(2)}
                disabled={Object.keys(convertingPhotos).length > 0}
                style={{ background: Object.keys(convertingPhotos).length > 0 ? T.border : T.gold, color: Object.keys(convertingPhotos).length > 0 ? T.dim : T.bg, border: "none", padding: "12px 28px", borderRadius: "5px", fontSize: "10px", fontFamily: "monospace", letterSpacing: "2px", cursor: Object.keys(convertingPhotos).length > 0 ? "not-allowed" : "pointer", fontWeight: 700 }}
              >
                {Object.keys(convertingPhotos).length > 0 ? "CONVERTING..." : "CONTINUE →"}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: STYLE IDENTITY ── */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 400, marginBottom: "18px" }}>Generate Style Identity</h2>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "7px", padding: "16px", marginBottom: "18px", display: "flex", gap: "12px", alignItems: "center" }}>
              <img src={mockRooms[0].src} alt="hero" style={{ width: "80px", height: "56px", objectFit: "cover", borderRadius: "4px" }} />
              <div>
                <div style={{ fontSize: "9px", fontFamily: "monospace", color: T.muted, letterSpacing: "1px", marginBottom: "4px" }}>FRONT OF HOME + ADDRESS</div>
                <div style={{ fontSize: "13px", color: T.gold }}>6302 Wenston Dr, Austin TX 78723</div>
              </div>
              {!styleGenerated && (
                <button onClick={handleGenerateStyle} disabled={generatingStyle} style={{ marginLeft: "auto", ...btn(true, generatingStyle), whiteSpace: "nowrap" }}>
                  {generatingStyle ? "ANALYZING..." : "ANALYZE →"}
                </button>
              )}
            </div>
            {styleGenerated && (
              <div>
                <div style={{ fontSize: "9px", fontFamily: "monospace", color: T.green, letterSpacing: "2px", marginBottom: "12px" }}>✓ SELECT A STYLE TO CONTINUE</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "22px" }}>
                  {styleOptions.map(s => (
                    <div key={s.id} onClick={() => setSelectedStyle(s.id)} style={{ border: selectedStyle === s.id ? `1.5px solid ${T.gold}` : `1.5px solid ${T.border}`, borderRadius: "6px", padding: "12px 15px", cursor: "pointer", background: selectedStyle === s.id ? "#12121e" : T.surface, transition: "all 0.2s", display: "flex", alignItems: "center", gap: "11px" }}>
                      <div style={{ width: "14px", height: "14px", borderRadius: "50%", border: selectedStyle === s.id ? `4px solid ${T.gold}` : `2px solid ${T.border}`, flexShrink: 0, transition: "all 0.2s" }} />
                      <div>
                        <div style={{ fontSize: "13px", color: selectedStyle === s.id ? T.gold : T.text, marginBottom: "2px" }}>{s.label}</div>
                        <div style={{ fontSize: "11px", color: T.muted, fontFamily: "monospace" }}>{s.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={() => setStep(3)} disabled={!selectedStyle} style={{ background: selectedStyle ? T.gold : T.border, color: selectedStyle ? T.bg : T.dim, border: "none", padding: "12px 28px", borderRadius: "5px", fontSize: "10px", fontFamily: "monospace", letterSpacing: "2px", cursor: selectedStyle ? "pointer" : "not-allowed", fontWeight: 700 }}>LOCK STYLE →</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: TRANSFORM ROOMS ── */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 400, marginBottom: "18px" }}>Transform Each Room</h2>
            <div style={{ display: "flex", gap: "6px", marginBottom: "18px", flexWrap: "wrap" }}>
              {selectedRooms.map((room, i) => (
                <div key={room.id} onClick={() => setCurrentRoom(i)} style={{ padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "9px", fontFamily: "monospace", letterSpacing: "1px", background: currentRoom === i ? T.gold : T.surface, color: currentRoom === i ? T.bg : roomVersions[room.id] !== undefined ? T.green : T.muted, border: currentRoom === i ? "none" : `1px solid ${roomVersions[room.id] !== undefined ? T.green : T.border}`, fontWeight: currentRoom === i ? 700 : 400 }}>
                  {roomVersions[room.id] !== undefined ? "✓ " : ""}{room.label.toUpperCase()}
                </div>
              ))}
            </div>

            {activeRoom && (
              <div>
                {/* Before */}
                <div style={{ marginBottom: "14px" }}>
                  <div style={{ fontSize: "9px", fontFamily: "monospace", color: T.muted, letterSpacing: "2px", marginBottom: "7px" }}>ORIGINAL</div>
                  <img src={activeRoom.src} alt="orig" style={{ width: "100%", height: "180px", objectFit: "cover", borderRadius: "6px", border: `1px solid ${T.border}` }} />
                </div>

                {/* Prompt source indicator */}
                {activeRoom.id === "backyard" ? (
                  <div style={{ background: "#0c1a0c", border: `1px solid #2a4a2a`, borderLeft: `3px solid ${T.green}`, borderRadius: "5px", padding: "10px 14px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "14px" }}>🌿</span>
                    <div>
                      <div style={{ fontSize: "9px", fontFamily: "monospace", color: T.green, letterSpacing: "2px", marginBottom: "2px" }}>BACKYARD SPECIALIST PROMPT ACTIVE</div>
                      <div style={{ fontSize: "10px", fontFamily: "monospace", color: "#5a8a5a", lineHeight: 1.5 }}>
                        Using dedicated outdoor renovation logic — lush lawn, native Austin landscaping, cedar deck upgrade, pathway pavers, evening lighting, and warm late-afternoon atmosphere.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: "#0c0c1a", border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.gold}`, borderRadius: "5px", padding: "10px 14px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "14px" }}>◉</span>
                    <div>
                      <div style={{ fontSize: "9px", fontFamily: "monospace", color: T.gold, letterSpacing: "2px", marginBottom: "2px" }}>STYLE IDENTITY APPLIED</div>
                      <div style={{ fontSize: "10px", fontFamily: "monospace", color: T.muted, lineHeight: 1.5 }}>
                        Generating using your locked renovation style — consistent palette, finishes, and design language across all rooms.
                      </div>
                    </div>
                  </div>
                )}
                {roomVersions[activeRoom.id] !== undefined ? (
                  <div>
                    <div style={{ fontSize: "9px", fontFamily: "monospace", color: T.muted, letterSpacing: "2px", marginBottom: "9px" }}>SELECT BEST VERSION</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "18px" }}>
                      {[1, 2].map(v => (
                        <div key={v} onClick={() => setRoomVersions(p => ({ ...p, [activeRoom.id]: v }))} style={{ cursor: "pointer", border: roomVersions[activeRoom.id] === v ? `1.5px solid ${T.gold}` : `1.5px solid ${T.border}`, borderRadius: "6px", overflow: "hidden", transition: "border-color 0.2s" }}>
                          <div style={{ position: "relative", height: "130px" }}>
                            <img src={activeRoom.src} alt={`v${v}`} style={{ width: "100%", height: "100%", objectFit: "cover", filter: v === 1 ? "saturate(1.4) brightness(1.08) hue-rotate(12deg)" : "saturate(1.6) brightness(1.15) hue-rotate(25deg)" }} />
                            {roomVersions[activeRoom.id] === v && <div style={{ position: "absolute", top: "8px", right: "8px", background: T.gold, borderRadius: "50%", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: T.bg, fontWeight: 700 }}>✓</div>}
                          </div>
                          <div style={{ padding: "8px 12px", background: T.surface }}>
                            <span style={{ fontSize: "10px", fontFamily: "monospace", color: roomVersions[activeRoom.id] === v ? T.gold : T.muted }}>VERSION {v}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ marginBottom: "18px" }}>
                    <div style={{ fontSize: "9px", fontFamily: "monospace", color: T.muted, letterSpacing: "2px", marginBottom: "7px" }}>TRANSFORMED — 2 VERSIONS</div>
                    <div style={{ height: "130px", borderRadius: "6px", border: `1px dashed ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", background: T.surface }}>
                      <span style={{ fontSize: "11px", fontFamily: "monospace", color: T.dim }}>NOT YET GENERATED</span>
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button onClick={handleGenerateRoom} disabled={generatingRoom || roomVersions[activeRoom.id] !== undefined} style={btn(roomVersions[activeRoom.id] === undefined && !generatingRoom, generatingRoom || roomVersions[activeRoom.id] !== undefined)}>
                    {roomVersions[activeRoom.id] !== undefined ? "✓ GENERATED" : generatingRoom ? "GENERATING..." : "GENERATE 2 VERSIONS →"}
                  </button>
                  {allRoomsTransformed && typeof roomVersions[activeRoom.id] === 'number' && roomVersions[activeRoom.id] > 0 && (
                    <button onClick={() => { setCurrentRoom(0); setStep(4); }} style={{ background: T.gold, color: T.bg, border: "none", padding: "11px 22px", borderRadius: "5px", fontSize: "10px", fontFamily: "monospace", letterSpacing: "2px", cursor: "pointer", fontWeight: 700 }}>
                      ALL DONE → ANIMATE
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 4: ANIMATE ── */}
        {step === 4 && (
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 400, marginBottom: "6px" }}>Animate Each Transformation</h2>
            <p style={{ fontSize: "11px", fontFamily: "monospace", color: T.muted, marginBottom: "18px", lineHeight: 1.6 }}>
              ARIA analyzes your before and after frames, builds a renovation animation prompt, and fires it to your selected video model. Two versions are returned for you to choose from.
            </p>

            {/* Model selector — shown once at top, persists across all rooms */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "7px", padding: "14px 16px", marginBottom: "20px" }}>
              <div style={{ fontSize: "9px", fontFamily: "monospace", color: T.muted, letterSpacing: "2px", marginBottom: "12px" }}>VIDEO MODEL</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {[
                  { id: "kling",    label: "Kling",     sub: "Strong structural integrity, smooth material transitions" },
                  { id: "seedance", label: "Seedance",  sub: "High realism, cinematic motion, rich lighting" },
                ].map(m => (
                  <div
                    key={m.id}
                    onClick={() => setVideoModel(m.id)}
                    style={{ cursor: "pointer", border: videoModel === m.id ? `1.5px solid ${T.gold}` : `1px solid ${T.border}`, borderRadius: "6px", padding: "12px 14px", background: videoModel === m.id ? "#12121e" : T.bg, transition: "all 0.2s" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <div style={{ width: "12px", height: "12px", borderRadius: "50%", border: videoModel === m.id ? `4px solid ${T.gold}` : `2px solid ${T.border}`, flexShrink: 0, transition: "all 0.2s" }} />
                      <span style={{ fontSize: "13px", color: videoModel === m.id ? T.gold : T.text, fontWeight: videoModel === m.id ? 600 : 400 }}>{m.label}</span>
                    </div>
                    <p style={{ fontSize: "10px", fontFamily: "monospace", color: T.muted, margin: 0, paddingLeft: "20px", lineHeight: 1.5 }}>{m.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Room tabs */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "18px", flexWrap: "wrap" }}>
              {selectedRooms.map((room, i) => (
                <div key={room.id} onClick={() => setCurrentRoom(i)} style={{ padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "9px", fontFamily: "monospace", letterSpacing: "1px", background: currentRoom === i ? T.gold : T.surface, color: currentRoom === i ? T.bg : animVersions[room.id] !== undefined ? T.green : T.muted, border: currentRoom === i ? "none" : `1px solid ${animVersions[room.id] !== undefined ? T.green : T.border}`, fontWeight: currentRoom === i ? 700 : 400 }}>
                  {animVersions[room.id] !== undefined ? "✓ " : ""}{room.label.toUpperCase()}
                </div>
              ))}
            </div>

            {activeRoom && (
              <div>
                {/* Before → After frames */}
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "7px", padding: "16px", marginBottom: "16px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "12px", alignItems: "center", marginBottom: "16px" }}>
                    <div>
                      <div style={{ fontSize: "9px", fontFamily: "monospace", color: T.muted, letterSpacing: "2px", marginBottom: "6px" }}>START FRAME — ORIGINAL</div>
                      <img src={activeRoom.src} alt="start" style={{ width: "100%", height: "120px", objectFit: "cover", borderRadius: "5px", border: `1px solid ${T.border}` }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                      <div style={{ fontSize: "16px", color: T.gold }}>→</div>
                      <div style={{ fontSize: "8px", fontFamily: "monospace", color: T.dim, letterSpacing: "1px" }}>5 SEC</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "9px", fontFamily: "monospace", color: T.muted, letterSpacing: "2px", marginBottom: "6px" }}>END FRAME — RENOVATED</div>
                      <img src={activeRoom.src} alt="end" style={{ width: "100%", height: "120px", objectFit: "cover", borderRadius: "5px", border: `1.5px solid ${T.gold}`, filter: "saturate(1.5) brightness(1.1) hue-rotate(15deg)" }} />
                    </div>
                  </div>

                  {/* Silent two-stage generation status */}
                  {animStage[activeRoom.id] && (
                    <div style={{ background: "#0c0c1a", border: `1px solid ${T.border}`, borderRadius: "5px", padding: "12px 14px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "14px", height: "14px", border: `2px solid ${T.gold}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: "10px", fontFamily: "monospace", color: T.gold, letterSpacing: "1px" }}>
                          {animStage[activeRoom.id] === "prompting" ? "ANALYZING SCENE..." : `GENERATING WITH ${videoModel.toUpperCase()}...`}
                        </div>
                        <div style={{ fontSize: "9px", fontFamily: "monospace", color: T.muted, marginTop: "2px" }}>
                          {animStage[activeRoom.id] === "prompting"
                            ? "Detecting renovation upgrades and building animation sequence"
                            : "Rendering 2 versions of the transformation · 5 sec · 16:9"}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Version picker */}
                  {animVersions[activeRoom.id] !== undefined ? (
                    <div>
                      <div style={{ fontSize: "9px", fontFamily: "monospace", color: T.muted, letterSpacing: "2px", marginBottom: "9px" }}>SELECT BEST VERSION</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        {[1, 2].map(v => (
                          <div key={v} onClick={() => setAnimVersions(p => ({ ...p, [activeRoom.id]: v }))} style={{ cursor: "pointer", border: animVersions[activeRoom.id] === v ? `1.5px solid ${T.gold}` : `1px solid ${T.border}`, borderRadius: "5px", padding: "12px 14px", background: animVersions[activeRoom.id] === v ? "#12121e" : T.bg, transition: "all 0.2s", display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: T.surface, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", flexShrink: 0 }}>▶</div>
                            <div>
                              <div style={{ fontSize: "11px", color: animVersions[activeRoom.id] === v ? T.gold : T.text }}>Version {v}</div>
                              <div style={{ fontSize: "9px", fontFamily: "monospace", color: T.dim }}>{videoModel.charAt(0).toUpperCase() + videoModel.slice(1)} · 5 sec · 16:9</div>
                            </div>
                            {animVersions[activeRoom.id] === v && <div style={{ marginLeft: "auto", fontSize: "12px", color: T.gold }}>✓</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleAnimate}
                      disabled={animatingRoom}
                      style={{ width: "100%", ...btn(true, animatingRoom), textAlign: "center" }}
                    >
                      {animatingRoom ? "WORKING..." : `GENERATE WITH ${videoModel.toUpperCase()} →`}
                    </button>
                  )}
                </div>

                {allRoomsAnimated && typeof animVersions[activeRoom.id] === "number" && animVersions[activeRoom.id] > 0 && (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button onClick={() => setStep(5)} style={{ background: T.gold, color: T.bg, border: "none", padding: "11px 26px", borderRadius: "5px", fontSize: "10px", fontFamily: "monospace", letterSpacing: "2px", cursor: "pointer", fontWeight: 700 }}>
                      ALL ANIMATED → CLOSING SHOT
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 5: CLOSING SHOT ── */}
        {step === 5 && (
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 400, marginBottom: "18px" }}>Build the Closing Shot</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "20px" }}>
              {[
                { n: "01", label: "Renovated Backyard", sub: "Generated in Phase 3", done: true },
                { n: "02", label: "Night Scene Convert", sub: "Same comp, dusk lighting", done: true },
                { n: "03", label: "Contact Card + Dolly", sub: "Agent info · 8 sec push-in", done: false },
              ].map(s => (
                <div key={s.n} style={{ background: T.surface, border: `1px solid ${s.done ? "#3a6a3a" : T.border}`, borderRadius: "7px", padding: "13px" }}>
                  <div style={{ fontSize: "9px", fontFamily: "monospace", color: T.dim, letterSpacing: "2px", marginBottom: "6px" }}>STEP {s.n}</div>
                  <div style={{ fontSize: "12px", color: s.done ? T.text : T.muted, marginBottom: "4px" }}>{s.label}</div>
                  <div style={{ fontSize: "10px", fontFamily: "monospace", color: s.done ? T.green : T.dim }}>{s.done ? "✓ " : ""}{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Backyard prompt reference */}
            <div style={{ background: "#0c0c1a", border: `1px solid ${T.border}`, borderRadius: "6px", padding: "12px 16px", marginBottom: "18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "9px", fontFamily: "monospace", color: T.gold, letterSpacing: "2px", marginBottom: "3px" }}>OUTRO MOTION PROMPT</div>
                <div style={{ fontSize: "12px", color: "#9a9ab0", fontFamily: "monospace" }}>Backyard Night — Micro Dolly-In · 6–12in · 8 sec · 4K HDR</div>
              </div>
              <button onClick={() => setPromptModal("backyard")} style={{ ...btn(false, false), padding: "8px 14px", fontSize: "9px" }}>VIEW PROMPT</button>
            </div>

            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "7px", padding: "16px", marginBottom: "18px" }}>
              <div style={{ fontSize: "9px", fontFamily: "monospace", color: T.muted, letterSpacing: "1px", marginBottom: "16px" }}>AGENT CONTACT INFO</div>

              {/* Headshot upload + fields side by side */}
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "18px", alignItems: "start" }}>

                {/* Headshot uploader */}
                <div>
                  <div style={{ fontSize: "9px", fontFamily: "monospace", color: T.dim, letterSpacing: "1px", marginBottom: "6px" }}>HEADSHOT</div>
                  <label style={{ cursor: "pointer", display: "block" }}>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={e => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = ev => setHeadshot(ev.target.result);
                        reader.readAsDataURL(file);
                      }}
                    />
                    <div style={{
                      width: "100px", height: "100px", borderRadius: "50%",
                      border: headshot ? `2px solid ${T.gold}` : `2px dashed ${T.border}`,
                      background: "#12121e",
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center",
                      overflow: "hidden", transition: "border-color 0.2s",
                      position: "relative",
                    }}>
                      {headshot ? (
                        <>
                          <img src={headshot} alt="headshot" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <div style={{
                            position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            opacity: 0, transition: "opacity 0.2s",
                          }}
                            onMouseEnter={e => e.currentTarget.style.opacity = 1}
                            onMouseLeave={e => e.currentTarget.style.opacity = 0}
                          >
                            <span style={{ fontSize: "9px", fontFamily: "monospace", color: T.text, letterSpacing: "1px" }}>CHANGE</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: "22px", color: T.dim, marginBottom: "4px" }}>+</div>
                          <div style={{ fontSize: "8px", fontFamily: "monospace", color: T.dim, letterSpacing: "1px", textAlign: "center", lineHeight: 1.4 }}>UPLOAD<br/>PHOTO</div>
                        </>
                      )}
                    </div>
                  </label>
                  {headshot && (
                    <button
                      onClick={() => setHeadshot(null)}
                      style={{ background: "none", border: "none", color: T.dim, fontSize: "9px", fontFamily: "monospace", letterSpacing: "1px", cursor: "pointer", marginTop: "6px", width: "100px", textAlign: "center", textDecoration: "underline" }}
                    >
                      remove
                    </button>
                  )}
                </div>

                {/* Contact fields */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "9px" }}>
                  {[["Agent Name", "Joe Kairens"], ["Phone", "(512) 555-0182"], ["Email", "joe@austinrealty.com"], ["Brokerage", "Austin Realty Group"]].map(([label, val]) => (
                    <div key={label}>
                      <div style={{ fontSize: "9px", fontFamily: "monospace", color: T.dim, letterSpacing: "1px", marginBottom: "4px" }}>{label.toUpperCase()}</div>
                      <div style={{ background: "#12121e", border: `1px solid ${T.border}`, borderRadius: "4px", padding: "8px 11px", fontSize: "12px", color: T.gold }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Outro card preview — blurred backyard + agent overlay */}
              {headshot && (
                <div style={{ marginTop: "18px", borderTop: `1px solid ${T.border}`, paddingTop: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <div style={{ fontSize: "9px", fontFamily: "monospace", color: T.muted, letterSpacing: "1px" }}>ENDING SHOT PREVIEW — LAST 5 SECONDS</div>
                    <div style={{ fontSize: "9px", fontFamily: "monospace", color: T.dim, letterSpacing: "1px" }}>BLURRED BACKYARD + AGENT CARD</div>
                  </div>

                  {/* 16:9 preview container */}
                  <div style={{
                    position: "relative",
                    width: "100%",
                    paddingTop: "56.25%", // 16:9 ratio
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: `1px solid ${T.border}`,
                  }}>
                    {/* Blurred backyard background */}
                    <img
                      src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80"
                      alt="backyard"
                      style={{
                        position: "absolute", inset: 0,
                        width: "100%", height: "100%",
                        objectFit: "cover",
                        filter: "blur(12px) brightness(0.55) saturate(1.3)",
                        transform: "scale(1.05)", // prevent blur edge bleed
                      }}
                    />

                    {/* Dark gradient overlay for legibility */}
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.55) 100%)",
                    }} />

                    {/* Agent card centered */}
                    <div style={{
                      position: "absolute", inset: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <div style={{
                        background: "rgba(9,9,16,0.82)",
                        border: `1px solid rgba(201,169,110,0.4)`,
                        borderRadius: "10px",
                        padding: "18px 24px",
                        display: "flex", alignItems: "center", gap: "16px",
                        backdropFilter: "blur(8px)",
                        maxWidth: "75%",
                      }}>
                        <img
                          src={headshot}
                          alt="agent"
                          style={{
                            width: "56px", height: "56px",
                            borderRadius: "50%", objectFit: "cover",
                            border: `2px solid ${T.gold}`, flexShrink: 0,
                          }}
                        />
                        <div>
                          <div style={{ fontSize: "15px", color: T.text, marginBottom: "3px", fontWeight: 500 }}>Joe Kairens</div>
                          <div style={{ fontSize: "10px", fontFamily: "monospace", color: T.gold, marginBottom: "5px", letterSpacing: "1px" }}>Austin Realty Group</div>
                          <div style={{ fontSize: "10px", fontFamily: "monospace", color: "#9a9ab0" }}>(512) 555-0182</div>
                          <div style={{ fontSize: "10px", fontFamily: "monospace", color: "#9a9ab0" }}>joe@austinrealty.com</div>
                        </div>
                      </div>
                    </div>

                    {/* Duration badge */}
                    <div style={{
                      position: "absolute", bottom: "10px", right: "12px",
                      fontSize: "9px", fontFamily: "monospace", color: T.gold,
                      background: "rgba(9,9,16,0.75)", padding: "3px 8px",
                      borderRadius: "3px", letterSpacing: "1px",
                    }}>
                      5 SEC HOLD · 4K HDR
                    </div>
                  </div>
                  <div style={{ fontSize: "10px", fontFamily: "monospace", color: T.dim, marginTop: "8px", lineHeight: 1.5 }}>
                    The backyard animates for the first 3 seconds, then softly blurs into this contact card for the final 5 seconds.
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setStep(6)} style={{ background: T.gold, color: T.bg, border: "none", padding: "12px 28px", borderRadius: "5px", fontSize: "10px", fontFamily: "monospace", letterSpacing: "2px", cursor: "pointer", fontWeight: 700 }}>GENERATE OUTRO →</button>
            </div>
          </div>
        )}

        {/* ── STEP 6: EXPORT ── */}
        {step === 6 && (
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 400, marginBottom: "18px" }}>Export Asset Package</h2>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "7px", padding: "16px", marginBottom: "18px" }}>
              <div style={{ fontSize: "9px", fontFamily: "monospace", color: T.muted, letterSpacing: "2px", marginBottom: "14px" }}>6302 AUSTIN FLIP — ALL ASSETS READY</div>
              {[
                ["Exterior Transformation", "5 sec", "CLIP"],
                ["Living Room Transformation", "5 sec", "CLIP"],
                ["Bedroom Transformation", "5 sec", "CLIP"],
                ["Kitchen Transformation", "5 sec", "CLIP"],
                ["Backyard Day → Night", "5 sec", "CLIP"],
                ["Agent Outro — Joe Kairens", "8 sec", "CLIP"],
                ["Background Music Track", "60 sec", "AUDIO"],
              ].map(([label, dur, type], i, arr) => (
                <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: i < arr.length - 1 ? `1px solid #141420` : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "30px", height: "30px", borderRadius: "4px", background: type === "AUDIO" ? "#1a1a2a" : "#12121e", border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>
                      {type === "AUDIO" ? "♪" : "▶"}
                    </div>
                    <div>
                      <div style={{ fontSize: "12px", color: T.text }}>{label}</div>
                      <div style={{ fontSize: "9px", fontFamily: "monospace", color: T.dim }}>{dur} · {type}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: "8px", fontFamily: "monospace", color: T.green, letterSpacing: "1px", background: "#0a1a0a", padding: "3px 7px", borderRadius: "3px" }}>✓ READY</div>
                </div>
              ))}
            </div>
            <button style={{ width: "100%", background: T.gold, color: T.bg, border: "none", padding: "14px", borderRadius: "6px", fontSize: "11px", fontFamily: "monospace", letterSpacing: "3px", cursor: "pointer", fontWeight: 700 }}>
              DOWNLOAD ALL ASSETS
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
