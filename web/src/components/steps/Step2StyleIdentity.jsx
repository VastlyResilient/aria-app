import { useState } from 'react';
import { T, btn } from '../../constants/theme';
import { useProjectStore } from '../../store/projectStore';
import GuideBanner from '../wizard/GuideBanner';
import * as api from '../../services/api';

export default function Step2StyleIdentity({ projectId, onNext }) {
  const { convertedUrls, address, styleOptions, selectedStyle, setAddress, setStyleOptions, setSelectedStyle, setStyleIdentity } = useProjectStore();
  const [analyzing, setAnalyzing] = useState(false);
  const [locking, setLocking] = useState(false);
  const [locked, setLocked] = useState(false);
  const heroUrl = convertedUrls['hero'];

  const handleAnalyze = async () => {
    if (!address.trim() || !heroUrl) return;
    setAnalyzing(true);
    try {
      const res = await api.analyzeStyle(projectId, address.trim());
      setStyleOptions(res.styleOptions || []);
    } catch (err) { alert('Analysis failed: ' + err.message); }
    finally { setAnalyzing(false); }
  };

  const handleLock = async () => {
    if (!selectedStyle) return;
    setLocking(true);
    try {
      const res = await api.lockStyle(projectId, selectedStyle.id, selectedStyle.label);
      setStyleIdentity(res.styleIdentity);
      setLocked(true);
      setTimeout(() => { useProjectStore.getState().setStep(3); onNext(); }, 700);
    } catch (err) { alert('Lock failed: ' + err.message); }
    finally { setLocking(false); }
  };

  return (
    <div style={{ padding: '24px 22px', maxWidth: 800 }}>
      <GuideBanner step={2} />
      <h2 style={{ fontSize: 18, fontWeight: 400, marginBottom: 20, color: T.text }}>Style Identity</h2>

      {heroUrl
        ? <img src={heroUrl} alt="Hero" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 6, border: `1px solid ${T.border}`, marginBottom: 20 }} />
        : <div style={{ height: 200, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: T.muted }}>Hero photo loading...</span>
          </div>
      }

      <div style={{ fontSize: 9, fontFamily: 'monospace', color: T.muted, letterSpacing: 2, marginBottom: 8 }}>PROPERTY ADDRESS</div>
      <input
        value={address}
        onChange={e => setAddress(e.target.value)}
        placeholder="123 Main St, Austin TX 78701"
        disabled={analyzing || locked}
        style={{ width: '100%', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 5, padding: 12, fontSize: 13, fontFamily: 'monospace', color: T.text, marginBottom: 16, outline: 'none', boxSizing: 'border-box' }}
      />

      {!styleOptions.length && (
        <button onClick={handleAnalyze} disabled={analyzing || !address.trim() || !heroUrl} style={{ ...btn(!analyzing && !!address.trim() && !!heroUrl, analyzing || !address.trim() || !heroUrl), width: '100%', textAlign: 'center', marginBottom: 24 }}>
          {analyzing ? '⟳ ANALYZING...' : 'ANALYZE →'}
        </button>
      )}

      {styleOptions.length > 0 && !locked && (
        <>
          <div style={{ fontSize: 9, fontFamily: 'monospace', color: T.muted, letterSpacing: 2, marginBottom: 12 }}>SELECT YOUR RENOVATION STYLE</div>
          {styleOptions.map(opt => {
            const isSel = selectedStyle?.id === opt.id;
            return (
              <div key={opt.id} onClick={() => setSelectedStyle(opt)} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: T.surface, border: `1px solid ${isSel ? T.gold : T.border}`, borderRadius: 6, padding: 14, marginBottom: 10, cursor: 'pointer', transition: 'border-color 0.2s' }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${isSel ? T.gold : T.muted}`, background: isSel ? T.gold : 'transparent', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 13, color: isSel ? T.gold : T.text, marginBottom: 4 }}>{opt.label}</div>
                  <div style={{ fontSize: 11, fontFamily: 'monospace', color: T.muted, lineHeight: 1.6 }}>{opt.description}</div>
                </div>
              </div>
            );
          })}
          <button onClick={handleLock} disabled={!selectedStyle || locking} style={{ ...btn(!!selectedStyle && !locking, !selectedStyle || locking), width: '100%', textAlign: 'center', marginTop: 8 }}>
            {locking ? '⟳ LOCKING...' : 'LOCK STYLE →'}
          </button>
        </>
      )}

      {locked && (
        <div style={{ background: '#0a1a0a', border: `1px solid ${T.green}`, borderRadius: 6, padding: 14, textAlign: 'center' }}>
          <span style={{ fontSize: 12, fontFamily: 'monospace', color: T.green }}>✓ STYLE LOCKED — {selectedStyle?.label}</span>
        </div>
      )}
    </div>
  );
}
