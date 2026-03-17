export const ROOMS = [
  { id: 'hero',     label: 'Front of Home',   tag: 'Required',    required: true  },
  { id: 'living',   label: 'Interior View 1', tag: null,          required: false },
  { id: 'bedroom',  label: 'Interior View 2', tag: null,          required: false },
  { id: 'kitchen',  label: 'Interior View 3', tag: null,          required: false },
  { id: 'backyard', label: 'Backyard',        tag: 'Recommended', required: false },
];

export const STEPS = [
  {
    id: 1, label: 'Select Photos', icon: '◈',
    guide: {
      what: 'Pick up to 5 photos from the listing. The Front of Home shot is required and must be selected first.',
      why: 'These are the scenes ARIA will transform. The Front of Home anchors the style identity for every other scene.',
      tip: 'Include a mix of interior and exterior shots. Backyard is highly recommended as it becomes the closing scene.',
    },
  },
  {
    id: 2, label: 'Style Identity', icon: '◉',
    guide: {
      what: 'ARIA analyzes your Front of Home shot and property address to suggest renovation styles.',
      why: 'The Style Identity is locked and applied to every scene so all views look like one cohesive renovation.',
      tip: "Pick the style that matches what buyers in that market want, not your personal preference. Think resale, not taste.",
    },
  },
  {
    id: 3, label: 'Transform Rooms', icon: '◐',
    guide: {
      what: 'For each photo, ARIA generates 2 renovated versions using your locked style.',
      why: 'Two versions give you a clear A/B choice. The style identity keeps all rooms consistent across the video.',
      tip: 'Look for natural lighting, accurate room proportions, and clean finishes.',
    },
  },
  {
    id: 4, label: 'Animate', icon: '◑',
    guide: {
      what: 'ARIA generates a precision micro dolly-in animation for each room.',
      why: 'Each clip uses a calibrated 6–12 inch dolly advance with locked geometry and subtle cloud drift.',
      tip: 'Watch both versions before choosing. Avoid any that warp, bend, or flicker.',
    },
  },
  {
    id: 5, label: 'Closing Shot', icon: '◎',
    guide: {
      what: 'ARIA builds the branded outro — a night-scene backyard push-in with your agent contact info.',
      why: "The outro is 8 seconds and anchors the viewer's last impression with a call to action.",
      tip: 'Double-check the contact info before generating. This is the frame viewers will screenshot.',
    },
  },
  {
    id: 6, label: 'Export', icon: '◆',
    guide: {
      what: 'All clips and the music track are packaged and ready to import into your editor.',
      why: 'Each asset is labeled and sequenced. The full video runs 30–60 seconds.',
      tip: 'Arrange clips in order on the timeline, drag the music underneath, trim to taste, and export.',
    },
  },
];

export const TUTORIAL_SLIDES = [
  { icon: '◈', heading: 'What This Tool Does', body: 'ARIA turns your existing listing photos into a cinematic renovation transformation video. No filming, no equipment, no production team. Just your photos.' },
  { icon: '◉', heading: 'How It Works', body: "You'll move through 6 guided steps. ARIA handles all the AI generation — you make the creative decisions. Pick your style, choose the best versions, and ARIA builds the video." },
  { icon: '◐', heading: "What You'll Need", body: "Up to 5 existing listing photos — Front of Home, up to 3 interior views, and the backyard. Plus the property address and the agent's contact info for the branded outro." },
  { icon: '◑', heading: "What You'll Get", body: 'A 30–60 second cinematic property transformation video with luxury micro dolly-in animations, renovation reveals, a branded agent outro, and an AI-generated music track.' },
];
