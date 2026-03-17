import { create } from 'zustand';

const initialState = {
  projectId: null,
  address: '',
  selectedPhotos: ['hero'],
  photoUris: {},        // roomId → local URI
  photoConverting: {},  // roomId → boolean
  photoConverted: {},   // roomId → boolean
  convertedUrls: {},    // roomId → server URL
  styleOptions: [],
  selectedStyle: null,  // { id, label, description }
  styleIdentity: null,
  rooms: [],            // array of room objects from project record
  videoModel: 'kling',
  currentRoomIndex: 0,
  agent: { name: '', phone: '', email: '', brokerage: '', headshot: null },
  outro: { nightImage: null, clip: null },
  musicTrack: null,
  step: 1,
};

export const useProjectStore = create((set, get) => ({
  ...initialState,

  setProjectId: (id) => set({ projectId: id }),
  setAddress: (address) => set({ address }),
  setStep: (step) => set({ step }),
  setCurrentRoomIndex: (index) => set({ currentRoomIndex: index }),
  setVideoModel: (model) => set({ videoModel: model }),
  setStyleOptions: (styleOptions) => set({ styleOptions }),
  setSelectedStyle: (selectedStyle) => set({ selectedStyle }),
  setStyleIdentity: (styleIdentity) => set({ styleIdentity }),
  setMusicTrack: (url) => set({ musicTrack: url }),
  setOutro: (data) => set((state) => ({ outro: { ...state.outro, ...data } })),
  setAgent: (data) => set((state) => ({ agent: { ...state.agent, ...data } })),

  togglePhoto: (roomId) => {
    const { selectedPhotos, photoUris, photoConverting, photoConverted, convertedUrls } = get();
    if (roomId === 'hero') return;
    if (selectedPhotos.includes(roomId)) {
      const newUris = { ...photoUris };
      const newConverting = { ...photoConverting };
      const newConverted = { ...photoConverted };
      const newUrls = { ...convertedUrls };
      delete newUris[roomId];
      delete newConverting[roomId];
      delete newConverted[roomId];
      delete newUrls[roomId];
      set({
        selectedPhotos: selectedPhotos.filter((p) => p !== roomId),
        photoUris: newUris,
        photoConverting: newConverting,
        photoConverted: newConverted,
        convertedUrls: newUrls,
      });
    } else {
      if (selectedPhotos.length >= 5) return;
      set({ selectedPhotos: [...selectedPhotos, roomId] });
    }
  },

  setPhotoUri: (roomId, uri) =>
    set((state) => ({ photoUris: { ...state.photoUris, [roomId]: uri } })),

  setPhotoConverting: (roomId, bool) =>
    set((state) => ({ photoConverting: { ...state.photoConverting, [roomId]: bool } })),

  setPhotoConverted: (roomId, bool, url = null) =>
    set((state) => ({
      photoConverted: { ...state.photoConverted, [roomId]: bool },
      convertedUrls: url ? { ...state.convertedUrls, [roomId]: url } : state.convertedUrls,
    })),

  updateRoom: (roomId, updates) =>
    set((state) => {
      const existing = state.rooms.find((r) => r.id === roomId);
      if (existing) {
        return {
          rooms: state.rooms.map((r) => (r.id === roomId ? { ...r, ...updates } : r)),
        };
      }
      return { rooms: [...state.rooms, { id: roomId, ...updates }] };
    }),

  getRoomById: (roomId) => get().rooms.find((r) => r.id === roomId) || null,

  getSelectedRooms: () => {
    const { selectedPhotos } = get();
    const { ROOMS } = require('../constants/rooms');
    return ROOMS.filter((r) => selectedPhotos.includes(r.id));
  },

  resetWizard: () => set(initialState),
}));
