import { T } from '../constants/theme';

export default function Landing({ onStart }) {
  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ padding: '18px 32px', borderBottom: `1px solid ${T.border}`, background: T.surface, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 13, letterSpacing: 5, color: T.gold, fontFamily: 'monospace', fontWeight: 700 }}>ARIA</span>
        <span style={{ color: T.border }}>|</span>
        <span style={{ fontSize: 10, letterSpacing: 2, color: T.muted, fontFamily: 'monospace' }}>AI PLATFORM FOR REAL ESTATE</span>
      </div>

      {/* Hero */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 10, fontFamily: 'monospace', color: T.gold, letterSpacing: 4, marginBottom: 20 }}>
          LISTING TRANSFORMATION VIDEO
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 400, lineHeight: 1.2, marginBottom: 20, maxWidth: 700, color: T.text }}>
          Turn listing photos into a cinematic renovation video
        </h1>
        <p style={{ fontSize: 14, color: T.muted, fontFamily: 'monospace', lineHeight: 1.9, marginBottom: 48, maxWidth: 520 }}>
          No filming. No production team. Just your existing photos.<br />
          ARIA transforms them into a luxury transformation video — in minutes.
        </p>

        {/* Feature pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 48 }}>
          {['6 Guided Steps', 'AI Renovation Imagery', 'Cinematic Animations', 'Branded Agent Outro', 'AI Music Track', 'Powered by Claude'].map(f => (
            <div key={f} style={{ border: `1px solid ${T.border}`, borderRadius: 20, padding: '6px 14px', fontSize: 10, fontFamily: 'monospace', color: T.muted, letterSpacing: 1 }}>
              {f}
            </div>
          ))}
        </div>

        <button
          onClick={onStart}
          style={{ background: T.gold, color: T.bg, border: 'none', padding: '16px 48px', borderRadius: 5, fontSize: 11, fontFamily: 'monospace', letterSpacing: 3, cursor: 'pointer', fontWeight: 700, transition: 'opacity 0.2s' }}
          onMouseOver={e => e.target.style.opacity = 0.85}
          onMouseOut={e => e.target.style.opacity = 1}
        >
          START BUILDING →
        </button>

        <p style={{ marginTop: 16, fontSize: 10, fontFamily: 'monospace', color: T.dim }}>
          Free · No sign-up required · Powered by Claude AI
        </p>
      </div>

      {/* How it works */}
      <div style={{ borderTop: `1px solid ${T.border}`, padding: '48px 32px', background: T.surface }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ fontSize: 9, fontFamily: 'monospace', color: T.muted, letterSpacing: 3, textAlign: 'center', marginBottom: 32 }}>HOW IT WORKS</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
            {[
              { n: '01', label: 'Upload Photos', desc: 'Add up to 5 listing photos. ARIA instantly converts each to cinematic 16:9.' },
              { n: '02', label: 'Lock Your Style', desc: 'Claude analyzes the property and suggests 5 renovation styles. You pick one.' },
              { n: '03', label: 'Transform Rooms', desc: 'ARIA generates 2 renovated versions per room. You choose the best.' },
              { n: '04', label: 'Animate', desc: 'Each scene gets a precision micro dolly-in transformation animation.' },
              { n: '05', label: 'Closing Shot', desc: 'A branded night-scene outro with your agent contact info.' },
              { n: '06', label: 'Export', desc: 'Download all clips + an AI-generated music track. Edit and post.' },
            ].map(s => (
              <div key={s.n} style={{ padding: 18 }}>
                <div style={{ fontSize: 22, fontFamily: 'monospace', color: T.dim, fontWeight: 700, marginBottom: 8 }}>{s.n}</div>
                <div style={{ fontSize: 12, color: T.text, marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 11, fontFamily: 'monospace', color: T.muted, lineHeight: 1.7 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${T.border}`, padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontFamily: 'monospace', color: T.dim }}>ARIA © 2026</span>
        <span style={{ fontSize: 10, fontFamily: 'monospace', color: T.dim }}>Powered by Claude · fal.ai · ElevenLabs</span>
      </div>
    </div>
  );
}
