import { T, btn } from '../../constants/theme';

export default function WizardHeader({ onGuidePress }) {
  return (
    <div style={{ borderBottom: `1px solid ${T.border}`, padding: '13px 22px', display: 'flex', alignItems: 'center', gap: 10, background: T.surface, position: 'sticky', top: 0, zIndex: 10 }}>
      <span style={{ fontSize: 12, letterSpacing: 4, color: T.gold, fontFamily: 'monospace', fontWeight: 700 }}>ARIA</span>
      <span style={{ color: T.border }}>|</span>
      <span style={{ fontSize: 10, letterSpacing: 2, color: T.muted, fontFamily: 'monospace' }}>LISTING TRANSFORMATION VIDEO</span>
      <button onClick={onGuidePress} style={{ marginLeft: 'auto', ...btn(false, false), padding: '7px 13px', fontSize: '9px' }}>GUIDE ☰</button>
    </div>
  );
}
