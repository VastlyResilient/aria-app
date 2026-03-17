import { T } from '../../constants/theme';
import { STEPS } from '../../constants/rooms';

export default function SideGuidePanel({ isOpen, onClose, currentStep }) {
  return (
    <>
      {isOpen && <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 99 }} />}
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 290, background: '#0b0b16', borderLeft: `1px solid ${T.border}`, transform: isOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.32s cubic-bezier(0.4,0,0.2,1)', zIndex: 100, display: 'flex', flexDirection: 'column', padding: 22, overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 26 }}>
          <span style={{ fontSize: 10, letterSpacing: 3, color: T.gold, fontFamily: 'monospace' }}>STEP GUIDE</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.muted, fontSize: 17, cursor: 'pointer' }}>✕</button>
        </div>
        {STEPS.map(s => (
          <div key={s.id} style={{ marginBottom: 26, opacity: s.id === currentStep ? 1 : 0.38, transition: 'opacity 0.3s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: s.id === currentStep ? T.gold : T.border, color: s.id === currentStep ? T.bg : T.muted, fontSize: 9, fontFamily: 'monospace', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.id}</div>
              <span style={{ fontSize: 10, fontFamily: 'monospace', letterSpacing: 1, color: s.id === currentStep ? T.gold : T.muted }}>{s.label.toUpperCase()}</span>
            </div>
            <div style={{ paddingLeft: 28 }}>
              <p style={{ fontSize: 11, color: '#9a9ab0', lineHeight: 1.7, marginBottom: 8, fontFamily: 'monospace' }}>{s.guide.what}</p>
              <div style={{ background: '#12121e', border: `1px solid ${T.border}`, borderRadius: 4, padding: '9px 11px' }}>
                <div style={{ fontSize: 9, color: T.gold, fontFamily: 'monospace', letterSpacing: 1, marginBottom: 3 }}>💡 TIP</div>
                <p style={{ fontSize: 10, color: T.muted, lineHeight: 1.6, fontFamily: 'monospace', margin: 0 }}>{s.guide.tip}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
