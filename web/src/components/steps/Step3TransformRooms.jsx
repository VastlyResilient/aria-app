import { useState, useCallback } from 'react';
import { T, btn } from '../../constants/theme';
import { ROOMS } from '../../constants/rooms';
import { useProjectStore } from '../../store/projectStore';
import GuideBanner from '../wizard/GuideBanner';
import * as api from '../../services/api';

export default function Step3TransformRooms({ projectId, onNext }) {
  const { selectedPhotos, photoPreviewUrls, convertedUrls, rooms, currentRoomIndex, setCurrentRoomIndex, updateRoom } = useProjectStore();
  const [generating, setGenerating] = useState(false);

  // Hero is never transformed — it's used only for the video intro
  const selectedRooms = ROOMS.filter(r => selectedPhotos.includes(r.id) && r.id !== 'hero');
  const activeRoom = selectedRooms[currentRoomIndex];
  const roomData = rooms.find(r => r.id === activeRoom?.id);
  const allTransformed = selectedRooms.every(r => rooms.find(x => x.id === r.id)?.selectedVersion != null);

  const pollTransform = useCallback((projectId, roomId) => {
    const iv = setInterval(async () => {
      try {
        const res = await api.checkTransformStatus(projectId, roomId);
        if (res.status === 'completed') {
          clearInterval(iv); setGenerating(false);
          updateRoom(roomId, { version1: res.version1Url, version2: res.version2Url });
        } else if (res.status === 'failed') {
          clearInterval(iv); setGenerating(false);
          alert('Generation failed. Please try again.');
        }
      } catch (e) {}
    }, 3000);
  }, [updateRoom]);

  const handleGenerate = async () => {
    if (!activeRoom || generating) return;
    setGenerating(true);
    try {
      await api.transformRoom(projectId, activeRoom.id);
      pollTransform(projectId, activeRoom.id);
    } catch (err) { setGenerating(false); alert(err.message); }
  };

  const handleSelect = async (v) => {
    try {
      await api.selectVersion(projectId, activeRoom.id, v);
      updateRoom(activeRoom.id, { selectedVersion: v });
    } catch (err) { alert('Could not save selection.'); }
  };

  if (!activeRoom) return null;
  const isBackyard = activeRoom.id === 'backyard';
  const originalUrl = convertedUrls[activeRoom.id] || photoPreviewUrls[activeRoom.id];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Room tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, background: T.surface, overflowX: 'auto' }}>
        {selectedRooms.map((room, i) => {
          const rd = rooms.find(x => x.id === room.id);
          const done = rd?.selectedVersion != null;
          const active = i === currentRoomIndex;
          return (
            <div key={room.id} onClick={() => setCurrentRoomIndex(i)} style={{ padding: '14px 18px', cursor: 'pointer', borderBottom: `2px solid ${active ? T.gold : 'transparent'}`, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 10, fontFamily: 'monospace', color: active ? T.gold : T.muted, letterSpacing: 1 }}>{room.label}</span>
              {done && <span style={{ fontSize: 10, color: T.green }}>✓</span>}
            </div>
          );
        })}
      </div>

      <div style={{ padding: '24px 22px', maxWidth: 800, overflowY: 'auto' }}>
        <GuideBanner step={3} />

        {originalUrl && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 9, fontFamily: 'monospace', color: T.muted, letterSpacing: 2, marginBottom: 8 }}>ORIGINAL PHOTO</div>
            <img src={originalUrl} alt="Original" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 6, border: `1px solid ${T.border}` }} />
          </div>
        )}

        {/* Prompt banner */}
        <div style={{ background: isBackyard ? '#0a1a0a' : '#1a1000', border: `1px solid ${isBackyard ? T.green : T.gold}`, borderRadius: 6, padding: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontFamily: 'monospace', color: isBackyard ? T.green : T.gold, fontWeight: 700, marginBottom: 4 }}>
            {isBackyard ? '🌿 BACKYARD SPECIALIST PROMPT ACTIVE' : '✦ STYLE IDENTITY APPLIED'}
          </div>
          <div style={{ fontSize: 10, fontFamily: 'monospace', color: T.muted, lineHeight: 1.5 }}>
            {isBackyard ? 'Professional landscaping renovation with Austin-market outdoor design logic.' : 'Your locked style identity will be applied to every surface and finish in this room.'}
          </div>
        </div>

        {!roomData?.version1 && (
          <button onClick={handleGenerate} disabled={generating} style={{ ...btn(!generating, generating), width: '100%', textAlign: 'center', marginBottom: 24 }}>
            {generating ? '⟳ GENERATING 2 VERSIONS...' : 'GENERATE 2 VERSIONS →'}
          </button>
        )}

        {roomData?.version1 && (
          <>
            <div style={{ fontSize: 9, fontFamily: 'monospace', color: T.muted, letterSpacing: 2, marginBottom: 12 }}>SELECT YOUR PREFERRED VERSION</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[1, 2].map(v => {
                const url = v === 1 ? roomData.version1 : roomData.version2;
                const isSel = roomData.selectedVersion === v;
                return (
                  <div key={v} onClick={() => handleSelect(v)} style={{ border: `1.5px solid ${isSel ? T.gold : T.border}`, borderRadius: 6, overflow: 'hidden', cursor: 'pointer', background: T.surface, position: 'relative' }}>
                    <img src={url} alt={`Version ${v}`} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                    {isSel && <div style={{ position: 'absolute', top: 6, right: 6, background: T.gold, borderRadius: 3, padding: '2px 6px' }}><span style={{ fontSize: 8, fontFamily: 'monospace', color: T.bg, fontWeight: 700 }}>✓ SELECTED</span></div>}
                    <div style={{ padding: 8 }}><span style={{ fontSize: 10, fontFamily: 'monospace', color: T.muted }}>Version {v}</span></div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => updateRoom(activeRoom.id, { version1: null, version2: null, selectedVersion: null })} style={{ ...btn(false, false), width: '100%', textAlign: 'center', marginBottom: 16 }}>↺ REGENERATE</button>

            {roomData?.selectedVersion && (
              currentRoomIndex < selectedRooms.length - 1
                ? <button onClick={() => setCurrentRoomIndex(currentRoomIndex + 1)} style={{ ...btn(true, false), width: '100%', textAlign: 'center' }}>
                    NEXT ROOM →
                  </button>
                : allTransformed && (
                  <button onClick={() => { useProjectStore.getState().setStep(4); onNext(); }} style={{ ...btn(true, false), width: '100%', textAlign: 'center' }}>
                    ALL DONE → ANIMATE
                  </button>
                )
            )}
          </>
        )}
      </div>
    </div>
  );
}
