import { useState, useEffect } from 'react';
import { T, btn } from '../../constants/theme';
import { useProjectStore } from '../../store/projectStore';
import GuideBanner from '../wizard/GuideBanner';
import * as api from '../../services/api';

export default function Step6Export({ projectId }) {
  const { musicTrack, setMusicTrack } = useProjectStore();
  const [assets, setAssets] = useState([]);
  const [allReady, setAllReady] = useState(false);
  const [generatingMusic, setGeneratingMusic] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAssets = async () => {
    try {
      const res = await api.getExportAssets(projectId);
      setAssets(res.assets || []);
      setAllReady(res.allReady || false);
    } catch (e) {}
    finally { setLoading(false); }
  };

  useEffect(() => { loadAssets(); }, [projectId]);

  const handleGenerateMusic = async () => {
    setGeneratingMusic(true);
    try {
      const res = await api.generateMusic(projectId);
      setMusicTrack(res.musicTrackUrl);
      await loadAssets();
    } catch (err) { alert(err.message); }
    finally { setGeneratingMusic(false); }
  };

  const handleDownloadAll = () => {
    assets.forEach(a => { if (a.url) window.open(a.url, '_blank'); });
  };

  const handleComplete = async () => {
    try { await api.completeProject(projectId); } catch (e) {}
    alert('Project complete! Import the assets into your editor in the order listed.');
  };

  const hasMusicAsset = assets.some(a => a.type === 'AUDIO');

  return (
    <div style={{ padding: '24px 22px', maxWidth: 800 }}>
      <GuideBanner step={6} />
      <h2 style={{ fontSize: 18, fontWeight: 400, marginBottom: 24, color: T.text }}>Your Video Assets Are Ready</h2>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: T.muted, fontFamily: 'monospace', fontSize: 11 }}>
          <div className="spin" style={{ width: 14, height: 14, border: `2px solid ${T.gold}`, borderTopColor: 'transparent', borderRadius: '50%' }} />
          Loading assets...
        </div>
      ) : (
        <>
          {/* Asset list */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, overflow: 'hidden', marginBottom: 20 }}>
            {assets.map((asset, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: i < assets.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                <div>
                  <div style={{ fontSize: 12, fontFamily: 'monospace', color: T.text, marginBottom: 3 }}>{asset.label}</div>
                  <div style={{ fontSize: 10, fontFamily: 'monospace', color: T.muted }}>{asset.duration} · {asset.type}</div>
                </div>
                <div style={{ background: '#0a1a0a', border: `1px solid ${T.green}`, borderRadius: 4, padding: '3px 8px' }}>
                  <span style={{ fontSize: 8, fontFamily: 'monospace', color: T.green, letterSpacing: 1 }}>✓ READY</span>
                </div>
              </div>
            ))}
            {assets.length === 0 && (
              <div style={{ padding: 20, textAlign: 'center', fontSize: 11, fontFamily: 'monospace', color: T.muted }}>No assets ready yet. Complete all steps first.</div>
            )}
          </div>

          {/* Generate music */}
          {!hasMusicAsset && (
            <button onClick={handleGenerateMusic} disabled={generatingMusic} style={{ ...btn(!generatingMusic, generatingMusic), width: '100%', textAlign: 'center', marginBottom: 12, background: 'transparent', color: generatingMusic ? T.muted : T.gold, border: `1px solid ${generatingMusic ? T.border : T.gold}` }}>
              {generatingMusic ? '⟳ GENERATING MUSIC TRACK...' : 'GENERATE MUSIC TRACK →'}
            </button>
          )}

          {/* Download */}
          <button onClick={handleDownloadAll} disabled={!allReady} style={{ ...btn(allReady, !allReady), width: '100%', textAlign: 'center', marginBottom: 20 }}>
            DOWNLOAD ALL ASSETS
          </button>

          {allReady && (
            <>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 14, marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontFamily: 'monospace', color: T.muted, lineHeight: 1.8, margin: 0 }}>
                  Import assets into your editor in the order listed above. Drag the music track underneath all clips, trim to taste, and export.
                </p>
              </div>
              <button onClick={handleComplete} style={{ width: '100%', textAlign: 'center', background: 'transparent', border: `1px solid ${T.green}`, color: T.green, padding: '11px 22px', borderRadius: 5, fontSize: 10, fontFamily: 'monospace', letterSpacing: 2, cursor: 'pointer' }}>
                MARK PROJECT COMPLETE ✓
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
