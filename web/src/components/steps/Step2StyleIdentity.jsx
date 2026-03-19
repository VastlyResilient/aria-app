import { useState, useRef, useEffect } from 'react';
import { T, btn } from '../../constants/theme';
import { useProjectStore } from '../../store/projectStore';
import GuideBanner from '../wizard/GuideBanner';
import * as api from '../../services/api';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

// ── Pixel-forming canvas animation shown while preview is generating ──────────
function PixelCanvas({ label }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    const BLOCK = 8;
    const cols = Math.ceil(W / BLOCK);
    const rows = Math.ceil(H / BLOCK);
    const total = cols * rows;

    // Each block has a current brightness (0–1) and a target it eases toward
    const cur = new Float32Array(total);
    const tgt = new Float32Array(total);
    for (let i = 0; i < total; i++) {
      tgt[i] = Math.random() < 0.15 ? 0.7 + Math.random() * 0.3 : Math.random() * 0.35;
      cur[i] = Math.random() * 0.15;
    }

    let frame = 0;
    let scanY = 0;

    const draw = () => {
      frame++;
      scanY = (scanY + 1.2) % H;

      // Every 25 frames, flip a few targets to keep it alive
      if (frame % 25 === 0) {
        const n = Math.floor(total * 0.08);
        for (let k = 0; k < n; k++) {
          const i = Math.floor(Math.random() * total);
          tgt[i] = Math.random() < 0.18 ? 0.75 + Math.random() * 0.25 : Math.random() * 0.3;
        }
      }

      ctx.fillStyle = '#09090f';
      ctx.fillRect(0, 0, W, H);

      for (let i = 0; i < total; i++) {
        cur[i] += (tgt[i] - cur[i]) * 0.07;

        const col = i % cols;
        const row = Math.floor(i / cols);
        const px = col * BLOCK;
        const py = row * BLOCK;

        // Scan-line brightens blocks it passes through
        const dist = Math.abs((py + BLOCK / 2) - scanY);
        const boost = Math.max(0, 1 - dist / 28) * 0.65;
        const b = Math.min(1, cur[i] + boost);
        if (b < 0.04) continue;

        // Dark purple → dark gold → bright gold
        const r = b < 0.5 ? Math.round(b * 2 * 90) : Math.round(90 + (b - 0.5) * 2 * 142);
        const g = b < 0.5 ? Math.round(b * 2 * 55) : Math.round(55 + (b - 0.5) * 2 * 140);
        const bl = b < 0.5 ? Math.round(20 + b * 2 * 15) : Math.round(35 - (b - 0.5) * 2 * 25);

        ctx.fillStyle = `rgb(${r},${g},${bl})`;
        ctx.fillRect(px, py, BLOCK - 1, BLOCK - 1); // 1px gap = pixel grid look
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        width={480}
        height={220}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, textAlign: 'center' }}>
        <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#d4b93a', letterSpacing: 2 }}>
          RENDERING {label.toUpperCase()}...
        </span>
      </div>
    </div>
  );
}

// ── Preview box: pixel canvas stays until image is fully downloaded ───────────
// Canvas shows during fal.ai generation AND while browser downloads the image.
// onError fallback ensures we never stay stuck on black if the load fails.
function StylePreviewBox({ isLoading, previewUrl, label }) {
  const [imgReady, setImgReady] = useState(false);
  const showCanvas = isLoading || (!!previewUrl && !imgReady);

  return (
    <div style={{
      border: `1px solid ${T.border}`, borderTop: 'none',
      borderRadius: '0 0 6px 6px', overflow: 'hidden',
      background: '#09090f', height: 220, position: 'relative',
    }}>
      {showCanvas && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          <PixelCanvas label={label} />
        </div>
      )}
      {previewUrl && (
        <img
          src={previewUrl}
          alt={`${label} preview`}
          onLoad={() => setImgReady(true)}
          onError={() => setImgReady(true)}
          style={{
            position: 'absolute', inset: 0, zIndex: 2,
            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            opacity: imgReady ? 1 : 0,
            transition: 'opacity 0.6s ease',
          }}
        />
      )}
    </div>
  );
}

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
  const [previewLoading, setPreviewLoading] = useState({});
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
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: T.surface, border: `1px solid ${isSel ? T.gold : T.border}`, borderRadius: previewUrl || isLoading ? '6px 6px 0 0' : 6, padding: 14, cursor: 'pointer', transition: 'border-color 0.2s' }}
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
                  <StylePreviewBox isLoading={isLoading} previewUrl={previewUrl} label={opt.label} />
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
