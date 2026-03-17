import { T } from '../../constants/theme';
import { STEPS } from '../../constants/rooms';

export default function GuideBanner({ step }) {
  const stepData = STEPS.find(s => s.id === step);
  if (!stepData) return null;
  const { guide } = stepData;

  return (
    <div style={{ background: '#0c0c1a', border: `1px solid #1a1a2e`, borderLeft: `3px solid ${T.gold}`, borderRadius: 6, padding: '14px 18px', marginBottom: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <div>
        <div style={{ fontSize: 9, fontFamily: 'monospace', color: T.gold, letterSpacing: 2, marginBottom: 5 }}>WHAT TO DO</div>
        <p style={{ fontSize: 11, color: '#9a9ab0', fontFamily: 'monospace', lineHeight: 1.7, margin: 0 }}>{guide.what}</p>
      </div>
      <div>
        <div style={{ fontSize: 9, fontFamily: 'monospace', color: T.green, letterSpacing: 2, marginBottom: 5 }}>WHY IT MATTERS</div>
        <p style={{ fontSize: 11, color: '#9a9ab0', fontFamily: 'monospace', lineHeight: 1.7, margin: 0 }}>{guide.why}</p>
      </div>
      <div style={{ gridColumn: 'span 2', borderTop: `1px solid ${T.border}`, paddingTop: 10, display: 'flex', gap: 7, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 12 }}>💡</span>
        <p style={{ fontSize: 10, color: T.muted, fontFamily: 'monospace', lineHeight: 1.6, margin: 0 }}>{guide.tip}</p>
      </div>
    </div>
  );
}
