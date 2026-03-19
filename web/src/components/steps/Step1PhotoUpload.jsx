import { useRef, useCallback, useState, useEffect } from 'react';
import { T, btn } from '../../constants/theme';
import { ROOMS } from '../../constants/rooms';
import { useProjectStore } from '../../store/projectStore';
import GuideBanner from '../wizard/GuideBanner';
import * as api from '../../services/api';

const CONVERT_MESSAGES = [
  'Analyzing frame composition...',
  'Extending to cinematic 16:9...',
  'Calibrating property dimensions...',
  'Mapping architectural boundaries...',
  'Rendering exterior canvas...',
  'Finalizing cinematic crop...',
];

function PhotoCard({ room, previewUrl, isSelected, isConverting, isConverted, isMaxed, onPress }) {
  const [msgIndex, setMsgIndex] = useState(0);
  useEffect(() => {
    if (!isConverting) return;
    const iv = setInterval(() => setMsgIndex(i => (i + 1) % CONVERT_MESSAGES.length), 2500);
    return () => clearInterval(iv);
  }, [isConverting]);
  return (
    <div
      onClick={() => !isMaxed && !isConverting && onPress()}
      style={{ border: `1.5px solid ${isSelected ? (isConverting ? T.muted : T.gold) : T.border}`, borderRadius: 7, overflow: 'hidden', cursor: room.required || isMaxed || isConverting ? 'default' : 'pointer', background: T.surface, opacity: isMaxed ? 0.4 : 1, transition: 'border-color 0.2s, opacity 0.2s' }}
    >
      <div style={{ position: 'relative', height: 110 }}>
        {previewUrl
          ? <img src={previewUrl} alt={room.label} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isSelected ? 1 : 0.4 }} />
          : <div style={{ width: '100%', height: '100%', background: T.border, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 24, color: T.dim }}>+</span>
            </div>
        }

        {/* Converting overlay */}
        {isConverting && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(9,9,16,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 8 }}>
            <div className="spin" style={{ width: 16, height: 16, border: `2px solid ${T.gold}`, borderTopColor: 'transparent', borderRadius: '50%' }} />
            <span style={{ fontSize: 7, fontFamily: 'monospace', color: T.gold, letterSpacing: 1, textAlign: 'center', lineHeight: 1.4 }}>{CONVERT_MESSAGES[msgIndex]}</span>
          </div>
        )}

        {/* 16:9 done badge */}
        {isConverted && !isConverting && (
          <div style={{ position: 'absolute', top: 6, right: 6, background: T.gold, borderRadius: 3, padding: '2px 5px' }}>
            <span style={{ fontSize: 8, fontFamily: 'monospace', color: T.bg, fontWeight: 700 }}>16:9 ✓</span>
          </div>
        )}
      </div>

      <div style={{ padding: '7px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
        <span style={{ fontSize: 9, fontFamily: 'monospace', color: T.text }}>{room.label}</span>
        {room.tag && (
          <span style={{ fontSize: 7, fontFamily: 'monospace', color: T.muted, background: room.tag === 'Required' ? '#3a1a1a' : T.border, border: `1px solid ${room.tag === 'Required' ? '#6a2a2a' : T.border}`, borderRadius: 3, padding: '1px 4px', letterSpacing: 1 }}>
            {room.tag.toUpperCase()}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Step1PhotoUpload({ projectId, onNext }) {
  const {
    selectedPhotos, photoPreviewUrls, photoConverting, photoConverted,
    togglePhoto, setPhotoFile, setPhotoConverting, setPhotoConverted,
  } = useProjectStore();

  const fileInputRef = useRef(null);
  const pendingRoomRef = useRef(null);

  const allConverted = selectedPhotos.every(id => photoConverted[id] === true);
  const canContinue = allConverted && selectedPhotos.includes('hero') && photoConverted['hero'];

  const pollConversion = useCallback((requestId, roomId) => {
    const interval = setInterval(async () => {
      try {
        const res = await api.checkConvertStatus(requestId);
        if (res.status === 'completed' && res.result?.url) {
          clearInterval(interval);
          setPhotoConverting(roomId, false);
          setPhotoConverted(roomId, true, res.result.url);
        } else if (res.status === 'failed') {
          clearInterval(interval);
          setPhotoConverting(roomId, false);
          alert(`Conversion failed for ${roomId}. Please try again.`);
        }
      } catch (e) { /* keep polling */ }
    }, 3000);
  }, [setPhotoConverting, setPhotoConverted]);

  const handleFileChosen = useCallback(async (e) => {
    const file = e.target.files?.[0];
    const roomId = pendingRoomRef.current;
    if (!file || !roomId) return;
    e.target.value = '';

    if (!selectedPhotos.includes(roomId)) togglePhoto(roomId);
    setPhotoFile(roomId, file);
    setPhotoConverting(roomId, true);

    try {
      const res = await api.convertPhoto(projectId, roomId, file);
      if (res.url) {
        setPhotoConverting(roomId, false);
        setPhotoConverted(roomId, true, res.url);
      } else {
        pollConversion(res.requestId, roomId);
      }
    } catch (err) {
      setPhotoConverting(roomId, false);
      alert('Upload failed: ' + err.message);
    }
  }, [projectId, selectedPhotos, togglePhoto, setPhotoFile, setPhotoConverting, pollConversion]);

  const handleCardPress = (room) => {
    if (room.required && !photoPreviewUrls[room.id]) {
      pendingRoomRef.current = room.id;
      fileInputRef.current?.click();
      return;
    }
    if (selectedPhotos.includes(room.id)) {
      if (!room.required) togglePhoto(room.id);
      return;
    }
    if (selectedPhotos.length >= 5) return;
    pendingRoomRef.current = room.id;
    fileInputRef.current?.click();
  };

  return (
    <div style={{ padding: '24px 22px', maxWidth: 800 }}>
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChosen} />

      <GuideBanner step={1} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontSize: 18, fontWeight: 400, margin: 0 }}>Select Your Listing Photos</h2>
        <span style={{ fontSize: 10, fontFamily: 'monospace', color: selectedPhotos.length >= 5 ? T.gold : T.muted }}>{selectedPhotos.length} / 5 SELECTED</span>
      </div>

      {/* Upload banner */}
      <div style={{ background: '#0e0e1c', border: `1px solid ${T.border}`, borderRadius: 6, padding: '12px 16px', marginBottom: 18, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>📁</span>
        <div>
          <div style={{ fontSize: 10, fontFamily: 'monospace', color: T.gold, letterSpacing: 2, marginBottom: 3 }}>UPLOAD YOUR LISTING PHOTOS</div>
          <div style={{ fontSize: 11, fontFamily: 'monospace', color: T.muted, lineHeight: 1.6 }}>
            Click any slot to upload a photo. Front of Home is required. Each photo is automatically converted to 16:9 the moment it's uploaded.
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {ROOMS.map(room => (
          <PhotoCard
            key={room.id}
            room={room}
            previewUrl={photoPreviewUrls[room.id] || null}
            isSelected={selectedPhotos.includes(room.id)}
            isConverting={!!photoConverting[room.id]}
            isConverted={!!photoConverted[room.id]}
            isMaxed={!selectedPhotos.includes(room.id) && selectedPhotos.length >= 5}
            onPress={() => handleCardPress(room)}
          />
        ))}
      </div>

      {/* Status bar */}
      {selectedPhotos.length > 0 && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 12, marginBottom: 20 }}>
          <div style={{ fontSize: 9, fontFamily: 'monospace', color: T.muted, letterSpacing: 2, marginBottom: 10 }}>CONVERSION STATUS</div>
          <div style={{ display: 'flex', gap: 16 }}>
            {selectedPhotos.map(roomId => {
              const room = ROOMS.find(r => r.id === roomId);
              return (
                <div key={roomId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: photoConverting[roomId] ? T.gold : photoConverted[roomId] ? T.green : T.border }} />
                  <span style={{ fontSize: 8, fontFamily: 'monospace', color: T.muted }}>{room?.label.split(' ')[0]}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <button
        onClick={() => { useProjectStore.getState().setStep(2); onNext(); }}
        disabled={!canContinue}
        style={{ ...btn(canContinue, !canContinue), width: '100%', textAlign: 'center' }}
      >
        CONTINUE →
      </button>
    </div>
  );
}
