import { create } from 'zustand';
import { ROOMS } from '../constants/rooms';

export const useProjectStore = create((set, get) => ({
  projectId: null,
  address: '',
  step: 1,
  tutorialDone: localStorage.getItem('aria_tutorial_done') === 'true',

  // Step 1
  selectedPhotos: ['hero'],
  photoFiles: {},       // roomId → File object
  photoPreviewUrls: {}, // roomId → local object URL for preview
  photoConverting: {},  // roomId → boolean
  photoConverted: {},   // roomId → boolean
  convertedUrls: {},    // roomId → server URL

  // Step 2
  styleOptions: [],
  selectedStyle: null,
  styleIdentity: null,

  // Steps 3 & 4
  rooms: [],
  currentRoomIndex: 0,
  videoModel: 'kling',

  // Step 5
  agent: { name: '', phone: '', email: '', brokerage: '', headshot: null },
  outro: { nightImage: null, clip: null },

  // Step 6
  musicTrack: null,

  // ── Actions ────────────────────────────────────────────────────────────────
  setProjectId: (id) => set({ projectId: id }),
  setAddress: (address) => set({ address }),
  setStep: (step) => set({ step }),
  setCurrentRoomIndex: (i) => set({ currentRoomIndex: i }),
  setVideoModel: (m) => set({ videoModel: m }),
  setStyleOptions: (o) => set({ styleOptions: o }),
  setSelectedStyle: (s) => set({ selectedStyle: s }),
  setStyleIdentity: (i) => set({ styleIdentity: i }),
  setMusicTrack: (url) => set({ musicTrack: url }),
  setOutro: (data) => set((s) => ({ outro: { ...s.outro, ...data } })),
  setAgent: (data) => set((s) => ({ agent: { ...s.agent, ...data } })),

  completeTutorial: () => {
    localStorage.setItem('aria_tutorial_done', 'true');
    set({ tutorialDone: true });
  },

  togglePhoto: (roomId) => {
    const { selectedPhotos, photoFiles, photoPreviewUrls, photoConverting, photoConverted, convertedUrls } = get();
    if (roomId === 'hero') return;
    if (selectedPhotos.includes(roomId)) {
      const newFiles = { ...photoFiles };
      const newPreviews = { ...photoPreviewUrls };
      const newConverting = { ...photoConverting };
      const newConverted = { ...photoConverted };
      const newUrls = { ...convertedUrls };
      // Revoke the object URL to free memory
      if (newPreviews[roomId]) URL.revokeObjectURL(newPreviews[roomId]);
      delete newFiles[roomId]; delete newPreviews[roomId];
      delete newConverting[roomId]; delete newConverted[roomId]; delete newUrls[roomId];
      set({
        selectedPhotos: selectedPhotos.filter(p => p !== roomId),
        photoFiles: newFiles, photoPreviewUrls: newPreviews,
        photoConverting: newConverting, photoConverted: newConverted, convertedUrls: newUrls,
      });
    } else {
      if (selectedPhotos.length >= 5) return;
      set({ selectedPhotos: [...selectedPhotos, roomId] });
    }
  },

  setPhotoFile: (roomId, file) => {
    const previewUrl = URL.createObjectURL(file);
    set((s) => ({
      photoFiles: { ...s.photoFiles, [roomId]: file },
      photoPreviewUrls: { ...s.photoPreviewUrls, [roomId]: previewUrl },
    }));
  },

  setPhotoConverting: (roomId, bool) =>
    set((s) => ({ photoConverting: { ...s.photoConverting, [roomId]: bool } })),

  setPhotoConverted: (roomId, bool, url = null) =>
    set((s) => ({
      photoConverted: { ...s.photoConverted, [roomId]: bool },
      ...(url ? { convertedUrls: { ...s.convertedUrls, [roomId]: url } } : {}),
    })),

  updateRoom: (roomId, updates) =>
    set((s) => {
      const existing = s.rooms.find(r => r.id === roomId);
      if (existing) return { rooms: s.rooms.map(r => r.id === roomId ? { ...r, ...updates } : r) };
      return { rooms: [...s.rooms, { id: roomId, ...updates }] };
    }),

  getSelectedRooms: () => {
    const { selectedPhotos } = get();
    return ROOMS.filter(r => selectedPhotos.includes(r.id));
  },
}));
