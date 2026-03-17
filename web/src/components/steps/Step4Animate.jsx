import { useState, useCallback } from 'react';
import { T, btn } from '../../constants/theme';
import { ROOMS } from '../../constants/rooms';
import { useProjectStore } from '../../store/projectStore';
import GuideBanner from '../wizard/GuideBanner';
import * as api from '../../services/api';

const VIDEO_MODELS = [
  { id: 'kling', label: 'Kling', desc: 'Strong structural integrity, smooth material transitions' },
  { id: 'seedance', label: 'Seedance', desc: 'High realism, cinematic motion, rich lighting' },
];

export default function Step4Animate({ projectId, onNext }) {
  const { selectedPhotos, photoPreviewUrls, convertedUrls, rooms, currentRoomIndex, videoModel, setCurrentRoomIndex, setVideoModel, updateRoom } = useProjectStore();
  const [animatingId, setAnimatingId] = useState(null);
  const [animStage, setAnimStage] = useState(null);

  const selectedRooms = ROOMS.filter(r => selectedPhotos.includes(r.id));
  const activeRoom = selectedRooms[currentRoomIndex];
  const roomData = rooms.find(r => r.id === activeRoom?.id);
  const allAnimated = selectedRooms.every(r => rooms.find(x => x.id === r.id)?.selectedAnimation != null);

  const pollAnimate = useCallback((projectId, roomId) => {
    const iv = setInterval(async () => {
      try {
        const res = await api.checkAnimateStatus(projectId, roomId);
        if (res.status === 'completed') {
          clearInterval(iv); setAnimatingId(null); setAnimStage(null);
          updateRoom(roomId, { animation1: res.animation1Url, animation2: res.animation2Url });
        } else if (res.status === 'failed') {
          clearInterval(iv); setAnimatingId(null); setAnimStage(null);
          alert('Animation failed. Please try again.');
        }
      } catch (e) {}
    }, 5000);
  }, [updateRoom]);

  const handleAnimate = async () => {
    if (!activeRoom || animatingId) return;
    setAnimatingId(activeRoom.id);
    setAnimStage('analyzing');
    setTimeout(() => setAnimStage('generating'), 2500);
    try {
      await api.animateRoom(projectId, activeRoom.id);
      pollAnimate(projectId, activeRoom.id);
    } catch (err) { setAnimatingId(null); setAnimStage(null); alert(err.message); }
  };

  const handleSelectAnimation = async (v) => {
    try {
      await api.selectAnimation(projectId, activeRoom.id, v);
      updateRoom(activeRoom.id, { selectedAnimation: v });
    } catch (err) { alert('Could not save selection.'); }
  };

  const handleSetModel = async (id) => {
    setVideoModel(id);
    try { await api.setVideoModel(projectId, id); } catch (e) {}
  };

  if (!activeRoom) return null;
  const originalUrl = convertedUrls[activeRoom.id] || photoPreviewUrls[activeRoom.id];
  const renovatedUrl = roomData?.selectedVersion === 1 ? roomData?.version1 : roomData?.version2;
  const isAnimating = animatingId === activeRoom.id;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Model selector */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '14px 22px' }}>
        <div style={{ fontSize: 9, fontFamily: 'monospace', color: T.muted, letterSpacing: 2, marginBottom: 10 }}>VIDEO MODEL</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {VIDEO_MODELS.map(m => (
            <div key={m.id} onClick={() => handleSetModel(m.id)} style={{ flex: 1, display: 'flex', gap: 10, alignItems: 'flex-start', background: T.bg, border: `1px solid ${videoModel === m.id ? T.gold : T.border}`, borderRadius: 6, padding: 10, cursor: 'pointer' }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', border: `1.5px solid ${videoModel === m.id ? T.gold : T.muted}`, background: videoModel === m.id ? T.gold : 'transparent', flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 11, fontFamily: 'monospace', color: videoModel === m.id ? T.gold : T.text, marginBottom: 2 }}>{m.label}</div>
                <div style={{ fontSize: 9, fontFamily: 'monospace', color: T.muted, lineHeight: 1.4 }}>{m.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Room tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, background: T.surface, overflowX: 'auto' }}>
        {selectedRooms.map((room, i) => {
          const rd = rooms.find(x => x.id === room.id);
          const done = rd?.selectedAnimation != null;
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
        <GuideBanner step={4} />

        {/* Before / After */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 9, fontFamily: 'monospace', color: T.muted, letterSpacing: 2, marginBottom: 6 }}>START FRAME</div>
            {originalUrl ? <img src={originalUrl} style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 5, border: `1px solid ${T.border}` }} /> : <div style={{ height: 130, background: T.surface, borderRadius: 5, border: `1px solid ${T.border}` }} />}
          </div>
          <span style={{ fontSize: 20, color: T.gold }}>→</span>
          <div>
            <div style={{ fontSize: 9, fontFamily: 'monospace', color: T.muted, letterSpacing: 2, marginBottom: 6 }}>END FRAME</div>
            {renovatedUrl ? <img src={renovatedUrl} style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 5, border: `1px solid ${T.border}` }} /> : <div style={{ height: 130, background: T.surface, borderRadius: 5, border: `1px solid ${T.border}` }} />}
          </div>
        </div>

        {!roomData?.animation1 && (
          isAnimating ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {[
                { stage: 'analyzing', title: 'ANALYZING SCENE...', sub: 'Detecting renovation upgrades and building animation sequence' },
                { stage: 'generating', title: `GENERATING WITH ${videoModel.toUpperCase()}...`, sub: 'Rendering 2 versions of the transformation · 5 sec · 16:9' },
              ].map(card => {
                const isActive = animStage === card.stage;
                const isDone = card.stage === 'analyzing' && animStage === 'generating';
                return (
                  <div key={card.stage} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: T.surface, border: `1px solid ${isActive ? T.gold : T.border}`, borderRadius: 6, padding: 12 }}>
                    <div style={{ width: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 2 }}>
                      {isDone ? <span style={{ color: T.green }}>✓</span> : isActive ? <div className="spin" style={{ width: 14, height: 14, border: `2px solid ${T.gold}`, borderTopColor: 'transparent', borderRadius: '50%' }} /> : <div style={{ width: 14, height: 14, borderRadius: '50%', background: T.border }} />}
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontFamily: 'monospace', color: isActive ? T.gold : T.muted, letterSpacing: 1, marginBottom: 2 }}>{card.title}</div>
                      <div style={{ fontSize: 10, fontFamily: 'monospace', color: T.dim, lineHeight: 1.4 }}>{card.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <button onClick={handleAnimate} style={{ ...btn(true, false), width: '100%', textAlign: 'center', marginBottom: 24 }}>
              GENERATE WITH {videoModel.toUpperCase()} →
            </button>
          )
        )}

        {roomData?.animation1 && (
          <>
            <div style={{ fontSize: 9, fontFamily: 'monospace', color: T.muted, letterSpacing: 2, marginBottom: 12 }}>SELECT YOUR PREFERRED VERSION</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[1, 2].map(v => {
                const isSel = roomData.selectedAnimation === v;
                return (
                  <div key={v} onClick={() => handleSelectAnimation(v)} style={{ border: `1.5px solid ${isSel ? T.gold : T.border}`, borderRadius: 6, overflow: 'hidden', cursor: 'pointer', background: T.surface }}>
                    <div style={{ height: 110, background: T.border, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <span style={{ fontSize: 24, color: T.muted }}>▶</span>
                      <span style={{ fontSize: 9, fontFamily: 'monospace', color: T.muted }}>Version {v}</span>
                    </div>
                    <div style={{ padding: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 9, fontFamily: 'monospace', color: T.muted }}>{videoModel} · 5 sec · 16:9</span>
                      {isSel && <span style={{ fontSize: 8, fontFamily: 'monospace', color: T.bg, background: T.gold, borderRadius: 3, padding: '2px 6px', fontWeight: 700 }}>✓ SELECTED</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => updateRoom(activeRoom.id, { animation1: null, animation2: null, selectedAnimation: null })} style={{ ...btn(false, false), width: '100%', textAlign: 'center', marginBottom: 16 }}>↺ REGENERATE</button>
          </>
        )}

        {allAnimated && (
          <button onClick={() => { useProjectStore.getState().setStep(5); onNext(); }} style={{ ...btn(true, false), width: '100%', textAlign: 'center' }}>
            ALL ANIMATED → CLOSING SHOT
          </button>
        )}
      </div>
    </div>
  );
}
