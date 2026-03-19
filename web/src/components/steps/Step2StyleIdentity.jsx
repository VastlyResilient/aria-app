import { useState, useRef } from 'react';
import { T, btn } from '../../constants/theme';
import { useProjectStore } from '../../store/projectStore';
import GuideBanner from '../wizard/GuideBanner';
import * as api from '../../services/api';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export default function Step2StyleIdentity({ projectId, onNext }) {
  const {
    convertedUrls, address, styleOptions, selectedStyle, stylePreviews,
    setAddress, setStyleOptions, setSelectedStyle, setStyleIdentity, setStylePreview,
  } = useProjectStore();

  const [analyzing, setAnalyzing] = useState(false);
  const [locking, setLocking] = useState(false);
  const [locked, setLocked] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [previewLoading, setPreviewLoading] = useState({}); // styleId → bool
  const debounceRef = useRef(null);
  const heroUrl = convertedUrls['hero'];

  // ── Address autocomplete ──────────────────────────────────────────────────
  const handleAddressChange = (val) => {
    setAddress(val);
    setSuggestions([]);
    setShowDropdown(false);
    clearTimeout(debounceRef.current);
    if (val.length < 2) return;
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${NOMINATIM_URL}?q=${encodeURIComponent(val)}&format=json&addressdetails=1&countrycodes=us&limit=5`,
          { headers: { 'User-Agent': 'ARIA-App/1.0' } }
        );
        const data = await res.json();
        if (data.length) {
          setSuggestions(data.map(d => d.display_name));
          setShowDropdown(true);
        }
      } catch (_) {}
    }, 400);
  };

  const selectSuggestion = (s) => {
    setAddress(s);
    setSuggestions([]);
    setShowDropdown(false);
  };

  // ── Style analyze ─────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!address.trim() || !heroUrl) return;
    setAnalyzing(true);
    try {
      const res = await api.analyzeStyle(projectId, address.trim());
      setStyleOptions(res.styleOptions || []);
    } catch (err) { alert('Analysis failed: ' + err.message); }
    finally { setAnalyzing(false); }
  };

  // ── Style preview ─────────────────────────────────────────────────────────
  const handlePreview = async (opt) => {
    if (stylePreviews[opt.id] || previewLoading[opt.id]) return;
    setPreviewLoading(p => ({ ...p, [opt.id]: true }));
    try {
      const res = await api.previewStyle(projectId, opt.id, opt.label, opt.description);
      setStylePreview(opt.id, res.url);
    } catch (err) { alert('Preview failed: ' + err.message); }
    finally { setPreviewLoading(p => ({ ...p, [opt.id]: false })); }
  };

  // ── Style lock ────────────────────────────────────────────────────────────
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
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <input
          value={address}
          onChange={e => handleAddressChange(e.target.value)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          onFocus={() => suggestions.length && setShowDropdown(true)}
          placeholder="123 Main St, Austin TX 78701"
          disabled={analyzing || locked}
          style={{ width: '100%', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 5, padding: 12, fontSize: 13, fontFamily: 'monospace', color: T.text, outline: 'none', boxSizing: 'border-box' }}
        />
        {showDropdown && suggestions.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 5, zIndex: 100, boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
            {suggestions.map((s, i) => (
              <div
                key={i}
                onMouseDown={() => selectSuggestion(s)}
                style={{ padding: '10px 12px', fontSize: 12, fontFamily: 'monospace', color: T.text, cursor: 'pointer', borderBottom: i < suggestions.length - 1 ? `1px solid ${T.border}` : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = '#1a1a2e'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {s}
              </div>
            ))}
          </div>
        )}
      </div>

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
            const previewUrl = stylePreviews[opt.id];
            const isLoading = previewLoading[opt.id];
            return (
              <div key={opt.id} style={{ marginBottom: 12 }}>
                <div
                  onClick={() => setSelectedStyle(opt)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: T.surface, border: `1px solid ${isSel ? T.gold : T.border}`, borderRadius: 6, padding: 14, cursor: 'pointer', transition: 'border-color 0.2s' }}
                >
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${isSel ? T.gold : T.muted}`, background: isSel ? T.gold : 'transparent', flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: isSel ? T.gold : T.text, marginBottom: 4 }}>{opt.label}</div>
                    <div style={{ fontSize: 11, fontFamily: 'monospace', color: T.muted, lineHeight: 1.6, marginBottom: 10 }}>{opt.description}</div>
                    <button
                      onClick={e => { e.stopPropagation(); handlePreview(opt); }}
                      disabled={isLoading || !!previewUrl}
                      style={{ fontSize: 10, fontFamily: 'monospace', letterSpacing: 1, padding: '6px 12px', borderRadius: 4, border: `1px solid ${T.border}`, background: 'transparent', color: previewUrl ? T.green : T.muted, cursor: previewUrl ? 'default' : 'pointer' }}
                    >
                      {isLoading ? '⟳ GENERATING...' : previewUrl ? '✓ PREVIEW READY' : 'PREVIEW STYLE'}
                    </button>
                  </div>
                </div>
                {(previewUrl || isLoading) && (
                  <div style={{ border: `1px solid ${T.border}`, borderTop: 'none', borderRadius: '0 0 6px 6px', overflow: 'hidden', background: T.surface }}>
                    {isLoading && (
                      <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                        <div style={{ fontSize: 18 }}>⟳</div>
                        <div style={{ fontSize: 11, fontFamily: 'monospace', color: T.muted }}>Generating {opt.label} preview...</div>
                      </div>
                    )}
                    {previewUrl && (
                      <img src={previewUrl} alt={`${opt.label} preview`} style={{ width: '100%', maxHeight: 280, objectFit: 'cover', display: 'block' }} />
                    )}
                  </div>
                )}
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
