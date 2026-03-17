import { useState } from 'react';
import { T } from '../../constants/theme';
import { TUTORIAL_SLIDES } from '../../constants/rooms';

export default function Tutorial({ onComplete }) {
  const [slide, setSlide] = useState(0);
  const s = TUTORIAL_SLIDES[slide];
  const isLast = slide === TUTORIAL_SLIDES.length - 1;

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column', color: T.text }}>
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${T.border}`, padding: '16px 28px', display: 'flex', alignItems: 'center', gap: 10, background: T.surface }}>
        <span style={{ fontSize: 12, letterSpacing: 4, color: T.gold, fontFamily: 'monospace', fontWeight: 700 }}>ARIA</span>
        <span style={{ color: T.border, fontSize: 16 }}>|</span>
        <span style={{ fontSize: 10, letterSpacing: 2, color: T.muted, fontFamily: 'monospace' }}>LISTING TRANSFORMATION VIDEO</span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ maxWidth: 460, width: '100%', textAlign: 'center' }} className="fade-in">
          {/* Dot indicators */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 36 }}>
            {TUTORIAL_SLIDES.map((_, i) => (
              <div key={i} style={{ width: i === slide ? 22 : 6, height: 6, borderRadius: 3, background: i === slide ? T.gold : T.border, transition: 'all 0.3s' }} />
            ))}
          </div>

          <div style={{ fontSize: 34, color: T.gold, marginBottom: 18 }}>{s.icon}</div>
          <h2 style={{ fontSize: 22, fontWeight: 400, marginBottom: 14, lineHeight: 1.3 }}>{s.heading}</h2>
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.9, fontFamily: 'monospace', marginBottom: 44 }}>{s.body}</p>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            {slide > 0 && (
              <button onClick={() => setSlide(s => s - 1)} style={{ background: T.surface, color: T.muted, border: `1px solid ${T.border}`, padding: '12px 22px', borderRadius: 5, fontSize: 10, fontFamily: 'monospace', letterSpacing: 2, cursor: 'pointer' }}>
                ← BACK
              </button>
            )}
            <button
              onClick={() => isLast ? onComplete() : setSlide(s => s + 1)}
              style={{ background: T.gold, color: T.bg, border: 'none', padding: '12px 30px', borderRadius: 5, fontSize: 10, fontFamily: 'monospace', letterSpacing: 2, cursor: 'pointer', fontWeight: 700 }}
            >
              {isLast ? 'START BUILDING →' : 'NEXT →'}
            </button>
          </div>

          {!isLast && (
            <button onClick={onComplete} style={{ background: 'none', border: 'none', color: T.dim, fontSize: 10, fontFamily: 'monospace', letterSpacing: 1, cursor: 'pointer', marginTop: 18, textDecoration: 'underline' }}>
              skip intro
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
